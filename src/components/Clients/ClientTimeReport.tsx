import type { Client } from '../../types';

interface ClientTimeReportProps {
  client: Client;
}

export function ClientTimeReport({ client }: ClientTimeReportProps) {
  const allEntries = client.checklist.flatMap(task =>
    (task.timeEntries ?? []).map(e => ({ ...e, taskTitle: task.title, taskId: task.id }))
  );

  const totalMinutes = allEntries.reduce((sum, e) => sum + e.duration, 0);
  const billableMinutes = allEntries.filter(e => e.billable).reduce((sum, e) => sum + e.duration, 0);
  const nonBillableMinutes = totalMinutes - billableMinutes;

  const fmt = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
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
      )}
    </div>
  );
}
