import type { Client } from '../../types';

interface GoLiveWidgetProps {
  clients: Client[];
  onClientClick?: (client: Client) => void;
}

function goLiveDaysLeft(date: string): number {
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000);
}

function statusPill(daysLeft: number, pct: number) {
  if (daysLeft < 0) return { label: 'Overdue', className: 'bg-red-500/20 text-red-400' };
  if (pct >= 80) return { label: 'On Track', className: 'bg-emerald-500/20 text-emerald-400' };
  if (daysLeft <= 7) return { label: 'At Risk', className: 'bg-red-500/20 text-red-400' };
  if (daysLeft <= 14) return { label: 'At Risk', className: 'bg-yellow-500/20 text-yellow-400' };
  return { label: 'On Track', className: 'bg-emerald-500/20 text-emerald-400' };
}

function countdownColor(daysLeft: number): string {
  if (daysLeft < 0) return 'text-red-400';
  if (daysLeft < 7) return 'text-red-400';
  if (daysLeft < 14) return 'text-yellow-400';
  return 'text-emerald-400';
}

export function GoLiveWidget({ clients, onClientClick }: GoLiveWidgetProps) {
  const now = Date.now();
  const thirtyDays = 30 * 86_400_000;

  const upcomingClients = clients
    .filter(
      (c) =>
        !c.archived &&
        c.status !== 'completed' &&
        c.targetGoLiveDate &&
        new Date(c.targetGoLiveDate).getTime() - now <= thirtyDays
    )
    .sort(
      (a, b) =>
        new Date(a.targetGoLiveDate!).getTime() - new Date(b.targetGoLiveDate!).getTime()
    );

  if (upcomingClients.length === 0) return null;

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Upcoming Go-Live
        </h3>
        <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">Next 30 days</span>
      </div>
      <div className="space-y-2">
        {upcomingClients.map((c) => {
          const daysLeft = goLiveDaysLeft(c.targetGoLiveDate!);
          const totalTasks = c.checklist.length;
          const completedTasks = c.checklist.filter((t) => t.completed).length;
          const pct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
          const pill = statusPill(daysLeft, pct);
          const color = countdownColor(daysLeft);

          return (
            <div
              key={c.id}
              onClick={() => onClientClick?.(c)}
              className={`flex items-center gap-3 p-2.5 rounded-lg glass-subtle transition-all ${onClientClick ? 'cursor-pointer hover:bg-white/60 dark:hover:bg-white/15' : ''}`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{c.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {c.targetGoLiveDate} · {pct}% complete
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-sm font-bold ${color}`}>
                  {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? 'Today!' : `${daysLeft}d`}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${pill.className}`}>
                  {pill.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
