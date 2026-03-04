import { useMemo } from 'react';
import type { Client } from '../../types';
import { useClientContext } from '../../context/ClientContext';

interface TimelineViewProps {
  clients: Client[];
  onSelectClient: (client: Client) => void;
}

interface TimelineTask {
  clientId: string;
  clientName: string;
  taskId: string;
  taskTitle: string;
  dueDate: string;
  completed: boolean;
}

export function TimelineView({ clients, onSelectClient }: TimelineViewProps) {
  const { toggleChecklistItem } = useClientContext();

  const tasks = useMemo(() => {
    const allTasks: TimelineTask[] = [];
    clients.forEach((client) => {
      client.checklist.forEach((task) => {
        if (task.dueDate) {
          allTasks.push({
            clientId: client.id,
            clientName: client.name,
            taskId: task.id,
            taskTitle: task.title,
            dueDate: task.dueDate,
            completed: task.completed,
          });
        }
      });
    });
    return allTasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [clients]);

  const groupedTasks = useMemo(() => {
    const groups: Record<string, TimelineTask[]> = {};
    tasks.forEach((task) => {
      if (!groups[task.dueDate]) {
        groups[task.dueDate] = [];
      }
      groups[task.dueDate].push(task);
    });
    return groups;
  }, [tasks]);

  const today = new Date(new Date().toDateString()).toISOString().split('T')[0];

  const formatDateHeader = (dateString: string): string => {
    const date = new Date(dateString);
    const todayDate = new Date(new Date().toDateString());
    const tomorrow = new Date(todayDate.getTime() + 24 * 60 * 60 * 1000);
    const yesterday = new Date(todayDate.getTime() - 24 * 60 * 60 * 1000);

    if (date.toDateString() === todayDate.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  const isOverdue = (dateString: string): boolean => {
    return dateString < today;
  };

  const isToday = (dateString: string): boolean => {
    return dateString === today;
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-16 glass-card">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
          <svg
            className="h-7 w-7 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-medium gradient-text">
          No tasks with due dates
        </h3>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Add due dates to your checklist items to see them here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedTasks).map(([date, dateTasks]) => (
        <div key={date}>
          <div className="flex items-center gap-3 mb-3">
            <div
              className={`
                w-3 h-3 rounded-full
                ${isOverdue(date) && !dateTasks.every((t) => t.completed) ? 'bg-red-500' : ''}
                ${isToday(date) ? 'bg-blue-500' : ''}
                ${!isOverdue(date) && !isToday(date) ? 'bg-gray-300 dark:bg-gray-600' : ''}
              `}
            />
            <h3
              className={`
                font-semibold
                ${isOverdue(date) && !dateTasks.every((t) => t.completed) ? 'text-red-600 dark:text-red-400' : ''}
                ${isToday(date) ? 'text-blue-600 dark:text-blue-400' : ''}
                ${!isOverdue(date) && !isToday(date) ? 'text-gray-700 dark:text-gray-300' : ''}
              `}
            >
              {formatDateHeader(date)}
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {dateTasks.filter((t) => t.completed).length}/{dateTasks.length} done
            </span>
          </div>

          <div className="ml-1.5 pl-5 border-l-2 border-white/30 dark:border-white/10 space-y-2">
            {dateTasks.map((task) => {
              const client = clients.find((c) => c.id === task.clientId);
              return (
                <div
                  key={`${task.clientId}-${task.taskId}`}
                  className={`
                    flex items-center gap-3 p-3 rounded-xl transition-all
                    ${task.completed ? 'glass-subtle opacity-70' : 'glass'}
                    ${isOverdue(date) && !task.completed ? 'border-l-4 border-l-red-500' : ''}
                  `}
                >
                  <button
                    onClick={() => toggleChecklistItem(task.clientId, task.taskId)}
                    className={`
                      flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                      ${
                        task.completed
                          ? 'bg-gradient-to-r from-emerald-400 to-green-500 border-transparent text-white shadow-lg shadow-green-500/25'
                          : 'border-gray-300 dark:border-gray-500 hover:border-purple-500'
                      }
                    `}
                  >
                    {task.completed && (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`
                        font-medium truncate
                        ${task.completed ? 'line-through text-gray-400' : 'text-gray-900 dark:text-gray-100'}
                      `}
                    >
                      {task.taskTitle}
                    </p>
                    <p
                      className="text-sm text-gray-500 dark:text-gray-400 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                      onClick={() => client && onSelectClient(client)}
                    >
                      {task.clientName}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
