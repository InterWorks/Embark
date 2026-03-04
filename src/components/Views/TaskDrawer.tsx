import { useEffect, useRef } from 'react';
import type { ChecklistItem, Client } from '../../types';
import { getEffectiveStatus } from '../../utils/helpers';
import { useClientContext } from '../../context/ClientContext';

interface TaskDrawerProps {
  item: ChecklistItem;
  client: Client;
  onClose: () => void;
}

const statusLabels: Record<string, string> = {
  'todo': 'To Do',
  'in-progress': 'In Progress',
  'blocked': 'Blocked',
  'done': 'Done',
};

export function TaskDrawer({ item, client, onClose }: TaskDrawerProps) {
  const { updateChecklistItemStatus } = useClientContext();
  const drawerRef = useRef<HTMLDivElement>(null);
  const status = getEffectiveStatus(item);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="fixed right-0 top-0 h-full w-96 glass border-l border-white/20 z-50 overflow-y-auto p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-tight pr-4">
            {item.title}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 shrink-0 mt-0.5">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Client */}
        <div className="mb-4">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Client</span>
          <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">{client.name}</p>
        </div>

        {/* Status selector */}
        <div className="mb-4">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</span>
          <div className="flex gap-2 mt-2 flex-wrap">
            {(['todo', 'in-progress', 'blocked', 'done'] as const).map(s => (
              <button
                key={s}
                onClick={() => updateChecklistItemStatus(client.id, item.id, s)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all
                  ${status === s
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'glass-subtle text-gray-600 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900/30'
                  }`}
              >
                {statusLabels[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Due date */}
        {item.dueDate && (
          <div className="mb-4">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Due Date</span>
            <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
              {new Date(item.dueDate).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        )}

        {/* Subtasks */}
        {(item.subtasks ?? []).length > 0 && (
          <div className="mb-4">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Subtasks ({(item.subtasks ?? []).filter(s => s.completed).length}/{(item.subtasks ?? []).length})
            </span>
            <div className="mt-2 space-y-1.5">
              {(item.subtasks ?? []).map(st => (
                <div key={st.id} className="flex items-center gap-2 text-sm">
                  <span className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${st.completed ? 'bg-emerald-500' : 'border border-gray-300 dark:border-gray-600'}`}>
                    {st.completed && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  <span className={`${st.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>{st.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comments */}
        {(item.comments ?? []).length > 0 && (
          <div className="mb-4">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Comments ({(item.comments ?? []).length})</span>
            <div className="mt-2 space-y-2">
              {(item.comments ?? []).slice(-3).map(c => (
                <div key={c.id} className="glass-subtle rounded-lg p-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{c.author}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{c.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Block reason */}
        {item.isBlocked && item.blockReason && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
            <span className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide">Blocked</span>
            <p className="mt-1 text-sm text-red-600 dark:text-red-300">{item.blockReason}</p>
          </div>
        )}
      </div>
    </>
  );
}
