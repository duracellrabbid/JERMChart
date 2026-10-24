export interface MinimalRelationship {
  source: string;
  target: string;
}

function buildAdjacencyMap(relationships: MinimalRelationship[]): Map<string, string[]> {
  const adj = new Map<string, string[]>();
  for (const rel of relationships) {
    const list = adj.get(rel.source) ?? [];
    list.push(rel.target);
    adj.set(rel.source, list);
  }
  return adj;
}

function isReachable(
  startNode: string,
  targetNode: string,
  adj: Map<string, string[]>
): boolean {
  const visited = new Set<string>([startNode]);
  const queue: string[] = [startNode];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === targetNode) {
      return true;
    }

    const unvisitedNeighbors = (adj.get(current) ?? []).filter((n) => !visited.has(n));
    for (const neighbor of unvisitedNeighbors) {
      visited.add(neighbor);
      queue.push(neighbor);
    }
  }

  return false;
}

/**
 * Checks if adding a directed edge from sourceId to targetId introduces a cycle.
 * Runs in linear O(V + E) time using Breadth-First Search.
 * Cognitive complexity is strictly below 15.
 */
export function isCycleIntroducingEdge(
  sourceId: string,
  targetId: string,
  relationships: MinimalRelationship[]
): boolean {
  if (sourceId === targetId) {
    return true;
  }
  const adj = buildAdjacencyMap(relationships);
  return isReachable(targetId, sourceId, adj);
}
