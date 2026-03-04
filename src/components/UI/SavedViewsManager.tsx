import { useState } from 'react';
import type { SavedView } from '../../hooks/useSavedViews';
import { Button } from './Button';

const EMOJI_OPTIONS = ['📋', '⭐', '🔥', '✅', '📌', '🎯', '💼', '🚀'];

interface SavedViewsManagerProps {
  savedViews: SavedView[];
  pinnedViews: SavedView[];
  currentFilters: {
    statusFilter: string;
    assigneeFilter: string;
    searchQuery: string;
  };
  onSaveView: (name: string, emoji?: string) => void;
  onLoadView: (view: SavedView) => void;
  onDeleteView: (id: string) => void;
  onPinView: (id: string) => void;
  onSetDefault: (id: string) => void;
}

export function SavedViewsManager({
  savedViews,
  pinnedViews,
  currentFilters,
  onSaveView,
  onLoadView,
  onDeleteView,
  onPinView,
  onSetDefault,
}: SavedViewsManagerProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState<string | undefined>(undefined);

  const hasActiveFilters =
    currentFilters.statusFilter !== 'all' ||
    currentFilters.assigneeFilter !== 'all' ||
    currentFilters.searchQuery !== '';

  const handleSave = () => {
    if (!newViewName.trim()) return;
    onSaveView(newViewName.trim(), selectedEmoji);
    setNewViewName('');
    setSelectedEmoji(undefined);
    setShowSaveDialog(false);
    setShowDropdown(false);
  };

  const close = () => {
    setShowDropdown(false);
    setShowSaveDialog(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold bg-white dark:bg-zinc-800 border-2 border-zinc-300 dark:border-zinc-600 rounded-[4px] hover:border-zinc-900 dark:hover:border-white transition-colors text-zinc-700 dark:text-zinc-300"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        Views
        {savedViews.length > 0 && (
          <span className="bg-yellow-400 text-zinc-900 text-xs font-black px-1.5 py-0.5 rounded-[2px]">
            {savedViews.length}
          </span>
        )}
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showDropdown && (
        <>
          <div className="fixed inset-0 z-10" onClick={close} />
          <div className="absolute right-0 mt-1 w-72 bg-white dark:bg-zinc-800 border-2 border-zinc-900 dark:border-zinc-600 shadow-[4px_4px_0_0_#18181b] dark:shadow-[4px_4px_0_0_#52525b] rounded-[4px] z-20">
            {showSaveDialog ? (
              <div className="p-3 border-b-2 border-zinc-200 dark:border-zinc-700 space-y-2">
                <input
                  type="text"
                  value={newViewName}
                  onChange={(e) => setNewViewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  placeholder="View name..."
                  className="w-full px-2 py-1.5 text-sm border-2 border-zinc-300 dark:border-zinc-600 rounded-[4px] bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-yellow-400"
                  autoFocus
                />
                <div className="flex gap-1 flex-wrap">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() =>
                        setSelectedEmoji(selectedEmoji === emoji ? undefined : emoji)
                      }
                      className={`w-8 h-8 text-base rounded-[4px] border-2 transition-colors ${
                        selectedEmoji === emoji
                          ? 'border-yellow-400 bg-yellow-50 dark:bg-zinc-700'
                          : 'border-zinc-200 dark:border-zinc-600 hover:border-zinc-400'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave} disabled={!newViewName.trim()}>
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setShowSaveDialog(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-2 border-b-2 border-zinc-200 dark:border-zinc-700">
                <button
                  onClick={() => setShowSaveDialog(true)}
                  disabled={!hasActiveFilters}
                  className="w-full px-3 py-2 text-left text-sm font-bold hover:bg-yellow-50 dark:hover:bg-zinc-700 rounded-[4px] flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="text-zinc-700 dark:text-zinc-300">
                    {hasActiveFilters ? '+ Save current view' : 'Set filters to save a view'}
                  </span>
                </button>
              </div>
            )}

            {pinnedViews.length > 0 && (
              <div className="px-3 py-1.5 text-xs text-zinc-500 border-b border-zinc-100 dark:border-zinc-700">
                {pinnedViews.length}/5 pinned to sidebar
              </div>
            )}

            <div className="max-h-72 overflow-y-auto">
              {savedViews.length === 0 ? (
                <div className="p-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
                  No saved views yet
                </div>
              ) : (
                <div className="py-1">
                  {savedViews.map((view) => (
                    <div
                      key={view.id}
                      className="flex items-center px-2 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-700 group"
                    >
                      <button
                        onClick={() => {
                          onLoadView(view);
                          close();
                        }}
                        className="flex-1 flex items-center gap-2 text-left min-w-0"
                      >
                        {view.emoji && <span className="text-sm">{view.emoji}</span>}
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate flex items-center gap-1">
                            {view.name}
                            {view.isDefault && (
                              <span className="text-yellow-500 text-xs">★</span>
                            )}
                          </p>
                          <p className="text-xs text-zinc-500 truncate">
                            {[
                              view.filters.statusFilter !== 'all' &&
                                `Status: ${view.filters.statusFilter}`,
                              view.filters.assigneeFilter !== 'all' &&
                                `Assignee: ${view.filters.assigneeFilter}`,
                              view.filters.searchQuery && `"${view.filters.searchQuery}"`,
                            ]
                              .filter(Boolean)
                              .join(' · ') || 'All clients'}
                          </p>
                        </div>
                      </button>
                      <button
                        onClick={() => onPinView(view.id)}
                        title={view.isPinned ? 'Unpin from sidebar' : 'Pin to sidebar'}
                        className={`p-1 rounded transition-colors text-sm ${
                          view.isPinned
                            ? 'text-yellow-500'
                            : 'text-zinc-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 hover:text-zinc-500'
                        }`}
                      >
                        📌
                      </button>
                      <button
                        onClick={() => onSetDefault(view.id)}
                        title={view.isDefault ? 'Remove default' : 'Set as default'}
                        className={`p-1 rounded transition-colors ${
                          view.isDefault
                            ? 'text-yellow-500'
                            : 'text-zinc-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 hover:text-zinc-500'
                        }`}
                      >
                        ★
                      </button>
                      <button
                        onClick={() => onDeleteView(view.id)}
                        className="p-1 text-zinc-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-colors rounded"
                        title="Delete view"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
