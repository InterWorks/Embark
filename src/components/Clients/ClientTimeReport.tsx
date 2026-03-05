import type { Client } from '../../types';

interface ClientTimeReportProps {
  client: Client;
}

export function ClientTimeReport({ client }: ClientTimeReportProps) {
  const allEntries = client.checklist.flatMap(task =>
    (task.timeEntries ?? []).map(e => ({ ...e, taskTitle: task.title, taskId: task.id, phaseId: task.phaseId }))
  );

  const totalMinutes = allEntries.reduce((sum, e) => sum + e.duration, 0);
  const billableMinutes = allEntries.filter(e => e.billable).reduce((sum, e) => sum + e.duration, 0);
  const nonBillableMinutes = totalMinutes - billableMinutes;

  const fmt = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const fmtMoney = (cents: number) => {
    const d = cents / 100;
    return d >= 1000 ? `$${(d / 1000).toFixed(1)}k` : `$${d.toFixed(0)}`;
  };

  // Per-phase breakdown (only when phases exist)
  const phases = client.phases ?? [];
  const contractValue = client.account?.contractValue; // cents

  const byPhase = phases.length > 0
    ? phases
        .map(phase => {
          const phaseTasks = client.checklist.filter(t => t.phaseId === phase.id);
          const entries = phaseTasks.flatMap(t => t.timeEntries ?? []);
          const total = entries.reduce((s, e) => s + e.duration, 0);
          const billable = entries.filter(e => e.billable).reduce((s, e) => s + e.duration, 0);
          return { phase, total, billable };
        })
        .filter(p => p.total > 0)
    : [];

  // Tasks without a phase
  const unphased = client.checklist.filter(t => !t.phaseId || t.phaseId === '');
  const unphasedEntries = unphased.flatMap(t => t.timeEntries ?? []);
  const unphasedTotal = unphasedEntries.reduce((s, e) => s + e.duration, 0);
  const unphasedBillable = unphasedEntries.filter(e => e.billable).reduce((s, e) => s + e.duration, 0);

  // Profitability: $/hr = contractValue / total billable hours
  const billableHours = billableMinutes / 60;
  const effectiveRate = contractValue && billableHours > 0
    ? (contractValue / 100) / billableHours
    : null;

  // Per-phase budget share: if contract value, each phase budget = contractValue * (phase billable / total billable)
  const phaseOverBudget = (phaseMinutes: number): boolean => {
    if (!contractValue || billableMinutes === 0) return false;
    // A phase is "over budget" if its share of billable hours exceeds its share of time proportionally
    // Simplified: if phase billable hours * effectiveRate target > per-phase budget allocation
    // We treat "over budget" as: phase uses >40% of total time but has <40% of contract value proportionally
    // Better: flag if phase billable hours > 1/phases.length * total billable hours * 1.5
    if (byPhase.length < 2) return false;
    const fairShare = billableMinutes / byPhase.length;
    return phaseMinutes > fairShare * 1.5;
  };

  // Group by task
  const byTask = client.checklist
    .filter(t => (t.timeEntries ?? []).length > 0)
    .map(t => {
      const entries = t.timeEntries ?? [];
      const total = entries.reduce((s, e) => s + e.duration, 0);
      const billable = entries.filter(e => e.billable).reduce((s, e) => s + e.duration, 0);
      return { task: t, total, billable };
    })
    .sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-subtle rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{fmt(totalMinutes)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Time</p>
        </div>
        <div className="glass-subtle rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{fmt(billableMinutes)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Billable</p>
        </div>
        <div className="glass-subtle rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{fmt(nonBillableMinutes)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Non-Billable</p>
        </div>
      </div>

      {/* Profitability row */}
      {contractValue && (
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-subtle rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{fmtMoney(contractValue)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Contract Value</p>
          </div>
          <div className="glass-subtle rounded-xl p-4 text-center">
            {effectiveRate !== null ? (
              <>
                <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                  ${effectiveRate.toFixed(0)}<span className="text-base font-medium">/hr</span>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Effective Rate</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-gray-400">—</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">No billable time yet</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Per-phase breakdown */}
      {byPhase.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
            Time by Phase
          </h3>
          <div className="glass-subtle rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Phase</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Billable</th>
                  {contractValue && (
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {byPhase.map(({ phase, total, billable }) => {
                  const overBudget = phaseOverBudget(billable);
                  return (
                    <tr key={phase.id} className="border-b border-white/5 last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${phase.color}`} />
                          <span className="text-gray-900 dark:text-gray-100 truncate max-w-[180px]">{phase.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300 font-medium">{fmt(total)}</td>
                      <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400">{fmt(billable)}</td>
                      {contractValue && (
                        <td className="px-4 py-3 text-right">
                          {overBudget ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-full">
                              ⚠ Over budget
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 dark:text-gray-500">On track</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
                {unphasedTotal > 0 && (
                  <tr className="border-b border-white/5 last:border-0 opacity-60">
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 italic">Unassigned</td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300 font-medium">{fmt(unphasedTotal)}</td>
                    <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400">{fmt(unphasedBillable)}</td>
                    {contractValue && <td className="px-4 py-3" />}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Per-task breakdown */}
      {byTask.length === 0 ? (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-medium">No time entries yet</p>
          <p className="text-sm mt-1">Start a timer on any task to track time</p>
        </div>
      ) : (
        <div>
          {byPhase.length > 0 && (
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
              Time by Task
            </h3>
          )}
          <div className="glass-subtle rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Task</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Billable</th>
                </tr>
              </thead>
              <tbody>
                {byTask.map(({ task, total, billable }) => (
                  <tr key={task.id} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100 truncate max-w-[200px]">{task.title}</td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300 font-medium">{fmt(total)}</td>
                    <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400">{fmt(billable)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
