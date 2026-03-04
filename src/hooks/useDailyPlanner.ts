import { useCallback } from 'react';
import type { TimeBlock, DailyEntry, DailyGoal } from '../types';
import { useLocalStorage } from './useLocalStorage';
import { generateId } from '../utils/helpers';

export const TIME_BLOCK_COLORS = [
  { name: 'Purple', value: 'from-violet-500 to-purple-500' },
  { name: 'Blue', value: 'from-blue-500 to-cyan-500' },
  { name: 'Green', value: 'from-emerald-500 to-green-500' },
  { name: 'Orange', value: 'from-orange-500 to-amber-500' },
  { name: 'Pink', value: 'from-pink-500 to-rose-500' },
  { name: 'Gray', value: 'from-gray-500 to-slate-500' },
] as const;

export interface CreateTimeBlockData {
  title: string;
  startTime: string;
  endTime: string;
  clientId?: string;
  taskId?: string;
  color?: string;
  notes?: string;
}

export interface UpdateTimeBlockData {
  title?: string;
  startTime?: string;
  endTime?: string;
  clientId?: string | null;
  taskId?: string | null;
  color?: string;
  notes?: string;
}

export function useDailyPlanner() {
  const [timeBlocks, setTimeBlocks] = useLocalStorage<TimeBlock[]>('time-blocks', []);
  const [dailyEntries, setDailyEntries] = useLocalStorage<DailyEntry[]>('embark-daily-entries', []);

  // ============ TIME BLOCK OPERATIONS ============

  const getTimeBlocksForDate = useCallback((date: string) => {
    // date should be YYYY-MM-DD format or a Date object
    const targetDate = typeof date === 'string' ? date : new Date(date).toISOString().split('T')[0];
    return timeBlocks.filter((block) => {
      const blockDate = new Date(block.startTime).toISOString().split('T')[0];
      return blockDate === targetDate;
    });
  }, [timeBlocks]);

  const createTimeBlock = useCallback((data: CreateTimeBlockData): TimeBlock => {
    const newBlock: TimeBlock = {
      id: generateId(),
      title: data.title,
      startTime: data.startTime,
      endTime: data.endTime,
      clientId: data.clientId,
      taskId: data.taskId,
      color: data.color || TIME_BLOCK_COLORS[0].value,
      notes: data.notes,
      createdAt: new Date().toISOString(),
    };
    setTimeBlocks((prev) => [...prev, newBlock]);
    return newBlock;
  }, [setTimeBlocks]);

  const updateTimeBlock = useCallback((id: string, updates: UpdateTimeBlockData) => {
    setTimeBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== id) return block;
        const updated = { ...block };
        if (updates.title !== undefined) updated.title = updates.title;
        if (updates.startTime !== undefined) updated.startTime = updates.startTime;
        if (updates.endTime !== undefined) updated.endTime = updates.endTime;
        if (updates.color !== undefined) updated.color = updates.color;
        if (updates.notes !== undefined) updated.notes = updates.notes;
        // Handle null to clear client/task
        if (updates.clientId !== undefined) {
          updated.clientId = updates.clientId === null ? undefined : updates.clientId;
        }
        if (updates.taskId !== undefined) {
          updated.taskId = updates.taskId === null ? undefined : updates.taskId;
        }
        return updated;
      })
    );
  }, [setTimeBlocks]);

  const deleteTimeBlock = useCallback((id: string) => {
    setTimeBlocks((prev) => prev.filter((block) => block.id !== id));
  }, [setTimeBlocks]);

  // ============ DAILY ENTRY OPERATIONS ============

  const getDailyEntry = useCallback((date: string): DailyEntry | undefined => {
    return dailyEntries.find((entry) => entry.date === date);
  }, [dailyEntries]);

  const createOrGetDailyEntry = useCallback((date: string): DailyEntry => {
    const existing = dailyEntries.find((entry) => entry.date === date);
    if (existing) return existing;

    const newEntry: DailyEntry = {
      id: generateId(),
      date,
      journalContent: '',
      dailyGoals: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setDailyEntries((prev) => [...prev, newEntry]);
    return newEntry;
  }, [dailyEntries, setDailyEntries]);

  const updateDailyEntry = useCallback((id: string, updates: Partial<Pick<DailyEntry, 'journalContent' | 'dailyGoals'>>) => {
    setDailyEntries((prev) =>
      prev.map((entry) =>
        entry.id === id
          ? { ...entry, ...updates, updatedAt: new Date().toISOString() }
          : entry
      )
    );
  }, [setDailyEntries]);

  const updateJournalContent = useCallback((date: string, content: string) => {
    setDailyEntries((prev) => {
      const existingIndex = prev.findIndex((entry) => entry.date === date);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          journalContent: content,
          updatedAt: new Date().toISOString(),
        };
        return updated;
      }
      // Create new entry if doesn't exist
      const newEntry: DailyEntry = {
        id: generateId(),
        date,
        journalContent: content,
        dailyGoals: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return [...prev, newEntry];
    });
  }, [setDailyEntries]);

  // ============ DAILY GOAL OPERATIONS ============

  const addDailyGoal = useCallback((date: string, title: string) => {
    setDailyEntries((prev) => {
      const existingIndex = prev.findIndex((entry) => entry.date === date);
      const newGoal: DailyGoal = {
        id: generateId(),
        title,
        completed: false,
        order: 0,
      };

      if (existingIndex >= 0) {
        const updated = [...prev];
        const entry = updated[existingIndex];
        newGoal.order = entry.dailyGoals.length;
        updated[existingIndex] = {
          ...entry,
          dailyGoals: [...entry.dailyGoals, newGoal],
          updatedAt: new Date().toISOString(),
        };
        return updated;
      }

      // Create new entry if doesn't exist
      const newEntry: DailyEntry = {
        id: generateId(),
        date,
        journalContent: '',
        dailyGoals: [newGoal],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return [...prev, newEntry];
    });
  }, [setDailyEntries]);

  const toggleDailyGoal = useCallback((date: string, goalId: string) => {
    setDailyEntries((prev) =>
      prev.map((entry) => {
        if (entry.date !== date) return entry;
        return {
          ...entry,
          dailyGoals: entry.dailyGoals.map((goal) =>
            goal.id === goalId ? { ...goal, completed: !goal.completed } : goal
          ),
          updatedAt: new Date().toISOString(),
        };
      })
    );
  }, [setDailyEntries]);

  const removeDailyGoal = useCallback((date: string, goalId: string) => {
    setDailyEntries((prev) =>
      prev.map((entry) => {
        if (entry.date !== date) return entry;
        return {
          ...entry,
          dailyGoals: entry.dailyGoals.filter((goal) => goal.id !== goalId),
          updatedAt: new Date().toISOString(),
        };
      })
    );
  }, [setDailyEntries]);

  const updateDailyGoal = useCallback((date: string, goalId: string, title: string) => {
    setDailyEntries((prev) =>
      prev.map((entry) => {
        if (entry.date !== date) return entry;
        return {
          ...entry,
          dailyGoals: entry.dailyGoals.map((goal) =>
            goal.id === goalId ? { ...goal, title } : goal
          ),
          updatedAt: new Date().toISOString(),
        };
      })
    );
  }, [setDailyEntries]);

  return {
    // Time Blocks
    timeBlocks,
    getTimeBlocksForDate,
    createTimeBlock,
    updateTimeBlock,
    deleteTimeBlock,

    // Daily Entries
    dailyEntries,
    getDailyEntry,
    createOrGetDailyEntry,
    updateDailyEntry,
    updateJournalContent,

    // Daily Goals
    addDailyGoal,
    toggleDailyGoal,
    removeDailyGoal,
    updateDailyGoal,
  };
}
