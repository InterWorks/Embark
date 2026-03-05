import { useState } from 'react';
import { useAutomations, triggerConfig, actionConfig } from '../../hooks/useAutomations';
import { useTemplates } from '../../hooks/useTemplates';
import { useEmailTemplates } from '../../hooks/useEmailTemplates';
import type { AutomationRule, AutomationTrigger, AutomationActionType, AutomationCondition, AutomationAction, EmailSequenceStep } from '../../types';

export function AutomationManager() {
  const {
    rules,
    logs,
    enabledCount,
    addRule,
    updateRule,
    deleteRule,
    toggleRule,
    duplicateRule,
    clearLogs,
  } = useAutomations();

  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [showLogs, setShowLogs] = useState(false);

  const handleSave = (
    name: string,
    trigger: AutomationTrigger,
    conditions: AutomationCondition[],
    action: AutomationAction
  ) => {
    if (editingRule) {
      updateRule(editingRule.id, { name, trigger, conditions, action });
    } else {
      addRule(name, trigger, conditions, action);
    }
    setShowForm(false);
    setEditingRule(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Automations</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {rules.length} automation{rules.length !== 1 ? 's' : ''} ({enabledCount} active)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLogs(true)}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            View Logs
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Automation
          </button>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-gradient-to-r from-violet-500 to-indigo-600 rounded-xl p-6 text-white">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/20 rounded-xl">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-1">Automate Your Workflow</h2>
            <p className="text-violet-100">
              Create rules that automatically perform actions when certain events occur.
              Save time and ensure consistency in your client onboarding process.
            </p>
          </div>
        </div>
      </div>

      {/* Rules List */}
      {rules.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No automations yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-md mx-auto">
            Create your first automation to streamline repetitive tasks and keep your workflow consistent.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Automation
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {rules.map(rule => (
            <AutomationCard
              key={rule.id}
              rule={rule}
              onToggle={() => toggleRule(rule.id)}
              onEdit={() => {
                setEditingRule(rule);
                setShowForm(true);
              }}
              onDuplicate={() => duplicateRule(rule.id)}
              onDelete={() => deleteRule(rule.id)}
            />
          ))}
        </div>
      )}

      {/* Automation Form Modal */}
      {showForm && (
        <AutomationFormModal
          rule={editingRule}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
            setEditingRule(null);
          }}
        />
      )}

      {/* Logs Modal */}
      {showLogs && (
        <LogsModal
          logs={logs}
          onClear={clearLogs}
          onClose={() => setShowLogs(false)}
        />
      )}
    </div>
  );
}

interface AutomationCardProps {
  rule: AutomationRule;
  onToggle: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

function AutomationCard({ rule, onToggle, onEdit, onDuplicate, onDelete }: AutomationCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const trigger = triggerConfig[rule.trigger];
  const action = actionConfig[rule.action.type];

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border ${rule.enabled ? 'border-gray-200 dark:border-gray-700' : 'border-gray-200 dark:border-gray-700 opacity-60'} overflow-hidden`}>
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Toggle */}
          <button
            onClick={onToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 mt-1 ${
              rule.enabled ? 'bg-violet-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                rule.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">{rule.name}</h3>
              {!rule.enabled && (
                <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded">
                  Disabled
                </span>
              )}
            </div>

            {/* Trigger & Action */}
            <div className="flex items-center gap-2 text-sm">
              <span className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded">
                <span>{trigger?.icon}</span>
                <span>When {trigger?.label.toLowerCase()}</span>
              </span>
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <span className="flex items-center gap-1 px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded">
                <span>{action?.icon}</span>
                <span>{action?.label}</span>
              </span>
            </div>

            {/* Conditions */}
            {rule.conditions.length > 0 && (
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {rule.conditions.length} condition{rule.conditions.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={onEdit}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              title="Edit"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              onClick={onDuplicate}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              title="Duplicate"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
              title="Delete"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="px-4 pb-4">
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300 mb-3">
              Delete this automation? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onDelete();
                  setShowDeleteConfirm(false);
                }}
                className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface AutomationFormModalProps {
  rule: AutomationRule | null;
  onSave: (name: string, trigger: AutomationTrigger, conditions: AutomationCondition[], action: AutomationAction) => void;
  onClose: () => void;
}

function SequenceVisualizer({ steps, emailTemplates }: {
  steps: EmailSequenceStep[];
  emailTemplates: Array<{ id: string; name: string }>;
}) {
  if (steps.length === 0) return null;

  return (
    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
        Sequence Timeline
      </p>
      <div className="flex items-start gap-0 overflow-x-auto pb-2">
        {steps.map((step, index) => {
          const template = emailTemplates.find(t => t.id === step.templateId);
          return (
            <div key={index} className="flex items-center flex-shrink-0">
              {/* Node */}
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/40 border-2 border-violet-400 dark:border-violet-500 flex items-center justify-center text-xs font-bold text-violet-700 dark:text-violet-300">
                  {index + 1}
                </div>
                <div className="mt-1 max-w-[80px] text-center">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                    {template ? template.name : 'Unknown'}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {step.delayDays === 0 ? 'Immediately' : `Day ${step.delayDays}`}
                  </p>
                </div>
              </div>
              {/* Connector */}
              {index < steps.length - 1 && (
                <div className="flex items-center mx-1 mb-6">
                  <div className="w-8 h-px bg-violet-300 dark:bg-violet-600" />
                  <svg className="w-3 h-3 text-violet-400 dark:text-violet-500 -ml-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AutomationFormModal({ rule, onSave, onClose }: AutomationFormModalProps) {
  const { templates } = useTemplates();
  const { templates: emailTemplates } = useEmailTemplates();
  const [name, setName] = useState(rule?.name || '');
  const [trigger, setTrigger] = useState<AutomationTrigger>(rule?.trigger || 'client_created');
  const [conditions, setConditions] = useState<AutomationCondition[]>(rule?.conditions || []);
  const [actionType, setActionType] = useState<AutomationActionType>(rule?.action.type || 'send_notification');
  const [actionValue, setActionValue] = useState(rule?.action.value || '');

  // Parse existing sequence steps if editing a send_email_sequence rule
  const parseInitialSteps = (): EmailSequenceStep[] => {
    if (rule?.action.type === 'send_email_sequence' && rule.action.value) {
      try {
        return JSON.parse(rule.action.value);
      } catch {
        return [];
      }
    }
    return [];
  };
  const [sequenceSteps, setSequenceSteps] = useState<EmailSequenceStep[]>(parseInitialSteps);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const finalValue = actionType === 'send_email_sequence'
      ? JSON.stringify(sequenceSteps)
      : actionValue;
    onSave(name.trim(), trigger, conditions, { type: actionType, value: finalValue });
  };

  const addCondition = () => {
    setConditions([...conditions, { field: 'status', operator: 'equals', value: 'active' }]);
  };

  const updateCondition = (index: number, updates: Partial<AutomationCondition>) => {
    setConditions(conditions.map((c, i) => i === index ? { ...c, ...updates } : c));
  };

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const addSequenceStep = () => {
    const firstTemplateId = emailTemplates[0]?.id || '';
    setSequenceSteps(prev => [...prev, { templateId: firstTemplateId, delayDays: 0 }]);
  };

  const updateSequenceStep = (index: number, updates: Partial<EmailSequenceStep>) => {
    setSequenceSteps(prev => prev.map((s, i) => i === index ? { ...s, ...updates } : s));
  };

  const removeSequenceStep = (index: number) => {
    setSequenceSteps(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {rule ? 'Edit Automation' : 'New Automation'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Automation Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Welcome new clients"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500"
              required
            />
          </div>

          {/* Trigger */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              When this happens...
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(triggerConfig) as AutomationTrigger[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTrigger(t)}
                  className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-colors ${
                    trigger === t
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <span className="text-xl">{triggerConfig[t].icon}</span>
                  <div>
                    <div className="font-medium text-sm">{triggerConfig[t].label}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{triggerConfig[t].description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Conditions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Only if... (optional)
              </label>
              <button
                type="button"
                onClick={addCondition}
                className="text-sm text-violet-600 dark:text-violet-400 hover:underline"
              >
                + Add condition
              </button>
            </div>
            {conditions.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                No conditions - automation will run for all matching events
              </p>
            ) : (
              <div className="space-y-2">
                {conditions.map((condition, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <select
                      value={condition.field}
                      onChange={(e) => updateCondition(index, { field: e.target.value as AutomationCondition['field'] })}
                      className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="status">Status</option>
                      <option value="priority">Priority</option>
                      <option value="has_tag">Has Tag</option>
                      <option value="task_count">Task Count</option>
                      <option value="completed_percentage">Completion %</option>
                    </select>
                    <select
                      value={condition.operator}
                      onChange={(e) => updateCondition(index, { operator: e.target.value as AutomationCondition['operator'] })}
                      className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="equals">equals</option>
                      <option value="not_equals">does not equal</option>
                      <option value="greater_than">greater than</option>
                      <option value="less_than">less than</option>
                    </select>
                    <input
                      type="text"
                      value={String(condition.value)}
                      onChange={(e) => updateCondition(index, { value: e.target.value })}
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Value"
                    />
                    <button
                      type="button"
                      onClick={() => removeCondition(index)}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Then do this...
            </label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {(Object.keys(actionConfig) as AutomationActionType[]).map(a => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setActionType(a)}
                  className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-colors ${
                    actionType === a
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <span className="text-xl">{actionConfig[a].icon}</span>
                  <div>
                    <div className="font-medium text-sm">{actionConfig[a].label}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{actionConfig[a].description}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Action Value */}
            {actionType === 'send_email_sequence' ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm text-gray-600 dark:text-gray-400">
                    Email sequence steps:
                  </label>
                  <button
                    type="button"
                    onClick={addSequenceStep}
                    className="text-sm text-violet-600 dark:text-violet-400 hover:underline"
                  >
                    + Add Step
                  </button>
                </div>
                {sequenceSteps.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    No steps yet — click "+ Add Step" to begin
                  </p>
                ) : (
                  <div className="space-y-2">
                    {sequenceSteps.map((step, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <span className="w-5 h-5 flex-shrink-0 rounded-full bg-violet-100 dark:bg-violet-900/40 border border-violet-400 text-violet-700 dark:text-violet-300 text-xs font-bold flex items-center justify-center">
                          {index + 1}
                        </span>
                        <select
                          value={step.templateId}
                          onChange={(e) => updateSequenceStep(index, { templateId: e.target.value })}
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="">Select template...</option>
                          {emailTemplates.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <input
                            type="number"
                            min={0}
                            value={step.delayDays}
                            onChange={(e) => updateSequenceStep(index, { delayDays: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                            className="w-14 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
                          />
                          <span className="text-xs text-gray-500 dark:text-gray-400">days</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSequenceStep(index)}
                          className="p-1 text-gray-400 hover:text-red-500"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <SequenceVisualizer steps={sequenceSteps} emailTemplates={emailTemplates} />
              </div>
            ) : (
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {actionType === 'change_status' && 'New status:'}
                  {actionType === 'change_priority' && 'New priority:'}
                  {actionType === 'add_tag' && 'Tag to add:'}
                  {actionType === 'add_task' && 'Task title:'}
                  {actionType === 'apply_template' && 'Template to apply:'}
                  {actionType === 'send_notification' && 'Notification message:'}
                </label>
                {actionType === 'change_status' ? (
                  <select
                    value={actionValue}
                    onChange={(e) => setActionValue(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select status...</option>
                    <option value="active">Active</option>
                    <option value="on-hold">On Hold</option>
                    <option value="completed">Completed</option>
                  </select>
                ) : actionType === 'change_priority' ? (
                  <select
                    value={actionValue}
                    onChange={(e) => setActionValue(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select priority...</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                ) : actionType === 'apply_template' ? (
                  <select
                    value={actionValue}
                    onChange={(e) => setActionValue(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select template...</option>
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name} ({template.items.length} tasks)
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={actionValue}
                    onChange={(e) => setActionValue(e.target.value)}
                    placeholder={
                      actionType === 'add_tag' ? 'e.g., VIP' :
                      actionType === 'add_task' ? 'e.g., Send welcome email' :
                      'e.g., New client needs attention'
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                )}
              </div>
            )}
          </div>
        </form>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
          >
            {rule ? 'Save Changes' : 'Create Automation'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface LogsModalProps {
  logs: Array<{
    id: string;
    automationName: string;
    trigger: AutomationTrigger;
    action: string;
    clientName?: string;
    success: boolean;
    error?: string;
    executedAt: string;
  }>;
  onClear: () => void;
  onClose: () => void;
}

function LogsModal({ logs, onClear, onClose }: LogsModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Automation Logs</h2>
          <div className="flex items-center gap-2">
            {logs.length > 0 && (
              <button
                onClick={onClear}
                className="text-sm text-red-600 dark:text-red-400 hover:underline"
              >
                Clear all
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {logs.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p>No automation logs yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map(log => (
                <div
                  key={log.id}
                  className={`p-3 rounded-lg border ${
                    log.success
                      ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={log.success ? 'text-green-600' : 'text-red-600'}>
                          {log.success ? '✓' : '✗'}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">{log.automationName}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {log.action}
                        {log.clientName && ` for ${log.clientName}`}
                      </p>
                      {log.error && (
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">{log.error}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(log.executedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
