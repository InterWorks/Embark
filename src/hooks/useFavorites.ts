import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

export function useFavorites() {
  const [favorites, setFavorites] = useLocalStorage<string[]>('favorite-clients', []);

  const toggleFavorite = useCallback(
    (clientId: string) => {
      setFavorites((prev) =>
        prev.includes(clientId)
          ? prev.filter((id) => id !== clientId)
          : [...prev, clientId]
      );
    },
    [setFavorites]
  );

  const isFavorite = useCallback(
    (clientId: string) => favorites.includes(clientId),
    [favorites]
  );

  const addFavorite = useCallback(
    (clientId: string) => {
      setFavorites((prev) =>
        prev.includes(clientId) ? prev : [...prev, clientId]
      );
    },
    [setFavorites]
  );

  const removeFavorite = useCallback(
    (clientId: string) => {
      setFavorites((prev) => prev.filter((id) => id !== clientId));
    },
    [setFavorites]
  );

  return {
    favorites,
    toggleFavorite,
    isFavorite,
    addFavorite,
    removeFavorite,
  };
}
