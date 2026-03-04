import { useState } from 'react';
import type { Client, Priority } from '../../types';
import { useClientContext } from '../../context/ClientContext';
import { formatDate } from '../../utils/helpers';

interface TableViewProps {
  clients: Client[];
  onSelectClient: (client: Client) => void;
  selectedIds?: Set<string>;
  onToggleSelect?: (clientId: string) => void;
  selectionMode?: boolean;
}

type SortField = 'name' | 'status' | 'priority' | 'assignedTo' | 'progress' | 'createdAt' | 'lastActivity' | 'nextDue' | 'overdue' | 'services';
type SortDirection = 'asc' | 'desc';

type ColumnId = 'client' | 'status' | 'priority' | 'assignedTo' | 'tags' | 'progress' | 'services' | 'nextDue' | 'overdue' | 'lastActivity' | 'created';

interface ColumnConfig {
  id: ColumnId;
  label: string;
  sortField?: SortField;
  defaultVisible: boolean;
}

const allColumns: ColumnConfig[] = [
  { id: 'client', label: 'Client', sortField: 'name', defaultVisible: true },
  { id: 'status', label: 'Status', sortField: 'status', defaultVisible: true },
  { id: 'priority', label: 'Priority', sortField: 'priority', defaultVisible: true },
  { id: 'assignedTo', label: 'Assigned To', sortField: 'assignedTo', defaultVisible: true },
  { id: 'tags', label: 'Tags', defaultVisible: true },
  { id: 'progress', label: 'Progress', sortField: 'progress', defaultVisible: true },
  { id: 'services', label: 'Services', sortField: 'services', defaultVisible: false },
  { id: 'nextDue', label: 'Next Due', sortField: 'nextDue', defaultVisible: false },
  { id: 'overdue', label: 'Overdue', sortField: 'overdue', defaultVisible: false },
  { id: 'lastActivity', label: 'Last Activity', sortField: 'lastActivity', defaultVisible: false },
  { id: 'created', label: 'Created', sortField: 'createdAt', defaultVisible: true },
];

const priorityOrder: Record<Priority, number> = { high: 0, medium: 1, low: 2, none: 3 };
const statusOrder: Record<Client['status'], number> = { active: 0, 'on-hold': 1, completed: 2 };

const priorityColors: Record<Priority, string> = {
  high: 'bg-gradient-to-r from-red-400 to-rose-500 text-white',
  medium: 'bg-gradient-to-r from-amber-400 to-orange-500 text-white',
  low: 'bg-gradient-to-r from-blue-400 to-cyan-500 text-white',
  none: 'bg-white/30 dark:bg-white/10 text-gray-700 dark:text-gray-300',
};

const statusColors: Record<Client['status'], string> = {
  active: 'bg-gradient-to-r from-emerald-400 to-green-500 text-white',
  'on-hold': 'bg-gradient-to-r from-amber-400 to-orange-500 text-white',
  completed: 'bg-gradient-to-r from-blue-400 to-indigo-500 text-white',
};

function getNextDueDate(client: Client): Date | null {
  const incompleteTasks = client.checklist.filter((t) => !t.completed && t.dueDate);
  if (incompleteTasks.length === 0) return null;
  const sorted = incompleteTasks.sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
  return new Date(sorted[0].dueDate!);
}

function getOverdueCount(client: Client): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return client.checklist.filter((t) => !t.completed && t.dueDate && new Date(t.dueDate) < today).length;
}

function getLastActivity(client: Client): Date | null {
  if (!client.activityLog || client.activityLog.length === 0) return null;
  const sorted = [...client.activityLog].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return new Date(sorted[0].timestamp);
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDueDate(date: Date): { text: string; isOverdue: boolean; isToday: boolean } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(date);
  dueDate.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { text: `${Math.abs(diffDays)}d overdue`, isOverdue: true, isToday: false };
  if (diffDays === 0) return { text: 'Today', isOverdue: false, isToday: true };
  if (diffDays === 1) return { text: 'Tomorrow', isOverdue: false, isToday: false };
  if (diffDays < 7) return { text: `In ${diffDays}d`, isOverdue: false, isToday: false };
  return { text: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), isOverdue: false, isToday: false };
}

export function TableView({ clients, onSelectClient, selectedIds, onToggleSelect, selectionMode }: TableViewProps) {
  const { updateStatus, updatePriority, getTagById } = useClientContext();
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnId>>(
    new Set(allColumns.filter((c) => c.defaultVisible).map((c) => c.id))
  );
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleColumn = (columnId: ColumnId) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(columnId)) {
        next.delete(columnId);
      } else {
        next.add(columnId);
      }
      return next;
    });
  };

  const sortedClients = [...clients].sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'status':
        comparison = statusOrder[a.status] - statusOrder[b.status];
        break;
      case 'priority':
        comparison = priorityOrder[a.priority || 'none'] - priorityOrder[b.priority || 'none'];
        break;
      case 'assignedTo':
        comparison = a.assignedTo.localeCompare(b.assignedTo);
        break;
      case 'progress': {
        const progressA = a.checklist.length > 0 ? a.checklist.filter((t) => t.completed).length / a.checklist.length : 0;
        const progressB = b.checklist.length > 0 ? b.checklist.filter((t) => t.completed).length / b.checklist.length : 0;
        comparison = progressA - progressB;
        break;
      }
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'services':
        comparison = a.services.length - b.services.length;
        break;
      case 'nextDue': {
        const dateA = getNextDueDate(a);
        const dateB = getNextDueDate(b);
        if (!dateA && !dateB) comparison = 0;
        else if (!dateA) comparison = 1;
        else if (!dateB) comparison = -1;
        else comparison = dateA.getTime() - dateB.getTime();
        break;
      }
      case 'overdue':
        comparison = getOverdueCount(a) - getOverdueCount(b);
        break;
      case 'lastActivity': {
        const actA = getLastActivity(a);
        const actB = getLastActivity(b);
        if (!actA && !actB) comparison = 0;
        else if (!actA) comparison = 1;
        else if (!actB) comparison = -1;
        else comparison = actA.getTime() - actB.getTime();
        break;
      }
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const SortHeader = ({ field, children }: { field?: SortField; children: React.ReactNode }) => (
    <th
      className={`px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400 select-none ${
        field ? 'cursor-pointer hover:text-gray-700 dark:hover:text-gray-200' : ''
      }`}
      onClick={() => field && handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {field && sortField === field && (
          <svg className={`sort-arrow w-4 h-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        )}
      </div>
    </th>
  );

  return (
    <div className="glass-card overflow-hidden">
      <div className="px-4 py-3 border-b border-white/20 dark:border-white/10 flex justify-end">
        <div className="relative">
          <button
            onClick={() => setShowColumnMenu(!showColumnMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            Columns
          </button>
          {showColumnMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowColumnMenu(false)} />
              <div className="absolute right-0 mt-1 w-48 glass-strong rounded-xl shadow-lg z-20 py-1">
                {allColumns.map((column) => (
                  <button
                    key={column.id}
                    onClick={() => toggleColumn(column.id)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-white/50 dark:hover:bg-white/10 flex items-center gap-2"
                  >
                    <span className={`w-4 h-4 rounded border ${
                      visibleColumns.has(column.id)
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 border-transparent text-white'
                        : 'border-gray-300 dark:border-gray-500'
                    } flex items-center justify-center`}>
                      {visibleColumns.has(column.id) && (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    <span className="text-gray-700 dark:text-gray-300">{column.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/30 dark:bg-white/5 border-b border-white/20 dark:border-white/10">
            <tr>
              {(selectionMode || selectedIds?.size) && (
                <th className="px-4 py-3 w-10">
                  <span className="sr-only">Select</span>
                </th>
              )}
              {visibleColumns.has('client') && <SortHeader field="name">Client</SortHeader>}
              {visibleColumns.has('status') && <SortHeader field="status">Status</SortHeader>}
              {visibleColumns.has('priority') && <SortHeader field="priority">Priority</SortHeader>}
              {visibleColumns.has('assignedTo') && <SortHeader field="assignedTo">Assigned To</SortHeader>}
              {visibleColumns.has('tags') && <SortHeader>Tags</SortHeader>}
              {visibleColumns.has('services') && <SortHeader field="services">Services</SortHeader>}
              {visibleColumns.has('progress') && <SortHeader field="progress">Progress</SortHeader>}
              {visibleColumns.has('nextDue') && <SortHeader field="nextDue">Next Due</SortHeader>}
              {visibleColumns.has('overdue') && <SortHeader field="overdue">Overdue</SortHeader>}
              {visibleColumns.has('lastActivity') && <SortHeader field="lastActivity">Last Activity</SortHeader>}
              {visibleColumns.has('created') && <SortHeader field="createdAt">Created</SortHeader>}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 dark:divide-white/5">
            {sortedClients.map((client) => {
              const completed = client.checklist.filter((t) => t.completed).length;
              const total = client.checklist.length;
              const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
              const clientTags = (client.tags || []).map((tagId) => getTagById(tagId)).filter(Boolean);
              const nextDue = getNextDueDate(client);
              const overdueCount = getOverdueCount(client);
              const lastActivity = getLastActivity(client);

              const isSelected = selectedIds?.has(client.id);

              return (
                <tr
                  key={client.id}
                  className={`hover:bg-white/30 dark:hover:bg-white/5 cursor-pointer transition-all duration-150 group ${
                    isSelected ? 'bg-purple-500/10' : ''
                  }`}
                  onClick={() => onSelectClient(client)}
                >
                  {(selectionMode || selectedIds?.size) && (
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onToggleSelect?.(client.id)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-gray-300 dark:border-gray-600 hover:border-blue-500'
                        }`}
                      >
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    </td>
                  )}
                  {visibleColumns.has('client') && (
                    <td className="px-4 py-3 border-l-2 border-transparent group-hover:border-yellow-400 transition-colors duration-150">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{client.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{client.email}</p>
                      </div>
                    </td>
                  )}
                  {visibleColumns.has('status') && (
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={client.status}
                        onChange={(e) => updateStatus(client.id, e.target.value as Client['status'])}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${statusColors[client.status]}`}
                      >
                        <option value="active">Active</option>
                        <option value="on-hold">On Hold</option>
                        <option value="completed">Completed</option>
                      </select>
                    </td>
                  )}
                  {visibleColumns.has('priority') && (
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={client.priority || 'none'}
                        onChange={(e) => updatePriority(client.id, e.target.value as Priority)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${priorityColors[client.priority || 'none']}`}
                      >
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                        <option value="none">None</option>
                      </select>
                    </td>
                  )}
                  {visibleColumns.has('assignedTo') && (
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {client.assignedTo}
                    </td>
                  )}
                  {visibleColumns.has('tags') && (
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {clientTags.length > 0 ? (
                          clientTags.slice(0, 3).map((tag) => (
                            <span
                              key={tag!.id}
                              className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                              style={{ backgroundColor: tag!.color }}
                            >
                              {tag!.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                        {clientTags.length > 3 && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300">
                            +{clientTags.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                  )}
                  {visibleColumns.has('services') && (
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {client.services.length > 0 ? (
                          <span className="flex items-center gap-1">
                            <span className="font-medium">{client.services.length}</span>
                            <span className="text-gray-400">service{client.services.length !== 1 ? 's' : ''}</span>
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </span>
                    </td>
                  )}
                  {visibleColumns.has('progress') && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-white/30 dark:bg-white/10 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all ${progress === 100 ? 'bg-gradient-to-r from-emerald-400 to-green-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400 w-12">
                          {progress}%
                        </span>
                      </div>
                    </td>
                  )}
                  {visibleColumns.has('nextDue') && (
                    <td className="px-4 py-3">
                      {nextDue ? (
                        (() => {
                          const { text, isOverdue, isToday } = formatDueDate(nextDue);
                          return (
                            <span className={`text-sm ${
                              isOverdue ? 'text-red-600 dark:text-red-400 font-medium' :
                              isToday ? 'text-blue-600 dark:text-blue-400 font-medium' :
                              'text-gray-600 dark:text-gray-400'
                            }`}>
                              {text}
                            </span>
                          );
                        })()
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                  )}
                  {visibleColumns.has('overdue') && (
                    <td className="px-4 py-3">
                      {overdueCount > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                          {overdueCount} overdue
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                  )}
                  {visibleColumns.has('lastActivity') && (
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {lastActivity ? formatRelativeTime(lastActivity) : '-'}
                    </td>
                  )}
                  {visibleColumns.has('created') && (
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(client.createdAt)}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
