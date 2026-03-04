import { createContext, useContext } from 'react';
import type { useGamification } from '../hooks/useGamification';

export type GamificationContextType = ReturnType<typeof useGamification>;

export const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export function useGamificationContext(): GamificationContextType {
  const ctx = useContext(GamificationContext);
  if (!ctx) throw new Error('useGamificationContext must be used within GamificationContext.Provider');
  return ctx;
}
