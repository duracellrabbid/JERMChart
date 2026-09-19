import { describe, it, expect, beforeEach } from 'vitest';
import { useStructureStore } from '../../store/useStructureStore';
import { sampleTrustStructure } from '../../data/sampleStructure';
import { TrustStructureChart } from '../../types/structure';

describe('useStructureStore', () => {
  beforeEach(() => {
    useStructureStore.getState().resetToSample();
  });

  it('initializes with sample trust data', () => {
    const { entities, relationships, metadata } = useStructureStore.getState();
    expect(entities.length).toBe(5);
    expect(relationships.length).toBe(4);
    expect(metadata.chartTitle).toContain('Aurelius Dynasty Trust');
  });

  it('adds an entity and updates store', () => {
    useStructureStore.getState().addEntity({
      name: 'New Cayman SPV Ltd',
      type: 'Holding Company',
      jurisdiction: 'Cayman Islands',
      status: 'Active',
      directors: [],
    });

    const entities = useStructureStore.getState().entities;
    expect(entities.length).toBe(6);
    expect(entities[entities.length - 1].name).toBe('New Cayman SPV Ltd');
  });

  it('adds an entity with parentId and auto-creates ownership relationship', () => {
    const state = useStructureStore.getState();
    const parentId = state.entities[0].id;
    const child = state.addEntity(
      {
        name: 'Child Sub Ltd',
        type: 'Operating Company',
        jurisdiction: 'Singapore',
        status: 'Active',
        directors: [],
      },
      parentId,
      80
    );

    const { entities, relationships, selectedEntityId } = useStructureStore.getState();
    expect(entities.some((e) => e.id === child.id)).toBe(true);
    expect(selectedEntityId).toBe(child.id);

    const rel = relationships.find((r) => r.source === parentId && r.target === child.id);
    expect(rel).toBeDefined();
    expect(rel?.ownershipPercentage).toBe(80);
    expect(rel?.shareClass).toBe('Ordinary Shares');
  });

  it('updates an existing entity', () => {
    const targetId = 'entity-2';
    useStructureStore.getState().updateEntity(targetId, {
      name: 'Aurelius Global Holdings Inc',
      status: 'Nominee',
    });

    const entity = useStructureStore.getState().entities.find((e) => e.id === targetId);
    expect(entity?.name).toBe('Aurelius Global Holdings Inc');
    expect(entity?.status).toBe('Nominee');
  });

  it('deletes an entity and cascades to remove connected relationships', () => {
    const state = useStructureStore.getState();
    const deleteId = 'entity-2'; // source for 3 rels, target for 1 rel

    state.setSelectedEntityId(deleteId);
    expect(useStructureStore.getState().selectedEntityId).toBe(deleteId);

    state.deleteEntity(deleteId);

    const { entities, relationships, selectedEntityId } = useStructureStore.getState();
    expect(entities.some((e) => e.id === deleteId)).toBe(false);
    expect(relationships.some((r) => r.source === deleteId || r.target === deleteId)).toBe(false);
    expect(selectedEntityId).toBeNull();
  });

  it('adds an ownership relationship between entities', () => {
    const state = useStructureStore.getState();
    const parentId = state.entities[0].id;
    const child = state.addEntity({
      name: 'Direct SPV',
      type: 'Operating Company',
      jurisdiction: 'UK',
      status: 'Active',
      directors: [],
    });

    state.addRelationship({
      source: parentId,
      target: child.id,
      ownershipPercentage: 50,
      shareClass: 'Ordinary',
    });

    const rels = useStructureStore.getState().relationships;
    expect(rels.some((r) => r.source === parentId && r.target === child.id && r.ownershipPercentage === 50)).toBe(true);
  });

  it('prevents adding duplicate relationship between the same source and target', () => {
    const state = useStructureStore.getState();
    const initialCount = state.relationships.length;

    // entity-1 -> entity-2 already exists
    state.addRelationship({
      source: 'entity-1',
      target: 'entity-2',
      ownershipPercentage: 50,
    });

    expect(useStructureStore.getState().relationships.length).toBe(initialCount);
  });

  it('updates and deletes an ownership relationship', () => {
    const relId = 'rel-1-2';
    useStructureStore.getState().updateRelationship(relId, {
      ownershipPercentage: 90,
      shareClass: 'Preferred',
    });

    let rel = useStructureStore.getState().relationships.find((r) => r.id === relId);
    expect(rel?.ownershipPercentage).toBe(90);
    expect(rel?.shareClass).toBe('Preferred');

    useStructureStore.getState().deleteRelationship(relId);
    rel = useStructureStore.getState().relationships.find((r) => r.id === relId);
    expect(rel).toBeUndefined();
  });

  it('adds and removes directors on an entity', () => {
    const targetEntityId = 'entity-3';
    useStructureStore.getState().addDirector(targetEntityId, {
      name: 'Eleanor Sterling',
      isCorporate: false,
      isResident: true,
    });

    let entity = useStructureStore.getState().entities.find((e) => e.id === targetEntityId);
    const addedDir = entity?.directors.find((d) => d.name === 'Eleanor Sterling');
    expect(addedDir).toBeDefined();
    expect(addedDir?.id).toBeDefined();

    if (addedDir) {
      useStructureStore.getState().removeDirector(targetEntityId, addedDir.id);
      entity = useStructureStore.getState().entities.find((e) => e.id === targetEntityId);
      expect(entity?.directors.some((d) => d.id === addedDir.id)).toBe(false);
    }
  });

  it('spotlights and clears a director', () => {
    useStructureStore.getState().setHighlightedDirector('Julian Vance');
    expect(useStructureStore.getState().highlightedDirector).toBe('Julian Vance');

    useStructureStore.getState().setHighlightedDirector(null);
    expect(useStructureStore.getState().highlightedDirector).toBeNull();
  });

  it('updates metadata and sorting criteria', () => {
    useStructureStore.getState().setMetadata({ chartTitle: 'Updated Trust Title' });
    expect(useStructureStore.getState().metadata.chartTitle).toBe('Updated Trust Title');

    useStructureStore.getState().setSortCriteria('ownership');
    expect(useStructureStore.getState().sortCriteria).toBe('ownership');
  });

  it('loads a custom structure and resets to sample', () => {
    const customChart: TrustStructureChart = {
      metadata: {
        chartTitle: 'Custom Chart',
        effectiveDate: '2026-01-01',
        confidentialityNotice: 'Notice',
      },
      entities: [
        {
          id: 'custom-1',
          name: 'Custom Foundation',
          type: 'Foundation',
          jurisdiction: 'Liechtenstein',
          status: 'Active',
          directors: [],
        },
      ],
      relationships: [],
    };

    useStructureStore.getState().loadStructure(customChart);
    expect(useStructureStore.getState().metadata.chartTitle).toBe('Custom Chart');
    expect(useStructureStore.getState().entities.length).toBe(1);

    useStructureStore.getState().resetToSample();
    expect(useStructureStore.getState().entities.length).toBe(5);
    expect(useStructureStore.getState().metadata.chartTitle).toContain('Aurelius');
  });

  it('resets to sample with deep immutability using structuredClone', () => {
    const state = useStructureStore.getState();
    // Direct mutation attempt on nested object
    state.entities[0].directors.push({
      id: 'mutated-dir',
      name: 'Mutated Director',
      isCorporate: false,
      isResident: false,
    });

    state.resetToSample();
    const freshState = useStructureStore.getState();
    expect(freshState.entities[0].directors.some((d) => d.id === 'mutated-dir')).toBe(false);
    expect(sampleTrustStructure.entities[0].directors.some((d) => d.id === 'mutated-dir')).toBe(false);
  });

  it('clears canvas to an empty state with clearCanvas', () => {
    const state = useStructureStore.getState();
    expect(state.entities.length).toBeGreaterThan(0);

    state.clearCanvas();

    const cleared = useStructureStore.getState();
    expect(cleared.entities).toEqual([]);
    expect(cleared.relationships).toEqual([]);
    expect(cleared.selectedEntityId).toBeNull();
    expect(cleared.highlightedDirector).toBeNull();
    expect(cleared.metadata.chartTitle).toBe('New Trust Structure');
  });
});

