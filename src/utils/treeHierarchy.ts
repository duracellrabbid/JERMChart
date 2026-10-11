import { EntityNodeData, OwnershipEdgeData } from '../types/structure';

export interface HierarchyNode {
  entity: EntityNodeData;
  depth: number;
  primaryParentId?: string;
  ownershipPercentage?: number;
  additionalParentsCount: number;
  children: HierarchyNode[];
}

/**
 * Finds the primary parent relationship for a given entity:
 * the relationship where target === entity.id with the highest ownership percentage.
 */
export function getPrimaryParentRelationship(
  entityId: string,
  relationships: OwnershipEdgeData[],
  entityIdSet: Set<string>
): OwnershipEdgeData | undefined {
  const incoming = relationships.filter(
    (r) => r.target === entityId && entityIdSet.has(r.source)
  );

  if (incoming.length === 0) {
    return undefined;
  }

  // Sort descending by ownershipPercentage (treating undefined/null as 0)
  return incoming.slice().sort((a, b) => {
    const pctA = a.ownershipPercentage ?? 0;
    const pctB = b.ownershipPercentage ?? 0;
    return pctB - pctA;
  })[0];
}

/**
 * Calculates how many additional parent relationships exist for an entity beyond the primary parent.
 */
export function getAdditionalParentsCount(
  entityId: string,
  relationships: OwnershipEdgeData[],
  entityIdSet: Set<string>
): number {
  const incomingCount = relationships.filter(
    (r) => r.target === entityId && entityIdSet.has(r.source)
  ).length;

  return incomingCount > 1 ? incomingCount - 1 : 0;
}

/**
 * Builds a hierarchical forest structure of entities based on primary ownership relationships.
 * Safe against cycles/infinite loops via visited set.
 * Cognitive complexity strictly < 15.
 */
export function buildEntityHierarchy(
  entities: EntityNodeData[],
  relationships: OwnershipEdgeData[]
): HierarchyNode[] {
  const entityIdSet = new Set(entities.map((e) => e.id));
  const entityMap = new Map<string, EntityNodeData>(entities.map((e) => [e.id, e]));

  // 1. Group entities by their primary parent ID
  const primaryParentMap = new Map<string, OwnershipEdgeData | undefined>();
  const childrenByParent = new Map<string, string[]>();

  for (const entity of entities) {
    const primaryRel = getPrimaryParentRelationship(entity.id, relationships, entityIdSet);
    primaryParentMap.set(entity.id, primaryRel);

    if (primaryRel) {
      const parentId = primaryRel.source;
      const existing = childrenByParent.get(parentId) ?? [];
      existing.push(entity.id);
      childrenByParent.set(parentId, existing);
    }
  }

  // 2. Identify root entities (entities without a valid primary parent in the entity set)
  const rootEntities = entities.filter((e) => !primaryParentMap.get(e.id));

  // 3. Recursive node builder with cycle protection
  const visited = new Set<string>();

  function buildNode(entity: EntityNodeData, depth: number): HierarchyNode {
    visited.add(entity.id);

    const primaryRel = primaryParentMap.get(entity.id);
    const childIds = childrenByParent.get(entity.id) ?? [];
    
    // Filter out already visited nodes to prevent cycles
    const validChildren = childIds
      .filter((id) => !visited.has(id))
      .map((id) => entityMap.get(id))
      .filter((e): e is EntityNodeData => e !== undefined);

    const children = validChildren.map((child) => buildNode(child, depth + 1));

    return {
      entity,
      depth,
      primaryParentId: primaryRel?.source,
      ownershipPercentage: primaryRel?.ownershipPercentage,
      additionalParentsCount: getAdditionalParentsCount(entity.id, relationships, entityIdSet),
      children,
    };
  }

  const forest: HierarchyNode[] = rootEntities.map((root) => buildNode(root, 0));

  // 4. Handle any disconnected cycles or orphans that were not reachable from rootEntities
  for (const entity of entities) {
    if (!visited.has(entity.id)) {
      forest.push(buildNode(entity, 0));
    }
  }

  return forest;
}
