import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { EmailQueueItem } from '../types';
import { generateId } from '../utils/helpers';

export function useEmailQueue() {
  const [queue, setQueue] = useLocalStorage<EmailQueueItem[]>('embark-email-queue', []);

  const enqueue = useCallback((item: Omit<EmailQueueItem, 'id' | 'createdAt'>): void => {
    const newItem: EmailQueueItem = {
      ...item,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setQueue((prev) => [...prev, newItem]);
  }, [setQueue]);

  const cancelSequence = useCallback((sequenceId: string): void => {
    setQueue((prev) =>
      prev.map((item) =>
        item.sequenceId === sequenceId && item.status === 'pending'
          ? { ...item, status: 'cancelled' }
          : item
      )
    );
  }, [setQueue]);

  const markSent = useCallback((itemId: string): void => {
    setQueue((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, status: 'sent' } : item
      )
    );
  }, [setQueue]);

  const getPendingItems = useCallback((): EmailQueueItem[] => {
    const now = new Date().toISOString();
    return queue.filter(
      (item) => item.status === 'pending' && item.scheduledFor <= now
    );
  }, [queue]);

  return { queue, enqueue, cancelSequence, markSent, getPendingItems };
}
