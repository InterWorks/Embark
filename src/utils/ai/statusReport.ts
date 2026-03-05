import type { Client } from '../../types';

export function buildStatusReportPrompt(client: Client, healthScore: number): string {
  const now = new Date();

  // Compute task stats
  const totalTasks = client.checklist.length;
  const completedTasks = client.checklist.filter(t => t.completed);
  const pendingTasks = client.checklist.filter(t => !t.completed);
  const progress = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  const overdueTasks = pendingTasks.filter(t => t.dueDate && new Date(t.dueDate) < now);

  // Recent milestones: completed in the last 14 days
  const recentMilestones = (client.milestones ?? []).filter(m => {
    if (!m.completedAt) return false;
    const daysAgo = (now.getTime() - new Date(m.completedAt).getTime()) / 86400000;
    return daysAgo <= 14;
  });

  // Next 3 pending tasks (by order)
  const nextTasks = [...pendingTasks]
    .sort((a, b) => a.order - b.order)
    .slice(0, 3);

  // Phase info
  const phases = client.phases ?? [];
  const currentPhase = phases.find(p => !p.completedAt) ?? phases[phases.length - 1];
  const phasesCompleted = phases.filter(p => p.completedAt).length;

  // Format lifecycle stage for readability
  const lifecycleLabel =
    client.lifecycleStage === 'onboarding' ? 'Onboarding'
    : client.lifecycleStage === 'active-client' ? 'Active Client'
    : client.lifecycleStage === 'at-risk' ? 'At Risk'
    : client.lifecycleStage === 'churned' ? 'Churned'
    : 'Onboarding';

  const lines: string[] = [
    `Generate a professional client status report for the following client. Output in markdown format with the exact sections listed below.`,
    ``,
    `## Client Information`,
    `- **Name:** ${client.name}`,
    `- **Status:** ${client.status}`,
    `- **Lifecycle Stage:** ${lifecycleLabel}`,
    `- **Health Score:** ${healthScore}/100`,
    `- **Overall Progress:** ${progress}% (${completedTasks.length} of ${totalTasks} tasks completed)`,
  ];

  if (phases.length > 0) {
    lines.push(`- **Phases:** ${phasesCompleted}/${phases.length} complete`);
    if (currentPhase) {
      lines.push(`- **Current Phase:** ${currentPhase.name}`);
    }
  }

  if (client.targetGoLiveDate) {
    const daysToGoLive = Math.ceil(
      (new Date(client.targetGoLiveDate).getTime() - now.getTime()) / 86400000
    );
    lines.push(
      `- **Target Go-Live:** ${client.targetGoLiveDate}${
        daysToGoLive >= 0 ? ` (${daysToGoLive} days away)` : ` (${Math.abs(daysToGoLive)} days overdue)`
      }`
    );
  }

  lines.push(``);

  if (overdueTasks.length > 0) {
    lines.push(`## Overdue Tasks (${overdueTasks.length})`);
    for (const t of overdueTasks) {
      const daysOverdue = t.dueDate
        ? Math.floor((now.getTime() - new Date(t.dueDate).getTime()) / 86400000)
        : 0;
      lines.push(`- ${t.title} (${daysOverdue}d overdue)`);
    }
    lines.push(``);
  } else {
    lines.push(`## Overdue Tasks`);
    lines.push(`- None`);
    lines.push(``);
  }

  if (recentMilestones.length > 0) {
    lines.push(`## Recently Completed Milestones`);
    for (const m of recentMilestones) {
      lines.push(`- ${m.title}${m.completedAt ? ` (completed ${m.completedAt.slice(0, 10)})` : ''}`);
    }
    lines.push(``);
  } else {
    lines.push(`## Recently Completed Milestones`);
    lines.push(`- No milestones completed in the last 14 days`);
    lines.push(``);
  }

  if (nextTasks.length > 0) {
    lines.push(`## Next Pending Tasks`);
    for (const t of nextTasks) {
      lines.push(`- ${t.title}${t.dueDate ? ` (due ${t.dueDate})` : ''}`);
    }
    lines.push(``);
  }

  lines.push(`---`);
  lines.push(``);
  lines.push(`Now write the status report using EXACTLY these four sections (omit "Blockers" only if there are none):`);
  lines.push(``);
  lines.push(`## Executive Summary`);
  lines.push(`(2–3 sentences summarising where this client stands, health, and any headline risks)`);
  lines.push(``);
  lines.push(`## Progress This Week`);
  lines.push(`(Bullet points of what has been accomplished recently — reference completed milestones, task progress, and phase advancement)`);
  lines.push(``);
  lines.push(`## What's Next`);
  lines.push(`(Bullet points of upcoming priorities — reference the next pending tasks and any milestone targets)`);
  lines.push(``);
  lines.push(`## Blockers`);
  lines.push(`(Bullet points of any blockers or overdue items. If none, write "No blockers at this time.")`);
  lines.push(``);
  lines.push(`Be professional but direct. Use present tense. Do not add any sections beyond the four listed.`);

  return lines.join('\n');
}
