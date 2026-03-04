# Gamification Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a D&D-themed gamification layer to Embark — XP, levels, character classes, 28 deeds, celebrations, and a Hall of Heroes leaderboard — without changing any existing business logic.

**Architecture:** A new `useGamification` hook manages XP/levels/deeds/stats per team member in localStorage (`embark-gamification`). It's instantiated inside `ClientProvider` (same pattern as `useNotifications`), exposed via a new `GamificationContext`, and the existing `ClientContext` wrapper functions call `awardXP()` / `trackStat()` after their existing side effects. A single `GamificationOverlay` component mounted in `App.tsx` consumes a `pendingEvents` queue and renders all celebrations (XP popups, level-up modals, deed toasts, quest complete overlays).

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, Vitest, canvas-confetti (new dep)

**Design doc:** `docs/plans/2026-02-27-gamification-design.md`

---

### Task 1: Install canvas-confetti

**Files:**
- Modify: `package.json` (via npm)

**Step 1: Install the package**

```bash
npm install canvas-confetti @types/canvas-confetti
```

Expected output: `added 2 packages`

**Step 2: Verify**

```bash
node -e "require('canvas-confetti')" && echo "OK"
```

Expected: `OK`

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: install canvas-confetti for gamification celebrations"
```

---

### Task 2: Add gamification types

**Files:**
- Modify: `src/types/index.ts` (append at end of file)

**Step 1: Append the following types to the END of `src/types/index.ts`**

```typescript
// ===== Gamification =====

export type CharacterClass = 'paladin' | 'wizard' | 'ranger' | 'rogue';

export type DeedId =
  | 'journey_begins' | 'first_blood' | 'milestone_maker' | 'quest_complete'
  | 'legendary' | 'ascended'
  | 'swift_justice' | 'dead_eye' | 'speed_runner' | 'triple_crown'
  | 'perfectionist' | 'dungeon_crawler'
  | 'on_a_roll' | 'centurion' | 'war_veteran' | 'dragon_slayer'
  | 'guild_master' | 'the_oracle'
  | 'iron_will' | 'unstoppable' | 'the_planner' | 'dawn_patrol' | 'night_owl'
  | 'fellowship' | 'the_tactician' | 'scribe' | 'town_crier' | 'lorekeeper';

export interface DeedDefinition {
  id: DeedId;
  name: string;
  icon: string;
  description: string;
  flavor: string;
  category: 'progression' | 'speed' | 'volume' | 'consistency' | 'teamwork';
}

export interface MemberGamificationStats {
  tasksCompleted: number;
  tasksOnTime: number;            // completed before dueDate
  clientsGraduated: number;
  clientsGraduatedPerfect: number; // zero overdue tasks at graduation
  clientFirstActiveDates: Record<string, string>; // clientId -> ISO date first seen active
  milestonesCompleted: number;
  communicationsLogged: number;
  customFieldsFilled: number;
  plannerDaysUsed: string[];       // ISO date strings
  taskCompletionDatetimes: string[]; // ISO datetime strings (for on_a_roll / dawn_patrol / night_owl)
  uniqueAssigneesUsed: string[];   // team member IDs used as assignees
  automationRulesCreated: number;
  peakActiveClientsCount: number;
  weeklyClientGraduations: Record<string, number>; // 'YYYY-Www' -> count
}

export interface MemberGamificationState {
  memberId: string;
  displayName: string;
  characterClass: CharacterClass | null;
  totalXP: number;
  weeklyXP: number;
  weekStartDate: string;           // ISO date (Monday)
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;        // ISO date
  unlockedDeeds: DeedId[];
  stats: MemberGamificationStats;
}

export interface GamificationEvent {
  id: string;
  type: 'xp_gained' | 'level_up' | 'deed_unlocked' | 'quest_complete';
  memberId: string;
  xpGained?: number;
  previousLevel?: number;
  newLevel?: number;
  newTitle?: string;
  deed?: DeedDefinition;
  clientName?: string;
  totalXP?: number;
  createdAt: string;
}

export interface GamificationStore {
  members: Record<string, MemberGamificationState>;
  currentPlayerId: string;
  pendingEvents: GamificationEvent[];
}
```

**Step 2: Add `'hall-of-heroes'` to the View union type**

Find this line in `src/types/index.ts`:
```typescript
export type View = 'dashboard' | 'clients' | 'templates' | 'tasks' | 'planner' | 'notes' | 'ai' | 'marketplace' | 'team' | 'automations';
```

Replace with:
```typescript
export type View = 'dashboard' | 'clients' | 'templates' | 'tasks' | 'planner' | 'notes' | 'ai' | 'marketplace' | 'team' | 'automations' | 'hall-of-heroes';
```

**Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors

**Step 4: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add gamification types to type definitions"
```

---

### Task 3: Create gamification utilities

**Files:**
- Create: `src/utils/gamification.ts`

**Step 1: Create the file**

```typescript
import type { CharacterClass, DeedDefinition, DeedId, MemberGamificationState, MemberGamificationStats } from '../types';

// XP required to reach each level (index = level - 1, so index 0 = Level 1 = 0 XP)
export const LEVEL_XP_THRESHOLDS: number[] = [
  0, 100, 250, 500, 850, 1300, 1900, 2650, 3550, 4600,
  5800, 7150, 8650, 10300, 12100, 14050, 16150, 18400, 20800, 23350,
  26050, // Level 21 = Mythic threshold
];

export const MAX_NAMED_LEVEL = 20;

export function getLevel(totalXP: number): number {
  let level = 1;
  for (let i = 0; i < LEVEL_XP_THRESHOLDS.length; i++) {
    if (totalXP >= LEVEL_XP_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  return level;
}

export function getXPForLevel(level: number): number {
  return LEVEL_XP_THRESHOLDS[Math.min(level - 1, LEVEL_XP_THRESHOLDS.length - 1)] ?? 0;
}

export function getXPForNextLevel(level: number): number {
  return LEVEL_XP_THRESHOLDS[Math.min(level, LEVEL_XP_THRESHOLDS.length - 1)] ?? LEVEL_XP_THRESHOLDS[LEVEL_XP_THRESHOLDS.length - 1];
}

export function getLevelProgress(totalXP: number): { level: number; currentLevelXP: number; nextLevelXP: number; progressPct: number; isMythic: boolean } {
  const level = getLevel(totalXP);
  const isMythic = level > MAX_NAMED_LEVEL;
  const currentLevelXP = getXPForLevel(level);
  const nextLevelXP = isMythic ? currentLevelXP + 5000 : getXPForNextLevel(level);
  const xpInLevel = totalXP - currentLevelXP;
  const xpNeeded = nextLevelXP - currentLevelXP;
  const progressPct = Math.min(100, Math.round((xpInLevel / xpNeeded) * 100));
  return { level, currentLevelXP, nextLevelXP, progressPct, isMythic };
}

const CLASS_TITLES: Record<CharacterClass, string[]> = {
  paladin: ['Squire', 'Squire', 'Squire', 'Knight', 'Knight', 'Knight', 'Holy Warrior', 'Holy Warrior', 'Holy Warrior', 'Crusader', 'Crusader', 'Crusader', 'Templar', 'Templar', 'Templar', 'Templar', 'Paladin Lord', 'Paladin Lord', 'Paladin Lord', 'Paladin Lord'],
  wizard:  ['Apprentice', 'Apprentice', 'Apprentice', 'Arcanist', 'Arcanist', 'Arcanist', 'Spellblade', 'Spellblade', 'Spellblade', 'Archmage', 'Archmage', 'Archmage', 'Grand Sorcerer', 'Grand Sorcerer', 'Grand Sorcerer', 'Grand Sorcerer', 'Mystic Overlord', 'Mystic Overlord', 'Mystic Overlord', 'Mystic Overlord'],
  ranger:  ['Scout', 'Scout', 'Scout', 'Tracker', 'Tracker', 'Tracker', 'Marksman', 'Marksman', 'Marksman', 'Strider', 'Strider', 'Strider', 'Warden', 'Warden', 'Warden', 'Warden', 'Ranger Lord', 'Ranger Lord', 'Ranger Lord', 'Ranger Lord'],
  rogue:   ['Cutpurse', 'Cutpurse', 'Cutpurse', 'Trickster', 'Trickster', 'Trickster', 'Shadow', 'Shadow', 'Shadow', 'Assassin', 'Assassin', 'Assassin', 'Blade Master', 'Blade Master', 'Blade Master', 'Blade Master', 'Phantom', 'Phantom', 'Phantom', 'Phantom'],
};

const MYTHIC_TITLES: Record<CharacterClass, string> = {
  paladin: 'Divine Champion',
  wizard: 'Arcane Legend',
  ranger: 'Mythic Hunter',
  rogue: 'Legend of Shadows',
};

export function getTitle(characterClass: CharacterClass | null, level: number): string {
  if (!characterClass) return `Level ${level}`;
  if (level > MAX_NAMED_LEVEL) return MYTHIC_TITLES[characterClass];
  return CLASS_TITLES[characterClass][Math.min(level - 1, 19)];
}

export function getClassIcon(characterClass: CharacterClass | null): string {
  if (!characterClass) return '⚔️';
  return { paladin: '⚔️', wizard: '🧙', ranger: '🏹', rogue: '🗡️' }[characterClass];
}

export const DEEDS: Record<DeedId, DeedDefinition> = {
  // Progression
  journey_begins:  { id: 'journey_begins',  name: 'The Journey Begins', icon: '🗺️', description: 'Add your first client', flavor: 'Every legend starts with a single step.', category: 'progression' },
  first_blood:     { id: 'first_blood',     name: 'First Blood',        icon: '⚔️', description: 'Complete your first task', flavor: 'The adventure has begun.', category: 'progression' },
  milestone_maker: { id: 'milestone_maker', name: 'Milestone Maker',    icon: '🧱', description: 'Complete your first milestone', flavor: 'Stone by stone, empires are built.', category: 'progression' },
  quest_complete:  { id: 'quest_complete',  name: 'Quest Complete',     icon: '🎉', description: 'Graduate your first client', flavor: 'The realm grows stronger.', category: 'progression' },
  legendary:       { id: 'legendary',       name: 'Legendary',          icon: '⭐', description: 'Reach Level 20', flavor: 'Songs are sung in your honor.', category: 'progression' },
  ascended:        { id: 'ascended',        name: 'Ascended',           icon: '🌟', description: 'Reach Mythic rank (Level 21+)', flavor: 'You have transcended mortal limits.', category: 'progression' },
  // Speed & Skill
  swift_justice:   { id: 'swift_justice',   name: 'Swift Justice',      icon: '⚡', description: 'Complete 10 tasks before their due date', flavor: 'They never saw you coming.', category: 'speed' },
  dead_eye:        { id: 'dead_eye',        name: 'Dead Eye',           icon: '🎯', description: 'Complete 50 tasks before their due date', flavor: 'Your precision is legendary.', category: 'speed' },
  speed_runner:    { id: 'speed_runner',    name: 'Speed Runner',       icon: '🚀', description: 'Graduate a client in under 7 days', flavor: 'Blink and they missed it.', category: 'speed' },
  triple_crown:    { id: 'triple_crown',    name: 'Triple Crown',       icon: '🏆', description: 'Graduate 3 clients in one week', flavor: 'Three quests. One week. Legendary.', category: 'speed' },
  perfectionist:   { id: 'perfectionist',   name: 'Perfectionist',      icon: '💎', description: 'Graduate a client with zero overdue tasks', flavor: 'Not a single foe left standing.', category: 'speed' },
  dungeon_crawler: { id: 'dungeon_crawler', name: 'Dungeon Crawler',    icon: '👾', description: 'Graduate a client with 20+ checklist items', flavor: 'You cleared the entire dungeon.', category: 'speed' },
  // Volume & Grind
  on_a_roll:       { id: 'on_a_roll',       name: 'On a Roll',          icon: '🔥', description: 'Complete 5 tasks in a single day', flavor: 'The dice are hot tonight.', category: 'volume' },
  centurion:       { id: 'centurion',       name: 'Centurion',          icon: '💯', description: 'Complete 100 tasks total', flavor: 'A hundred victories behind you.', category: 'volume' },
  war_veteran:     { id: 'war_veteran',     name: 'War Veteran',        icon: '💪', description: 'Complete 500 tasks total', flavor: 'You have seen things others cannot imagine.', category: 'volume' },
  dragon_slayer:   { id: 'dragon_slayer',   name: 'Dragon Slayer',      icon: '🐉', description: 'Graduate 10 clients total', flavor: 'The dragons fear your name.', category: 'volume' },
  guild_master:    { id: 'guild_master',    name: 'Guild Master',       icon: '👑', description: 'Have 5+ active clients at once', flavor: 'The guild hall overflows with work.', category: 'volume' },
  the_oracle:      { id: 'the_oracle',      name: 'The Oracle',         icon: '🔮', description: 'Complete 10 milestones total', flavor: 'The path ahead is always clear to you.', category: 'volume' },
  // Consistency
  iron_will:       { id: 'iron_will',       name: 'Iron Will',          icon: '🛡️', description: 'Reach a 7-day streak', flavor: 'Seven days. Unbroken.', category: 'consistency' },
  unstoppable:     { id: 'unstoppable',     name: 'Unstoppable',        icon: '🔱', description: 'Reach a 30-day streak', flavor: 'Not even the gods could halt your progress.', category: 'consistency' },
  the_planner:     { id: 'the_planner',     name: 'The Planner',        icon: '📅', description: 'Use the Daily Planner 5 days in a row', flavor: 'Fortune favors the prepared.', category: 'consistency' },
  dawn_patrol:     { id: 'dawn_patrol',     name: 'Dawn Patrol',        icon: '🌅', description: 'Complete a task before 9am', flavor: 'The early rogue catches the gold.', category: 'consistency' },
  night_owl:       { id: 'night_owl',       name: 'Night Owl',          icon: '🌙', description: 'Complete a task after 10pm', flavor: 'The dungeon never sleeps, and neither do you.', category: 'consistency' },
  // Teamwork & Craft
  fellowship:      { id: 'fellowship',      name: 'Fellowship',         icon: '🤝', description: 'Assign tasks to 3 different teammates', flavor: 'No hero walks alone.', category: 'teamwork' },
  the_tactician:   { id: 'the_tactician',   name: 'The Tactician',      icon: '🗡️', description: 'Set up 5 automation rules', flavor: 'Let the traps do the work.', category: 'teamwork' },
  scribe:          { id: 'scribe',          name: 'Scribe',             icon: '📜', description: 'Log 20 communications or notes', flavor: 'History is written by those who show up.', category: 'teamwork' },
  town_crier:      { id: 'town_crier',      name: 'Town Crier',         icon: '📣', description: 'Log 50 communications', flavor: 'Everyone knows your clients\' stories.', category: 'teamwork' },
  lorekeeper:      { id: 'lorekeeper',      name: 'Lorekeeper',         icon: '📖', description: 'Fill out custom fields on 10 clients', flavor: 'Knowledge is the sharpest blade.', category: 'teamwork' },
};

export const DEFAULT_STATS: MemberGamificationStats = {
  tasksCompleted: 0,
  tasksOnTime: 0,
  clientsGraduated: 0,
  clientsGraduatedPerfect: 0,
  clientFirstActiveDates: {},
  milestonesCompleted: 0,
  communicationsLogged: 0,
  customFieldsFilled: 0,
  plannerDaysUsed: [],
  taskCompletionDatetimes: [],
  uniqueAssigneesUsed: [],
  automationRulesCreated: 0,
  peakActiveClientsCount: 0,
  weeklyClientGraduations: {},
};

export function createDefaultMember(memberId: string, displayName: string): MemberGamificationState {
  return {
    memberId,
    displayName,
    characterClass: null,
    totalXP: 0,
    weeklyXP: 0,
    weekStartDate: getWeekStart(new Date()),
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: '',
    unlockedDeeds: [],
    stats: { ...DEFAULT_STATS },
  };
}

export function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

export function getWeekKey(date: Date): string {
  const weekStart = getWeekStart(date);
  return weekStart;
}

/** Check which deeds are newly unlocked given updated stats */
export function checkDeedConditions(
  stats: MemberGamificationStats,
  totalXP: number,
  currentStreak: number,
  unlockedDeeds: DeedId[],
  activeClientsCount: number,
): DeedId[] {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const hour = now.getHours();
  const _ = hour; // used below

  // Count tasks completed today
  const tasksToday = stats.taskCompletionDatetimes.filter(dt =>
    dt.startsWith(todayStr)
  ).length;

  // Count tasks completed before 9am or after 10pm
  const hasEarlyTask = stats.taskCompletionDatetimes.some(dt => {
    const h = new Date(dt).getHours();
    return h < 9;
  });
  const hasLateTask = stats.taskCompletionDatetimes.some(dt => {
    const h = new Date(dt).getHours();
    return h >= 22;
  });

  // Check current week's client graduations
  const thisWeek = getWeekKey(now);
  const weekGrads = stats.weeklyClientGraduations[thisWeek] ?? 0;

  const level = getLevel(totalXP);

  const candidates: DeedId[] = [];

  if (Object.keys(stats.clientFirstActiveDates).length >= 1) candidates.push('journey_begins');
  if (stats.tasksCompleted >= 1) candidates.push('first_blood');
  if (stats.milestonesCompleted >= 1) candidates.push('milestone_maker');
  if (stats.clientsGraduated >= 1) candidates.push('quest_complete');
  if (level >= 20) candidates.push('legendary');
  if (level > 20) candidates.push('ascended');

  if (stats.tasksOnTime >= 10) candidates.push('swift_justice');
  if (stats.tasksOnTime >= 50) candidates.push('dead_eye');
  // speed_runner: checked externally (needs days calculation)
  if (weekGrads >= 3) candidates.push('triple_crown');
  if (stats.clientsGraduatedPerfect >= 1) candidates.push('perfectionist');
  // dungeon_crawler: checked externally

  if (tasksToday >= 5) candidates.push('on_a_roll');
  if (stats.tasksCompleted >= 100) candidates.push('centurion');
  if (stats.tasksCompleted >= 500) candidates.push('war_veteran');
  if (stats.clientsGraduated >= 10) candidates.push('dragon_slayer');
  if (activeClientsCount >= 5 || stats.peakActiveClientsCount >= 5) candidates.push('guild_master');
  if (stats.milestonesCompleted >= 10) candidates.push('the_oracle');

  if (currentStreak >= 7) candidates.push('iron_will');
  if (currentStreak >= 30) candidates.push('unstoppable');
  // the_planner: checked externally (consecutive planner days)
  if (hasEarlyTask) candidates.push('dawn_patrol');
  if (hasLateTask) candidates.push('night_owl');

  if (stats.uniqueAssigneesUsed.length >= 3) candidates.push('fellowship');
  if (stats.automationRulesCreated >= 5) candidates.push('the_tactician');
  if (stats.communicationsLogged >= 20) candidates.push('scribe');
  if (stats.communicationsLogged >= 50) candidates.push('town_crier');
  if (stats.customFieldsFilled >= 10) candidates.push('lorekeeper');

  return candidates.filter(id => !unlockedDeeds.includes(id));
}
```

**Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors

**Step 3: Commit**

```bash
git add src/utils/gamification.ts
git commit -m "feat: add gamification utilities (levels, titles, deed definitions)"
```

---

### Task 4: Write useGamification tests

**Files:**
- Create: `src/test/useGamification.test.ts`

**Step 1: Create test file**

```typescript
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
    act(() => {
      result.current.awardXP(50);
    });
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
    expect(events).toHaveLength(1);
    act(() => { result.current.dismissEvent(events[0].id); });
    expect(result.current.getPendingEvents()).toHaveLength(0);
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
    // Simulate two consecutive daily activities
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
      result.current.trackDailyActivity('2026-02-27'); // skip Feb 26
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
});
```

**Step 2: Run tests to confirm they fail**

```bash
npm run test:run -- src/test/useGamification.test.ts
```

Expected: all tests fail with "Cannot find module '../hooks/useGamification'"

---

### Task 5: Implement useGamification hook

**Files:**
- Create: `src/hooks/useGamification.ts`

**Step 1: Create the hook**

```typescript
import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type {
  GamificationStore, GamificationEvent, MemberGamificationState,
  CharacterClass, DeedId, DeedDefinition,
} from '../types';
import {
  getLevel, getTitle, getClassIcon, createDefaultMember,
  getWeekStart, getWeekKey, checkDeedConditions, DEEDS,
  DEFAULT_STATS,
} from '../utils/gamification';

const DEFAULT_PLAYER_ID = 'default';

const defaultStore: GamificationStore = {
  members: {
    [DEFAULT_PLAYER_ID]: createDefaultMember(DEFAULT_PLAYER_ID, 'You'),
  },
  currentPlayerId: DEFAULT_PLAYER_ID,
  pendingEvents: [],
};

export interface AwardXPResult {
  xpGained: number;
  leveledUp: boolean;
  previousLevel: number;
  newLevel: number;
  newDeeds: DeedDefinition[];
}

export interface TrackTaskCompletedOptions {
  onTime: boolean;
  clientId?: string;
  completedAt?: string; // ISO datetime, defaults to now
  assignee?: string;
}

export function useGamification() {
  const [store, setStore] = useLocalStorage<GamificationStore>('embark-gamification', defaultStore);

  const getCurrentPlayerState = useCallback((): MemberGamificationState => {
    return store.members[store.currentPlayerId] ?? createDefaultMember(store.currentPlayerId, 'You');
  }, [store]);

  const getPendingEvents = useCallback((): GamificationEvent[] => {
    return store.pendingEvents;
  }, [store]);

  const dismissEvent = useCallback((eventId: string) => {
    setStore(prev => ({
      ...prev,
      pendingEvents: prev.pendingEvents.filter(e => e.id !== eventId),
    }));
  }, [setStore]);

  const selectClass = useCallback((characterClass: CharacterClass, memberId?: string) => {
    const id = memberId ?? store.currentPlayerId;
    setStore(prev => ({
      ...prev,
      members: {
        ...prev.members,
        [id]: {
          ...(prev.members[id] ?? createDefaultMember(id, 'You')),
          characterClass,
        },
      },
    }));
  }, [store.currentPlayerId, setStore]);

  const setCurrentPlayer = useCallback((memberId: string, displayName?: string) => {
    setStore(prev => {
      const existing = prev.members[memberId];
      return {
        ...prev,
        currentPlayerId: memberId,
        members: {
          ...prev.members,
          [memberId]: existing ?? createDefaultMember(memberId, displayName ?? memberId),
        },
      };
    });
  }, [setStore]);

  /** Core: award XP and handle level-up + deed checks. Returns outcome for UI. */
  const awardXP = useCallback((amount: number, memberId?: string): AwardXPResult => {
    const id = memberId ?? store.currentPlayerId;
    let result: AwardXPResult = { xpGained: amount, leveledUp: false, previousLevel: 1, newLevel: 1, newDeeds: [] };

    setStore(prev => {
      const member = prev.members[id] ?? createDefaultMember(id, 'You');
      const previousLevel = getLevel(member.totalXP);
      const newTotalXP = member.totalXP + amount;
      const newLevel = getLevel(newTotalXP);
      const leveledUp = newLevel > previousLevel;

      // Reset weekly XP if new week
      const thisWeek = getWeekStart(new Date());
      const isNewWeek = member.weekStartDate !== thisWeek;
      const weeklyXP = isNewWeek ? amount : member.weeklyXP + amount;

      // Check deeds
      const activeClients = 0; // passed externally via trackClientAdded
      const newDeedIds = checkDeedConditions(
        member.stats, newTotalXP, member.currentStreak, member.unlockedDeeds, activeClients
      );
      const newDeeds = newDeedIds.map(id => DEEDS[id]);

      // Build pending events
      const now = new Date().toISOString();
      const newEvents: GamificationEvent[] = [
        {
          id: crypto.randomUUID(),
          type: 'xp_gained',
          memberId: id,
          xpGained: amount,
          totalXP: newTotalXP,
          createdAt: now,
        },
      ];
      if (leveledUp) {
        newEvents.push({
          id: crypto.randomUUID(),
          type: 'level_up',
          memberId: id,
          previousLevel,
          newLevel,
          newTitle: getTitle(member.characterClass, newLevel),
          totalXP: newTotalXP,
          createdAt: now,
        });
      }
      for (const deed of newDeeds) {
        newEvents.push({
          id: crypto.randomUUID(),
          type: 'deed_unlocked',
          memberId: id,
          deed,
          createdAt: now,
        });
      }

      result = { xpGained: amount, leveledUp, previousLevel, newLevel, newDeeds };

      return {
        ...prev,
        pendingEvents: [...prev.pendingEvents, ...newEvents],
        members: {
          ...prev.members,
          [id]: {
            ...member,
            totalXP: newTotalXP,
            weeklyXP,
            weekStartDate: isNewWeek ? thisWeek : member.weekStartDate,
            unlockedDeeds: [...member.unlockedDeeds, ...newDeedIds],
          },
        },
      };
    });

    return result;
  }, [store.currentPlayerId, setStore]);

  const trackDailyActivity = useCallback((dateStr?: string, memberId?: string) => {
    const id = memberId ?? store.currentPlayerId;
    const today = dateStr ?? new Date().toISOString().split('T')[0];

    setStore(prev => {
      const member = prev.members[id] ?? createDefaultMember(id, 'You');
      if (member.lastActivityDate === today) return prev; // already tracked today

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const streak = member.lastActivityDate === yesterdayStr
        ? member.currentStreak + 1
        : 1;
      const longestStreak = Math.max(member.longestStreak, streak);

      // Planner consecutive days: check if in plannerDaysUsed
      const plannerDays = member.stats.plannerDaysUsed;
      const wasYesterdayInPlanner = plannerDays.includes(yesterdayStr);
      const consecutivePlannerDays = plannerDays.filter(d => {
        const diff = (new Date(today).getTime() - new Date(d).getTime()) / 86400000;
        return diff >= 0 && diff < 5;
      }).length + 1;
      const newPlannerDeeds: DeedId[] = [];
      if (consecutivePlannerDays >= 5 && !member.unlockedDeeds.includes('the_planner')) {
        newPlannerDeeds.push('the_planner');
      }

      // Streak deeds
      const newStreakDeeds: DeedId[] = [];
      if (streak >= 7 && !member.unlockedDeeds.includes('iron_will')) newStreakDeeds.push('iron_will');
      if (streak >= 30 && !member.unlockedDeeds.includes('unstoppable')) newStreakDeeds.push('unstoppable');

      const allNewDeeds = [...newPlannerDeeds, ...newStreakDeeds];
      const now = new Date().toISOString();
      const deedEvents: GamificationEvent[] = allNewDeeds.map(deedId => ({
        id: crypto.randomUUID(),
        type: 'deed_unlocked' as const,
        memberId: id,
        deed: DEEDS[deedId],
        createdAt: now,
      }));

      return {
        ...prev,
        pendingEvents: [...prev.pendingEvents, ...deedEvents],
        members: {
          ...prev.members,
          [id]: {
            ...member,
            lastActivityDate: today,
            currentStreak: streak,
            longestStreak,
            unlockedDeeds: [...member.unlockedDeeds, ...allNewDeeds],
          },
        },
      };
    });
  }, [store.currentPlayerId, setStore]);

  const trackTaskCompleted = useCallback((opts: TrackTaskCompletedOptions, memberId?: string) => {
    const id = memberId ?? store.currentPlayerId;
    const completedAt = opts.completedAt ?? new Date().toISOString();

    setStore(prev => {
      const member = prev.members[id] ?? createDefaultMember(id, 'You');
      const newStats = {
        ...member.stats,
        tasksCompleted: member.stats.tasksCompleted + 1,
        tasksOnTime: opts.onTime ? member.stats.tasksOnTime + 1 : member.stats.tasksOnTime,
        taskCompletionDatetimes: [...member.stats.taskCompletionDatetimes, completedAt],
        uniqueAssigneesUsed: opts.assignee && !member.stats.uniqueAssigneesUsed.includes(opts.assignee)
          ? [...member.stats.uniqueAssigneesUsed, opts.assignee]
          : member.stats.uniqueAssigneesUsed,
      };

      const newDeedIds = checkDeedConditions(newStats, member.totalXP, member.currentStreak, member.unlockedDeeds, member.stats.peakActiveClientsCount);
      const now = new Date().toISOString();
      const deedEvents: GamificationEvent[] = newDeedIds.map(deedId => ({
        id: crypto.randomUUID(), type: 'deed_unlocked' as const, memberId: id, deed: DEEDS[deedId], createdAt: now,
      }));

      return {
        ...prev,
        pendingEvents: [...prev.pendingEvents, ...deedEvents],
        members: {
          ...prev.members,
          [id]: { ...member, stats: newStats, unlockedDeeds: [...member.unlockedDeeds, ...newDeedIds] },
        },
      };
    });
  }, [store.currentPlayerId, setStore]);

  const trackClientAdded = useCallback((clientId: string, activeCount: number, memberId?: string) => {
    const id = memberId ?? store.currentPlayerId;
    setStore(prev => {
      const member = prev.members[id] ?? createDefaultMember(id, 'You');
      const today = new Date().toISOString().split('T')[0];
      const newStats = {
        ...member.stats,
        clientFirstActiveDates: { ...member.stats.clientFirstActiveDates, [clientId]: today },
        peakActiveClientsCount: Math.max(member.stats.peakActiveClientsCount, activeCount),
      };
      const newDeedIds = checkDeedConditions(newStats, member.totalXP, member.currentStreak, member.unlockedDeeds, activeCount);
      const now = new Date().toISOString();
      const deedEvents: GamificationEvent[] = newDeedIds.map(deedId => ({
        id: crypto.randomUUID(), type: 'deed_unlocked' as const, memberId: id, deed: DEEDS[deedId], createdAt: now,
      }));
      return {
        ...prev,
        pendingEvents: [...prev.pendingEvents, ...deedEvents],
        members: {
          ...prev.members,
          [id]: { ...member, stats: newStats, unlockedDeeds: [...member.unlockedDeeds, ...newDeedIds] },
        },
      };
    });
  }, [store.currentPlayerId, setStore]);

  const trackClientGraduated = useCallback((
    clientId: string,
    opts: { perfect: boolean; daysToGraduate: number; checklistSize: number; clientName: string },
    memberId?: string
  ) => {
    const id = memberId ?? store.currentPlayerId;
    setStore(prev => {
      const member = prev.members[id] ?? createDefaultMember(id, 'You');
      const now = new Date();
      const weekKey = getWeekKey(now);
      const newWeekGrads = { ...member.stats.weeklyClientGraduations };
      newWeekGrads[weekKey] = (newWeekGrads[weekKey] ?? 0) + 1;

      const newStats = {
        ...member.stats,
        clientsGraduated: member.stats.clientsGraduated + 1,
        clientsGraduatedPerfect: opts.perfect
          ? member.stats.clientsGraduatedPerfect + 1
          : member.stats.clientsGraduatedPerfect,
        weeklyClientGraduations: newWeekGrads,
      };

      // Check speed_runner and dungeon_crawler manually
      const extraDeeds: DeedId[] = [];
      if (opts.daysToGraduate < 7 && !member.unlockedDeeds.includes('speed_runner')) {
        extraDeeds.push('speed_runner');
      }
      if (opts.checklistSize >= 20 && !member.unlockedDeeds.includes('dungeon_crawler')) {
        extraDeeds.push('dungeon_crawler');
      }

      const autoDeeds = checkDeedConditions(newStats, member.totalXP, member.currentStreak, member.unlockedDeeds, member.stats.peakActiveClientsCount);
      const allNewDeeds = [...new Set([...autoDeeds, ...extraDeeds])].filter(d => !member.unlockedDeeds.includes(d));

      const nowIso = now.toISOString();
      const questEvent: GamificationEvent = {
        id: crypto.randomUUID(), type: 'quest_complete', memberId: id,
        clientName: opts.clientName,
        xpGained: 75, // will be awarded separately via awardXP
        createdAt: nowIso,
      };
      const deedEvents: GamificationEvent[] = allNewDeeds.map(deedId => ({
        id: crypto.randomUUID(), type: 'deed_unlocked' as const, memberId: id, deed: DEEDS[deedId], createdAt: nowIso,
      }));

      return {
        ...prev,
        pendingEvents: [...prev.pendingEvents, questEvent, ...deedEvents],
        members: {
          ...prev.members,
          [id]: { ...member, stats: newStats, unlockedDeeds: [...member.unlockedDeeds, ...allNewDeeds] },
        },
      };
    });
  }, [store.currentPlayerId, setStore]);

  const trackMilestoneCompleted = useCallback((memberId?: string) => {
    const id = memberId ?? store.currentPlayerId;
    setStore(prev => {
      const member = prev.members[id] ?? createDefaultMember(id, 'You');
      const newStats = { ...member.stats, milestonesCompleted: member.stats.milestonesCompleted + 1 };
      const newDeedIds = checkDeedConditions(newStats, member.totalXP, member.currentStreak, member.unlockedDeeds, member.stats.peakActiveClientsCount);
      const now = new Date().toISOString();
      const deedEvents: GamificationEvent[] = newDeedIds.map(deedId => ({
        id: crypto.randomUUID(), type: 'deed_unlocked' as const, memberId: id, deed: DEEDS[deedId], createdAt: now,
      }));
      return {
        ...prev,
        pendingEvents: [...prev.pendingEvents, ...deedEvents],
        members: { ...prev.members, [id]: { ...member, stats: newStats, unlockedDeeds: [...member.unlockedDeeds, ...newDeedIds] } },
      };
    });
  }, [store.currentPlayerId, setStore]);

  const trackCommunicationLogged = useCallback((memberId?: string) => {
    const id = memberId ?? store.currentPlayerId;
    setStore(prev => {
      const member = prev.members[id] ?? createDefaultMember(id, 'You');
      const newStats = { ...member.stats, communicationsLogged: member.stats.communicationsLogged + 1 };
      const newDeedIds = checkDeedConditions(newStats, member.totalXP, member.currentStreak, member.unlockedDeeds, member.stats.peakActiveClientsCount);
      const now = new Date().toISOString();
      const deedEvents: GamificationEvent[] = newDeedIds.map(deedId => ({
        id: crypto.randomUUID(), type: 'deed_unlocked' as const, memberId: id, deed: DEEDS[deedId], createdAt: now,
      }));
      return {
        ...prev,
        pendingEvents: [...prev.pendingEvents, ...deedEvents],
        members: { ...prev.members, [id]: { ...member, stats: newStats, unlockedDeeds: [...member.unlockedDeeds, ...newDeedIds] } },
      };
    });
  }, [store.currentPlayerId, setStore]);

  const trackCustomFieldFilled = useCallback((memberId?: string) => {
    const id = memberId ?? store.currentPlayerId;
    setStore(prev => {
      const member = prev.members[id] ?? createDefaultMember(id, 'You');
      const newStats = { ...member.stats, customFieldsFilled: member.stats.customFieldsFilled + 1 };
      const newDeedIds = checkDeedConditions(newStats, member.totalXP, member.currentStreak, member.unlockedDeeds, member.stats.peakActiveClientsCount);
      const now = new Date().toISOString();
      const deedEvents: GamificationEvent[] = newDeedIds.map(deedId => ({
        id: crypto.randomUUID(), type: 'deed_unlocked' as const, memberId: id, deed: DEEDS[deedId], createdAt: now,
      }));
      return {
        ...prev,
        pendingEvents: [...prev.pendingEvents, ...deedEvents],
        members: { ...prev.members, [id]: { ...member, stats: newStats, unlockedDeeds: [...member.unlockedDeeds, ...newDeedIds] } },
      };
    });
  }, [store.currentPlayerId, setStore]);

  const trackAutomationCreated = useCallback((memberId?: string) => {
    const id = memberId ?? store.currentPlayerId;
    setStore(prev => {
      const member = prev.members[id] ?? createDefaultMember(id, 'You');
      const newStats = { ...member.stats, automationRulesCreated: member.stats.automationRulesCreated + 1 };
      const newDeedIds = checkDeedConditions(newStats, member.totalXP, member.currentStreak, member.unlockedDeeds, member.stats.peakActiveClientsCount);
      const now = new Date().toISOString();
      const deedEvents: GamificationEvent[] = newDeedIds.map(deedId => ({
        id: crypto.randomUUID(), type: 'deed_unlocked' as const, memberId: id, deed: DEEDS[deedId], createdAt: now,
      }));
      return {
        ...prev,
        pendingEvents: [...prev.pendingEvents, ...deedEvents],
        members: { ...prev.members, [id]: { ...member, stats: newStats, unlockedDeeds: [...member.unlockedDeeds, ...newDeedIds] } },
      };
    });
  }, [store.currentPlayerId, setStore]);

  const trackPlannerDay = useCallback((dateStr?: string, memberId?: string) => {
    const id = memberId ?? store.currentPlayerId;
    const today = dateStr ?? new Date().toISOString().split('T')[0];
    setStore(prev => {
      const member = prev.members[id] ?? createDefaultMember(id, 'You');
      if (member.stats.plannerDaysUsed.includes(today)) return prev;
      const newPlannerDays = [...member.stats.plannerDaysUsed, today];
      const newStats = { ...member.stats, plannerDaysUsed: newPlannerDays };
      return {
        ...prev,
        members: { ...prev.members, [id]: { ...member, stats: newStats } },
      };
    });
  }, [store.currentPlayerId, setStore]);

  const allMembers = useMemo(() => Object.values(store.members), [store.members]);

  return {
    getCurrentPlayerState,
    getPendingEvents,
    dismissEvent,
    selectClass,
    setCurrentPlayer,
    awardXP,
    trackDailyActivity,
    trackTaskCompleted,
    trackClientAdded,
    trackClientGraduated,
    trackMilestoneCompleted,
    trackCommunicationLogged,
    trackCustomFieldFilled,
    trackAutomationCreated,
    trackPlannerDay,
    allMembers,
    currentPlayerId: store.currentPlayerId,
    // Utility re-exports for UI
    getLevel,
    getTitle,
    getClassIcon,
  };
}
```

**Step 2: Run tests**

```bash
npm run test:run -- src/test/useGamification.test.ts
```

Expected: all 13 tests pass

**Step 3: Commit**

```bash
git add src/hooks/useGamification.ts src/test/useGamification.test.ts
git commit -m "feat: implement useGamification hook with XP, levels, streaks, and deeds"
```

---

### Task 6: Create GamificationContext

**Files:**
- Create: `src/context/GamificationContext.tsx`

**Step 1: Create the context**

```typescript
import { createContext, useContext } from 'react';
import type { useGamification } from '../hooks/useGamification';

// The context type is the full return type of useGamification
export type GamificationContextType = ReturnType<typeof useGamification>;

export const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export function useGamificationContext(): GamificationContextType {
  const ctx = useContext(GamificationContext);
  if (!ctx) throw new Error('useGamificationContext must be used within GamificationContext.Provider');
  return ctx;
}
```

**Step 2: Wire into ClientProvider — modify `src/context/ClientContext.tsx`**

Add import at top:
```typescript
import { useGamification } from '../hooks/useGamification';
import { GamificationContext } from './GamificationContext';
```

Inside `ClientProvider`, after all existing hook calls (after `useNotifications`):
```typescript
const gamification = useGamification();
```

Wrap the return JSX:
```typescript
return (
  <GamificationContext.Provider value={gamification}>
    <ClientContext.Provider value={contextValue}>
      {children}
    </ClientContext.Provider>
  </GamificationContext.Provider>
);
```

**Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors

**Step 4: Commit**

```bash
git add src/context/GamificationContext.tsx src/context/ClientContext.tsx
git commit -m "feat: create GamificationContext and wire useGamification into ClientProvider"
```

---

### Task 7: Create XPPopup component

**Files:**
- Create: `src/components/Gamification/XPPopup.tsx`

**Step 1: Create the component**

This shows a `+15 XP` chip that floats up and fades. It is triggered by `xp_gained` events from the queue.

```tsx
import { useEffect, useState } from 'react';

interface XPPopupProps {
  amount: number;
  onDone: () => void;
}

export function XPPopup({ amount, onDone }: XPPopupProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 300); // wait for fade-out
    }, 1200);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div
      className={`
        fixed bottom-24 right-6 z-[200]
        pointer-events-none
        transition-all duration-300
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-6'}
      `}
    >
      <div className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-lg">
        <span>⚡</span>
        <span>+{amount} XP</span>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/Gamification/XPPopup.tsx
git commit -m "feat: add XPPopup floating animation component"
```

---

### Task 8: Create DeedToast component

**Files:**
- Create: `src/components/Gamification/DeedToast.tsx`

**Step 1: Create the component**

```tsx
import { useEffect, useState } from 'react';
import type { DeedDefinition } from '../../types';

interface DeedToastProps {
  deed: DeedDefinition;
  onDone: () => void;
}

export function DeedToast({ deed, onDone }: DeedToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Small delay so the enter animation plays
    const show = setTimeout(() => setVisible(true), 50);
    const hide = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 400);
    }, 4000);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, [onDone]);

  return (
    <div
      className={`
        fixed top-20 right-4 z-[200] max-w-sm w-full
        transition-all duration-400
        ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}
      `}
    >
      <div className="flex items-start gap-3 bg-gradient-to-br from-amber-900/90 to-yellow-900/90 border-2 border-yellow-500/60 backdrop-blur-md rounded-2xl p-4 shadow-2xl">
        <span className="text-3xl flex-shrink-0">{deed.icon}</span>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-yellow-400 uppercase tracking-wider mb-0.5">Deed Unlocked!</div>
          <div className="text-white font-bold text-sm">{deed.name}</div>
          <div className="text-yellow-200/80 text-xs mt-0.5 italic">"{deed.flavor}"</div>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/Gamification/DeedToast.tsx
git commit -m "feat: add DeedToast gold-bordered achievement notification"
```

---

### Task 9: Create LevelUpModal component

**Files:**
- Create: `src/components/Gamification/LevelUpModal.tsx`

**Step 1: Install canvas-confetti types check (already done in Task 1)**

**Step 2: Create the component**

```tsx
import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import type { GamificationEvent } from '../../types';
import { getClassIcon } from '../../utils/gamification';
import { useGamificationContext } from '../../context/GamificationContext';

interface LevelUpModalProps {
  event: GamificationEvent;
  onDone: () => void;
}

export function LevelUpModal({ event, onDone }: LevelUpModalProps) {
  const [visible, setVisible] = useState(false);
  const { getCurrentPlayerState } = useGamificationContext();
  const playerState = getCurrentPlayerState();

  useEffect(() => {
    const show = setTimeout(() => setVisible(true), 50);
    // Fire confetti
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.5 },
      colors: ['#f59e0b', '#fbbf24', '#fcd34d', '#7c3aed', '#a78bfa'],
    });
    return () => clearTimeout(show);
  }, []);

  return (
    <div
      className={`
        fixed inset-0 z-[300] flex items-center justify-center
        bg-black/60 backdrop-blur-sm
        transition-opacity duration-300
        ${visible ? 'opacity-100' : 'opacity-0'}
      `}
      onClick={onDone}
    >
      <div
        className={`
          relative text-center max-w-sm w-full mx-4
          bg-gradient-to-br from-purple-900/95 to-indigo-900/95
          border-2 border-yellow-500/60
          rounded-3xl p-8 shadow-2xl
          transition-all duration-500
          ${visible ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}
        `}
        onClick={e => e.stopPropagation()}
      >
        <div className="text-6xl mb-3">{getClassIcon(playerState.characterClass)}</div>
        <div className="text-yellow-400 text-sm font-semibold uppercase tracking-widest mb-1">Level Up!</div>
        <div className="text-white text-5xl font-black mb-2">{event.newLevel}</div>
        <div className="text-yellow-300 text-xl font-bold mb-1">{event.newTitle}</div>
        <div className="text-purple-300 text-sm mb-6">You have grown in power and legend.</div>
        <button
          onClick={onDone}
          className="px-6 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-bold rounded-xl hover:from-yellow-400 hover:to-amber-400 transition-all"
        >
          Continue the Quest
        </button>
      </div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/components/Gamification/LevelUpModal.tsx
git commit -m "feat: add LevelUpModal with confetti celebration"
```

---

### Task 10: Create QuestCompleteOverlay component

**Files:**
- Create: `src/components/Gamification/QuestCompleteOverlay.tsx`

**Step 1: Create the component**

```tsx
import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import type { GamificationEvent } from '../../types';

interface QuestCompleteOverlayProps {
  event: GamificationEvent;
  onDone: () => void;
}

export function QuestCompleteOverlay({ event, onDone }: QuestCompleteOverlayProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const show = setTimeout(() => setVisible(true), 50);
    confetti({
      particleCount: 200,
      spread: 100,
      origin: { y: 0.6 },
      colors: ['#10b981', '#34d399', '#6ee7b7', '#f59e0b', '#fbbf24'],
    });
    return () => clearTimeout(show);
  }, []);

  return (
    <div
      className={`
        fixed inset-0 z-[300] flex items-center justify-center
        bg-black/60 backdrop-blur-sm
        transition-opacity duration-300
        ${visible ? 'opacity-100' : 'opacity-0'}
      `}
      onClick={onDone}
    >
      <div
        className={`
          relative text-center max-w-md w-full mx-4
          bg-gradient-to-br from-emerald-900/95 to-teal-900/95
          border-2 border-emerald-400/60
          rounded-3xl p-8 shadow-2xl
          transition-all duration-500
          ${visible ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}
        `}
        onClick={e => e.stopPropagation()}
      >
        <div className="text-6xl mb-3">🏆</div>
        <div className="text-emerald-400 text-sm font-semibold uppercase tracking-widest mb-2">Quest Complete!</div>
        <div className="text-white text-2xl font-black mb-1">{event.clientName}</div>
        <div className="text-emerald-300 text-sm mb-4">has been fully onboarded.</div>
        {event.xpGained && (
          <div className="inline-flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 font-bold px-4 py-1.5 rounded-full text-sm mb-6">
            <span>⚡</span>
            <span>+{event.xpGained} XP earned</span>
          </div>
        )}
        <div className="block">
          <button
            onClick={onDone}
            className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl hover:from-emerald-400 hover:to-teal-400 transition-all"
          >
            Onward!
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/Gamification/QuestCompleteOverlay.tsx
git commit -m "feat: add QuestCompleteOverlay celebration for client graduation"
```

---

### Task 11: Create GamificationOverlay (event dispatcher)

**Files:**
- Create: `src/components/Gamification/GamificationOverlay.tsx`

**Step 1: Create the component**

This component mounts once in App.tsx and consumes the `pendingEvents` queue, rendering the appropriate celebration component per event type. It processes one modal-type event at a time (level_up, quest_complete), and stacks toast-type events (xp_gained, deed_unlocked).

```tsx
import { useEffect, useCallback } from 'react';
import { useGamificationContext } from '../../context/GamificationContext';
import { XPPopup } from './XPPopup';
import { DeedToast } from './DeedToast';
import { LevelUpModal } from './LevelUpModal';
import { QuestCompleteOverlay } from './QuestCompleteOverlay';

export function GamificationOverlay() {
  const { getPendingEvents, dismissEvent } = useGamificationContext();
  const events = getPendingEvents();

  // Separate events by type
  const xpEvents = events.filter(e => e.type === 'xp_gained');
  const deedEvents = events.filter(e => e.type === 'deed_unlocked');
  const levelUpEvent = events.find(e => e.type === 'level_up');
  const questEvent = events.find(e => e.type === 'quest_complete');

  // Show one XP popup at a time (most recent)
  const latestXP = xpEvents[xpEvents.length - 1];
  // Show one deed toast at a time (most recent)
  const latestDeed = deedEvents[deedEvents.length - 1];
  // Modal events: level_up takes priority over quest_complete
  const modalEvent = levelUpEvent ?? questEvent;

  const handleDismissXP = useCallback(() => {
    if (latestXP) dismissEvent(latestXP.id);
  }, [latestXP, dismissEvent]);

  const handleDismissDeed = useCallback(() => {
    if (latestDeed) dismissEvent(latestDeed.id);
  }, [latestDeed, dismissEvent]);

  const handleDismissModal = useCallback(() => {
    if (modalEvent) dismissEvent(modalEvent.id);
  }, [modalEvent, dismissEvent]);

  // Auto-dismiss stale XP events (don't need popup for old events on load)
  useEffect(() => {
    if (xpEvents.length > 1) {
      xpEvents.slice(0, -1).forEach(e => dismissEvent(e.id));
    }
  }, [xpEvents, dismissEvent]);

  return (
    <>
      {latestXP && (
        <XPPopup key={latestXP.id} amount={latestXP.xpGained ?? 0} onDone={handleDismissXP} />
      )}
      {latestDeed?.deed && (
        <DeedToast key={latestDeed.id} deed={latestDeed.deed} onDone={handleDismissDeed} />
      )}
      {!modalEvent && null}
      {modalEvent?.type === 'level_up' && (
        <LevelUpModal key={modalEvent.id} event={modalEvent} onDone={handleDismissModal} />
      )}
      {modalEvent?.type === 'quest_complete' && (
        <QuestCompleteOverlay key={modalEvent.id} event={modalEvent} onDone={handleDismissModal} />
      )}
    </>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/Gamification/GamificationOverlay.tsx
git commit -m "feat: add GamificationOverlay event dispatcher for all celebration types"
```

---

### Task 12: Create HeaderXPBar component

**Files:**
- Create: `src/components/Gamification/HeaderXPBar.tsx`

**Step 1: Create the component**

```tsx
import { useState } from 'react';
import { useGamificationContext } from '../../context/GamificationContext';
import { getLevelProgress, getClassIcon } from '../../utils/gamification';

interface HeaderXPBarProps {
  onOpenCharacterSheet: () => void;
}

export function HeaderXPBar({ onOpenCharacterSheet }: HeaderXPBarProps) {
  const { getCurrentPlayerState, getTitle } = useGamificationContext();
  const player = getCurrentPlayerState();
  const { level, progressPct, isMythic } = getLevelProgress(player.totalXP);
  const title = getTitle(player.characterClass, level);
  const classIcon = getClassIcon(player.characterClass);

  return (
    <button
      onClick={onOpenCharacterSheet}
      className="flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-white/10 dark:hover:bg-white/5 transition-colors group"
      aria-label="Open character sheet"
      title={`${classIcon} ${title} — Level ${level}`}
    >
      {/* Class icon + level badge */}
      <div className="relative flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-base">
          {classIcon}
        </div>
        <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-black text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center leading-none">
          {level > 20 ? '✦' : level}
        </div>
      </div>

      {/* Title + XP bar — hidden on small screens */}
      <div className="hidden sm:flex flex-col items-start min-w-0">
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 leading-none truncate max-w-[80px]">
          {title}
        </span>
        <div className="mt-1 w-20 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>
    </button>
  );
}
```

**Step 2: Modify `src/components/Layout/Header.tsx`**

Add imports:
```typescript
import { HeaderXPBar } from '../Gamification/HeaderXPBar';
import { useState } from 'react';
```

Add `onOpenCharacterSheet` prop and state:
```typescript
interface HeaderProps {
  onSelectClient: (client: Client) => void;
  onMenuToggle?: () => void;
  showMenuButton?: boolean;
  onOpenCharacterSheet: () => void;
}
```

In the right-side `div`, add `<HeaderXPBar onOpenCharacterSheet={onOpenCharacterSheet} />` before `<SettingsMenu />`:
```tsx
<HeaderXPBar onOpenCharacterSheet={onOpenCharacterSheet} />
<SettingsMenu />
```

**Step 3: Update `src/components/Layout/Layout.tsx`** to pass `onOpenCharacterSheet` down to `Header`.

Add `characterSheetOpen` state and handler:
```typescript
const [characterSheetOpen, setCharacterSheetOpen] = useState(false);
```

Pass to Header:
```tsx
<Header
  onSelectClient={onSelectClient}
  onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
  showMenuButton
  onOpenCharacterSheet={() => setCharacterSheetOpen(true)}
/>
```

Import and render `CharacterSheet` modal (built in Task 13) at the bottom of the Layout return:
```tsx
{characterSheetOpen && (
  <CharacterSheet onClose={() => setCharacterSheetOpen(false)} />
)}
```

**Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```

**Step 5: Commit**

```bash
git add src/components/Gamification/HeaderXPBar.tsx src/components/Layout/Header.tsx src/components/Layout/Layout.tsx
git commit -m "feat: add HeaderXPBar with level badge and XP progress to header"
```

---

### Task 13: Create CharacterSheet modal

**Files:**
- Create: `src/components/Gamification/CharacterSheet.tsx`

**Step 1: Create the component**

This is a modal showing: class picker, level, XP progress, deed grid (unlocked + locked silhouettes), and lifetime stats.

```tsx
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useGamificationContext } from '../../context/GamificationContext';
import { getLevelProgress, getTitle, getClassIcon, DEEDS, LEVEL_XP_THRESHOLDS } from '../../utils/gamification';
import type { CharacterClass, DeedId } from '../../types';

const CLASSES: { id: CharacterClass; label: string; icon: string; tagline: string }[] = [
  { id: 'paladin',  label: 'Paladin',  icon: '⚔️', tagline: 'Protector of the realm' },
  { id: 'wizard',   label: 'Wizard',   icon: '🧙', tagline: 'Master of knowledge' },
  { id: 'ranger',   label: 'Ranger',   icon: '🏹', tagline: 'Swift and efficient' },
  { id: 'rogue',    label: 'Rogue',    icon: '🗡️', tagline: 'Quick and cunning' },
];

interface CharacterSheetProps {
  onClose: () => void;
}

export function CharacterSheet({ onClose }: CharacterSheetProps) {
  const { getCurrentPlayerState, selectClass } = useGamificationContext();
  const player = getCurrentPlayerState();
  const { level, progressPct, isMythic, currentLevelXP, nextLevelXP } = getLevelProgress(player.totalXP);
  const title = getTitle(player.characterClass, level);
  const icon = getClassIcon(player.characterClass);

  const allDeedIds = Object.keys(DEEDS) as DeedId[];
  const categories = ['progression', 'speed', 'volume', 'consistency', 'teamwork'] as const;

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl bg-gradient-to-br from-gray-900/98 to-purple-950/98 border border-purple-500/30 rounded-3xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="text-4xl">{icon}</div>
              <div>
                <div className="text-white font-black text-xl">{title}</div>
                <div className="text-purple-300 text-sm">Level {level}{isMythic ? ' (Mythic)' : ''} · {player.totalXP.toLocaleString()} XP</div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors" aria-label="Close">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* XP Bar */}
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>{currentLevelXP.toLocaleString()} XP</span>
                <span>{nextLevelXP.toLocaleString()} XP</span>
              </div>
              <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full transition-all duration-700"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Class picker */}
            {!player.characterClass ? (
              <div>
                <div className="text-purple-300 text-xs uppercase tracking-widest font-semibold mb-3">Choose Your Class</div>
                <div className="grid grid-cols-2 gap-3">
                  {CLASSES.map(cls => (
                    <button
                      key={cls.id}
                      onClick={() => selectClass(cls.id)}
                      className="flex items-center gap-3 p-3 rounded-xl border border-white/10 hover:border-purple-400/60 hover:bg-purple-900/30 transition-all text-left"
                    >
                      <span className="text-2xl">{cls.icon}</span>
                      <div>
                        <div className="text-white font-bold text-sm">{cls.label}</div>
                        <div className="text-gray-400 text-xs">{cls.tagline}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div className="text-purple-300 text-xs uppercase tracking-widest font-semibold mb-3">Class</div>
                <div className="flex items-center gap-3 flex-wrap">
                  {CLASSES.map(cls => (
                    <button
                      key={cls.id}
                      onClick={() => selectClass(cls.id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-semibold transition-all ${
                        player.characterClass === cls.id
                          ? 'border-purple-400 bg-purple-900/50 text-white'
                          : 'border-white/10 text-gray-400 hover:border-white/30 hover:text-white'
                      }`}
                    >
                      <span>{cls.icon}</span>
                      <span>{cls.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Stats */}
            <div>
              <div className="text-purple-300 text-xs uppercase tracking-widest font-semibold mb-3">Legend</div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Tasks Done', value: player.stats.tasksCompleted },
                  { label: 'Clients Won', value: player.stats.clientsGraduated },
                  { label: 'Milestones', value: player.stats.milestonesCompleted },
                  { label: 'Best Streak', value: `${player.longestStreak}d` },
                  { label: 'Current Streak', value: `${player.currentStreak}d` },
                  { label: 'Deeds Earned', value: `${player.unlockedDeeds.length}/28` },
                ].map(stat => (
                  <div key={stat.label} className="bg-white/5 rounded-xl p-3 text-center">
                    <div className="text-white font-black text-xl">{stat.value}</div>
                    <div className="text-gray-400 text-xs mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Deeds */}
            {categories.map(cat => {
              const catDeeds = allDeedIds.filter(id => DEEDS[id].category === cat);
              return (
                <div key={cat}>
                  <div className="text-purple-300 text-xs uppercase tracking-widest font-semibold mb-2 capitalize">{cat} Deeds</div>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {catDeeds.map(deedId => {
                      const deed = DEEDS[deedId];
                      const unlocked = player.unlockedDeeds.includes(deedId);
                      return (
                        <div
                          key={deedId}
                          title={unlocked ? `${deed.name}: ${deed.description}` : `??? — ${deed.description}`}
                          className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition-all ${
                            unlocked
                              ? 'border-yellow-500/40 bg-yellow-500/10'
                              : 'border-white/5 bg-white/3 opacity-40 grayscale'
                          }`}
                        >
                          <span className="text-xl">{unlocked ? deed.icon : '❓'}</span>
                          <span className={`text-[9px] leading-tight font-medium ${unlocked ? 'text-yellow-200' : 'text-gray-500'}`}>
                            {unlocked ? deed.name : '???'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
```

**Step 2: Update Layout.tsx import**

Add at top:
```typescript
import { CharacterSheet } from '../Gamification/CharacterSheet';
```

**Step 3: TypeScript check**

```bash
npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add src/components/Gamification/CharacterSheet.tsx src/components/Layout/Layout.tsx
git commit -m "feat: add CharacterSheet modal with class picker, XP bar, stats, and deed grid"
```

---

### Task 14: Create HallOfHeroes view

**Files:**
- Create: `src/components/Gamification/HallOfHeroes.tsx`

**Step 1: Create the view**

```tsx
import { useGamificationContext } from '../../context/GamificationContext';
import { getLevelProgress, getTitle, getClassIcon, DEEDS } from '../../utils/gamification';

export function HallOfHeroes() {
  const { allMembers, currentPlayerId } = useGamificationContext();

  // Sort by totalXP descending
  const sorted = [...allMembers].sort((a, b) => b.totalXP - a.totalXP);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black gradient-text">Hall of Heroes</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">The legends of Embark, ranked by glory earned.</p>
      </div>

      {sorted.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">🏰</div>
          <div className="font-semibold">No heroes yet</div>
          <div className="text-sm">Complete tasks to begin your legend.</div>
        </div>
      )}

      <div className="space-y-3">
        {sorted.map((member, index) => {
          const { level, progressPct, isMythic } = getLevelProgress(member.totalXP);
          const title = getTitle(member.characterClass, level);
          const icon = getClassIcon(member.characterClass);
          const isYou = member.memberId === currentPlayerId;
          const recentDeeds = member.unlockedDeeds.slice(-5).reverse();
          const rank = index + 1;
          const rankEmoji = rank === 1 ? '👑' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

          return (
            <div
              key={member.memberId}
              className={`
                flex items-center gap-4 p-4 rounded-2xl border transition-all
                ${isYou
                  ? 'border-purple-400/40 bg-purple-900/20'
                  : 'border-white/10 bg-white/5 dark:bg-white/3'}
              `}
            >
              {/* Rank */}
              <div className="w-8 text-center text-lg font-black text-gray-400 flex-shrink-0">
                {rankEmoji}
              </div>

              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-2xl">
                  {icon}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-black text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                  {level > 20 ? '✦' : level}
                </div>
              </div>

              {/* Name + title + XP bar */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold truncate">{member.displayName}</span>
                  {isYou && <span className="text-[10px] bg-purple-500/30 text-purple-300 px-1.5 py-0.5 rounded-full font-semibold">You</span>}
                </div>
                <div className="text-gray-400 text-xs">{title}{isMythic ? ' (Mythic)' : ''}</div>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden max-w-[120px]">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <span className="text-gray-500 text-xs">{member.totalXP.toLocaleString()} XP</span>
                </div>
              </div>

              {/* This week XP */}
              <div className="hidden sm:block text-center flex-shrink-0">
                <div className="text-yellow-400 font-black text-lg">{member.weeklyXP}</div>
                <div className="text-gray-500 text-xs">XP this week</div>
              </div>

              {/* Recent deeds */}
              <div className="hidden md:flex items-center gap-1 flex-shrink-0">
                {recentDeeds.length === 0 && (
                  <span className="text-gray-600 text-xs italic">No deeds yet</span>
                )}
                {recentDeeds.map(deedId => (
                  <span
                    key={deedId}
                    title={DEEDS[deedId]?.name}
                    className="text-lg"
                  >
                    {DEEDS[deedId]?.icon}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/Gamification/HallOfHeroes.tsx
git commit -m "feat: add HallOfHeroes leaderboard view"
```

---

### Task 15: Wire gamification into ClientContext

**Files:**
- Modify: `src/context/ClientContext.tsx`

**Step 1: Add gamification calls to existing wrappers**

The `gamification` object is already instantiated in `ClientProvider` (Task 6). Now call its methods from the existing wrappers.

**addClient wrapper** — add after `executeAutomation('client_created', newClient)`:
```typescript
const activeCount = clientOperations.clients.filter(c => !c.archived && c.status === 'active').length + 1;
gamification.trackClientAdded(newClient.id, activeCount);
gamification.awardXP(10); // client added XP
gamification.trackDailyActivity();
```

**toggleChecklistItem wrapper** — add after the existing notification + automation calls, but ONLY when `isCompleting === true`:

After `executeAutomation('task_completed', updatedClient)`:
```typescript
// Award XP: check if task was on time
const isOnTime = item.dueDate ? new Date(item.dueDate) >= new Date() : false;
const xpAmount = isOnTime ? 15 : 10;
gamification.awardXP(xpAmount);
gamification.trackTaskCompleted({
  onTime: isOnTime,
  clientId,
  completedAt: new Date().toISOString(),
});
gamification.trackDailyActivity();
```

After the allDone block (`notifyClientCompleted` call):
```typescript
if (allDone && updatedChecklist.length > 0) {
  // ... existing notify calls ...
  const issuedAt = client.createdAt ?? new Date().toISOString();
  const daysToGraduate = Math.round(
    (new Date().getTime() - new Date(issuedAt).getTime()) / 86400000
  );
  const hasOverdue = client.checklist.some(i => !i.completed && i.dueDate && new Date(i.dueDate) < new Date());
  gamification.trackClientGraduated(clientId, {
    perfect: !hasOverdue,
    daysToGraduate,
    checklistSize: updatedChecklist.length,
    clientName: client.name,
  });
  gamification.awardXP(75); // client graduation bonus
}
```

**completeMilestone wrapper** — add after `notifyMilestoneReached`:
```typescript
if (isCompleting && milestone && client) {
  // ... existing notify ...
  gamification.awardXP(25);
  gamification.trackMilestoneCompleted();
  gamification.trackDailyActivity();
}
```

**addCommunication wrapper** — wrap the existing `clientOperations.addCommunication` call:
```typescript
const addCommunication = useCallback((clientId: string, entry: Omit<CommunicationLogEntry, 'id' | 'timestamp'>) => {
  clientOperations.addCommunication(clientId, entry);
  gamification.awardXP(5);
  gamification.trackCommunicationLogged();
  gamification.trackDailyActivity();
}, [clientOperations, gamification]);
```

**updateCustomField wrapper** — wrap the existing call:
```typescript
const updateCustomField = useCallback((clientId: string, fieldId: string, value: unknown) => {
  clientOperations.updateCustomField(clientId, fieldId, value);
  gamification.trackCustomFieldFilled();
}, [clientOperations, gamification]);
```

**addAutomationRule wrapper** — wrap:
```typescript
const addAutomationRule = useCallback((...args) => {
  const rule = automationOperations.addRule(...args);
  gamification.trackAutomationCreated();
  return rule;
}, [automationOperations, gamification]);
```

**Step 2: Add addCommunication / updateCustomField / addAutomationRule to context value** (they weren't wrapped before — check which are already in the context and add wrappers only for the new ones).

**Step 3: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors

**Step 4: Run all tests**

```bash
npm run test:run
```

Expected: all 39+ tests pass

**Step 5: Commit**

```bash
git add src/context/ClientContext.tsx
git commit -m "feat: wire gamification XP and stat tracking into ClientContext wrappers"
```

---

### Task 16: Wire GamificationOverlay + Hall of Heroes into App.tsx, Sidebar, mobile nav

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/Layout/Sidebar.tsx`
- Modify: `src/components/Layout/Layout.tsx`

**Step 1: Add HallOfHeroes to App.tsx**

Add lazy import:
```typescript
const HallOfHeroes = lazy(() => import('./components/Gamification/HallOfHeroes').then(m => ({ default: m.HallOfHeroes })));
```

Import GamificationOverlay (NOT lazy — always mounted):
```typescript
import { GamificationOverlay } from './components/Gamification/GamificationOverlay';
```

Add to Suspense block:
```tsx
{currentView === 'hall-of-heroes' && <HallOfHeroes />}
```

Add `<GamificationOverlay />` just before `</UndoRedoProvider>` (alongside `<CommandPalette />`):
```tsx
<GamificationOverlay />
```

**Step 2: Add to Sidebar navItems array in `src/components/Layout/Sidebar.tsx`**

Add after the 'automations' entry:
```typescript
{
  view: 'hall-of-heroes',
  label: 'Hall of Heroes',
  icon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
},
```

**Step 3: Add to MobileNav in `src/components/Layout/Layout.tsx`**

In the `navItems` array (keep to 5 max — replace the least-used item or add):
```typescript
{ view: 'hall-of-heroes' as View, label: 'Heroes', icon: '⭐' },
```

**Step 4: Add planner day tracking to PlannerView**

In `src/components/Planner/PlannerView.tsx`, import and call:
```typescript
import { useGamificationContext } from '../../context/GamificationContext';

// Inside the component, on mount and when date changes:
const { trackPlannerDay, awardXP } = useGamificationContext();
useEffect(() => {
  trackPlannerDay();
}, []); // once per component mount = once per day you open planner
```

**Step 5: TypeScript check**

```bash
npx tsc --noEmit
```

**Step 6: Full test run**

```bash
npm run test:run
```

Expected: all tests pass

**Step 7: Build check**

```bash
npm run build
```

Expected: successful build, no type errors

**Step 8: Commit**

```bash
git add src/App.tsx src/components/Layout/Sidebar.tsx src/components/Layout/Layout.tsx src/components/Planner/PlannerView.tsx
git commit -m "feat: wire HallOfHeroes view, GamificationOverlay, and nav items — gamification complete"
```

---

## Summary

16 tasks covering:
1. `canvas-confetti` dependency
2. TypeScript types + `View` union updated
3. `src/utils/gamification.ts` — level curve, class titles, deed definitions, deed condition checker
4. `src/test/useGamification.test.ts` — 13 tests
5. `src/hooks/useGamification.ts` — full hook implementation
6. `src/context/GamificationContext.tsx` — context + wired into `ClientProvider`
7. `XPPopup.tsx` — floating `+XP` chip
8. `DeedToast.tsx` — gold deed notification
9. `LevelUpModal.tsx` — full-screen level-up with confetti
10. `QuestCompleteOverlay.tsx` — client graduation with confetti
11. `GamificationOverlay.tsx` — single event dispatcher mounted in App
12. `HeaderXPBar.tsx` — always-visible level + XP bar in header
13. `CharacterSheet.tsx` — class picker, deed grid, stats modal
14. `HallOfHeroes.tsx` — team leaderboard view
15. `ClientContext.tsx` — XP + stat tracking wired to all actions
16. `App.tsx` / `Sidebar.tsx` / `Layout.tsx` — navigation + overlay mounting
