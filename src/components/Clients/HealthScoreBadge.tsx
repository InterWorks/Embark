import { useState } from 'react';
import type { HealthScore } from '../../utils/healthScore';
import { HealthScoreBreakdown } from './HealthScoreBreakdown';

interface HealthScoreBadgeProps {
  score: HealthScore;
}

const LABEL_COLORS: Record<HealthScore['label'], string> = {
  excellent: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
  good:      'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700',
  'at-risk': 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700',
  critical:  'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700',
};

const LABEL_TEXT: Record<HealthScore['label'], string> = {
  excellent: 'Excellent',
  good: 'Good',
  'at-risk': 'At Risk',
  critical: 'Critical',
};

export function HealthScoreBadge({ score }: HealthScoreBadgeProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onClick={(e) => { e.stopPropagation(); setShowBreakdown(!showBreakdown); }}
        className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border transition-all hover:opacity-80 ${LABEL_COLORS[score.label]}`}
        title="Health Score — click for breakdown"
      >
        <span className="font-black">{score.total}</span>
        <span>{LABEL_TEXT[score.label]}</span>
      </button>
      {showBreakdown && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowBreakdown(false)} />
          <div className="absolute left-0 top-8 z-20">
            <HealthScoreBreakdown score={score} />
          </div>
        </>
      )}
    </div>
  );
}
