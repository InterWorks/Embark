import { useState } from 'react';
import type { OnboardingPhase } from '../../types';
import { useClientContext } from '../../context/ClientContext';
import { Button } from '../UI/Button';

interface PhaseManagerProps {
  clientId: string;
  phases: OnboardingPhase[];
  onClose: () => void;
}

const PRESET_COLORS = [
  { label: 'Violet', value: 'bg-violet-500' },
  { label: 'Blue', value: 'bg-blue-500' },
  { label: 'Cyan', value: 'bg-cyan-500' },
  { label: 'Emerald', value: 'bg-emerald-500' },
  { label: 'Amber', value: 'bg-amber-500' },
  { label: 'Rose', value: 'bg-rose-500' },
  { label: 'Indigo', value: 'bg-indigo-500' },
  { label: 'Orange', value: 'bg-orange-500' },
];

export function PhaseManager({ clientId, phases, onClose }: PhaseManagerProps) {
  const { addPhase, updatePhase, deletePhase, reorderPhases } = useClientContext();
  const [newPhaseName, setNewPhaseName] = useState('');
  const [newPhaseDescription, setNewPhaseDescription] = useState('');
  const [newPhaseColor, setNewPhaseColor] = useState('bg-violet-500');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editColor, setEditColor] = useState('');

  const sorted = [...phases].sort((a, b) => a.order - b.order);

  const handleAdd = () => {
    if (!newPhaseName.trim()) return;
    addPhase(clientId, {
      name: newPhaseName.trim(),
      description: newPhaseDescription.trim() || undefined,
      color: newPhaseColor,
    });
    setNewPhaseName('');
    setNewPhaseDescription('');
    setNewPhaseColor('bg-violet-500');
  };

  const startEdit = (phase: OnboardingPhase) => {
    setEditingId(phase.id);
    setEditName(phase.name);
    setEditDescription(phase.description || '');
    setEditColor(phase.color);
  };

  const saveEdit = () => {
    if (!editingId || !editName.trim()) return;
    updatePhase(clientId, editingId, {
      name: editName.trim(),
      description: editDescription.trim() || undefined,
      color: editColor,
    });
    setEditingId(null);
  };

  const movePhase = (phaseId: string, direction: 'up' | 'down') => {
    const idx = sorted.findIndex((p) => p.id === phaseId);
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === sorted.length - 1) return;
    const newOrder = [...sorted];
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];
    reorderPhases(clientId, newOrder);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative glass-strong rounded-2xl shadow-2xl p-6 max-w-lg w-full border border-white/30 dark:border-white/10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold gradient-text">Manage Phases</h2>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-white/20 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Existing phases */}
          {sorted.length > 0 ? (
            <ul className="space-y-2 mb-5">
              {sorted.map((phase, idx) => (
                <li key={phase.id} className="glass-subtle rounded-xl p-3">
                  {editingId === phase.id ? (
                    <div className="space-y-2">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-white/50 dark:bg-white/10 px-3 py-1.5 rounded-lg text-sm border border-white/30 dark:border-white/10 outline-none focus:ring-2 focus:ring-purple-500/50"
                        placeholder="Phase name"
                        autoFocus
                      />
                      <input
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="w-full bg-white/50 dark:bg-white/10 px-3 py-1.5 rounded-lg text-sm border border-white/30 dark:border-white/10 outline-none focus:ring-2 focus:ring-purple-500/50"
                        placeholder="Description (optional)"
                      />
                      <div className="flex gap-1.5 flex-wrap">
                        {PRESET_COLORS.map((c) => (
                          <button
                            key={c.value}
                            onClick={() => setEditColor(c.value)}
                            title={c.label}
                            className={`w-6 h-6 rounded-full ${c.value} transition-all ${
                              editColor === c.value ? 'ring-2 ring-offset-1 ring-gray-800 dark:ring-white scale-110' : ''
                            }`}
                          />
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveEdit} disabled={!editName.trim()}>Save</Button>
                        <Button size="sm" variant="secondary" onClick={() => setEditingId(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${phase.color || 'bg-violet-500'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{phase.name}</p>
                        {phase.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{phase.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => movePhase(phase.id, 'up')}
                          disabled={idx === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 transition-colors"
                          title="Move up"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => movePhase(phase.id, 'down')}
                          disabled={idx === sorted.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 transition-colors"
                          title="Move down"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => startEdit(phase)}
                          className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                          title="Edit"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => deletePhase(clientId, phase.id)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 text-center py-4">
              No phases yet. Add your first phase below.
            </p>
          )}

          {/* Add new phase */}
          <div className="border-t border-white/20 dark:border-white/10 pt-4 space-y-2">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Add Phase</p>
            <input
              value={newPhaseName}
              onChange={(e) => setNewPhaseName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              className="w-full bg-white/50 dark:bg-white/10 px-3 py-2 rounded-xl text-sm border border-white/30 dark:border-white/10 outline-none focus:ring-2 focus:ring-purple-500/50"
              placeholder="Phase name (e.g. Kickoff, Configuration, Launch)"
            />
            <input
              value={newPhaseDescription}
              onChange={(e) => setNewPhaseDescription(e.target.value)}
              className="w-full bg-white/50 dark:bg-white/10 px-3 py-2 rounded-xl text-sm border border-white/30 dark:border-white/10 outline-none focus:ring-2 focus:ring-purple-500/50"
              placeholder="Description (optional)"
            />
            <div className="flex gap-1.5 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setNewPhaseColor(c.value)}
                  title={c.label}
                  className={`w-6 h-6 rounded-full ${c.value} transition-all ${
                    newPhaseColor === c.value ? 'ring-2 ring-offset-1 ring-gray-800 dark:ring-white scale-110' : ''
                  }`}
                />
              ))}
            </div>
            <Button onClick={handleAdd} disabled={!newPhaseName.trim()} className="w-full">
              Add Phase
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
