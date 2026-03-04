# Task Dependencies + Recurring Tasks Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enforce dependency constraints when completing tasks, and clean up orphan recurrence entries when un-completing.

**Architecture:** Two targeted edits to existing functions — one in the React context wrapper (enforcement + toast), one in the raw hook (orphan removal). No new files, no new types.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, localStorage via custom hook

---

## Task 1: Add dependency enforcement in ClientContext.tsx

**Files:**
- Modify: `src/context/ClientContext.tsx:1` (add import)
- Modify: `src/context/ClientContext.tsx:231-238` (add blocker check)

**Step 1: Add `useToast` import**

In `src/context/ClientContext.tsx`, add `useToast` to the existing imports at the top of the file.

Current line 1:
```typescript
import { createContext, useContext, useCallback, useEffect, type ReactNode } from 'react';
```

Add after the existing imports (around line 10):
```typescript
import { useToast } from '../components/UI/Toast';
```

**Step 2: Instantiate `showToast` in `ClientProvider`**

In the `ClientProvider` function body (around line 113-130), add:
```typescript
const { showToast } = useToast();
```

Place it after the existing hook instantiations (after `const gamification = useGamification();`).

**Step 3: Add blocker check before the inner toggle call**

The `toggleChecklistItem` wrapper starts at line 231. Currently:
```typescript
const toggleChecklistItem = useCallback((clientId: string, itemId: string) => {
  const client = clientOperations.clients.find(c => c.id === clientId);
  const item = client?.checklist.find(i => i.id === itemId);
  const isCompleting = item ? !item.completed : false;

  clientOperations.toggleChecklistItem(clientId, itemId);   // ← line 236
  ...
```

Insert between line 234 (`isCompleting` assignment) and line 236 (`clientOperations.toggleChecklistItem`):

```typescript
// Dependency enforcement: block completion if unmet dependencies exist
if (isCompleting && item?.dependsOn?.length) {
  const blockers = client!.checklist.filter(
    (t) => item.dependsOn!.includes(t.id) && !t.completed
  );
  if (blockers.length > 0) {
    const names = blockers.map((b) => `"${b.title}"`).join(', ');
    showToast(`Blocked by: ${names}`, 'info');
    return;
  }
}
```

**Step 4: Run build to verify 0 TS errors**

```bash
cd client-onboarding-tracker && npm run build
```
Expected: `✓ built in X.XXs` with no TypeScript errors.

**Step 5: Run tests**

```bash
npx vitest run
```
Expected: 51 passed (0 new failures — this change has no test coverage yet, that's OK).

**Step 6: Commit**

```bash
git add src/context/ClientContext.tsx
git commit -m "feat: enforce task dependency constraints on toggle"
```

---

## Task 2: Add orphan cleanup in useClients.ts

**Files:**
- Modify: `src/hooks/useClients.ts:305-357` (add orphan removal in un-complete branch)

**Step 1: Write the failing test**

Add to `src/test/useClients.test.ts`:

```typescript
it('removes auto-created next occurrence when un-completing a recurring task', () => {
  const { result } = renderHook(() => useClients());

  let clientId: string;
  let taskId: string;

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
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/test/useClients.test.ts
```
Expected: FAIL on the new test (checklist still has 2 items after un-complete).

**Step 3: Implement orphan removal**

In `src/hooks/useClients.ts`, locate the `toggleChecklistItem` function (line 280).

After line 307 (`let updatedChecklist = client.checklist.map(...)`), add:

```typescript
// Un-complete of recurring task: remove auto-created next occurrence
if (!newCompleted && item.recurrence) {
  const orphan = updatedChecklist.find(
    (t) =>
      t.id !== itemId &&
      t.title === item.title &&
      !t.completed &&
      t.recurrence === item.recurrence
  );
  if (orphan) {
    updatedChecklist = updatedChecklist.filter((t) => t.id !== orphan.id);
  }
}
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run src/test/useClients.test.ts
```
Expected: All tests pass including the new one.

**Step 5: Run full test suite**

```bash
npx vitest run
```
Expected: 52 passed (51 original + 1 new).

**Step 6: Commit**

```bash
git add src/hooks/useClients.ts src/test/useClients.test.ts
git commit -m "feat: remove orphan next-occurrence when un-completing recurring task"
```

---

## Verification

1. `npm run build` — 0 TS errors
2. `npx vitest run` — 52 tests pass
3. Manual smoke test:
   - Open a client, create Task A and Task B
   - In Task B's dependency picker (link icon), select Task A
   - Try to check Task B → toast appears: `Blocked by: "Task A"`
   - Check Task A → succeeds
   - Now check Task B → succeeds
   - Create Task C with weekly recurrence and a due date
   - Complete Task C → new "Task C" occurrence appears in the list
   - Un-check Task C → the new occurrence disappears

---

## Notes

- The `showToast` call uses `'info'` type (matches the warning-orange icon). You could use `'error'`
  if you want stronger visual. Adjust to taste.
- The orphan-matching heuristic (same title + same recurrence + not completed + different id) is
  intentional. There's no explicit "parent task id" link on occurrences. This matches how
  `useClients.ts` creates them (lines 344-355).
- If a user manually creates a task with the same title and recurrence, it could be incorrectly
  removed. This is an acceptable edge case for now.
