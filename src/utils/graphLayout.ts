import type { ChecklistItem } from '../types';

export interface GraphNode {
  id: string;
  data: { label: string; completed: boolean };
  position: { x: number; y: number };
  style?: Record<string, string | number>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  style?: Record<string, string | number>;
  animated?: boolean;
}

export interface GraphLayout {
  nodes: GraphNode[];
  edges: GraphEdge[];
  criticalPath: string[];
}

/**
 * Lays out tasks in columns based on topological order.
 * Critical path is the longest dependency chain by count.
 */
export function layoutNodes(tasks: ChecklistItem[]): GraphLayout {
  const taskMap = new Map(tasks.map(t => [t.id, t]));
  const NODE_W = 220;
  const NODE_H = 60;
  const COL_GAP = 280;
  const ROW_GAP = 80;

  // Compute in-degrees and reverse adjacency
  const inDegree = new Map<string, number>();
  const dependents = new Map<string, string[]>(); // id → tasks that depend on it

  for (const t of tasks) {
    if (!inDegree.has(t.id)) inDegree.set(t.id, 0);
    for (const dep of t.dependsOn ?? []) {
      if (!taskMap.has(dep)) continue;
      inDegree.set(t.id, (inDegree.get(t.id) ?? 0) + 1);
      if (!dependents.has(dep)) dependents.set(dep, []);
      dependents.get(dep)!.push(t.id);
    }
  }

  // Kahn's topological sort → assign columns (levels)
  const column = new Map<string, number>();
  const queue: string[] = [];

  for (const t of tasks) {
    if ((inDegree.get(t.id) ?? 0) === 0) {
      queue.push(t.id);
      column.set(t.id, 0);
    }
  }

  const tempDegree = new Map(inDegree);

  while (queue.length > 0) {
    const id = queue.shift()!;
    for (const dep of dependents.get(id) ?? []) {
      const newDeg = (tempDegree.get(dep) ?? 1) - 1;
      tempDegree.set(dep, newDeg);
      const newCol = (column.get(id) ?? 0) + 1;
      column.set(dep, Math.max(column.get(dep) ?? 0, newCol));
      if (newDeg === 0) queue.push(dep);
    }
  }

  // Group by column for row assignment
  const colGroups = new Map<number, string[]>();
  for (const t of tasks) {
    const col = column.get(t.id) ?? 0;
    if (!colGroups.has(col)) colGroups.set(col, []);
    colGroups.get(col)!.push(t.id);
  }

  // Build nodes
  const nodes: GraphNode[] = [];
  for (const [col, ids] of colGroups) {
    ids.forEach((id, row) => {
      const task = taskMap.get(id)!;
      nodes.push({
        id,
        data: { label: task.title, completed: task.completed },
        position: { x: col * COL_GAP, y: row * ROW_GAP },
        style: {
          width: NODE_W,
          height: NODE_H,
          borderRadius: 12,
          background: task.completed ? '#d1fae5' : '#f3f4f6',
          border: task.completed ? '2px solid #10b981' : '2px solid #e5e7eb',
          color: '#111827',
          fontSize: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 8,
          textAlign: 'center',
        },
      });
    });
  }

  // Build edges
  const edges: GraphEdge[] = [];
  for (const t of tasks) {
    for (const dep of t.dependsOn ?? []) {
      if (!taskMap.has(dep)) continue;
      edges.push({
        id: `${dep}->${t.id}`,
        source: dep,
        target: t.id,
      });
    }
  }

  // Critical path: longest chain by DFS from each root
  const criticalPath = computeCriticalPath(tasks, dependents, column);

  // Highlight critical path edges
  const critSet = new Set(criticalPath);
  for (const edge of edges) {
    if (critSet.has(edge.source) && critSet.has(edge.target)) {
      edge.style = { stroke: '#ef4444', strokeWidth: 2 };
      edge.animated = true;
    }
  }

  return { nodes, edges, criticalPath };
}

function computeCriticalPath(
  tasks: ChecklistItem[],
  dependents: Map<string, string[]>,
  column: Map<string, number>,
): string[] {
  // Find node with highest column (end of longest chain)
  let maxCol = 0;
  let endId = '';
  for (const t of tasks) {
    const col = column.get(t.id) ?? 0;
    if (col > maxCol) { maxCol = col; endId = t.id; }
  }
  if (!endId) return [];

  // Trace back using dependsOn to find the path
  const path: string[] = [endId];
  let current = endId;
  while (true) {
    const task = tasks.find(t => t.id === current);
    if (!task || !task.dependsOn?.length) break;
    // Pick predecessor with highest column
    let bestPred = '';
    let bestCol = -1;
    for (const pred of task.dependsOn) {
      const col = column.get(pred) ?? -1;
      if (col > bestCol) { bestCol = col; bestPred = pred; }
    }
    if (!bestPred) break;
    path.unshift(bestPred);
    current = bestPred;
  }
  return path;
}
