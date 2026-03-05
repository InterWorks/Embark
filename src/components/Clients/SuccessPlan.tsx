import { useState } from 'react';
import type { Client, SuccessPlan, SuccessPlanTask } from '../../types';

interface SuccessPlanProps {
  client: Client;
  onUpdate: (plan: SuccessPlan) => void;
}

type SuccessPlanCategory = SuccessPlanTask['category'];

const CATEGORY_META: Record<SuccessPlanCategory, { label: string; icon: string }> = {
  adoption: { label: 'Adoption Milestones', icon: '🚀' },
  qbr: { label: 'QBR Schedule', icon: '📅' },
  expansion: { label: 'Expansion Targets', icon: '💰' },
  'renewal-prep': { label: 'Renewal Prep', icon: '🔄' },
  custom: { label: 'Custom', icon: '⚙️' },
};

const CATEGORY_ORDER: SuccessPlanCategory[] = ['adoption', 'qbr', 'expansion', 'renewal-prep', 'custom'];

function resolveDueDate(relative: string): string {
  const match = relative.match(/^\+(\d+)d$/);
  if (!match) return relative;
  const days = parseInt(match[1], 10);
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function buildTemplate(templateName: string, rawTasks: SuccessPlanTask[]): SuccessPlan {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    templateName,
    tasks: rawTasks.map(t => ({
      ...t,
      id: crypto.randomUUID(),
      dueDate: t.dueDate ? resolveDueDate(t.dueDate) : undefined,
    })),
  };
}

const NINETY_DAY_TEMPLATE_TASKS: SuccessPlanTask[] = [
  { id: '1', title: 'Complete product onboarding training', completed: false, category: 'adoption', dueDate: '+30d' },
  { id: '2', title: 'Achieve 80% feature adoption', completed: false, category: 'adoption', dueDate: '+60d' },
  { id: '3', title: '30-day check-in call', completed: false, category: 'qbr', dueDate: '+30d' },
  { id: '4', title: '60-day business review', completed: false, category: 'qbr', dueDate: '+60d' },
  { id: '5', title: '90-day executive QBR', completed: false, category: 'qbr', dueDate: '+90d' },
  { id: '6', title: 'Identify expansion opportunity', completed: false, category: 'expansion', dueDate: '+60d' },
  { id: '7', title: 'Collect NPS survey response', completed: false, category: 'renewal-prep', dueDate: '+45d' },
  { id: '8', title: 'Renewal discussion and pricing review', completed: false, category: 'renewal-prep', dueDate: '+80d' },
];

const ANNUAL_TEMPLATE_TASKS: SuccessPlanTask[] = [
  { id: '1', title: 'Complete full product certification', completed: false, category: 'adoption', dueDate: '+60d' },
  { id: '2', title: 'Achieve 90% seat utilization', completed: false, category: 'adoption', dueDate: '+120d' },
  { id: '3', title: 'Advanced feature adoption drive', completed: false, category: 'adoption', dueDate: '+180d' },
  { id: '4', title: 'Q1 Business Review', completed: false, category: 'qbr', dueDate: '+90d' },
  { id: '5', title: 'Q2 Mid-Year Review', completed: false, category: 'qbr', dueDate: '+180d' },
  { id: '6', title: 'Q3 Strategic Alignment', completed: false, category: 'qbr', dueDate: '+270d' },
  { id: '7', title: 'Q4 Annual Executive Review', completed: false, category: 'qbr', dueDate: '+360d' },
  { id: '8', title: 'Upsell discovery call', completed: false, category: 'expansion', dueDate: '+120d' },
  { id: '9', title: 'Present expansion proposal', completed: false, category: 'expansion', dueDate: '+200d' },
  { id: '10', title: 'Annual NPS survey', completed: false, category: 'renewal-prep', dueDate: '+300d' },
  { id: '11', title: 'Renewal negotiation kickoff', completed: false, category: 'renewal-prep', dueDate: '+330d' },
  { id: '12', title: 'Contract renewal signed', completed: false, category: 'renewal-prep', dueDate: '+355d' },
];

function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function SuccessPlanPanel({ client, onUpdate }: SuccessPlanProps) {
  const plan = client.successPlan;

  const [editingKpi, setEditingKpi] = useState<string | null>(null);
  const [kpiDraft, setKpiDraft] = useState<string>('');
  const [editingTaskNotes, setEditingTaskNotes] = useState<string | null>(null);
  const [taskNotesDraft, setTaskNotesDraft] = useState<string>('');
  const [addingTaskCategory, setAddingTaskCategory] = useState<SuccessPlanCategory | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');

  // ---- No plan yet ----
  if (!plan) {
    return (
      <div className="glass-card p-6">
        <div className="flex flex-col items-center justify-center py-8 text-center gap-4">
          <div className="text-4xl">🎉</div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
              This client has graduated!
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
              Create a Success Plan to continue driving value and track post-onboarding progress.
            </p>
          </div>
          <div className="flex gap-3 flex-wrap justify-center mt-2">
            <button
              onClick={() => onUpdate(buildTemplate('90-Day Success Plan', NINETY_DAY_TEMPLATE_TASKS))}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-medium text-sm shadow-lg shadow-purple-500/25 hover:opacity-90 transition-opacity"
            >
              90-Day Success Plan
            </button>
            <button
              onClick={() => onUpdate(buildTemplate('Annual Account Plan', ANNUAL_TEMPLATE_TASKS))}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium text-sm shadow-lg shadow-blue-500/25 hover:opacity-90 transition-opacity"
            >
              Annual Account Plan
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- Helpers to mutate plan ----
  const updatePlan = (patch: Partial<SuccessPlan>) => {
    onUpdate({ ...plan, ...patch });
  };

  const updateTask = (taskId: string, patch: Partial<SuccessPlanTask>) => {
    onUpdate({
      ...plan,
      tasks: plan.tasks.map(t => t.id === taskId ? { ...t, ...patch } : t),
    });
  };

  const addTask = (category: SuccessPlanCategory, title: string, dueDate?: string) => {
    const newTask: SuccessPlanTask = {
      id: crypto.randomUUID(),
      title,
      completed: false,
      category,
      dueDate: dueDate || undefined,
    };
    onUpdate({ ...plan, tasks: [...plan.tasks, newTask] });
  };

  const removeTask = (taskId: string) => {
    onUpdate({ ...plan, tasks: plan.tasks.filter(t => t.id !== taskId) });
  };

  // ---- Progress ----
  const completedCount = plan.tasks.filter(t => t.completed).length;
  const totalCount = plan.tasks.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // ---- KPI inline edit helpers ----
  const startKpiEdit = (key: string, current: string) => {
    setEditingKpi(key);
    setKpiDraft(current);
  };

  const commitKpiEdit = (key: string) => {
    const val = kpiDraft.trim();
    if (key === 'adoptionPct') {
      const n = parseFloat(val);
      updatePlan({ adoptionPct: isNaN(n) ? undefined : Math.min(100, Math.max(0, n)) });
    } else if (key === 'mrrExpansion') {
      // Accept dollar amounts (e.g. "1500") and convert to cents
      const raw = val.replace(/[$,]/g, '');
      const n = parseFloat(raw);
      updatePlan({ mrrExpansion: isNaN(n) ? undefined : Math.round(n * 100) });
    } else if (key === 'npsTarget') {
      const n = parseFloat(val);
      updatePlan({ npsTarget: isNaN(n) ? undefined : Math.min(10, Math.max(0, n)) });
    }
    setEditingKpi(null);
  };

  // ---- Task notes inline edit ----
  const startNotesEdit = (taskId: string, current: string) => {
    setEditingTaskNotes(taskId);
    setTaskNotesDraft(current);
  };

  const commitNotesEdit = (taskId: string) => {
    updateTask(taskId, { notes: taskNotesDraft.trim() || undefined });
    setEditingTaskNotes(null);
  };

  const tasksByCategory = (cat: SuccessPlanCategory) => plan.tasks.filter(t => t.category === cat);

  return (
    <div className="glass-card p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-semibold gradient-text">{plan.templateName}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Created {new Date(plan.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {completedCount}/{totalCount} tasks
        </span>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-gray-500 dark:text-gray-400">Overall Progress</span>
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{progressPct}%</span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-white/20 dark:bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-600 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Adoption % */}
        <div className="glass-subtle rounded-xl p-3 flex flex-col gap-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">Adoption</span>
          {editingKpi === 'adoptionPct' ? (
            <input
              autoFocus
              type="number"
              min="0"
              max="100"
              value={kpiDraft}
              onChange={e => setKpiDraft(e.target.value)}
              onBlur={() => commitKpiEdit('adoptionPct')}
              onKeyDown={e => { if (e.key === 'Enter') commitKpiEdit('adoptionPct'); if (e.key === 'Escape') setEditingKpi(null); }}
              className="text-lg font-bold bg-transparent border-b border-purple-400 outline-none text-gray-900 dark:text-gray-100 w-full"
            />
          ) : (
            <button
              onClick={() => startKpiEdit('adoptionPct', plan.adoptionPct != null ? String(plan.adoptionPct) : '')}
              className="text-lg font-bold text-gray-900 dark:text-gray-100 hover:text-purple-600 dark:hover:text-purple-400 text-left transition-colors"
              title="Click to edit"
            >
              {plan.adoptionPct != null ? `${plan.adoptionPct}%` : <span className="text-gray-400 text-sm font-normal">Set target</span>}
            </button>
          )}
        </div>

        {/* MRR Expansion */}
        <div className="glass-subtle rounded-xl p-3 flex flex-col gap-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">MRR Expansion</span>
          {editingKpi === 'mrrExpansion' ? (
            <input
              autoFocus
              type="text"
              value={kpiDraft}
              placeholder="e.g. 1500"
              onChange={e => setKpiDraft(e.target.value)}
              onBlur={() => commitKpiEdit('mrrExpansion')}
              onKeyDown={e => { if (e.key === 'Enter') commitKpiEdit('mrrExpansion'); if (e.key === 'Escape') setEditingKpi(null); }}
              className="text-lg font-bold bg-transparent border-b border-purple-400 outline-none text-gray-900 dark:text-gray-100 w-full"
            />
          ) : (
            <button
              onClick={() => startKpiEdit('mrrExpansion', plan.mrrExpansion != null ? String(plan.mrrExpansion / 100) : '')}
              className="text-lg font-bold text-gray-900 dark:text-gray-100 hover:text-purple-600 dark:hover:text-purple-400 text-left transition-colors"
              title="Click to edit"
            >
              {plan.mrrExpansion != null ? formatCents(plan.mrrExpansion) : <span className="text-gray-400 text-sm font-normal">Set target</span>}
            </button>
          )}
        </div>

        {/* QBR Status */}
        <div className="glass-subtle rounded-xl p-3 flex flex-col gap-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">QBR Status</span>
          <button
            onClick={() => updatePlan({ qbrCompleted: !plan.qbrCompleted })}
            className={`text-lg font-bold text-left transition-colors ${
              plan.qbrCompleted
                ? 'text-emerald-500 dark:text-emerald-400'
                : 'text-gray-400 dark:text-gray-500 hover:text-emerald-500 dark:hover:text-emerald-400'
            }`}
            title="Click to toggle"
          >
            {plan.qbrCompleted ? 'Completed' : 'Pending'}
          </button>
        </div>

        {/* NPS Target */}
        <div className="glass-subtle rounded-xl p-3 flex flex-col gap-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">NPS Target</span>
          {editingKpi === 'npsTarget' ? (
            <input
              autoFocus
              type="number"
              min="0"
              max="10"
              value={kpiDraft}
              onChange={e => setKpiDraft(e.target.value)}
              onBlur={() => commitKpiEdit('npsTarget')}
              onKeyDown={e => { if (e.key === 'Enter') commitKpiEdit('npsTarget'); if (e.key === 'Escape') setEditingKpi(null); }}
              className="text-lg font-bold bg-transparent border-b border-purple-400 outline-none text-gray-900 dark:text-gray-100 w-full"
            />
          ) : (
            <button
              onClick={() => startKpiEdit('npsTarget', plan.npsTarget != null ? String(plan.npsTarget) : '')}
              className="text-lg font-bold text-gray-900 dark:text-gray-100 hover:text-purple-600 dark:hover:text-purple-400 text-left transition-colors"
              title="Click to edit"
            >
              {plan.npsTarget != null ? `${plan.npsTarget}/10` : <span className="text-gray-400 text-sm font-normal">Set target</span>}
            </button>
          )}
        </div>
      </div>

      {/* Task List Grouped by Category */}
      <div className="space-y-5">
        {CATEGORY_ORDER.map(category => {
          const tasks = tasksByCategory(category);
          const meta = CATEGORY_META[category];

          return (
            <div key={category}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <span>{meta.icon}</span>
                  {meta.label}
                  {tasks.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/20 dark:bg-white/10 text-xs text-gray-500 dark:text-gray-400">
                      {tasks.filter(t => t.completed).length}/{tasks.length}
                    </span>
                  )}
                </h4>
                {addingTaskCategory !== category && (
                  <button
                    onClick={() => { setAddingTaskCategory(category); setNewTaskTitle(''); setNewTaskDueDate(''); }}
                    className="text-xs text-purple-500 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium flex items-center gap-0.5 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Task
                  </button>
                )}
              </div>

              <div className="space-y-1.5">
                {tasks.map(task => (
                  <div key={task.id} className="glass-subtle rounded-xl p-3 group">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={e => updateTask(task.id, { completed: e.target.checked })}
                        className="mt-0.5 w-4 h-4 rounded border-gray-300 text-purple-500 focus:ring-purple-500 cursor-pointer flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-sm ${task.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>
                            {task.title}
                          </span>
                          {task.dueDate && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                              !task.completed && new Date(task.dueDate) < new Date()
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                : 'bg-white/20 dark:bg-white/10 text-gray-500 dark:text-gray-400'
                            }`}>
                              {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>

                        {/* Notes inline edit */}
                        {editingTaskNotes === task.id ? (
                          <div className="mt-1.5">
                            <textarea
                              autoFocus
                              value={taskNotesDraft}
                              onChange={e => setTaskNotesDraft(e.target.value)}
                              onBlur={() => commitNotesEdit(task.id)}
                              onKeyDown={e => { if (e.key === 'Escape') setEditingTaskNotes(null); }}
                              rows={2}
                              placeholder="Add notes..."
                              className="w-full text-xs rounded-lg border bg-white/50 dark:bg-white/5 text-gray-900 dark:text-gray-100 border-white/30 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50 p-2 resize-none"
                            />
                          </div>
                        ) : task.notes ? (
                          <button
                            onClick={() => startNotesEdit(task.id, task.notes ?? '')}
                            className="mt-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-left transition-colors"
                          >
                            {task.notes}
                          </button>
                        ) : (
                          <button
                            onClick={() => startNotesEdit(task.id, '')}
                            className="mt-1 text-xs text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            + Add notes
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => removeTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 dark:hover:text-red-400 flex-shrink-0 mt-0.5"
                        title="Remove task"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add task inline form */}
                {addingTaskCategory === category && (
                  <div className="glass-subtle rounded-xl p-3 border border-purple-400/30">
                    <div className="flex flex-col gap-2">
                      <input
                        autoFocus
                        type="text"
                        value={newTaskTitle}
                        onChange={e => setNewTaskTitle(e.target.value)}
                        placeholder="Task title..."
                        onKeyDown={e => {
                          if (e.key === 'Enter' && newTaskTitle.trim()) {
                            addTask(category, newTaskTitle.trim(), newTaskDueDate || undefined);
                            setAddingTaskCategory(null);
                          }
                          if (e.key === 'Escape') setAddingTaskCategory(null);
                        }}
                        className="text-sm rounded-lg border bg-white/50 dark:bg-white/5 text-gray-900 dark:text-gray-100 border-white/30 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50 px-3 py-1.5"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={newTaskDueDate}
                          onChange={e => setNewTaskDueDate(e.target.value)}
                          className="text-xs rounded-lg border bg-white/50 dark:bg-white/5 text-gray-900 dark:text-gray-100 border-white/30 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50 px-2 py-1"
                        />
                        <button
                          onClick={() => {
                            if (newTaskTitle.trim()) {
                              addTask(category, newTaskTitle.trim(), newTaskDueDate || undefined);
                            }
                            setAddingTaskCategory(null);
                          }}
                          className="px-3 py-1 text-xs font-medium rounded-lg bg-purple-500 text-white hover:bg-purple-600 transition-colors"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => setAddingTaskCategory(null)}
                          className="px-3 py-1 text-xs font-medium rounded-lg glass-subtle text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {tasks.length === 0 && addingTaskCategory !== category && (
                  <p className="text-xs text-gray-400 dark:text-gray-600 italic pl-2">No tasks yet</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Plan-level Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Plan Notes</label>
        <textarea
          value={plan.notes ?? ''}
          onChange={e => updatePlan({ notes: e.target.value || undefined })}
          rows={3}
          placeholder="Add notes about this success plan..."
          className="w-full rounded-xl border bg-white/50 dark:bg-white/5 backdrop-blur-sm text-gray-900 dark:text-gray-100 border-white/30 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm p-3 resize-none"
        />
      </div>
    </div>
  );
}
