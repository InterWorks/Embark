import { useState } from 'react';
import type { Client } from '../../types';
import type { ClientSLAStatus } from '../../types/sla';
import { useAIRiskBrief, type RiskTier } from '../../hooks/useAIRiskBrief';
import { formatRelativeTime } from '../../utils/helpers';
import type { HealthSnapshot } from '../../hooks/useHealthHistory';
import { computeChurnRisk } from '../../hooks/useChurnRisk';

interface AIRiskBriefProps {
  client: Client;
  slaStatuses: ClientSLAStatus[];
  sparklineSnapshots?: HealthSnapshot[];
}

const tierStyles: Record<RiskTier, { badge: string; label: string; pulse?: boolean }> = {
  Low:      { badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', label: 'Low Risk' },
  Medium:   { badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',         label: 'Medium Risk' },
  High:     { badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',     label: 'High Risk' },
  Critical: { badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',                 label: 'Critical', pulse: true },
};

export function AIRiskBrief({ client, slaStatuses, sparklineSnapshots }: AIRiskBriefProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { brief, riskTier, generatedAt, isLoading, error, refresh } = useAIRiskBrief(client, slaStatuses);
  const tierStyle = tierStyles[riskTier];

  const churnRisk = sparklineSnapshots && sparklineSnapshots.length >= 2
    ? computeChurnRisk(sparklineSnapshots, sparklineSnapshots[sparklineSnapshots.length - 1].score)
    : null;

  // Strip the [TIER: X] prefix from display
  const displayBrief = brief.replace(/^\[TIER:\s*\w+\]\s*/i, '').trim();

  return (
    <div className="glass-card p-4 rounded-xl">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🎯</span>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">AI Risk Brief</span>
          {brief && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${tierStyle.badge} ${tierStyle.pulse ? 'animate-pulse' : ''}`}>
              {tierStyle.label}
            </span>
          )}
          {churnRisk && churnRisk.level !== 'stable' && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${churnRisk.color}`}>
              {churnRisk.label}
            </span>
          )}
          {generatedAt && (
            <span className="text-xs text-gray-400 dark:text-gray-500">· {formatRelativeTime(generatedAt)}</span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="mt-3">
          {isLoading ? (
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm py-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Analyzing risks...
            </div>
          ) : error ? (
            <div className="text-sm text-red-500 dark:text-red-400 py-1">{error}</div>
          ) : displayBrief ? (
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{displayBrief}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">Click Analyze to generate a risk brief.</p>
          )}
          <button
            onClick={refresh}
            disabled={isLoading}
            className="mt-3 text-xs font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors disabled:opacity-50"
          >
            ↻ {displayBrief ? 'Refresh' : 'Analyze'}
          </button>
        </div>
      )}
    </div>
  );
}
