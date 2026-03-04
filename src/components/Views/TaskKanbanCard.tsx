import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ChecklistItem } from '../../types';
import { getEffectiveStatus } from '../../utils/helpers';

const priorityColors: Record<string, string> = {
  high:   'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  low:    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  none:   'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

interface TaskKanbanCardProps {
  item: ChecklistItem;
  clientName: string;
  clientColor?: string;
  onClick: () => void;
  isDragging?: boolean;
}

export function TaskKanbanCard({ item, clientName, clientColor, onClick, isDragging }: TaskKanbanCardProps) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging: isSortableDragging } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.4 : 1,
  };

  const status = getEffectiveStatus(item);
  const completedSubtasks = (item.subtasks ?? []).filter(s => s.completed).length;
  const totalSubtasks = (item.subtasks ?? []).length;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`
        glass-subtle rounded-xl p-3 cursor-pointer select-none
        hover:ring-1 hover:ring-purple-400/40 transition-all
        ${isDragging ? 'shadow-2xl rotate-1' : ''}
        ${status === 'blocked' ? 'border-l-4 border-red-500' : ''}
      `}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className={`text-sm font-medium leading-snug text-gray-900 dark:text-gray-100 line-clamp-2 ${item.completed ? 'line-through text-gray-400 dark:text-gray-500' : ''}`}>
          {item.title}
        </p>
        {item.priority && item.priority !== 'none' && (
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0 ${priorityColors[item.priority ?? 'none']}`}>
            {item.priority}
          </span>
        )}
      </div>

      <div className="flex items-center flex-wrap gap-1.5 mt-2">
        {/* Client badge */}
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium text-white truncate max-w-[120px]"
          style={{ background: clientColor ?? '#8b5cf6' }}
        >
          {clientName}
        </span>

        {/* Due date */}
        {item.dueDate && (
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium
            ${new Date(item.dueDate) < new Date() && !item.completed
              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
            }`}>
            {new Date(item.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}

        {/* Subtask chip */}
        {totalSubtasks > 0 && (
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium
            ${completedSubtasks === totalSubtasks
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
            }`}>
            {completedSubtasks}/{totalSubtasks}
          </span>
        )}
      </div>
    </div>
  );
}
