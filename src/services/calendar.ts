/**
 * Calendar service — localStorage adapter with demo mode.
 * Future: replace with OAuth token exchange + Google/Microsoft API calls.
 */
import type { CalendarProvider, CalendarEvent } from '../types/index';
import { generateId } from '../utils/helpers';

const CALENDAR_KEY = 'embark_calendar_connection';
const EVENTS_KEY = 'embark_calendar_events';

export interface CalendarConnectionState {
  connected: boolean;
  provider?: CalendarProvider;
  connectedAt?: string;
  demoMode: true;
}

export function connect(provider: CalendarProvider): CalendarConnectionState {
  const state: CalendarConnectionState = {
    connected: true,
    provider,
    connectedAt: new Date().toISOString(),
    demoMode: true,
  };
  localStorage.setItem(CALENDAR_KEY, JSON.stringify(state));
  return state;
}

export function disconnect(): void {
  localStorage.removeItem(CALENDAR_KEY);
}

export function getConnection(): CalendarConnectionState {
  try {
    const stored = localStorage.getItem(CALENDAR_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return { connected: false, demoMode: true };
}

export interface EventRange {
  start: string; // ISO date
  end: string;   // ISO date
}

export function getEvents(range?: EventRange): CalendarEvent[] {
  try {
    const all: CalendarEvent[] = JSON.parse(localStorage.getItem(EVENTS_KEY) ?? '[]');
    if (!range) return all;
    return all.filter(e => e.startTime >= range.start && e.startTime <= range.end);
  } catch {
    return [];
  }
}

export function createEvent(event: Omit<CalendarEvent, 'id'>): CalendarEvent {
  const conn = getConnection();
  const newEvent: CalendarEvent = {
    ...event,
    id: generateId(),
    provider: conn.provider ?? 'google',
  };
  const events = getEvents();
  events.push(newEvent);
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  return newEvent;
}

export function updateEvent(id: string, updates: Partial<CalendarEvent>): CalendarEvent | null {
  const events = getEvents();
  const idx = events.findIndex(e => e.id === id);
  if (idx === -1) return null;
  events[idx] = { ...events[idx], ...updates };
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  return events[idx];
}

export function deleteEvent(id: string): void {
  const events = getEvents().filter(e => e.id !== id);
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
}
