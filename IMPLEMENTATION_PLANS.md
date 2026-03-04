# Embark Implementation Plans

## Overview

This document outlines implementation plans for four major features:
1. Team Collaboration (Foundation)
2. Notifications Center
3. Automations Engine
4. Ollama Local AI Integration

**Recommended Build Order:** Team Collaboration → Notifications → Automations → Ollama

---

## Plan 1: Team Collaboration

### Overview
Add multi-user support with team members, roles, task assignments, and workload management.

### Phase 1: Team Member Management

#### New Types (`src/types/index.ts`)
```typescript
export type TeamRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: TeamRole;
  color: string; // For visual identification
  createdAt: string;
  lastActiveAt?: string;
}

export interface TeamSettings {
  teamName: string;
  members: TeamMember[];
  invites: TeamInvite[];
}

export interface TeamInvite {
  id: string;
  email: string;
  role: TeamRole;
  invitedBy: string;
  invitedAt: string;
  expiresAt: string;
}
```

#### New Files to Create
- `src/hooks/useTeam.ts` - Team CRUD operations, localStorage persistence
- `src/components/Team/TeamManager.tsx` - Add/edit/remove team members
- `src/components/Team/TeamMemberSelector.tsx` - Dropdown to select assignee
- `src/components/Team/TeamMemberAvatar.tsx` - Consistent avatar display
- `src/components/Team/TeamSettings.tsx` - Team configuration page

#### Files to Modify
- `src/types/index.ts` - Add team types
- `src/components/Layout/Sidebar.tsx` - Add Team nav item
- `src/App.tsx` - Add Team view
- Update "Assigned To" fields throughout to use TeamMemberSelector

### Phase 2: Task Assignment

#### Modifications
- `src/types/index.ts` - Update ChecklistItem to use `assignedTo: string` (team member ID)
- `src/components/Checklist/ChecklistItem.tsx` - Show assignee avatar
- `src/components/Checklist/SortableChecklistItem.tsx` - Add assignee selector
- `src/components/Views/TasksView.tsx` - Filter by assignee, "My Tasks" view

### Phase 3: Workload View

#### New Files
- `src/components/Team/WorkloadView.tsx` - See each member's assigned tasks
- `src/components/Team/TeamDashboard.tsx` - Team activity overview

#### Features
- Tasks per team member visualization
- Capacity indicators (overloaded/available)
- Quick reassignment via drag-and-drop

### Phase 4: Activity Attribution

#### Modifications
- `src/types/index.ts` - Add `performedBy: string` to ActivityLogEntry
- Update all activity logging to include current user
- Show team member in activity feeds

### localStorage Keys
- `embark-team` - TeamSettings object
- `embark-current-user` - Current user's team member ID

---

## Plan 2: Notifications Center

### Overview
In-app notification system with bell icon, notification list, and configurable preferences.

### Phase 1: Core Notification System

#### New Types (`src/types/index.ts`)
```typescript
export type NotificationType =
  | 'task_due_soon'      // Task due within threshold
  | 'task_overdue'       // Task past due date
  | 'task_assigned'      // Task assigned to you
  | 'task_completed'     // Task you assigned was completed
  | 'milestone_reached'  // Client reached milestone
  | 'client_completed'   // Client onboarding complete
  | 'mention'            // @mentioned in notes
  | 'automation'         // Automation triggered
  | 'system';            // System announcements

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  expiresAt?: string;

  // Context for navigation
  clientId?: string;
  taskId?: string;

  // Who triggered it (for team features)
  triggeredBy?: string;
}

export interface NotificationPreferences {
  enabled: boolean;

  // Which types to show
  taskDueSoon: boolean;
  taskDueSoonDays: number; // How many days before
  taskOverdue: boolean;
  taskAssigned: boolean;
  taskCompleted: boolean;
  milestoneReached: boolean;
  clientCompleted: boolean;
  mentions: boolean;
  automations: boolean;

  // Delivery
  playSound: boolean;
  showBadge: boolean;

  // Email digest (future)
  emailDigest: 'none' | 'daily' | 'weekly';
}
```

#### New Files to Create
- `src/hooks/useNotifications.ts` - Notification CRUD, mark read, clear
- `src/context/NotificationContext.tsx` - Global notification state
- `src/components/Notifications/NotificationCenter.tsx` - Bell icon + dropdown
- `src/components/Notifications/NotificationList.tsx` - List of notifications
- `src/components/Notifications/NotificationItem.tsx` - Single notification
- `src/components/Notifications/NotificationPreferences.tsx` - Settings

### Phase 2: Notification Triggers

#### New Files
- `src/hooks/useNotificationTriggers.ts` - Logic to generate notifications

#### Trigger Points (modify existing code)
- Task due date approaching → check daily/on load
- Task overdue → check daily/on load
- Task completed → in `toggleChecklistItem`
- Milestone completed → in `completeMilestone`
- Client status change → in `updateClient`

### Phase 3: UI Integration

#### Files to Modify
- `src/components/Layout/Header.tsx` - Add notification bell
- `src/App.tsx` - Wrap with NotificationProvider
- `src/components/Clients/ClientDetail.tsx` - Link notifications to context

### Phase 4: @Mentions

#### Modifications
- `src/components/Clients/NotesSection.tsx` - Parse @mentions
- `src/components/Communication/CommunicationForm.tsx` - Parse @mentions
- Create notifications when @mentioned

### localStorage Keys
- `embark-notifications` - Notification[]
- `embark-notification-preferences` - NotificationPreferences

---

## Plan 3: Automations Engine

### Overview
Visual rule builder for automated workflows triggered by events.

### Phase 1: Automation Types

#### New Types (`src/types/index.ts`)
```typescript
export type AutomationTrigger =
  | 'task_completed'
  | 'task_overdue'
  | 'task_due_soon'
  | 'milestone_completed'
  | 'client_status_changed'
  | 'client_created'
  | 'client_progress_reached'
  | 'schedule'; // Time-based

export type AutomationAction =
  | 'send_notification'
  | 'send_email'
  | 'create_task'
  | 'assign_task'
  | 'update_client_status'
  | 'add_note'
  | 'complete_task'
  | 'move_task_group';

export interface AutomationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: string | number | boolean;
}

export interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;

  // When
  trigger: AutomationTrigger;
  triggerConfig?: Record<string, unknown>;

  // If (optional conditions)
  conditions: AutomationCondition[];
  conditionLogic: 'and' | 'or';

  // Then
  actions: {
    type: AutomationAction;
    config: Record<string, unknown>;
  }[];

  // Metadata
  createdAt: string;
  lastTriggeredAt?: string;
  triggerCount: number;
}
```

### Phase 2: Core Engine

#### New Files to Create
- `src/hooks/useAutomations.ts` - Automation CRUD
- `src/engine/AutomationEngine.ts` - Core execution logic
- `src/engine/triggers/` - Trigger handlers
- `src/engine/actions/` - Action executors
- `src/context/AutomationContext.tsx` - Global automation state

#### Engine Architecture
```
Event occurs → Check matching automations → Evaluate conditions → Execute actions
```

### Phase 3: Automation Builder UI

#### New Files
- `src/components/Automations/AutomationList.tsx` - List all automations
- `src/components/Automations/AutomationBuilder.tsx` - Visual builder
- `src/components/Automations/TriggerSelector.tsx` - Choose trigger
- `src/components/Automations/ConditionBuilder.tsx` - Add conditions
- `src/components/Automations/ActionBuilder.tsx` - Configure actions
- `src/components/Automations/AutomationCard.tsx` - Display automation

### Phase 4: Integration

#### Files to Modify
- `src/hooks/useClients.ts` - Fire events for automation engine
- `src/context/ClientContext.tsx` - Integrate automation checks
- `src/components/Layout/Sidebar.tsx` - Add Automations nav
- `src/App.tsx` - Add Automations view

### Phase 5: Pre-built Templates

#### Automation Templates to Include
1. "Send reminder 3 days before task due"
2. "Notify manager when client reaches 100%"
3. "Create follow-up task when milestone completed"
4. "Move task to 'Done' group when completed"
5. "Send welcome email when client created"

### localStorage Keys
- `embark-automations` - AutomationRule[]
- `embark-automation-logs` - Execution history

---

## Plan 4: Ollama Local AI Integration

### Overview
Add Ollama as an alternative AI provider for complete data privacy.

### Phase 1: Provider Architecture

#### New Types (`src/types/index.ts`)
```typescript
export type AIProvider = 'anthropic' | 'ollama';

export interface AISettings {
  provider: AIProvider;

  // Anthropic settings
  anthropicApiKey?: string;
  anthropicModel: string;

  // Ollama settings
  ollamaEndpoint: string; // Default: http://localhost:11434
  ollamaModel: string;    // e.g., 'llama3', 'mistral', 'phi3'

  // General
  enableTools: boolean;
  maxTokens: number;
}

export interface OllamaModel {
  name: string;
  size: string;
  quantization: string;
  modified_at: string;
}
```

### Phase 2: Ollama Hook

#### New Files to Create
- `src/hooks/useOllamaChat.ts` - Ollama API integration
- `src/hooks/useAIProvider.ts` - Unified AI interface
- `src/utils/ollamaApi.ts` - Ollama API utilities

#### `useOllamaChat.ts` Structure
```typescript
// Ollama API format (OpenAI-compatible)
interface OllamaRequest {
  model: string;
  messages: { role: string; content: string }[];
  stream?: boolean;
  options?: {
    temperature?: number;
    num_predict?: number;
  };
}

// Functions:
// - checkConnection() - Verify Ollama is running
// - listModels() - Get available models
// - sendMessage() - Send chat message
// - streamMessage() - Stream response (optional)
```

### Phase 3: Unified AI Interface

#### `useAIProvider.ts`
```typescript
// Unified interface that works with both providers
export function useAIProvider() {
  const settings = useAISettings();
  const anthropic = useAnthropicChat(settings.anthropicApiKey);
  const ollama = useOllamaChat(settings.ollamaEndpoint);

  const sendMessage = async (message: string, options: ChatOptions) => {
    if (settings.provider === 'ollama') {
      return ollama.sendMessage(message, options);
    }
    return anthropic.sendMessage(message, options);
  };

  return { sendMessage, isLoading, error };
}
```

### Phase 4: Settings UI

#### Files to Modify
- `src/components/Settings/SettingsModal.tsx` - Add AI provider section

#### New Settings Section
- Provider toggle (Anthropic / Ollama)
- Ollama endpoint URL input
- Model selector dropdown (fetches from Ollama)
- Connection test button
- "Data Privacy" indicator showing where data goes

### Phase 5: Tool Support for Ollama

#### Considerations
- Ollama supports function calling with some models (Llama 3, Mistral)
- May need to adapt tool format for Ollama's API
- Fallback: Disable tools for models that don't support them

#### Files to Modify
- `src/hooks/useAIActions.ts` - Adapt for Ollama tool format
- `src/components/AI/AICenter.tsx` - Use unified provider

### Phase 6: Model Recommendations

#### Suggested Models for Embark
| Model | Size | Best For |
|-------|------|----------|
| Llama 3 8B | ~4.7GB | General use, good tool support |
| Mistral 7B | ~4.1GB | Fast, efficient |
| Phi-3 Mini | ~2.3GB | Lightweight, quick responses |
| Llama 3 70B | ~40GB | Most capable (needs good hardware) |

### localStorage Keys
- `embark-ai-settings` - AISettings object

---

## Implementation Order Summary

### Recommended Sequence

```
Week 1-2: Team Collaboration
├── Team member management
├── Task assignment
├── Update "Assigned To" throughout app
└── Basic workload view

Week 3: Notifications Center
├── Core notification system
├── Notification triggers
├── Bell icon + dropdown
└── Preferences

Week 4-5: Automations Engine
├── Automation types & engine
├── Visual builder UI
├── Integration with app events
└── Pre-built templates

Week 6: Ollama Integration
├── Ollama hook
├── Unified AI provider
├── Settings UI
└── Testing with local models
```

### Dependencies
- Notifications depends on Team (need to know WHO to notify)
- Automations depends on Notifications (automations can trigger notifications)
- Ollama is independent (can be built anytime)

---

## Getting Started

To begin implementation, let me know which feature you'd like to start with:

1. **Team Collaboration** - Start building the foundation
2. **Notifications** - If you want to skip team features for now
3. **Automations** - Most complex, builds on others
4. **Ollama** - Independent, can be done anytime

I recommend starting with **Team Collaboration** as it's foundational, or **Ollama** if AI privacy is the immediate priority.
