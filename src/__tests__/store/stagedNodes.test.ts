import { describe, it, expect, beforeEach } from 'vitest';
import { useStructureStore } from '../../store/useStructureStore';
import { isCycleIntroducingEdge } from '../../utils/graphValidation';

describe('Staged Nodes and Graph Validation', () => {
  beforeEach(() => {
    useStructureStore.getState().resetToSample();
  });

  describe('Cycle Detection (graphValidation)', () => {
    it('detects self-loop as cyclical', () => {
      const rels = [{ id: 'rel-1', source: 'A', target: 'B' }];
      expect(isCycleIntroducingEdge('A', 'A', rels)).toBe(true);
    });

    it('detects direct 2-node cycle', () => {
      const rels = [{ id: 'rel-1', source: 'A', target: 'B' }];
      expect(isCycleIntroducingEdge('B', 'A', rels)).toBe(true);
    });

    it('detects indirect multi-hop cycle', () => {
      const rels = [
        { id: 'rel-1', source: 'A', target: 'B' },
        { id: 'rel-2', source: 'B', target: 'C' },
        { id: 'rel-3', source: 'C', target: 'D' },
      ];
      // Connecting D -> A would make A -> B -> C -> D -> A
      expect(isCycleIntroducingEdge('D', 'A', rels)).toBe(true);
    });

    it('allows valid non-cyclical connections', () => {
      const rels = [
        { id: 'rel-1', source: 'A', target: 'B' },
        { id: 'rel-2', source: 'A', target: 'C' },
      ];
      // Connecting B -> D is a valid tree extension
      expect(isCycleIntroducingEdge('B', 'D', rels)).toBe(false);
      // Connecting B -> C is a valid cross-link (DAG)
      expect(isCycleIntroducingEdge('B', 'C', rels)).toBe(false);
    });
  });

  describe('Staged Node Store Actions', () => {
    it('adds and removes staged nodes with history support', () => {
      const { stageNode, unstageNode, undo, redo } = useStructureStore.getState();

      const staged = stageNode({
        kind: 'person',
        name: 'New Fiduciary Officer',
        role: 'Director',
        position: { x: 250, y: 150 },
      });

      expect(staged.id).toBeDefined();
      expect(useStructureStore.getState().stagedNodes).toContainEqual(staged);

      // Undo removes the staged node
      undo();
      expect(useStructureStore.getState().stagedNodes.find((n) => n.id === staged.id)).toBeUndefined();

      // Redo restores the staged node
      redo();
      expect(useStructureStore.getState().stagedNodes.find((n) => n.id === staged.id)).toBeDefined();

      // Unstage manually
      unstageNode(staged.id);
      expect(useStructureStore.getState().stagedNodes.find((n) => n.id === staged.id)).toBeUndefined();
    });

    it('guards against mutations when isReadOnly is true', () => {
      useStructureStore.setState({ isReadOnly: true });
      const { stageNode, unstageNode, connectStagedPersonToEntity } = useStructureStore.getState();

      const result = stageNode({
        kind: 'person',
        name: 'Blocked Officer',
        position: { x: 0, y: 0 },
      });
      expect(result.id).toBe('');
      expect(useStructureStore.getState().stagedNodes.length).toBe(0);

      unstageNode('some-id');
      connectStagedPersonToEntity('some-id', 'entity-1', { role: 'Director' });

      useStructureStore.setState({ isReadOnly: false });
    });

    it('restores stagedNodes as empty array when previous history had no stagedNodes field', () => {
      const sample = useStructureStore.getState();
      useStructureStore.setState({
        undoHistory: [
          {
            metadata: sample.metadata,
            entities: sample.entities,
            relationships: sample.relationships,
          },
        ],
        redoHistory: [
          {
            metadata: sample.metadata,
            entities: sample.entities,
            relationships: sample.relationships,
          },
        ],
        undoSnapshot: {
          metadata: sample.metadata,
          entities: sample.entities,
          relationships: sample.relationships,
        },
      });

      useStructureStore.getState().undo();
      expect(useStructureStore.getState().stagedNodes).toEqual([]);

      // Test redo independently with undefined stagedNodes in next
      useStructureStore.setState({
        redoHistory: [
          {
            metadata: sample.metadata,
            entities: sample.entities,
            relationships: sample.relationships,
          },
        ],
      });
      useStructureStore.getState().redo();
      expect(useStructureStore.getState().stagedNodes).toEqual([]);

      useStructureStore.getState().restoreUndoSnapshot();
      expect(useStructureStore.getState().stagedNodes).toEqual([]);

      // Test restoreUndoSnapshot with stagedNodes defined
      useStructureStore.setState({
        undoSnapshot: {
          metadata: sample.metadata,
          entities: sample.entities,
          relationships: sample.relationships,
          stagedNodes: [{ id: 's1', kind: 'person', name: 'N', position: { x: 0, y: 0 } }],
        },
      });
      useStructureStore.getState().restoreUndoSnapshot();
      expect(useStructureStore.getState().stagedNodes.length).toBe(1);
    });

    it('handles non-existent stagedId gracefully during connect', () => {
      const { connectStagedPersonToEntity } = useStructureStore.getState();
      const initialPartyCount = useStructureStore.getState().entities[0].associatedParties.length;

      connectStagedPersonToEntity('non-existent-staged-id', 'entity-1', { role: 'Director' });
      expect(useStructureStore.getState().entities[0].associatedParties.length).toBe(initialPartyCount);
    });

    it('absorbs staged person into target entity associatedParties', () => {
      const { stageNode, connectStagedPersonToEntity } = useStructureStore.getState();

      const staged = stageNode({
        kind: 'person',
        name: 'Dame Sarah Jenkins',
        role: 'Protector',
        position: { x: 300, y: 300 },
      });

      const targetEntityId = 'entity-1';
      connectStagedPersonToEntity(staged.id, targetEntityId, {
        role: 'Protector',
        isResident: true,
        isCorporate: false,
      });

      // Staged node is consumed/removed
      expect(useStructureStore.getState().stagedNodes.find((n) => n.id === staged.id)).toBeUndefined();

      // Entity has the new party
      const entity = useStructureStore.getState().entities.find((e) => e.id === targetEntityId);
      expect(entity).toBeDefined();
      const party = entity?.associatedParties.find((p) => p.name === 'Dame Sarah Jenkins');
      expect(party).toBeDefined();
      expect(party?.role).toBe('Protector');
      expect(party?.isResident).toBe(true);
    });

    it('absorbs staged person into entity with undefined associatedParties', () => {
      const { addEntity, stageNode, connectStagedPersonToEntity } = useStructureStore.getState();

      const created = addEntity({
        name: 'Bare Entity',
        type: 'LLC',
        jurisdiction: 'Delaware',
        status: 'Active',
        associatedParties: undefined as any,
      });

      // Force associatedParties to be undefined
      useStructureStore.setState({
        entities: useStructureStore.getState().entities.map((e) =>
          e.id === created.id ? { ...e, associatedParties: undefined as any } : e
        ),
      });

      const staged = stageNode({
        kind: 'person',
        name: 'Bare Director',
        role: 'Director',
        position: { x: 0, y: 0 },
      });

      connectStagedPersonToEntity(staged.id, created.id, { role: 'Director' });

      const updated = useStructureStore.getState().entities.find((e) => e.id === created.id);
      expect(updated?.associatedParties.length).toBe(1);
      expect(updated?.associatedParties[0].name).toBe('Bare Director');
    });
  });
});
