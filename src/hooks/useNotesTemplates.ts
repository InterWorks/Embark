import { useCallback } from 'react';
import type { NotesTemplate } from '../types';
import { useLocalStorage } from './useLocalStorage';
import { generateId } from '../utils/helpers';

export function useNotesTemplates() {
  const [templates, setTemplates] = useLocalStorage<NotesTemplate[]>(
    'onboarding-notes-templates',
    []
  );

  const addTemplate = useCallback(
    (template: Omit<NotesTemplate, 'id' | 'createdAt'>) => {
      const newTemplate: NotesTemplate = {
        id: generateId(),
        ...template,
        createdAt: new Date().toISOString(),
      };
      setTemplates((prev) => [...prev, newTemplate]);
      return newTemplate;
    },
    [setTemplates]
  );

  const updateTemplate = useCallback(
    (id: string, updates: Partial<Omit<NotesTemplate, 'id' | 'createdAt'>>) => {
      setTemplates((prev) =>
        prev.map((template) =>
          template.id === id ? { ...template, ...updates } : template
        )
      );
    },
    [setTemplates]
  );

  const deleteTemplate = useCallback(
    (id: string) => {
      setTemplates((prev) => prev.filter((template) => template.id !== id));
    },
    [setTemplates]
  );

  const applyTemplate = useCallback(
    (template: NotesTemplate, variables: Record<string, string>): string => {
      let content = template.content;
      Object.entries(variables).forEach(([key, value]) => {
        content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
      });
      return content;
    },
    []
  );

  return {
    notesTemplates: templates,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    applyTemplate,
  };
}
