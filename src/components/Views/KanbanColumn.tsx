import { useDroppable } from '@dnd-kit/core';
import type { ReactNode } from 'react';

interface KanbanColumnProps {
  id: string;
  title: string;
  count: number;
  color: string;
  children: ReactNode;
}

const columnGradients: Record<string, string> = {
  active: 'from-emerald-400 to-green-500',
  'on-hold': 'from-amber-400 to-orange-500',
  completed: 'from-blue-400 to-indigo-500',
};

export function KanbanColumn({ id, title, count, children }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`
        glass rounded-2xl p-4 min-h-[400px]
        ${isOver ? 'ring-2 ring-purple-500/50' : ''}
        transition-all
      `}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${columnGradients[id] || 'from-gray-400 to-gray-500'} shadow-lg`} />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        </div>
        <span className="px-2.5 py-0.5 glass-subtle text-gray-600 dark:text-gray-400 rounded-full text-sm font-medium">
          {count}
        </span>
      </div>
      {children}
    </div>
  );
}
