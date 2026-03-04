import { createContext, useContext, useCallback, useRef, useEffect, type ReactNode } from 'react';
import { useHistory, useUndoRedoShortcuts } from '../hooks/useHistory';
import { useToast } from '../components/UI/Toast';
import type { Client } from '../types';

interface UndoRedoContextType {
  trackChange: (clients: Client[], description: string) => void;
  undo: () => Client[] | null;
  redo: () => Client[] | null;
  canUndo: boolean;
  canRedo: boolean;
}

const UndoRedoContext = createContext<UndoRedoContextType | undefined>(undefined);

export function useUndoRedo() {
  const context = useContext(UndoRedoContext);
  if (!context) {
    throw new Error('useUndoRedo must be used within an UndoRedoProvider');
  }
  return context;
}

interface UndoRedoProviderProps {
  children: ReactNode;
  clients: Client[];
  onRestore: (clients: Client[]) => void;
}

export function UndoRedoProvider({ children, clients, onRestore }: UndoRedoProviderProps) {
  const { showToast } = useToast();
  const isRestoringRef = useRef(false);

  const {
    pushState,
    undo: historyUndo,
    redo: historyRedo,
    canUndo,
    canRedo,
    syncState,
  } = useHistory<Client[]>(clients, { maxSize: 30 });

  // Sync when clients change externally (but not from undo/redo)
  useEffect(() => {
    if (!isRestoringRef.current) {
      syncState(clients);
    }
    isRestoringRef.current = false;
  }, [clients, syncState]);

  const trackChange = useCallback(
    (newClients: Client[], description: string) => {
      pushState(newClients, description);
    },
    [pushState]
  );

  const undo = useCallback(() => {
    const result = historyUndo();
    if (result) {
      isRestoringRef.current = true;
      onRestore(result.state);
      showToast(`Undone: ${result.description}`, 'undo');
      return result.state;
    }
    return null;
  }, [historyUndo, onRestore, showToast]);

  const redo = useCallback(() => {
    const result = historyRedo();
    if (result) {
      isRestoringRef.current = true;
      onRestore(result.state);
      showToast(`Redone: ${result.description}`, 'undo');
      return result.state;
    }
    return null;
  }, [historyRedo, onRestore, showToast]);

  // Keyboard shortcuts
  useUndoRedoShortcuts(
    () => {
      if (canUndo) undo();
    },
    () => {
      if (canRedo) redo();
    }
  );

  return (
    <UndoRedoContext.Provider value={{ trackChange, undo, redo, canUndo, canRedo }}>
      {children}
    </UndoRedoContext.Provider>
  );
}
