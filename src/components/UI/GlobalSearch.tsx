import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useClientContext } from '../../context/ClientContext';
import type { Client } from '../../types';

interface GlobalSearchProps {
  onSelectClient: (client: Client) => void;
}

interface SearchResult {
  type: 'client' | 'task' | 'note' | 'activity';
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  subtitle?: string;
  highlight?: string;
}

export function GlobalSearch({ onSelectClient }: GlobalSearchProps) {
  const { clients } = useClientContext();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Filter to only non-archived clients
  const activeClients = useMemo(() => clients.filter((c) => !c.archived), [clients]);

  // Search results
  const results = useMemo((): SearchResult[] => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const found: SearchResult[] = [];

    activeClients.forEach((client) => {
      // Search client name/email
      if (client.name.toLowerCase().includes(q) || client.email.toLowerCase().includes(q)) {
        found.push({
          type: 'client',
          id: client.id,
          clientId: client.id,
          clientName: client.name,
          title: client.name,
          subtitle: client.email,
          highlight: client.name.toLowerCase().includes(q) ? 'name' : 'email',
        });
      }

      // Search tasks
      client.checklist.forEach((task) => {
        if (task.title.toLowerCase().includes(q)) {
          found.push({
            type: 'task',
            id: `${client.id}-${task.id}`,
            clientId: client.id,
            clientName: client.name,
            title: task.title,
            subtitle: `Task in ${client.name}`,
          });
        }
      });

      // Search notes
      if (client.notes && client.notes.toLowerCase().includes(q)) {
        const notePreview = client.notes.substring(0, 100);
        found.push({
          type: 'note',
          id: `note-${client.id}`,
          clientId: client.id,
          clientName: client.name,
          title: 'Notes',
          subtitle: `Notes in ${client.name}`,
          highlight: notePreview,
        });
      }

      // Search services
      client.services.forEach((service) => {
        if (service.name.toLowerCase().includes(q)) {
          found.push({
            type: 'client',
            id: `service-${client.id}-${service.id}`,
            clientId: client.id,
            clientName: client.name,
            title: service.name,
            subtitle: `Service in ${client.name}`,
          });
        }
      });

      // Search activity
      (client.activityLog || []).forEach((log) => {
        if (log.description.toLowerCase().includes(q)) {
          found.push({
            type: 'activity',
            id: `activity-${client.id}-${log.id}`,
            clientId: client.id,
            clientName: client.name,
            title: log.description,
            subtitle: `Activity in ${client.name}`,
          });
        }
      });
    });

    // Limit results and sort by relevance (clients first, then tasks, then notes, then activity)
    return found.slice(0, 20);
  }, [activeClients, query]);

  // Group results by type
  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {
      client: [],
      task: [],
      note: [],
      activity: [],
    };
    results.forEach((r) => {
      groups[r.type].push(r);
    });
    return groups;
  }, [results]);

  // Flatten for keyboard navigation
  const flatResults = useMemo(() => {
    return [
      ...groupedResults.client,
      ...groupedResults.task,
      ...groupedResults.note,
      ...groupedResults.activity,
    ];
  }, [groupedResults]);

  // Handle keyboard shortcut to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Scroll selected result into view
  useEffect(() => {
    const selected = resultRefs.current[selectedIndex];
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const handleSelect = useCallback((result: SearchResult) => {
    const client = activeClients.find((c) => c.id === result.clientId);
    if (client) {
      onSelectClient(client);
      setIsOpen(false);
    }
  }, [activeClients, onSelectClient]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, flatResults.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (flatResults[selectedIndex]) {
          handleSelect(flatResults[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'client':
        return (
          <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'task':
        return (
          <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
      case 'note':
        return (
          <svg className="w-4 h-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        );
      case 'activity':
        return (
          <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'client': return 'Clients';
      case 'task': return 'Tasks';
      case 'note': return 'Notes';
      case 'activity': return 'Activity';
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden sm:inline px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-600 rounded">
          {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+K
        </kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
      <div className="fixed inset-x-4 top-20 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-xl">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search clients, tasks, notes..."
              className="flex-1 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none text-lg"
            />
            <kbd className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded">
              Esc
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {query && flatResults.length === 0 ? (
              <div className="p-8 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="mt-2 text-gray-500 dark:text-gray-400">No results found for "{query}"</p>
              </div>
            ) : !query ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <p>Start typing to search...</p>
                <p className="text-sm mt-2">Search across clients, tasks, notes, and activity</p>
              </div>
            ) : (
              <div className="py-2">
                {(['client', 'task', 'note', 'activity'] as const).map((type) => {
                  const typeResults = groupedResults[type];
                  if (typeResults.length === 0) return null;

                  return (
                    <div key={type}>
                      <p className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                        {getTypeLabel(type)}
                      </p>
                      {typeResults.map((result) => {
                        const globalIndex = flatResults.indexOf(result);
                        return (
                          <button
                            key={result.id}
                            ref={(el) => { resultRefs.current[globalIndex] = el; }}
                            onClick={() => handleSelect(result)}
                            className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                              globalIndex === selectedIndex
                                ? 'bg-blue-50 dark:bg-blue-900/30'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                            }`}
                          >
                            {getTypeIcon(result.type)}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                {result.title}
                              </p>
                              {result.subtitle && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {result.subtitle}
                                </p>
                              )}
                            </div>
                            {globalIndex === selectedIndex && (
                              <kbd className="px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-600 rounded">
                                Enter
                              </kbd>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1 bg-gray-100 dark:bg-gray-700 rounded">↑</kbd>
                <kbd className="px-1 bg-gray-100 dark:bg-gray-700 rounded">↓</kbd>
                to navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 bg-gray-100 dark:bg-gray-700 rounded">Enter</kbd>
                to select
              </span>
            </div>
            <span>{flatResults.length} results</span>
          </div>
        </div>
      </div>
    </div>
  );
}
