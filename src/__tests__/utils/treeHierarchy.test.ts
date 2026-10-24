import { describe, it, expect } from 'vitest';
import {
  buildEntityHierarchy,
  getPrimaryParentRelationship,
  getAdditionalParentsCount,
  deriveLineageHierarchy,
} from '../../utils/treeHierarchy';
import { EntityNodeData, OwnershipEdgeData } from '../../types/structure';

describe('treeHierarchy', () => {
  const mockEntities: EntityNodeData[] = [
    {
      id: 'e-1',
      name: 'Holding Trust',
      type: 'Trust',
      jurisdiction: 'Jersey',
      status: 'Active',
      associatedParties: [],
    },
    {
      id: 'e-2',
      name: 'Sub HoldCo',
      type: 'Holding Company',
      jurisdiction: 'BVI',
      status: 'Active',
      associatedParties: [],
    },
    {
      id: 'e-3',
      name: 'Operating Co',
      type: 'Operating Company',
      jurisdiction: 'UK',
      status: 'Active',
      associatedParties: [],
    },
  ];

  it('builds a tree when there is a clear single-parent hierarchy', () => {
    const relationships: OwnershipEdgeData[] = [
      { id: 'r-1', source: 'e-1', target: 'e-2', ownershipPercentage: 100 },
      { id: 'r-2', source: 'e-2', target: 'e-3', ownershipPercentage: 100 },
    ];

    const hierarchy = buildEntityHierarchy(mockEntities, relationships);
    expect(hierarchy.length).toBe(1);
    expect(hierarchy[0].entity.id).toBe('e-1');
    expect(hierarchy[0].depth).toBe(0);
    expect(hierarchy[0].children.length).toBe(1);

    const sub = hierarchy[0].children[0];
    expect(sub.entity.id).toBe('e-2');
    expect(sub.depth).toBe(1);
    expect(sub.ownershipPercentage).toBe(100);
    expect(sub.children.length).toBe(1);

    const op = sub.children[0];
    expect(op.entity.id).toBe('e-3');
    expect(op.depth).toBe(2);
    expect(op.ownershipPercentage).toBe(100);
    expect(op.additionalParentsCount).toBe(0);
  });

  it('handles multi-parent ownership by selecting highest percentage as primary parent and counting additional parents', () => {
    const parentA: EntityNodeData = {
      id: 'parent-a',
      name: 'Parent A',
      type: 'Holding Company',
      jurisdiction: 'BVI',
      status: 'Active',
      associatedParties: [],
    };
    const parentB: EntityNodeData = {
      id: 'parent-b',
      name: 'Parent B',
      type: 'Holding Company',
      jurisdiction: 'Cayman',
      status: 'Active',
      associatedParties: [],
    };
    const child: EntityNodeData = {
      id: 'child-joint',
      name: 'Joint Venture LLC',
      type: 'LLC',
      jurisdiction: 'Delaware',
      status: 'Active',
      associatedParties: [],
    };

    const entities = [parentA, parentB, child];
    const relationships: OwnershipEdgeData[] = [
      { id: 'r-1', source: 'parent-a', target: 'child-joint', ownershipPercentage: 40 },
      { id: 'r-2', source: 'parent-b', target: 'child-joint', ownershipPercentage: 60 },
    ];

    const hierarchy = buildEntityHierarchy(entities, relationships);
    expect(hierarchy.length).toBe(2);

    // Parent A should have 0 children
    const nodeA = hierarchy.find((n) => n.entity.id === 'parent-a');
    expect(nodeA?.children.length).toBe(0);

    // Parent B should have the child (60% > 40%)
    const nodeB = hierarchy.find((n) => n.entity.id === 'parent-b');
    expect(nodeB?.children.length).toBe(1);
    expect(nodeB?.children[0].entity.id).toBe('child-joint');
    expect(nodeB?.children[0].ownershipPercentage).toBe(60);
    expect(nodeB?.children[0].additionalParentsCount).toBe(1);
  });

  it('detects cycles and terminates gracefully without infinite recursion', () => {
    const cycleEntities: EntityNodeData[] = [
      { id: 'c-1', name: 'Node 1', type: 'LLC', jurisdiction: 'US', status: 'Active', associatedParties: [] },
      { id: 'c-2', name: 'Node 2', type: 'LLC', jurisdiction: 'US', status: 'Active', associatedParties: [] },
    ];

    // c-1 -> c-2 and c-2 -> c-1 (pure cycle, no natural root)
    const cycleRels: OwnershipEdgeData[] = [
      { id: 'r-1', source: 'c-1', target: 'c-2', ownershipPercentage: 100 },
      { id: 'r-2', source: 'c-2', target: 'c-1', ownershipPercentage: 100 },
    ];

    const hierarchy = buildEntityHierarchy(cycleEntities, cycleRels);
    // Cycle recovery: since neither is a natural root, fallback loop picks c-1 or c-2 as forest roots
    expect(hierarchy.length).toBeGreaterThanOrEqual(1);
    const allIds = new Set<string>();
    const collectIds = (nodes: typeof hierarchy) => {
      for (const node of nodes) {
        allIds.add(node.entity.id);
        collectIds(node.children);
      }
    };
    collectIds(hierarchy);
    expect(allIds.has('c-1')).toBe(true);
    expect(allIds.has('c-2')).toBe(true);
  });

  it('handles external parents not in entity set', () => {
    const entity: EntityNodeData = {
      id: 'orphan-1',
      name: 'Orphan Co',
      type: 'Operating Company',
      jurisdiction: 'SG',
      status: 'Active',
      associatedParties: [],
    };
    const rels: OwnershipEdgeData[] = [
      { id: 'r-ext', source: 'external-parent-999', target: 'orphan-1', ownershipPercentage: 100 },
    ];

    const entityIdSet = new Set(['orphan-1']);
    const primary = getPrimaryParentRelationship('orphan-1', rels, entityIdSet);
    expect(primary).toBeUndefined();

    const additional = getAdditionalParentsCount('orphan-1', rels, entityIdSet);
    expect(additional).toBe(0);

    const hierarchy = buildEntityHierarchy([entity], rels);
    expect(hierarchy.length).toBe(1);
    expect(hierarchy[0].depth).toBe(0);
    expect(hierarchy[0].children.length).toBe(0);
  });

  it('handles relationships with missing or undefined ownershipPercentage', () => {
    const entityA: EntityNodeData = {
      id: 'a',
      name: 'A',
      type: 'Holding Company',
      jurisdiction: 'BVI',
      status: 'Active',
      associatedParties: [],
    };
    const entityB: EntityNodeData = {
      id: 'b',
      name: 'B',
      type: 'Operating Company',
      jurisdiction: 'BVI',
      status: 'Active',
      associatedParties: [],
    };
    const rels: OwnershipEdgeData[] = [
      { id: 'r1', source: 'a', target: 'b' }, // no ownershipPercentage
    ];

    const hierarchy = buildEntityHierarchy([entityA, entityB], rels);
    expect(hierarchy.length).toBe(1);
    expect(hierarchy[0].children[0].entity.id).toBe('b');
    expect(hierarchy[0].children[0].ownershipPercentage).toBeUndefined();

    // Test sorting with one defined and one undefined ownership percentage in both orders
    const entityC: EntityNodeData = {
      id: 'c',
      name: 'C',
      type: 'Holding Company',
      jurisdiction: 'BVI',
      status: 'Active',
      associatedParties: [],
    };
    const relsWithMixed1: OwnershipEdgeData[] = [
      { id: 'r-def', source: 'a', target: 'b', ownershipPercentage: 50 },
      { id: 'r-undef', source: 'c', target: 'b' },
    ];
    const best1 = getPrimaryParentRelationship('b', relsWithMixed1, new Set(['a', 'c']));
    expect(best1?.source).toBe('a');

    const relsWithMixed2: OwnershipEdgeData[] = [
      { id: 'r-undef', source: 'c', target: 'b' },
      { id: 'r-def', source: 'a', target: 'b', ownershipPercentage: 50 },
    ];
    const best2 = getPrimaryParentRelationship('b', relsWithMixed2, new Set(['a', 'c']));
    expect(best2?.source).toBe('a');
  });

  it('handles multi-parent with > 2 parents and equal percentage sorting', () => {
    const parentA: EntityNodeData = {
      id: 'pa',
      name: 'PA',
      type: 'Holding Company',
      jurisdiction: 'BVI',
      status: 'Active',
      associatedParties: [],
    };
    const parentB: EntityNodeData = {
      id: 'pb',
      name: 'PB',
      type: 'Holding Company',
      jurisdiction: 'Cayman',
      status: 'Active',
      associatedParties: [],
    };
    const parentC: EntityNodeData = {
      id: 'pc',
      name: 'PC',
      type: 'Holding Company',
      jurisdiction: 'Jersey',
      status: 'Active',
      associatedParties: [],
    };
    const child: EntityNodeData = {
      id: 'ch',
      name: 'CH',
      type: 'Operating Company',
      jurisdiction: 'UK',
      status: 'Active',
      associatedParties: [],
    };

    // Equal percentages (33, 33, 33) to exercise sort tie-break and additionalParentsCount > 1
    const rels: OwnershipEdgeData[] = [
      { id: 'r1', source: 'pa', target: 'ch', ownershipPercentage: 33 },
      { id: 'r2', source: 'pb', target: 'ch', ownershipPercentage: 33 },
      { id: 'r3', source: 'pc', target: 'ch', ownershipPercentage: 33 },
    ];

    const hierarchy = buildEntityHierarchy([parentA, parentB, parentC, child], rels);
    const nodeA = hierarchy.find((n) => n.entity.id === 'pa');
    expect(nodeA?.children.length).toBe(1);
    expect(nodeA?.children[0].additionalParentsCount).toBe(2);
  });

  describe('deriveLineageHierarchy', () => {
    it('flattens hierarchy into lineage order (roots -> children)', () => {
      const relationships: OwnershipEdgeData[] = [
        { id: 'r-1', source: 'e-1', target: 'e-2', ownershipPercentage: 100 },
        { id: 'r-2', source: 'e-2', target: 'e-3', ownershipPercentage: 100 },
      ];

      const ordered = deriveLineageHierarchy(mockEntities, relationships);
      expect(ordered.map((e) => e.id)).toEqual(['e-1', 'e-2', 'e-3']);
    });

    it('returns empty array when entities list is empty', () => {
      expect(deriveLineageHierarchy([], [])).toEqual([]);
    });
  });
});
