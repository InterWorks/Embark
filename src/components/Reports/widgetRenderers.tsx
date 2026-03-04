import { useMemo } from 'react';
import type { Client } from '../../types';
import type { WidgetType } from '../../types/reportBuilder';
import { getClientHealth, HEALTH_COLORS } from '../../utils/clientHealth';
import { useReports } from '../../hooks/useReports';
import { useWebhooks } from '../../hooks/useWebhooks';
import { SLAStatusWidget } from '../SLA/SLAStatusWidget';

type RendererProps = { clients: Client[]; onNavigate?: (v: string) => void };

function StatsBarWidget({ clients }: RendererProps) {
  const active = clients.filter(c => !c.archived && c.status === 'active').length;
  const completed = clients.filter(c => !c.archived && c.status === 'completed').length;
  const onHold = clients.filter(c => !c.archived && c.status === 'on-hold').length;
  const total = clients.filter(c => !c.archived).length;
  return (
    <div className="grid grid-cols-4 gap-3">
      {[
        { label: 'Total', value: total, color: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300' },
        { label: 'Active', value: active, color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' },
        { label: 'Completed', value: completed, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
        { label: 'On Hold', value: onHold, color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' },
      ].map(s => (
        <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
          <p className="text-2xl font-black">{s.value}</p>
          <p className="text-xs font-semibold mt-0.5 opacity-75">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

function ClientHealthWidget({ clients }: RendererProps) {
  const counts = useMemo(() => {
    const tally: Record<string, number> = { 'on-track': 0, 'at-risk': 0, 'needs-attention': 0, stalled: 0 };
    clients.filter(c => !c.archived && c.status === 'active').forEach(c => {
      const h = getClientHealth(c);
      if (h) tally[h.status] = (tally[h.status] ?? 0) + 1;
    });
    return tally;
  }, [clients]);

  return (
    <div className="space-y-2">
      {(Object.entries(HEALTH_COLORS) as [keyof typeof HEALTH_COLORS, typeof HEALTH_COLORS[keyof typeof HEALTH_COLORS]][]).map(([status, cfg]) => (
        <div key={status} className="flex items-center gap-3">
          <span className={`w-3 h-3 rounded-full flex-shrink-0 ${cfg.dot}`} />
          <span className="text-sm text-zinc-700 dark:text-zinc-300 flex-1">{cfg.label}</span>
          <span className="text-sm font-bold text-zinc-900 dark:text-white">{counts[status] ?? 0}</span>
        </div>
      ))}
    </div>
  );
}

function TaskCompletionTrendWidget({ clients }: RendererProps) {
  const { completionTrend } = useReports(clients, 30);
  const maxCount = Math.max(...completionTrend.map(t => t.count), 1);
  if (completionTrend.length === 0) return <p className="text-sm text-zinc-400">No task completions yet.</p>;
  return (
    <div className="flex items-end gap-1 h-24 border-b-2 border-zinc-200 dark:border-zinc-700">
      {completionTrend.map(t => (
        <div
          key={t.date}
          title={`${t.date}: ${t.count} tasks`}
          className="flex-1 bg-violet-500 hover:bg-violet-600 transition-colors rounded-t-sm min-w-[4px]"
          style={{ height: `${(t.count / maxCount) * 100}%` }}
        />
      ))}
    </div>
  );
}

function OnboardingVelocityWidget({ clients }: RendererProps) {
  const { velocity, avgVelocity } = useReports(clients, 30);
  const maxV = Math.max(...velocity.map(v => v.days), 1);
  if (velocity.length === 0) return <p className="text-sm text-zinc-400">No completed clients yet.</p>;
  return (
    <div className="space-y-1.5">
      <p className="text-xs text-zinc-500 mb-2">Avg: <strong>{avgVelocity}d</strong></p>
      {velocity.slice(0, 5).map(v => (
        <div key={v.clientName} className="flex items-center gap-2">
          <span className="w-28 text-xs text-zinc-600 dark:text-zinc-400 truncate">{v.clientName}</span>
          <div className="flex-1 h-4 bg-zinc-100 dark:bg-zinc-800 rounded-sm overflow-hidden">
            <div className="h-full bg-violet-500 rounded-sm" style={{ width: `${(v.days / maxV) * 100}%` }} />
          </div>
          <span className="w-10 text-xs text-zinc-500 text-right">{v.days}d</span>
        </div>
      ))}
    </div>
  );
}

function TeamPerformanceWidget({ clients }: RendererProps) {
  const { teamPerformance } = useReports(clients, 30);
  if (teamPerformance.length === 0) return <p className="text-sm text-zinc-400">No team data.</p>;
  return (
    <div className="space-y-2">
      {teamPerformance.slice(0, 5).map(t => (
        <div key={t.member} className="flex items-center gap-2">
          <span className="w-24 text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate">{t.member || 'Unassigned'}</span>
          <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded">{t.completed}</span>
          {t.overdue > 0 && <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold rounded">{t.overdue} od</span>}
        </div>
      ))}
    </div>
  );
}

function PriorityDistributionWidget({ clients }: RendererProps) {
  const active = clients.filter(c => !c.archived);
  const counts: Record<string, number> = { high: 0, medium: 0, low: 0, none: 0 };
  active.forEach(c => { counts[c.priority] = (counts[c.priority] ?? 0) + 1; });
  const total = active.length || 1;
  const colors: Record<string, string> = { high: 'bg-red-500', medium: 'bg-amber-500', low: 'bg-blue-500', none: 'bg-zinc-400' };
  return (
    <div className="space-y-2">
      {Object.entries(counts).map(([p, n]) => (
        <div key={p} className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${colors[p]}`} />
          <span className="text-xs capitalize text-zinc-600 dark:text-zinc-400 flex-1">{p}</span>
          <div className="w-16 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-sm overflow-hidden">
            <div className={`h-full ${colors[p]} rounded-sm`} style={{ width: `${(n / total) * 100}%` }} />
          </div>
          <span className="text-xs text-zinc-700 dark:text-zinc-300 w-4 text-right">{n}</span>
        </div>
      ))}
    </div>
  );
}

function TagDistributionWidget({ clients }: RendererProps) {
  const tagCounts = useMemo(() => {
    const tally: Record<string, number> = {};
    clients.filter(c => !c.archived).forEach(c => {
      (c.tags ?? []).forEach(tag => { tally[tag] = (tally[tag] ?? 0) + 1; });
    });
    return Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [clients]);

  if (tagCounts.length === 0) return <p className="text-sm text-zinc-400">No tags assigned yet.</p>;
  const max = tagCounts[0][1];
  return (
    <div className="space-y-1.5">
      {tagCounts.map(([tag, count]) => (
        <div key={tag} className="flex items-center gap-2">
          <span className="text-xs text-zinc-600 dark:text-zinc-400 flex-1 truncate">{tag}</span>
          <div className="w-16 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-sm overflow-hidden">
            <div className="h-full bg-violet-500 rounded-sm" style={{ width: `${(count / max) * 100}%` }} />
          </div>
          <span className="text-xs text-zinc-700 dark:text-zinc-300 w-4 text-right">{count}</span>
        </div>
      ))}
    </div>
  );
}

function UpcomingRenewalsWidget({ clients }: RendererProps) {
  const renewals = useMemo(() => {
    const now = new Date();
    const sixtyDays = new Date(now.getTime() + 60 * 86400000);
    return clients
      .filter(c => !c.archived && c.account?.renewalDate)
      .map(c => ({
        name: c.name,
        date: c.account!.renewalDate!,
        days: Math.floor((new Date(c.account!.renewalDate!).getTime() - now.getTime()) / 86400000),
      }))
      .filter(r => r.days >= 0 && new Date(r.date) <= sixtyDays)
      .sort((a, b) => a.days - b.days)
      .slice(0, 5);
  }, [clients]);

  if (renewals.length === 0) return <p className="text-sm text-zinc-400">No renewals in the next 60 days.</p>;
  return (
    <div className="space-y-2">
      {renewals.map(r => (
        <div key={r.name} className="flex items-center justify-between">
          <span className="text-sm text-zinc-700 dark:text-zinc-300 truncate flex-1">{r.name}</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${r.days <= 14 ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'}`}>
            {r.days}d
          </span>
        </div>
      ))}
    </div>
  );
}

function ActivityFeedWidget({ clients }: RendererProps) {
  const recent = useMemo(() => {
    return clients
      .filter(c => !c.archived)
      .flatMap(c => (c.activityLog ?? []).slice(-3).map(e => ({ ...e, clientName: c.name })))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 6);
  }, [clients]);

  if (recent.length === 0) return <p className="text-sm text-zinc-400">No recent activity.</p>;
  return (
    <div className="space-y-2">
      {recent.map((e, i) => (
        <div key={i} className="flex items-start gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-snug">{e.description}</p>
            <p className="text-xs text-zinc-400">{e.clientName}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function WebhookDeliveryRateWidget() {
  const { deliveries } = useWebhooks();
  const recent = deliveries.slice(0, 50);
  const success = recent.filter(d => d.status === 'success').length;
  const rate = recent.length > 0 ? Math.round((success / recent.length) * 100) : 0;

  return (
    <div className="text-center py-2">
      <p className="text-4xl font-black text-zinc-900 dark:text-white">{rate}<span className="text-lg">%</span></p>
      <p className="text-xs text-zinc-500 mt-1">Success rate (last {recent.length} deliveries)</p>
      <div className="flex gap-2 justify-center mt-3">
        <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded">{success} ok</span>
        <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold rounded">{recent.length - success} failed</span>
      </div>
    </div>
  );
}

function TaskBottleneckHeatmapWidget({ clients }: RendererProps) {
  const { bottlenecks } = useReports(clients, 90);
  if (bottlenecks.length === 0) return <p className="text-sm text-zinc-400">Not enough data yet. Complete more tasks to see bottlenecks.</p>;
  const maxDays = Math.max(...bottlenecks.map(b => b.avgDays), 1);
  return (
    <div className="space-y-2">
      {bottlenecks.map(b => (
        <div key={b.title} className="flex items-center gap-2">
          <span className="flex-1 text-xs text-zinc-700 dark:text-zinc-300 truncate" title={b.title}>{b.title}</span>
          <div className="w-20 h-3 bg-zinc-100 dark:bg-zinc-800 rounded-sm overflow-hidden">
            <div
              className="h-full rounded-sm transition-all"
              style={{
                width: `${(b.avgDays / maxDays) * 100}%`,
                background: b.avgDays > 14 ? '#ef4444' : b.avgDays > 7 ? '#f59e0b' : '#10b981',
              }}
            />
          </div>
          <span className="text-xs text-zinc-500 w-10 text-right flex-shrink-0">{b.avgDays}d</span>
        </div>
      ))}
    </div>
  );
}

function OnboardingVelocityTrendWidget({ clients }: RendererProps) {
  const { velocityTrend } = useReports(clients, 90);
  if (velocityTrend.length === 0) return <p className="text-sm text-zinc-400">No completed clients yet.</p>;
  const maxDays = Math.max(...velocityTrend.map(v => v.avgDays), 1);
  return (
    <div className="space-y-3">
      <div className="flex items-end gap-1 h-20 border-b-2 border-zinc-200 dark:border-zinc-700">
        {velocityTrend.map(v => (
          <div key={v.month} className="flex-1 flex flex-col items-center gap-0.5" title={`${v.month}: ${v.avgDays}d avg (${v.count} clients)`}>
            <div
              className="w-full bg-violet-500 hover:bg-violet-600 transition-colors rounded-t-sm min-w-[4px]"
              style={{ height: `${(v.avgDays / maxDays) * 100}%` }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-1">
        {velocityTrend.map(v => (
          <div key={v.month} className="flex-1 text-center text-xs text-zinc-400 truncate">{v.month.slice(5)}</div>
        ))}
      </div>
    </div>
  );
}

function PhaseDurationBreakdownWidget({ clients }: RendererProps) {
  const { phaseDurations } = useReports(clients, 90);
  if (phaseDurations.length === 0) return <p className="text-sm text-zinc-400">No phase data yet. Complete phases to see durations.</p>;
  const maxDays = Math.max(...phaseDurations.map(p => p.avgDays), 1);
  return (
    <div className="space-y-2">
      {phaseDurations.map(p => (
        <div key={p.phaseName} className="flex items-center gap-2">
          <span className="flex-1 text-xs text-zinc-700 dark:text-zinc-300 truncate">{p.phaseName}</span>
          <div className="w-20 h-3 bg-zinc-100 dark:bg-zinc-800 rounded-sm overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-sm" style={{ width: `${(p.avgDays / maxDays) * 100}%` }} />
          </div>
          <span className="text-xs text-zinc-500 w-10 text-right flex-shrink-0">{p.avgDays}d</span>
        </div>
      ))}
    </div>
  );
}

export const WIDGET_RENDERERS: Record<WidgetType, React.FC<RendererProps>> = {
  stats_bar:              StatsBarWidget,
  client_health:          ClientHealthWidget,
  task_completion_trend:  TaskCompletionTrendWidget,
  onboarding_velocity:    OnboardingVelocityWidget,
  team_performance:       TeamPerformanceWidget,
  sla_status:             ({ clients, onNavigate }) => <SLAStatusWidget clients={clients} onNavigate={onNavigate} />,
  priority_distribution:  PriorityDistributionWidget,
  tag_distribution:       TagDistributionWidget,
  upcoming_renewals:      UpcomingRenewalsWidget,
  activity_feed:          ActivityFeedWidget,
  webhook_delivery_rate:        WebhookDeliveryRateWidget,
  task_bottleneck_heatmap:      TaskBottleneckHeatmapWidget,
  onboarding_velocity_trend:    OnboardingVelocityTrendWidget,
  phase_duration_breakdown:     PhaseDurationBreakdownWidget,
};
