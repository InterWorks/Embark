import { useState, useCallback, useEffect } from 'react';

interface HistoryEntry<T> {
  state: T;
  description: string;
  timestamp: number;
}

interface UseHistoryOptions {
  maxSize?: number;
}

export function useHistory<T>(
  initialState: T,
  options: UseHistoryOptions = {}
) {
  const { maxSize = 50 } = options;

  const [past, setPast] = useState<HistoryEntry<T>[]>([]);
  const [present, setPresent] = useState<T>(initialState);
  const [future, setFuture] = useState<HistoryEntry<T>[]>([]);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  // Push a new state onto the history
  const pushState = useCallback(
    (newState: T, description: string) => {
      setPast((prev) => {
        const newPast = [
          ...prev,
          { state: present, description, timestamp: Date.now() },
        ];
        // Limit history size
        if (newPast.length > maxSize) {
          return newPast.slice(-maxSize);
        }
        return newPast;
      });
      setPresent(newState);
      setFuture([]); // Clear redo stack on new action
    },
    [present, maxSize]
  );

  // Undo the last action
  const undo = useCallback((): { state: T; description: string } | null => {
    if (past.length === 0) return null;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, -1);

    setPast(newPast);
    setFuture((prev) => [
      { state: present, description: previous.description, timestamp: Date.now() },
      ...prev,
    ]);
    setPresent(previous.state);

    return { state: previous.state, description: previous.description };
  }, [past, present]);

  // Redo the last undone action
  const redo = useCallback((): { state: T; description: string } | null => {
    if (future.length === 0) return null;

    const next = future[0];
    const newFuture = future.slice(1);

    setFuture(newFuture);
    setPast((prev) => [
      ...prev,
      { state: present, description: next.description, timestamp: Date.now() },
    ]);
    setPresent(next.state);

    return { state: next.state, description: next.description };
  }, [future, present]);

  // Reset history with new initial state
  const reset = useCallback((newState: T) => {
    setPast([]);
    setPresent(newState);
    setFuture([]);
  }, []);

  // Sync present state when external state changes (e.g., from localStorage)
  const syncState = useCallback((newState: T) => {
    setPresent(newState);
  }, []);

  return {
    state: present,
    pushState,
    undo,
    redo,
    reset,
    syncState,
    canUndo,
    canRedo,
    historyLength: past.length,
    futureLength: future.length,
  };
}

// Hook to handle keyboard shortcuts for undo/redo
export function useUndoRedoShortcuts(
  onUndo: () => void,
  onRedo: () => void,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if we're in an input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          onRedo();
        } else {
          e.preventDefault();
          onUndo();
        }
      }

      // Also support Ctrl+Y for redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        onRedo();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onUndo, onRedo, enabled]);
}
