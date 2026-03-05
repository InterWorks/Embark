import type { Client } from '../types';

export interface EngagementBreakdown {
  total: number;
  portalRecency: number;
  clientTaskCompletion: number;
  communicationScore: number;
  taskResponsiveness: number;
  tier: 'high' | 'medium' | 'low';
}

export function computeEngagementScore(client: Client): EngagementBreakdown {
  const now = Date.now();
  const commLog = client.communicationLog ?? [];
  const checklist = client.checklist ?? [];

  // ── 1. Portal Recency (30 pts) ────────────────────────────────────────────
  const portalEntries = commLog.filter((e) => e.source === 'client-portal');
  let portalRecency = 0;
  if (portalEntries.length > 0) {
    const lastPortalEntry = portalEntries.reduce((latest, e) =>
      new Date(e.timestamp).getTime() > new Date(latest.timestamp).getTime() ? e : latest
    );
    const daysSincePortal = Math.floor(
      (now - new Date(lastPortalEntry.timestamp).getTime()) / 86400000
    );
    if (daysSincePortal < 1) {
      portalRecency = 30;
    } else if (daysSincePortal < 7) {
      portalRecency = 20;
    } else if (daysSincePortal < 14) {
      portalRecency = 10;
    } else if (daysSincePortal < 30) {
      portalRecency = 5;
    } else {
      portalRecency = 0;
    }
  }

  // ── 2. Client Task Completion (25 pts) ────────────────────────────────────
  const clientTasks = checklist.filter((t) => t.ownerType === 'client');
  let clientTaskCompletion: number;
  if (clientTasks.length === 0) {
    clientTaskCompletion = 15; // neutral score when no client tasks exist
  } else {
    const completedClientTasks = clientTasks.filter((t) => t.completed).length;
    const completionRatio = completedClientTasks / clientTasks.length;
    clientTaskCompletion = Math.round(completionRatio * 25);
  }

  // ── 3. Communication Score (25 pts) ───────────────────────────────────────
  // Recency component
  let commRecency = 0;
  if (commLog.length > 0) {
    const lastEntry = commLog.reduce((latest, e) =>
      new Date(e.timestamp).getTime() > new Date(latest.timestamp).getTime() ? e : latest
    );
    const daysSinceComm = Math.floor(
      (now - new Date(lastEntry.timestamp).getTime()) / 86400000
    );
    if (daysSinceComm < 3) {
      commRecency = 25;
    } else if (daysSinceComm < 7) {
      commRecency = 15;
    } else if (daysSinceComm < 14) {
      commRecency = 8;
    } else if (daysSinceComm < 30) {
      commRecency = 3;
    } else {
      commRecency = 0;
    }
  }

  // Frequency bonus: count entries in last 30 days, up to +5 bonus (capped at 25 total)
  const thirtyDaysAgo = now - 30 * 86400000;
  const recentCommCount = commLog.filter(
    (e) => new Date(e.timestamp).getTime() >= thirtyDaysAgo
  ).length;
  const freqBonus = Math.min(recentCommCount, 5); // 0–5 bonus points

  const communicationScore = Math.min(25, commRecency + freqBonus);

  // ── 4. Task Responsiveness (20 pts) ───────────────────────────────────────
  // Estimate avg response time for completed client-owned tasks using dueDate vs today
  const completedClientTasks = clientTasks.filter((t) => t.completed && t.dueDate);
  let taskResponsiveness = 0;
  if (completedClientTasks.length > 0) {
    const today = new Date();
    const totalDays = completedClientTasks.reduce((sum, t) => {
      const due = new Date(t.dueDate!);
      // Days from today back to due date (proxy for responsiveness window)
      const days = Math.max(0, Math.ceil((today.getTime() - due.getTime()) / 86400000));
      return sum + days;
    }, 0);
    const avgDays = totalDays / completedClientTasks.length;

    if (avgDays < 3) {
      taskResponsiveness = 20;
    } else if (avgDays < 7) {
      taskResponsiveness = 12;
    } else if (avgDays < 14) {
      taskResponsiveness = 6;
    } else {
      taskResponsiveness = 0;
    }
  }

  // ── Total & Tier ──────────────────────────────────────────────────────────
  const total = Math.min(
    100,
    portalRecency + clientTaskCompletion + communicationScore + taskResponsiveness
  );

  const tier: EngagementBreakdown['tier'] =
    total >= 70 ? 'high' : total >= 40 ? 'medium' : 'low';

  return {
    total,
    portalRecency,
    clientTaskCompletion,
    communicationScore,
    taskResponsiveness,
    tier,
  };
}
