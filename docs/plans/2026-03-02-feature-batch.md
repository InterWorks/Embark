# Feature Batch Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement 5 features: client health scores, weekly digest, recurring tasks, navigation keyboard shortcuts, and client status PDF export.

**Architecture:** All features are additive — new utility functions, hooks, and components wired into existing patterns. Health scores are pure computed functions (no state). Digest reads from existing hooks. Recurring tasks extend the existing `toggleChecklistItem` wrapper. Shortcuts wire into the existing `useKeyboardShortcuts` hook in `App.tsx`. PDF export extends `src/utils/export.ts`.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, Vitest, jsPDF (already installed), existing `useLocalStorage` / `useKeyboardShortcuts` / `useGamification` patterns.

**Design doc:** `docs/plans/2026-03-02-feature-batch-design.md`

---

### Task 1: Client health utility (TDD)

**Files:**
- Create: `src/utils/clientHealth.ts`
- Create: `src/test/clientHealth.test.ts`

**Step 1: Write the failing tests**

Create `src/test/clientHealth.test.ts`:

```typescript
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

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
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

  it('includes a reason string', () => {
    const overdue = [1, 2, 3].map(i => ({
      id: String(i), title: `Task ${i}`, completed: false, order: i,
      dueDate: daysAgo(1).split('T')[0],
    }));
    const result = getClientHealth(makeClient({ checklist: overdue }));
    expect(result?.reason).toMatch(/overdue/i);
  });
});
```

**Step 2: Run to confirm failure**

```bash
cd "C:\Users\calexander\client-onboarding-tracker" && npx vitest run src/test/clientHealth.test.ts 2>&1 | head -15
```

Expected: FAIL — "Cannot find module '../utils/clientHealth'"

**Step 3: Implement `src/utils/clientHealth.ts`**

```typescript
import type { Client } from '../types';

export type HealthStatus = 'on-track' | 'at-risk' | 'needs-attention' | 'stalled';

export interface ClientHealth {
  status: HealthStatus;
  reason: string;
}

export const HEALTH_COLORS: Record<HealthStatus, { dot: string; border: string; badge: string; label: string }> = {
  'on-track':        { dot: 'bg-emerald-500', border: 'border-l-emerald-500', badge: 'bg-emerald-500/20 text-emerald-400', label: 'On Track' },
  'at-risk':         { dot: 'bg-yellow-500',  border: 'border-l-yellow-500',  badge: 'bg-yellow-500/20 text-yellow-400',  label: 'At Risk' },
  'needs-attention': { dot: 'bg-red-500',     border: 'border-l-red-500',     badge: 'bg-red-500/20 text-red-400',        label: 'Needs Attention' },
  'stalled':         { dot: 'bg-gray-400',    border: 'border-l-gray-400',    badge: 'bg-gray-500/20 text-gray-400',      label: 'Stalled' },
};

export function getClientHealth(client: Client): ClientHealth | null {
  if (client.status !== 'active' || client.archived) return null;

  const now = new Date();

  const overdueTasks = client.checklist.filter(i =>
    !i.completed && i.dueDate && new Date(i.dueDate) < now
  );

  const lastActivityTimestamp = client.activityLog?.[0]?.timestamp ?? client.createdAt;
  const daysSinceActivity = lastActivityTimestamp
    ? Math.floor((now.getTime() - new Date(lastActivityTimestamp).getTime()) / 86400000)
    : 0;

  const daysSinceCreation = client.createdAt
    ? Math.floor((now.getTime() - new Date(client.createdAt).getTime()) / 86400000)
    : 0;

  const completedTasks = client.checklist.filter(i => i.completed).length;
  const totalTasks = client.checklist.length;

  const hasMilestoneOverdue = client.milestones?.some(m =>
    !m.completedAt && m.targetDate && new Date(m.targetDate) < now
  ) ?? false;

  // Stalled: 30+ days no activity
  if (daysSinceActivity >= 30) {
    return { status: 'stalled', reason: `No activity in ${daysSinceActivity} days` };
  }

  // Needs Attention
  if (overdueTasks.length >= 3) {
    return { status: 'needs-attention', reason: `${overdueTasks.length} overdue tasks` };
  }
  if (daysSinceActivity >= 14) {
    return { status: 'needs-attention', reason: `No activity in ${daysSinceActivity} days` };
  }
  if (daysSinceCreation >= 14 && totalTasks > 0 && completedTasks === 0) {
    return { status: 'needs-attention', reason: 'No tasks completed in 14+ days' };
  }

  // At Risk
  if (overdueTasks.length >= 1) {
    return { status: 'at-risk', reason: `${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}` };
  }
  if (daysSinceActivity >= 7) {
    return { status: 'at-risk', reason: `No activity in ${daysSinceActivity} days` };
  }
  if (hasMilestoneOverdue) {
    return { status: 'at-risk', reason: 'Milestone past target date' };
  }

  return { status: 'on-track', reason: 'On track' };
}
```

**Step 4: Run tests**

```bash
npx vitest run src/test/clientHealth.test.ts 2>&1
```

Expected: 11/11 pass

**Step 5: Full test suite + tsc**

```bash
npx vitest run 2>&1 | tail -6 && npx tsc --noEmit 2>&1
```

Expected: all pass, no TS errors

---

### Task 2: Health dot on ClientCard

**Files:**
- Modify: `src/components/Clients/ClientCard.tsx`

**Step 1: Read the file** — already done in planning. The card's top-right corner is the `<h3>` + status badge row (line 64–71). The card's outer `<div>` is `relative`.

**Step 2: Add health dot**

In `ClientCard.tsx`, add the import at top:
```typescript
import { getClientHealth, HEALTH_COLORS } from '../../utils/clientHealth';
```

Inside the component, after computing `completedTasks`/`totalTasks`:
```typescript
const health = getClientHealth(client);
```

In the JSX, inside the outer `<div className="glass-card ...">`, add a health dot in the top-right corner. Place it just after the opening `<div>` tag (before the selection checkbox div):
```tsx
{/* Health indicator */}
{health && health.status !== 'on-track' && (
  <div
    className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full ${HEALTH_COLORS[health.status].dot}`}
    title={health.reason}
  />
)}
```

**Step 3: tsc check**

```bash
npx tsc --noEmit 2>&1
```

Expected: no errors

---

### Task 3: Dashboard "Needs Attention" widget

**Files:**
- Modify: `src/components/Dashboard/Dashboard.tsx`

**Step 1: Read first 120 lines of Dashboard.tsx to understand component structure and where stats are rendered**

```bash
# Use Read tool on src/components/Dashboard/Dashboard.tsx lines 1-120
```

**Step 2: Add import at top of Dashboard.tsx**

```typescript
import { getClientHealth, HEALTH_COLORS } from '../../utils/clientHealth';
```

**Step 3: Compute at-risk clients inside the Dashboard component**

Find where `clients` is used to compute stats. Add:
```typescript
const needsAttentionClients = clients
  .filter(c => !c.archived)
  .map(c => ({ client: c, health: getClientHealth(c) }))
  .filter(({ health }) => health && (health.status === 'needs-attention' || health.status === 'stalled'))
  .sort((a, b) => {
    const order = { stalled: 0, 'needs-attention': 1 };
    return (order[a.health!.status as keyof typeof order] ?? 2) - (order[b.health!.status as keyof typeof order] ?? 2);
  });
```

**Step 4: Add the widget JSX at the top of the Dashboard's returned content, before the existing stats grid**

```tsx
{/* Needs Attention */}
{needsAttentionClients.length > 0 && (
  <div className="glass-card p-5">
    <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
      Needs Attention
    </h2>
    <div className="space-y-2">
      {needsAttentionClients.slice(0, 5).map(({ client, health }) => (
        <button
          key={client.id}
          onClick={() => onNavigate?.('clients')}
          className="w-full flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-white/10 dark:hover:bg-white/5 transition-colors text-left"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${HEALTH_COLORS[health!.status].dot}`} />
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{client.name}</span>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${HEALTH_COLORS[health!.status].badge}`}>
            {health!.reason}
          </span>
        </button>
      ))}
    </div>
  </div>
)}
```

Note: Check what props `Dashboard` receives — it likely has an `onNavigate` prop already. If not, the button can just be a non-navigating div for now.

**Step 5: tsc + full test run**

```bash
npx tsc --noEmit 2>&1 && npx vitest run 2>&1 | tail -6
```

---

### Task 4: usePreferences extension + useWeeklyDigest hook

**Files:**
- Modify: `src/hooks/usePreferences.ts`
- Create: `src/hooks/useWeeklyDigest.ts`

**Step 1: Extend usePreferences**

In `src/hooks/usePreferences.ts`, add `lastDigestShown` to the `Preferences` interface:

```typescript
export interface Preferences {
  viewMode: ViewMode;
  selectedClientId: string | null;
  lastDigestShown: string; // ISO date string, e.g. '2026-03-02'
}

const defaultPreferences: Preferences = {
  viewMode: 'per-client',
  selectedClientId: null,
  lastDigestShown: '',
};
```

Add a setter to the return value:
```typescript
const setLastDigestShown = useCallback(
  (date: string) => {
    setPreferences((prev) => ({ ...prev, lastDigestShown: date }));
  },
  [setPreferences]
);

return {
  preferences,
  setViewMode,
  setSelectedClientId,
  setLastDigestShown,
};
```

**Step 2: Create `src/hooks/useWeeklyDigest.ts`**

```typescript
import { useMemo } from 'react';
import type { Client } from '../types';
import { getClientHealth } from '../utils/clientHealth';

export interface DigestData {
  weeklyXP: number;
  tasksCompletedThisWeek: number;
  clientsGraduatedThisWeek: number;
  needsAttentionClients: { name: string; reason: string }[];
  upcomingTasks: { clientName: string; taskTitle: string; dueDate: string }[];
  flavorText: string;
}

const FLAVOR_LINES = [
  'The guild awaits your return, adventurer.',
  'New quests await. Steel your resolve.',
  'The dungeon does not rest. Neither should you.',
  'Another week, another chance at glory.',
  'Your legend grows with every completed quest.',
];

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

export function useWeeklyDigest(clients: Client[], weeklyXP: number): DigestData {
  return useMemo(() => {
    const now = new Date();
    const weekStart = new Date(getWeekStart(now));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const weekEndStr = weekEnd.toISOString().split('T')[0];

    // Tasks completed this week (from activity logs)
    let tasksCompletedThisWeek = 0;
    let clientsGraduatedThisWeek = 0;

    for (const client of clients) {
      if (client.archived) continue;
      for (const entry of (client.activityLog ?? [])) {
        const entryDate = entry.timestamp?.split('T')[0] ?? '';
        if (entryDate >= getWeekStart(now) && entryDate <= weekEndStr) {
          if (entry.type === 'task_completed') tasksCompletedThisWeek++;
          if (entry.type === 'status_changed' && entry.description?.includes('completed')) {
            clientsGraduatedThisWeek++;
          }
        }
      }
    }

    // Clients needing attention
    const needsAttentionClients = clients
      .filter(c => !c.archived)
      .map(c => ({ name: c.name, health: getClientHealth(c) }))
      .filter(({ health }) => health && (health.status === 'needs-attention' || health.status === 'stalled'))
      .slice(0, 3)
      .map(({ name, health }) => ({ name, reason: health!.reason }));

    // Upcoming tasks this week
    const upcomingTasks: DigestData['upcomingTasks'] = [];
    for (const client of clients) {
      if (client.archived || client.status !== 'active') continue;
      for (const item of client.checklist) {
        if (!item.completed && item.dueDate) {
          const due = item.dueDate.split('T')[0];
          if (due >= getWeekStart(now) && due <= weekEndStr) {
            upcomingTasks.push({ clientName: client.name, taskTitle: item.title, dueDate: due });
          }
        }
      }
    }
    upcomingTasks.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    const flavorText = FLAVOR_LINES[Math.floor(Math.random() * FLAVOR_LINES.length)];

    return {
      weeklyXP,
      tasksCompletedThisWeek,
      clientsGraduatedThisWeek,
      needsAttentionClients,
      upcomingTasks: upcomingTasks.slice(0, 5),
      flavorText,
    };
  }, [clients, weeklyXP]);
}
```

**Step 3: tsc check**

```bash
npx tsc --noEmit 2>&1
```

---

### Task 5: WeeklyDigestModal component

**Files:**
- Create: `src/components/Dashboard/WeeklyDigestModal.tsx`

**Step 1: Create the component**

```tsx
import { createPortal } from 'react-dom';
import type { DigestData } from '../../hooks/useWeeklyDigest';

interface WeeklyDigestModalProps {
  digest: DigestData;
  onClose: () => void;
}

export function WeeklyDigestModal({ digest, onClose }: WeeklyDigestModalProps) {
  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-gradient-to-br from-gray-900/98 to-indigo-950/98 border border-indigo-500/30 rounded-3xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div>
              <div className="text-indigo-400 text-xs font-semibold uppercase tracking-widest mb-0.5">Weekly Digest</div>
              <div className="text-white font-black text-xl">Your Quest Report</div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: '⚡', label: 'XP This Week', value: `+${digest.weeklyXP}` },
                { icon: '✅', label: 'Tasks Done', value: digest.tasksCompletedThisWeek },
                { icon: '🏆', label: 'Graduated', value: digest.clientsGraduatedThisWeek },
              ].map(stat => (
                <div key={stat.label} className="bg-white/5 rounded-2xl p-3 text-center">
                  <div className="text-2xl mb-1">{stat.icon}</div>
                  <div className="text-white font-black text-lg leading-none">{stat.value}</div>
                  <div className="text-gray-400 text-[10px] mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Needs attention */}
            {digest.needsAttentionClients.length > 0 && (
              <div>
                <div className="text-indigo-300 text-xs uppercase tracking-widest font-semibold mb-2">Focus On</div>
                <div className="space-y-1.5">
                  {digest.needsAttentionClients.map((c, i) => (
                    <div key={c.name} className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500 w-4">{i + 1}.</span>
                      <span className="text-white font-medium truncate">{c.name}</span>
                      <span className="text-gray-400 text-xs truncate">— {c.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming tasks */}
            {digest.upcomingTasks.length > 0 && (
              <div>
                <div className="text-indigo-300 text-xs uppercase tracking-widest font-semibold mb-2">Due This Week</div>
                <div className="space-y-1.5">
                  {digest.upcomingTasks.map((t, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-white truncate">{t.taskTitle}</span>
                      <span className="text-gray-400 text-xs flex-shrink-0">{t.clientName} · {t.dueDate}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Flavor text */}
            <div className="border-t border-white/10 pt-4 text-center">
              <p className="text-indigo-300 text-sm italic">"{digest.flavorText}"</p>
            </div>
          </div>

          <div className="px-6 pb-6">
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-xl hover:from-indigo-400 hover:to-purple-400 transition-all"
            >
              Begin the Week
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
```

**Step 2: tsc check**

```bash
npx tsc --noEmit 2>&1
```

---

### Task 6: Wire digest into App.tsx + Dashboard button

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/Dashboard/Dashboard.tsx`

**Step 1: Wire into App.tsx**

Add imports to `src/App.tsx`:
```typescript
import { usePreferences } from './hooks/usePreferences';
import { useWeeklyDigest } from './hooks/useWeeklyDigest';
import { useGamificationContext } from './context/GamificationContext';
import { WeeklyDigestModal } from './components/Dashboard/WeeklyDigestModal';
```

Inside `AppContent`, add state and logic:
```typescript
const { preferences, setLastDigestShown } = usePreferences();
const { getCurrentPlayerState } = useGamificationContext();
const [digestOpen, setDigestOpen] = useState(false);

const digest = useWeeklyDigest(clients, getCurrentPlayerState().weeklyXP);

// Auto-show digest once per week
useEffect(() => {
  const today = new Date().toISOString().split('T')[0];
  const lastShown = preferences.lastDigestShown;
  if (!lastShown || (new Date(today).getTime() - new Date(lastShown).getTime()) >= 7 * 86400000) {
    // Only show after a brief delay so the app loads first
    const timer = setTimeout(() => setDigestOpen(true), 1500);
    return () => clearTimeout(timer);
  }
}, []); // eslint-disable-line react-hooks/exhaustive-deps

const handleCloseDigest = useCallback(() => {
  setDigestOpen(false);
  setLastDigestShown(new Date().toISOString().split('T')[0]);
}, [setLastDigestShown]);
```

Pass `onOpenDigest` down via `Layout` to `Dashboard` or pass it directly to Dashboard via the `onNavigate` prop. Since Dashboard renders in `AppContent`, add:
```typescript
// In the JSX where Dashboard renders:
{currentView === 'dashboard' && (
  <Dashboard onNavigate={setCurrentView} onOpenDigest={() => setDigestOpen(true)} />
)}
```

Add digest modal near other modals at bottom of AppContent JSX:
```tsx
{digestOpen && <WeeklyDigestModal digest={digest} onClose={handleCloseDigest} />}
```

**Step 2: Add "View Digest" button to Dashboard**

In `Dashboard.tsx`, find the component signature and add `onOpenDigest?: () => void` to its props interface. Add a button in the Dashboard header area:

```tsx
{onOpenDigest && (
  <button
    onClick={onOpenDigest}
    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 hover:border-indigo-400/50 rounded-xl transition-all"
  >
    <span>📜</span>
    <span>Weekly Digest</span>
  </button>
)}
```

**Step 3: tsc + full test**

```bash
npx tsc --noEmit 2>&1 && npx vitest run 2>&1 | tail -6
```

---

### Task 7: Recurring task regeneration

**Files:**
- Modify: `src/hooks/useClients.ts` — add `addChecklistItemWithData`
- Modify: `src/context/ClientContext.tsx` — regenerate recurring tasks on complete

**Step 1: Add `addChecklistItemWithData` to useClients.ts**

Read `src/hooks/useClients.ts` to find the `addChecklistItem` function. After it, add:

```typescript
const addChecklistItemWithData = useCallback((
  clientId: string,
  data: Omit<ChecklistItem, 'id' | 'order'>
) => {
  setClients((prev) =>
    prev.map((client) => {
      if (client.id !== clientId) return client;
      const newItem: ChecklistItem = {
        ...data,
        id: generateId(),
        order: client.checklist.length,
      };
      return {
        ...client,
        checklist: [...client.checklist, newItem],
        activityLog: addActivityEntry(client.activityLog, 'task_added', `Added task: ${data.title}`),
      };
    })
  );
}, [setClients]);
```

Expose it in the hook's return object.

**Step 2: Add to ClientContext interface and value**

In `ClientContext.tsx`, add to the `ClientContextType` interface:
```typescript
addChecklistItemWithData: (clientId: string, data: Omit<ChecklistItem, 'id' | 'order'>) => void;
```

In the context value object, expose `clientOperations.addChecklistItemWithData`.

**Step 3: Add recurring regeneration to `toggleChecklistItem` wrapper**

In `ClientContext.tsx`, add a helper function above the wrappers:
```typescript
function computeNextDueDate(dueDate: string | undefined, recurrence: string): string {
  const base = dueDate ? new Date(dueDate) : new Date();
  const next = new Date(base);
  switch (recurrence) {
    case 'daily':    next.setDate(next.getDate() + 1); break;
    case 'weekly':   next.setDate(next.getDate() + 7); break;
    case 'biweekly': next.setDate(next.getDate() + 14); break;
    case 'monthly':  next.setMonth(next.getMonth() + 1); break;
  }
  return next.toISOString().split('T')[0];
}
```

In the `toggleChecklistItem` wrapper, after the existing gamification calls and before the `allDone` check, add:
```typescript
// Recurring task regeneration
if (item.recurrence && isCompleting) {
  const nextDueDate = computeNextDueDate(item.dueDate, item.recurrence);
  const exceedsEnd = item.recurrenceEndDate && nextDueDate > item.recurrenceEndDate;
  if (!exceedsEnd) {
    clientOperations.addChecklistItemWithData(clientId, {
      title: item.title,
      completed: false,
      order: 0, // will be overridden
      dueDate: nextDueDate,
      recurrence: item.recurrence,
      recurrenceEndDate: item.recurrenceEndDate,
      groupId: item.groupId,
    });
  }
}
```

**Step 4: tsc + full tests**

```bash
npx tsc --noEmit 2>&1 && npx vitest run 2>&1 | tail -6
```

---

### Task 8: Recurring task UI

**Files:**
- Read and modify the checklist item add/edit form component
  - Likely: `src/components/Clients/ClientDetail.tsx` or a dedicated `ChecklistItemForm`
  - Also: `src/components/Clients/ChecklistItem.tsx` or `SortableChecklistItem.tsx` for the 🔄 indicator

**Step 1: Read the checklist UI files**

```bash
# Use Glob to find checklist-related components:
# src/components/Clients/Checklist*.tsx
# src/components/Clients/ClientDetail.tsx (first 80 lines)
```

**Step 2: Add 🔄 indicator to recurring items**

In the checklist item render (wherever task title is shown), add:
```tsx
{item.recurrence && (
  <span className="text-xs text-indigo-400" title={`Repeats ${item.recurrence}`}>🔄</span>
)}
```

**Step 3: Add recurrence picker to task add form**

Find where new checklist items are added (likely an input + button in ClientDetail or a modal). After the due date field, add:

```tsx
{/* Repeats */}
<div className="flex items-center gap-2">
  <label className="text-xs text-gray-500 dark:text-gray-400 w-16">Repeats</label>
  <select
    value={newItemRecurrence ?? ''}
    onChange={e => setNewItemRecurrence(e.target.value as RecurrencePattern | '')}
    className="flex-1 text-xs border border-white/20 dark:border-white/10 rounded-lg px-2 py-1 bg-white/50 dark:bg-white/5"
  >
    <option value="">None</option>
    <option value="daily">Daily</option>
    <option value="weekly">Weekly</option>
    <option value="biweekly">Biweekly</option>
    <option value="monthly">Monthly</option>
  </select>
  {newItemRecurrence && (
    <input
      type="date"
      value={newItemRecurrenceEnd ?? ''}
      onChange={e => setNewItemRecurrenceEnd(e.target.value)}
      className="text-xs border border-white/20 dark:border-white/10 rounded-lg px-2 py-1 bg-white/50 dark:bg-white/5"
      placeholder="Until (optional)"
      title="End date (optional)"
    />
  )}
</div>
```

Add the two state variables at the top of whatever component this lives in:
```typescript
const [newItemRecurrence, setNewItemRecurrence] = useState<RecurrencePattern | ''>('');
const [newItemRecurrenceEnd, setNewItemRecurrenceEnd] = useState('');
```

When adding the item, pass recurrence fields:
```typescript
// After addChecklistItem(...), call updateChecklistItem to set recurrence:
if (newItemRecurrence) {
  // find the newly added item by title match (last item added)
  // OR use addChecklistItemWithData directly if available in context
}
```

Note: Since `addChecklistItem` doesn't accept recurrence, use `addChecklistItemWithData` from the context if exposed, OR call `addChecklistItem` then `updateChecklistItem` with the recurrence fields immediately after.

Read the actual form code before implementing — adapt to whatever pattern exists.

**Step 4: tsc + full test**

```bash
npx tsc --noEmit 2>&1 && npx vitest run 2>&1 | tail -6
```

---

### Task 9: Keyboard shortcuts

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/UI/CommandPalette.tsx` (or wherever the `?` help overlay renders)

**Step 1: Read relevant sections of App.tsx**

Find where the existing Ctrl+K shortcut is registered (around line 33–44). Add new shortcuts using the same `useKeyboardShortcuts` hook pattern OR via the existing `keydown` event handler.

**Step 2: Add navigation shortcuts to App.tsx**

Import `useKeyboardShortcuts` if not already imported:
```typescript
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
```

Inside `AppContent`, add shortcut registration:
```typescript
useKeyboardShortcuts([
  { key: 'd', handler: () => setCurrentView('dashboard'), description: 'Go to Dashboard' },
  { key: 'c', handler: () => setCurrentView('clients'), description: 'Go to Clients' },
  { key: 't', handler: () => setCurrentView('tasks'), description: 'Go to Tasks' },
  { key: 'p', handler: () => setCurrentView('planner'), description: 'Go to Planner' },
  { key: 'h', handler: () => setCurrentView('hall-of-heroes'), description: 'Go to Hall of Heroes' },
  { key: 'a', handler: () => setCurrentView('automations'), description: 'Go to Automations' },
  { key: 'n', shift: true, handler: () => setCurrentView('notes'), description: 'Go to Notes' },
  { key: 't', shift: true, handler: () => setCurrentView('team'), description: 'Go to Team' },
]);
```

**Step 3: Find and update the help overlay**

Search for where `Shift+?` opens the help modal. Read that component fully. Update the shortcuts list to include the new navigation shortcuts in a "Navigation" section.

**Step 4: tsc + full test**

```bash
npx tsc --noEmit 2>&1 && npx vitest run 2>&1 | tail -6
```

---

### Task 10: Client status PDF export

**Files:**
- Modify: `src/utils/export.ts` — add `exportClientStatusPDF`
- Modify: `src/components/Clients/ClientDetail.tsx` — add "Export PDF" button

**Step 1: Read the end of export.ts to see existing jsPDF usage pattern**

```bash
# Use Read tool on src/utils/export.ts (last 60 lines)
```

**Step 2: Add `exportClientStatusPDF` to `src/utils/export.ts`**

```typescript
import jsPDF from 'jspdf';

export function exportClientStatusPDF(client: Client): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  const addText = (text: string, x: number, size: number, style: 'normal' | 'bold' = 'normal', color = '#1f2937') => {
    doc.setFontSize(size);
    doc.setFont('helvetica', style);
    doc.setTextColor(color);
    doc.text(text, x, y);
  };

  // Header
  addText('Onboarding Status Report', margin, 20, 'bold', '#4f46e5');
  y += 8;
  addText(client.name, margin, 16, 'bold');
  y += 6;

  const statusLabel = { active: 'In Progress', completed: 'Completed', 'on-hold': 'On Hold' }[client.status] ?? client.status;
  addText(`Status: ${statusLabel}`, margin, 11, 'normal', '#6b7280');
  y += 5;

  const completedTasks = client.checklist.filter(i => i.completed).length;
  const totalTasks = client.checklist.length;
  if (totalTasks > 0) {
    addText(`Progress: ${completedTasks}/${totalTasks} tasks completed (${Math.round((completedTasks / totalTasks) * 100)}%)`, margin, 11, 'normal', '#6b7280');
    y += 5;
  }
  y += 5;

  // Services
  if (client.services.length > 0) {
    addText('Services', margin, 13, 'bold');
    y += 5;
    for (const svc of client.services) {
      addText(`• ${svc.name}`, margin + 4, 10);
      y += 4;
    }
    y += 4;
  }

  // Milestones
  if ((client.milestones?.length ?? 0) > 0) {
    addText('Milestones', margin, 13, 'bold');
    y += 5;
    for (const ms of client.milestones!) {
      const status = ms.completedAt ? '✓' : '○';
      const target = ms.targetDate ? ` (${ms.targetDate})` : '';
      addText(`${status} ${ms.title}${target}`, margin + 4, 10, 'normal', ms.completedAt ? '#059669' : '#374151');
      y += 5;
      if (y > 260) { doc.addPage(); y = 20; }
    }
    y += 4;
  }

  // Completed tasks
  const done = client.checklist.filter(i => i.completed);
  if (done.length > 0) {
    if (y > 240) { doc.addPage(); y = 20; }
    addText('Completed Tasks', margin, 13, 'bold');
    y += 5;
    for (const item of done) {
      addText(`✓ ${item.title}`, margin + 4, 9, 'normal', '#059669');
      y += 4;
      if (y > 270) { doc.addPage(); y = 20; }
    }
    y += 4;
  }

  // Upcoming tasks (next 5 pending with due dates)
  const upcoming = client.checklist
    .filter(i => !i.completed && i.dueDate)
    .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))
    .slice(0, 5);
  if (upcoming.length > 0) {
    if (y > 240) { doc.addPage(); y = 20; }
    addText('Next Steps', margin, 13, 'bold');
    y += 5;
    for (const item of upcoming) {
      addText(`○ ${item.title} — Due ${item.dueDate}`, margin + 4, 9);
      y += 4;
      if (y > 270) { doc.addPage(); y = 20; }
    }
    y += 4;
  }

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor('#9ca3af');
  doc.text(`Generated by Embark · ${new Date().toLocaleDateString()}`, margin, pageHeight - 10);

  doc.save(`${client.name.replace(/[^a-z0-9]/gi, '-')}-onboarding-status.pdf`);
}
```

**Step 3: Add "Export PDF" button to ClientDetail**

Read `src/components/Clients/ClientDetail.tsx` (first 50 lines) to find the header/action area. Import `exportClientStatusPDF` and add a button:

```tsx
import { exportClientStatusPDF } from '../../utils/export';

// In the JSX action buttons area:
<button
  onClick={() => exportClientStatusPDF(client)}
  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 border border-white/20 rounded-lg hover:bg-white/10 transition-all"
  title="Export client status as PDF"
>
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
  <span>Export PDF</span>
</button>
```

**Step 4: Final full check**

```bash
npx tsc --noEmit 2>&1 && npx vitest run 2>&1 | tail -8 && npm run build 2>&1 | tail -5
```

Expected: 0 TS errors, all tests pass, clean build.
