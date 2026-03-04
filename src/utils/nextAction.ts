import type { Client } from '../types';
import type { ClientSLAStatus } from '../types/sla';

export interface NextAction {
  label: string;
  type: 'overdue' | 'blocked' | 'due_soon' | 'sla' | 'no_comm';
  targetTaskId?: string;
}

export function computeNextAction(client: Client, slaStatuses: ClientSLAStatus[]): NextAction | null {
  const now = new Date();
  const checklist = client.checklist ?? [];

  // 1. Overdue tasks (highest priority)
  const overdueTasks = checklist
    .filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < now)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

  if (overdueTasks.length > 0) {
    const task = overdueTasks[0];
    const daysOverdue = Math.floor((now.getTime() - new Date(task.dueDate!).getTime()) / 86400000);
    return {
      label: `"${task.title}" is ${daysOverdue}d overdue`,
      type: 'overdue',
      targetTaskId: task.id,
    };
  }

  // 2. Blocked tasks
  const blockedTasks = checklist.filter(t => t.isBlocked && !t.completed);
  if (blockedTasks.length > 0) {
    return {
      label: `${blockedTasks.length} task${blockedTasks.length > 1 ? 's' : ''} blocked`,
      type: 'blocked',
      targetTaskId: blockedTasks[0].id,
    };
  }

  // 3. Tasks due this week (UTC)
  const weekEnd = new Date(now);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);
  const dueSoon = checklist
    .filter(t => !t.completed && t.dueDate && new Date(t.dueDate) <= weekEnd && new Date(t.dueDate) >= now)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

  if (dueSoon.length > 0) {
    const task = dueSoon[0];
    const daysLeft = Math.ceil((new Date(task.dueDate!).getTime() - now.getTime()) / 86400000);
    return {
      label: `"${task.title}" due in ${daysLeft}d`,
      type: 'due_soon',
      targetTaskId: task.id,
    };
  }

  // 4. SLA warning
  const clientSLAs = slaStatuses.filter(s => s.clientId === client.id);
  const warningSLA = clientSLAs.find(s => s.status === 'breached') ?? clientSLAs.find(s => s.status === 'warning');
  if (warningSLA) {
    return {
      label: `SLA "${warningSLA.slaName}" ${warningSLA.status === 'breached' ? 'breached' : 'at risk'}`,
      type: 'sla',
    };
  }

  // 5. No communication in 7+ days
  const commLog = client.communicationLog ?? [];
  if (commLog.length > 0) {
    const lastEntry = commLog[commLog.length - 1];
    const daysSince = Math.floor((now.getTime() - new Date(lastEntry.timestamp).getTime()) / 86400000);
    if (daysSince >= 7) {
      return {
        label: `No communication in ${daysSince} days`,
        type: 'no_comm',
      };
    }
  } else {
    const daysSinceCreation = Math.floor((now.getTime() - new Date(client.createdAt).getTime()) / 86400000);
    if (daysSinceCreation >= 7) {
      return {
        label: 'No communication logged yet',
        type: 'no_comm',
      };
    }
  }

  return null;
}
