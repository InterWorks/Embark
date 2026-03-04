import { useMemo } from 'react';
import { useSLAStatuses } from '../../hooks/useSLA';
import { SLABadge } from './SLABadge';
import type { Client } from '../../types';
import type { SLAStatusValue } from '../../types/sla';

interface SLAStatusWidgetProps {
  clients: Client[];
  onNavigate?: (view: string) => void;
}

export function SLAStatusWidget({ clients, onNavigate }: SLAStatusWidgetProps) {
  const statuses = useSLAStatuses(clients);

  const counts = useMemo(() => {
    const tally = { on_track: 0, warning: 0, breached: 0 };
    for (const s of statuses) tally[s.status]++;
    return tally;
  }, [statuses]);

  const worst5 = useMemo(() => {
    const order: Record<SLAStatusValue, number> = { breached: 0, warning: 1, on_track: 2 };
    return [...statuses]
      .sort((a, b) => order[a.status] - order[b.status] || b.percentUsed - a.percentUsed)
      .slice(0, 5);
  }, [statuses]);

  const clientName = (clientId: string) => clients.find(c => c.id === clientId)?.name ?? clientId;

  if (statuses.length === 0) {
    return (
      <div className="border-2 border-zinc-200 dark:border-zinc-700 rounded-xl p-5">
        <h3 className="text-sm font-black font-display text-zinc-900 dark:text-white mb-2">SLA Status</h3>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          No SLA rules configured.{' '}
          {onNavigate && (
            <button onClick={() => onNavigate('integrations')} className="text-violet-600 dark:text-violet-400 hover:underline">
              Add rules →
            </button>
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="border-2 border-zinc-200 dark:border-zinc-700 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black font-display text-zinc-900 dark:text-white">SLA Status</h3>
        {onNavigate && (
          <button onClick={() => onNavigate('integrations')} className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
            Manage →
          </button>
        )}
      </div>

      {/* Summary pills */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{counts.on_track} On Track</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
          <span className="text-xs font-bold text-amber-700 dark:text-amber-300">{counts.warning} Warning</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
          <span className="text-xs font-bold text-red-700 dark:text-red-300">{counts.breached} Breached</span>
        </div>
      </div>

      {/* Worst 5 */}
      {worst5.length > 0 && (
        <div className="space-y-2">
          {worst5.map((s, i) => (
            <div key={`${s.clientId}-${s.slaId}-${i}`} className="flex items-center gap-3">
              <SLABadge status={s.status} compact />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">{clientName(s.clientId)}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{s.slaName}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  {Math.round(s.percentUsed * 100)}%
                </p>
                {s.daysOverdue > 0 && (
                  <p className="text-xs text-red-500">+{s.daysOverdue}d</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
