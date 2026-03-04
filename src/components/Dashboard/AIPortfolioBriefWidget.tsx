import { useClientContext } from '../../context/ClientContext';
import { usePortfolioIntelligence } from '../../hooks/usePortfolioIntelligence';
import { formatRelativeTime } from '../../utils/helpers';

import type { Client } from '../../types';

interface AIPortfolioBriefWidgetProps {
  onSelectClient?: (client: Client) => void;
}

export function AIPortfolioBriefWidget({ onSelectClient }: AIPortfolioBriefWidgetProps) {
  const { clients } = useClientContext();
  const { intelligence, isLoading, error, analyze } = usePortfolioIntelligence(clients);

  return (
    <div className="glass-card p-5 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🧠</span>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">AI Portfolio Brief</h3>
        </div>
        <div className="flex items-center gap-2">
          {intelligence?.generatedAt && (
            <span className="text-xs text-gray-400">{formatRelativeTime(intelligence.generatedAt)}</span>
          )}
          <button
            onClick={analyze}
            disabled={isLoading}
            className="text-xs px-3 py-1.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Analyzing...' : 'Run Analysis'}
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-gray-500 text-sm py-4">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Analyzing portfolio...
        </div>
      )}

      {error && <p className="text-sm text-red-500 py-2">{error}</p>}

      {intelligence && !isLoading && (
        <div className="space-y-4">
          {intelligence.narrative && (
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{intelligence.narrative}</p>
          )}

          {intelligence.atRiskClients.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Top At-Risk Clients</p>
              {intelligence.atRiskClients.slice(0, 3).map((c, i) => (
                <div key={i} className="glass-subtle rounded-xl p-3">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <button
                      onClick={() => { const cl = clients.find(x => x.id === c.clientId); if (cl) onSelectClient?.(cl); }}
                      className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:text-purple-600 dark:hover:text-purple-400 text-left"
                    >
                      {c.name}
                    </button>
                    <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full font-medium shrink-0">
                      At Risk
                    </span>
                  </div>
                  <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5 mb-2">
                    {c.reasons.map((r, ri) => <li key={ri}>• {r}</li>)}
                  </ul>
                  <p className="text-xs font-medium text-purple-600 dark:text-purple-400">→ {c.recommendedPlay}</p>
                </div>
              ))}
            </div>
          )}

          {intelligence.atRiskClients.length === 0 && (
            <div className="text-center py-4">
              <span className="text-2xl">✅</span>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-1">Portfolio looks healthy!</p>
              <p className="text-xs text-gray-400 mt-0.5">No clients flagged as at-risk.</p>
            </div>
          )}
        </div>
      )}

      {!intelligence && !isLoading && !error && (
        <div className="text-center py-6 text-gray-400">
          <span className="text-3xl">🧠</span>
          <p className="text-sm mt-2">Click "Run Analysis" to get AI insights on your portfolio.</p>
        </div>
      )}
    </div>
  );
}
