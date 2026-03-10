import { useState, useEffect, useCallback, useRef } from 'react';
import { generateId } from '../utils/helpers';
import type { TimeEntry } from '../types';

const ACTIVE_TIMER_KEY = 'embark_active_timer';

interface ActiveTimer {
  clientId: string;
  taskId: string;
  taskTitle: string;
  startedAt: string; // ISO string
}

export function getActiveTimer(): ActiveTimer | null {
  try {
    const raw = localStorage.getItem(ACTIVE_TIMER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setActiveTimer(timer: ActiveTimer | null) {
  if (timer) {
    localStorage.setItem(ACTIVE_TIMER_KEY, JSON.stringify(timer));
  } else {
    localStorage.removeItem(ACTIVE_TIMER_KEY);
  }
  window.dispatchEvent(new StorageEvent('storage', {
    key: ACTIVE_TIMER_KEY,
    newValue: timer ? JSON.stringify(timer) : null,
  }));
}

export function useTimeTracking(clientId: string, taskId: string) {
  const [activeTimer, setActiveTimerState] = useState<ActiveTimer | null>(() => getActiveTimer());
  const [elapsed, setElapsed] = useState(0); // seconds
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isRunning = activeTimer?.clientId === clientId && activeTimer?.taskId === taskId;

  // Sync with storage events (timer started/stopped elsewhere)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === ACTIVE_TIMER_KEY) {
        setActiveTimerState(e.newValue ? JSON.parse(e.newValue) : null);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Tick
  useEffect(() => {
    if (isRunning && activeTimer) {
      const update = () => {
        const secs = Math.floor((Date.now() - new Date(activeTimer.startedAt).getTime()) / 1000);
        setElapsed(secs);
      };
      update();
      const id = setInterval(update, 1000);
      intervalRef.current = id;
      return () => clearInterval(id);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setElapsed(0);
    }
  }, [isRunning, activeTimer]);

  const startTimer = useCallback((taskTitle: string) => {
    const timer: ActiveTimer = { clientId, taskId, taskTitle, startedAt: new Date().toISOString() };
    setActiveTimer(timer);
    setActiveTimerState(timer);
  }, [clientId, taskId]);

  const stopTimer = useCallback((): TimeEntry | null => {
    const current = getActiveTimer();
    if (!current || current.clientId !== clientId || current.taskId !== taskId) return null;

    const durationMins = Math.max(1, Math.round((Date.now() - new Date(current.startedAt).getTime()) / 60000));
    const entry: TimeEntry = {
      id: generateId(),
      userId: 'current-user',
      duration: durationMins,
      billable: true,
      loggedAt: new Date().toISOString(),
    };

    setActiveTimer(null);
    setActiveTimerState(null);
    return entry;
  }, [clientId, taskId]);

  return { isRunning, elapsed, startTimer, stopTimer, activeTimer };
}

export function formatElapsed(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}
