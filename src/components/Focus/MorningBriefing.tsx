import { useState, useEffect } from 'react';
import { useFocus } from '../../hooks/useFocus';
import { subscribe } from '../../events/appEvents';
import type { AppEvent } from '../../events/appEvents';

const BRIEFING_KEY = 'embark_briefing_date';

export function MorningBriefing() {
  const [visible, setVisible] = useState(false);
  const [healthAlerts, setHealthAlerts] = useState<Array<{ clientName: string; healthStatus: string }>>([]);
  const { counts } = useFocus();

  // Subscribe to health drop events
  useEffect(() => {
    return subscribe((event: AppEvent) => {
      if (event.type === 'client_health_drop') {
        setHealthAlerts(prev => [...prev, { clientName: event.clientName, healthStatus: event.healthStatus }]);
      }
    });
  }, []);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const lastShown = localStorage.getItem(BRIEFING_KEY);
    if (lastShown !== today) {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(BRIEFING_KEY, today);
    setVisible(false);
  };

  if (!visible) return null;
  if (counts.overdue === 0 && counts.atRisk === 0 && counts.followUpsThisWeek === 0) {
    // Still dismiss for today even if nothing to show
    return null;
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <div className="glass-strong rounded-2xl shadow-2xl border border-white/30 dark:border-white/10 p-5 max-w-sm w-[calc(100vw-2rem)]">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="text-sm font-bold gradient-text">Good morning! Here's your briefing</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button
            onClick={dismiss}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {healthAlerts.length > 0 && (
          <div className="mb-3 space-y-1.5">
            {healthAlerts.map((alert, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 bg-red-100 dark:bg-red-900/30 rounded-xl text-xs">
                <span className="text-red-600 dark:text-red-400">⚠️</span>
                <span className="text-red-700 dark:text-red-300 font-medium">
                  {alert.clientName} health dropped to {alert.healthStatus}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2 mb-4">
          {counts.overdue > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {counts.overdue}
              </span>
              <span className="text-gray-700 dark:text-gray-300">overdue task{counts.overdue !== 1 ? 's' : ''}</span>
            </div>
          )}
          {counts.atRisk > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {counts.atRisk}
              </span>
              <span className="text-gray-700 dark:text-gray-300">client{counts.atRisk !== 1 ? 's' : ''} need{counts.atRisk === 1 ? 's' : ''} attention</span>
            </div>
          )}
          {counts.followUpsThisWeek > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {counts.followUpsThisWeek}
              </span>
              <span className="text-gray-700 dark:text-gray-300">follow-up{counts.followUpsThisWeek !== 1 ? 's' : ''} due this week</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={dismiss}
            className="flex-1 px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:opacity-90 transition-opacity shadow-lg"
          >
            Go to Focus
          </button>
          <button
            onClick={dismiss}
            className="px-4 py-2 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
