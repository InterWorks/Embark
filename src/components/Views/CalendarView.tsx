import { useState, useMemo } from 'react';
import type { Client, ChecklistItem } from '../../types';

interface CalendarViewProps {
  clients: Client[];
  onClientClick: (client: Client) => void;
}

interface CalendarTask {
  id: string;
  clientId: string;
  clientName: string;
  task: ChecklistItem;
  priority: Client['priority'];
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function getPriorityColor(priority: Client['priority']): string {
  switch (priority) {
    case 'high': return 'bg-gradient-to-r from-red-400 to-rose-500';
    case 'medium': return 'bg-gradient-to-r from-amber-400 to-orange-500';
    case 'low': return 'bg-gradient-to-r from-blue-400 to-cyan-500';
    default: return 'bg-gradient-to-r from-gray-400 to-gray-500';
  }
}

export function CalendarView({ clients, onClientClick }: CalendarViewProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Build task map by date
  const tasksByDate = useMemo(() => {
    const map = new Map<string, CalendarTask[]>();

    clients.forEach((client) => {
      client.checklist.forEach((task) => {
        if (task.dueDate) {
          const dateKey = task.dueDate.split('T')[0];
          const existing = map.get(dateKey) || [];
          existing.push({
            id: `${client.id}-${task.id}`,
            clientId: client.id,
            clientName: client.name,
            task,
            priority: client.priority,
          });
          map.set(dateKey, existing);
        }
      });
    });

    return map;
  }, [clients]);

  // Get tasks for selected date
  const selectedDateTasks = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = selectedDate.toISOString().split('T')[0];
    return tasksByDate.get(dateKey) || [];
  }, [selectedDate, tasksByDate]);

  // Calendar grid data
  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const days: (Date | null)[] = [];

    // Add empty cells for days before the first of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(currentYear, currentMonth, i));
    }

    return days;
  }, [currentYear, currentMonth]);

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDate(today);
  };

  const getTasksForDay = (date: Date): CalendarTask[] => {
    const dateKey = date.toISOString().split('T')[0];
    return tasksByDate.get(dateKey) || [];
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleTaskClick = (task: CalendarTask) => {
    const client = clients.find((c) => c.id === task.clientId);
    if (client) {
      onClientClick(client);
    }
  };

  return (
    <div className="flex gap-6">
      {/* Calendar Grid */}
      <div className="flex-1 glass-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/20 dark:border-white/10">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold gradient-text">
              {MONTHS[currentMonth]} {currentYear}
            </h2>
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-sm bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:opacity-90 shadow-lg shadow-purple-500/25"
            >
              Today
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevMonth}
              className="p-2 hover:bg-white/50 dark:hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-white/50 dark:hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-white/20 dark:border-white/10">
          {DAYS.map((day) => (
            <div
              key={day}
              className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((date, i) => {
            if (!date) {
              return (
                <div
                  key={`empty-${i}`}
                  className="min-h-[100px] p-2 bg-white/20 dark:bg-white/5 border-b border-r border-white/10"
                />
              );
            }

            const tasks = getTasksForDay(date);
            const isToday = isSameDay(date, today);
            const isSelected = selectedDate && isSameDay(date, selectedDate);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;

            return (
              <div
                key={date.toISOString()}
                onClick={() => handleDateClick(date)}
                className={`
                  min-h-[100px] p-2 border-b border-r border-white/10 cursor-pointer transition-all
                  ${isWeekend ? 'bg-white/10 dark:bg-white/5' : 'bg-transparent'}
                  ${isSelected ? 'bg-purple-500/20 ring-2 ring-inset ring-purple-500/50' : ''}
                  hover:bg-white/30 dark:hover:bg-white/10
                `}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`
                      text-sm font-medium
                      ${isToday ? 'w-7 h-7 flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg' : ''}
                      ${!isToday ? 'text-gray-700 dark:text-gray-300' : ''}
                    `}
                  >
                    {date.getDate()}
                  </span>
                  {tasks.length > 0 && (
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {tasks.length}
                    </span>
                  )}
                </div>
                <div className="space-y-1 overflow-hidden max-h-[60px]">
                  {tasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      className={`
                        text-xs px-1.5 py-0.5 rounded truncate
                        ${task.task.completed
                          ? 'bg-white/30 dark:bg-white/10 text-gray-400 dark:text-gray-500 line-through'
                          : `${getPriorityColor(task.priority)} text-white shadow-sm`
                        }
                      `}
                      title={`${task.task.title} (${task.clientName})`}
                    >
                      {task.task.title}
                    </div>
                  ))}
                  {tasks.length > 3 && (
                    <div className="text-xs text-gray-400 dark:text-gray-500 px-1">
                      +{tasks.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Date Panel */}
      <div className="w-80 glass-card overflow-hidden flex flex-col">
        <div className="p-4 border-b border-white/20 dark:border-white/10">
          <h3 className="font-semibold gradient-text">
            {selectedDate
              ? selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })
              : 'Select a date'}
          </h3>
          {selectedDate && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {selectedDateTasks.length} task{selectedDateTasks.length !== 1 ? 's' : ''} scheduled
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {!selectedDate ? (
            <div className="text-center py-8">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                Click on a date to see tasks
              </p>
            </div>
          ) : selectedDateTasks.length === 0 ? (
            <div className="text-center py-8">
              <div className="mx-auto h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="mt-3 text-gray-500 dark:text-gray-400">
                No tasks due on this date
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDateTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleTaskClick(task)}
                  className={`
                    p-3 rounded-xl cursor-pointer transition-all
                    ${task.task.completed
                      ? 'glass-subtle opacity-70'
                      : 'glass-subtle hover:bg-white/60 dark:hover:bg-white/15'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${
                        task.task.completed ? 'bg-gradient-to-r from-emerald-400 to-green-500' : getPriorityColor(task.priority)
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-medium ${
                          task.task.completed
                            ? 'text-gray-400 dark:text-gray-500 line-through'
                            : 'text-gray-900 dark:text-gray-100'
                        }`}
                      >
                        {task.task.title}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {task.clientName}
                      </p>
                      {task.task.completed && (
                        <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-gradient-to-r from-emerald-400 to-green-500 text-white rounded-full shadow-sm">
                          Completed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
