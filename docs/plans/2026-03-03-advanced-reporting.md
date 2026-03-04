# Advanced Reporting Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a `reports` view with 5 data sections (velocity, trend, progress table, team performance, PDF export) derived from existing `clients[]` data.

**Architecture:** Two new files (`useReports.ts` hook + `ReportView.tsx` component), four small edits to wire them in (types, sidebar, App.tsx). Pure CSS charts — no new dependencies.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, pure CSS charts, jsPDF (already installed)

---

## Task 1: Add `'reports'` to the View union

**Files:**
- Modify: `src/types/index.ts:243`

**Step 1: Update the View type**

In `src/types/index.ts`, locate line 243:
```typescript
export type View = 'dashboard' | 'clients' | 'templates' | 'tasks' | 'planner' | 'notes' | 'ai' | 'marketplace' | 'team' | 'automations' | 'hall-of-heroes';
```

Replace with:
```typescript
export type View = 'dashboard' | 'clients' | 'templates' | 'tasks' | 'planner' | 'notes' | 'ai' | 'marketplace' | 'team' | 'automations' | 'hall-of-heroes' | 'reports';
```

**Step 2: Run build to verify 0 TS errors**

```bash
cd client-onboarding-tracker && npm run build
```
Expected: `✓ built in X.XXs` with no errors.

---

## Task 2: Create `useReports.ts` hook

**Files:**
- Create: `src/hooks/useReports.ts`

**Step 1: Create the hook**

```typescript
import { useMemo } from 'react';
import type { Client, Priority } from '../types';
import { getClientHealth } from '../utils/clientHealth';
import type { HealthStatus } from '../utils/clientHealth';

export interface VelocityEntry {
  clientName: string;
  days: number;
}

export interface TrendEntry {
  date: string;   // 'YYYY-MM-DD'
  count: number;
}

export interface ProgressEntry {
  id: string;
  name: string;
  healthStatus: HealthStatus | null;
  pctDone: number;
  daysActive: number;
  priority: Priority;
  assignedTo: string;
}

export interface TeamEntry {
  member: string;
  completed: number;
  overdue: number;
}

export interface ReportData {
  velocity: VelocityEntry[];
  avgVelocity: number;
  completionTrend: TrendEntry[];
  clientProgress: ProgressEntry[];
  teamPerformance: TeamEntry[];
}

export function useReports(clients: Client[], trendDays: 7 | 30 | 90 = 30): ReportData {
  return useMemo(() => {
    const now = new Date();

    // 1. Onboarding Velocity — completed clients only
    const velocity: VelocityEntry[] = clients
      .filter((c) => !c.archived && c.status === 'completed' && c.checklist.length > 0)
      .map((c) => {
        const lastCompleted = c.checklist
          .filter((t) => t.completed && t.dueDate)
          .map((t) => new Date(t.dueDate!).getTime())
          .sort((a, b) => b - a)[0];
        const end = lastCompleted ?? now.getTime();
        const start = new Date(c.createdAt).getTime();
        const days = Math.max(0, Math.round((end - start) / 86400000));
        return { clientName: c.name, days };
      });

    const avgVelocity =
      velocity.length > 0
        ? Math.round(velocity.reduce((sum, v) => sum + v.days, 0) / velocity.length)
        : 0;

    // 2. Completion Trend — tasks completed per day from activityLog
    const cutoff = new Date(now.getTime() - trendDays * 86400000);
    const countByDate: Record<string, number> = {};
    clients.forEach((c) => {
      (c.activityLog ?? [])
        .filter(
          (e) => e.type === 'task_completed' && new Date(e.timestamp) >= cutoff
        )
        .forEach((e) => {
          const date = e.timestamp.slice(0, 10);
          countByDate[date] = (countByDate[date] ?? 0) + 1;
        });
    });
    const completionTrend: TrendEntry[] = Object.entries(countByDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 3. Client Progress Table — active clients
    const clientProgress: ProgressEntry[] = clients
      .filter((c) => !c.archived && c.status === 'active')
      .map((c) => {
        const total = c.checklist.length;
        const done = c.checklist.filter((t) => t.completed).length;
        const daysActive = Math.round(
          (now.getTime() - new Date(c.createdAt).getTime()) / 86400000
        );
        const health = getClientHealth(c);
        return {
          id: c.id,
          name: c.name,
          healthStatus: health?.status ?? null,
          pctDone: total > 0 ? Math.round((done / total) * 100) : 0,
          daysActive,
          priority: c.priority,
          assignedTo: c.assignedTo,
        };
      });

    // 4. Team Performance — last 30 days
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
    const memberMap: Record<string, { completed: number; overdue: number }> = {};

    clients.forEach((c) => {
      const member = c.assignedTo || 'Unassigned';
      if (!memberMap[member]) memberMap[member] = { completed: 0, overdue: 0 };

      // Completed tasks via activityLog in last 30 days
      (c.activityLog ?? [])
        .filter(
          (e) => e.type === 'task_completed' && new Date(e.timestamp) >= thirtyDaysAgo
        )
        .forEach(() => {
          memberMap[member].completed += 1;
        });

      // Overdue tasks (incomplete + past due date)
      c.checklist
        .filter(
          (t) => !t.completed && t.dueDate && new Date(t.dueDate) < now
        )
        .forEach(() => {
          memberMap[member].overdue += 1;
        });
    });

    const teamPerformance: TeamEntry[] = Object.entries(memberMap)
      .map(([member, stats]) => ({ member, ...stats }))
      .sort((a, b) => b.completed - a.completed);

    return { velocity, avgVelocity, completionTrend, clientProgress, teamPerformance };
  }, [clients, trendDays]);
}
```

**Step 2: Run build to verify 0 TS errors**

```bash
npm run build
```
Expected: 0 errors.

---

## Task 3: Create `ReportView.tsx` component

**Files:**
- Create: `src/components/Reports/ReportView.tsx`

**Step 1: Create the component**

```typescript
import { useState } from 'react';
import type { Client } from '../../types';
import { useClientContext } from '../../context/ClientContext';
import { useReports } from '../../hooks/useReports';
import { exportOnboardingStatusReport } from '../../utils/export';
import { Button } from '../UI/Button';
import { HEALTH_COLORS } from '../../utils/clientHealth';

type SortKey = 'name' | 'healthStatus' | 'pctDone' | 'daysActive' | 'priority';
type SortDir = 'asc' | 'desc';

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2, none: 3 };

export function ReportView() {
  const { clients } = useClientContext();
  const [trendDays, setTrendDays] = useState<7 | 30 | 90>(30);
  const [sortKey, setSortKey] = useState<SortKey>('pctDone');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const { velocity, avgVelocity, completionTrend, clientProgress, teamPerformance } =
    useReports(clients, trendDays);

  const maxVelocity = Math.max(...velocity.map((v) => v.days), 1);
  const maxTrend = Math.max(...completionTrend.map((t) => t.count), 1);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sorted = [...clientProgress].sort((a, b) => {
    let cmp = 0;
    if (sortKey === 'name') cmp = a.name.localeCompare(b.name);
    else if (sortKey === 'pctDone') cmp = a.pctDone - b.pctDone;
    else if (sortKey === 'daysActive') cmp = a.daysActive - b.daysActive;
    else if (sortKey === 'priority') cmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    else if (sortKey === 'healthStatus') {
      cmp = (a.healthStatus ?? 'z').localeCompare(b.healthStatus ?? 'z');
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const SortBtn = ({ col, label }: { col: SortKey; label: string }) => (
    <button
      onClick={() => handleSort(col)}
      className="flex items-center gap-1 font-bold text-zinc-900 dark:text-white hover:text-yellow-500"
    >
      {label}
      {sortKey === col && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
    </button>
  );

  return (
    <div className="p-6 space-y-10 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black font-display text-zinc-900 dark:text-white">
            Reports
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Onboarding analytics at a glance
          </p>
        </div>
        <Button onClick={() => exportOnboardingStatusReport(clients)}>
          Export PDF
        </Button>
      </div>

      {/* 1. Onboarding Velocity */}
      <section>
        <h2 className="text-lg font-black font-display mb-1 text-zinc-900 dark:text-white">
          Onboarding Velocity
        </h2>
        <p className="text-xs text-zinc-500 mb-4">
          Days from creation to completion · Avg: <strong>{avgVelocity} days</strong>
        </p>
        {velocity.length === 0 ? (
          <p className="text-sm text-zinc-400">No completed clients yet.</p>
        ) : (
          <div className="space-y-2">
            {velocity.map((v) => (
              <div key={v.clientName} className="flex items-center gap-3">
                <span className="w-32 text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate">
                  {v.clientName}
                </span>
                <div className="flex-1 h-5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-[2px] relative overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-[2px] progress-bar"
                    style={{ width: `${(v.days / maxVelocity) * 100}%` }}
                  />
                  {/* avg reference line */}
                  <div
                    className="absolute top-0 bottom-0 w-[2px] bg-red-500 opacity-60"
                    style={{ left: `${(avgVelocity / maxVelocity) * 100}%` }}
                  />
                </div>
                <span className="w-14 text-xs text-zinc-500 text-right">{v.days}d</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 2. Task Completion Trend */}
      <section>
        <div className="flex items-center gap-4 mb-4">
          <h2 className="text-lg font-black font-display text-zinc-900 dark:text-white">
            Task Completion Trend
          </h2>
          <div className="flex gap-1">
            {([7, 30, 90] as const).map((d) => (
              <button
                key={d}
                onClick={() => setTrendDays(d)}
                className={`px-3 py-1 text-xs font-bold border-2 rounded-[4px] transition-colors ${
                  trendDays === d
                    ? 'bg-yellow-400 border-zinc-900 text-zinc-900'
                    : 'border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-400 hover:border-zinc-500'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
        {completionTrend.length === 0 ? (
          <p className="text-sm text-zinc-400">No task completions recorded yet.</p>
        ) : (
          <div className="flex items-end gap-1 h-28 border-b-2 border-zinc-300 dark:border-zinc-700">
            {completionTrend.map((t) => (
              <div
                key={t.date}
                title={`${t.date}: ${t.count} tasks`}
                className="flex-1 bg-yellow-400 hover:bg-yellow-500 transition-colors rounded-t-[2px] min-w-[4px] progress-bar"
                style={{ height: `${(t.count / maxTrend) * 100}%` }}
              />
            ))}
          </div>
        )}
      </section>

      {/* 3. Client Progress Table */}
      <section>
        <h2 className="text-lg font-black font-display mb-4 text-zinc-900 dark:text-white">
          Client Progress
        </h2>
        {sorted.length === 0 ? (
          <p className="text-sm text-zinc-400">No active clients.</p>
        ) : (
          <div className="border-2 border-zinc-900 dark:border-zinc-600 rounded-[4px] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-zinc-900 dark:bg-zinc-700 text-white">
                <tr>
                  <th className="px-4 py-2 text-left"><SortBtn col="name" label="Client" /></th>
                  <th className="px-4 py-2 text-left"><SortBtn col="healthStatus" label="Health" /></th>
                  <th className="px-4 py-2 text-left"><SortBtn col="pctDone" label="% Done" /></th>
                  <th className="px-4 py-2 text-left"><SortBtn col="daysActive" label="Days Active" /></th>
                  <th className="px-4 py-2 text-left"><SortBtn col="priority" label="Priority" /></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((row, i) => (
                  <tr
                    key={row.id}
                    className={`border-t border-zinc-200 dark:border-zinc-700 ${
                      i % 2 === 0 ? 'bg-white dark:bg-zinc-900' : 'bg-zinc-50 dark:bg-zinc-800'
                    }`}
                  >
                    <td className="px-4 py-2 font-medium text-zinc-900 dark:text-white">{row.name}</td>
                    <td className="px-4 py-2">
                      {row.healthStatus ? (
                        <span
                          className={`px-2 py-0.5 rounded-[4px] text-xs font-bold ${
                            HEALTH_COLORS[row.healthStatus].badge
                          }`}
                        >
                          {HEALTH_COLORS[row.healthStatus].label}
                        </span>
                      ) : (
                        <span className="text-zinc-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-400 progress-bar"
                            style={{ width: `${row.pctDone}%` }}
                          />
                        </div>
                        <span className="text-xs text-zinc-600 dark:text-zinc-400">
                          {row.pctDone}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">{row.daysActive}d</td>
                    <td className="px-4 py-2">
                      {row.priority !== 'none' ? (
                        <span className="capitalize text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          {row.priority}
                        </span>
                      ) : (
                        <span className="text-zinc-400 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 4. Team Performance */}
      <section>
        <h2 className="text-lg font-black font-display mb-4 text-zinc-900 dark:text-white">
          Team Performance <span className="text-sm font-normal text-zinc-500">(last 30 days)</span>
        </h2>
        {teamPerformance.length === 0 ? (
          <p className="text-sm text-zinc-400">No team data yet.</p>
        ) : (
          <div className="space-y-3">
            {teamPerformance.map((t) => (
              <div
                key={t.member}
                className="flex items-center gap-4 border-2 border-zinc-200 dark:border-zinc-700 rounded-[4px] px-4 py-3"
              >
                <span className="w-32 text-sm font-bold text-zinc-900 dark:text-white truncate">
                  {t.member || 'Unassigned'}
                </span>
                <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-[4px]">
                  {t.completed} completed
                </span>
                {t.overdue > 0 && (
                  <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 text-xs font-bold rounded-[4px]">
                    {t.overdue} overdue
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
```

**Step 2: Run build to verify 0 TS errors**

```bash
npm run build
```
Expected: 0 errors.

---

## Task 4: Wire Reports into App.tsx + Sidebar

**Files:**
- Modify: `src/App.tsx` (add lazy import + view render)
- Modify: `src/components/Layout/Sidebar.tsx` (add nav item)

**Step 1: Add lazy import to App.tsx**

In `src/App.tsx`, after the existing lazy imports (around line 29), add:
```typescript
const ReportView = lazy(() => import('./components/Reports/ReportView').then(m => ({ default: m.ReportView })));
```

**Step 2: Add view render in App.tsx**

In `src/App.tsx`, inside the `<Suspense>` block (after the `hall-of-heroes` line ~129), add:
```typescript
{currentView === 'reports' && <ReportView />}
```

**Step 3: Add keyboard shortcut for reports**

In `src/App.tsx`, inside `useKeyboardShortcuts` array (around line 73-82), add:
```typescript
{ key: 'r', handler: () => setCurrentView('reports') },
```

**Step 4: Add Reports nav item to Sidebar**

In `src/components/Layout/Sidebar.tsx`, add to the `navItems` array (after `hall-of-heroes`):
```typescript
{
  view: 'reports',
  label: 'Reports',
  icon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
},
```

**Step 5: Run build to verify 0 TS errors**

```bash
npm run build
```
Expected: 0 errors.

**Step 6: Run tests**

```bash
npx vitest run
```
Expected: 51 passed (no new failures).

---

## Verification

1. `npm run build` — 0 TS errors
2. `npx vitest run` — 51 tests pass
3. Manual smoke test:
   - Navigate to Reports via sidebar (chart-bar icon) or press `R`
   - Velocity section shows bars for completed clients (avg reference line visible)
   - Toggle trend period 7/30/90 → chart updates
   - Client progress table sortable by all columns
   - Team performance shows per-assignee counts
   - PDF export button calls `exportOnboardingStatusReport`
