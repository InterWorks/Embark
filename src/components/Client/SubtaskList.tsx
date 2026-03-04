import { useState, type KeyboardEvent } from 'react';
import type { ChecklistItem, Subtask } from '../../types';
import { useClientContext } from '../../context/ClientContext';

interface SubtaskListProps {
  clientId: string;
  item: ChecklistItem;
}

export function SubtaskList({ clientId, item }: SubtaskListProps) {
  const { addSubtask, toggleSubtask, removeSubtask, updateSubtask } = useClientContext();
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const subtasks: Subtask[] = item.subtasks ?? [];
  const completed = subtasks.filter(s => s.completed).length;
  const total = subtasks.length;

  const handleAdd = () => {
    if (newTitle.trim()) {
      addSubtask(clientId, item.id, newTitle.trim());
      setNewTitle('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); handleAdd(); }
    else if (e.key === 'Escape') setNewTitle('');
  };

  const startEdit = (subtask: Subtask) => {
    setEditingId(subtask.id);
    setEditingValue(subtask.title);
  };

  const saveEdit = () => {
    if (editingId && editingValue.trim()) {
      updateSubtask(clientId, item.id, editingId, { title: editingValue.trim() });
    }
    setEditingId(null);
    setEditingValue('');
  };

  const handleEditKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); saveEdit(); }
    else if (e.key === 'Escape') { setEditingId(null); setEditingValue(''); }
  };

  return (
    <div className="space-y-2">
      {total > 0 && (
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 bg-white/30 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full transition-all"
              style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
            {completed}/{total} subtasks
          </span>
        </div>
      )}

      {total > 0 && (
        <ul className="space-y-1.5 mb-2">
          {subtasks.map(subtask => (
            <li key={subtask.id} className="flex items-center gap-2 group/subtask">
              <button
                onClick={() => toggleSubtask(clientId, item.id, subtask.id)}
                className={`flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                  subtask.completed
                    ? 'bg-gradient-to-r from-emerald-400 to-green-500 border-transparent text-white'
                    : 'border-gray-300 dark:border-gray-500 hover:border-purple-500'
                }`}
              >
                {subtask.completed && (
                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>

              {editingId === subtask.id ? (
                <input
                  value={editingValue}
                  onChange={e => setEditingValue(e.target.value)}
                  onKeyDown={handleEditKeyDown}
                  onBlur={saveEdit}
                  className="flex-1 bg-white/50 dark:bg-white/10 px-2 py-0.5 rounded text-sm border border-purple-300 dark:border-purple-500 outline-none"
                  autoFocus
                />
              ) : (
                <span
                  onClick={() => startEdit(subtask)}
                  className={`flex-1 text-sm cursor-pointer ${
                    subtask.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {subtask.title}
                </span>
              )}

              <button
                onClick={() => removeSubtask(clientId, item.id, subtask.id)}
                className="opacity-0 group-hover/subtask:opacity-100 p-0.5 text-gray-400 hover:text-red-500 transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-2">
        <input
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a subtask..."
          className="flex-1 bg-white/50 dark:bg-white/10 px-3 py-1.5 rounded-lg text-sm border border-white/30 dark:border-white/10 outline-none focus:ring-2 focus:ring-purple-500/50 placeholder-gray-400"
        />
        <button
          onClick={handleAdd}
          disabled={!newTitle.trim()}
          className="p-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg disabled:opacity-50 hover:opacity-90 transition-opacity shadow-lg"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  );
}
