import { useState, lazy, Suspense } from 'react';
import { useClientContext } from '../../context/ClientContext';
import { useReports } from '../../hooks/useReports';
import { exportOnboardingStatusReport } from '../../utils/export';
import { Button } from '../UI/Button';
import { HEALTH_COLORS } from '../../utils/clientHealth';

const ReportBuilder = lazy(() => import('./ReportBuilder').then(m => ({ default: m.ReportBuilder })));

type ReportTab = 'overview' | 'builder';

type SortKey = 'name' | 'healthStatus' | 'pctDone' | 'daysActive' | 'priority';
type SortDir = 'asc' | 'desc';

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2, none: 3 };

export function ReportView() {
  const { clients } = useClientContext();
  const [reportTab, setReportTab] = useState<ReportTab>('overview');
  const [trendDays, setTrendDays] = useState<7 | 30 | 90>(30);
  const [sortKey, setSortKey] = useState<SortKey>('pctDone');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const { velocity, avgVelocity, completionTrend, clientProgress, teamPerformance } =
    useReports(clients, trendDays);

  const maxVelocity = Math.max(...velocity.map((v) => v.days), 1);
  const maxTrend = Math.max(...completionTrend.map((t) => t.count), 1);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sorted = [...clientProgress].sort((a, b) => {
    let cmp = 0;
    if (sortKey === 'name') cmp = a.name.localeCompare(b.name);
    else if (sortKey === 'pctDone') cmp = a.pctDone - b.pctDone;
    else if (sortKey === 'daysActive') cmp = a.daysActive - b.daysActive;
    else if (sortKey === 'priority')
      cmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    else if (sortKey === 'healthStatus')
      cmp = (a.healthStatus ?? 'z').localeCompare(b.healthStatus ?? 'z');
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const SortBtn = ({ col, label }: { col: SortKey; label: string }) => (
    <button
      onClick={() => handleSort(col)}
      className="flex items-center gap-1 font-bold text-white hover:text-yellow-400 transition-colors"
    >
      {label}
      {sortKey === col && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
    </button>
  );

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black font-display text-zinc-900 dark:text-white">
            Reports
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Onboarding analytics at a glance
          </p>
        </div>
        {reportTab === 'overview' && (
          <Button onClick={() => exportOnboardingStatusReport(clients)}>Export PDF</Button>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b-2 border-zinc-200 dark:border-zinc-700">
        {([['overview', 'Overview'], ['builder', 'Builder']] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setReportTab(id)}
            className={`px-4 py-2 text-sm font-bold transition-colors border-b-2 -mb-[2px] ${
              reportTab === id
                ? 'border-zinc-900 dark:border-white text-zinc-900 dark:text-white'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {reportTab === 'builder' && (
        <Suspense fallback={<div className="py-16 text-center text-sm text-zinc-400">Loading builder…</div>}>
          <ReportBuilder />
        </Suspense>
      )}

      {reportTab === 'overview' && (
      <div className="space-y-10">

      {/* 1. Onboarding Velocity */}
      <section>
        <h2 className="text-lg font-black font-display mb-1 text-zinc-900 dark:text-white">
          Onboarding Velocity
        </h2>
        <p className="text-xs text-zinc-500 mb-4">
          Days from creation to completion · Avg:{' '}
          <strong>{avgVelocity} days</strong>
        </p>
        {velocity.length === 0 ? (
          <p className="text-sm text-zinc-400">No completed clients yet.</p>
        ) : (
          <div className="space-y-2">
            {velocity.map((v) => (
              <div key={v.clientName} className="flex items-center gap-3">
                <span className="w-32 text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate">
                  {v.clientName}
                </span>
                <div className="flex-1 h-5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-[2px] relative overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-[2px] progress-bar"
                    style={{ width: `${(v.days / maxVelocity) * 100}%` }}
                  />
                  <div
                    className="absolute top-0 bottom-0 w-[2px] bg-red-500 opacity-60"
                    style={{ left: `${(avgVelocity / maxVelocity) * 100}%` }}
                  />
                </div>
                <span className="w-14 text-xs text-zinc-500 text-right">{v.days}d</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 2. Task Completion Trend */}
      <section>
        <div className="flex items-center gap-4 mb-4">
          <h2 className="text-lg font-black font-display text-zinc-900 dark:text-white">
            Task Completion Trend
          </h2>
          <div className="flex gap-1">
            {([7, 30, 90] as const).map((d) => (
              <button
                key={d}
                onClick={() => setTrendDays(d)}
                className={`px-3 py-1 text-xs font-bold border-2 rounded-[4px] transition-colors ${
                  trendDays === d
                    ? 'bg-yellow-400 border-zinc-900 text-zinc-900'
                    : 'border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-400 hover:border-zinc-500'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
        {completionTrend.length === 0 ? (
          <p className="text-sm text-zinc-400">No task completions recorded yet.</p>
        ) : (
          <div className="flex items-end gap-1 h-28 border-b-2 border-zinc-300 dark:border-zinc-700">
            {completionTrend.map((t) => (
              <div
                key={t.date}
                title={`${t.date}: ${t.count} tasks`}
                className="flex-1 bg-yellow-400 hover:bg-yellow-500 transition-colors rounded-t-[2px] min-w-[4px] progress-bar"
                style={{ height: `${(t.count / maxTrend) * 100}%` }}
              />
            ))}
          </div>
        )}
      </section>

      {/* 3. Client Progress Table */}
      <section>
        <h2 className="text-lg font-black font-display mb-4 text-zinc-900 dark:text-white">
          Client Progress
        </h2>
        {sorted.length === 0 ? (
          <p className="text-sm text-zinc-400">No active clients.</p>
        ) : (
          <div className="border-2 border-zinc-900 dark:border-zinc-600 rounded-[4px] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-zinc-900 dark:bg-zinc-700 text-white">
                <tr>
                  <th className="px-4 py-2 text-left">
                    <SortBtn col="name" label="Client" />
                  </th>
                  <th className="px-4 py-2 text-left">
                    <SortBtn col="healthStatus" label="Health" />
                  </th>
                  <th className="px-4 py-2 text-left">
                    <SortBtn col="pctDone" label="% Done" />
                  </th>
                  <th className="px-4 py-2 text-left">
                    <SortBtn col="daysActive" label="Days Active" />
                  </th>
                  <th className="px-4 py-2 text-left">
                    <SortBtn col="priority" label="Priority" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((row, i) => (
                  <tr
                    key={row.id}
                    className={`border-t border-zinc-200 dark:border-zinc-700 ${
                      i % 2 === 0 ? 'bg-white dark:bg-zinc-900' : 'bg-zinc-50 dark:bg-zinc-800'
                    }`}
                  >
                    <td className="px-4 py-2 font-medium text-zinc-900 dark:text-white">
                      {row.name}
                    </td>
                    <td className="px-4 py-2">
                      {row.healthStatus ? (
                        <span
                          className={`px-2 py-0.5 rounded-[4px] text-xs font-bold ${
                            HEALTH_COLORS[row.healthStatus].badge
                          }`}
                        >
                          {HEALTH_COLORS[row.healthStatus].label}
                        </span>
                      ) : (
                        <span className="text-zinc-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-400 progress-bar"
                            style={{ width: `${row.pctDone}%` }}
                          />
                        </div>
                        <span className="text-xs text-zinc-600 dark:text-zinc-400">
                          {row.pctDone}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">
                      {row.daysActive}d
                    </td>
                    <td className="px-4 py-2">
                      {row.priority !== 'none' ? (
                        <span className="capitalize text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          {row.priority}
                        </span>
                      ) : (
                        <span className="text-zinc-400 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 4. Team Performance */}
      <section>
        <h2 className="text-lg font-black font-display mb-4 text-zinc-900 dark:text-white">
          Team Performance{' '}
          <span className="text-sm font-normal text-zinc-500">(last 30 days)</span>
        </h2>
        {teamPerformance.length === 0 ? (
          <p className="text-sm text-zinc-400">No team data yet.</p>
        ) : (
          <div className="space-y-3">
            {teamPerformance.map((t) => (
              <div
                key={t.member}
                className="flex items-center gap-4 border-2 border-zinc-200 dark:border-zinc-700 rounded-[4px] px-4 py-3"
              >
                <span className="w-32 text-sm font-bold text-zinc-900 dark:text-white truncate">
                  {t.member || 'Unassigned'}
                </span>
                <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-[4px]">
                  {t.completed} completed
                </span>
                {t.overdue > 0 && (
                  <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 text-xs font-bold rounded-[4px]">
                    {t.overdue} overdue
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
      </div>
      )}
    </div>
  );
}
