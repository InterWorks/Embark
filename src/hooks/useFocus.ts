import { useMemo } from 'react';
import { useClientContext } from '../context/ClientContext';
import type { Client, ChecklistItem, CommunicationLogEntry } from '../types';

export interface OverdueTask {
  task: ChecklistItem;
  client: Client;
  daysOverdue: number;
}

export interface AtRiskClient {
  client: Client;
  reasons: string[];
}

export interface PendingFollowUp {
  entry: CommunicationLogEntry;
  client: Client;
}

export interface FocusData {
  overdueTasks: OverdueTask[];
  atRiskClients: AtRiskClient[];
  pendingFollowUps: PendingFollowUp[];
  counts: {
    overdue: number;
    atRisk: number;
    followUps: number;
    followUpsThisWeek: number;
  };
}

export function useFocus(): FocusData {
  const { clients } = useClientContext();

  return useMemo<FocusData>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    const weekFromNow = new Date(today.getTime() + 7 * 86400000);

    // Overdue tasks
    const overdueTasks: OverdueTask[] = [];
    // At-risk clients
    const atRiskClients: AtRiskClient[] = [];
    // Pending follow-ups
    const pendingFollowUps: PendingFollowUp[] = [];

    for (const client of clients) {
      if (client.archived) continue;

      // Overdue tasks
      for (const task of client.checklist) {
        if (task.completed || !task.dueDate) continue;
        const due = new Date(task.dueDate);
        due.setHours(0, 0, 0, 0);
        if (due < today) {
          const daysOverdue = Math.round((today.getTime() - due.getTime()) / 86400000);
          overdueTasks.push({ task, client, daysOverdue });
        }
      }

      // At-risk clients
      const reasons: string[] = [];

      // No activity in 7+ days
      const lastActivity = client.activityLog[client.activityLog.length - 1];
      if (lastActivity) {
        const daysSinceActivity = Math.floor((Date.now() - new Date(lastActivity.timestamp).getTime()) / 86400000);
        if (daysSinceActivity >= 7) {
          reasons.push(`No activity ${daysSinceActivity}d`);
        }
      }

      // Lifecycle at-risk
      if (client.lifecycleStage === 'at-risk') {
        reasons.push('At-risk lifecycle');
      }

      // Health score < 50 - calculate simple health score from completion %
      const total = client.checklist.length;
      const done = client.checklist.filter(t => t.completed).length;
      if (total > 0) {
        const healthScore = Math.round((done / total) * 100);
        if (healthScore < 50 && client.status === 'active') {
          reasons.push(`Health ${healthScore}%`);
        }
      }

      if (reasons.length > 0) {
        atRiskClients.push({ client, reasons });
      }

      // Pending follow-ups
      for (const entry of (client.communicationLog ?? [])) {
        if (entry.followUpDate && !entry.followUpResolved) {
          pendingFollowUps.push({ entry, client });
        }
      }
    }

    // Sort overdue tasks by days overdue desc
    overdueTasks.sort((a, b) => b.daysOverdue - a.daysOverdue);
    // Sort follow-ups by date asc
    pendingFollowUps.sort((a, b) => (a.entry.followUpDate ?? '').localeCompare(b.entry.followUpDate ?? ''));

    const followUpsThisWeek = pendingFollowUps.filter(f => {
      const d = f.entry.followUpDate ?? '';
      return d >= todayStr && d <= weekFromNow.toISOString().split('T')[0];
    }).length;

    return {
      overdueTasks,
      atRiskClients,
      pendingFollowUps,
      counts: {
        overdue: overdueTasks.length,
        atRisk: atRiskClients.length,
        followUps: pendingFollowUps.length,
        followUpsThisWeek,
      },
    };
  }, [clients]);
}
