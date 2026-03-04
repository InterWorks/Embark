import { useState, useMemo } from 'react';
import type { ChecklistItem, TaskGroup } from '../../types';
import { useClientContext } from '../../context/ClientContext';
import { Button } from '../UI/Button';

interface TaskWithClient extends ChecklistItem {
  clientId: string;
  clientName: string;
  clientTaskGroups?: TaskGroup[];
}

type FilterStatus = 'all' | 'incomplete' | 'completed' | 'overdue';
type SortField = 'dueDate' | 'clientName' | 'title' | 'status';
type SortDirection = 'asc' | 'desc';

export function TasksView() {
  const { clients, toggleChecklistItem, removeChecklistItem, addChecklistItem } = useClientContext();

  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterClientId, setFilterClientId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('dueDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskClientId, setNewTaskClientId] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState(false);

  const activeClients = useMemo(
    () => clients.filter((c) => !c.archived),
    [clients]
  );

  // Gather all tasks from all clients
  const allTasks = useMemo((): TaskWithClient[] => {
    const tasks: TaskWithClient[] = [];

    activeClients.forEach((client) => {
      client.checklist.forEach((task) => {
        tasks.push({
          ...task,
          clientId: client.id,
          clientName: client.name,
          clientTaskGroups: client.taskGroups,
        });
      });
    });

    return tasks;
  }, [activeClients]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    let tasks = allTasks;

    // Apply status filter
    switch (filterStatus) {
      case 'incomplete':
        tasks = tasks.filter((t) => !t.completed);
        break;
      case 'completed':
        tasks = tasks.filter((t) => t.completed);
        break;
      case 'overdue':
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        tasks = tasks.filter(
          (t) => !t.completed && t.dueDate && new Date(t.dueDate) < today
        );
        break;
    }

    // Apply client filter
    if (filterClientId) {
      tasks = tasks.filter((t) => t.clientId === filterClientId);
    }

    return tasks;
  }, [allTasks, filterStatus, filterClientId]);

  // Sort tasks
  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) comparison = 0;
          else if (!a.dueDate) comparison = 1;
          else if (!b.dueDate) comparison = -1;
          else comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        case 'clientName':
          comparison = a.clientName.localeCompare(b.clientName);
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'status':
          comparison = (a.completed ? 1 : 0) - (b.completed ? 1 : 0);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredTasks, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleAddTask = () => {
    if (newTaskTitle.trim() && newTaskClientId) {
      addChecklistItem(newTaskClientId, newTaskTitle.trim());
      setNewTaskTitle('');
      setShowAddForm(false);
    }
  };

  const getTaskGroup = (task: TaskWithClient): TaskGroup | null => {
    if (!task.groupId || !task.clientTaskGroups) return null;
    return task.clientTaskGroups.find(g => g.id === task.groupId) || null;
  };

  const formatDueDate = (dueDate: string | undefined) => {
    if (!dueDate) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)}d overdue`, className: 'text-red-600 dark:text-red-400 font-medium' };
    }
    if (diffDays === 0) {
      return { text: 'Today', className: 'text-blue-600 dark:text-blue-400 font-medium' };
    }
    if (diffDays === 1) {
      return { text: 'Tomorrow', className: 'text-gray-600 dark:text-gray-400' };
    }
    if (diffDays < 7) {
      return { text: `In ${diffDays}d`, className: 'text-gray-600 dark:text-gray-400' };
    }
    return {
      text: due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      className: 'text-gray-500 dark:text-gray-400'
    };
  };

  // Stats
  const stats = useMemo(() => {
    const total = allTasks.length;
    const completed = allTasks.filter((t) => t.completed).length;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdue = allTasks.filter(
      (t) => !t.completed && t.dueDate && new Date(t.dueDate) < today
    ).length;
    const dueToday = allTasks.filter((t) => {
      if (t.completed || !t.dueDate) return false;
      const due = new Date(t.dueDate);
      due.setHours(0, 0, 0, 0);
      return due.getTime() === today.getTime();
    }).length;

    return { total, completed, overdue, dueToday };
  }, [allTasks]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Tasks</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage tasks across all clients
          </p>
        </div>
        <Button variant="accent" tilt onClick={() => setShowAddForm(true)}>
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Task
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="glass-card brut-hover group p-4 cursor-default">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Tasks</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-transform duration-100 group-hover:scale-110">{stats.total}</p>
        </div>
        <div className="glass-card brut-hover group p-4 cursor-default">
          <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 transition-transform duration-100 group-hover:scale-110">{stats.completed}</p>
        </div>
        <div className="glass-card brut-hover group p-4 cursor-default">
          <p className="text-sm text-gray-500 dark:text-gray-400">Due Today</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 transition-transform duration-100 group-hover:scale-110">{stats.dueToday}</p>
        </div>
        <div className="glass-card brut-hover group p-4 cursor-default">
          <p className="text-sm text-gray-500 dark:text-gray-400">Overdue</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 transition-transform duration-100 group-hover:scale-110">{stats.overdue}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Status:</span>
            <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-[4px] border border-zinc-300 dark:border-zinc-600">
              {(['all', 'incomplete', 'completed', 'overdue'] as FilterStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1 text-sm rounded-[4px] transition-all capitalize ${
                    filterStatus === status
                      ? 'bg-yellow-400 text-zinc-900 font-bold shadow-[2px_2px_0_0_#18181b]'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Client Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Client:</span>
            <select
              value={filterClientId || ''}
              onChange={(e) => setFilterClientId(e.target.value || null)}
              className="px-3 py-1.5 text-sm bg-white/50 dark:bg-white/10 rounded-lg border border-white/30 dark:border-white/10 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            >
              <option value="">All Clients</option>
              {activeClients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-white/30 dark:bg-white/5 border-b border-white/20 dark:border-white/10">
            <tr>
              <th className="px-4 py-3 w-10"></th>
              <th
                className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                onClick={() => handleSort('title')}
              >
                <div className="flex items-center gap-1">
                  Task
                  {sortField === 'title' && (
                    <svg className={`sort-arrow w-4 h-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  )}
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                onClick={() => handleSort('clientName')}
              >
                <div className="flex items-center gap-1">
                  Client
                  {sortField === 'clientName' && (
                    <svg className={`sort-arrow w-4 h-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  )}
                </div>
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                Group
              </th>
              <th
                className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                onClick={() => handleSort('dueDate')}
              >
                <div className="flex items-center gap-1">
                  Due Date
                  {sortField === 'dueDate' && (
                    <svg className={`sort-arrow w-4 h-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  )}
                </div>
              </th>
              <th className="px-4 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 dark:divide-white/5">
            {sortedTasks.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12">
                  <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <div className="relative w-20 h-20 flex-shrink-0">
                      <div className="absolute inset-0 bg-zinc-200 dark:bg-zinc-700 clip-star-4 deco-float-2" />
                      <div className="absolute inset-[8px] bg-yellow-400 clip-burst deco-float-delay" />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="font-display text-xl font-black text-zinc-900 dark:text-white">No tasks found</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {(filterStatus !== 'all' || filterClientId)
                          ? 'Try clearing your filters.'
                          : 'Tasks appear here once clients have checklists.'}
                      </p>
                    </div>
                    {(filterStatus !== 'all' || filterClientId) && (
                      <button
                        onClick={() => { setFilterStatus('all'); setFilterClientId(null); }}
                        className="px-4 py-1.5 text-xs font-bold border-2 border-zinc-900 dark:border-white rounded-[4px] hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              sortedTasks.map((task) => {
                const group = getTaskGroup(task);
                const dueDateInfo = formatDueDate(task.dueDate);

                return (
                  <tr
                    key={`${task.clientId}-${task.id}`}
                    className={`hover:bg-yellow-50/60 dark:hover:bg-zinc-700/60 transition-colors group ${
                      task.completed ? 'opacity-60' : 'opacity-100'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleChecklistItem(task.clientId, task.id)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          task.completed
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 dark:border-gray-600 hover:border-green-500'
                        }`}
                      >
                        {task.completed && (
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className={task.completed ? 'line-through text-gray-400' : 'text-gray-900 dark:text-gray-100'}>
                        {task.title}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs font-medium bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-700 dark:text-violet-300 rounded-full">
                        {task.clientName}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {group ? (
                        <span
                          className="px-2 py-1 text-xs font-medium rounded-full text-white"
                          style={{ backgroundColor: group.color || '#6366f1' }}
                        >
                          {group.name}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {dueDateInfo ? (
                        <span className={`text-sm ${dueDateInfo.className}`}>
                          {dueDateInfo.text}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => removeChecklistItem(task.clientId, task.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add Task Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowAddForm(false)}
          />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative glass-strong rounded-2xl shadow-2xl p-6 max-w-md w-full border border-white/30 dark:border-white/10">
              <h3 className="text-lg font-semibold gradient-text mb-4">
                Add New Task
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Client
                  </label>
                  <select
                    value={newTaskClientId}
                    onChange={(e) => setNewTaskClientId(e.target.value)}
                    className="w-full px-3 py-2 bg-white/50 dark:bg-white/10 rounded-lg border border-white/30 dark:border-white/10 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  >
                    <option value="">Select a client</option>
                    {activeClients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Task Title
                  </label>
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddTask();
                      if (e.key === 'Escape') setShowAddForm(false);
                    }}
                    placeholder="Enter task title..."
                    className="w-full px-3 py-2 bg-white/50 dark:bg-white/10 rounded-lg border border-white/30 dark:border-white/10 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    autoFocus
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTask}
                  disabled={!newTaskTitle.trim() || !newTaskClientId}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
