import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { generateId } from '../utils/helpers';
import type { FilterSet } from '../components/Clients/FilterBuilder';

export function useSegments() {
  const [segments, setSegments] = useLocalStorage<FilterSet[]>('embark-segments', []);

  const saveSegment = useCallback(
    (name: string, filters: FilterSet): FilterSet => {
      const segment: FilterSet = {
        ...filters,
        id: generateId(),
        name,
      };
      setSegments((prev) => [...prev, segment]);
      return segment;
    },
    [setSegments]
  );

  const deleteSegment = useCallback(
    (id: string) => {
      setSegments((prev) => prev.filter((s) => s.id !== id));
    },
    [setSegments]
  );

  return { segments, saveSegment, deleteSegment };
}
