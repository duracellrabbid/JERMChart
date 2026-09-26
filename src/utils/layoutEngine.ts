import dagre from '@dagrejs/dagre';
import { Node, Edge } from '@xyflow/react';
import {
  EntityNodeData,
  EntityType,
  OwnershipEdgeData,
  SiblingSortCriteria,
} from '../types/structure';

export const CARD_WIDTH = 280;
export const BASE_CARD_HEIGHT = 160;
export const DIRECTOR_ROW_HEIGHT = 24;

export const TRUST_ASPECT_RATIO = 1.25;
export const TRUST_CARD_WIDTH = 350;
export const TRUST_CARD_HEIGHT = 280;
export const SUBSIDIARY_CARD_SIZE = 220;

function getNameLinesHeight(nameLen: number): number {
  if (nameLen > 42) return 52;
  if (nameLen > 20) return 36;
  return 20;
}

function getTrustBaseHeight(visibleDirectors: number, isCapped: boolean, hasUBO: boolean): number {
  const directorRowsHeight = Math.max(0, visibleDirectors) * 22;
  const overflowHeight = isCapped ? 20 : 0;
  const uboHeight = hasUBO ? 22 : 0;
  return 18 + directorRowsHeight + overflowHeight + uboHeight + 10;
}

export function calculateTrustDimensions(
  entity: EntityNodeData,
  cap: number | 'all' = 3
): { width: number; height: number } {
  const nameLen = entity.name ? entity.name.length : 0;
  const nameLinesHeight = getNameLinesHeight(nameLen);
  const regNoHeight = entity.registrationNumber ? 14 : 0;
  const hMid = nameLinesHeight + regNoHeight + 20;

  const totalDirectors = entity.directors ? entity.directors.length : 0;
  const isCapped = cap !== 'all' && totalDirectors > cap;
  const visibleDirectors = isCapped ? (cap as number) : totalDirectors;
  const hasUBO = Boolean(entity.ubosOrBeneficiaries && entity.ubosOrBeneficiaries.length > 0);

  const hBase = getTrustBaseHeight(visibleDirectors, isCapped, hasUBO);

  // Geometric constraint: For a base box of width 220px to fit at depth
  // y_base_top = H - hBase - 16 with 18px clearance from each diagonal leg:
  // w(y_base_top) = W * (y_base_top / H) >= 220 + 36 = 256.
  // With W = 1.25 * H, 1.25 * (H - hBase - 16) >= 256 => H >= 256/1.25 + hBase + 16 = 221 + hBase.
  const hBaseReq = 221 + hBase;
  const hMidReq = 88 + hMid + hBase;

  const rawHeight = Math.max(hBaseReq, hMidReq);
  const height = Math.max(TRUST_CARD_HEIGHT, Math.round(rawHeight));
  const width = Math.max(TRUST_CARD_WIDTH, Math.round(height * TRUST_ASPECT_RATIO));

  return { width, height };
}

export function calculateSubsidiaryDimensions(
  entity?: EntityNodeData,
  _cap: number | 'all' = 3,
  isExportMode: boolean = false
): { width: number; height: number } {
  if (!entity) {
    return { width: SUBSIDIARY_CARD_SIZE, height: SUBSIDIARY_CARD_SIZE };
  }

  const totalDirectors = entity.directors ? entity.directors.length : 0;
  if (isExportMode && totalDirectors > 3) {
    const extraDirectors = totalDirectors - 3;
    const expandedHeight = SUBSIDIARY_CARD_SIZE + extraDirectors * 22;
    return { width: SUBSIDIARY_CARD_SIZE, height: expandedHeight };
  }

  return { width: SUBSIDIARY_CARD_SIZE, height: SUBSIDIARY_CARD_SIZE };
}

export function getEntityDimensions(
  type: EntityType,
  entity?: EntityNodeData,
  cap: number | 'all' = 3,
  isExportMode: boolean = false
): { width: number; height: number } {
  if (type === 'Trust' || type === 'Trust Company') {
    if (entity) {
      const activeCap = isExportMode ? 'all' : cap;
      return calculateTrustDimensions(entity, activeCap);
    }
    return { width: TRUST_CARD_WIDTH, height: TRUST_CARD_HEIGHT };
  }
  return calculateSubsidiaryDimensions(entity, cap, isExportMode);
}

export function calculateCardHeight(directorCount: number): number {
  return BASE_CARD_HEIGHT + Math.max(0, directorCount) * DIRECTOR_ROW_HEIGHT;
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
      // Find incoming ownership percentage
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

export function calculateSortedLayout(
  entities: EntityNodeData[],
  relationships: OwnershipEdgeData[],
  sortCriteria: SiblingSortCriteria = 'alphabetical',
  cap: number | 'all' = 3,
  isExportMode: boolean = false
): { nodes: Node[]; edges: Edge[] } {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: 'TB',
    nodesep: 60,
    ranksep: 90,
    align: 'DL',
  });

  // Group children by parent to order siblings
  const parentToChildren = new Map<string, EntityNodeData[]>();
  const entityMap = new Map<string, EntityNodeData>();
  entities.forEach((e) => entityMap.set(e.id, e));

  relationships.forEach((rel) => {
    const child = entityMap.get(rel.target);
    if (child) {
      const existing = parentToChildren.get(rel.source) || [];
      existing.push(child);
      parentToChildren.set(rel.source, existing);
    }
  });

  // Sort siblings under each parent
  parentToChildren.forEach((children, parentId) => {
    parentToChildren.set(
      parentId,
      sortSiblingEntities(children, relationships, sortCriteria, parentId)
    );
  });

  // Register nodes with dynamic dimensions
  entities.forEach((entity) => {
    const dims = getEntityDimensions(entity.type, entity, cap, isExportMode);
    dagreGraph.setNode(entity.id, {
      width: dims.width,
      height: dims.height,
    });
  });

  // Register sorted edges into Dagre
  const registeredEdgeKeys = new Set<string>();

  // Add edges parent by parent in sorted order
  entities.forEach((parent) => {
    const sortedChildren = parentToChildren.get(parent.id) || [];
    sortedChildren.forEach((child) => {
      dagreGraph.setEdge(parent.id, child.id);
      registeredEdgeKeys.add(`${parent.id}->${child.id}`);
    });
  });

  // Add remaining cross-links or edges
  relationships.forEach((rel) => {
    const key = `${rel.source}->${rel.target}`;
    if (!registeredEdgeKeys.has(key)) {
      dagreGraph.setEdge(rel.source, rel.target);
    }
  });

  // Run dagre layout calculation
  dagre.layout(dagreGraph);

  // Map to React Flow Nodes
  const nodes: Node[] = entities.map((entity) => {
    const nodeWithPosition = dagreGraph.node(entity.id);
    const dims = getEntityDimensions(entity.type, entity, cap, isExportMode);

    return {
      id: entity.id,
      type: 'entityNode',
      position: {
        x: nodeWithPosition.x - dims.width / 2,
        y: nodeWithPosition.y - dims.height / 2,
      },
      data: {
        ...entity,
        computedHeight: dims.height,
        computedWidth: dims.width,
        directorCap: isExportMode ? 'all' : cap,
        isExportMode,
      },
    };
  });

  // Map to React Flow Edges
  const edges: Edge[] = relationships.map((rel) => ({
    id: rel.id,
    source: rel.source,
    target: rel.target,
    type: 'ownershipEdge',
    data: {
      ownershipPercentage: rel.ownershipPercentage,
      shareClass: rel.shareClass,
      isCrossLink: rel.isCrossLink,
    },
  }));

  return { nodes, edges };
}
