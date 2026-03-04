import { describe, it, expect } from 'vitest';
import { getClientHealth } from '../utils/clientHealth';
import type { Client } from '../types';

function makeClient(overrides: Partial<Client> = {}): Client {
  const base: Client = {
    id: '1', name: 'Test', email: '', phone: '', assignedTo: '',
    services: [], checklist: [], notes: '', tags: [],
    status: 'active', priority: 'medium',
    activityLog: [{ id: 'a1', type: 'created', description: 'Created', timestamp: new Date().toISOString() }],
    createdAt: new Date().toISOString(),
  };
  return { ...base, ...overrides };
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

describe('getClientHealth', () => {
  it('returns null for completed clients', () => {
    expect(getClientHealth(makeClient({ status: 'completed' }))).toBeNull();
  });

  it('returns null for on-hold clients', () => {
    expect(getClientHealth(makeClient({ status: 'on-hold' }))).toBeNull();
  });

  it('returns null for archived clients', () => {
    expect(getClientHealth(makeClient({ archived: true }))).toBeNull();
  });

  it('returns on-track for active client with no issues', () => {
    const result = getClientHealth(makeClient());
    expect(result?.status).toBe('on-track');
  });

  it('returns stalled for client with no activity in 30+ days', () => {
    const client = makeClient({
      activityLog: [{ id: 'a1', type: 'created', description: 'Created', timestamp: daysAgo(31) }],
    });
    expect(getClientHealth(client)?.status).toBe('stalled');
  });

  it('returns needs-attention for 3+ overdue tasks', () => {
    const overdue = [1, 2, 3].map(i => ({
      id: String(i), title: `Task ${i}`, completed: false, order: i,
      dueDate: daysAgo(1).split('T')[0],
    }));
    expect(getClientHealth(makeClient({ checklist: overdue }))?.status).toBe('needs-attention');
  });

  it('returns needs-attention for no activity in 14+ days', () => {
    const client = makeClient({
      activityLog: [{ id: 'a1', type: 'created', description: 'Created', timestamp: daysAgo(15) }],
    });
    expect(getClientHealth(client)?.status).toBe('needs-attention');
  });

  it('returns at-risk for 1-2 overdue tasks', () => {
    const overdue = [1].map(i => ({
      id: String(i), title: `Task ${i}`, completed: false, order: i,
      dueDate: daysAgo(1).split('T')[0],
    }));
    expect(getClientHealth(makeClient({ checklist: overdue }))?.status).toBe('at-risk');
  });

  it('returns at-risk for no activity in 7-13 days', () => {
    const client = makeClient({
      activityLog: [{ id: 'a1', type: 'created', description: 'Created', timestamp: daysAgo(8) }],
    });
    expect(getClientHealth(client)?.status).toBe('at-risk');
  });

  it('returns at-risk for milestone past target date', () => {
    const client = makeClient({
      milestones: [{ id: 'm1', title: 'M1', order: 1, targetDate: daysAgo(2).split('T')[0] }],
    });
    expect(getClientHealth(client)?.status).toBe('at-risk');
  });

  it('uses createdAt as fallback when activityLog is empty', () => {
    const client = makeClient({
      activityLog: [],
      createdAt: daysAgo(31),
    });
    expect(getClientHealth(client)?.status).toBe('stalled');
  });

  it('includes a reason string', () => {
    const overdue = [1, 2, 3].map(i => ({
      id: String(i), title: `Task ${i}`, completed: false, order: i,
      dueDate: daysAgo(1).split('T')[0],
    }));
    const result = getClientHealth(makeClient({ checklist: overdue }));
    expect(result?.reason).toMatch(/overdue/i);
  });
});
