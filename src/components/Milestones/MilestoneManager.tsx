import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Milestone } from '../../types';
import { useClientContext } from '../../context/ClientContext';
import { Button } from '../UI/Button';
import { Modal } from '../UI/Modal';

interface MilestoneManagerProps {
  clientId: string;
  milestones?: Milestone[];
}

const defaultColors = [
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
];

export function MilestoneManager({ clientId, milestones = [] }: MilestoneManagerProps) {
  const { addMilestone, updateMilestone, completeMilestone, removeMilestone, reorderMilestones } = useClientContext();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  const [showForm, setShowForm] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [color, setColor] = useState(defaultColors[0]);

  const sortedMilestones = [...milestones].sort((a, b) => a.order - b.order);
  const completedCount = sortedMilestones.filter((m) => m.completedAt).length;
  const progress = milestones.length > 0 ? (completedCount / milestones.length) * 100 : 0;

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTargetDate('');
    setColor(defaultColors[0]);
    setEditingMilestone(null);
  };

  const openEditForm = (milestone: Milestone) => {
    setEditingMilestone(milestone);
    setTitle(milestone.title);
    setDescription(milestone.description || '');
    setTargetDate(milestone.targetDate || '');
    setColor(milestone.color || defaultColors[0]);
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!title.trim()) return;

    if (editingMilestone) {
      updateMilestone(clientId, editingMilestone.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        targetDate: targetDate || undefined,
        color,
      });
    } else {
      addMilestone(clientId, {
        title: title.trim(),
        description: description.trim() || undefined,
        targetDate: targetDate || undefined,
        color,
      });
    }

    setShowForm(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    removeMilestone(clientId, id);
    setShowDeleteConfirm(null);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortedMilestones.findIndex((m) => m.id === active.id);
      const newIndex = sortedMilestones.findIndex((m) => m.id === over.id);
      const newOrder = arrayMove(sortedMilestones, oldIndex, newIndex).map((m, i) => ({
        ...m,
        order: i,
      }));
      reorderMilestones(clientId, newOrder);
    }
  };

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold gradient-text">Milestones</h3>
          {milestones.length > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {completedCount} of {milestones.length} completed
            </p>
          )}
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="p-2 text-gray-400 hover:text-purple-500 hover:bg-white/50 dark:hover:bg-white/10 rounded-lg transition-colors"
          title="Add milestone"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      {milestones.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white/30 dark:bg-white/10 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-violet-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 w-10 text-right">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      )}

      {milestones.length === 0 ? (
        <div className="text-center py-6">
          <div className="mx-auto h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-pink-500/20 flex items-center justify-center mb-3">
            <svg className="h-6 w-6 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Add milestones to track key phases
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={sortedMilestones.map((m) => m.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {sortedMilestones.map((milestone, index) => (
                <SortableMilestoneItem
                  key={milestone.id}
                  milestone={milestone}
                  isLast={index === sortedMilestones.length - 1}
                  onComplete={() => completeMilestone(clientId, milestone.id)}
                  onEdit={() => openEditForm(milestone)}
                  onDelete={() => setShowDeleteConfirm(milestone.id)}
                  formatDate={formatDate}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Add/Edit Milestone Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          resetForm();
        }}
        title={editingMilestone ? 'Edit Milestone' : 'Add Milestone'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Contract Signed"
              className="w-full px-4 py-2.5 rounded-xl border bg-white/50 dark:bg-white/5 backdrop-blur-sm text-gray-900 dark:text-gray-100 border-white/30 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this milestone"
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border bg-white/50 dark:bg-white/5 backdrop-blur-sm text-gray-900 dark:text-gray-100 border-white/30 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Target Date (optional)
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border bg-white/50 dark:bg-white/5 backdrop-blur-sm text-gray-900 dark:text-gray-100 border-white/30 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color
            </label>
            <div className="flex gap-2">
              {defaultColors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    color === c ? 'ring-2 ring-offset-2 ring-purple-500 scale-110' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!title.trim()}>
              {editingMilestone ? 'Save Changes' : 'Add Milestone'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(null)}
          />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative glass-strong rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-white/30 dark:border-white/10">
              <h3 className="text-lg font-semibold gradient-text mb-2">Delete Milestone?</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete this milestone?
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setShowDeleteConfirm(null)}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={() => handleDelete(showDeleteConfirm)}>
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface SortableMilestoneItemProps {
  milestone: Milestone;
  isLast: boolean;
  onComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
  formatDate: (date: string) => string;
}

function SortableMilestoneItem({
  milestone,
  isLast,
  onComplete,
  onEdit,
  onDelete,
  formatDate,
}: SortableMilestoneItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: milestone.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-start gap-3 p-3 rounded-xl transition-all ${
        milestone.completedAt
          ? 'bg-white/20 dark:bg-white/5'
          : 'glass-subtle hover:bg-white/60 dark:hover:bg-white/15'
      } ${isDragging ? 'shadow-lg ring-2 ring-purple-500/50' : ''}`}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        title="Drag to reorder"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </button>

      {/* Timeline dot */}
      <div className="flex flex-col items-center pt-1">
        <button
          onClick={onComplete}
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
            milestone.completedAt
              ? 'bg-gradient-to-r from-emerald-400 to-green-500 border-transparent'
              : 'border-current hover:border-purple-500'
          }`}
          style={{ borderColor: milestone.completedAt ? undefined : milestone.color }}
          title={milestone.completedAt ? 'Mark incomplete' : 'Mark complete'}
        >
          {milestone.completedAt && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
        {!isLast && (
          <div
            className="w-0.5 flex-1 mt-1 rounded-full"
            style={{ backgroundColor: milestone.color, opacity: 0.3 }}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4
              className={`font-medium ${
                milestone.completedAt
                  ? 'line-through text-gray-400 dark:text-gray-500'
                  : 'text-gray-900 dark:text-gray-100'
              }`}
            >
              {milestone.title}
            </h4>
            {milestone.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {milestone.description}
              </p>
            )}
            {milestone.targetDate && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatDate(milestone.targetDate)}
                {milestone.completedAt && (
                  <span className="text-green-500 ml-2">
                    Completed {formatDate(milestone.completedAt)}
                  </span>
                )}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onEdit}
              className="p-1 text-gray-400 hover:text-purple-500"
              title="Edit"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={onDelete}
              className="p-1 text-gray-400 hover:text-red-500"
              title="Delete"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
