import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { ReactNode } from 'react';
import type { TaskStatus } from '../../types';

const columnStyles: Record<TaskStatus, { dot: string; ring: string }> = {
  'todo':        { dot: 'from-gray-400 to-gray-500',     ring: 'ring-gray-400/30' },
  'in-progress': { dot: 'from-blue-400 to-indigo-500',   ring: 'ring-blue-400/30' },
  'blocked':     { dot: 'from-red-400 to-rose-500',      ring: 'ring-red-400/30' },
  'done':        { dot: 'from-emerald-400 to-green-500', ring: 'ring-emerald-400/30' },
};

interface TaskKanbanColumnProps {
  id: TaskStatus;
  title: string;
  itemIds: string[];
  children: ReactNode;
}

export function TaskKanbanColumn({ id, title, itemIds, children }: TaskKanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const styles = columnStyles[id];

  return (
    <div
      ref={setNodeRef}
      className={`glass rounded-2xl p-4 min-h-[400px] transition-all ${isOver ? `ring-2 ${styles.ring}` : ''}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${styles.dot} shadow-lg`} />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        </div>
        <span className="px-2.5 py-0.5 glass-subtle text-gray-600 dark:text-gray-400 rounded-full text-sm font-medium">
          {itemIds.length}
        </span>
      </div>
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">{children}</div>
      </SortableContext>
    </div>
  );
}
