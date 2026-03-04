import { useState, useMemo, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Client, ChecklistItem } from '../../types';

interface GanttViewProps {
  clients: Client[];
  onClientClick: (client: Client) => void;
}

interface GanttTask {
  id: string;
  clientId: string;
  clientName: string;
  task: ChecklistItem;
  startDate: Date;
  endDate: Date;
  dependsOn?: string[];
}

const DAY_WIDTH = 40;
const ROW_HEIGHT = 36;
const HEADER_HEIGHT = 60;
const CLIENT_COL_WIDTH = 200;

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function daysBetween(start: Date, end: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round((end.getTime() - start.getTime()) / oneDay);
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getStatusColor(completed: boolean, isOverdue: boolean): string {
  if (completed) return 'bg-gradient-to-r from-emerald-400 to-green-500';
  if (isOverdue) return 'bg-gradient-to-r from-red-400 to-rose-500';
  return 'bg-gradient-to-r from-indigo-500 to-purple-500';
}

export function GanttView({ clients, onClientClick }: GanttViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);

  // Build flat list of tasks with dates
  const { tasks, dateRange, totalDays } = useMemo(() => {
    const allTasks: GanttTask[] = [];
    let minDate = new Date();
    let maxDate = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Default range: 2 weeks before and 6 weeks after today
    minDate = addDays(today, -14);
    maxDate = addDays(today, 42);

    clients.forEach((client) => {
      client.checklist.forEach((item) => {
        const startDate = item.startDate
          ? new Date(item.startDate)
          : new Date(client.createdAt);
        const endDate = item.dueDate
          ? new Date(item.dueDate)
          : addDays(startDate, 7); // Default 7 day duration

        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);

        allTasks.push({
          id: `${client.id}-${item.id}`,
          clientId: client.id,
          clientName: client.name,
          task: item,
          startDate,
          endDate,
          dependsOn: item.dependsOn?.map((depId) => `${client.id}-${depId}`),
        });

        // Expand date range if needed
        if (startDate < minDate) minDate = new Date(startDate);
        if (endDate > maxDate) maxDate = new Date(endDate);
      });
    });

    // Add some padding to date range
    minDate = addDays(minDate, -3);
    maxDate = addDays(maxDate, 7);

    const days = daysBetween(minDate, maxDate);

    return {
      tasks: allTasks,
      dateRange: { start: minDate, end: maxDate },
      totalDays: days,
    };
  }, [clients]);

  // Group tasks by client
  const tasksByClient = useMemo(() => {
    const grouped = new Map<string, GanttTask[]>();
    tasks.forEach((task) => {
      const existing = grouped.get(task.clientId) || [];
      existing.push(task);
      grouped.set(task.clientId, existing);
    });
    return grouped;
  }, [tasks]);

  // Generate date headers
  const dateHeaders = useMemo(() => {
    const headers: { date: Date; isToday: boolean; isWeekend: boolean }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i <= totalDays; i++) {
      const date = addDays(dateRange.start, i);
      const dayOfWeek = date.getDay();
      headers.push({
        date,
        isToday: date.getTime() === today.getTime(),
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      });
    }
    return headers;
  }, [dateRange.start, totalDays]);

  // Calculate task position
  const getTaskPosition = (task: GanttTask) => {
    const startOffset = daysBetween(dateRange.start, task.startDate);
    const duration = Math.max(1, daysBetween(task.startDate, task.endDate));
    return {
      left: startOffset * DAY_WIDTH,
      width: duration * DAY_WIDTH - 4,
    };
  };

  // Scroll to today on mount
  useEffect(() => {
    if (containerRef.current) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const daysFromStart = daysBetween(dateRange.start, today);
      const scrollPosition = Math.max(0, daysFromStart * DAY_WIDTH - 200);
      containerRef.current.scrollLeft = scrollPosition;
    }
  }, [dateRange.start]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate total rows
  let totalRows = 0;
  tasksByClient.forEach((clientTasks) => {
    totalRows += clientTasks.length;
  });

  if (clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <svg
          className="w-16 h-16 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 6h16M4 12h10M4 18h14"
          />
        </svg>
        <p className="text-lg font-medium">No clients to display</p>
        <p className="text-sm">Add clients with checklist items to see the Gantt chart</p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <svg
          className="w-16 h-16 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <p className="text-lg font-medium">No tasks to display</p>
        <p className="text-sm">Add checklist items to your clients to see them here</p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="flex">
        {/* Fixed left column - Client names */}
        <div
          className="flex-shrink-0 border-r border-white/20 dark:border-white/10 bg-white/30 dark:bg-white/5"
          style={{ width: CLIENT_COL_WIDTH }}
        >
          {/* Header */}
          <div
            className="px-4 py-2 font-semibold gradient-text border-b border-white/20 dark:border-white/10 flex items-center"
            style={{ height: HEADER_HEIGHT }}
          >
            Client / Task
          </div>

          {/* Client rows */}
          {Array.from(tasksByClient.entries()).map(([clientId, clientTasks]) => {
            const client = clients.find((c) => c.id === clientId);
            if (!client) return null;

            return (
              <div key={clientId}>
                {clientTasks.map((task, idx) => (
                  <div
                    key={task.id}
                    className="px-4 border-b border-white/10 flex items-center gap-2 hover:bg-white/30 dark:hover:bg-white/10 cursor-pointer"
                    style={{ height: ROW_HEIGHT }}
                    onClick={() => onClientClick(client)}
                  >
                    {idx === 0 && (
                      <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {client.name}
                      </span>
                    )}
                    {idx > 0 && <span className="w-4" />}
                    <span className="text-sm text-gray-500 dark:text-gray-400 truncate flex-1">
                      {task.task.title}
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Scrollable timeline area */}
        <div
          ref={containerRef}
          className="flex-1 overflow-x-auto"
        >
          {/* Date headers */}
          <div
            className="flex border-b border-white/20 dark:border-white/10 bg-white/30 dark:bg-white/5"
            style={{
              height: HEADER_HEIGHT,
              width: totalDays * DAY_WIDTH,
            }}
          >
            {dateHeaders.map((header, i) => (
              <div
                key={i}
                className={`
                  flex flex-col items-center justify-center text-xs border-r border-white/10
                  ${header.isToday ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300 font-bold' : ''}
                  ${header.isWeekend && !header.isToday ? 'bg-white/20 dark:bg-white/5 text-gray-400 dark:text-gray-500' : ''}
                  ${!header.isToday && !header.isWeekend ? 'text-gray-600 dark:text-gray-400' : ''}
                `}
                style={{ width: DAY_WIDTH }}
              >
                <span className="text-[10px] uppercase">
                  {header.date.toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
                <span>{header.date.getDate()}</span>
                {header.date.getDate() === 1 && (
                  <span className="text-[10px] font-semibold">
                    {header.date.toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Task bars */}
          <div
            className="relative"
            style={{
              width: totalDays * DAY_WIDTH,
              height: totalRows * ROW_HEIGHT,
            }}
          >
            {/* Grid lines */}
            {dateHeaders.map((header, i) => (
              <div
                key={i}
                className={`
                  absolute top-0 bottom-0 border-r
                  ${header.isToday ? 'border-purple-300 dark:border-purple-600 bg-purple-500/10' : 'border-white/10'}
                  ${header.isWeekend && !header.isToday ? 'bg-white/10 dark:bg-white/5' : ''}
                `}
                style={{ left: i * DAY_WIDTH, width: DAY_WIDTH }}
              />
            ))}

            {/* Today line */}
            {(() => {
              const todayOffset = daysBetween(dateRange.start, today);
              if (todayOffset >= 0 && todayOffset <= totalDays) {
                return (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 dark:bg-red-400 z-20"
                    style={{ left: todayOffset * DAY_WIDTH + DAY_WIDTH / 2 }}
                  />
                );
              }
              return null;
            })()}

            {/* Row backgrounds and task bars */}
            {(() => {
              let rowIndex = 0;
              const elements: ReactNode[] = [];

              tasksByClient.forEach((clientTasks) => {
                clientTasks.forEach((task) => {
                  const position = getTaskPosition(task);
                  const isOverdue =
                    !task.task.completed && task.endDate < today;

                  // Row background
                  elements.push(
                    <div
                      key={`row-${task.id}`}
                      className="absolute left-0 right-0 border-b border-white/10"
                      style={{
                        top: rowIndex * ROW_HEIGHT,
                        height: ROW_HEIGHT,
                      }}
                    />
                  );

                  // Task bar
                  elements.push(
                    <div
                      key={`bar-${task.id}`}
                      className={`
                        absolute rounded-md cursor-pointer transition-all z-10
                        ${getStatusColor(task.task.completed, isOverdue)}
                        ${hoveredTask === task.id ? 'ring-2 ring-offset-1 ring-blue-400 shadow-lg scale-[1.02]' : 'hover:brightness-110'}
                        ${task.task.completed ? 'opacity-70' : ''}
                      `}
                      style={{
                        top: rowIndex * ROW_HEIGHT + 6,
                        left: position.left + 2,
                        width: Math.max(position.width, 20),
                        height: ROW_HEIGHT - 12,
                      }}
                      onMouseEnter={() => setHoveredTask(task.id)}
                      onMouseLeave={() => setHoveredTask(null)}
                      title={`${task.task.title}\n${formatDate(task.startDate)} - ${formatDate(task.endDate)}${task.task.completed ? '\n(Completed)' : ''}`}
                    >
                      <div className="px-2 py-1 text-xs text-white truncate">
                        {position.width > 60 && task.task.title}
                      </div>
                    </div>
                  );

                  // Dependency arrows
                  if (task.dependsOn && task.dependsOn.length > 0) {
                    task.dependsOn.forEach((depId) => {
                      const depTask = tasks.find((t) => t.id === depId);
                      if (depTask) {
                        const depPosition = getTaskPosition(depTask);
                        const depRowIndex = tasks.findIndex(
                          (t) => t.id === depId
                        );
                        if (depRowIndex >= 0) {
                          // Draw arrow from end of dep task to start of this task
                          const startX =
                            depPosition.left + depPosition.width + 2;
                          const startY =
                            depRowIndex * ROW_HEIGHT + ROW_HEIGHT / 2;
                          const endX = position.left;
                          const endY = rowIndex * ROW_HEIGHT + ROW_HEIGHT / 2;

                          elements.push(
                            <svg
                              key={`dep-${depId}-${task.id}`}
                              className="absolute pointer-events-none z-5"
                              style={{
                                top: 0,
                                left: 0,
                                width: totalDays * DAY_WIDTH,
                                height: totalRows * ROW_HEIGHT,
                                overflow: 'visible',
                              }}
                            >
                              <defs>
                                <marker
                                  id={`arrowhead-${depId}-${task.id}`}
                                  markerWidth="6"
                                  markerHeight="4"
                                  refX="5"
                                  refY="2"
                                  orient="auto"
                                >
                                  <polygon
                                    points="0 0, 6 2, 0 4"
                                    className="fill-gray-400 dark:fill-gray-500"
                                  />
                                </marker>
                              </defs>
                              <path
                                d={`M ${startX} ${startY} C ${startX + 20} ${startY}, ${endX - 20} ${endY}, ${endX} ${endY}`}
                                className="stroke-gray-400 dark:stroke-gray-500"
                                fill="none"
                                strokeWidth="1.5"
                                markerEnd={`url(#arrowhead-${depId}-${task.id})`}
                              />
                            </svg>
                          );
                        }
                      }
                    });
                  }

                  rowIndex++;
                });
              });

              return elements;
            })()}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-3 border-t border-white/20 dark:border-white/10 bg-white/30 dark:bg-white/5 text-xs text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-gradient-to-r from-indigo-500 to-purple-500" />
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-gradient-to-r from-emerald-400 to-green-500" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-gradient-to-r from-red-400 to-rose-500" />
          <span>Overdue</span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <div className="w-4 h-0.5 bg-red-500" />
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}
