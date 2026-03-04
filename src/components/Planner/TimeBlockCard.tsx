import type { TimeBlock, Client } from '../../types';

interface TimeBlockCardProps {
  block: TimeBlock;
  clients: Client[];
  onEdit: (block: TimeBlock) => void;
  onDelete: (blockId: string) => void;
  compact?: boolean;
}

export function TimeBlockCard({
  block,
  clients,
  onEdit,
  onDelete,
  compact = false,
}: TimeBlockCardProps) {
  const startTime = new Date(block.startTime);
  const endTime = new Date(block.endTime);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const client = block.clientId ? clients.find((c) => c.id === block.clientId) : null;
  const task = client && block.taskId
    ? client.checklist.find((t) => t.id === block.taskId)
    : null;

  if (compact) {
    return (
      <div
        onClick={() => onEdit(block)}
        className={`group relative px-2 py-1.5 rounded-lg bg-gradient-to-r ${block.color || 'from-violet-500 to-purple-500'} cursor-pointer hover:shadow-md transition-shadow`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">
              {block.title}
            </p>
            <p className="text-xs text-white/80">
              {formatTime(startTime)} - {formatTime(endTime)}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(block.id);
            }}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/20 rounded transition-all"
          >
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group relative p-3 rounded-xl bg-gradient-to-r ${block.color || 'from-violet-500 to-purple-500'} shadow-lg hover:shadow-xl transition-shadow`}
    >
      {/* Header with title and actions */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-medium text-white flex-1 min-w-0 truncate">
          {block.title}
        </h4>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(block)}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            title="Edit"
          >
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(block.id)}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            title="Delete"
          >
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Time */}
      <div className="flex items-center gap-2 text-white/90 text-sm mb-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{formatTime(startTime)} - {formatTime(endTime)}</span>
      </div>

      {/* Client Badge */}
      {client && (
        <div className="flex items-center gap-2 text-white/90 text-sm mb-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="truncate">{client.name}</span>
        </div>
      )}

      {/* Task Badge */}
      {task && (
        <div className="flex items-center gap-2 text-white/90 text-sm mb-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <span className="truncate">{task.title}</span>
        </div>
      )}

      {/* Notes preview */}
      {block.notes && (
        <p className="text-white/80 text-sm mt-2 line-clamp-2">
          {block.notes}
        </p>
      )}
    </div>
  );
}
