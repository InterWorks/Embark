import { useEffect, useState } from 'react';
import type { Client } from '../../types';
import { useTaskSuggestions, type TaskSuggestion } from '../../hooks/useTaskSuggestions';
import { useClientContext } from '../../context/ClientContext';
import { Button } from '../UI/Button';

interface TaskSuggestionsModalProps {
  client: Client;
  onClose: () => void;
}

export function TaskSuggestionsModal({ client, onClose }: TaskSuggestionsModalProps) {
  const { suggestions, isLoading, error, fetchSuggestions } = useTaskSuggestions();
  const { addChecklistItemWithData } = useClientContext();
  const [selected, setSelected] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchSuggestions(client);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSelect = (idx: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const handleAddSelected = () => {
    const now = new Date();
    suggestions.forEach((s: TaskSuggestion, idx: number) => {
      if (!selected.has(idx)) return;
      const dueDate = new Date(now.getTime() + s.dueDaysFromNow * 86400000)
        .toISOString().split('T')[0];
      addChecklistItemWithData(client.id, {
        title: s.title,
        completed: false,
        dueDate,
      });
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative glass-strong rounded-2xl shadow-2xl p-6 max-w-lg w-full border border-white/30 dark:border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">✨</span>
              <h3 className="text-lg font-bold gradient-text">AI Task Suggestions</h3>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center gap-2 py-8 justify-center text-gray-500 dark:text-gray-400">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating suggestions...
            </div>
          ) : error ? (
            <p className="text-sm text-red-500 py-4">{error}</p>
          ) : suggestions.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">No suggestions available.</p>
          ) : (
            <>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Select tasks to add to {client.name}'s checklist:
              </p>
              <ul className="space-y-2 max-h-72 overflow-y-auto">
                {suggestions.map((s, idx) => (
                  <li key={idx}>
                    <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl hover:bg-white/30 dark:hover:bg-white/10 transition-colors">
                      <input
                        type="checkbox"
                        checked={selected.has(idx)}
                        onChange={() => toggleSelect(idx)}
                        className="mt-0.5 rounded border-gray-300"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{s.title}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Due in {s.dueDaysFromNow} day{s.dueDaysFromNow !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </label>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/20">
                <span className="text-xs text-gray-500">{selected.size} selected</span>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
                  <Button size="sm" onClick={handleAddSelected} disabled={selected.size === 0}>
                    Add Selected ({selected.size})
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
