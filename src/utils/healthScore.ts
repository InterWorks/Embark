import type { Client } from '../types';
import type { ClientSLAStatus } from '../types/sla';

export interface HealthScore {
  total: number; // 0–100
  breakdown: {
    taskCompletion: number;   // 0–40
    slaStatus: number;        // 0–20
    communicationRecency: number; // 0–20
    blockedTasks: number;     // 0–20
  };
  label: 'excellent' | 'good' | 'at-risk' | 'critical';
}

export function computeHealthScore(client: Client, slaStatuses: ClientSLAStatus[]): HealthScore {
  const checklist = client.checklist ?? [];
  const totalTasks = checklist.length;

  // 1. Task completion (40 pts)
  let taskCompletion = 40;
  if (totalTasks > 0) {
    const completedCount = checklist.filter(t => t.completed).length;
    const overdueCount = checklist.filter(
      t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()
    ).length;
    const completionPct = completedCount / totalTasks;
    const overduePenalty = Math.min(overdueCount * 5, 20);
    taskCompletion = Math.max(0, Math.round(completionPct * 40) - overduePenalty);
  }

  // 2. SLA status (20 pts)
  const clientSLAs = slaStatuses.filter(s => s.clientId === client.id);
  let slaStatus = 20;
  if (clientSLAs.length > 0) {
    const breachedCount = clientSLAs.filter(s => s.status === 'breached').length;
    const warningCount = clientSLAs.filter(s => s.status === 'warning').length;
    slaStatus = Math.max(0, 20 - breachedCount * 10 - warningCount * 5);
  }

  // 3. Communication recency (20 pts)
  const commLog = client.communicationLog ?? [];
  let communicationRecency = 20;
  if (commLog.length > 0) {
    const lastEntry = commLog[commLog.length - 1];
    const daysSince = Math.floor(
      (Date.now() - new Date(lastEntry.timestamp).getTime()) / 86400000
    );
    if (daysSince >= 30) communicationRecency = 0;
    else if (daysSince >= 14) communicationRecency = 5;
    else if (daysSince >= 7) communicationRecency = 12;
    else communicationRecency = 20;
  }

  // 4. Blocked tasks (20 pts)
  const blockedCount = checklist.filter(t => t.isBlocked && !t.completed).length;
  const blockedTasks = Math.max(0, 20 - blockedCount * 7);

  const total = taskCompletion + slaStatus + communicationRecency + blockedTasks;

  let label: HealthScore['label'];
  if (total >= 80) label = 'excellent';
  else if (total >= 60) label = 'good';
  else if (total >= 40) label = 'at-risk';
  else label = 'critical';

  return { total, breakdown: { taskCompletion, slaStatus, communicationRecency, blockedTasks }, label };
}
