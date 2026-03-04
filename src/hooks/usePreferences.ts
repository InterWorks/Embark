import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

export type ViewMode = 'global' | 'per-client';

export interface Preferences {
  viewMode: ViewMode;
  selectedClientId: string | null;
  lastDigestShown: string;
}

const defaultPreferences: Preferences = {
  viewMode: 'per-client',
  selectedClientId: null,
  lastDigestShown: '',
};

export function usePreferences() {
  const [preferences, setPreferences] = useLocalStorage<Preferences>(
    'embark-preferences',
    defaultPreferences
  );

  const setViewMode = useCallback(
    (viewMode: ViewMode) => {
      setPreferences((prev) => ({ ...prev, viewMode }));
    },
    [setPreferences]
  );

  const setSelectedClientId = useCallback(
    (selectedClientId: string | null) => {
      setPreferences((prev) => ({ ...prev, selectedClientId }));
    },
    [setPreferences]
  );

  const setLastDigestShown = useCallback(
    (date: string) => {
      setPreferences((prev) => ({ ...prev, lastDigestShown: date }));
    },
    [setPreferences]
  );

  return {
    preferences,
    setViewMode,
    setSelectedClientId,
    setLastDigestShown,
  };
}
