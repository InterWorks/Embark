import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNotifications } from '../hooks/useNotifications';

beforeEach(() => {
  localStorage.clear();
});

describe('useNotifications', () => {
  it('starts with no notifications', () => {
    const { result } = renderHook(() => useNotifications());
    expect(result.current.notifications).toHaveLength(0);
    expect(result.current.unreadCount).toBe(0);
  });

  it('adds a notification', () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.addNotification({
        type: 'system',
        title: 'Hello',
        message: 'Test message',
      });
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].read).toBe(false);
    expect(result.current.unreadCount).toBe(1);
  });

  it('marks a notification as read', () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.addNotification({ type: 'system', title: 'Hi', message: 'Msg' });
    });

    const id = result.current.notifications[0].id;
    act(() => { result.current.markAsRead(id); });

    expect(result.current.notifications[0].read).toBe(true);
    expect(result.current.unreadCount).toBe(0);
  });

  it('marks all as read', () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.addNotification({ type: 'system', title: 'A', message: '1' });
      result.current.addNotification({ type: 'system', title: 'B', message: '2' });
    });

    expect(result.current.unreadCount).toBe(2);
    act(() => { result.current.markAllAsRead(); });
    expect(result.current.unreadCount).toBe(0);
  });

  it('dismisses a notification', () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.addNotification({ type: 'system', title: 'Dismiss', message: 'Me' });
    });

    const id = result.current.notifications[0].id;
    act(() => { result.current.dismissNotification(id); });

    // Dismissed notifications are hidden from visible list
    expect(result.current.notifications).toHaveLength(0);
  });

  it('clears all notifications', () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.addNotification({ type: 'system', title: 'A', message: '1' });
      result.current.addNotification({ type: 'system', title: 'B', message: '2' });
    });

    act(() => { result.current.clearAll(); });
    expect(result.current.notifications).toHaveLength(0);
  });

  it('notifyTaskCompleted creates a task_completed notification', () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.notifyTaskCompleted('Setup account', 'Acme Corp', 'Alice', 'client-1', 'task-1');
    });

    expect(result.current.notifications[0].type).toBe('task_completed');
    expect(result.current.notifications[0].clientId).toBe('client-1');
    expect(result.current.notifications[0].taskId).toBe('task-1');
  });

  it('notifyMilestoneReached creates a milestone_reached notification', () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.notifyMilestoneReached('Go Live', 'Acme Corp', 'client-1');
    });

    expect(result.current.notifications[0].type).toBe('milestone_reached');
    expect(result.current.notifications[0].message).toContain('Go Live');
  });

  it('respects disabled preferences — does not add notification when disabled', () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.updatePreferences({ enabled: false });
    });

    act(() => {
      result.current.addNotification({ type: 'system', title: 'Should not appear', message: '' });
    });

    expect(result.current.notifications).toHaveLength(0);
  });
});
