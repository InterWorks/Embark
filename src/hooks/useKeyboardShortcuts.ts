import { useEffect, useCallback } from 'react';

type KeyHandler = () => void;

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: KeyHandler;
  description?: string;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
}

export function useKeyboardShortcuts(
  shortcuts: ShortcutConfig[],
  optionsOrEnabled: UseKeyboardShortcutsOptions | boolean = {}
) {
  // Support both boolean and options object for backwards compatibility
  const enabled = typeof optionsOrEnabled === 'boolean'
    ? optionsOrEnabled
    : optionsOrEnabled.enabled ?? true;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      const isInputElement =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      for (const shortcut of shortcuts) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;

        // For Escape key, allow it even in inputs
        const allowInInput = shortcut.key.toLowerCase() === 'escape';

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          if (!isInputElement || allowInInput) {
            event.preventDefault();
            shortcut.handler();
            break;
          }
        }
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown, enabled]);
}

// Predefined shortcuts used by KeyboardShortcutsHelp component
export const SHORTCUTS = {
  // Navigation
  navDashboard: { key: 'd', description: 'Go to Dashboard' },
  navClients: { key: 'c', description: 'Go to Clients' },
  navTasks: { key: 't', description: 'Go to Tasks' },
  navPlanner: { key: 'p', description: 'Go to Planner' },
  navHallOfHeroes: { key: 'h', description: 'Go to Hall of Heroes' },
  navAutomations: { key: 'a', description: 'Go to Automations' },
  navNotes: { key: 'n', shift: true, description: 'Go to Notes' },
  navTeam: { key: 't', shift: true, description: 'Go to Team' },
  // Actions
  newClient: { key: 'n', description: 'Add new client' },
  search: { key: '/', description: 'Focus search' },
  escape: { key: 'Escape', description: 'Close modal / Cancel' },
  help: { key: '?', shift: true, description: 'Show shortcuts help' },
  // Views (within Clients)
  viewCards: { key: '1', description: 'Card view' },
  viewTable: { key: '2', description: 'Table view' },
  viewKanban: { key: '3', description: 'Board view' },
  viewTimeline: { key: '4', description: 'Timeline view' },
  viewGantt: { key: '5', description: 'Gantt view' },
  viewCalendar: { key: '6', description: 'Calendar view' },
  selectAll: { key: 'a', ctrl: true, description: 'Select all clients' },
} as const;

// Common shortcuts for the app (alternative export name)
export const COMMON_SHORTCUTS = SHORTCUTS;
