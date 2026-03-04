# Feature Batch Design — Embark
**Date:** 2026-03-02
**Status:** Approved

Six features to implement in order:
1. Client Health Scores + Dashboard Widget
2. Weekly Digest
3. Recurring Tasks
4. Keyboard Shortcuts
5. Shareable Client Status PDF

---

## 1. Client Health Scores + Dashboard Widget

### Health Score Logic

Pure computed utility — no new state, no hook. Function: `getClientHealth(client: Client): HealthStatus`

| Status | Value | Color | Criteria |
|---|---|---|---|
| On Track | `'on-track'` | 🟢 Green | No overdue tasks, last activity within 7 days |
| At Risk | `'at-risk'` | 🟡 Yellow | 1–2 overdue tasks, OR no activity in 7–14 days, OR a milestone past its target date |
| Needs Attention | `'needs-attention'` | 🔴 Red | 3+ overdue tasks, OR no activity in 14+ days, OR 0% progress after 14 days active |
| Stalled | `'stalled'` | ⚫ Gray | Active client, no checklist activity in 30+ days |

Returns: `{ status: HealthStatus; reason: string }` where `reason` is a human-readable string (e.g. "3 overdue tasks", "No activity in 18 days").

Only applies to `status === 'active'` clients. Completed/on-hold clients show no health indicator.

### Where It Shows

**ClientCard:** Colored dot (w-3 h-3 rounded-full) in the top-right corner of the card, with a tooltip showing the reason.

**TableView:** Colored left-border (border-l-4) on each row, matching the health color.

**Dashboard — "Needs Attention" widget:** New section at the top of the Dashboard (above existing stats). Lists clients with `'needs-attention'` or `'stalled'` status, sorted by severity (stalled first), each row showing:
- Client name
- Health badge
- Specific reason string
- Click → opens client detail

Hidden if no clients need attention.

### New Files
- `src/utils/clientHealth.ts` — `getClientHealth()` function + `HealthStatus` type

### Modified Files
- `src/components/Clients/ClientCard.tsx` — add health dot
- `src/components/Views/TableView.tsx` (or equivalent table component) — add colored left border
- `src/components/Dashboard/Dashboard.tsx` — add "Needs Attention" widget

---

## 2. Weekly Digest

### Behavior

- Auto-shows on first app open of the week (Monday, or first visit after 7 days)
- `lastDigestShown` date stored in localStorage via `usePreferences` (extend the preferences object)
- Dismissed with "Got it" — won't show again until next week
- A "View Digest" button on the Dashboard header lets the user re-open it any time
- `showDigest` state lives in `AppContent` in `App.tsx`

### Content

```
🗡️  Weekly Digest — Week of Feb 24

⚡  XP Earned Last Week          +340 XP
✅  Tasks Completed               12
🏆  Clients Graduated             1
🔴  Clients Needing Attention     2

📅  Upcoming This Week
    - Send welcome email (Acme Corp) — due Tue
    - Review contract (Beta Inc) — due Thu

👑  Focus On
    1. Acme Corp — 3 overdue tasks
    2. Beta Inc — No activity in 9 days
    3. Gamma LLC — Milestone past target date

"The guild awaits your return, adventurer."
```

### Architecture

- `useWeeklyDigest` hook — computes digest data from `clients`, `useGamification`, current date
- `WeeklyDigestModal` component — renders the digest
- Extend `usePreferences` to include `lastDigestShown: string` (ISO date)

### New Files
- `src/hooks/useWeeklyDigest.ts`
- `src/components/Dashboard/WeeklyDigestModal.tsx`

### Modified Files
- `src/hooks/usePreferences.ts` — add `lastDigestShown`
- `src/App.tsx` — digest open/close state + auto-show logic
- `src/components/Dashboard/Dashboard.tsx` — "View Digest" button

---

## 3. Recurring Tasks

### UI

Checklist item editor gets a "Repeats" row:
- Dropdown: **None / Daily / Weekly / Biweekly / Monthly**
- When not None: an "Until" date picker appears (optional)

A 🔄 icon renders inline on recurring task rows in the checklist.

### Auto-Regeneration Logic

In `ClientContext.toggleChecklistItem` wrapper, after completing a recurring task:
1. Check if `item.recurrence` is set and item is being completed (not uncompleted)
2. Compute next due date by advancing `item.dueDate` by the recurrence interval:
   - daily: +1 day
   - weekly: +7 days
   - biweekly: +14 days
   - monthly: +1 month (same day)
3. If `item.recurrenceEndDate` exists and next due date exceeds it, skip creation
4. Call `clientOperations.addChecklistItem(clientId, item.title, nextDueDate)` then `clientOperations.updateChecklistItem(...)` to set `recurrence` + `recurrenceEndDate` on the new item
5. No XP for auto-generated tasks (only for manually completing the original)

### Modified Files
- `src/context/ClientContext.tsx` — add recurring task regeneration in `toggleChecklistItem`
- `src/components/Clients/ChecklistItem.tsx` (or wherever task editing happens) — add Repeats UI
- `src/components/Clients/ClientDetail.tsx` or checklist form — add recurrence picker to task add form

---

## 4. Keyboard Shortcuts

### New Shortcuts

| Shortcut | Action |
|---|---|
| `D` | Navigate to Dashboard |
| `C` | Navigate to Clients |
| `T` | Navigate to Tasks |
| `P` | Navigate to Planner |
| `H` | Navigate to Hall of Heroes |
| `A` | Navigate to Automations |
| `Shift+N` | Navigate to Notes |
| `Shift+T` | Navigate to Team |

All single-letter shortcuts only fire when not in input/textarea/select (already handled by `useKeyboardShortcuts`). No conflicts with existing `n` (new client), `/` (search), `1–6` (view switching).

### Help Overlay Improvement

The existing `?` shortcut opens a help modal. Expand it to show all shortcuts organized in sections:
- **Navigation** — new shortcuts above
- **Actions** — n (new client), / (search), Ctrl+A (select all)
- **Views** — 1–6 (card/table/kanban/timeline/gantt/calendar)
- **General** — Escape, ?

### Modified Files
- `src/App.tsx` — add new shortcut bindings that call `setCurrentView`
- `src/components/UI/CommandPalette.tsx` or wherever the `?` help overlay renders — expand sections

---

## 5. Shareable Client Status PDF

### Trigger
"Export PDF" button in the client detail modal header, alongside existing options.

### Content (client-facing, no internal data)
1. Header: Client name, status badge, overall progress % (completed/total tasks)
2. Services: bulleted list
3. Milestones: table with title, target date, status (✓ Complete / Upcoming)
4. Completed tasks: simple list
5. Upcoming tasks: next 5 pending tasks with due dates
6. Footer: "Generated by Embark · {date}"

### Excluded (internal only)
Assignee names, priority, overdue flags, internal notes, activity log, tags

### Architecture
New function `exportClientStatusPDF(client: Client): void` in `src/utils/export.ts` using jsPDF (already installed). No new dependencies.

### Modified Files
- `src/utils/export.ts` — add `exportClientStatusPDF`
- `src/components/Clients/ClientDetail.tsx` — add "Export PDF" button
