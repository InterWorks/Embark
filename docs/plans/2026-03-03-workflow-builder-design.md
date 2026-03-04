# Visual Workflow Builder — Design Doc

**Date:** 2026-03-03
**Project:** Embark — Client Onboarding Tracker
**Status:** Approved

---

## Problem / Motivation

The existing automation system (`AutomationRule`) supports only a single trigger → AND conditions → single action pattern. This is too limiting for real onboarding workflows, which need multi-step sequences, branching logic (condition checks mid-flow), and optional delays between steps. The UI is also a plain form modal with no visual representation of the flow.

## Goal

Replace `AutomationRule` with a `AutomationWorkflow` type that supports unlimited ordered steps (actions, condition filters, delays), and build a Intercom/Zapier-style linear step builder UI. Existing rules auto-migrate transparently.

---

## Section 1 — Data Model

### New types (`src/types/index.ts`)

```typescript
interface WorkflowActionStep {
  id: string;
  type: 'action';
  action: AutomationAction;
}

interface WorkflowConditionStep {
  id: string;
  type: 'condition';
  conditions: AutomationCondition[]; // AND logic
  onFail: 'stop' | 'continue';
}

interface WorkflowDelayStep {
  id: string;
  type: 'delay';
  value: number;
  unit: 'hours' | 'days';
}

type WorkflowStep = WorkflowActionStep | WorkflowConditionStep | WorkflowDelayStep;

interface AutomationWorkflow {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  trigger: AutomationTrigger;
  triggerConditions: AutomationCondition[]; // pre-conditions (AND)
  steps: WorkflowStep[];
  createdAt: string;
  updatedAt: string;
}

interface PendingWorkflowExecution {
  id: string;
  workflowId: string;
  clientId: string;
  resumeAtStep: number;
  scheduledAt: string; // ISO — resume if now >= scheduledAt
}

interface WorkflowExecutionLog {
  id: string;
  workflowId: string;
  workflowName: string;
  clientId: string;
  clientName?: string;
  trigger: AutomationTrigger;
  stepsExecuted: number;
  totalSteps: number;
  status: 'completed' | 'stopped_by_condition' | 'pending_delay' | 'failed';
  startedAt: string;
  completedAt?: string;
}
```

### Triggers (8 total)

Existing: `client_created`, `status_changed`, `task_completed`, `all_tasks_completed`, `priority_changed`, `tag_added`
New: `milestone_completed`, `health_status_changed`

### Actions (9 total)

Existing: `change_status`, `change_priority`, `add_tag`, `add_task`, `apply_template`, `send_notification`
New: `remove_tag`, `add_note`, `log_communication`

### Migration

On first `useWorkflows` mount, reads `'onboarding-automations'` (legacy) and converts each `AutomationRule` to an `AutomationWorkflow` with:
- trigger preserved
- `triggerConditions` = old rule's `conditions`
- one `WorkflowActionStep` wrapping the old action

Sets `localStorage.setItem('embark-workflows-migrated', 'true')` to run only once.

---

## Section 2 — UI / Component Architecture

### Layout

Two-panel view inside the existing Automations tab:

**Left** — Workflow list (`WorkflowCard` per workflow): name, trigger label, step count, enabled toggle, edit/delete. "New Workflow" button at top.

**Right / Full-screen modal** — `WorkflowBuilder` opens on create or edit:

```
┌─────────────────────────────────────────────────────┐
│  Workflow Name  [text input]                        │
│  Description    [optional text input]               │
├─────────────────────────────────────────────────────┤
│  TRIGGER                                            │
│  ┌─────────────────────────────────────────────┐   │
│  │  [trigger dropdown]  + conditions (AND)     │   │
│  └─────────────────────────────────────────────┘   │
│                       ↓                             │
│  STEP 1                                             │
│  ┌─────────────────────────────────────────────┐   │
│  │  ⚡ Action: Change Status → Active          │   │
│  └─────────────────────────────────────────────┘   │
│                       ↓                             │
│  [+ Add Step]  (action / condition / delay)         │
├─────────────────────────────────────────────────────┤
│  [Cancel]                          [Save Workflow]  │
└─────────────────────────────────────────────────────┘
```

### New files

| File | Purpose |
|------|---------|
| `src/components/Automations/WorkflowBuilder.tsx` | Full builder modal (trigger config + step list) |
| `src/components/Automations/WorkflowCard.tsx` | Single workflow card in the list |
| `src/components/Automations/WorkflowStepBlock.tsx` | Renders one step with inline config, reorder, delete |
| `src/hooks/useWorkflows.ts` | CRUD + migration + pending-executions queue |

### Modified files

| File | Change |
|------|--------|
| `src/types/index.ts` | Add new types above |
| `src/components/Automations/AutomationManager.tsx` | Replace with list + builder wiring |
| `src/context/ClientContext.tsx` | Update execution engine for multi-step workflows |

### WorkflowStepBlock features

- Step type icon: ⚡ action, 🔀 condition, ⏱ delay
- Inline config fields (no nested modals)
- Up/Down reorder arrows
- Delete (✕) button
- Condition steps: `onFail` toggle ("Stop workflow" / "Continue anyway")

---

## Section 3 — Execution Engine & Storage

### Storage keys

- `'embark-workflows'` — `AutomationWorkflow[]`
- `'embark-pending-executions'` — `PendingWorkflowExecution[]`
- `'embark-workflow-logs'` — `WorkflowExecutionLog[]`

### Execution algorithm (`ClientContext.tsx`)

```
executeWorkflow(trigger, client, context?) {
  1. Find enabled workflows matching trigger
  2. Check triggerConditions (AND) — skip workflow if fails
  3. Walk steps in order:
     - action step    → run action immediately
     - condition step → evaluate conditions (AND):
         onFail='stop'     → abort, log 'stopped_by_condition'
         onFail='continue' → skip step, continue
     - delay step     → write PendingWorkflowExecution, stop walking
  4. Log result (completed / stopped_by_condition / pending_delay)
}
```

On app mount, `ClientContext` calls `resolvePendingExecutions()`:
For each pending execution where `scheduledAt <= now`, resume from `resumeAtStep`.

---

## Verification

1. `npm run build` — 0 TS errors
2. `npx vitest run` — 51/51 tests pass
3. Visual checks:
   - Automations tab shows workflow list (not old rule forms)
   - "New Workflow" opens builder with trigger picker + empty step list
   - Can add action / condition / delay steps inline
   - Steps reorder with up/down arrows
   - Save creates card in list with step count
   - Toggle enables/disables workflow
   - Edit reopens builder with existing data
   - Old saved rules appear as migrated single-step workflows
   - Workflow fires correctly when trigger event occurs on a client
   - Condition step with `onFail=stop` halts execution and logs correctly
   - Delay step creates a pending execution, resuming on next page load
