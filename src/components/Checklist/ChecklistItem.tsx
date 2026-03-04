import { useState, type KeyboardEvent } from 'react';
import type { ChecklistItem as ChecklistItemType } from '../../types';
import { useClientContext } from '../../context/ClientContext';

interface ChecklistItemProps {
  clientId: string;
  item: ChecklistItemType;
}

export function ChecklistItem({ clientId, item }: ChecklistItemProps) {
  const { toggleChecklistItem, updateChecklistItem, removeChecklistItem } = useClientContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(item.title);

  const handleToggle = () => {
    toggleChecklistItem(clientId, item.id);
  };

  const startEditing = () => {
    setIsEditing(true);
    setEditValue(item.title);
  };

  const saveEdit = () => {
    if (editValue.trim()) {
      updateChecklistItem(clientId, item.id, { title: editValue.trim() });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(item.title);
    }
  };

  return (
    <li className="group flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
      <button
        onClick={handleToggle}
        className={`
          flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
          ${
            item.completed
              ? 'bg-green-500 border-zinc-900 dark:border-white text-white animate-checkbox-pop'
              : 'border-zinc-300 dark:border-zinc-500 hover:border-green-500 hover:scale-110 duration-100'
          }
        `}
        aria-label={item.completed ? 'Mark as incomplete' : 'Mark as complete'}
      >
        {item.completed && (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {isEditing ? (
        <input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={saveEdit}
          className="flex-1 bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
      ) : (
        <span
          onClick={startEditing}
          className={`
            flex-1 cursor-pointer
            ${item.completed ? 'line-through-animated' : 'text-gray-900 dark:text-gray-100'}
          `}
        >
          {item.title}
        </span>
      )}

      <button
        onClick={() => removeChecklistItem(clientId, item.id)}
        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
        aria-label="Delete task"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </li>
  );
}
