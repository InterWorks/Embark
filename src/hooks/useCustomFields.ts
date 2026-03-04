import { useCallback } from 'react';
import type { CustomFieldDefinition } from '../types';
import { useLocalStorage } from './useLocalStorage';
import { generateId } from '../utils/helpers';

export function useCustomFields() {
  const [definitions, setDefinitions] = useLocalStorage<CustomFieldDefinition[]>(
    'onboarding-custom-fields',
    []
  );

  const addFieldDefinition = useCallback(
    (field: Omit<CustomFieldDefinition, 'id' | 'createdAt' | 'order'>) => {
      const newField: CustomFieldDefinition = {
        id: generateId(),
        ...field,
        order: definitions.length,
        createdAt: new Date().toISOString(),
      };
      setDefinitions((prev) => [...prev, newField]);
      return newField;
    },
    [definitions.length, setDefinitions]
  );

  const updateFieldDefinition = useCallback(
    (id: string, updates: Partial<Omit<CustomFieldDefinition, 'id' | 'createdAt'>>) => {
      setDefinitions((prev) =>
        prev.map((field) => (field.id === id ? { ...field, ...updates } : field))
      );
    },
    [setDefinitions]
  );

  const deleteFieldDefinition = useCallback(
    (id: string) => {
      setDefinitions((prev) => prev.filter((field) => field.id !== id));
    },
    [setDefinitions]
  );

  const reorderFieldDefinitions = useCallback(
    (reorderedFields: CustomFieldDefinition[]) => {
      setDefinitions(reorderedFields.map((field, index) => ({ ...field, order: index })));
    },
    [setDefinitions]
  );

  return {
    customFieldDefinitions: definitions,
    addFieldDefinition,
    updateFieldDefinition,
    deleteFieldDefinition,
    reorderFieldDefinitions,
  };
}
