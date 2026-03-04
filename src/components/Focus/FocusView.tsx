import { useState } from 'react';
import { useFocus } from '../../hooks/useFocus';
import { BudChat } from '../Buds/BudChat';
import { budTemplates } from '../../hooks/useBuds';
import type { Client, Bud } from '../../types';

interface FocusViewProps {
  onSelectClient?: (client: Client) => void;
}

function CountBadge({ count, color = 'bg-red-500' }: { count: number; color?: string }) {
  if (count === 0) return null;
  return (
    <span className={`ml-2 px-2 py-0.5 text-xs font-bold text-white rounded-full ${color}`}>
      {count}
    </span>
  );
}

function RelativeDate({ dateStr }: { dateStr: string }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return <span className="text-red-500">{Math.abs(diff)}d ago</span>;
  if (diff === 0) return <span className="text-red-500">Today</span>;
  if (diff === 1) return <span className="text-yellow-500">Tomorrow</span>;
  return <span className="text-gray-500">{diff}d</span>;
}

// Create a singleton priorities-manager bud for FocusView
const FOCUS_BUD: Bud = {
  ...budTemplates['priorities-manager'],
  id: 'focus-view-risk-bud',
  createdAt: new Date(0).toISOString(),
};

export function FocusView({ onSelectClient }: FocusViewProps) {
  const { overdueTasks, atRiskClients, pendingFollowUps, counts } = useFocus();
  const [riskBudClient, setRiskBudClient] = useState<Client | null>(null);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold gradient-text">Focus Mode</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Your attention, all in one place
        </p>
      </div>

      {counts.overdue === 0 && counts.atRisk === 0 && counts.followUps === 0 && (
        <div className="glass-card p-8 text-center">
          <div className="text-4xl mb-3">✅</div>
          <p className="text-lg font-semibold gradient-text">All clear!</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">No overdue tasks, no clients at risk, no pending follow-ups.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Overdue & Due Today */}
        <div className="glass-card p-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center mb-4">
            <span>⚠️ Overdue Tasks</span>
            <CountBadge count={counts.overdue} />
          </h2>
          {overdueTasks.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No overdue tasks</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {overdueTasks.map(({ task, client, daysOverdue }) => (
                <div
                  key={`${client.id}-${task.id}`}
                  className="glass-subtle p-3 rounded-xl hover:bg-white/60 dark:hover:bg-white/15 transition-all cursor-pointer"
                  onClick={() => onSelectClient?.(client)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{task.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{client.name}</p>
                    </div>
                    <span className="text-xs font-semibold text-red-500 whitespace-nowrap flex-shrink-0">
                      {daysOverdue}d late
                    </span>
                  </div>
                  {task.dueDate && (
                    <p className="text-[10px] text-gray-400 mt-1">Due {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Column 2: Clients Needing Attention */}
        <div className="glass-card p-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center mb-4">
            <span>🚨 Needs Attention</span>
            <CountBadge count={counts.atRisk} color="bg-amber-500" />
          </h2>
          {atRiskClients.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">All clients on track</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {atRiskClients.map(({ client, reasons }) => (
                <div
                  key={client.id}
                  className="glass-subtle p-3 rounded-xl hover:bg-white/60 dark:hover:bg-white/15 transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{client.name}</p>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => setRiskBudClient(client)}
                        title="Ask AI why this client is at risk"
                        className="text-xs px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors"
                      >
                        🧠
                      </button>
                      <button
                        onClick={() => onSelectClient?.(client)}
                        className="text-xs text-purple-500 hover:text-purple-700 dark:hover:text-purple-300 whitespace-nowrap"
                      >
                        View →
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {reasons.map(r => (
                      <span key={r} className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Column 3: Pending Follow-ups */}
        <div className="glass-card p-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center mb-4">
            <span>🔔 Pending Follow-ups</span>
            <CountBadge count={counts.followUps} color="bg-blue-500" />
          </h2>
          {pendingFollowUps.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No pending follow-ups</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {pendingFollowUps.map(({ entry, client }) => (
                <div
                  key={`${client.id}-${entry.id}`}
                  className="glass-subtle p-3 rounded-xl hover:bg-white/60 dark:hover:bg-white/15 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{entry.subject}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{client.name}</p>
                    </div>
                    {entry.followUpDate && (
                      <span className="text-xs flex-shrink-0">
                        <RelativeDate dateStr={entry.followUpDate} />
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-gray-400">{entry.type}</span>
                    <button
                      onClick={() => onSelectClient?.(client)}
                      className="text-xs text-purple-500 hover:text-purple-700 dark:hover:text-purple-300"
                    >
                      View client →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {riskBudClient && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-6 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-md shadow-2xl rounded-2xl overflow-hidden">
            <BudChat
              bud={FOCUS_BUD}
              initialClient={riskBudClient}
              onClose={() => setRiskBudClient(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
