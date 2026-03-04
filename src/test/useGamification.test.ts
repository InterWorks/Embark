import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGamification } from '../hooks/useGamification';

beforeEach(() => {
  localStorage.clear();
});

describe('useGamification', () => {
  it('starts with a default player at level 1 with 0 XP', () => {
    const { result } = renderHook(() => useGamification());
    const state = result.current.getCurrentPlayerState();
    expect(state.totalXP).toBe(0);
    expect(state.characterClass).toBeNull();
    expect(state.unlockedDeeds).toHaveLength(0);
  });

  it('awards XP and updates totalXP', () => {
    const { result } = renderHook(() => useGamification());
    act(() => { result.current.awardXP(50); });
    expect(result.current.getCurrentPlayerState().totalXP).toBe(50);
  });

  it('detects level-up at 100 XP', () => {
    const { result } = renderHook(() => useGamification());
    let leveledUp = false;
    act(() => {
      const outcome = result.current.awardXP(100);
      leveledUp = outcome.leveledUp;
    });
    expect(leveledUp).toBe(true);
    expect(result.current.getCurrentPlayerState().totalXP).toBe(100);
  });

  it('does not report level-up when XP stays below threshold', () => {
    const { result } = renderHook(() => useGamification());
    let leveledUp = false;
    act(() => {
      const outcome = result.current.awardXP(50);
      leveledUp = outcome.leveledUp;
    });
    expect(leveledUp).toBe(false);
  });

  it('queues an xp_gained event after awardXP', () => {
    const { result } = renderHook(() => useGamification());
    act(() => { result.current.awardXP(10); });
    const events = result.current.getPendingEvents();
    expect(events.some(e => e.type === 'xp_gained' && e.xpGained === 10)).toBe(true);
  });

  it('queues a level_up event when leveling up', () => {
    const { result } = renderHook(() => useGamification());
    act(() => { result.current.awardXP(100); });
    const events = result.current.getPendingEvents();
    expect(events.some(e => e.type === 'level_up' && e.newLevel === 2)).toBe(true);
  });

  it('dismisses an event by ID', () => {
    const { result } = renderHook(() => useGamification());
    act(() => { result.current.awardXP(10); });
    const events = result.current.getPendingEvents();
    expect(events.length).toBeGreaterThan(0);
    act(() => { result.current.dismissEvent(events[0].id); });
    expect(result.current.getPendingEvents().find(e => e.id === events[0].id)).toBeUndefined();
  });

  it('selects a character class', () => {
    const { result } = renderHook(() => useGamification());
    act(() => { result.current.selectClass('wizard'); });
    expect(result.current.getCurrentPlayerState().characterClass).toBe('wizard');
  });

  it('unlocks the first_blood deed after first task', () => {
    const { result } = renderHook(() => useGamification());
    act(() => {
      result.current.trackTaskCompleted({ onTime: false });
    });
    expect(result.current.getCurrentPlayerState().unlockedDeeds).toContain('first_blood');
  });

  it('accumulates streak on consecutive days', () => {
    const { result } = renderHook(() => useGamification());
    act(() => {
      result.current.trackDailyActivity('2026-02-26');
      result.current.trackDailyActivity('2026-02-27');
    });
    expect(result.current.getCurrentPlayerState().currentStreak).toBe(2);
  });

  it('resets streak on gap day', () => {
    const { result } = renderHook(() => useGamification());
    act(() => {
      result.current.trackDailyActivity('2026-02-25');
      result.current.trackDailyActivity('2026-02-27');
    });
    expect(result.current.getCurrentPlayerState().currentStreak).toBe(1);
  });

  it('persists state to localStorage', () => {
    const { result, unmount } = renderHook(() => useGamification());
    act(() => { result.current.awardXP(200); });
    unmount();
    const { result: result2 } = renderHook(() => useGamification());
    expect(result2.current.getCurrentPlayerState().totalXP).toBe(200);
  });

  it('tracks client added and unlocks journey_begins deed', () => {
    const { result } = renderHook(() => useGamification());
    act(() => {
      result.current.trackClientAdded('client-1', 1);
    });
    expect(result.current.getCurrentPlayerState().unlockedDeeds).toContain('journey_begins');
  });
});
