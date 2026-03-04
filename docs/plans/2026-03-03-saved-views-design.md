# Feature Design: Saved Views + Smart Filters

**Date:** 2026-03-03
**Status:** Ready for implementation
**Scope:** Full implementation of saved filter views — save, load, pin, set default

---

## Context

`ClientList.tsx` has rich filter state (status, assignee, search, sort, view type) but none of
it is saveable. `useSavedViews.ts` is a ~1KB stub and `SavedViewsManager.tsx` is minimal.
The data model and hook need a full implementation; the existing UI stubs need wiring.

---

## Data Model

```typescript
// Add to src/types/index.ts
interface SavedView {
  id: string;
  name: string;
  emoji?: string;
  filters: {
    statusFilter: string;       // 'all' | Client['status']
    assigneeFilter: string;     // 'all' | assignee name
    searchQuery: string;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
    view?: ClientView;          // 'cards' | 'table' | 'kanban' | etc
  };
  isPinned: boolean;
  isDefault: boolean;
  createdAt: string;
}
```

---

## useSavedViews Hook

Full implementation in `src/hooks/useSavedViews.ts`:

```typescript
export function useSavedViews() {
  const [views, setViews] = useLocalStorage<SavedView[]>('saved-views', []);

  const saveView = (name: string, filters: SavedView['filters'], view: ClientView) => {
    const newView: SavedView = {
      id: crypto.randomUUID(),
      name,
      filters: { ...filters, view },
      isPinned: false,
      isDefault: false,
      createdAt: new Date().toISOString(),
    };
    setViews((prev) => [...prev, newView]);
  };

  const deleteView = (id: string) => {
    setViews((prev) => prev.filter((v) => v.id !== id));
  };

  const pinView = (id: string) => {
    setViews((prev) =>
      prev.map((v) =>
        v.id === id
          ? { ...v, isPinned: !v.isPinned }
          : v
      )
    );
  };

  const setDefaultView = (id: string) => {
    setViews((prev) =>
      prev.map((v) => ({
        ...v,
        isDefault: v.id === id ? !v.isDefault : false,
      }))
    );
  };

  const pinnedViews = views.filter((v) => v.isPinned).slice(0, 5);
  const defaultView = views.find((v) => v.isDefault) ?? null;

  return { savedViews: views, pinnedViews, defaultView, saveView, deleteView, pinView, setDefaultView };
}
```

---

## SavedViewsManager UI

Expand `src/components/UI/SavedViewsManager.tsx` into a popover/modal with:
- Input to name the current view (with optional emoji picker — simple 8-emoji grid)
- "Save" button
- List of existing saved views with: name, load button, pin toggle, set-default star, delete
- Pin count badge (max 5 pinned)

---

## ClientList Integration

`src/components/Clients/ClientList.tsx`:
- Add "Save View" button next to filter row → opens `SavedViewsManager`
- Add saved-view chips row below filters: click a chip to apply that view instantly
- Apply default view on mount (in `useEffect` on first render only)

---

## Sidebar Integration

`src/components/Layout/Sidebar.tsx`:
- Add "My Views" section below client list
- Show up to 5 pinned views as nav items
- Click → applies filters and navigates to clients view

---

## Key Files

| File | Change |
|------|--------|
| `src/types/index.ts` | Add `SavedView` interface |
| `src/hooks/useSavedViews.ts` | Full CRUD implementation |
| `src/components/UI/SavedViewsManager.tsx` | Full management modal |
| `src/components/Clients/ClientList.tsx` | "Save View" button + chips + default on mount |
| `src/components/Layout/Sidebar.tsx` | "My Views" pinned section |

---

## Verification

1. `npm run build` — 0 TS errors
2. `npx vitest run` — all 51 tests pass
3. Manual:
   - Set status filter to "Active", search for "Acme", click "Save View" → name it "Active Acme"
   - Chip appears below filters labeled "Active Acme"
   - Clear filters, click chip → filters restore instantly
   - In SavedViewsManager, pin the view → appears in sidebar "My Views"
   - Mark view as default → on page reload, filters auto-apply
   - Delete view → chip and sidebar entry disappear
