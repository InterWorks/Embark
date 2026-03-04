import { useState } from 'react';
import type { Bud } from '../../types';

interface BudFormProps {
  bud?: Bud | null;
  onSave: (data: Omit<Bud, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}

const iconOptions = ['🤖', '🧠', '💡', '⚡', '🎯', '📊', '📋', '🚀', '💼', '🔧', '📈', '🎨', '🔍', '💬', '🌟'];
const colorOptions = [
  { name: 'Purple', value: 'from-violet-500 to-purple-500' },
  { name: 'Blue', value: 'from-blue-500 to-cyan-500' },
  { name: 'Green', value: 'from-green-500 to-emerald-500' },
  { name: 'Orange', value: 'from-orange-500 to-red-500' },
  { name: 'Pink', value: 'from-pink-500 to-rose-500' },
  { name: 'Indigo', value: 'from-indigo-500 to-blue-500' },
  { name: 'Teal', value: 'from-teal-500 to-cyan-500' },
  { name: 'Amber', value: 'from-amber-500 to-orange-500' },
];

export function BudForm({ bud, onSave, onClose }: BudFormProps) {
  const [name, setName] = useState(bud?.name || '');
  const [description, setDescription] = useState(bud?.description || '');
  const [systemPrompt, setSystemPrompt] = useState(
    bud?.systemPrompt ||
      'You are a helpful AI assistant for a client onboarding system called Embark. Help users manage their clients, tasks, and projects effectively.'
  );
  const [icon, setIcon] = useState(bud?.icon || '🤖');
  const [color, setColor] = useState(bud?.color || 'from-violet-500 to-purple-500');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      type: 'custom',
      description: description.trim() || 'A custom AI assistant',
      systemPrompt: systemPrompt.trim(),
      icon,
      color,
      assignedClientIds: bud?.assignedClientIds,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg glass-strong rounded-2xl shadow-2xl border border-white/30 dark:border-white/10 overflow-hidden">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-white/20 dark:border-white/10">
            <h2 className="text-lg font-semibold gradient-text">
              {bud ? 'Edit Bud' : 'Create Custom Bud'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form Body */}
          <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Preview */}
            <div className="flex items-center gap-3 p-3 glass-subtle rounded-xl">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-2xl`}>
                {icon}
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {name || 'Your Bud'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {description || 'Add a description...'}
                </p>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Sales Assistant"
                className="w-full px-3 py-2 bg-white/50 dark:bg-white/10 rounded-lg border border-white/30 dark:border-white/10 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of what this Bud does"
                className="w-full px-3 py-2 bg-white/50 dark:bg-white/10 rounded-lg border border-white/30 dark:border-white/10 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>

            {/* Icon */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Icon
              </label>
              <div className="flex flex-wrap gap-2">
                {iconOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setIcon(opt)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${
                      icon === opt
                        ? 'bg-purple-500 shadow-lg scale-110'
                        : 'bg-white/30 dark:bg-white/10 hover:bg-white/50 dark:hover:bg-white/20'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Color Theme
              </label>
              <div className="grid grid-cols-4 gap-2">
                {colorOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setColor(opt.value)}
                    className={`h-10 rounded-lg bg-gradient-to-r ${opt.value} transition-all ${
                      color === opt.value
                        ? 'ring-2 ring-offset-2 ring-gray-900 dark:ring-white dark:ring-offset-gray-800'
                        : 'hover:scale-105'
                    }`}
                    title={opt.name}
                  />
                ))}
              </div>
            </div>

            {/* System Prompt */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Personality & Instructions
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Define how your Bud should behave and what it specializes in
              </p>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={6}
                placeholder="You are a helpful AI assistant..."
                className="w-full px-3 py-2 bg-white/50 dark:bg-white/10 rounded-lg border border-white/30 dark:border-white/10 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none text-sm"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-5 border-t border-white/20 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {bud ? 'Save Changes' : 'Create Bud'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
