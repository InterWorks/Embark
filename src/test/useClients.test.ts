import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useClients } from '../hooks/useClients';

beforeEach(() => {
  localStorage.clear();
});

describe('useClients', () => {
  it('starts with no clients', () => {
    const { result } = renderHook(() => useClients());
    expect(result.current.clients).toHaveLength(0);
  });

  it('adds a client', () => {
    const { result } = renderHook(() => useClients());

    act(() => {
      result.current.addClient({
        name: 'Acme Corp',
        email: 'hello@acme.com',
        phone: '555-1234',
        assignedTo: 'Alice',
        status: 'active',
        priority: 'high',
      });
    });

    expect(result.current.clients).toHaveLength(1);
    expect(result.current.clients[0].name).toBe('Acme Corp');
    expect(result.current.clients[0].status).toBe('active');
    expect(result.current.clients[0].checklist).toEqual([]);
  });

  it('deletes a client', () => {
    const { result } = renderHook(() => useClients());

    let clientId: string;
    act(() => {
      const client = result.current.addClient({
        name: 'Delete Me',
        email: '',
        phone: '',
        assignedTo: '',
        status: 'active',
        priority: 'none',
      });
      clientId = client.id;
    });

    act(() => {
      result.current.deleteClient(clientId);
    });

    expect(result.current.clients).toHaveLength(0);
  });

  it('updates client status', () => {
    const { result } = renderHook(() => useClients());

    let clientId: string;
    act(() => {
      const client = result.current.addClient({
        name: 'Status Test',
        email: '',
        phone: '',
        assignedTo: '',
        status: 'active',
        priority: 'none',
      });
      clientId = client.id;
    });

    act(() => {
      result.current.updateStatus(clientId, 'completed');
    });

    expect(result.current.clients[0].status).toBe('completed');
  });

  it('archives and restores a client', () => {
    const { result } = renderHook(() => useClients());

    let clientId: string;
    act(() => {
      const client = result.current.addClient({
        name: 'Archive Test',
        email: '',
        phone: '',
        assignedTo: '',
        status: 'active',
        priority: 'none',
      });
      clientId = client.id;
    });

    act(() => { result.current.archiveClient(clientId); });
    expect(result.current.clients[0].archived).toBe(true);

    act(() => { result.current.restoreClient(clientId); });
    expect(result.current.clients[0].archived).toBe(false);
  });

  it('adds and toggles checklist items', () => {
    const { result } = renderHook(() => useClients());

    let clientId: string;
    act(() => {
      const client = result.current.addClient({
        name: 'Task Test',
        email: '',
        phone: '',
        assignedTo: '',
        status: 'active',
        priority: 'none',
      });
      clientId = client.id;
    });

    act(() => { result.current.addChecklistItem(clientId, 'Setup account'); });
    expect(result.current.clients[0].checklist).toHaveLength(1);
    expect(result.current.clients[0].checklist[0].completed).toBe(false);

    const itemId = result.current.clients[0].checklist[0].id;
    act(() => { result.current.toggleChecklistItem(clientId, itemId); });
    expect(result.current.clients[0].checklist[0].completed).toBe(true);

    act(() => { result.current.toggleChecklistItem(clientId, itemId); });
    expect(result.current.clients[0].checklist[0].completed).toBe(false);
  });

  it('duplicates a client with reset checklist', () => {
    const { result } = renderHook(() => useClients());

    let clientId: string;
    act(() => {
      const client = result.current.addClient({
        name: 'Original',
        email: 'orig@test.com',
        phone: '',
        assignedTo: '',
        status: 'active',
        priority: 'none',
      });
      clientId = client.id;
    });

    act(() => { result.current.addChecklistItem(clientId, 'Task 1'); });
    const itemId = result.current.clients[0].checklist[0].id;
    act(() => { result.current.toggleChecklistItem(clientId, itemId); });

    act(() => { result.current.duplicateClient(clientId); });

    expect(result.current.clients).toHaveLength(2);
    const copy = result.current.clients[1];
    expect(copy.name).toBe('Original (Copy)');
    expect(copy.checklist[0].completed).toBe(false);
  });

  it('persists clients to localStorage', () => {
    const { result } = renderHook(() => useClients());

    act(() => {
      result.current.addClient({
        name: 'Persist Test',
        email: '',
        phone: '',
        assignedTo: '',
        status: 'active',
        priority: 'none',
      });
    });

    const stored = JSON.parse(localStorage.getItem('embark-clients') ?? '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe('Persist Test');
  });

  it('removes auto-created next occurrence when un-completing a recurring task', () => {
    const { result } = renderHook(() => useClients());

    let clientId = '';
    let taskId = '';

    // Create client with a weekly recurring task that has a due date
    act(() => {
      const client = result.current.addClient({
        name: 'Recur Test',
        email: '',
        phone: '',
        assignedTo: '',
        status: 'active',
        priority: 'none',
      });
      clientId = client.id;
    });

    act(() => {
      result.current.addChecklistItem(clientId, 'Weekly Standup', '2026-03-10');
    });

    act(() => {
      taskId = result.current.clients[0].checklist[0].id;
      result.current.updateChecklistItem(clientId, taskId, { recurrence: 'weekly' });
    });

    // Complete the task — this creates a next occurrence
    act(() => {
      result.current.toggleChecklistItem(clientId, taskId);
    });

    // Should now have 2 tasks: completed original + new pending occurrence
    expect(result.current.clients[0].checklist).toHaveLength(2);
    const occurrence = result.current.clients[0].checklist.find(
      (t) => t.id !== taskId && !t.completed
    );
    expect(occurrence).toBeDefined();
    expect(occurrence?.title).toBe('Weekly Standup');

    // Un-complete the original task
    act(() => {
      result.current.toggleChecklistItem(clientId, taskId);
    });

    // The auto-created next occurrence should be removed
    expect(result.current.clients[0].checklist).toHaveLength(1);
    expect(result.current.clients[0].checklist[0].id).toBe(taskId);
  });
});
