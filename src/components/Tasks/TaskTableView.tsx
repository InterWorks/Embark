import { useState, useMemo } from 'react';
import type { Client, ChecklistItem, TaskGroup, ChecklistTemplate } from '../../types';
import { useClientContext } from '../../context/ClientContext';
import { Button } from '../UI/Button';

interface TaskTableViewProps {
  client: Client;
}

const defaultGroupColors = [
  '#6366f1', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6', '#06b6d4', '#f43f5e', '#84cc16'
];

export function TaskTableView({ client }: TaskTableViewProps) {
  const {
    addTaskGroup,
    updateTaskGroup,
    removeTaskGroup,
    addChecklistItem,
    toggleChecklistItem,
    removeChecklistItem,
    moveTaskToGroup,
    templates,
    applyTemplate
  } = useClientContext();

  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  const [addingToGroupId, setAddingToGroupId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [draggedTask, setDraggedTask] = useState<{ taskId: string; sourceGroupId: string | undefined } | null>(null);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);

  const handleApplyTemplate = (template: ChecklistTemplate) => {
    applyTemplate(client.id, template);
    setShowTemplateMenu(false);
  };

  // Get task groups or create defaults if none exist
  const taskGroups = useMemo(() => {
    if (client.taskGroups && client.taskGroups.length > 0) {
      return [...client.taskGroups].sort((a, b) => a.order - b.order);
    }
    return [];
  }, [client.taskGroups]);

  // Group tasks by their groupId
  const tasksByGroup = useMemo(() => {
    const grouped: Record<string, ChecklistItem[]> = {};

    // Initialize all groups
    taskGroups.forEach(group => {
      grouped[group.id] = [];
    });

    // Add ungrouped tasks category
    grouped['ungrouped'] = [];

    // Sort tasks into groups
    client.checklist.forEach(task => {
      if (task.groupId && grouped[task.groupId]) {
        grouped[task.groupId].push(task);
      } else {
        grouped['ungrouped'].push(task);
      }
    });

    // Sort tasks by order within each group
    Object.keys(grouped).forEach(groupId => {
      grouped[groupId].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    });

    return grouped;
  }, [client.checklist, taskGroups]);

  const handleStartEditGroup = (group: TaskGroup) => {
    setEditingGroupId(group.id);
    setEditingGroupName(group.name);
  };

  const handleSaveGroupName = (groupId: string) => {
    if (editingGroupName.trim()) {
      updateTaskGroup(client.id, groupId, { name: editingGroupName.trim() });
    }
    setEditingGroupId(null);
    setEditingGroupName('');
  };

  const handleAddTask = (groupId: string) => {
    if (newTaskTitle.trim()) {
      addChecklistItem(client.id, newTaskTitle.trim(), undefined, undefined, groupId);
      setNewTaskTitle('');
      setAddingToGroupId(null);
    }
  };

  const handleAddGroup = () => {
    if (newGroupName.trim()) {
      const colorIndex = taskGroups.length % defaultGroupColors.length;
      addTaskGroup(client.id, newGroupName.trim(), defaultGroupColors[colorIndex]);
      setNewGroupName('');
      setIsAddingGroup(false);
    }
  };

  const handleDeleteGroup = (groupId: string) => {
    const group = taskGroups.find(g => g.id === groupId);
    if (group?.isDefault) return;
    removeTaskGroup(client.id, groupId);
  };

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const handleDragStart = (taskId: string, sourceGroupId: string | undefined) => {
    setDraggedTask({ taskId, sourceGroupId });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetGroupId: string) => {
    e.preventDefault();
    if (draggedTask && draggedTask.sourceGroupId !== targetGroupId) {
      moveTaskToGroup(client.id, draggedTask.taskId, targetGroupId === 'ungrouped' ? undefined : targetGroupId);
    }
    setDraggedTask(null);
  };

  const renderTaskRow = (task: ChecklistItem) => {
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;

    return (
      <tr
        key={task.id}
        draggable
        onDragStart={() => handleDragStart(task.id, task.groupId)}
        className={`group hover:bg-white/30 dark:hover:bg-white/5 transition-colors ${
          task.completed ? 'opacity-60' : ''
        } ${draggedTask?.taskId === task.id ? 'opacity-50' : ''}`}
      >
        <td className="px-4 py-2 w-10">
          <button
            onClick={() => toggleChecklistItem(client.id, task.id)}
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
        <td className="px-4 py-2">
          <span className={task.completed ? 'line-through text-gray-400' : 'text-gray-900 dark:text-gray-100'}>
            {task.title}
          </span>
        </td>
        <td className="px-4 py-2 w-32">
          {task.dueDate ? (
            <span className={`text-sm ${
              isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-500 dark:text-gray-400'
            }`}>
              {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          ) : (
            <span className="text-gray-400 text-sm">-</span>
          )}
        </td>
        <td className="px-4 py-2 w-10">
          <button
            onClick={() => removeChecklistItem(client.id, task.id)}
            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </td>
      </tr>
    );
  };

  const renderGroup = (group: TaskGroup | null, groupId: string, tasks: ChecklistItem[]) => {
    const isCollapsed = collapsedGroups.has(groupId);
    const isDefault = group?.isDefault;
    const groupName = group?.name || 'Ungrouped';
    const groupColor = group?.color || '#9ca3af';
    const completedCount = tasks.filter(t => t.completed).length;

    return (
      <div
        key={groupId}
        className="mb-6"
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, groupId)}
      >
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => toggleGroupCollapse(groupId)}
            className="p-1 hover:bg-white/50 dark:hover:bg-white/10 rounded transition-colors"
          >
            <svg
              className={`w-4 h-4 text-gray-500 transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: groupColor }}
          />

          {editingGroupId === groupId ? (
            <input
              type="text"
              value={editingGroupName}
              onChange={(e) => setEditingGroupName(e.target.value)}
              onBlur={() => handleSaveGroupName(groupId)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveGroupName(groupId);
                if (e.key === 'Escape') {
                  setEditingGroupId(null);
                  setEditingGroupName('');
                }
              }}
              className="px-2 py-0.5 text-sm font-semibold bg-white/50 dark:bg-white/10 rounded border border-purple-500 focus:outline-none"
              autoFocus
            />
          ) : (
            <h3
              className={`text-sm font-semibold text-gray-700 dark:text-gray-300 ${
                group && !isDefault ? 'cursor-pointer hover:text-purple-600 dark:hover:text-purple-400' : ''
              }`}
              onClick={() => group && !isDefault && handleStartEditGroup(group)}
              title={group && !isDefault ? 'Click to rename' : undefined}
            >
              {groupName}
            </h3>
          )}

          <span className="text-xs text-gray-500 dark:text-gray-400">
            ({completedCount}/{tasks.length})
          </span>

          {group && !isDefault && (
            <button
              onClick={() => handleDeleteGroup(groupId)}
              className="ml-auto p-1 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
              title="Delete group"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>

        {!isCollapsed && (
          <div className="glass-card overflow-hidden ml-6">
            <table className="w-full">
              <tbody className="divide-y divide-white/10 dark:divide-white/5">
                {tasks.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-gray-400 text-sm" colSpan={4}>
                      No tasks in this group. Drag tasks here or add a new one.
                    </td>
                  </tr>
                ) : (
                  tasks.map(task => renderTaskRow(task))
                )}

                {/* Add task row */}
                {addingToGroupId === groupId ? (
                  <tr>
                    <td className="px-4 py-2" colSpan={4}>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddTask(groupId);
                            if (e.key === 'Escape') {
                              setAddingToGroupId(null);
                              setNewTaskTitle('');
                            }
                          }}
                          placeholder="Enter task title..."
                          className="flex-1 px-3 py-1.5 text-sm bg-white/50 dark:bg-white/10 rounded-lg border border-white/30 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                          autoFocus
                        />
                        <button
                          onClick={() => handleAddTask(groupId)}
                          className="px-3 py-1.5 text-sm font-medium bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => {
                            setAddingToGroupId(null);
                            setNewTaskTitle('');
                          }}
                          className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td className="px-4 py-2" colSpan={4}>
                      <button
                        onClick={() => setAddingToGroupId(groupId)}
                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add task
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Tasks</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {client.checklist.filter(t => t.completed).length}/{client.checklist.length} completed
          </span>
          {templates.length > 0 && (
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTemplateMenu(!showTemplateMenu)}
              >
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Apply Template
              </Button>
              {showTemplateMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowTemplateMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 glass-strong rounded-xl shadow-lg z-20">
                    <div className="p-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                        Apply a template to add tasks
                      </p>
                      {templates.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => handleApplyTemplate(template)}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-white/10 rounded-lg"
                        >
                          {template.name}
                          <span className="text-xs text-gray-400 ml-2">
                            ({template.items.length} tasks)
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Task groups */}
      <div className="space-y-2">
        {taskGroups.map(group => renderGroup(group, group.id, tasksByGroup[group.id] || []))}

        {/* Ungrouped tasks */}
        {tasksByGroup['ungrouped']?.length > 0 && (
          renderGroup(null, 'ungrouped', tasksByGroup['ungrouped'])
        )}
      </div>

      {/* Add new table/group button */}
      {isAddingGroup ? (
        <div className="mt-4 flex items-center gap-2">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddGroup();
              if (e.key === 'Escape') {
                setIsAddingGroup(false);
                setNewGroupName('');
              }
            }}
            placeholder="Enter table name..."
            className="flex-1 px-3 py-2 text-sm bg-white/50 dark:bg-white/10 rounded-lg border border-white/30 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            autoFocus
          />
          <button
            onClick={handleAddGroup}
            className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            Add Table
          </button>
          <button
            onClick={() => {
              setIsAddingGroup(false);
              setNewGroupName('');
            }}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsAddingGroup(true)}
          className="mt-4 flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-white/50 dark:hover:bg-white/10 rounded-lg transition-all"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Table
        </button>
      )}
    </div>
  );
}
