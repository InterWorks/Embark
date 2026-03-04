import type { HealthScore } from '../../utils/healthScore';

interface HealthScoreBreakdownProps {
  score: HealthScore;
}

function ScoreBar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="w-20 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full ${color}`}
        style={{ width: `${(value / max) * 100}%` }}
      />
    </div>
  );
}

export function HealthScoreBreakdown({ score }: HealthScoreBreakdownProps) {
  const rows = [
    { label: 'Task Completion', value: score.breakdown.taskCompletion, max: 40, color: 'bg-violet-500' },
    { label: 'SLA Status',      value: score.breakdown.slaStatus,       max: 20, color: 'bg-blue-500' },
    { label: 'Communication',   value: score.breakdown.communicationRecency, max: 20, color: 'bg-emerald-500' },
    { label: 'Not Blocked',     value: score.breakdown.blockedTasks,    max: 20, color: 'bg-amber-500' },
  ];

  return (
    <div className="glass-strong rounded-xl shadow-lg p-4 w-56 border border-white/30 dark:border-white/10">
      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
        Health Breakdown
      </p>
      <div className="space-y-2.5">
        {rows.map(row => (
          <div key={row.label} className="flex items-center justify-between gap-2">
            <span className="text-xs text-gray-600 dark:text-gray-300 flex-1 truncate">{row.label}</span>
            <ScoreBar value={row.value} max={row.max} color={row.color} />
            <span className="text-xs font-bold text-gray-700 dark:text-gray-200 w-8 text-right">
              {row.value}/{row.max}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-white/20 dark:border-white/10 flex justify-between items-center">
        <span className="text-xs font-bold text-gray-700 dark:text-gray-200">Total</span>
        <span className="text-sm font-black text-gray-900 dark:text-white">{score.total}/100</span>
      </div>
    </div>
  );
}
