import { useMemo, useCallback } from 'react';
import { ReactFlow, Background, Controls, MiniMap } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { ChecklistItem } from '../../types';
import { layoutNodes } from '../../utils/graphLayout';

interface DependencyGraphProps {
  tasks: ChecklistItem[];
  onNodeClick?: (taskId: string) => void;
}

export function DependencyGraph({ tasks, onNodeClick }: DependencyGraphProps) {
  const { nodes, edges } = useMemo(() => layoutNodes(tasks), [tasks]);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: { id: string }) => {
    onNodeClick?.(node.id);
  }, [onNodeClick]);

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400 text-sm">
        No tasks with dependencies found.
      </div>
    );
  }

  return (
    <div className="h-96 rounded-xl overflow-hidden border border-white/20 dark:border-white/10">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodeClick={handleNodeClick}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        attributionPosition="bottom-right"
      >
        <Background gap={16} size={1} color="#e5e7eb" />
        <Controls showInteractive={false} />
        <MiniMap nodeStrokeWidth={2} zoomable pannable />
      </ReactFlow>
    </div>
  );
}
