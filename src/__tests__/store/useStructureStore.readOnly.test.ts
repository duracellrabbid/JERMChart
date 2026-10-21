import { describe, it, expect, beforeEach } from 'vitest';
import { useStructureStore } from '../../store/useStructureStore';

describe('useStructureStore - isReadOnly and allowJsonBackup', () => {
  beforeEach(() => {
    useStructureStore.setState({ isReadOnly: false, allowJsonBackup: true });
    useStructureStore.getState().resetToSample();
  });

  describe('default state and capability flags', () => {
    it('initializes with isReadOnly: false and allowJsonBackup: true', () => {
      const state = useStructureStore.getState();
      expect(state.isReadOnly).toBe(false);
      expect(state.allowJsonBackup).toBe(true);
    });

    it('toggles isReadOnly flag via setReadOnly', () => {
      useStructureStore.getState().setReadOnly(true);
      expect(useStructureStore.getState().isReadOnly).toBe(true);

      useStructureStore.getState().setReadOnly(false);
      expect(useStructureStore.getState().isReadOnly).toBe(false);
    });

    it('toggles allowJsonBackup flag via setAllowJsonBackup', () => {
      useStructureStore.getState().setAllowJsonBackup(false);
      expect(useStructureStore.getState().allowJsonBackup).toBe(false);

      useStructureStore.getState().setAllowJsonBackup(true);
      expect(useStructureStore.getState().allowJsonBackup).toBe(true);
    });
  });

  describe('when isReadOnly is true', () => {
    beforeEach(() => {
      useStructureStore.getState().setReadOnly(true);
    });

    it('guards setMetadata from mutating metadata', () => {
      const originalTitle = useStructureStore.getState().metadata.chartTitle;
      useStructureStore.getState().setMetadata({ chartTitle: 'Mutated Title' });

      expect(useStructureStore.getState().metadata.chartTitle).toBe(originalTitle);
    });

    it('guards addEntity from adding entity and pushing history', () => {
      const initialCount = useStructureStore.getState().entities.length;
      const initialHistoryLen = useStructureStore.getState().undoHistory.length;

      const result = useStructureStore.getState().addEntity({
        name: 'Blocked Entity',
        type: 'Operating Company',
        jurisdiction: 'Singapore',
        status: 'Active',
      });

      expect(useStructureStore.getState().entities.length).toBe(initialCount);
      expect(useStructureStore.getState().undoHistory.length).toBe(initialHistoryLen);
      expect(result.id).toBe('');
    });

    it('guards updateEntity from changing entity properties', () => {
      const target = useStructureStore.getState().entities[0];
      useStructureStore.getState().updateEntity(target.id, { name: 'Attempted Renamed' });

      const updated = useStructureStore.getState().entities.find((e) => e.id === target.id);
      expect(updated?.name).toBe(target.name);
    });

    it('guards deleteEntity from removing entities and relationships', () => {
      const target = useStructureStore.getState().entities[0];
      const initialCount = useStructureStore.getState().entities.length;

      useStructureStore.getState().deleteEntity(target.id);

      expect(useStructureStore.getState().entities.length).toBe(initialCount);
      expect(useStructureStore.getState().entities.some((e) => e.id === target.id)).toBe(true);
    });

    it('guards addAssociatedParty and addDirector from adding parties', () => {
      const target = useStructureStore.getState().entities[0];
      const initialPartiesCount = target.associatedParties?.length || 0;

      useStructureStore.getState().addAssociatedParty(target.id, {
        name: 'Blocked Advisor',
        role: 'Legal Advisor',
      });
      useStructureStore.getState().addDirector(target.id, {
        name: 'Blocked Director',
        role: 'Director',
      });

      const current = useStructureStore.getState().entities.find((e) => e.id === target.id);
      expect(current?.associatedParties?.length || 0).toBe(initialPartiesCount);
    });

    it('guards removeAssociatedParty and removeDirector from removing parties', () => {
      const target = useStructureStore.getState().entities.find(
        (e) => (e.associatedParties?.length || 0) > 0
      );
      expect(target).toBeDefined();
      if (!target || !target.associatedParties) return;

      const partyId = target.associatedParties[0].id;
      const countBefore = target.associatedParties.length;

      useStructureStore.getState().removeAssociatedParty(target.id, partyId);
      useStructureStore.getState().removeDirector(target.id, partyId);

      const current = useStructureStore.getState().entities.find((e) => e.id === target.id);
      expect(current?.associatedParties?.length).toBe(countBefore);
    });

    it('guards addRelationship from adding new relationships', () => {
      const initialRels = useStructureStore.getState().relationships.length;
      useStructureStore.getState().addRelationship({
        source: 'entity-1',
        target: 'entity-4',
        ownershipPercentage: 50,
      });

      expect(useStructureStore.getState().relationships.length).toBe(initialRels);
    });

    it('guards updateRelationship from modifying existing relationships', () => {
      const rel = useStructureStore.getState().relationships[0];
      const originalPct = rel.ownershipPercentage;

      useStructureStore.getState().updateRelationship(rel.id, {
        ownershipPercentage: 999,
      });

      const current = useStructureStore.getState().relationships.find((r) => r.id === rel.id);
      expect(current?.ownershipPercentage).toBe(originalPct);
    });

    it('guards deleteRelationship from removing relationships', () => {
      const rel = useStructureStore.getState().relationships[0];
      const initialCount = useStructureStore.getState().relationships.length;

      useStructureStore.getState().deleteRelationship(rel.id);

      expect(useStructureStore.getState().relationships.length).toBe(initialCount);
      expect(useStructureStore.getState().relationships.some((r) => r.id === rel.id)).toBe(true);
    });

    it('guards resetToSample and clearCanvas from resetting/wiping data', () => {
      const initialEntitiesCount = useStructureStore.getState().entities.length;
      useStructureStore.getState().clearCanvas();
      expect(useStructureStore.getState().entities.length).toBe(initialEntitiesCount);

      useStructureStore.getState().resetToSample();
      expect(useStructureStore.getState().entities.length).toBe(initialEntitiesCount);
    });

    it('guards undo, redo, and restoreUndoSnapshot from executing and returns false', () => {
      expect(useStructureStore.getState().undo()).toBe(false);
      expect(useStructureStore.getState().redo()).toBe(false);
      expect(useStructureStore.getState().restoreUndoSnapshot()).toBe(false);
    });

    it('permits non-mutating view actions and cloud hydration loadStructure', () => {
      const store = useStructureStore.getState();

      store.setSelectedEntityId('entity-1');
      expect(useStructureStore.getState().selectedEntityId).toBe('entity-1');

      store.setHighlightedParty('John Doe');
      expect(useStructureStore.getState().highlightedParty).toBe('John Doe');

      store.setHighlightedDirector('Jane Doe');
      expect(useStructureStore.getState().highlightedDirector).toBe('Jane Doe');

      store.setSortCriteria('jurisdiction');
      expect(useStructureStore.getState().sortCriteria).toBe('jurisdiction');

      store.setDirectorCap('all');
      expect(useStructureStore.getState().directorCap).toBe('all');

      store.setExportMode(true);
      expect(useStructureStore.getState().isExportMode).toBe(true);

      store.setAssociationLineStyle('solid');
      expect(useStructureStore.getState().associationLineStyle).toBe('solid');

      store.setOcrReviewState({ summary: 'test summary', warnings: [] });
      expect(useStructureStore.getState().ocrReviewState?.summary).toBe('test summary');

      store.dismissOcrReview();
      expect(useStructureStore.getState().ocrReviewState).toBeNull();

      // Cloud hydration via loadStructure must be permitted
      store.loadStructure({
        metadata: { chartTitle: 'Cloud Loaded Chart' },
        entities: [{ id: 'cloud-1', name: 'Cloud Entity', type: 'Trust' }],
        relationships: [],
      });
      expect(useStructureStore.getState().metadata.chartTitle).toBe('Cloud Loaded Chart');
      expect(useStructureStore.getState().entities.length).toBe(1);
      expect(useStructureStore.getState().entities[0].id).toBe('cloud-1');
    });
  });

  describe('unlocking back to writable mode', () => {
    it('allows mutations after setReadOnly(false)', () => {
      useStructureStore.getState().setReadOnly(true);
      expect(useStructureStore.getState().isReadOnly).toBe(true);

      useStructureStore.getState().setReadOnly(false);
      expect(useStructureStore.getState().isReadOnly).toBe(false);

      useStructureStore.getState().setMetadata({ chartTitle: 'Writable Title' });
      expect(useStructureStore.getState().metadata.chartTitle).toBe('Writable Title');
    });
  });
});
