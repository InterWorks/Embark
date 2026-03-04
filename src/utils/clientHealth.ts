import type { Client, LifecycleStage } from '../types';

export type HealthStatus = 'on-track' | 'at-risk' | 'needs-attention' | 'stalled';

export interface ClientHealth {
  status: HealthStatus;
  reason: string;
}

export const HEALTH_COLORS: Record<HealthStatus, { dot: string; border: string; badge: string; label: string }> = {
  'on-track':        { dot: 'bg-emerald-500', border: 'border-l-emerald-500', badge: 'bg-emerald-500/20 text-emerald-400', label: 'On Track' },
  'at-risk':         { dot: 'bg-yellow-500',  border: 'border-l-yellow-500',  badge: 'bg-yellow-500/20 text-yellow-400',  label: 'At Risk' },
  'needs-attention': { dot: 'bg-red-500',     border: 'border-l-red-500',     badge: 'bg-red-500/20 text-red-400',        label: 'Needs Attention' },
  'stalled':         { dot: 'bg-gray-400',    border: 'border-l-gray-400',    badge: 'bg-gray-500/20 text-gray-400',      label: 'Stalled' },
};

export function getClientHealth(client: Client): ClientHealth | null {
  if (client.status !== 'active') return null;
  if (client.archived) return null;

  const stage: LifecycleStage = client.lifecycleStage ?? 'onboarding';

  if (stage === 'active-client') {
    return getOngoingClientHealth(client);
  }

  if (stage === 'at-risk') {
    return { status: 'needs-attention', reason: 'Marked at-risk' };
  }

  // 'onboarding' and 'churned' fall through to task-based logic
  return getOnboardingHealth(client);
}

function getOngoingClientHealth(client: Client): ClientHealth {
  const now = new Date();
  const log = client.communicationLog ?? [];
  const lastEntry = log[log.length - 1];
  const daysSince = lastEntry
    ? Math.floor((now.getTime() - new Date(lastEntry.timestamp).getTime()) / 86400000)
    : 999;

  if (daysSince >= 60) return { status: 'stalled',         reason: `No contact in ${daysSince} days` };
  if (daysSince >= 30) return { status: 'needs-attention', reason: `No contact in ${daysSince} days` };
  if (daysSince >= 14) return { status: 'at-risk',         reason: `No contact in ${daysSince} days` };

  // Renewal within 30 days
  if (client.account?.renewalDate) {
    const daysToRenewal = Math.floor(
      (new Date(client.account.renewalDate).getTime() - now.getTime()) / 86400000
    );
    if (daysToRenewal >= 0 && daysToRenewal <= 30) {
      return { status: 'at-risk', reason: `Renewal in ${daysToRenewal} days` };
    }
  }

  return { status: 'on-track', reason: 'On track' };
}

function getOnboardingHealth(client: Client): ClientHealth | null {
  const now = new Date();

  // Determine days since last activity.
  // activityLog is oldest-first; most recent entry is at the end.
  const log = client.activityLog;
  const lastActivityTimestamp =
    log && log.length > 0
      ? log[log.length - 1].timestamp
      : client.createdAt;
  const lastActivityDate = new Date(lastActivityTimestamp);
  // Guard against unparseable timestamps — treat as recent (0 days) to avoid wrong status.
  const rawDaysSince =
    lastActivityDate && !isNaN(lastActivityDate.getTime())
      ? Math.floor((now.getTime() - lastActivityDate.getTime()) / 86400000)
      : 0;
  const daysSinceActivity = Math.max(0, rawDaysSince);

  // Count overdue tasks: incomplete tasks with a dueDate in the past.
  const overdueTasks = (client.checklist || []).filter(
    item => !item.completed && item.dueDate && new Date(item.dueDate) < now,
  );
  const overdueCount = overdueTasks.length;

  // Check for any incomplete milestones past their target date.
  const hasPastMilestone = (client.milestones || []).some(
    m => !m.completedAt && m.targetDate && new Date(m.targetDate) < now,
  );

  // Check go-live date
  const goLiveDate = client.targetGoLiveDate ? new Date(client.targetGoLiveDate) : null;
  const daysToGoLive = goLiveDate
    ? Math.ceil((goLiveDate.getTime() - now.getTime()) / 86400000)
    : null;
  const totalTasks = client.checklist.length;
  const completedTasks = client.checklist.filter(t => t.completed).length;
  const taskPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Check blocked tasks
  const blockedTasks = (client.checklist || []).filter(t => t.isBlocked && !t.completed);
  const blockedCount = blockedTasks.length;

  // Priority order: stalled > needs-attention > at-risk > on-track

  // Go-live is in the past and client is not completed → stalled
  if (daysToGoLive !== null && daysToGoLive < 0 && client.status !== 'completed') {
    return { status: 'stalled', reason: `Go-live date passed ${Math.abs(daysToGoLive)} days ago` };
  }

  if (daysSinceActivity >= 30) {
    return { status: 'stalled', reason: `No activity in ${daysSinceActivity} days` };
  }

  // 3+ blocked tasks → needs-attention
  if (blockedCount >= 3) {
    return { status: 'needs-attention', reason: `${blockedCount} tasks blocked` };
  }

  if (overdueCount >= 3) {
    return { status: 'needs-attention', reason: `${overdueCount} overdue tasks` };
  }

  if (daysSinceActivity >= 14) {
    return { status: 'needs-attention', reason: `No activity in ${daysSinceActivity} days` };
  }

  // Go-live within 7 days and < 80% complete → needs-attention
  if (daysToGoLive !== null && daysToGoLive >= 0 && daysToGoLive <= 7 && taskPct < 80) {
    return { status: 'needs-attention', reason: `Go-live in ${daysToGoLive} days, only ${taskPct}% complete` };
  }

  // 1+ blocked tasks → at-risk minimum
  if (blockedCount >= 1) {
    return { status: 'at-risk', reason: `${blockedCount} task${blockedCount > 1 ? 's' : ''} blocked` };
  }

  if (overdueCount >= 1) {
    return { status: 'at-risk', reason: `${overdueCount} overdue task${overdueCount > 1 ? 's' : ''}` };
  }

  if (daysSinceActivity >= 7) {
    return { status: 'at-risk', reason: `No activity in ${daysSinceActivity} days` };
  }

  if (hasPastMilestone) {
    return { status: 'at-risk', reason: 'Milestone past target date' };
  }

  return { status: 'on-track', reason: 'On track' };
}
