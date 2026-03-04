import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Client, Priority } from '../../types';
import { useClientContext } from '../../context/ClientContext';

interface KanbanCardProps {
  client: Client;
  onClick: () => void;
  isDragging?: boolean;
}

const priorityColors: Record<Priority, string> = {
  high:   'bg-red-600',
  medium: 'bg-orange-500',
  low:    'bg-blue-600',
  none:   'bg-transparent',
};

export function KanbanCard({ client, onClick, isDragging }: KanbanCardProps) {
  const { getTagById } = useClientContext();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: client.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const completed = client.checklist.filter((t) => t.completed).length;
  const total = client.checklist.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  const clientTags = (client.tags || []).map((tagId) => getTagById(tagId)).filter(Boolean);

  const overdueTasks = client.checklist.filter((t) => {
    if (t.completed || !t.dueDate) return false;
    return new Date(t.dueDate) < new Date(new Date().toDateString());
  }).length;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`
        glass-card p-4 cursor-pointer transition-all duration-100
        ${isSortableDragging || isDragging
          ? 'opacity-70 rotate-2 shadow-[8px_8px_0_0_#18181b] dark:shadow-[8px_8px_0_0_#ffffff] scale-105'
          : 'hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#18181b] dark:hover:shadow-[6px_6px_0_0_#ffffff]'
        }
      `}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate flex-1">
          {client.name}
        </h4>
        {client.priority && client.priority !== 'none' && (
          <div
            className={`w-2 h-2 rounded-full ml-2 flex-shrink-0 ${priorityColors[client.priority]}`}
            title={`${client.priority} priority`}
          />
        )}
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 truncate">
        {client.assignedTo}
      </p>

      {clientTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {clientTags.slice(0, 3).map((tag) => (
            <span
              key={tag!.id}
              className="px-1.5 py-0.5 rounded text-xs font-medium text-white"
              style={{ backgroundColor: tag!.color }}
            >
              {tag!.name}
            </span>
          ))}
          {clientTags.length > 3 && (
            <span className="text-xs text-gray-400">+{clientTags.length - 3}</span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <div className="w-16 bg-white/30 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-1.5 rounded-full ${progress === 100 ? 'bg-gradient-to-r from-emerald-400 to-green-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-gray-500 dark:text-gray-400 text-xs">
            {completed}/{total}
          </span>
        </div>
        {overdueTasks > 0 && (
          <span className="text-xs text-red-500 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {overdueTasks}
          </span>
        )}
      </div>
    </div>
  );
}
