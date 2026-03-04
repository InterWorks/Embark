import type { Client, ChecklistItem } from '../../types';

interface TaskWithClient {
  task: ChecklistItem;
  client: Client;
}

interface DayTasksProps {
  date: string;
  clients: Client[];
  onToggleTask: (clientId: string, taskId: string) => void;
  onCreateTimeBlockFromTask: (task: ChecklistItem, client: Client) => void;
}

export function DayTasks({
  date,
  clients,
  onToggleTask,
  onCreateTimeBlockFromTask,
}: DayTasksProps) {
  // Get all tasks due on this date from all clients
  const tasksForDate: TaskWithClient[] = [];

  clients
    .filter((c) => !c.archived)
    .forEach((client) => {
      client.checklist.forEach((task) => {
        if (task.dueDate === date) {
          tasksForDate.push({ task, client });
        }
      });
    });

  // Sort by completion status, then by client name
  const sortedTasks = tasksForDate.sort((a, b) => {
    if (a.task.completed !== b.task.completed) {
      return a.task.completed ? 1 : -1;
    }
    return a.client.name.localeCompare(b.client.name);
  });

  const completedCount = sortedTasks.filter((t) => t.task.completed).length;

  if (sortedTasks.length === 0) {
    return (
      <div className="py-4 text-center text-gray-500 dark:text-gray-400 text-sm">
        No tasks due on this day
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Tasks Due
        </h4>
        <span className="text-xs text-gray-400">
          {completedCount}/{sortedTasks.length} completed
        </span>
      </div>

      <div className="space-y-1">
        {sortedTasks.map(({ task, client }) => (
          <div
            key={`${client.id}-${task.id}`}
            className="group flex items-start gap-2 p-2 rounded-lg hover:bg-white/30 dark:hover:bg-white/5 transition-colors"
          >
            {/* Checkbox */}
            <button
              onClick={() => onToggleTask(client.id, task.id)}
              className={`flex-shrink-0 w-5 h-5 mt-0.5 rounded border-2 transition-colors flex items-center justify-center ${
                task.completed
                  ? 'bg-green-500 border-green-500'
                  : 'border-gray-300 dark:border-gray-600 hover:border-green-500'
              }`}
            >
              {task.completed && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>

            {/* Task Details */}
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm ${
                  task.completed
                    ? 'text-gray-400 line-through'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {task.title}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {client.name}
              </p>
            </div>

            {/* Quick Actions */}
            {!task.completed && (
              <button
                onClick={() => onCreateTimeBlockFromTask(task, client)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition-all"
                title="Create time block for this task"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
