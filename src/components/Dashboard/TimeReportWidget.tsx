import type { Client } from '../../types';

interface TimeReportWidgetProps {
  clients: Client[];
}

const fmt = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

export function TimeReportWidget({ clients }: TimeReportWidgetProps) {
  const clientTotals = clients
    .map(c => {
      const entries = c.checklist.flatMap(t => t.timeEntries ?? []);
      const total = entries.reduce((s, e) => s + e.duration, 0);
      const billable = entries.filter(e => e.billable).reduce((s, e) => s + e.duration, 0);
      return { name: c.name, total, billable };
    })
    .filter(c => c.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const grandTotal = clientTotals.reduce((s, c) => s + c.total, 0);
  const grandBillable = clientTotals.reduce((s, c) => s + c.billable, 0);

  return (
    <div className="glass-card p-5 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">⏱</span>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Time Report</h3>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{fmt(grandTotal)}</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400">{fmt(grandBillable)} billable</p>
        </div>
      </div>

      {clientTotals.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No time entries yet. Start a timer on a task.</p>
      ) : (
        <div className="space-y-2">
          {clientTotals.map(c => (
            <div key={c.name} className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{c.name}</span>
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-24 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: grandTotal > 0 ? `${(c.total / grandTotal) * 100}%` : '0%' }}
                  />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 w-14 text-right">{fmt(c.total)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
