import type { Client } from '../types';
import { getClientHealth } from '../utils/clientHealth';

function escHtml(str: string | undefined | null): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');
}

function healthLabel(status: string): string {
  const map: Record<string, string> = {
    'on-track': 'On Track',
    'at-risk': 'At Risk',
    'needs-attention': 'Needs Attention',
    stalled: 'Stalled',
  };
  return map[status] ?? status;
}

function healthColor(status: string): string {
  const map: Record<string, string> = {
    'on-track': '#10b981',
    'at-risk': '#f59e0b',
    'needs-attention': '#ef4444',
    stalled: '#9ca3af',
  };
  return map[status] ?? '#9ca3af';
}

function statusLabel(status: Client['status']): string {
  const map: Record<Client['status'], string> = {
    active: 'Active',
    completed: 'Completed',
    'on-hold': 'On Hold',
  };
  return map[status];
}

export function generatePortalHTML(client: Client): string {
  const health = getClientHealth(client);
  const completedCount = client.checklist.filter(t => t.completed).length;
  const totalCount = client.checklist.length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const overdueCount = client.checklist.filter(
    t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()
  ).length;
  const inProgressCount = client.checklist.filter(t => !t.completed).length;

  const sortByDue = (items: typeof client.checklist) =>
    [...items].sort((a, b) => {
      if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return (a.order ?? 0) - (b.order ?? 0);
    });

  const clientActionItems = sortByDue(
    client.checklist.filter(t => !t.completed && t.ownerType === 'client')
  ).slice(0, 8);

  const internalItems = sortByDue(
    client.checklist.filter(t => !t.completed && t.ownerType !== 'client')
  ).slice(0, 5);

  const fallbackNextSteps = sortByDue(client.checklist.filter(t => !t.completed)).slice(0, 5);

  const phases = client.phases ?? [];
  const sortedPhases = [...phases].sort((a, b) => a.order - b.order);

  const milestones = client.milestones ?? [];
  const now = new Date();

  // SVG ring for progress
  const r = 48;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  const healthC = health ? healthColor(health.status) : '#9ca3af';
  const healthL = health ? healthLabel(health.status) : '';

  const accountRows = [
    ['Contract Start', client.account?.contractStartDate],
    ['Contract End', client.account?.renewalDate],
    ['Industry', client.account?.industry],
  ]
    .filter(([, v]) => v)
    .map(([label, value]) => `
      <tr>
        <td class="key">${escHtml(label)}</td>
        <td class="val">${escHtml(value)}</td>
      </tr>`)
    .join('');

  const milestoneHTML = milestones.length > 0 ? `
    <section>
      <h2>Milestones</h2>
      <div class="timeline">
        ${milestones.map(m => {
          const isPast = !m.completedAt && m.targetDate && new Date(m.targetDate) < now;
          const cls = m.completedAt ? 'done' : isPast ? 'overdue' : 'pending';
          return `<div class="dot ${cls}" title="${escHtml(m.title)}${m.targetDate ? ' · ' + escHtml(m.targetDate) : ''}"></div>`;
        }).join('')}
      </div>
      <div class="milestone-labels">
        ${milestones.map(m => `<span class="ml-label ${m.completedAt ? 'done' : ''}">${escHtml(m.title)}</span>`).join('')}
      </div>
    </section>` : '';

  const phasesHTML = sortedPhases.length > 0 ? `
    <section>
      <h2>Onboarding Phases</h2>
      <div class="phases-list">
        ${sortedPhases.map(phase => {
          const phaseItems = client.checklist.filter(t => t.phaseId === phase.id);
          if (!phaseItems.length) return '';
          const done = phaseItems.filter(t => t.completed).length;
          const pct = Math.round((done / phaseItems.length) * 100);
          return `
            <div class="phase-row">
              <div class="phase-header">
                <span class="phase-name">${escHtml(phase.name)}</span>
                <span class="phase-count">${done}/${phaseItems.length}</span>
              </div>
              <div class="phase-bar-bg"><div class="phase-bar" style="width:${pct}%"></div></div>
            </div>`;
        }).join('')}
      </div>
    </section>` : '';

  const clientActionsHTML = clientActionItems.length > 0 ? `
    <section class="action-section">
      <h2>Your Action Items</h2>
      <ol>
        ${clientActionItems.map(t => `<li><span class="task-title">${escHtml(t.title)}</span>${t.dueDate ? `<span class="task-due"> · due ${escHtml(t.dueDate)}</span>` : ''}</li>`).join('')}
      </ol>
    </section>` : '';

  const internalHTML = internalItems.length > 0 ? `
    <section>
      <h2>What We're Working On</h2>
      <ol>
        ${internalItems.map(t => `<li><span class="task-title">${escHtml(t.title)}</span>${t.dueDate ? `<span class="task-due"> · due ${escHtml(t.dueDate)}</span>` : ''}</li>`).join('')}
      </ol>
    </section>` : '';

  const fallbackHTML = clientActionItems.length === 0 && internalItems.length === 0 && sortedPhases.length === 0 && fallbackNextSteps.length > 0 ? `
    <section>
      <h2>Next Steps</h2>
      <ol>
        ${fallbackNextSteps.map(t => `<li><span class="task-title">${escHtml(t.title)}</span>${t.dueDate ? `<span class="task-due"> · due ${escHtml(t.dueDate)}</span>` : ''}</li>`).join('')}
      </ol>
    </section>` : '';

  const keyDatesHTML = accountRows ? `
    <section>
      <h2>Key Dates</h2>
      <table class="dates-table"><tbody>${accountRows}</tbody></table>
    </section>` : '';

  const teamHTML = (client.assignments?.length ?? 0) > 0 ? `
    <section>
      <h2>Team</h2>
      <div class="team-list">
        ${(client.assignments ?? []).map(a => `
          <div class="team-member">
            <span class="avatar">${escHtml(initials(a.memberId))}</span>
            <span class="member-name">${escHtml(a.memberId)}</span>
          </div>`).join('')}
      </div>
    </section>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escHtml(client.name)} — Onboarding Portal</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1e293b; }
  .header { background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); color: white; padding: 2rem; }
  .header-inner { max-width: 720px; margin: 0 auto; display: flex; align-items: center; gap: 1.5rem; }
  .avatar-lg { width: 64px; height: 64px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 700; flex-shrink: 0; }
  .client-name { font-size: 1.75rem; font-weight: 800; }
  .status-badge { display: inline-block; margin-top: 0.4rem; padding: 0.25rem 0.75rem; border-radius: 999px; background: rgba(255,255,255,0.2); font-size: 0.75rem; font-weight: 700; }
  .health-badge { display: inline-flex; align-items: center; gap: 0.4rem; margin-left: 0.5rem; padding: 0.25rem 0.75rem; border-radius: 999px; background: rgba(255,255,255,0.2); font-size: 0.75rem; font-weight: 700; }
  .health-dot { width: 8px; height: 8px; border-radius: 50%; background: ${healthC}; }
  main { max-width: 720px; margin: 0 auto; padding: 2rem 1.5rem; display: grid; gap: 1.5rem; }
  section { background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
  h2 { font-size: 0.875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 1rem; }
  .progress-block { display: flex; align-items: center; gap: 2rem; flex-wrap: wrap; }
  .ring-wrap { position: relative; width: 120px; height: 120px; flex-shrink: 0; }
  .ring-wrap svg { transform: rotate(-90deg); }
  .ring-label { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 800; color: #1e293b; }
  .stats { display: flex; gap: 1rem; flex-wrap: wrap; }
  .stat-pill { padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.8125rem; font-weight: 600; }
  .pill-green { background: #d1fae5; color: #065f46; }
  .pill-blue  { background: #dbeafe; color: #1e40af; }
  .pill-red   { background: #fee2e2; color: #991b1b; }
  .timeline { display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.75rem; flex-wrap: wrap; }
  .dot { width: 18px; height: 18px; border-radius: 50%; flex-shrink: 0; }
  .dot.done    { background: #7c3aed; }
  .dot.pending { background: white; border: 2.5px solid #7c3aed; }
  .dot.overdue { background: white; border: 2.5px solid #ef4444; }
  .milestone-labels { display: flex; gap: 0.5rem; flex-wrap: wrap; }
  .ml-label { font-size: 0.75rem; color: #64748b; }
  .ml-label.done { color: #7c3aed; font-weight: 600; }
  ol { padding-left: 1.5rem; display: grid; gap: 0.5rem; }
  li { font-size: 0.9375rem; }
  .task-due { font-size: 0.8125rem; color: #94a3b8; }
  .dates-table { width: 100%; border-collapse: collapse; }
  .dates-table td { padding: 0.4rem 0; font-size: 0.9375rem; }
  .key { color: #64748b; width: 40%; }
  .val { font-weight: 600; }
  .team-list { display: flex; gap: 1rem; flex-wrap: wrap; }
  .team-member { display: flex; align-items: center; gap: 0.5rem; }
  .avatar { width: 32px; height: 32px; border-radius: 50%; background: #7c3aed; color: white; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; }
  .member-name { font-size: 0.875rem; font-weight: 500; }
  footer { text-align: center; padding: 2rem; color: #94a3b8; font-size: 0.8125rem; }
  .action-section { border-left: 4px solid #7c3aed; }
  .phases-list { display: grid; gap: 0.75rem; }
  .phase-row {}
  .phase-header { display: flex; justify-content: space-between; margin-bottom: 0.25rem; }
  .phase-name { font-size: 0.875rem; font-weight: 600; color: #334155; }
  .phase-count { font-size: 0.75rem; color: #64748b; }
  .phase-bar-bg { height: 8px; background: #e2e8f0; border-radius: 999px; overflow: hidden; }
  .phase-bar { height: 8px; background: #7c3aed; border-radius: 999px; }
</style>
</head>
<body>
<header class="header">
  <div class="header-inner">
    <div class="avatar-lg">${escHtml(initials(client.name))}</div>
    <div>
      <div class="client-name">${escHtml(client.name)}</div>
      <span class="status-badge">${escHtml(statusLabel(client.status))}</span>
      ${health ? `<span class="health-badge"><span class="health-dot"></span>${escHtml(healthL)}</span>` : ''}
    </div>
  </div>
</header>
<main>
  <section>
    <h2>Onboarding Progress</h2>
    <div class="progress-block">
      <div class="ring-wrap">
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="${r}" fill="none" stroke="#f1f5f9" stroke-width="10"/>
          <circle cx="60" cy="60" r="${r}" fill="none" stroke="#7c3aed" stroke-width="10"
            stroke-dasharray="${dash.toFixed(2)} ${circ.toFixed(2)}" stroke-linecap="round"/>
        </svg>
        <div class="ring-label">${pct}%</div>
      </div>
      <div class="stats">
        <div class="stat-pill pill-green">${completedCount} Completed</div>
        <div class="stat-pill pill-blue">${inProgressCount} In Progress</div>
        <div class="stat-pill pill-red">${overdueCount} Overdue</div>
      </div>
    </div>
  </section>
  ${milestoneHTML}
  ${phasesHTML}
  ${clientActionsHTML}
  ${internalHTML}
  ${fallbackHTML}
  ${keyDatesHTML}
  ${teamHTML}
</main>
<footer>Powered by Embark</footer>
</body>
</html>`;
}

export function usePortalExport() {
  const exportPortal = (client: Client) => {
    const html = generatePortalHTML(client);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${client.name.replace(/\s+/g, '-').toLowerCase()}-portal.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return { exportPortal, generatePortalHTML };
}
