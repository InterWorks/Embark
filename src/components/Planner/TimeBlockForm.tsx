import { useState, useEffect } from 'react';
import type { TimeBlock, Client } from '../../types';
import { TIME_BLOCK_COLORS } from '../../hooks/useDailyPlanner';

interface TimeBlockFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TimeBlockFormData) => void;
  onDelete?: () => void;
  initialData?: TimeBlock;
  initialDate?: string;
  clients: Client[];
}

export interface TimeBlockFormData {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  clientId?: string;
  taskId?: string;
  color: string;
  notes?: string;
}

export function TimeBlockForm({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
  initialDate,
  clients,
}: TimeBlockFormProps) {
  const isEditing = !!initialData;

  const getInitialFormData = (): TimeBlockFormData => {
    if (initialData) {
      const startDate = new Date(initialData.startTime);
      const endDate = new Date(initialData.endTime);
      return {
        title: initialData.title,
        date: startDate.toISOString().split('T')[0],
        startTime: startDate.toTimeString().slice(0, 5),
        endTime: endDate.toTimeString().slice(0, 5),
        clientId: initialData.clientId,
        taskId: initialData.taskId,
        color: initialData.color || TIME_BLOCK_COLORS[0].value,
        notes: initialData.notes || '',
      };
    }
    const now = new Date();
    const defaultDate = initialDate || now.toISOString().split('T')[0];
    return {
      title: '',
      date: defaultDate,
      startTime: '09:00',
      endTime: '10:00',
      color: TIME_BLOCK_COLORS[0].value,
      notes: '',
    };
  };

  const [formData, setFormData] = useState<TimeBlockFormData>(getInitialFormData);

  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormData());
    }
  }, [isOpen, initialData, initialDate]);

  const selectedClient = clients.find((c) => c.id === formData.clientId);
  const availableTasks = selectedClient?.checklist || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    onSave(formData);
  };

  const handleClientChange = (clientId: string) => {
    setFormData((prev) => ({
      ...prev,
      clientId: clientId || undefined,
      taskId: undefined, // Reset task when client changes
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg glass-strong rounded-2xl shadow-2xl border border-white/30 dark:border-white/10 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-white/20 dark:border-white/10">
          <h2 className="text-lg font-semibold gradient-text">
            {isEditing ? 'Edit Time Block' : 'Create Time Block'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Client Meeting, Focus Time"
              className="w-full px-3 py-2 glass-subtle rounded-lg border border-white/30 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-gray-900 dark:text-gray-100 placeholder-gray-400"
              autoFocus
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
              className="w-full px-3 py-2 glass-subtle rounded-lg border border-white/30 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData((prev) => ({ ...prev, startTime: e.target.value }))}
                className="w-full px-3 py-2 glass-subtle rounded-lg border border-white/30 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Time
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData((prev) => ({ ...prev, endTime: e.target.value }))}
                className="w-full px-3 py-2 glass-subtle rounded-lg border border-white/30 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color
            </label>
            <div className="flex gap-2">
              {TIME_BLOCK_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, color: color.value }))}
                  className={`w-8 h-8 rounded-lg bg-gradient-to-r ${color.value} transition-all ${
                    formData.color === color.value
                      ? 'ring-2 ring-offset-2 ring-purple-500 dark:ring-offset-gray-800'
                      : 'hover:scale-110'
                  }`}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Client Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Link to Client (optional)
            </label>
            <select
              value={formData.clientId || ''}
              onChange={(e) => handleClientChange(e.target.value)}
              className="w-full px-3 py-2 glass-subtle rounded-lg border border-white/30 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-gray-900 dark:text-gray-100"
            >
              <option value="">No client</option>
              {clients
                .filter((c) => !c.archived)
                .map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Task Selection (only if client selected) */}
          {formData.clientId && availableTasks.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Link to Task (optional)
              </label>
              <select
                value={formData.taskId || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, taskId: e.target.value || undefined }))}
                className="w-full px-3 py-2 glass-subtle rounded-lg border border-white/30 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-gray-900 dark:text-gray-100"
              >
                <option value="">No task</option>
                {availableTasks
                  .filter((t) => !t.completed)
                  .map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Add any notes..."
              rows={3}
              className="w-full px-3 py-2 glass-subtle rounded-lg border border-white/30 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-gray-900 dark:text-gray-100 placeholder-gray-400 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <div>
              {isEditing && onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 glass-subtle text-gray-700 dark:text-gray-300 rounded-lg hover:bg-white/60 dark:hover:bg-white/15 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!formData.title.trim()}
                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isEditing ? 'Save Changes' : 'Create'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
