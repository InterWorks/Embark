# Saved Views + Smart Filters Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let users save filter combinations as named views, load them from chips below the filter bar, pin up to 5 to the Sidebar, and mark one as the default that auto-applies on mount.

**Architecture:** Extend existing `useSavedViews` hook + `SavedViewsManager` component (both already exist) with pin/default/emoji, then wire chips into ClientList and a "My Views" section into Sidebar.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, localStorage via `useLocalStorage`

---

## Task 1: Extend the `SavedView` type and `useSavedViews` hook

**Files:**
- Modify: `src/hooks/useSavedViews.ts`

**Step 1: Read the current file**

The current file at `src/hooks/useSavedViews.ts` defines `SavedView` without `isPinned`, `isDefault`, or `emoji`, and the hook lacks `pinView` and `setDefaultView` methods.

**Step 2: Replace the file content**

```typescript
import { useCallback } from 'react';
import type { ClientView } from '../types';
import { useLocalStorage } from './useLocalStorage';
import { generateId } from '../utils/helpers';

export interface SavedView {
  id: string;
  name: string;
  emoji?: string;
  filters: {
    statusFilter: string;
    assigneeFilter: string;
    searchQuery: string;
  };
  view: ClientView;
  isPinned: boolean;
  isDefault: boolean;
  createdAt: string;
}

export function useSavedViews() {
  const [savedViews, setSavedViews] = useLocalStorage<SavedView[]>('embark-saved-views', []);

  const saveView = useCallback(
    (name: string, filters: SavedView['filters'], view: ClientView, emoji?: string): SavedView => {
      const newView: SavedView = {
        id: generateId(),
        name,
        emoji,
        filters,
        view,
        isPinned: false,
        isDefault: false,
        createdAt: new Date().toISOString(),
      };
      setSavedViews((prev) => [...prev, newView]);
      return newView;
    },
    [setSavedViews]
  );

  const deleteView = useCallback(
    (id: string) => {
      setSavedViews((prev) => prev.filter((v) => v.id !== id));
    },
    [setSavedViews]
  );

  const updateView = useCallback(
    (id: string, updates: Partial<Omit<SavedView, 'id' | 'createdAt'>>) => {
      setSavedViews((prev) =>
        prev.map((v) => (v.id === id ? { ...v, ...updates } : v))
      );
    },
    [setSavedViews]
  );

  const pinView = useCallback(
    (id: string) => {
      setSavedViews((prev) => {
        const target = prev.find((v) => v.id === id);
        if (!target) return prev;
        // Allow max 5 pinned
        const pinnedCount = prev.filter((v) => v.isPinned && v.id !== id).length;
        if (!target.isPinned && pinnedCount >= 5) return prev;
        return prev.map((v) =>
          v.id === id ? { ...v, isPinned: !v.isPinned } : v
        );
      });
    },
    [setSavedViews]
  );

  const setDefaultView = useCallback(
    (id: string) => {
      setSavedViews((prev) =>
        prev.map((v) => ({
          ...v,
          isDefault: v.id === id ? !v.isDefault : false,
        }))
      );
    },
    [setSavedViews]
  );

  const pinnedViews = savedViews.filter((v) => v.isPinned).slice(0, 5);
  const defaultView = savedViews.find((v) => v.isDefault) ?? null;

  return {
    savedViews,
    pinnedViews,
    defaultView,
    saveView,
    deleteView,
    updateView,
    pinView,
    setDefaultView,
  };
}
```

**Step 3: Run build**

```bash
cd client-onboarding-tracker && npm run build
```
Expected: 0 TS errors (TypeScript will verify all callers still compile).

---

## Task 2: Expand `SavedViewsManager.tsx`

**Files:**
- Modify: `src/components/UI/SavedViewsManager.tsx`

**Step 1: Replace with the full implementation**

The current `SavedViewsManager` accepts `onSaveView`, `onLoadView`, `onDeleteView` but has no pin/default/emoji. Replace the entire file:

```typescript
import { useState } from 'react';
import type { SavedView } from '../../hooks/useSavedViews';
import { Button } from './Button';

const EMOJI_OPTIONS = ['📋', '⭐', '🔥', '✅', '📌', '🎯', '💼', '🚀'];

interface SavedViewsManagerProps {
  savedViews: SavedView[];
  pinnedViews: SavedView[];
  currentFilters: {
    statusFilter: string;
    assigneeFilter: string;
    searchQuery: string;
  };
  onSaveView: (name: string, emoji?: string) => void;
  onLoadView: (view: SavedView) => void;
  onDeleteView: (id: string) => void;
  onPinView: (id: string) => void;
  onSetDefault: (id: string) => void;
}

export function SavedViewsManager({
  savedViews,
  pinnedViews,
  currentFilters,
  onSaveView,
  onLoadView,
  onDeleteView,
  onPinView,
  onSetDefault,
}: SavedViewsManagerProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState<string | undefined>(undefined);

  const hasActiveFilters =
    currentFilters.statusFilter !== 'all' ||
    currentFilters.assigneeFilter !== 'all' ||
    currentFilters.searchQuery !== '';

  const handleSave = () => {
    if (!newViewName.trim()) return;
    onSaveView(newViewName.trim(), selectedEmoji);
    setNewViewName('');
    setSelectedEmoji(undefined);
    setShowSaveDialog(false);
    setShowDropdown(false);
  };

  const close = () => {
    setShowDropdown(false);
    setShowSaveDialog(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold bg-white dark:bg-zinc-800 border-2 border-zinc-300 dark:border-zinc-600 rounded-[4px] hover:border-zinc-900 dark:hover:border-white transition-colors text-zinc-700 dark:text-zinc-300"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        Views
        {savedViews.length > 0 && (
          <span className="bg-yellow-400 text-zinc-900 text-xs font-black px-1.5 py-0.5 rounded-[2px]">
            {savedViews.length}
          </span>
        )}
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showDropdown && (
        <>
          <div className="fixed inset-0 z-10" onClick={close} />
          <div className="absolute right-0 mt-1 w-72 bg-white dark:bg-zinc-800 border-2 border-zinc-900 dark:border-zinc-600 shadow-[4px_4px_0_0_#18181b] dark:shadow-[4px_4px_0_0_#52525b] rounded-[4px] z-20">
            {/* Save section */}
            {showSaveDialog ? (
              <div className="p-3 border-b-2 border-zinc-200 dark:border-zinc-700 space-y-2">
                <input
                  type="text"
                  value={newViewName}
                  onChange={(e) => setNewViewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  placeholder="View name..."
                  className="w-full px-2 py-1.5 text-sm border-2 border-zinc-300 dark:border-zinc-600 rounded-[4px] bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-yellow-400"
                  autoFocus
                />
                {/* Emoji picker */}
                <div className="flex gap-1 flex-wrap">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setSelectedEmoji(selectedEmoji === emoji ? undefined : emoji)}
                      className={`w-8 h-8 text-base rounded-[4px] border-2 transition-colors ${
                        selectedEmoji === emoji
                          ? 'border-yellow-400 bg-yellow-50 dark:bg-zinc-700'
                          : 'border-zinc-200 dark:border-zinc-600 hover:border-zinc-400'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave} disabled={!newViewName.trim()}>
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setShowSaveDialog(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-2 border-b-2 border-zinc-200 dark:border-zinc-700">
                <button
                  onClick={() => setShowSaveDialog(true)}
                  disabled={!hasActiveFilters}
                  className="w-full px-3 py-2 text-left text-sm font-bold hover:bg-yellow-50 dark:hover:bg-zinc-700 rounded-[4px] flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="text-zinc-700 dark:text-zinc-300">
                    {hasActiveFilters ? '+ Save current view' : 'Set filters to save a view'}
                  </span>
                </button>
              </div>
            )}

            {/* Pinned count indicator */}
            {pinnedViews.length > 0 && (
              <div className="px-3 py-1.5 text-xs text-zinc-500 border-b border-zinc-100 dark:border-zinc-700">
                {pinnedViews.length}/5 pinned to sidebar
              </div>
            )}

            {/* Views list */}
            <div className="max-h-72 overflow-y-auto">
              {savedViews.length === 0 ? (
                <div className="p-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
                  No saved views yet
                </div>
              ) : (
                <div className="py-1">
                  {savedViews.map((view) => (
                    <div
                      key={view.id}
                      className="flex items-center px-2 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-700 group"
                    >
                      <button
                        onClick={() => { onLoadView(view); close(); }}
                        className="flex-1 flex items-center gap-2 text-left min-w-0"
                      >
                        {view.emoji && <span className="text-sm">{view.emoji}</span>}
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate flex items-center gap-1">
                            {view.name}
                            {view.isDefault && (
                              <span className="text-yellow-500 text-xs">★</span>
                            )}
                          </p>
                          <p className="text-xs text-zinc-500 truncate">
                            {[
                              view.filters.statusFilter !== 'all' && `Status: ${view.filters.statusFilter}`,
                              view.filters.assigneeFilter !== 'all' && `Assignee: ${view.filters.assigneeFilter}`,
                              view.filters.searchQuery && `"${view.filters.searchQuery}"`,
                            ]
                              .filter(Boolean)
                              .join(' · ') || 'All clients'}
                          </p>
                        </div>
                      </button>
                      {/* Pin button */}
                      <button
                        onClick={() => onPinView(view.id)}
                        title={view.isPinned ? 'Unpin from sidebar' : 'Pin to sidebar'}
                        className={`p-1 rounded transition-colors ${
                          view.isPinned
                            ? 'text-yellow-500'
                            : 'text-zinc-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 hover:text-zinc-500'
                        }`}
                      >
                        📌
                      </button>
                      {/* Default star */}
                      <button
                        onClick={() => onSetDefault(view.id)}
                        title={view.isDefault ? 'Remove default' : 'Set as default'}
                        className={`p-1 rounded transition-colors ${
                          view.isDefault
                            ? 'text-yellow-500'
                            : 'text-zinc-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 hover:text-zinc-500'
                        }`}
                      >
                        ★
                      </button>
                      {/* Delete */}
                      <button
                        onClick={() => onDeleteView(view.id)}
                        className="p-1 text-zinc-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-colors rounded"
                        title="Delete view"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
```

**Step 2: Run build**

```bash
npm run build
```
Expected: TypeScript will now error on the `ClientList` call site because `onPinView`/`onSetDefault` props are missing — we'll fix that in Task 3.

---

## Task 3: Wire `SavedViewsManager` in `ClientList.tsx`

**Files:**
- Modify: `src/components/Clients/ClientList.tsx`

**Step 1: Update the `useSavedViews` destructure**

Find the current destructure (around line 47):
```typescript
const { savedViews, saveView, deleteView } = useSavedViews();
```

Replace with:
```typescript
const { savedViews, pinnedViews, defaultView, saveView, deleteView, pinView, setDefaultView } = useSavedViews();
```

**Step 2: Apply default view on mount**

After the `useSavedViews` line, add a `useEffect` to auto-apply the default view on first render:

```typescript
// Apply default view on first mount only
useEffect(() => {
  if (defaultView) {
    setSearchQuery(defaultView.filters.searchQuery);
    setStatusFilter(defaultView.filters.statusFilter);
    setAssigneeFilter(defaultView.filters.assigneeFilter);
    setCurrentView(defaultView.view);
  }
}, []); // eslint-disable-line react-hooks/exhaustive-deps
```

**Step 3: Update the `SavedViewsManager` call site**

Find the existing `<SavedViewsManager` render in the JSX and update the props:

```typescript
<SavedViewsManager
  savedViews={savedViews}
  pinnedViews={pinnedViews}
  currentFilters={{ statusFilter, assigneeFilter, searchQuery }}
  onSaveView={(name, emoji) =>
    saveView(name, { statusFilter, assigneeFilter, searchQuery }, currentView, emoji)
  }
  onLoadView={(view) => {
    setSearchQuery(view.filters.searchQuery);
    setStatusFilter(view.filters.statusFilter);
    setAssigneeFilter(view.filters.assigneeFilter);
    setCurrentView(view.view);
  }}
  onDeleteView={deleteView}
  onPinView={pinView}
  onSetDefault={setDefaultView}
/>
```

**Step 4: Add saved-view chips row below the filter bar**

Find the filter bar section. After the filter row (after `<SavedViewsManager` and surrounding controls), add a chips row:

```typescript
{/* Saved view chips */}
{savedViews.length > 0 && (
  <div className="flex flex-wrap gap-2 mt-2">
    {savedViews.map((view) => (
      <button
        key={view.id}
        onClick={() => {
          setSearchQuery(view.filters.searchQuery);
          setStatusFilter(view.filters.statusFilter);
          setAssigneeFilter(view.filters.assigneeFilter);
          setCurrentView(view.view);
        }}
        className="flex items-center gap-1 px-3 py-1 text-xs font-bold border-2 border-zinc-300 dark:border-zinc-600 rounded-[4px] hover:border-yellow-400 hover:bg-yellow-50 dark:hover:bg-zinc-700 transition-colors text-zinc-700 dark:text-zinc-300"
      >
        {view.emoji && <span>{view.emoji}</span>}
        {view.name}
        {view.isDefault && <span className="text-yellow-500">★</span>}
      </button>
    ))}
  </div>
)}
```

**Step 5: Run build**

```bash
npm run build
```
Expected: 0 TS errors.

---

## Task 4: Add "My Views" section to Sidebar

**Files:**
- Modify: `src/components/Layout/Sidebar.tsx`

**Step 1: Import `useSavedViews` in Sidebar**

In `src/components/Layout/Sidebar.tsx`, add the import:

```typescript
import { useSavedViews } from '../../hooks/useSavedViews';
```

**Step 2: Destructure `pinnedViews` and `setDefaultView` in the component**

Inside the `Sidebar` component function body, add:

```typescript
const { pinnedViews, savedViews, setDefaultView } = useSavedViews();
```

Also accept `onViewChange` from props (it's already there as part of `SidebarProps`).

**Step 3: Add "My Views" section in the sidebar JSX**

Find the bottom of the sidebar nav items list. Add a "My Views" section just below the main nav items and above the client list section:

```typescript
{/* My Views — pinned saved views */}
{pinnedViews.length > 0 && (
  <div className="px-3 mt-4">
    <p className="text-xs font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1 px-1">
      My Views
    </p>
    <div className="space-y-0.5">
      {pinnedViews.map((view) => (
        <button
          key={view.id}
          onClick={() => onViewChange('clients')}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-[4px] text-left text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:bg-yellow-50 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          {view.emoji ? (
            <span className="w-5 h-5 flex items-center justify-center text-base">{view.emoji}</span>
          ) : (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          )}
          <span className="truncate">{view.name}</span>
          {view.isDefault && <span className="text-yellow-500 ml-auto shrink-0">★</span>}
        </button>
      ))}
    </div>
  </div>
)}
```

**Step 4: Run build and tests**

```bash
npm run build && npx vitest run
```
Expected: 0 TS errors, 51 tests pass.

---

## Verification

1. `npm run build` — 0 TS errors
2. `npx vitest run` — 51 tests pass
3. Manual smoke test:
   - Set status filter to "Active", search for something → click "Views" → "Save current view" → name it "Active Search" → Save
   - Chip appears below filters labeled "Active Search"
   - Clear all filters → click chip → filters restore instantly
   - Open Views manager → pin the view (📌 icon turns yellow) → "1/5 pinned to sidebar" appears
   - Sidebar now shows "My Views" section with the pinned view
   - Click "★" star on view → view gets default star; reload page → filters auto-apply
   - Click ★ again → removes default
   - Delete view → chip and sidebar entry disappear
