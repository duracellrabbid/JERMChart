import { describe, it, expect, beforeEach } from 'vitest';
import { useStructureStore } from '../../store/useStructureStore';
import { sampleTrustStructure } from '../../data/sampleStructure';
import { TrustStructureChart } from '../../types/structure';

describe('useStructureStore', () => {
  beforeEach(() => {
    useStructureStore.getState().resetToSample();
  });

  it('initializes with sample trust data including Bank and associated roles', () => {
    const { entities, relationships, metadata } = useStructureStore.getState();
    expect(entities.length).toBe(6);
    expect(relationships.length).toBe(5);
    expect(metadata.chartTitle).toContain('Aurelius Dynasty Trust');
    const bank = entities.find((e) => e.type === 'Bank');
    expect(bank).toBeDefined();
    expect(bank?.name).toBe('DBS Private Bank');
  });

  it('adds an entity and updates store', () => {
    useStructureStore.getState().addEntity({
      name: 'New Cayman SPV Ltd',
      type: 'Holding Company',
      jurisdiction: 'Cayman Islands',
      status: 'Active',
      associatedParties: [],
    });

    const entities = useStructureStore.getState().entities;
    expect(entities.length).toBe(7);
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
        associatedParties: [],
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
    const deleteId = 'entity-2';

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
      associatedParties: [],
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

    state.addRelationship({
      source: 'entity-1',
      target: 'entity-2',
      ownershipPercentage: 50,
    });

    expect(useStructureStore.getState().relationships.length).toBe(initialCount);
  });

  it('rejects self-loops where source and target are the same entity', () => {
    const store = useStructureStore.getState();
    const countBefore = store.relationships.length;

    store.addRelationship({
      source: 'entity-1',
      target: 'entity-1',
      ownershipPercentage: 100,
    });

    expect(useStructureStore.getState().relationships.length).toBe(countBefore);
  });

  it('rejects relationships with missing source or target', () => {
    const store = useStructureStore.getState();
    const countBefore = store.relationships.length;

    store.addRelationship({
      source: '',
      target: 'entity-1',
      ownershipPercentage: 50,
    });
    expect(useStructureStore.getState().relationships.length).toBe(countBefore);

    store.addRelationship({
      source: 'entity-1',
      target: '',
      ownershipPercentage: 50,
    });
    expect(useStructureStore.getState().relationships.length).toBe(countBefore);
  });

  it('rejects cycle-introducing relationships', () => {
    const store = useStructureStore.getState();
    // In sample structure: entity-1 -> entity-2 -> entity-3
    const countBefore = store.relationships.length;

    store.addRelationship({
      source: 'entity-3',
      target: 'entity-1',
      ownershipPercentage: 50,
    });

    expect(useStructureStore.getState().relationships.length).toBe(countBefore);
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

  it('adds and removes associated parties with specific roles on an entity', () => {
    const targetEntityId = 'entity-3';
    useStructureStore.getState().addAssociatedParty(targetEntityId, {
      name: 'Eleanor Sterling',
      role: 'Protector',
      isCorporate: false,
      isResident: true,
    });

    let entity = useStructureStore.getState().entities.find((e) => e.id === targetEntityId);
    const addedParty = entity?.associatedParties.find((p) => p.name === 'Eleanor Sterling');
    expect(addedParty).toBeDefined();
    expect(addedParty?.id).toBeDefined();
    expect(addedParty?.role).toBe('Protector');

    if (addedParty) {
      useStructureStore.getState().removeAssociatedParty(targetEntityId, addedParty.id);
      entity = useStructureStore.getState().entities.find((e) => e.id === targetEntityId);
      expect(entity?.associatedParties.some((p) => p.id === addedParty.id)).toBe(false);
    }
  });

  it('supports addDirector and removeDirector as convenience helpers', () => {
    const targetEntityId = 'entity-3';
    useStructureStore.getState().addDirector(targetEntityId, {
      name: 'Julian Director',
      role: 'Director',
      isCorporate: false,
    });

    let entity = useStructureStore.getState().entities.find((e) => e.id === targetEntityId);
    const added = entity?.associatedParties.find((p) => p.name === 'Julian Director');
    expect(added).toBeDefined();
    expect(added?.role).toBe('Director');

    if (added) {
      useStructureStore.getState().removeDirector(targetEntityId, added.id);
      entity = useStructureStore.getState().entities.find((e) => e.id === targetEntityId);
      expect(entity?.associatedParties.some((p) => p.id === added.id)).toBe(false);
    }

    // test addAssociatedParty on entity with undefined associatedParties and missing role
    const bareEntity = useStructureStore.getState().addEntity({
      id: 'bare-entity',
      name: 'Bare Entity',
      type: 'LLC',
      jurisdiction: 'Delaware',
      status: 'Active',
      associatedParties: undefined as any,
    });
    useStructureStore.setState({
      entities: useStructureStore.getState().entities.map((e) =>
        e.id === bareEntity.id ? { ...e, associatedParties: undefined as any } : e
      ),
    });
    useStructureStore.getState().addAssociatedParty(bareEntity.id, {
      name: 'Fallback Party',
      role: '' as any,
    });
    const retrievedBare = useStructureStore.getState().entities.find((e) => e.id === bareEntity.id);
    expect(retrievedBare?.associatedParties[0].role).toBe('Director');

    // test removeAssociatedParty on entity with undefined associatedParties
    useStructureStore.setState({
      entities: useStructureStore.getState().entities.map((e) =>
        e.id === bareEntity.id ? { ...e, associatedParties: undefined as any } : e
      ),
    });
    useStructureStore.getState().removeAssociatedParty(bareEntity.id, 'some-id');

    // test addDirector without role
    useStructureStore.getState().addDirector(bareEntity.id, {
      name: 'Director Without Role',
      role: '' as any,
    });
    const finalBare = useStructureStore.getState().entities.find((e) => e.id === bareEntity.id);
    expect(finalBare?.associatedParties[0].role).toBe('Director');
  });

  it('spotlights and clears an associated party / director', () => {
    useStructureStore.getState().setHighlightedParty('Helena Sterling');
    expect(useStructureStore.getState().highlightedParty).toBe('Helena Sterling');
    expect(useStructureStore.getState().highlightedDirector).toBe('Helena Sterling');

    useStructureStore.getState().setHighlightedParty(null);
    expect(useStructureStore.getState().highlightedParty).toBeNull();
    expect(useStructureStore.getState().highlightedDirector).toBeNull();

    useStructureStore.getState().setHighlightedDirector('Marcus Aurelius');
    expect(useStructureStore.getState().highlightedParty).toBe('Marcus Aurelius');
    expect(useStructureStore.getState().highlightedDirector).toBe('Marcus Aurelius');
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
          associatedParties: [],
        },
      ],
      relationships: [],
    };

    useStructureStore.getState().loadStructure(customChart);
    expect(useStructureStore.getState().metadata.chartTitle).toBe('Custom Chart');
    expect(useStructureStore.getState().entities.length).toBe(1);

    // Also load chart with stagedNodes present
    useStructureStore.getState().loadStructure({
      ...customChart,
      stagedNodes: [{ id: 'staged-load', kind: 'person', name: 'Loaded Person', position: { x: 0, y: 0 } }],
    });
    expect(useStructureStore.getState().stagedNodes.length).toBe(1);

    useStructureStore.getState().resetToSample();
    expect(useStructureStore.getState().entities.length).toBe(6);
    expect(useStructureStore.getState().metadata.chartTitle).toContain('Aurelius');
  });

  it('resets to sample with deep immutability using structuredClone', () => {
    const state = useStructureStore.getState();
    state.entities[0].associatedParties.push({
      id: 'mutated-party',
      name: 'Mutated Party',
      role: 'Enforcer',
      isCorporate: false,
      isResident: false,
    });

    state.resetToSample();
    const freshState = useStructureStore.getState();
    expect(freshState.entities[0].associatedParties.some((p) => p.id === 'mutated-party')).toBe(false);
    expect(sampleTrustStructure.entities[0].associatedParties.some((p) => p.id === 'mutated-party')).toBe(false);
  });

  it('clears canvas to an empty state with clearCanvas', () => {
    const state = useStructureStore.getState();
    expect(state.entities.length).toBeGreaterThan(0);

    state.clearCanvas();

    const cleared = useStructureStore.getState();
    expect(cleared.entities).toEqual([]);
    expect(cleared.relationships).toEqual([]);
    expect(cleared.selectedEntityId).toBeNull();
    expect(cleared.highlightedParty).toBeNull();
    expect(cleared.metadata.chartTitle).toBe('New Trust Structure');
  });

  it('handles addEntity without associatedParties or ubos by defaulting to empty arrays', () => {
    const newEnt = useStructureStore.getState().addEntity({
      name: 'Minimal Entity Ltd',
      type: 'Operating Company',
      jurisdiction: 'BVI',
      status: 'Active',
    } as any);

    expect(newEnt.associatedParties).toEqual([]);
    expect(newEnt.ubosOrBeneficiaries).toEqual([]);
  });

  it('preserves selectedEntityId when deleting a different unselected entity', () => {
    useStructureStore.getState().setSelectedEntityId('entity-1');
    expect(useStructureStore.getState().selectedEntityId).toBe('entity-1');

    useStructureStore.getState().deleteEntity('entity-2');
    expect(useStructureStore.getState().selectedEntityId).toBe('entity-1');
  });

  it('manages undo snapshots and restores previous structure state', () => {
    const store = useStructureStore.getState();
    const originalCount = store.entities.length;

    store.setUndoSnapshot({
      metadata: store.metadata,
      entities: store.entities,
      relationships: store.relationships,
    });

    store.clearCanvas();
    expect(useStructureStore.getState().entities).toHaveLength(0);

    const restored = useStructureStore.getState().restoreUndoSnapshot();
    expect(restored).toBe(true);
    expect(useStructureStore.getState().entities).toHaveLength(originalCount);
    expect(useStructureStore.getState().undoSnapshot).toBeNull();

    expect(useStructureStore.getState().restoreUndoSnapshot()).toBe(false);
  });

  it('handles ocr review state and dismissal', () => {
    const store = useStructureStore.getState();
    store.setOcrReviewState({
      summary: 'Inferred 4 entities and 3 relationships',
      warnings: ['Illegible jurisdiction'],
    });

    expect(useStructureStore.getState().ocrReviewState?.summary).toBe(
      'Inferred 4 entities and 3 relationships'
    );
    expect(useStructureStore.getState().ocrReviewState?.warnings).toContain('Illegible jurisdiction');

    useStructureStore.getState().dismissOcrReview();
    expect(useStructureStore.getState().ocrReviewState).toBeNull();
  });

  it('manages directorCap and isExportMode state and mutations', () => {
    const store = useStructureStore.getState();
    expect(store.directorCap).toBe(3);
    expect(store.isExportMode).toBe(false);

    store.setDirectorCap(5);
    expect(useStructureStore.getState().directorCap).toBe(5);

    store.setDirectorCap('all');
    expect(useStructureStore.getState().directorCap).toBe('all');

    store.setExportMode(true);
    expect(useStructureStore.getState().isExportMode).toBe(true);

    store.setExportMode(false);
    expect(useStructureStore.getState().isExportMode).toBe(false);
  });

  it('manages associationLineStyle state and mutations', () => {
    const store = useStructureStore.getState();
    expect(store.associationLineStyle).toBe('dotted');

    store.setAssociationLineStyle('solid');
    expect(useStructureStore.getState().associationLineStyle).toBe('solid');

    store.setAssociationLineStyle('dotted');
    expect(useStructureStore.getState().associationLineStyle).toBe('dotted');
  });

  it('records undo and redo history for entity and relationship mutations', () => {
    const store = useStructureStore.getState();
    const initialCount = store.entities.length;

    // Mutate state: add an entity
    const newEnt = store.addEntity({
      name: 'Undoable SPV',
      type: 'Holding Company',
      jurisdiction: 'BVI',
      status: 'Active',
      associatedParties: [],
    });

    expect(useStructureStore.getState().entities.length).toBe(initialCount + 1);
    expect(useStructureStore.getState().undoHistory.length).toBeGreaterThan(0);

    // Perform Undo
    const undoResult = useStructureStore.getState().undo();
    expect(undoResult).toBe(true);
    expect(useStructureStore.getState().entities.length).toBe(initialCount);
    expect(useStructureStore.getState().redoHistory.length).toBeGreaterThan(0);

    // Perform Redo
    const redoResult = useStructureStore.getState().redo();
    expect(redoResult).toBe(true);
    expect(useStructureStore.getState().entities.length).toBe(initialCount + 1);

    // Undo when empty returns false
    useStructureStore.setState({ undoHistory: [] });
    expect(useStructureStore.getState().undo()).toBe(false);

    // Redo when empty returns false
    useStructureStore.setState({ redoHistory: [] });
    expect(useStructureStore.getState().redo()).toBe(false);

    // Verify clearCanvas, updateEntity, deleteEntity, addRelationship record history
    store.updateEntity(newEnt.id, { name: 'Updated SPV' });
    expect(useStructureStore.getState().undoHistory.length).toBe(1);

    store.deleteEntity(newEnt.id);
    expect(useStructureStore.getState().undoHistory.length).toBe(2);

    store.clearCanvas();
    expect(useStructureStore.getState().entities.length).toBe(0);
    expect(useStructureStore.getState().undoHistory.length).toBe(3);

    expect(useStructureStore.getState().undo()).toBe(true);
    expect(useStructureStore.getState().undoHistory.length).toBe(2);
  });
});
