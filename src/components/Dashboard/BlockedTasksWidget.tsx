import type { Client, ChecklistItem } from '../../types';

interface BlockedTask {
  client: Client;
  item: ChecklistItem;
  daysBlocked: number;
}

interface BlockedTasksWidgetProps {
  clients: Client[];
  onClientClick?: (client: Client) => void;
}

function daysAgo(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

const BLOCKED_BY_COLORS: Record<string, string> = {
  client: 'bg-indigo-500/20 text-indigo-400',
  internal: 'bg-amber-500/20 text-amber-400',
  external: 'bg-gray-500/20 text-gray-400',
};

export function BlockedTasksWidget({ clients, onClientClick }: BlockedTasksWidgetProps) {
  const blockedTasks: BlockedTask[] = [];

  clients.forEach((c) => {
    if (c.archived || c.status === 'completed') return;
    c.checklist
      .filter((item) => item.isBlocked && !item.completed)
      .forEach((item) => {
        // Use last activity log entry as a proxy for when it was blocked
        const lastActivity = c.activityLog[c.activityLog.length - 1];
        const daysBlocked = lastActivity ? daysAgo(lastActivity.timestamp) : 0;
        blockedTasks.push({ client: c, item, daysBlocked });
      });
  });

  if (blockedTasks.length === 0) return null;

  const sorted = [...blockedTasks].sort((a, b) => b.daysBlocked - a.daysBlocked).slice(0, 10);

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Blocked Tasks
        </h3>
        <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-400">
          {blockedTasks.length}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-400 dark:text-gray-500 border-b border-white/10 dark:border-white/5">
              <th className="text-left pb-2 font-medium">Client</th>
              <th className="text-left pb-2 font-medium">Task</th>
              <th className="text-left pb-2 font-medium">Blocked by</th>
              <th className="text-left pb-2 font-medium">Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 dark:divide-white/5">
            {sorted.map(({ client, item }) => (
              <tr
                key={`${client.id}-${item.id}`}
                onClick={() => onClientClick?.(client)}
                className={`transition-colors ${onClientClick ? 'cursor-pointer hover:bg-white/10 dark:hover:bg-white/5' : ''}`}
              >
                <td className="py-2 pr-3 font-medium text-gray-700 dark:text-gray-300 max-w-[120px] truncate">
                  {client.name}
                </td>
                <td className="py-2 pr-3 text-gray-600 dark:text-gray-400 max-w-[160px] truncate">
                  {item.title}
                </td>
                <td className="py-2 pr-3">
                  {item.blockedBy ? (
                    <span className={`px-2 py-0.5 rounded-full font-semibold capitalize ${BLOCKED_BY_COLORS[item.blockedBy] || 'bg-gray-500/20 text-gray-400'}`}>
                      {item.blockedBy}
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="py-2 text-gray-500 dark:text-gray-400 max-w-[180px] truncate">
                  {item.blockReason || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
