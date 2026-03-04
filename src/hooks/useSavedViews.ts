import { useCallback } from 'react';
import type { ClientView } from '../types';
import { useLocalStorage } from './useLocalStorage';
import { generateId } from '../utils/helpers';

export interface SavedView {
  id: string;
  name: string;
  emoji?: string;
  filters: {
    statusFilter: string;
    assigneeFilter: string;
    searchQuery: string;
  };
  view: ClientView;
  isPinned: boolean;
  isDefault: boolean;
  createdAt: string;
}

export function useSavedViews() {
  const [savedViews, setSavedViews] = useLocalStorage<SavedView[]>('embark-saved-views', []);

  const saveView = useCallback(
    (name: string, filters: SavedView['filters'], view: ClientView, emoji?: string): SavedView => {
      const newView: SavedView = {
        id: generateId(),
        name,
        emoji,
        filters,
        view,
        isPinned: false,
        isDefault: false,
        createdAt: new Date().toISOString(),
      };
      setSavedViews((prev) => [...prev, newView]);
      return newView;
    },
    [setSavedViews]
  );

  const deleteView = useCallback(
    (id: string) => {
      setSavedViews((prev) => prev.filter((v) => v.id !== id));
    },
    [setSavedViews]
  );

  const updateView = useCallback(
    (id: string, updates: Partial<Omit<SavedView, 'id' | 'createdAt'>>) => {
      setSavedViews((prev) =>
        prev.map((v) => (v.id === id ? { ...v, ...updates } : v))
      );
    },
    [setSavedViews]
  );

  const pinView = useCallback(
    (id: string) => {
      setSavedViews((prev) => {
        const target = prev.find((v) => v.id === id);
        if (!target) return prev;
        const pinnedCount = prev.filter((v) => v.isPinned && v.id !== id).length;
        if (!target.isPinned && pinnedCount >= 5) return prev;
        return prev.map((v) =>
          v.id === id ? { ...v, isPinned: !v.isPinned } : v
        );
      });
    },
    [setSavedViews]
  );

  const setDefaultView = useCallback(
    (id: string) => {
      setSavedViews((prev) =>
        prev.map((v) => ({
          ...v,
          isDefault: v.id === id ? !v.isDefault : false,
        }))
      );
    },
    [setSavedViews]
  );

  const pinnedViews = savedViews.filter((v) => v.isPinned).slice(0, 5);
  const defaultView = savedViews.find((v) => v.isDefault) ?? null;

  return {
    savedViews,
    pinnedViews,
    defaultView,
    saveView,
    deleteView,
    updateView,
    pinView,
    setDefaultView,
  };
}
