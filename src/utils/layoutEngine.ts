import dagre from '@dagrejs/dagre';
import { Node, Edge } from '@xyflow/react';
import {
  AssociatedParty,
  EntityNodeData,
  EntityType,
  OwnershipEdgeData,
  SiblingSortCriteria,
} from '../types/structure';

export const CARD_WIDTH = 280;
export const BASE_CARD_HEIGHT = 160;
export const DIRECTOR_ROW_HEIGHT = 24;

export const TRUST_ASPECT_RATIO = 1.368;
export const TRUST_CARD_WIDTH = 260;
export const TRUST_CARD_HEIGHT = 190;
export const SUBSIDIARY_CARD_SIZE = 220;
export const SUBSIDIARY_CARD_HEIGHT = 110;
export const BANK_CARD_SIZE = 180;

export const SATELLITE_CARD_WIDTH = 150;
export const HORIZONTAL_SATELLITE_GAP = 40;
export const VERTICAL_SATELLITE_GAP = 10;

export interface RoleGroup {
  role: string;
  parties: AssociatedParty[];
}

export function calculateBankDimensions(): { width: number; height: number } {
  return { width: BANK_CARD_SIZE, height: BANK_CARD_SIZE };
}

export function calculateTrustDimensions(
  entity?: EntityNodeData
): { width: number; height: number } {
  const nameLen = entity?.name ? entity.name.length : 0;
  const extraHeight = nameLen > 35 ? 30 : 0;
  const height = TRUST_CARD_HEIGHT + extraHeight;
  const width = Math.round(height * TRUST_ASPECT_RATIO);
  return { width, height };
}

export function calculateSubsidiaryDimensions(
  _entity?: EntityNodeData
): { width: number; height: number } {
  return { width: SUBSIDIARY_CARD_SIZE, height: SUBSIDIARY_CARD_HEIGHT };
}

export function getEntityDimensions(
  type: EntityType,
  entity?: EntityNodeData,
  _cap?: number | 'all',
  _isExportMode?: boolean
): { width: number; height: number } {
  if (type === 'Bank') {
    return calculateBankDimensions();
  }
  if (type === 'Trust' || type === 'Trust Company') {
    return calculateTrustDimensions(entity);
  }
  return calculateSubsidiaryDimensions(entity);
}

export function calculateCardHeight(partyCount: number): number {
  return BASE_CARD_HEIGHT + Math.max(0, partyCount) * DIRECTOR_ROW_HEIGHT;
}

export function formatRoleTitle(role: string, count: number): string {
  const trimmed = role.trim();
  if (count <= 1) return trimmed;
  if (trimmed.endsWith('s') || trimmed.endsWith('S')) return trimmed;
  if (trimmed.toLowerCase() === 'director') return 'Directors';
  if (trimmed.toLowerCase() === 'enforcer') return 'Enforcers';
  if (trimmed.toLowerCase() === 'trustee') return 'Trustees';
  if (trimmed.toLowerCase() === 'beneficiary') return 'Beneficiaries';
  if (trimmed.toLowerCase() === 'authorised signatory' || trimmed.toLowerCase() === 'authorized signatory') {
    return 'Authorised Signatories';
  }
  return `${trimmed}s`;
}

export function groupPartiesByRole(parties?: AssociatedParty[]): RoleGroup[] {
  if (!parties || parties.length === 0) return [];

  const map = new Map<string, { role: string; items: AssociatedParty[] }>();

  parties.forEach((party) => {
    const rawRole = (party.role || 'Director').trim();
    const key = rawRole.toLowerCase();
    const existing = map.get(key);
    if (existing) {
      existing.items.push(party);
    } else {
      map.set(key, { role: rawRole, items: [party] });
    }
  });

  return Array.from(map.values()).map(({ role, items }) => ({
    role: formatRoleTitle(role, items.length),
    parties: items,
  }));
}

export function distributeRoleGroups(
  groups: RoleGroup[],
  preference: 'balanced' | 'left-only' | 'right-only' = 'balanced'
): {
  left: RoleGroup[];
  right: RoleGroup[];
} {
  const total = groups.length;
  if (total === 0) return { left: [], right: [] };

  if (preference === 'left-only') {
    return { left: groups, right: [] };
  }
  if (preference === 'right-only') {
    return { left: [], right: groups };
  }

  const leftCount = Math.ceil(total / 2);
  return {
    left: groups.slice(0, leftCount),
    right: groups.slice(leftCount),
  };
}

export function getSatelliteCardHeight(partyCount: number): number {
  return Math.max(48, 30 + partyCount * 22);
}

function calculateColumnTotalHeight(groups: RoleGroup[]): number {
  const heights = groups.map((g) => getSatelliteCardHeight(g.parties.length));
  const sum = heights.reduce((acc, h) => acc + h, 0);
  return sum + (groups.length - 1) * VERTICAL_SATELLITE_GAP;
}

export function sortSiblingEntities(
  siblings: EntityNodeData[],
  relationships: OwnershipEdgeData[],
  criteria: SiblingSortCriteria,
  parentId?: string
): EntityNodeData[] {
  const result = [...siblings];

  switch (criteria) {
    case 'alphabetical':
      return result.sort((a, b) => a.name.localeCompare(b.name));

    case 'ownership': {
      const getPct = (id: string) => {
        const edge = relationships.find((r) =>
          parentId ? r.source === parentId && r.target === id : r.target === id
        );
        return edge?.ownershipPercentage ?? 0;
      };
      return result.sort((a, b) => getPct(b.id) - getPct(a.id));
    }

    case 'jurisdiction':
      return result.sort((a, b) => a.jurisdiction.localeCompare(b.jurisdiction));

    case 'manual':
    default:
      return result;
  }
}

interface SatellitePlacementContext {
  entityId: string;
  side: 'left' | 'right';
  anchorX: number;
  centerY: number;
  groups: RoleGroup[];
}

function buildSatelliteColumn(
  ctx: SatellitePlacementContext,
  nodes: Node[],
  edges: Edge[]
): void {
  const { entityId, side, anchorX, centerY, groups } = ctx;
  const totalH = calculateColumnTotalHeight(groups);
  let currentY = centerY - totalH / 2;

  groups.forEach((group, idx) => {
    const cardH = getSatelliteCardHeight(group.parties.length);
    const satId = `sat-${entityId}-${side}-${idx}`;

    nodes.push({
      id: satId,
      type: 'satelliteNode',
      position: { x: anchorX, y: currentY },
      data: {
        id: satId,
        parentEntityId: entityId,
        role: group.role,
        parties: group.parties,
        side,
        computedWidth: SATELLITE_CARD_WIDTH,
        computedHeight: cardH,
        isSatelliteRoleNode: true,
        satelliteData: {
          id: satId,
          parentEntityId: entityId,
          role: group.role,
          parties: group.parties,
          side,
          computedWidth: SATELLITE_CARD_WIDTH,
          computedHeight: cardH,
        },
      },
    });

    edges.push({
      id: `edge-${satId}-${entityId}`,
      source: satId,
      sourceHandle: side === 'left' ? 'right-out' : 'left-out',
      target: entityId,
      targetHandle: side === 'left' ? 'left-in' : 'right-in',
      type: 'ownershipEdge',
      data: {
        isAssociationEdge: true,
      },
    });

    currentY += cardH + VERTICAL_SATELLITE_GAP;
  });
}

export type FlankPreference = 'balanced' | 'left-only' | 'right-only';

export interface EntityFlanks {
  left: RoleGroup[];
  right: RoleGroup[];
  leftWidth: number;
  rightWidth: number;
  totalWidth: number;
  totalHeight: number;
}

export function determineFlankPreference(
  entityId: string,
  siblingList?: EntityNodeData[]
): FlankPreference {
  if (!siblingList || siblingList.length <= 1) {
    return 'balanced';
  }
  const idx = siblingList.findIndex((s) => s.id === entityId);
  if (idx === 0) {
    return 'left-only';
  }
  if (idx === siblingList.length - 1) {
    return 'right-only';
  }
  return 'balanced';
}

export function calculateEntityFlanks(
  entity: EntityNodeData,
  preference: FlankPreference
): EntityFlanks {
  const groups = groupPartiesByRole(entity.associatedParties);
  const { left, right } = distributeRoleGroups(groups, preference);
  const dims = getEntityDimensions(entity.type, entity);

  const leftWidth = left.length > 0 ? SATELLITE_CARD_WIDTH + HORIZONTAL_SATELLITE_GAP : 0;
  const rightWidth = right.length > 0 ? SATELLITE_CARD_WIDTH + HORIZONTAL_SATELLITE_GAP : 0;

  const leftHeight = calculateColumnTotalHeight(left);
  const rightHeight = calculateColumnTotalHeight(right);

  const totalWidth = dims.width + leftWidth + rightWidth;
  const totalHeight = Math.max(dims.height, leftHeight, rightHeight);

  return {
    left,
    right,
    leftWidth,
    rightWidth,
    totalWidth,
    totalHeight,
  };
}

export function calculateSortedLayout(
  entities: EntityNodeData[],
  relationships: OwnershipEdgeData[],
  sortCriteria: SiblingSortCriteria = 'alphabetical',
  _cap?: number | 'all',
  _isExportMode?: boolean
): { nodes: Node[]; edges: Edge[] } {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: 'TB',
    nodesep: 140,
    ranksep: 90,
    align: 'DL',
  });

  const parentToChildren = new Map<string, EntityNodeData[]>();
  const entityMap = new Map<string, EntityNodeData>();
  entities.forEach((e) => entityMap.set(e.id, e));

  relationships.forEach((rel) => {
    if (!entityMap.has(rel.source) || !entityMap.has(rel.target)) return;
    const child = entityMap.get(rel.target)!;
    const existing = parentToChildren.get(rel.source) || [];
    existing.push(child);
    parentToChildren.set(rel.source, existing);
  });

  parentToChildren.forEach((children, parentId) => {
    parentToChildren.set(
      parentId,
      sortSiblingEntities(children, relationships, sortCriteria, parentId)
    );
  });

  // Map parent ID to sorted siblings list and find sibling list for each entity
  const entitySiblingMap = new Map<string, EntityNodeData[]>();
  parentToChildren.forEach((children) => {
    children.forEach((child) => {
      entitySiblingMap.set(child.id, children);
    });
  });

  const entityFlanksMap = new Map<string, EntityFlanks>();
  entities.forEach((entity) => {
    const siblings = entitySiblingMap.get(entity.id);
    const pref = determineFlankPreference(entity.id, siblings);
    const flanks = calculateEntityFlanks(entity, pref);
    entityFlanksMap.set(entity.id, flanks);

    dagreGraph.setNode(entity.id, {
      width: flanks.totalWidth,
      height: flanks.totalHeight,
    });
  });

  entities.forEach((parent) => {
    const sortedChildren = parentToChildren.get(parent.id) || [];
    sortedChildren.forEach((child) => {
      dagreGraph.setEdge(parent.id, child.id);
    });
  });

  dagre.layout(dagreGraph);

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Register main hierarchy entities within compound bounding box
  entities.forEach((entity) => {
    const nodePos = dagreGraph.node(entity.id);
    const dims = getEntityDimensions(entity.type, entity);
    const flanks = entityFlanksMap.get(entity.id)!;

    // Compound box top-left
    const compoundLeft = nodePos.x - flanks.totalWidth / 2;
    const compoundTop = nodePos.y - flanks.totalHeight / 2;

    // Core entity is placed inside compound box, offset by left flank width
    const coreX = compoundLeft + flanks.leftWidth;
    const coreY = compoundTop + (flanks.totalHeight - dims.height) / 2;

    nodes.push({
      id: entity.id,
      type: 'entityNode',
      position: { x: coreX, y: coreY },
      data: {
        ...entity,
        computedHeight: dims.height,
        computedWidth: dims.width,
      },
    });

    // Generate hybrid satellite role cards within compound bounding box
    const centerY = coreY + dims.height / 2;

    if (flanks.left.length > 0) {
      buildSatelliteColumn(
        {
          entityId: entity.id,
          side: 'left',
          anchorX: coreX - SATELLITE_CARD_WIDTH - HORIZONTAL_SATELLITE_GAP,
          centerY,
          groups: flanks.left,
        },
        nodes,
        edges
      );
    }

    if (flanks.right.length > 0) {
      buildSatelliteColumn(
        {
          entityId: entity.id,
          side: 'right',
          anchorX: coreX + dims.width + HORIZONTAL_SATELLITE_GAP,
          centerY,
          groups: flanks.right,
        },
        nodes,
        edges
      );
    }
  });

  // Register ownership edges
  relationships.forEach((rel) => {
    if (!entityMap.has(rel.source) || !entityMap.has(rel.target)) return;
    edges.push({
      id: rel.id,
      source: rel.source,
      sourceHandle: 'bottom-out',
      target: rel.target,
      targetHandle: 'top-in',
      type: 'ownershipEdge',
      data: {
        ownershipPercentage: rel.ownershipPercentage,
        shareClass: rel.shareClass,
        isCrossLink: rel.isCrossLink,
      },
    });
  });

  return { nodes, edges };
}
