import { useCallback, useMemo } from 'react';
import type { AutomationRule, AutomationAction, AutomationCondition, AutomationTrigger, Client, EmailSequenceStep } from '../types';
import { useLocalStorage } from './useLocalStorage';
import { useEmailQueue } from './useEmailQueue';
import { generateId } from '../utils/helpers';

export interface AutomationLog {
  id: string;
  automationId: string;
  automationName: string;
  trigger: AutomationTrigger;
  action: string;
  clientId?: string;
  clientName?: string;
  success: boolean;
  error?: string;
  executedAt: string;
}

// One-time migration from 'onboarding-automations' to 'embark-automations'
if (!localStorage.getItem('embark-automations') && localStorage.getItem('onboarding-automations')) {
  localStorage.setItem('embark-automations', localStorage.getItem('onboarding-automations')!);
  localStorage.removeItem('onboarding-automations');
}

export function useAutomations() {
  const [rules, setRules] = useLocalStorage<AutomationRule[]>('embark-automations', []);
  const [logs, setLogs] = useLocalStorage<AutomationLog[]>('embark-automation-logs', []);
  const { enqueue } = useEmailQueue();

  const addRule = useCallback((
    name: string,
    trigger: AutomationTrigger,
    conditions: AutomationCondition[],
    action: AutomationAction
  ): AutomationRule => {
    const newRule: AutomationRule = {
      id: generateId(),
      name,
      enabled: true,
      trigger,
      conditions,
      action,
      createdAt: new Date().toISOString(),
    };
    setRules((prev) => [...prev, newRule]);
    return newRule;
  }, [setRules]);

  const updateRule = useCallback((id: string, updates: Partial<Omit<AutomationRule, 'id' | 'createdAt'>>) => {
    setRules((prev) =>
      prev.map((rule) =>
        rule.id === id ? { ...rule, ...updates } : rule
      )
    );
  }, [setRules]);

  const deleteRule = useCallback((id: string) => {
    setRules((prev) => prev.filter((rule) => rule.id !== id));
  }, [setRules]);

  const toggleRule = useCallback((id: string) => {
    setRules((prev) =>
      prev.map((rule) =>
        rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
      )
    );
  }, [setRules]);

  // Check if conditions match for a given client
  const checkConditions = useCallback((conditions: AutomationCondition[], client: Client): boolean => {
    return conditions.every((condition) => {
      switch (condition.field) {
        case 'status':
          if (condition.operator === 'equals') return client.status === condition.value;
          if (condition.operator === 'not_equals') return client.status !== condition.value;
          return false;
        case 'priority':
          if (condition.operator === 'equals') return client.priority === condition.value;
          if (condition.operator === 'not_equals') return client.priority !== condition.value;
          return false;
        case 'has_tag':
          if (condition.operator === 'equals') return client.tags.includes(condition.value as string);
          if (condition.operator === 'not_equals') return !client.tags.includes(condition.value as string);
          return false;
        case 'task_count':
          const taskCount = client.checklist.length;
          if (condition.operator === 'equals') return taskCount === Number(condition.value);
          if (condition.operator === 'greater_than') return taskCount > Number(condition.value);
          if (condition.operator === 'less_than') return taskCount < Number(condition.value);
          return false;
        case 'completed_percentage':
          const completed = client.checklist.filter((t) => t.completed).length;
          const total = client.checklist.length;
          const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
          if (condition.operator === 'equals') return percentage === Number(condition.value);
          if (condition.operator === 'greater_than') return percentage > Number(condition.value);
          if (condition.operator === 'less_than') return percentage < Number(condition.value);
          return false;
        default:
          return false;
      }
    });
  }, []);

  // Get rules that match a specific trigger
  const getRulesForTrigger = useCallback((trigger: AutomationTrigger): AutomationRule[] => {
    return rules.filter((rule) => rule.enabled && rule.trigger === trigger);
  }, [rules]);

  // Log an automation execution
  const logExecution = useCallback((log: Omit<AutomationLog, 'id' | 'executedAt'>) => {
    const newLog: AutomationLog = {
      ...log,
      id: generateId(),
      executedAt: new Date().toISOString(),
    };
    setLogs(prev => [newLog, ...prev].slice(0, 100)); // Keep last 100 logs
    return newLog;
  }, [setLogs]);

  // Clear logs
  const clearLogs = useCallback(() => {
    setLogs([]);
  }, [setLogs]);

  // Duplicate a rule
  const duplicateRule = useCallback((id: string) => {
    const rule = rules.find(r => r.id === id);
    if (!rule) return null;

    const newRule: AutomationRule = {
      ...rule,
      id: generateId(),
      name: `${rule.name} (Copy)`,
      createdAt: new Date().toISOString(),
    };
    setRules(prev => [...prev, newRule]);
    return newRule;
  }, [rules, setRules]);

  // Evaluate a send_email_sequence action for a given client and automation rule
  const evaluateSendEmailSequence = useCallback((
    action: AutomationAction,
    clientId: string,
    sequenceId: string
  ): void => {
    if (action.type !== 'send_email_sequence') return;
    try {
      const steps: EmailSequenceStep[] = JSON.parse(action.value);
      const now = Date.now();
      for (const step of steps) {
        const scheduledFor = new Date(now + step.delayDays * 86400000).toISOString();
        enqueue({
          clientId,
          templateId: step.templateId,
          scheduledFor,
          status: 'pending',
          sequenceId,
        });
      }
    } catch {
      // Invalid JSON in action.value — skip silently
    }
  }, [enqueue]);

  // Get enabled count
  const enabledCount = useMemo(() => {
    return rules.filter(r => r.enabled).length;
  }, [rules]);

  return {
    rules,
    logs,
    enabledCount,
    addRule,
    updateRule,
    deleteRule,
    toggleRule,
    duplicateRule,
    checkConditions,
    getRulesForTrigger,
    logExecution,
    clearLogs,
    evaluateSendEmailSequence,
  };
}

// Trigger labels and descriptions
export const triggerConfig: Record<AutomationTrigger, { label: string; description: string; icon: string }> = {
  client_created: {
    label: 'Client Created',
    description: 'When a new client is added',
    icon: '👤',
  },
  status_changed: {
    label: 'Status Changed',
    description: 'When a client status changes',
    icon: '🔄',
  },
  task_completed: {
    label: 'Task Completed',
    description: 'When a task is marked complete',
    icon: '✅',
  },
  all_tasks_completed: {
    label: 'All Tasks Completed',
    description: 'When all tasks for a client are done',
    icon: '🎉',
  },
  priority_changed: {
    label: 'Priority Changed',
    description: 'When client priority changes',
    icon: '⚡',
  },
  tag_added: {
    label: 'Tag Added',
    description: 'When a tag is added to a client',
    icon: '🏷️',
  },
  phase_completed: {
    label: 'Phase Completed',
    description: 'When an onboarding phase is completed',
    icon: '📋',
  },
};

// Action labels and descriptions
export const actionConfig: Record<string, { label: string; description: string; icon: string }> = {
  change_status: {
    label: 'Change Status',
    description: 'Update client status',
    icon: '📊',
  },
  change_priority: {
    label: 'Change Priority',
    description: 'Update client priority',
    icon: '⚡',
  },
  add_tag: {
    label: 'Add Tag',
    description: 'Add a tag to the client',
    icon: '🏷️',
  },
  add_task: {
    label: 'Add Task',
    description: 'Create a new task',
    icon: '📋',
  },
  apply_template: {
    label: 'Apply Template',
    description: 'Add all tasks from a template',
    icon: '📑',
  },
  send_notification: {
    label: 'Send Notification',
    description: 'Send an in-app notification',
    icon: '🔔',
  },
  send_email_sequence: {
    label: 'Send Email Sequence',
    description: 'Queue a series of emails with delays',
    icon: '✉️',
  },
};
