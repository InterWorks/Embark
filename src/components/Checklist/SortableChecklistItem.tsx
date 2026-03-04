import { useState, type KeyboardEvent } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ChecklistItem as ChecklistItemType, RecurrencePattern, OnboardingPhase } from '../../types';
import { useClientContext } from '../../context/ClientContext';
import { TimerButton } from './TimerButton';
import { TimeEntryChip } from './TimeEntryChip';

interface SortableChecklistItemProps {
  clientId: string;
  item: ChecklistItemType;
  allItems: ChecklistItemType[];
  phases?: OnboardingPhase[];
  isLocked?: boolean;
}

export function SortableChecklistItem({ clientId, item, allItems, phases, isLocked }: SortableChecklistItemProps) {
  const { toggleChecklistItem, updateChecklistItem, removeChecklistItem, addSubtask, toggleSubtask, removeSubtask, updateSubtask, addComment, updateComment, deleteComment } = useClientContext();
  const [isEditing, setIsEditing] = useState(false);
  const [showPhaseMenu, setShowPhaseMenu] = useState(false);
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [blockReason, setBlockReason] = useState(item.blockReason || '');
  const [editValue, setEditValue] = useState(item.title);
  const [editStartDate, setEditStartDate] = useState(item.startDate || '');
  const [editDueDate, setEditDueDate] = useState(item.dueDate || '');
  const [showDependencyMenu, setShowDependencyMenu] = useState(false);
  const [showRecurrenceMenu, setShowRecurrenceMenu] = useState(false);
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editingSubtaskValue, setEditingSubtaskValue] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentValue, setEditingCommentValue] = useState('');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(item.recurrenceEndDate || '');

  const recurrenceOptions: { value: RecurrencePattern | 'none'; label: string }[] = [
    { value: 'none', label: 'No repeat' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'biweekly', label: 'Every 2 weeks' },
    { value: 'monthly', label: 'Monthly' },
  ];

  const setRecurrence = (pattern: RecurrencePattern | 'none') => {
    if (pattern === 'none') {
      updateChecklistItem(clientId, item.id, { recurrence: undefined, recurrenceEndDate: undefined });
      setRecurrenceEndDate('');
    } else {
      updateChecklistItem(clientId, item.id, { recurrence: pattern });
    }
    setShowRecurrenceMenu(false);
  };

  const handleRecurrenceEndDateChange = (endDate: string) => {
    setRecurrenceEndDate(endDate);
    updateChecklistItem(clientId, item.id, { recurrenceEndDate: endDate || undefined });
  };

  // Get tasks that this item depends on
  const dependencies = item.dependsOn?.map((depId) => allItems.find((i) => i.id === depId)).filter(Boolean) || [];

  // Check if any dependency is incomplete (blocked)
  const isBlocked = dependencies.some((dep) => dep && !dep.completed);

  // Get available tasks for dependency (exclude self and items that would create circular dependency)
  const availableDependencies = allItems.filter((i) => {
    if (i.id === item.id) return false;
    // Prevent circular: don't allow depending on items that depend on this one
    if (i.dependsOn?.includes(item.id)) return false;
    return true;
  });

  const toggleDependency = (depId: string) => {
    const currentDeps = item.dependsOn || [];
    const newDeps = currentDeps.includes(depId)
      ? currentDeps.filter((id) => id !== depId)
      : [...currentDeps, depId];
    updateChecklistItem(clientId, item.id, { dependsOn: newDeps.length > 0 ? newDeps : undefined });
  };

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isOverdue = item.dueDate && !item.completed && new Date(item.dueDate) < new Date(new Date().toDateString());
  const isDueSoon = item.dueDate && !item.completed && !isOverdue && (() => {
    const due = new Date(item.dueDate);
    const today = new Date(new Date().toDateString());
    const threeDays = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
    return due <= threeDays;
  })();

  const itemPhase = phases?.find((p) => p.id === item.phaseId);

  const handleToggleOwner = () => {
    updateChecklistItem(clientId, item.id, {
      ownerType: item.ownerType === 'client' ? 'internal' : 'client',
    });
  };

  const handleToggleBlock = () => {
    if (item.isBlocked) {
      updateChecklistItem(clientId, item.id, { isBlocked: false, blockReason: undefined, blockedBy: undefined });
      setShowBlockForm(false);
    } else {
      setShowBlockForm(true);
    }
  };

  const saveBlock = (blockedByValue: 'client' | 'internal' | 'external') => {
    updateChecklistItem(clientId, item.id, {
      isBlocked: true,
      blockedBy: blockedByValue,
      blockReason: blockReason.trim() || undefined,
    });
    setShowBlockForm(false);
  };

  const handleToggle = () => {
    toggleChecklistItem(clientId, item.id);
  };

  const startEditing = () => {
    setIsEditing(true);
    setEditValue(item.title);
    setEditStartDate(item.startDate || '');
    setEditDueDate(item.dueDate || '');
  };

  const saveEdit = () => {
    if (editValue.trim()) {
      updateChecklistItem(clientId, item.id, {
        title: editValue.trim(),
        startDate: editStartDate || undefined,
        dueDate: editDueDate || undefined,
      });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(item.title);
      setEditStartDate(item.startDate || '');
      setEditDueDate(item.dueDate || '');
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date(new Date().toDateString());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatDateRange = (): string | null => {
    if (!item.startDate && !item.dueDate) return null;
    if (item.startDate && item.dueDate) {
      return `${formatDate(item.startDate)} → ${formatDate(item.dueDate)}`;
    }
    if (item.startDate) return `Starts ${formatDate(item.startDate)}`;
    if (item.dueDate) return `Due ${formatDate(item.dueDate)}`;
    return null;
  };

  // Subtask handlers
  const handleAddSubtask = () => {
    if (newSubtaskTitle.trim()) {
      addSubtask(clientId, item.id, newSubtaskTitle.trim());
      setNewSubtaskTitle('');
    }
  };

  const handleSubtaskKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSubtask();
    } else if (e.key === 'Escape') {
      setNewSubtaskTitle('');
    }
  };

  const startEditingSubtask = (subtaskId: string, title: string) => {
    setEditingSubtaskId(subtaskId);
    setEditingSubtaskValue(title);
  };

  const saveSubtaskEdit = () => {
    if (editingSubtaskId && editingSubtaskValue.trim()) {
      updateSubtask(clientId, item.id, editingSubtaskId, { title: editingSubtaskValue.trim() });
    }
    setEditingSubtaskId(null);
    setEditingSubtaskValue('');
  };

  const handleSubtaskEditKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveSubtaskEdit();
    } else if (e.key === 'Escape') {
      setEditingSubtaskId(null);
      setEditingSubtaskValue('');
    }
  };

  const subtasks = item.subtasks || [];
  const completedSubtasks = subtasks.filter((s) => s.completed).length;
  const hasSubtasks = subtasks.length > 0;

  // Comment handlers
  const comments = item.comments || [];
  const hasComments = comments.length > 0;

  const handleAddComment = () => {
    if (newCommentText.trim()) {
      // In a real app, you'd get the author from auth context
      addComment(clientId, item.id, newCommentText.trim(), 'You');
      setNewCommentText('');
    }
  };

  const handleCommentKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    } else if (e.key === 'Escape') {
      setNewCommentText('');
    }
  };

  const startEditingComment = (commentId: string, text: string) => {
    setEditingCommentId(commentId);
    setEditingCommentValue(text);
  };

  const saveCommentEdit = () => {
    if (editingCommentId && editingCommentValue.trim()) {
      updateComment(clientId, item.id, editingCommentId, editingCommentValue.trim());
    }
    setEditingCommentId(null);
    setEditingCommentValue('');
  };

  const handleCommentEditKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveCommentEdit();
    } else if (e.key === 'Escape') {
      setEditingCommentId(null);
      setEditingCommentValue('');
    }
  };

  const formatCommentTime = (timestamp: string): string => {
    const date = new Date(timestamp);
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
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      title={isLocked ? 'Previous phase must be completed first' : undefined}
      className={`
        checklist-item-enter group flex items-center gap-3 p-3 rounded-[4px] transition-all relative
        ${isDragging ? 'opacity-50 bg-purple-500/10 scale-105' : 'glass-subtle hover:bg-white/60 dark:hover:bg-white/15'}
        ${isLocked ? 'opacity-40 cursor-not-allowed' : ''}
        ${item.isBlocked ? 'border-l-4 border-red-500 opacity-90' : isOverdue ? 'border-l-4 border-red-500' : ''}
        ${isDueSoon && !isBlocked && !item.isBlocked ? 'border-l-4 border-yellow-500' : ''}
        ${isBlocked && !item.isBlocked ? 'border-l-4 border-orange-500 opacity-75' : ''}
      `}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 touch-none"
        aria-label="Drag to reorder"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </button>

      <button
        onClick={handleToggle}
        className={`
          flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all
          ${
            item.completed
              ? 'bg-green-500 border-zinc-900 dark:border-white text-white animate-checkbox-pop'
              : 'border-zinc-300 dark:border-zinc-500 hover:border-green-500 hover:scale-110 duration-100'
          }
        `}
        aria-label={item.completed ? 'Mark as incomplete' : 'Mark as complete'}
      >
        {item.completed && (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {isEditing ? (
        <div className="flex-1 flex flex-col sm:flex-row gap-2">
          <input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={saveEdit}
            className="flex-1 bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">Start:</span>
              <input
                type="date"
                value={editStartDate}
                onChange={(e) => setEditStartDate(e.target.value)}
                onKeyDown={handleKeyDown}
                className="px-2 py-1 rounded border bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-sm w-32"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">End:</span>
              <input
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                onKeyDown={handleKeyDown}
                className="px-2 py-1 rounded border bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-sm w-32"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-between min-w-0">
          <span
            onClick={startEditing}
            className={`
              cursor-pointer truncate
              ${item.completed ? 'line-through-animated' : 'text-gray-900 dark:text-gray-100'}
            `}
          >
            {item.title}
          </span>
          {item.recurrence && (
            <span className="text-xs text-indigo-400 ml-1 flex-shrink-0" title={`Repeats ${item.recurrence}`}>🔄</span>
          )}
          {(item.startDate || item.dueDate) && (
            <span
              className={`
                ml-2 text-xs px-2 py-0.5 rounded flex-shrink-0 flex items-center gap-1
                ${isOverdue ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' : ''}
                ${isDueSoon && !isOverdue ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300' : ''}
                ${!isOverdue && !isDueSoon ? 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300' : ''}
                ${item.completed ? 'opacity-50' : ''}
              `}
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatDateRange()}
            </span>
          )}
        </div>
      )}

      {/* Time tracking */}
      {!item.completed && (
        <TimerButton clientId={clientId} taskId={item.id} taskTitle={item.title} />
      )}
      {(item.timeEntries?.length ?? 0) > 0 && (
        <TimeEntryChip clientId={clientId} taskId={item.id} taskTitle={item.title} entries={item.timeEntries ?? []} />
      )}

      {/* Phase badge */}
      {itemPhase && (
        <span
          className={`text-xs px-2 py-0.5 rounded-full text-white flex-shrink-0 ${itemPhase.color || 'bg-violet-500'}`}
          title={`Phase: ${itemPhase.name}`}
        >
          {itemPhase.name}
        </span>
      )}

      {/* Owner badge */}
      {item.ownerType === 'client' && (
        <span className="text-xs px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 flex-shrink-0">
          Client
        </span>
      )}

      {/* Item-level blocked badge */}
      {item.isBlocked && !item.completed && (
        <button
          onClick={() => setShowBlockForm(!showBlockForm)}
          className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 flex-shrink-0 hover:bg-red-200 dark:hover:bg-red-900/70 transition-colors"
          title={item.blockReason || 'Blocked'}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Blocked{item.blockedBy ? ` · ${item.blockedBy}` : ''}
        </button>
      )}

      {/* Dependency-blocked indicator */}
      {isBlocked && !item.isBlocked && (
        <span
          className="text-xs px-2 py-0.5 rounded bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300 flex-shrink-0"
          title={`Blocked by: ${dependencies.filter((d) => d && !d.completed).map((d) => d?.title).join(', ')}`}
        >
          Blocked
        </span>
      )}

      {/* Dependencies indicator */}
      {dependencies.length > 0 && !isBlocked && (
        <span
          className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 flex-shrink-0"
          title={`Depends on: ${dependencies.map((d) => d?.title).join(', ')}`}
        >
          {dependencies.length} dep{dependencies.length !== 1 ? 's' : ''}
        </span>
      )}

      {/* Dependency link button */}
      <div className="relative">
        <button
          onClick={() => setShowDependencyMenu(!showDependencyMenu)}
          className={`p-1 text-gray-400 hover:text-purple-500 transition-all ${
            showDependencyMenu ? 'text-purple-500' : 'opacity-0 group-hover:opacity-100'
          }`}
          aria-label="Manage dependencies"
          title="Set dependencies"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </button>

        {/* Dependency menu dropdown */}
        {showDependencyMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowDependencyMenu(false)}
            />
            <div className="absolute right-0 top-8 w-64 glass-strong rounded-xl shadow-lg z-20 max-h-64 overflow-y-auto">
              <div className="p-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 font-semibold">
                  This task depends on:
                </p>
                {availableDependencies.length === 0 ? (
                  <p className="text-xs text-gray-400 px-2 py-2">No other tasks available</p>
                ) : (
                  availableDependencies.map((dep) => (
                    <button
                      key={dep.id}
                      onClick={() => toggleDependency(dep.id)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-white/50 dark:hover:bg-white/10 rounded-lg flex items-center gap-2"
                    >
                      <span
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                          item.dependsOn?.includes(dep.id)
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 border-transparent'
                            : 'border-gray-300 dark:border-gray-500'
                        }`}
                      >
                        {item.dependsOn?.includes(dep.id) && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      <span className={`truncate ${dep.completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                        {dep.title}
                      </span>
                      {dep.completed && (
                        <span className="text-xs text-green-500 flex-shrink-0">Done</span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Recurrence indicator */}
      {item.recurrence && (
        <span
          className="text-xs px-2 py-0.5 rounded bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300 flex-shrink-0"
          title={`Repeats ${item.recurrence}${item.recurrenceEndDate ? ` until ${new Date(item.recurrenceEndDate).toLocaleDateString()}` : ''}`}
        >
          <svg className="w-3 h-3 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {item.recurrence}
          {item.recurrenceEndDate && (
            <span className="ml-1 opacity-75">
              (until {new Date(item.recurrenceEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
            </span>
          )}
        </span>
      )}

      {/* Recurrence button */}
      <div className="relative">
        <button
          onClick={() => setShowRecurrenceMenu(!showRecurrenceMenu)}
          className={`p-1 text-gray-400 hover:text-teal-500 transition-all ${
            showRecurrenceMenu || item.recurrence ? 'text-teal-500' : 'opacity-0 group-hover:opacity-100'
          }`}
          aria-label="Set recurrence"
          title="Set repeat schedule"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>

        {/* Recurrence menu dropdown */}
        {showRecurrenceMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowRecurrenceMenu(false)}
            />
            <div className="absolute right-0 top-8 w-56 glass-strong rounded-xl shadow-lg z-20">
              <div className="p-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 font-semibold">
                  Repeat schedule
                </p>
                {recurrenceOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setRecurrence(option.value)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-white/50 dark:hover:bg-white/10 rounded-lg flex items-center gap-2 ${
                      (item.recurrence === option.value || (!item.recurrence && option.value === 'none'))
                        ? 'bg-teal-500/20 text-teal-700 dark:text-teal-300'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {(item.recurrence === option.value || (!item.recurrence && option.value === 'none')) && (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    <span className={(item.recurrence === option.value || (!item.recurrence && option.value === 'none')) ? '' : 'ml-6'}>
                      {option.label}
                    </span>
                  </button>
                ))}

                {/* End date picker - only show when recurrence is set */}
                {item.recurrence && (
                  <div className="border-t border-white/20 dark:border-white/10 mt-2 pt-2 px-2">
                    <label className="text-xs text-gray-500 dark:text-gray-400 font-semibold block mb-1">
                      End date (optional)
                    </label>
                    <input
                      type="date"
                      value={recurrenceEndDate}
                      onChange={(e) => handleRecurrenceEndDateChange(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg text-sm bg-white/50 dark:bg-white/10 border border-white/30 dark:border-white/10 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                      min={new Date().toISOString().split('T')[0]}
                    />
                    {recurrenceEndDate && (
                      <button
                        onClick={() => handleRecurrenceEndDateChange('')}
                        className="text-xs text-teal-600 dark:text-teal-400 hover:underline mt-1"
                      >
                        Clear end date
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Comments indicator & toggle */}
      <button
        onClick={() => setShowComments(!showComments)}
        className={`p-1 transition-all ${
          hasComments || showComments
            ? 'text-blue-500'
            : 'text-gray-400 hover:text-blue-500 opacity-0 group-hover:opacity-100'
        }`}
        aria-label="Toggle comments"
        title={hasComments ? `${comments.length} comment${comments.length !== 1 ? 's' : ''}` : 'Add comment'}
      >
        <div className="relative">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {hasComments && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full text-[8px] text-white flex items-center justify-center font-bold">
              {comments.length}
            </span>
          )}
        </div>
      </button>

      {/* Subtasks indicator & toggle */}
      <button
        onClick={() => setShowSubtasks(!showSubtasks)}
        className={`p-1 transition-all ${
          hasSubtasks || showSubtasks
            ? 'text-indigo-500'
            : 'text-gray-400 hover:text-indigo-500 opacity-0 group-hover:opacity-100'
        }`}
        aria-label="Toggle subtasks"
        title={hasSubtasks ? `${completedSubtasks}/${subtasks.length} subtasks` : 'Add subtasks'}
      >
        <div className="relative">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
          </svg>
          {hasSubtasks && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full text-[8px] text-white flex items-center justify-center font-bold">
              {subtasks.length}
            </span>
          )}
        </div>
      </button>

      {/* Owner toggle */}
      <button
        onClick={handleToggleOwner}
        className={`p-1 transition-all ${
          item.ownerType === 'client'
            ? 'text-indigo-500'
            : 'text-gray-400 hover:text-indigo-500 opacity-0 group-hover:opacity-100'
        }`}
        aria-label="Toggle owner type"
        title={item.ownerType === 'client' ? 'Owned by client — click to set internal' : 'Set as client-owned task'}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </button>

      {/* Block button */}
      <button
        onClick={handleToggleBlock}
        className={`p-1 transition-all ${
          item.isBlocked
            ? 'text-red-500'
            : 'text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100'
        }`}
        aria-label="Toggle blocked status"
        title={item.isBlocked ? 'Unblock task' : 'Mark as blocked'}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      </button>

      {/* Phase assign button */}
      {phases && phases.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setShowPhaseMenu(!showPhaseMenu)}
            className={`p-1 transition-all ${
              showPhaseMenu || item.phaseId
                ? 'text-violet-500'
                : 'text-gray-400 hover:text-violet-500 opacity-0 group-hover:opacity-100'
            }`}
            aria-label="Assign to phase"
            title="Assign to phase"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </button>
          {showPhaseMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowPhaseMenu(false)} />
              <div className="absolute right-0 top-8 w-48 glass-strong rounded-xl shadow-lg z-20">
                <div className="p-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 font-semibold">Assign to phase</p>
                  <button
                    onClick={() => { updateChecklistItem(clientId, item.id, { phaseId: undefined }); setShowPhaseMenu(false); }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center gap-2 ${
                      !item.phaseId ? 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300' : 'hover:bg-white/50 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    No phase
                  </button>
                  {[...phases].sort((a, b) => a.order - b.order).map((phase) => (
                    <button
                      key={phase.id}
                      onClick={() => { updateChecklistItem(clientId, item.id, { phaseId: phase.id }); setShowPhaseMenu(false); }}
                      className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center gap-2 ${
                        item.phaseId === phase.id ? 'bg-violet-500/20 text-violet-700 dark:text-violet-300' : 'hover:bg-white/50 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${phase.color || 'bg-violet-500'}`} />
                      {phase.name}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <button
        onClick={() => removeChecklistItem(clientId, item.id)}
        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
        aria-label="Delete task"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>

      {/* Block form */}
      {showBlockForm && !item.isBlocked && (
        <div className="absolute left-0 right-0 top-full mt-1 ml-10 mr-2 glass-subtle rounded-xl p-3 z-10 shadow-lg">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Mark as blocked</p>
          <div className="flex gap-2 mb-2">
            {(['client', 'internal', 'external'] as const).map((by) => (
              <button
                key={by}
                onClick={() => saveBlock(by)}
                className="flex-1 px-2 py-1.5 rounded-lg text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors capitalize"
              >
                {by}
              </button>
            ))}
          </div>
          <input
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            placeholder="Reason (optional)"
            className="w-full bg-white/50 dark:bg-white/10 px-3 py-1.5 rounded-lg text-sm border border-white/30 dark:border-white/10 outline-none focus:ring-2 focus:ring-red-500/50 mb-2"
            onKeyDown={(e) => { if (e.key === 'Escape') setShowBlockForm(false); }}
          />
          <button
            onClick={() => setShowBlockForm(false)}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Subtasks expansion */}
      {showSubtasks && (
        <div className="absolute left-0 right-0 top-full mt-1 ml-10 mr-2 glass-subtle rounded-xl p-3 z-10 shadow-lg">
          {/* Subtask progress */}
          {hasSubtasks && (
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 bg-white/30 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${subtasks.length > 0 ? (completedSubtasks / subtasks.length) * 100 : 0}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {completedSubtasks}/{subtasks.length}
              </span>
            </div>
          )}

          {/* Subtask list */}
          {hasSubtasks && (
            <ul className="space-y-1.5 mb-3">
              {subtasks.map((subtask) => (
                <li key={subtask.id} className="flex items-center gap-2 group/subtask">
                  <button
                    onClick={() => toggleSubtask(clientId, item.id, subtask.id)}
                    className={`
                      flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-all
                      ${subtask.completed
                        ? 'bg-gradient-to-r from-emerald-400 to-green-500 border-transparent text-white'
                        : 'border-gray-300 dark:border-gray-500 hover:border-purple-500'
                      }
                    `}
                  >
                    {subtask.completed && (
                      <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  {editingSubtaskId === subtask.id ? (
                    <input
                      value={editingSubtaskValue}
                      onChange={(e) => setEditingSubtaskValue(e.target.value)}
                      onKeyDown={handleSubtaskEditKeyDown}
                      onBlur={saveSubtaskEdit}
                      className="flex-1 bg-white/50 dark:bg-white/10 px-2 py-0.5 rounded text-sm border border-purple-300 dark:border-purple-500 outline-none"
                      autoFocus
                    />
                  ) : (
                    <span
                      onClick={() => startEditingSubtask(subtask.id, subtask.title)}
                      className={`flex-1 text-sm cursor-pointer ${
                        subtask.completed
                          ? 'line-through text-gray-400 dark:text-gray-500'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {subtask.title}
                    </span>
                  )}

                  <button
                    onClick={() => removeSubtask(clientId, item.id, subtask.id)}
                    className="opacity-0 group-hover/subtask:opacity-100 p-0.5 text-gray-400 hover:text-red-500 transition-all"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Add subtask input */}
          <div className="flex items-center gap-2">
            <input
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              onKeyDown={handleSubtaskKeyDown}
              placeholder="Add a subtask..."
              className="flex-1 bg-white/50 dark:bg-white/10 px-3 py-1.5 rounded-lg text-sm border border-white/30 dark:border-white/10 outline-none focus:ring-2 focus:ring-purple-500/50 placeholder-gray-400"
            />
            <button
              onClick={handleAddSubtask}
              disabled={!newSubtaskTitle.trim()}
              className="p-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg disabled:opacity-50 hover:opacity-90 transition-opacity shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Comments expansion */}
      {showComments && (
        <div className="absolute left-0 right-0 top-full mt-1 ml-10 mr-2 glass-subtle rounded-xl p-3 z-10 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Comments {hasComments && `(${comments.length})`}
            </span>
          </div>

          {/* Comments list */}
          {hasComments && (
            <div className="space-y-3 mb-3 max-h-48 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-white/40 dark:bg-white/5 rounded-lg p-2.5 group/comment">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-medium">
                        {comment.author.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {comment.author}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {formatCommentTime(comment.createdAt)}
                        {comment.editedAt && ' (edited)'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover/comment:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEditingComment(comment.id, comment.text)}
                        className="p-0.5 text-gray-400 hover:text-blue-500 transition-colors"
                        title="Edit comment"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteComment(clientId, item.id, comment.id)}
                        className="p-0.5 text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete comment"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  {editingCommentId === comment.id ? (
                    <textarea
                      value={editingCommentValue}
                      onChange={(e) => setEditingCommentValue(e.target.value)}
                      onKeyDown={handleCommentEditKeyDown}
                      onBlur={saveCommentEdit}
                      className="w-full bg-white/50 dark:bg-white/10 px-2 py-1.5 rounded text-sm border border-blue-300 dark:border-blue-500 outline-none resize-none"
                      rows={2}
                      autoFocus
                    />
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap pl-8">
                      {comment.text}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add comment input */}
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-medium flex-shrink-0 mt-1">
              Y
            </div>
            <textarea
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              onKeyDown={handleCommentKeyDown}
              placeholder="Add a comment... (Enter to send, Shift+Enter for new line)"
              className="flex-1 bg-white/50 dark:bg-white/10 px-3 py-1.5 rounded-lg text-sm border border-white/30 dark:border-white/10 outline-none focus:ring-2 focus:ring-blue-500/50 placeholder-gray-400 resize-none"
              rows={2}
            />
            <button
              onClick={handleAddComment}
              disabled={!newCommentText.trim()}
              className="p-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg disabled:opacity-50 hover:opacity-90 transition-opacity shadow-lg mt-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
