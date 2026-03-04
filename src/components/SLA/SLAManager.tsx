import { useState } from 'react';
import { useSLA } from '../../hooks/useSLA';
import { Button } from '../UI/Button';
import type { SLADefinition, SLAType, SLAEscalationAction } from '../../types/sla';

const SLA_TYPE_LABELS: Record<SLAType, string> = {
  onboarding_completion:   'Onboarding Completion',
  task_completion:         'Task Completion',
  communication_frequency: 'Communication Frequency',
  first_response:          'First Response',
};

const SLA_TYPE_DESCRIPTIONS: Record<SLAType, string> = {
  onboarding_completion:   'All tasks must be completed within N days of client creation.',
  task_completion:         'Individual tasks must be completed within N days.',
  communication_frequency: 'A communication log entry must exist within the last N days.',
  first_response:          'At least one task must be completed within N days of client creation.',
};

interface FormState {
  name: string;
  slaType: SLAType;
  targetDays: string;
  warningThreshold: string;
  escalationActions: SLAEscalationAction[];
}

const EMPTY_FORM: FormState = {
  name: '',
  slaType: 'onboarding_completion',
  targetDays: '30',
  warningThreshold: '80',
  escalationActions: ['notify'],
};

export function SLAManager() {
  const { definitions, addDefinition, updateDefinition, deleteDefinition, toggleDefinition } = useSLA();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (def: SLADefinition) => {
    setForm({
      name: def.name,
      slaType: def.slaType,
      targetDays: String(def.targetDays),
      warningThreshold: String(Math.round(def.warningThreshold * 100)),
      escalationActions: def.escalationActions,
    });
    setEditingId(def.id);
    setShowForm(true);
  };

  const handleSubmit = () => {
    const targetDays = parseInt(form.targetDays, 10);
    const warningThreshold = parseInt(form.warningThreshold, 10) / 100;
    if (!form.name.trim() || isNaN(targetDays) || targetDays <= 0) return;

    const data = {
      name: form.name,
      slaType: form.slaType,
      targetDays,
      warningThreshold: Math.min(Math.max(warningThreshold, 0), 1),
      escalationActions: form.escalationActions,
      enabled: true,
    };

    if (editingId) {
      updateDefinition(editingId, data);
    } else {
      addDefinition(data);
    }
    setShowForm(false);
    setEditingId(null);
  };

  const toggleAction = (action: SLAEscalationAction) => {
    setForm(prev => ({
      ...prev,
      escalationActions: prev.escalationActions.includes(action)
        ? prev.escalationActions.filter(a => a !== action)
        : [...prev.escalationActions, action],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black font-display text-zinc-900 dark:text-white">SLA Rules</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Define service-level agreements. Breaches trigger alerts and webhooks.
          </p>
        </div>
        <Button onClick={openAdd}>+ Add SLA Rule</Button>
      </div>

      {definitions.length === 0 ? (
        <p className="text-sm text-zinc-400 dark:text-zinc-500 py-8 text-center">
          No SLA rules yet. Add one to start monitoring deadlines.
        </p>
      ) : (
        <div className="space-y-3">
          {definitions.map(def => (
            <div key={def.id} className="border-2 border-zinc-200 dark:border-zinc-700 rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-zinc-900 dark:text-white">{def.name}</span>
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${def.enabled ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800'}`}>
                      {def.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                    {SLA_TYPE_LABELS[def.slaType]} · <strong>{def.targetDays}d</strong> target · Warning at <strong>{Math.round(def.warningThreshold * 100)}%</strong>
                  </p>
                  {def.escalationActions.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {def.escalationActions.map(a => (
                        <span key={a} className="px-1.5 py-0.5 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded capitalize">{a}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => toggleDefinition(def.id)} className="px-3 py-1.5 text-xs font-bold border-2 border-zinc-300 dark:border-zinc-600 rounded-md hover:border-zinc-500 transition-colors">
                    {def.enabled ? 'Disable' : 'Enable'}
                  </button>
                  <button onClick={() => openEdit(def)} className="px-3 py-1.5 text-xs font-bold border-2 border-zinc-300 dark:border-zinc-600 rounded-md hover:border-zinc-500 transition-colors">
                    Edit
                  </button>
                  <button onClick={() => deleteDefinition(def.id)} className="px-3 py-1.5 text-xs font-bold border-2 border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-600 rounded-xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-black font-display text-zinc-900 dark:text-white">
              {editingId ? 'Edit SLA Rule' : 'Add SLA Rule'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Rule Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. 30-Day Onboarding SLA"
                  className="w-full px-3 py-2 border-2 border-zinc-300 dark:border-zinc-600 rounded-lg text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">SLA Type</label>
                <select
                  value={form.slaType}
                  onChange={e => setForm(prev => ({ ...prev, slaType: e.target.value as SLAType }))}
                  className="w-full px-3 py-2 border-2 border-zinc-300 dark:border-zinc-600 rounded-lg text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none"
                >
                  {(Object.keys(SLA_TYPE_LABELS) as SLAType[]).map(t => (
                    <option key={t} value={t}>{SLA_TYPE_LABELS[t]}</option>
                  ))}
                </select>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{SLA_TYPE_DESCRIPTIONS[form.slaType]}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Target Days</label>
                  <input
                    type="number"
                    min={1}
                    value={form.targetDays}
                    onChange={e => setForm(prev => ({ ...prev, targetDays: e.target.value }))}
                    className="w-full px-3 py-2 border-2 border-zinc-300 dark:border-zinc-600 rounded-lg text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Warning Threshold (%)</label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={form.warningThreshold}
                    onChange={e => setForm(prev => ({ ...prev, warningThreshold: e.target.value }))}
                    className="w-full px-3 py-2 border-2 border-zinc-300 dark:border-zinc-600 rounded-lg text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">Escalation Actions</label>
                <div className="flex gap-4">
                  {(['notify', 'webhook'] as SLAEscalationAction[]).map(a => (
                    <label key={a} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.escalationActions.includes(a)}
                        onChange={() => toggleAction(a)}
                        className="accent-violet-600"
                      />
                      <span className="text-sm text-zinc-700 dark:text-zinc-300 capitalize">{a === 'notify' ? 'In-app notification' : 'Webhook'}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={!form.name.trim() || !form.targetDays}>
                {editingId ? 'Save Changes' : 'Add Rule'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
