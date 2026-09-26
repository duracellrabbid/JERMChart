import { describe, it, expect } from 'vitest';
import {
  calculateSortedLayout,
  sortSiblingEntities,
  calculateCardHeight,
  calculateTrustDimensions,
  calculateSubsidiaryDimensions,
  BASE_CARD_HEIGHT,
  DIRECTOR_ROW_HEIGHT,
  TRUST_CARD_WIDTH,
  TRUST_CARD_HEIGHT,
  SUBSIDIARY_CARD_SIZE,
  getEntityDimensions,
} from '../../utils/layoutEngine';
import { EntityNodeData, OwnershipEdgeData } from '../../types/structure';

describe('layoutEngine', () => {
  const mockEntities: EntityNodeData[] = [
    {
      id: '1',
      name: 'Parent Trust',
      type: 'Trust',
      jurisdiction: 'Jersey',
      status: 'Active',
      directors: [],
    },
    {
      id: '2',
      name: 'Zeta Subsidiary',
      type: 'Operating Company',
      jurisdiction: 'Singapore',
      status: 'Active',
      directors: [
        { id: 'd1', name: 'Director One', isCorporate: false },
        { id: 'd2', name: 'Director Two', isCorporate: true },
      ],
    },
    {
      id: '3',
      name: 'Alpha Subsidiary',
      type: 'Operating Company',
      jurisdiction: 'Cayman Islands',
      status: 'Active',
      directors: [],
    },
  ];

  const mockEdges: OwnershipEdgeData[] = [
    { id: 'e1', source: '1', target: '2', ownershipPercentage: 50, shareClass: 'Ordinary A' },
    { id: 'e2', source: '1', target: '3', ownershipPercentage: 100, shareClass: 'Ordinary B' },
  ];

  describe('calculateCardHeight', () => {
    it('returns base card height when director count is 0 or negative', () => {
      expect(calculateCardHeight(0)).toBe(BASE_CARD_HEIGHT);
      expect(calculateCardHeight(-1)).toBe(BASE_CARD_HEIGHT);
    });

    it('calculates height including director rows', () => {
      expect(calculateCardHeight(2)).toBe(BASE_CARD_HEIGHT + 2 * DIRECTOR_ROW_HEIGHT);
      expect(calculateCardHeight(5)).toBe(BASE_CARD_HEIGHT + 5 * DIRECTOR_ROW_HEIGHT);
    });
  });

  describe('getEntityDimensions', () => {
    it('returns triangular dimensions for Trust and Trust Company', () => {
      expect(getEntityDimensions('Trust')).toEqual({ width: TRUST_CARD_WIDTH, height: TRUST_CARD_HEIGHT });
      expect(getEntityDimensions('Trust Company')).toEqual({ width: TRUST_CARD_WIDTH, height: TRUST_CARD_HEIGHT });
    });

    it('returns square dimensions for subsidiary entity types', () => {
      expect(getEntityDimensions('Holding Company')).toEqual({ width: SUBSIDIARY_CARD_SIZE, height: SUBSIDIARY_CARD_SIZE });
      expect(getEntityDimensions('Operating Company')).toEqual({ width: SUBSIDIARY_CARD_SIZE, height: SUBSIDIARY_CARD_SIZE });
      expect(getEntityDimensions('LLC')).toEqual({ width: SUBSIDIARY_CARD_SIZE, height: SUBSIDIARY_CARD_SIZE });
    });
  });

  describe('sortSiblingEntities', () => {
    it('sorts sibling entities alphabetically A-Z', () => {
      const siblings = [mockEntities[1], mockEntities[2]]; // Zeta, Alpha
      const sorted = sortSiblingEntities(siblings, mockEdges, 'alphabetical');
      expect(sorted[0].name).toBe('Alpha Subsidiary');
      expect(sorted[1].name).toBe('Zeta Subsidiary');
    });

    it('sorts sibling entities by ownership percentage descending', () => {
      const siblings = [mockEntities[1], mockEntities[2]]; // 50%, 100%
      const sorted = sortSiblingEntities(siblings, mockEdges, 'ownership');
      expect(sorted[0].id).toBe('3'); // 100%
      expect(sorted[1].id).toBe('2'); // 50%
    });

    it('sorts sibling entities by jurisdiction alphabetically', () => {
      const siblings = [mockEntities[1], mockEntities[2]]; // Singapore, Cayman Islands
      const sorted = sortSiblingEntities(siblings, mockEdges, 'jurisdiction');
      expect(sorted[0].jurisdiction).toBe('Cayman Islands');
      expect(sorted[1].jurisdiction).toBe('Singapore');
    });

    it('preserves order for manual sorting', () => {
      const siblings = [mockEntities[1], mockEntities[2]];
      const sorted = sortSiblingEntities(siblings, mockEdges, 'manual');
      expect(sorted[0].id).toBe('2');
      expect(sorted[1].id).toBe('3');
    });

    it('handles missing ownership percentage gracefully by defaulting to 0', () => {
      const edgesWithoutPct: OwnershipEdgeData[] = [
        { id: 'e1', source: '1', target: '2' }, // undefined ownership
        { id: 'e2', source: '1', target: '3', ownershipPercentage: 25 },
      ];
      const siblings = [mockEntities[1], mockEntities[2]];
      const sorted = sortSiblingEntities(siblings, edgesWithoutPct, 'ownership');
      expect(sorted[0].id).toBe('3'); // 25% > 0%
      expect(sorted[1].id).toBe('2');
    });

    it('correctly sorts siblings relative to specific parentId in multi-parent relationships', () => {
      // Child 2 has 20% from Parent 1, 80% from Parent 4
      // Child 3 has 70% from Parent 1, 30% from Parent 4
      const multiParentEdges: OwnershipEdgeData[] = [
        { id: 'e1', source: 'p1', target: '2', ownershipPercentage: 20 },
        { id: 'e2', source: 'p1', target: '3', ownershipPercentage: 70 },
        { id: 'e3', source: 'p4', target: '2', ownershipPercentage: 80 },
        { id: 'e4', source: 'p4', target: '3', ownershipPercentage: 30 },
      ];
      const siblings = [mockEntities[1], mockEntities[2]]; // '2' and '3'

      // Under Parent 1: Child 3 (70%) > Child 2 (20%)
      const sortedUnderP1 = sortSiblingEntities(siblings, multiParentEdges, 'ownership', 'p1');
      expect(sortedUnderP1[0].id).toBe('3');
      expect(sortedUnderP1[1].id).toBe('2');

      // Under Parent 4: Child 2 (80%) > Child 3 (30%)
      const sortedUnderP4 = sortSiblingEntities(siblings, multiParentEdges, 'ownership', 'p4');
      expect(sortedUnderP4[0].id).toBe('2');
      expect(sortedUnderP4[1].id).toBe('3');
    });
  });

  describe('calculateSortedLayout', () => {
    it('calculates deterministic layout positions with Dagre', () => {
      const { nodes, edges } = calculateSortedLayout(mockEntities, mockEdges, 'alphabetical');
      expect(nodes.length).toBe(3);
      expect(edges.length).toBe(2);

      // Parent is in top rank (lower y coordinate than children)
      const parentNode = nodes.find((n) => n.id === '1');
      const childNode2 = nodes.find((n) => n.id === '2');
      const childNode3 = nodes.find((n) => n.id === '3');
      expect(parentNode!.position.y).toBeLessThan(childNode2!.position.y);
      expect(parentNode!.position.y).toBeLessThan(childNode3!.position.y);

      // No NaN coordinates
      nodes.forEach((n) => {
        expect(Number.isNaN(n.position.x)).toBe(false);
        expect(Number.isNaN(n.position.y)).toBe(false);
      });

      // Node structure and computed height
      expect(parentNode?.type).toBe('entityNode');
      expect(parentNode?.data.computedHeight).toBe(TRUST_CARD_HEIGHT);
      expect(parentNode?.data.computedWidth).toBe(TRUST_CARD_WIDTH);
      expect(childNode2?.data.computedHeight).toBe(SUBSIDIARY_CARD_SIZE);
      expect(childNode2?.data.computedWidth).toBe(SUBSIDIARY_CARD_SIZE);

      // Edge structure and data
      const edge1 = edges.find((e) => e.id === 'e1');
      expect(edge1?.type).toBe('ownershipEdge');
      expect(edge1?.source).toBe('1');
      expect(edge1?.target).toBe('2');
      expect(edge1?.data?.ownershipPercentage).toBe(50);
      expect(edge1?.data?.shareClass).toBe('Ordinary A');
    });

    it('handles empty entities and edges without throwing', () => {
      const { nodes, edges } = calculateSortedLayout([], []);
      expect(nodes).toEqual([]);
      expect(edges).toEqual([]);
    });

    it('handles cross-links properly in layout', () => {
      const crossLinkEdge: OwnershipEdgeData = {
        id: 'e3',
        source: '2',
        target: '3',
        isCrossLink: true,
      };
      const { nodes, edges } = calculateSortedLayout(
        mockEntities,
        [...mockEdges, crossLinkEdge],
        'alphabetical'
      );
      expect(nodes.length).toBe(3);
      expect(edges.length).toBe(3);
      const crossEdge = edges.find((e) => e.id === 'e3');
      expect(crossEdge?.data?.isCrossLink).toBe(true);
    });

    it('adds edges when relationship source or target is not in the parentToChildren list', () => {
      const extraEdge: OwnershipEdgeData = {
        id: 'e-orphan',
        source: 'external-parent',
        target: 'external-child',
      };
      const { edges } = calculateSortedLayout(mockEntities, [...mockEdges, extraEdge]);
      expect(edges.find((e) => e.id === 'e-orphan')).toBeDefined();
    });

    it('uses default alphabetical sort when sortCriteria is omitted', () => {
      const { nodes } = calculateSortedLayout(mockEntities, mockEdges);
      expect(nodes.length).toBe(3);
    });

    it('falls back to preserving order when criteria is unrecognized in sortSiblingEntities', () => {
      const siblings = [mockEntities[1], mockEntities[2]];
      const sorted = sortSiblingEntities(siblings, mockEdges, 'other' as any);
      expect(sorted[0].id).toBe('2');
      expect(sorted[1].id).toBe('3');
    });

    it('positions nodes in correct vertical hierarchy across multi-tier structures', () => {
      const grandchild: EntityNodeData = {
        id: '4',
        name: 'Grandchild Sub',
        type: 'Operating Company',
        jurisdiction: 'Hong Kong',
        status: 'Active',
        directors: [],
      };
      const grandchildEdge: OwnershipEdgeData = {
        id: 'e3',
        source: '2',
        target: '4',
        ownershipPercentage: 100,
      };

      const { nodes } = calculateSortedLayout(
        [...mockEntities, grandchild],
        [...mockEdges, grandchildEdge],
        'alphabetical'
      );

      const parent = nodes.find((n) => n.id === '1')!;
      const child = nodes.find((n) => n.id === '2')!;
      const gc = nodes.find((n) => n.id === '4')!;

      expect(parent.position.y).toBeLessThan(child.position.y);
      expect(child.position.y).toBeLessThan(gc.position.y);
    });

    it('populates directorCap and isExportMode on node data and dynamically sizes trust card with high content', () => {
      const denseTrust: EntityNodeData = {
        id: '1',
        name: 'The Ultra Comprehensive Global Discretionary Trust With Extremely Long Name',
        type: 'Trust',
        jurisdiction: 'Cook Islands',
        registrationNumber: 'REG-99999',
        status: 'Active',
        directors: [
          { id: 'd1', name: 'Director One', isCorporate: false },
          { id: 'd2', name: 'Director Two', isCorporate: true },
          { id: 'd3', name: 'Director Three', isCorporate: false },
          { id: 'd4', name: 'Director Four', isCorporate: true },
          { id: 'd5', name: 'Director Five', isCorporate: false },
        ],
        ubosOrBeneficiaries: ['Beneficiary One', 'Beneficiary Two'],
      };

      const cappedLayout = calculateSortedLayout([denseTrust], [], 'alphabetical', 3, false);
      const cappedNode = cappedLayout.nodes[0];
      expect(cappedNode.data.directorCap).toBe(3);
      expect(cappedNode.data.isExportMode).toBe(false);
      expect(cappedNode.data.computedHeight).toBeGreaterThanOrEqual(280);
      expect(cappedNode.data.computedWidth).toBe(Math.round(cappedNode.data.computedHeight * 1.25));

      const uncappedLayout = calculateSortedLayout([denseTrust], [], 'alphabetical', 3, true);
      const uncappedNode = uncappedLayout.nodes[0];
      expect(uncappedNode.data.directorCap).toBe('all');
      expect(uncappedNode.data.isExportMode).toBe(true);
      expect(uncappedNode.data.computedHeight).toBeGreaterThan(cappedNode.data.computedHeight);
    });

    it('expands subsidiary cards vertically in export mode when director count exceeds 3', () => {
      const denseSub: EntityNodeData = {
        id: '2',
        name: 'Sub With Many Directors',
        type: 'Operating Company',
        jurisdiction: 'Singapore',
        status: 'Active',
        directors: [
          { id: 'd1', name: 'D1', isCorporate: false },
          { id: 'd2', name: 'D2', isCorporate: false },
          { id: 'd3', name: 'D3', isCorporate: false },
          { id: 'd4', name: 'D4', isCorporate: false },
          { id: 'd5', name: 'D5', isCorporate: false },
        ],
      };

      const normalLayout = calculateSortedLayout([denseSub], [], 'alphabetical', 3, false);
      expect(normalLayout.nodes[0].data.computedHeight).toBe(SUBSIDIARY_CARD_SIZE);

      const exportLayout = calculateSortedLayout([denseSub], [], 'alphabetical', 3, true);
      expect(exportLayout.nodes[0].data.computedHeight).toBe(SUBSIDIARY_CARD_SIZE + 2 * 22);
    });

    it('handles undefined or minimal entities and edge cases across dimension helpers', () => {
      // Minimal trust entity with falsy name and undefined directors/UBOs
      const minimalTrust = {
        id: 'min-trust',
        name: '',
        type: 'Trust' as const,
        jurisdiction: 'Jersey',
        status: 'Active' as const,
      };
      const trustDims = calculateTrustDimensions(minimalTrust, 3);
      expect(trustDims.width).toBe(TRUST_CARD_WIDTH);
      expect(trustDims.height).toBe(TRUST_CARD_HEIGHT);

      // Minimal subsidiary entity with undefined directors
      const minimalSub = {
        id: 'min-sub',
        name: '',
        type: 'Operating Company' as const,
        jurisdiction: 'UK',
        status: 'Active' as const,
      };
      const subDims = calculateSubsidiaryDimensions(minimalSub, 3, false);
      expect(subDims.width).toBe(SUBSIDIARY_CARD_SIZE);
      expect(subDims.height).toBe(SUBSIDIARY_CARD_SIZE);

      // calculateSubsidiaryDimensions with undefined entity
      const undefSubDims = calculateSubsidiaryDimensions(undefined);
      expect(undefSubDims.width).toBe(SUBSIDIARY_CARD_SIZE);
      expect(undefSubDims.height).toBe(SUBSIDIARY_CARD_SIZE);

      // getEntityDimensions with undefined entity for Trust
      const undefTrustDims = getEntityDimensions('Trust', undefined);
      expect(undefTrustDims.width).toBe(TRUST_CARD_WIDTH);
      expect(undefTrustDims.height).toBe(TRUST_CARD_HEIGHT);

      // getEntityDimensions with undefined entity for subsidiary
      const undefSubDims2 = getEntityDimensions('Operating Company', undefined);
      expect(undefSubDims2.width).toBe(SUBSIDIARY_CARD_SIZE);
      expect(undefSubDims2.height).toBe(SUBSIDIARY_CARD_SIZE);
    });
  });
});

