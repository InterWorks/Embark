# Gamification Design — Embark
**Date:** 2026-02-27
**Status:** Approved
**Theme:** D&D Campaign

---

## Overview

Add a D&D-themed gamification layer to Embark that rewards task completion speed, daily consistency, and client outcomes. Purely additive — no changes to existing business logic. All state stored in localStorage via a new `useGamification` hook.

**Goals:**
- Reinforce completing tasks on time, daily activity, and graduating clients
- Motivate both individuals (XP, levels, deeds) and the team (Hall of Heroes leaderboard)
- Feel like a real game — prominent level bars, animated XP gains, confetti celebrations

---

## 1. XP System

### XP Events

| Action | XP |
|---|---|
| Complete a task | +10 |
| Complete a task on time or early | +15 (replaces +10) |
| Complete an overdue task | +8 |
| Hit a milestone | +25 |
| Graduate a client (all tasks done, marked complete) | +75 |
| Daily activity streak (1+ task per day) | +20/day |
| 7-day perfect streak bonus | +100 |
| Log a communication or note | +5 |

### Level Curve

Levels 1–20 follow an accelerating XP curve. Level 21+ is **Mythic** tier (no upper bound).

| Level | XP Required (cumulative) |
|---|---|
| 1 | 0 |
| 2 | 100 |
| 3 | 250 |
| 4 | 500 |
| 5 | 850 |
| 6 | 1,300 |
| 7 | 1,900 |
| 8 | 2,650 |
| 9 | 3,550 |
| 10 | 4,600 |
| 11 | 5,800 |
| 12 | 7,150 |
| 13 | 8,650 |
| 14 | 10,300 |
| 15 | 12,100 |
| 16 | 14,050 |
| 17 | 16,150 |
| 18 | 18,400 |
| 19 | 20,800 |
| 20 | 23,350 |
| 21+ (Mythic) | 26,050+ |

---

## 2. Character Classes

Classes are **cosmetic only** — same XP math for all. Each member picks their class on first visit to their Character Sheet and can change it any time.

| Class | Icon | Identity |
|---|---|---|
| Paladin | ⚔️ | Protector, reliability-focused titles |
| Wizard | 🧙 | Knowledge, strategic titles |
| Ranger | 🏹 | Speed, efficiency-focused titles |
| Rogue | 🗡️ | Agility, quick-completion titles |

### Class Titles by Level

| Level Range | ⚔️ Paladin | 🧙 Wizard | 🏹 Ranger | 🗡️ Rogue |
|---|---|---|---|---|
| 1–3 | Squire | Apprentice | Scout | Cutpurse |
| 4–6 | Knight | Arcanist | Tracker | Trickster |
| 7–9 | Holy Warrior | Spellblade | Marksman | Shadow |
| 10–12 | Crusader | Archmage | Strider | Assassin |
| 13–16 | Templar | Grand Sorcerer | Warden | Blade Master |
| 17–20 | Paladin Lord | Mystic Overlord | Ranger Lord | Phantom |
| 21+ | Divine Champion | Arcane Legend | Mythic Hunter | Legend of Shadows |

---

## 3. Deeds (Achievements)

28 one-time unlockable badges stored per team member. A special gold-bordered toast fires on unlock with deed name and D&D-flavored text.

### Progression
| Deed | Icon | Trigger |
|---|---|---|
| The Journey Begins | 🗺️ | Add your first client |
| First Blood | ⚔️ | Complete your first task |
| Milestone Maker | 🧱 | Complete your first milestone |
| Quest Complete | 🎉 | Graduate your first client |
| Legendary | ⭐ | Reach Level 20 |
| Ascended | 🌟 | Reach Mythic rank (Level 21+) |

### Speed & Skill
| Deed | Icon | Trigger |
|---|---|---|
| Swift Justice | ⚡ | Complete 10 tasks before their due date |
| Dead Eye | 🎯 | Complete 50 tasks before their due date |
| Speed Runner | 🚀 | Graduate a client in under 7 days |
| Triple Crown | 🏆 | Graduate 3 clients in one week |
| Perfectionist | 💎 | Graduate a client with zero overdue tasks |
| Dungeon Crawler | 👾 | Graduate a client with 20+ checklist items |

### Volume & Grind
| Deed | Icon | Trigger |
|---|---|---|
| On a Roll | 🔥 | Complete 5 tasks in a single day |
| Centurion | 💯 | Complete 100 tasks total |
| War Veteran | 💪 | Complete 500 tasks total |
| Dragon Slayer | 🐉 | Graduate 10 clients total |
| Guild Master | 👑 | Have 5+ active clients at once |
| The Oracle | 🔮 | Complete 10 milestones total |

### Consistency
| Deed | Icon | Trigger |
|---|---|---|
| Iron Will | 🛡️ | Reach a 7-day streak |
| Unstoppable | 🔱 | Reach a 30-day streak |
| The Planner | 📅 | Use the Daily Planner 5 days in a row |
| Dawn Patrol | 🌅 | Complete a task before 9am |
| Night Owl | 🌙 | Complete a task after 10pm |

### Teamwork & Craft
| Deed | Icon | Trigger |
|---|---|---|
| Fellowship | 🤝 | Assign tasks to 3 different teammates |
| The Tactician | 🗡️ | Set up 5 automation rules |
| Scribe | 📜 | Log 20 communications or notes |
| Town Crier | 📣 | Log 50 communications |
| Lorekeeper | 📖 | Fill out custom fields on 10 clients |

---

## 4. UI Components

### Always Visible
- **Header XP Bar** — Class icon + level badge + character title (e.g. "🧙 Archmage") + thin animated XP progress bar replacing the avatar area

### In-Moment Feedback
- **XP Popup** — `+15 XP` chip floats up from the triggering action and fades out (~1.5s). Non-blocking.
- **Deed Toast** — Gold-bordered toast: deed icon + name + D&D flavor text (e.g. *"You've graduated 10 clients. The dragons fear you."*)
- **Level-Up Modal** — Full-screen: confetti burst, new title announced, XP bar animates to full. Dismisses on click.
- **Quest Complete Celebration** — On client graduation: confetti + dramatic "Quest Complete!" overlay card with client name, XP earned, and any deeds unlocked.

### Dedicated Pages
- **Hall of Heroes** (new sidebar nav item) — Team leaderboard: class icon, title, level, XP this week, total XP, most recent deeds. Ranked by total XP.
- **Character Sheet** (accessible from header avatar) — Class picker, level, XP to next level, full deed grid (unlocked + locked silhouettes with hints), lifetime stats.

---

## 5. Architecture

### New Files
- `src/hooks/useGamification.ts` — Core hook. Manages XP, level, class, deeds, streak per member ID. localStorage key: `embark-gamification`.
- `src/components/Gamification/HallOfHeroes.tsx` — Team leaderboard view
- `src/components/Gamification/CharacterSheet.tsx` — Individual profile modal
- `src/components/Gamification/XPPopup.tsx` — Floating XP chip animation
- `src/components/Gamification/LevelUpModal.tsx` — Full-screen level-up celebration
- `src/components/Gamification/QuestCompleteOverlay.tsx` — Client graduation celebration
- `src/components/Gamification/DeedToast.tsx` — Gold-bordered achievement toast
- `src/components/Gamification/HeaderXPBar.tsx` — Header integration component

### Modified Files
- `src/context/ClientContext.tsx` — Call `awardXP()` from `useGamification` in existing wrappers (already wired for notifications/automations)
- `src/components/Layout/Header.tsx` — Replace avatar with `HeaderXPBar`
- `src/components/Layout/Sidebar.tsx` — Add "Hall of Heroes" nav item
- `src/App.tsx` — Add lazy-loaded `HallOfHeroes` view
- `src/types/index.ts` — Add `GamificationState`, `Deed`, `CharacterClass` types
- `package.json` — Add `canvas-confetti` dependency

### Data Shape
```typescript
interface MemberGamificationState {
  memberId: string;
  class: 'paladin' | 'wizard' | 'ranger' | 'rogue' | null;
  totalXP: number;
  weeklyXP: number;
  weekStartDate: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  unlockedDeeds: string[]; // deed IDs
  stats: {
    tasksCompleted: number;
    tasksOnTime: number;
    clientsGraduated: number;
    milestonesCompleted: number;
    communicationsLogged: number;
    customFieldsFilled: number;
    plannerDaysUsed: string[]; // dates
    tasksCompletedToday: number;
    todayDate: string;
  };
}

interface GamificationStore {
  members: Record<string, MemberGamificationState>;
}
```

### Event Flow
1. User completes a task → `ClientContext.toggleChecklistItem` wrapper fires
2. Wrapper already calls `notifyTaskCompleted` + `executeAutomation`
3. Wrapper also calls `awardXP('task_completed', { onTime: true, clientId })`
4. `useGamification` updates XP, checks level-up, checks deed conditions
5. Returns `{ xpGained, leveledUp, newDeeds }` to trigger UI celebrations

### No Breaking Changes
All gamification is additive. Existing hooks, types, and business logic are untouched. The system degrades gracefully — if `useGamification` is not yet wired, the app works exactly as before.

---

## 6. Dependencies

- `canvas-confetti` — confetti animations for level-up and quest complete
- No other new dependencies required
