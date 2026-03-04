import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useClientContext } from '../../context/ClientContext';
import type { View, Client } from '../../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: View) => void;
  onSelectClient: (client: Client) => void;
  onAddClient: () => void;
}

interface CommandItem {
  id: string;
  type: 'navigation' | 'client' | 'task' | 'action';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
  keywords?: string[];
}

export function CommandPalette({
  isOpen,
  onClose,
  onNavigate,
  onSelectClient,
  onAddClient,
}: CommandPaletteProps) {
  const { clients } = useClientContext();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const activeClients = clients.filter((c) => !c.archived);

  // Build command items
  const allItems = useMemo<CommandItem[]>(() => {
    const items: CommandItem[] = [];

    // Navigation items
    items.push({
      id: 'nav-dashboard',
      type: 'navigation',
      title: 'Go to Dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
        </svg>
      ),
      action: () => {
        onNavigate('dashboard');
        onClose();
      },
      keywords: ['home', 'overview'],
    });

    items.push({
      id: 'nav-clients',
      type: 'navigation',
      title: 'Go to Clients',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      action: () => {
        onNavigate('clients');
        onClose();
      },
      keywords: ['people', 'customers'],
    });

    items.push({
      id: 'nav-tasks',
      type: 'navigation',
      title: 'Go to Tasks',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      action: () => {
        onNavigate('tasks');
        onClose();
      },
      keywords: ['todo', 'checklist'],
    });

    items.push({
      id: 'nav-planner',
      type: 'navigation',
      title: 'Go to Planner',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      action: () => {
        onNavigate('planner');
        onClose();
      },
      keywords: ['calendar', 'schedule'],
    });

    items.push({
      id: 'nav-templates',
      type: 'navigation',
      title: 'Go to Templates',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      action: () => {
        onNavigate('templates');
        onClose();
      },
      keywords: ['presets', 'blueprints'],
    });

    items.push({
      id: 'nav-ai',
      type: 'navigation',
      title: 'Go to AI',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      action: () => {
        onNavigate('ai');
        onClose();
      },
      keywords: ['chat', 'assistant', 'buds'],
    });

    // Actions
    items.push({
      id: 'action-add-client',
      type: 'action',
      title: 'Add New Client',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
      action: () => {
        onAddClient();
        onClose();
      },
      keywords: ['create', 'new'],
    });

    // Clients
    activeClients.forEach((client) => {
      const completedTasks = client.checklist.filter((t) => t.completed).length;
      const totalTasks = client.checklist.length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      items.push({
        id: `client-${client.id}`,
        type: 'client',
        title: client.name,
        subtitle: `${client.status} • ${progress}% complete`,
        icon: (
          <div className="w-8 h-8 rounded-[4px] bg-violet-700 flex items-center justify-center text-white font-black text-sm border border-zinc-900 dark:border-white">
            {client.name.charAt(0).toUpperCase()}
          </div>
        ),
        action: () => {
          onSelectClient(client);
          onClose();
        },
        keywords: [client.email, client.assignedTo, client.status],
      });

      // Add client's tasks
      client.checklist
        .filter((t) => !t.completed)
        .slice(0, 3) // Limit tasks per client
        .forEach((task) => {
          items.push({
            id: `task-${task.id}`,
            type: 'task',
            title: task.title,
            subtitle: `${client.name}${task.dueDate ? ` • Due ${formatDate(task.dueDate)}` : ''}`,
            icon: (
              <div className="w-5 h-5 rounded-[4px] border-2 border-zinc-400 dark:border-zinc-500" />
            ),
            action: () => {
              onSelectClient(client);
              onClose();
            },
            keywords: [client.name],
          });
        });
    });

    return items;
  }, [activeClients, onNavigate, onClose, onAddClient, onSelectClient]);

  // Filter items based on query
  const filteredItems = useMemo(() => {
    if (!query.trim()) {
      // Show navigation and actions first, then recent clients
      return [
        ...allItems.filter((i) => i.type === 'navigation' || i.type === 'action'),
        ...allItems.filter((i) => i.type === 'client').slice(0, 5),
      ];
    }

    const lowerQuery = query.toLowerCase();
    return allItems
      .filter((item) => {
        const matchesTitle = item.title.toLowerCase().includes(lowerQuery);
        const matchesSubtitle = item.subtitle?.toLowerCase().includes(lowerQuery);
        const matchesKeywords = item.keywords?.some((k) => k.toLowerCase().includes(lowerQuery));
        return matchesTitle || matchesSubtitle || matchesKeywords;
      })
      .slice(0, 15);
  }, [query, allItems]);

  // Reset selection when filtered items change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, filteredItems.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredItems[selectedIndex]) {
            filteredItems[selectedIndex].action();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.children[selectedIndex] as HTMLElement;
      if (selected) {
        selected.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  const groupedItems = {
    navigation: filteredItems.filter((i) => i.type === 'navigation'),
    action: filteredItems.filter((i) => i.type === 'action'),
    client: filteredItems.filter((i) => i.type === 'client'),
    task: filteredItems.filter((i) => i.type === 'task'),
  };

  let globalIndex = -1;

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/80" onClick={onClose} />
      <div className="flex min-h-full items-start justify-center p-4 pt-[15vh]">
        <div className="relative w-full max-w-xl bg-white dark:bg-zinc-800 border-2 border-zinc-900 dark:border-white shadow-[8px_8px_0_0_#18181b] dark:shadow-[8px_8px_0_0_#ffffff] rounded-[4px] overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b-2 border-zinc-900 dark:border-white">
            <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search clients, tasks, or type a command..."
              className="flex-1 bg-transparent text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none font-medium"
            />
            <kbd className="px-2 py-1 text-xs font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-[4px]">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[50vh] overflow-y-auto p-2">
            {filteredItems.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 dark:text-zinc-400 font-medium">
                No results found for "{query}"
              </div>
            ) : (
              <>
                {groupedItems.navigation.length > 0 && (
                  <div className="mb-2">
                    <div className="px-3 py-1.5 text-xs font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                      Navigation
                    </div>
                    {groupedItems.navigation.map((item) => {
                      globalIndex++;
                      const isSelected = globalIndex === selectedIndex;
                      return (
                        <CommandItem
                          key={item.id}
                          item={item}
                          isSelected={isSelected}
                          onClick={item.action}
                        />
                      );
                    })}
                  </div>
                )}

                {groupedItems.action.length > 0 && (
                  <div className="mb-2">
                    <div className="px-3 py-1.5 text-xs font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                      Actions
                    </div>
                    {groupedItems.action.map((item) => {
                      globalIndex++;
                      const isSelected = globalIndex === selectedIndex;
                      return (
                        <CommandItem
                          key={item.id}
                          item={item}
                          isSelected={isSelected}
                          onClick={item.action}
                        />
                      );
                    })}
                  </div>
                )}

                {groupedItems.client.length > 0 && (
                  <div className="mb-2">
                    <div className="px-3 py-1.5 text-xs font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                      Clients
                    </div>
                    {groupedItems.client.map((item) => {
                      globalIndex++;
                      const isSelected = globalIndex === selectedIndex;
                      return (
                        <CommandItem
                          key={item.id}
                          item={item}
                          isSelected={isSelected}
                          onClick={item.action}
                        />
                      );
                    })}
                  </div>
                )}

                {groupedItems.task.length > 0 && (
                  <div className="mb-2">
                    <div className="px-3 py-1.5 text-xs font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                      Tasks
                    </div>
                    {groupedItems.task.map((item) => {
                      globalIndex++;
                      const isSelected = globalIndex === selectedIndex;
                      return (
                        <CommandItem
                          key={item.id}
                          item={item}
                          isSelected={isSelected}
                          onClick={item.action}
                        />
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t-2 border-zinc-900 dark:border-white text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 font-bold bg-zinc-100 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-[4px]">↑</kbd>
                <kbd className="px-1.5 py-0.5 font-bold bg-zinc-100 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-[4px]">↓</kbd>
                to navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 font-bold bg-zinc-100 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-[4px]">↵</kbd>
                to select
              </span>
            </div>
            <span>
              <kbd className="px-1.5 py-0.5 font-bold bg-zinc-100 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-[4px]">Ctrl</kbd>
              +
              <kbd className="px-1.5 py-0.5 font-bold bg-zinc-100 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-[4px]">K</kbd>
              to open
            </span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function CommandItem({
  item,
  isSelected,
  onClick,
}: {
  item: CommandItem;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 py-2 rounded-[4px] transition-colors text-left border-b border-zinc-100 dark:border-zinc-700 last:border-b-0 ${
        isSelected
          ? 'bg-yellow-100 dark:bg-zinc-700 text-zinc-900 dark:text-white border-l-4 border-yellow-400 pl-[calc(0.75rem_-_4px)] pr-3'
          : 'px-3 hover:bg-yellow-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
      }`}
    >
      <div className="flex-shrink-0 text-zinc-500 dark:text-zinc-400">{item.icon}</div>
      <div className="flex-1 min-w-0">
        <p className="font-bold truncate">{item.title}</p>
        {item.subtitle && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">{item.subtitle}</p>
        )}
      </div>
      {isSelected && (
        <kbd className="px-2 py-0.5 text-xs font-bold bg-yellow-400 text-zinc-900 border border-zinc-900 rounded-[4px]">
          ↵
        </kbd>
      )}
    </button>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date(new Date().toDateString());
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
