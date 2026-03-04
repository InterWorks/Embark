import { useMemo, useEffect } from 'react';
import type { Client } from '../../types';
import { getClientHealth, HEALTH_COLORS } from '../../utils/clientHealth';
import { SLABadge } from '../SLA/SLABadge';
import { useSLAStatuses } from '../../hooks/useSLA';

interface ClientPortalViewProps {
  client: Client;
}

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

function statusLabel(status: Client['status']): string {
  const map: Record<Client['status'], string> = { active: 'Active', completed: 'Completed', 'on-hold': 'On Hold' };
  return map[status];
}

export function ClientPortalView({ client }: ClientPortalViewProps) {
  const health = getClientHealth(client);
  const slaStatuses = useSLAStatuses([client]);
  const worstSLA = useMemo(() => {
    const order = { breached: 0, warning: 1, on_track: 2 };
    return [...slaStatuses].sort((a, b) => order[a.status] - order[b.status])[0];
  }, [slaStatuses]);

  // Print setup: hide non-portal elements during print
  useEffect(() => {
    const handleBeforePrint = () => document.body.classList.add('printing-portal');
    const handleAfterPrint = () => document.body.classList.remove('printing-portal');
    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  const completedCount = client.checklist.filter(t => t.completed).length;
  const totalCount = client.checklist.length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const overdueCount = client.checklist.filter(
    t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()
  ).length;
  const inProgressCount = client.checklist.filter(t => !t.completed).length;

  // Health banner
  const healthBanner = useMemo(() => {
    if (!health) return null;
    if (health.status === 'on-track') return { label: 'On Track', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    if (health.status === 'at-risk') return { label: 'At Risk', cls: 'bg-amber-100 text-amber-700 border-amber-200' };
    return { label: 'Behind', cls: 'bg-red-100 text-red-700 border-red-200' };
  }, [health]);

  // Upcoming tasks — next 14 days
  const upcomingTasks = useMemo(() => {
    const now = new Date();
    const in14 = new Date(now.getTime() + 14 * 86400000);
    return client.checklist
      .filter(t => !t.completed && t.dueDate && new Date(t.dueDate) >= now && new Date(t.dueDate) <= in14)
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
  }, [client.checklist]);

  const sortByDue = (items: typeof client.checklist) =>
    [...items].sort((a, b) => {
      if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return (a.order ?? 0) - (b.order ?? 0);
    });

  const clientActionItems = useMemo(() =>
    sortByDue(client.checklist.filter(t => !t.completed && t.ownerType === 'client')).slice(0, 8),
  [client.checklist]);

  const internalItems = useMemo(() =>
    sortByDue(client.checklist.filter(t => !t.completed && t.ownerType !== 'client')).slice(0, 5),
  [client.checklist]);

  const phases = client.phases ?? [];
  const sortedPhases = [...phases].sort((a, b) => a.order - b.order);

  const milestones = client.milestones ?? [];
  const now = new Date();

  // SVG ring
  const r = 48;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  const keyDates = [
    { label: 'Contract Start', value: client.account?.contractStartDate },
    { label: 'Contract End', value: client.account?.renewalDate },
    { label: 'Industry', value: client.account?.industry },
  ].filter(d => d.value);

  return (
    <div className="bg-white min-h-screen font-sans">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-700 to-indigo-600 text-white px-8 py-8">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-5">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-black flex-shrink-0">
              {initials(client.name)}
            </div>
            <div>
              <h1 className="text-2xl font-black">{client.name}</h1>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-white/20">
                  {statusLabel(client.status)}
                </span>
                {health && (
                  <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-white/20 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${HEALTH_COLORS[health.status].dot}`} />
                    {HEALTH_COLORS[health.status].label}
                  </span>
                )}
                {worstSLA && worstSLA.status !== 'on_track' && (
                  <SLABadge status={worstSLA.status} />
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => window.print()}
            className="print:hidden flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-semibold transition-colors flex-shrink-0"
            title="Print this page"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Progress block */}
        <div className="bg-slate-50 rounded-2xl p-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Onboarding Progress</h2>
          <div className="flex items-center gap-8 flex-wrap">
            {/* Ring */}
            <div className="relative w-28 h-28 flex-shrink-0">
              <svg width="112" height="112" viewBox="0 0 112 112" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="56" cy="56" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
                <circle
                  cx="56" cy="56" r={r}
                  fill="none" stroke="#7c3aed" strokeWidth="10"
                  strokeDasharray={`${dash} ${circ}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-2xl font-black text-slate-800">
                {pct}%
              </div>
            </div>
            {/* Pills */}
            <div className="flex gap-3 flex-wrap">
              <div className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-semibold">
                {completedCount} Completed
              </div>
              <div className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold">
                {inProgressCount} In Progress
              </div>
              {overdueCount > 0 && (
                <div className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-semibold">
                  {overdueCount} Overdue
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Health Banner */}
        {healthBanner && (
          <div className={`rounded-2xl p-4 border flex items-center gap-3 ${healthBanner.cls}`}>
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-bold">Overall Status: {healthBanner.label}</span>
          </div>
        )}

        {/* Horizontal Phase Timeline */}
        {sortedPhases.length > 0 && client.targetGoLiveDate && (
          <div className="bg-slate-50 rounded-2xl p-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Phase Timeline</h2>
            <div className="relative">
              {/* Base line */}
              <div className="h-1 bg-slate-200 rounded-full" />
              {/* Phase dots positioned along timeline */}
              <div className="relative mt-1">
                {sortedPhases.map((phase, i) => {
                  const pct = sortedPhases.length > 1 ? (i / (sortedPhases.length - 1)) * 100 : 50;
                  return (
                    <div
                      key={phase.id}
                      className="absolute -translate-x-1/2 flex flex-col items-center"
                      style={{ left: `${pct}%` }}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 -mt-2.5 ${
                        phase.completedAt
                          ? 'bg-violet-600 border-violet-600'
                          : 'bg-white border-violet-400'
                      }`} />
                      <span className="text-xs text-slate-500 mt-1 text-center whitespace-nowrap">{phase.name}</span>
                    </div>
                  );
                })}
              </div>
              <div className="h-8" /> {/* Spacer for labels */}
            </div>
          </div>
        )}

        {/* Upcoming Tasks — next 14 days */}
        {upcomingTasks.length > 0 && (
          <div className="bg-slate-50 rounded-2xl p-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Upcoming (Next 14 Days)</h2>
            <div className="space-y-2">
              {upcomingTasks.map(t => (
                <div key={t.id} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-700 flex-1 truncate">{t.title}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full flex-shrink-0">
                    {t.dueDate}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Milestone timeline */}
        {milestones.length > 0 && (
          <div className="bg-slate-50 rounded-2xl p-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Milestones</h2>
            <div className="flex items-center gap-3 flex-wrap mb-3">
              {milestones.map(m => {
                const isPast = !m.completedAt && m.targetDate && new Date(m.targetDate) < now;
                return (
                  <div
                    key={m.id}
                    title={`${m.title}${m.targetDate ? ` · ${m.targetDate}` : ''}`}
                    className={`w-5 h-5 rounded-full flex-shrink-0 border-2 ${
                      m.completedAt
                        ? 'bg-violet-700 border-violet-700'
                        : isPast
                          ? 'bg-white border-red-500'
                          : 'bg-white border-violet-400'
                    }`}
                  />
                );
              })}
            </div>
            <div className="flex flex-wrap gap-2">
              {milestones.map(m => (
                <span key={m.id} className={`text-xs ${m.completedAt ? 'text-violet-700 font-semibold' : 'text-slate-400'}`}>
                  {m.title}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Phase-grouped progress (if phases exist) */}
        {sortedPhases.length > 0 && (
          <div className="bg-slate-50 rounded-2xl p-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Onboarding Phases</h2>
            <div className="space-y-3">
              {sortedPhases.map((phase) => {
                const phaseItems = client.checklist.filter(t => t.phaseId === phase.id);
                if (phaseItems.length === 0) return null;
                const done = phaseItems.filter(t => t.completed).length;
                const phasePct = Math.round((done / phaseItems.length) * 100);
                return (
                  <div key={phase.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-slate-700">{phase.name}</span>
                      <span className="text-xs text-slate-500">{done}/{phaseItems.length}</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-2 rounded-full bg-violet-600 transition-all"
                        style={{ width: `${phasePct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Your Action Items (client-owned tasks) */}
        {clientActionItems.length > 0 && (
          <div className="bg-slate-50 rounded-2xl p-6 border-l-4 border-violet-500">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Your Action Items</h2>
            <ol className="space-y-2 list-decimal list-inside">
              {clientActionItems.map((t) => (
                <li key={t.id} className="text-sm text-slate-700">
                  <span className="font-medium">{t.title}</span>
                  {t.dueDate && (
                    <span className="text-slate-400 text-xs ml-2">· due {t.dueDate}</span>
                  )}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* What We're Working On (internal tasks) */}
        {internalItems.length > 0 && (
          <div className="bg-slate-50 rounded-2xl p-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">What We&apos;re Working On</h2>
            <ol className="space-y-2 list-decimal list-inside">
              {internalItems.map((t) => (
                <li key={t.id} className="text-sm text-slate-700">
                  <span className="font-medium">{t.title}</span>
                  {t.dueDate && (
                    <span className="text-slate-400 text-xs ml-2">· due {t.dueDate}</span>
                  )}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Fallback: show all incomplete tasks if neither bucket has items */}
        {clientActionItems.length === 0 && internalItems.length === 0 && sortedPhases.length === 0 && (
          <div className="bg-slate-50 rounded-2xl p-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Next Steps</h2>
            <ol className="space-y-2 list-decimal list-inside">
              {sortByDue(client.checklist.filter(t => !t.completed)).slice(0, 5).map((t) => (
                <li key={t.id} className="text-sm text-slate-700">
                  <span className="font-medium">{t.title}</span>
                  {t.dueDate && (
                    <span className="text-slate-400 text-xs ml-2">· due {t.dueDate}</span>
                  )}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Key Dates */}
        {keyDates.length > 0 && (
          <div className="bg-slate-50 rounded-2xl p-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Key Dates</h2>
            <dl className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
              {keyDates.map(d => (
                <>
                  <dt key={`${d.label}-key`} className="text-slate-500">{d.label}</dt>
                  <dd key={`${d.label}-val`} className="font-semibold text-slate-800">{d.value}</dd>
                </>
              ))}
            </dl>
          </div>
        )}

        {/* Team */}
        {(client.assignments?.length ?? 0) > 0 && (
          <div className="bg-slate-50 rounded-2xl p-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Team</h2>
            <div className="flex flex-wrap gap-4">
              {(client.assignments ?? []).map((a, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-violet-700 text-white flex items-center justify-center text-xs font-bold">
                    {initials(a.memberId)}
                  </div>
                  <span className="text-sm text-slate-700">{a.memberId}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-6 text-xs text-slate-400">
        Powered by Embark
      </div>
    </div>
  );
}
