import { useCallback } from 'react';
import type { Tag } from '../types';
import { useLocalStorage } from './useLocalStorage';
import { generateId } from '../utils/helpers';

const DEFAULT_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
];

export function useTags() {
  const [tags, setTags] = useLocalStorage<Tag[]>('onboarding-tags', []);

  const addTag = useCallback((name: string, color?: string): Tag => {
    const newTag: Tag = {
      id: generateId(),
      name,
      color: color || DEFAULT_COLORS[tags.length % DEFAULT_COLORS.length],
    };
    setTags((prev) => [...prev, newTag]);
    return newTag;
  }, [tags.length, setTags]);

  const updateTag = useCallback((id: string, data: Partial<Omit<Tag, 'id'>>) => {
    setTags((prev) =>
      prev.map((tag) => (tag.id === id ? { ...tag, ...data } : tag))
    );
  }, [setTags]);

  const deleteTag = useCallback((id: string) => {
    setTags((prev) => prev.filter((tag) => tag.id !== id));
  }, [setTags]);

  const getTagById = useCallback((id: string): Tag | undefined => {
    return tags.find((tag) => tag.id === id);
  }, [tags]);

  return {
    tags,
    addTag,
    updateTag,
    deleteTag,
    getTagById,
    DEFAULT_COLORS,
  };
}
