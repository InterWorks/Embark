# Changelog

All notable changes to Embark are documented here.

---

## [8.2.0] — 2026-03-10

### Security Fixes
- **API key no longer stored in localStorage** — Anthropic API key now lives only in React state. Any previously stored key is migrated out on first load and removed from storage.
- **Stored XSS in portal HTML export fixed** — All user-controlled values (client names, task titles, phase names, milestone titles, team members) are now HTML-entity escaped before being written into the exported portal file.
- **iframe embed URL allowlist enforced** — Embedded media URLs are now validated against a strict allowlist (Loom, YouTube, Calendly, Typeform). `javascript:` and `data:` scheme URLs are rejected. The iframe sandbox no longer includes `allow-same-origin`, which previously negated sandboxing entirely.
- **CSV import length limits** — Imported string fields are now capped at 200 characters, preventing oversized localStorage payloads and reducing the XSS surface from crafted CSV files.

### Bug Fixes
- **Webhook backup/restore data loss fixed** — Storage key mismatch between `webhooks.ts` (underscores) and `export.ts` (hyphens) caused all webhook endpoints to be silently lost on every backup restore. Both now use `embark-webhook-endpoints`.
- **localStorage key deletion now syncs across tabs** — The `storage` event handler was ignoring `e.newValue === null` (key deletion), so cross-tab state never updated when a key was removed.
- **`first_response` SLA no longer dismissed by internal task completions** — Previously, completing any checklist task (including internal-only tasks) would dismiss the first-response SLA. It now correctly checks whether any communication log entry exists.
- **Client filter: no-contact clients no longer match "last contacted within N days"** — Clients with no communication history were incorrectly included in contact-recency filters.
- **New clients no longer start with a perfect health score** — `communicationRecency` now initializes to 0 instead of 20, so brand-new clients with no communication log no longer score 100/100.
- **Go-live date math off-by-one fixed** — `YYYY-MM-DD` date strings are now normalized to local midnight before date arithmetic, fixing a one-day error in go-live forecasts, SLA calculations, and client filters for users outside UTC.
- **`useTeam` migration race condition fixed** — The localStorage migration from the old `embark-team` key now runs once at module load, not once per consumer mount.
- **Timer interval cleanup race condition fixed** — Restarting a running timer no longer immediately clears the new interval.
- **`awardXP` result now reliable** — XP gain, level-up status, and new deeds are now computed before the state write, eliminating a Concurrent Mode race where the returned result could be stale.
- **`useTeam.deleteTeam` no longer calls state setter inside an updater** — Fixes double-write to localStorage in React Strict Mode.
- **`useClients` and `useAutomations` storage keys renamed** — Keys migrated from `onboarding-clients`/`onboarding-automations` to `embark-clients`/`embark-automations` for consistency. Existing data is automatically migrated on first load.
- **`the_planner` deed can now be unlocked** — Was registered in the deed registry but never evaluated in `checkDeedConditions`.
- **Webhook validation** — `getEndpoints()` and `getDeliveries()` now guard against non-array localStorage data to prevent runtime crashes.
- **Backup restore structural validation** — Restored client objects now default missing required arrays (`checklist`, `activityLog`, `services`) to `[]` instead of crashing downstream.

### Performance Improvements
- **`ClientCard` expensive computations memoized** — `computeHealthScore`, `computeNextAction`, `computeChurnRisk`, and `computeGoLiveForecast` are now wrapped in `useMemo`, preventing redundant recalculation on every parent re-render.
- **Dashboard derived stats memoized** — `allTasks`, `stats`, `overdueTasks`, `upcomingTasks`, `recentClients`, and `completionRate` are now wrapped in `useMemo`.
- **`ClientList` event handlers stabilized** — `handleSelectClient` and related handlers are now wrapped in `useCallback`, enabling `React.memo` optimizations on child cards.
- **`GamificationOverlay` dismissal loop fixed** — `getPendingEvents()` is now memoized, preventing a chain of dismiss → re-render → dismiss.
- **`useNotifications` preference cascade fixed** — `addNotification` now reads preferences via a ref, preventing all 11 downstream notification helpers from re-memoizing on every preference change.

### Memory Leak Fixes
- **`requestAnimationFrame` loop in `useCountUp` now cancelled on unmount** — Navigating away from the Dashboard mid-animation no longer fires state updates on the unmounted component.
- **`setTimeout` in copy-URL handlers now cleaned up** — Navigating away from a client detail within 2 seconds of clicking a copy button no longer fires state updates on the unmounted component.

### Type Safety
- **`WebhookDelivery.payload` changed from `object` to `Record<string, unknown>`** — Payload fields can now be accessed without unsafe casts.
- **`AutomationRecipe` now uses typed union types** — `trigger` and `actions` fields now use `AutomationTrigger` and `AutomationActionType` instead of bare `string`.
- **`ActivityLogEntry.metadata` widened to `Record<string, unknown>`** — Consistent with `customFields` and prevents silent coercion of non-string values.
- **`buildCustomPayload` unsafe intersection cast removed** — Replaced with a safe spread pattern.
- **`isDark` in `ClientCard` now reads from `ThemeContext`** — Was previously reading directly from the DOM, causing stale values after theme toggles.

---

## [8.1.0] — 2026-03-03

- Email bulk import from CSV/EML files
- Contact email export from the Data tab
- Various design polish and neo-brutalism cohesion improvements

## [8.0.0] — 2026-03-02

- White-Label Portal Branding
- Embedded Media in Portal Tasks (Loom, YouTube, Calendly, Typeform)
- Approval / Sign-Off Tasks
- AI Status Reports
- AI Meeting Brief
- AI Onboarding Plan Generator
- Predictive Intelligence (Go-Live Forecast, Engagement Score, Churn Risk, NPS/CSAT)
- Smart Segments & Filter Builder
- Email Sequence Automation
- Team Capacity Planning
- Post-Onboarding Success Plan
