import { describe, it, expect } from 'vitest';
import {
  calculateSortedLayout,
  sortSiblingEntities,
  calculateCardHeight,
  CARD_WIDTH,
  BASE_CARD_HEIGHT,
  DIRECTOR_ROW_HEIGHT,
} from './layoutEngine';
import { EntityNodeData, OwnershipEdgeData } from '../types/structure';

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
      expect(parentNode?.data.computedHeight).toBe(BASE_CARD_HEIGHT);
      expect(childNode2?.data.computedHeight).toBe(BASE_CARD_HEIGHT + 2 * DIRECTOR_ROW_HEIGHT);

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
  });
});
