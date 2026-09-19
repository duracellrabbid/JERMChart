import dagre from '@dagrejs/dagre';
import { Node, Edge } from '@xyflow/react';
import {
  EntityNodeData,
  OwnershipEdgeData,
  SiblingSortCriteria,
} from '../types/structure';

export const CARD_WIDTH = 280;
export const BASE_CARD_HEIGHT = 160;
export const DIRECTOR_ROW_HEIGHT = 24;

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
  sortCriteria: SiblingSortCriteria = 'alphabetical'
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
    const height = calculateCardHeight(entity.directors.length);
    dagreGraph.setNode(entity.id, {
      width: CARD_WIDTH,
      height,
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
    const height = calculateCardHeight(entity.directors.length);

    return {
      id: entity.id,
      type: 'entityNode',
      position: {
        x: nodeWithPosition.x - CARD_WIDTH / 2,
        y: nodeWithPosition.y - height / 2,
      },
      data: {
        ...entity,
        computedHeight: height,
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
