import { describe, it, expect } from 'vitest';
import {
  calculateSortedLayout,
  sortSiblingEntities,
  calculateCardHeight,
  calculateTrustDimensions,
  calculateBankDimensions,
  groupPartiesByRole,
  distributeRoleGroups,
  formatRoleTitle,
  BASE_CARD_HEIGHT,
  DIRECTOR_ROW_HEIGHT,
  TRUST_CARD_WIDTH,
  TRUST_CARD_HEIGHT,
  SUBSIDIARY_CARD_SIZE,
  SUBSIDIARY_CARD_HEIGHT,
  BANK_CARD_SIZE,
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
      associatedParties: [
        { id: 'p1', name: 'Settlor Person', role: 'Settlor' },
        { id: 'p2', name: 'Protector Person', role: 'Protector' },
        { id: 'p3', name: 'Enforcer Person', role: 'Enforcer' },
      ],
    },
    {
      id: '2',
      name: 'Zeta Subsidiary',
      type: 'Operating Company',
      jurisdiction: 'Singapore',
      status: 'Active',
      associatedParties: [
        { id: 'p4', name: 'Director One', role: 'Director', isCorporate: false },
        { id: 'p5', name: 'Director Two', role: 'Director', isCorporate: true },
      ],
    },
    {
      id: '3',
      name: 'Alpha Subsidiary',
      type: 'Operating Company',
      jurisdiction: 'Cayman Islands',
      status: 'Active',
      associatedParties: [],
    },
    {
      id: '4',
      name: 'Treasury Bank',
      type: 'Bank',
      jurisdiction: 'Singapore',
      status: 'Active',
      associatedParties: [
        { id: 'p6', name: 'Auth Signatory 1', role: 'Authorised Signatory' },
        { id: 'p7', name: 'Auth Signatory 2', role: 'Authorised Signatory' },
      ],
    },
  ];

  const mockEdges: OwnershipEdgeData[] = [
    { id: 'e1', source: '1', target: '2', ownershipPercentage: 50, shareClass: 'Ordinary A' },
    { id: 'e2', source: '1', target: '3', ownershipPercentage: 100, shareClass: 'Ordinary B' },
    { id: 'e3', source: '2', target: '4', ownershipPercentage: 100, shareClass: 'Bank Account' },
  ];

  describe('calculateCardHeight', () => {
    it('returns base card height when party count is 0 or negative', () => {
      expect(calculateCardHeight(0)).toBe(BASE_CARD_HEIGHT);
      expect(calculateCardHeight(-1)).toBe(BASE_CARD_HEIGHT);
    });

    it('calculates height including rows', () => {
      expect(calculateCardHeight(2)).toBe(BASE_CARD_HEIGHT + 2 * DIRECTOR_ROW_HEIGHT);
      expect(calculateCardHeight(5)).toBe(BASE_CARD_HEIGHT + 5 * DIRECTOR_ROW_HEIGHT);
    });
  });

  describe('getEntityDimensions and Bank dimensions', () => {
    it('returns circular dimensions for Bank', () => {
      expect(calculateBankDimensions()).toEqual({ width: BANK_CARD_SIZE, height: BANK_CARD_SIZE });
      expect(getEntityDimensions('Bank')).toEqual({ width: 180, height: 180 });
    });

    it('returns triangular dimensions for Trust and Trust Company', () => {
      expect(getEntityDimensions('Trust')).toEqual({ width: TRUST_CARD_WIDTH, height: TRUST_CARD_HEIGHT });
      expect(getEntityDimensions('Trust Company')).toEqual({ width: TRUST_CARD_WIDTH, height: TRUST_CARD_HEIGHT });
    });

    it('returns rectangular dimensions for subsidiary entity types', () => {
      expect(getEntityDimensions('Holding Company')).toEqual({ width: SUBSIDIARY_CARD_SIZE, height: SUBSIDIARY_CARD_HEIGHT });
      expect(getEntityDimensions('Operating Company')).toEqual({ width: SUBSIDIARY_CARD_SIZE, height: SUBSIDIARY_CARD_HEIGHT });
      expect(getEntityDimensions('LLC')).toEqual({ width: SUBSIDIARY_CARD_SIZE, height: SUBSIDIARY_CARD_HEIGHT });
    });
  });

  describe('groupPartiesByRole and formatRoleTitle', () => {
    it('formats role titles accurately for single vs plural parties', () => {
      expect(formatRoleTitle('Director', 1)).toBe('Director');
      expect(formatRoleTitle('Director', 2)).toBe('Directors');
      expect(formatRoleTitle('Enforcer', 2)).toBe('Enforcers');
      expect(formatRoleTitle('Authorised Signatory', 2)).toBe('Authorised Signatories');
      expect(formatRoleTitle('Directors', 3)).toBe('Directors');
      expect(formatRoleTitle('Advisor', 2)).toBe('Advisors');
    });

    it('groups parties by role category correctly', () => {
      const parties = [
        { id: '1', name: 'Alice', role: 'Director' },
        { id: '2', name: 'Bob', role: 'Director' },
        { id: '3', name: 'Charlie', role: 'Protector' },
      ];
      const groups = groupPartiesByRole(parties);
      expect(groups).toHaveLength(2);
      const dirGroup = groups.find((g) => g.role === 'Directors');
      expect(dirGroup?.parties).toHaveLength(2);
      const protGroup = groups.find((g) => g.role === 'Protector');
      expect(protGroup?.parties).toHaveLength(1);
    });

    it('returns empty array when parties is empty or undefined', () => {
      expect(groupPartiesByRole([])).toEqual([]);
      expect(groupPartiesByRole(undefined)).toEqual([]);
    });
  });

  describe('distributeRoleGroups', () => {
    it('distributes 3 groups equally: 2 on Left, 1 on Right', () => {
      const groups = [
        { role: 'Settlor', parties: [] },
        { role: 'Enforcers', parties: [] },
        { role: 'Protector', parties: [] },
      ];
      const { left, right } = distributeRoleGroups(groups);
      expect(left).toHaveLength(2);
      expect(right).toHaveLength(1);
      expect(left[0].role).toBe('Settlor');
      expect(left[1].role).toBe('Enforcers');
      expect(right[0].role).toBe('Protector');
    });

    it('distributes 4 groups equally: 2 on Left, 2 on Right', () => {
      const groups = [
        { role: 'G1', parties: [] },
        { role: 'G2', parties: [] },
        { role: 'G3', parties: [] },
        { role: 'G4', parties: [] },
      ];
      const { left, right } = distributeRoleGroups(groups);
      expect(left).toHaveLength(2);
      expect(right).toHaveLength(2);
    });

    it('handles empty groups safely', () => {
      const { left, right } = distributeRoleGroups([]);
      expect(left).toEqual([]);
      expect(right).toEqual([]);
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
  });

  describe('calculateSortedLayout with hybrid satellites and Banks', () => {
    it('places core entities and generates flanking satellite cards and association edges', () => {
      const { nodes, edges } = calculateSortedLayout(mockEntities, mockEdges, 'alphabetical');

      // 4 entity nodes + satellites for entities 1, 2, 4
      const entityNodes = nodes.filter((n) => n.type === 'entityNode');
      expect(entityNodes).toHaveLength(4);

      const satelliteNodes = nodes.filter((n) => n.type === 'satelliteNode');
      expect(satelliteNodes.length).toBeGreaterThan(0);

      // Entity 1 has 3 groups (Settlor, Protector, Enforcer): 2 on left, 1 on right
      const entity1Satellites = satelliteNodes.filter((s) => s.data.parentEntityId === '1');
      expect(entity1Satellites).toHaveLength(3);
      const leftSats = entity1Satellites.filter((s) => s.data.side === 'left');
      const rightSats = entity1Satellites.filter((s) => s.data.side === 'right');
      expect(leftSats).toHaveLength(2);
      expect(rightSats).toHaveLength(1);

      // Left satellites have x < entity1.x; Right satellites have x > entity1.x
      const entity1Node = entityNodes.find((n) => n.id === '1')!;
      leftSats.forEach((s) => {
        expect(s.position.x).toBeLessThan(entity1Node.position.x);
      });
      rightSats.forEach((s) => {
        expect(s.position.x).toBeGreaterThan(entity1Node.position.x);
      });

      // Association edges generated for satellites
      const associationEdges = edges.filter((e) => e.data?.isAssociationEdge);
      expect(associationEdges.length).toBe(satelliteNodes.length);

      // Bank entity 4 is positioned below entity 2
      const bankNode = entityNodes.find((n) => n.id === '4')!;
      const sub2Node = entityNodes.find((n) => n.id === '2')!;
      expect(bankNode.position.y).toBeGreaterThan(sub2Node.position.y);
      expect(bankNode.data.type).toBe('Bank');
    });

    it('handles empty entities and edges without throwing', () => {
      const { nodes, edges } = calculateSortedLayout([], []);
      expect(nodes).toEqual([]);
      expect(edges).toEqual([]);
    });

    it('handles cross-links properly in layout', () => {
      const crossLinkEdge: OwnershipEdgeData = {
        id: 'e-cross',
        source: '2',
        target: '3',
        isCrossLink: true,
      };
      const { edges } = calculateSortedLayout(
        mockEntities,
        [...mockEdges, crossLinkEdge],
        'alphabetical'
      );
      const crossEdge = edges.find((e) => e.id === 'e-cross');
      expect(crossEdge?.data?.isCrossLink).toBe(true);
    });

    it('handles relationships from unregistered source IDs and unregistered target IDs', () => {
      const extraEdge: OwnershipEdgeData = {
        id: 'e-orphan',
        source: 'unregistered-source',
        target: '2',
      };
      const extraTargetEdge: OwnershipEdgeData = {
        id: 'e-orphan-target',
        source: '1',
        target: 'unregistered-target',
      };
      const { edges } = calculateSortedLayout(
        mockEntities,
        [...mockEdges, extraEdge, extraTargetEdge],
        'alphabetical'
      );
      const orphan = edges.find((e) => e.id === 'e-orphan');
      expect(orphan).toBeDefined();
    });

    it('calculates extra height for long trust names and handles roleless parties and missing ownership pct', () => {
      const longNameDims = calculateTrustDimensions({
        id: 'long-trust',
        name: 'The Ultra Long Name Dynastic Irrevocable Settlement Trust',
        type: 'Trust',
        jurisdiction: 'Jersey',
        status: 'Active',
      });
      expect(longNameDims.height).toBeGreaterThan(160);

      const partiesWithRoleless = groupPartiesByRole([
        { id: 'p1', name: 'No Role Person', role: '' as any },
      ]);
      expect(partiesWithRoleless[0].role).toBe('Director');

      // sortSiblingEntities without parentId or missing edge ownership
      const sorted = sortSiblingEntities(
        [mockEntities[1], mockEntities[2]],
        [{ id: 'rel-none', source: 'none', target: 'none' }],
        'ownership'
      );
      expect(sorted).toHaveLength(2);
    });
  });
});
