import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutomations } from '../hooks/useAutomations';
import type { Client } from '../types';

beforeEach(() => {
  localStorage.clear();
});

function makeClient(overrides: Partial<Client> = {}): Client {
  return {
    id: 'client-1',
    name: 'Test Client',
    email: '',
    phone: '',
    assignedTo: '',
    status: 'active',
    priority: 'none',
    tags: [],
    services: [],
    checklist: [],
    notes: '',
    activityLog: [],
    createdAt: new Date().toISOString(),
    taskGroups: [],
    ...overrides,
  };
}

describe('useAutomations', () => {
  it('starts with no rules', () => {
    const { result } = renderHook(() => useAutomations());
    expect(result.current.rules).toHaveLength(0);
  });

  it('adds a rule', () => {
    const { result } = renderHook(() => useAutomations());

    act(() => {
      result.current.addRule(
        'Mark high priority on create',
        'client_created',
        [],
        { type: 'change_priority', value: 'high' }
      );
    });

    expect(result.current.rules).toHaveLength(1);
    expect(result.current.rules[0].name).toBe('Mark high priority on create');
    expect(result.current.rules[0].enabled).toBe(true);
  });

  it('toggles a rule on/off', () => {
    const { result } = renderHook(() => useAutomations());

    act(() => {
      result.current.addRule('Toggle Test', 'client_created', [], { type: 'change_status', value: 'completed' });
    });

    const id = result.current.rules[0].id;
    act(() => { result.current.toggleRule(id); });
    expect(result.current.rules[0].enabled).toBe(false);

    act(() => { result.current.toggleRule(id); });
    expect(result.current.rules[0].enabled).toBe(true);
  });

  it('deletes a rule', () => {
    const { result } = renderHook(() => useAutomations());

    act(() => {
      result.current.addRule('Delete Me', 'client_created', [], { type: 'change_status', value: 'completed' });
    });

    const id = result.current.rules[0].id;
    act(() => { result.current.deleteRule(id); });
    expect(result.current.rules).toHaveLength(0);
  });

  it('duplicates a rule', () => {
    const { result } = renderHook(() => useAutomations());

    act(() => {
      result.current.addRule('Original', 'client_created', [], { type: 'change_status', value: 'completed' });
    });

    const id = result.current.rules[0].id;
    act(() => { result.current.duplicateRule(id); });

    expect(result.current.rules).toHaveLength(2);
    expect(result.current.rules[1].name).toBe('Original (Copy)');
    expect(result.current.rules[1].id).not.toBe(id);
  });

  it('getRulesForTrigger returns only enabled matching rules', () => {
    const { result } = renderHook(() => useAutomations());

    act(() => {
      result.current.addRule('R1', 'client_created', [], { type: 'change_status', value: 'completed' });
      result.current.addRule('R2', 'status_changed', [], { type: 'change_priority', value: 'high' });
      result.current.addRule('R3', 'client_created', [], { type: 'change_priority', value: 'high' });
    });

    // Disable R3
    const r3Id = result.current.rules[2].id;
    act(() => { result.current.toggleRule(r3Id); });

    const matches = result.current.getRulesForTrigger('client_created');
    expect(matches).toHaveLength(1);
    expect(matches[0].name).toBe('R1');
  });

  it('checkConditions — status equals match', () => {
    const { result } = renderHook(() => useAutomations());
    const client = makeClient({ status: 'active' });

    const match = result.current.checkConditions(
      [{ field: 'status', operator: 'equals', value: 'active' }],
      client
    );
    expect(match).toBe(true);

    const noMatch = result.current.checkConditions(
      [{ field: 'status', operator: 'equals', value: 'completed' }],
      client
    );
    expect(noMatch).toBe(false);
  });

  it('checkConditions — completed_percentage', () => {
    const { result } = renderHook(() => useAutomations());
    const client = makeClient({
      checklist: [
        { id: '1', title: 'A', completed: true, order: 0 },
        { id: '2', title: 'B', completed: true, order: 1 },
        { id: '3', title: 'C', completed: false, order: 2 },
        { id: '4', title: 'D', completed: false, order: 3 },
      ],
    });

    // 2/4 = 50%
    const above40 = result.current.checkConditions(
      [{ field: 'completed_percentage', operator: 'greater_than', value: 40 }],
      client
    );
    expect(above40).toBe(true);

    const above60 = result.current.checkConditions(
      [{ field: 'completed_percentage', operator: 'greater_than', value: 60 }],
      client
    );
    expect(above60).toBe(false);
  });

  it('logs automation executions', () => {
    const { result } = renderHook(() => useAutomations());

    act(() => {
      result.current.logExecution({
        automationId: 'rule-1',
        automationName: 'Test Rule',
        trigger: 'client_created',
        action: 'Changed status to completed',
        clientId: 'client-1',
        clientName: 'Acme Corp',
        success: true,
      });
    });

    expect(result.current.logs).toHaveLength(1);
    expect(result.current.logs[0].automationName).toBe('Test Rule');
    expect(result.current.logs[0].success).toBe(true);
  });
});
