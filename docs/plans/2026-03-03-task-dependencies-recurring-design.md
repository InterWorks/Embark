# Feature Design: Task Dependencies + Recurring Tasks

**Date:** 2026-03-03
**Status:** Ready for implementation
**Scope:** Wire up existing UI and type scaffolding to enforcement logic

---

## Context

The types, UI pickers, and badge displays for both task dependencies and recurring tasks are
already built. What's missing is the *enforcement* layer: the app silently ignores dependency
constraints and doesn't clean up orphan recurrence entries on un-complete.

---

## What's Already Built

| Item | Location |
|------|----------|
| `ChecklistItem.dependsOn?: string[]` type | `src/types/index.ts` |
| `recurrence?: RecurrencePattern` type | `src/types/index.ts` |
| Dependency picker UI + "Blocked" badge | `src/components/Checklist/SortableChecklistItem.tsx` |
| Next-occurrence auto-creation on complete | `src/hooks/useClients.ts` → `toggleChecklistItem` |
| Recurrence picker UI + teal badge | `src/components/Checklist/SortableChecklistItem.tsx` |

---

## What's Missing

### 1. Dependency enforcement on toggle

**Problem:** `ClientContext.toggleChecklistItem` calls through to `clientOperations.toggleChecklistItem`
without checking whether all dependencies are satisfied first.

**Fix:** In `src/context/ClientContext.tsx`, inside the `toggleChecklistItem` wrapper (~line 231),
add a blocker check before the inner call:

```typescript
// Only enforce when completing (not un-completing)
const isCompleting = !item?.completed;
if (isCompleting && item?.dependsOn?.length) {
  const blockers = client!.checklist.filter(
    (t) => item.dependsOn!.includes(t.id) && !t.completed
  );
  if (blockers.length > 0) {
    const names = blockers.map((b) => `"${b.title}"`).join(', ');
    showToast(`Blocked by: ${names}`, 'warning');
    return; // early return — do not complete
  }
}
```

**Toast integration:** `ClientContext` already has access to `useToast` via the `showToast` helper
(confirm exact import pattern by reading the file).

### 2. Orphan cleanup on un-complete of recurring task

**Problem:** When a recurring task is completed, `useClients.ts` auto-creates a new pending
occurrence. But if the user then un-checks the completed task, the auto-created occurrence is
never removed — creating a duplicate.

**Fix:** In `src/hooks/useClients.ts` inside `toggleChecklistItem`, when `isCompleting === false`
and `item.recurrence` is set, find and delete the auto-generated next occurrence:

```typescript
// In the un-complete branch, after setting completed: false:
if (!isCompleting && item.recurrence) {
  // Find the next pending occurrence (same title, not completed, created after this item)
  const nextOccurrence = checklist.find(
    (t) =>
      t.id !== itemId &&
      t.title === item.title &&
      !t.completed &&
      t.recurrence === item.recurrence
  );
  if (nextOccurrence) {
    // Remove it
    return checklist.filter((t) => t.id !== nextOccurrence.id);
  }
}
```

---

## Key Files

| File | Change |
|------|--------|
| `src/context/ClientContext.tsx` | Add blocker check + toast in `toggleChecklistItem` wrapper |
| `src/hooks/useClients.ts` | Handle un-complete orphan removal in `toggleChecklistItem` |
| `src/components/Checklist/SortableChecklistItem.tsx` | (Optional) Show blocker names in tooltip, currently shows count |

---

## Verification

1. `npm run build` — 0 TS errors
2. `npx vitest run` — all 51 tests pass
3. Manual:
   - Create Task A and Task B; set B to depend on A
   - Try to complete B → toast appears: "Blocked by: 'Task A'"
   - Complete A, then complete B → succeeds
   - Set Task C to repeat weekly, complete it → new occurrence appears
   - Un-check Task C → new occurrence is removed
