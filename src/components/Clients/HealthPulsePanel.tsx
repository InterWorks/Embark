import { useState } from 'react';
import type { Client } from '../../types';
import type { ClientSLAStatus } from '../../types/sla';
import { useHealthPulse } from '../../hooks/useHealthPulse';
import { formatRelativeTime } from '../../utils/helpers';

interface HealthPulsePanelProps {
  client: Client;
  slaStatuses: ClientSLAStatus[];
}

export function HealthPulsePanel({ client, slaStatuses }: HealthPulsePanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { pulse, generatedAt, isLoading, error, refresh } = useHealthPulse(client, slaStatuses);

  return (
    <div className="glass-card p-4 rounded-xl">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🩺</span>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">AI Health Pulse</span>
          {generatedAt && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              · {formatRelativeTime(generatedAt)}
            </span>
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
              Generating pulse...
            </div>
          ) : error ? (
            <div className="text-sm text-red-500 dark:text-red-400 py-1">{error}</div>
          ) : pulse ? (
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{pulse}</p>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">Click Refresh to generate a health pulse.</p>
          )}
          <button
            onClick={refresh}
            disabled={isLoading}
            className="mt-3 text-xs font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors disabled:opacity-50"
          >
            ↻ Refresh
          </button>
        </div>
      )}
    </div>
  );
}
