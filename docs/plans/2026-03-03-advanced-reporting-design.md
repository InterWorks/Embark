# Feature Design: Advanced Reporting

**Date:** 2026-03-03
**Status:** Ready for implementation
**Scope:** New `reports` view with 5 data sections + PDF export

---

## Context

The app has rich client/task/activity data but no aggregated reporting view. Users need
a high-level summary of onboarding velocity, trends, team performance, and a PDF export.

---

## Report Sections

### 1. Onboarding Velocity
- Average days from `client.createdAt` to all checklist tasks completed
- Bar chart (CSS-only, no chart library) per completed client
- Show avg as a dashed reference line

### 2. Task Completion Trend
- Line chart of tasks completed per day
- Toggle: 7 / 30 / 90 days
- Derived from `client.activityLog` entries where `type === 'task_completed'`

### 3. Client Progress Table
- All active clients in a sortable table
- Columns: Name, Health, % Done, Days Active, Priority
- Sort by any column, ascending/descending

### 4. Team Performance
- Per-assignee: tasks completed + overdue tasks in last 30 days
- Aggregate from all clients where `assignedTo === member`

### 5. "State of Onboarding" PDF Export
- Calls existing `src/utils/pdfExport.ts`
- Button in report header, generates a snapshot of the current report state

---

## Data Model

No new persistent types needed. All data is derived from `clients[]` at render time.

```typescript
// In src/hooks/useReports.ts
interface ReportData {
  velocity: { clientName: string; days: number }[];
  avgVelocity: number;
  completionTrend: { date: string; count: number }[];
  clientProgress: {
    id: string;
    name: string;
    health: HealthStatus;
    pctDone: number;
    daysActive: number;
    priority: Priority;
    assignedTo: string;
  }[];
  teamPerformance: {
    member: string;
    completed: number;
    overdue: number;
  }[];
}
```

---

## New Files

| File | Purpose |
|------|---------|
| `src/hooks/useReports.ts` | Compute all derived stats from `clients[]` |
| `src/components/Reports/ReportView.tsx` | Full report UI — 5 sections |

---

## Modified Files

| File | Change |
|------|--------|
| `src/types/index.ts` | Add `'reports'` to the `View` union |
| `src/components/Layout/Sidebar.tsx` | Add Reports nav item (chart bar icon) |
| `src/App.tsx` | Lazy-load `ReportView` for the `reports` view |

---

## Design Notes

- Charts: pure CSS (`div` width % of container, no external library)
- Progress table: reuse existing sort pattern from `TasksView`
- All numbers animate in with `useCountUp` (already in codebase at `Dashboard.tsx`)
- PDF button: reuse `Button` variant="primary" + call `exportOnboardingStatusReport(clients)`
  already imported in other files

---

## Verification

1. `npm run build` — 0 TS errors
2. `npx vitest run` — all 51 tests pass
3. Manual:
   - Navigate to Reports via sidebar
   - Velocity section shows bars for completed clients
   - Toggle trend period 7/30/90 → chart updates
   - Client table sortable by all columns
   - Team performance shows per-assignee counts
   - PDF export button downloads file
