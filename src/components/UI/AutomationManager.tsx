import { useState } from 'react';
import { useClientContext } from '../../context/ClientContext';
import type { AutomationTrigger, AutomationActionType, AutomationCondition, AutomationAction } from '../../types';
import { Button } from './Button';
import { Modal } from './Modal';

const triggerOptions: { value: AutomationTrigger; label: string; description: string }[] = [
  { value: 'client_created', label: 'Client Created', description: 'When a new client is added' },
  { value: 'status_changed', label: 'Status Changed', description: 'When client status is updated' },
  { value: 'task_completed', label: 'Task Completed', description: 'When any task is completed' },
  { value: 'all_tasks_completed', label: 'All Tasks Completed', description: 'When all tasks are done' },
  { value: 'priority_changed', label: 'Priority Changed', description: 'When client priority changes' },
  { value: 'tag_added', label: 'Tag Added', description: 'When a tag is added to client' },
];

const actionOptions: { value: AutomationActionType; label: string; valueLabel: string }[] = [
  { value: 'change_status', label: 'Change Status', valueLabel: 'New Status' },
  { value: 'change_priority', label: 'Change Priority', valueLabel: 'New Priority' },
  { value: 'add_tag', label: 'Add Tag', valueLabel: 'Tag' },
  { value: 'add_task', label: 'Add Task', valueLabel: 'Task Title' },
  { value: 'send_notification', label: 'Log Message', valueLabel: 'Message' },
];

const conditionFieldOptions = [
  { value: 'status', label: 'Status' },
  { value: 'priority', label: 'Priority' },
  { value: 'has_tag', label: 'Has Tag' },
  { value: 'task_count', label: 'Task Count' },
  { value: 'completed_percentage', label: 'Completion %' },
];

const conditionOperatorOptions = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
];

export function AutomationManager() {
  const { automationRules, addAutomationRule, deleteAutomationRule, toggleAutomationRule, tags } = useClientContext();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [ruleName, setRuleName] = useState('');
  const [selectedTrigger, setSelectedTrigger] = useState<AutomationTrigger>('client_created');
  const [conditions, setConditions] = useState<AutomationCondition[]>([]);
  const [actionType, setActionType] = useState<AutomationActionType>('change_status');
  const [actionValue, setActionValue] = useState('');

  const resetForm = () => {
    setRuleName('');
    setSelectedTrigger('client_created');
    setConditions([]);
    setActionType('change_status');
    setActionValue('');
  };

  const handleCreate = () => {
    if (!ruleName.trim() || !actionValue.trim()) return;

    const action: AutomationAction = {
      type: actionType,
      value: actionValue,
    };

    addAutomationRule(ruleName.trim(), selectedTrigger, conditions, action);
    setShowCreateModal(false);
    resetForm();
  };

  const addCondition = () => {
    setConditions((prev) => [
      ...prev,
      { field: 'status', operator: 'equals', value: 'active' },
    ]);
  };

  const updateCondition = (index: number, updates: Partial<AutomationCondition>) => {
    setConditions((prev) =>
      prev.map((c, i) => (i === index ? { ...c, ...updates } : c))
    );
  };

  const removeCondition = (index: number) => {
    setConditions((prev) => prev.filter((_, i) => i !== index));
  };

  const renderActionValueInput = () => {
    switch (actionType) {
      case 'change_status':
        return (
          <select
            value={actionValue}
            onChange={(e) => setActionValue(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border bg-white/50 dark:bg-white/5 backdrop-blur-sm text-gray-900 dark:text-gray-100 border-white/30 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          >
            <option value="">Select status...</option>
            <option value="active">Active</option>
            <option value="on-hold">On Hold</option>
            <option value="completed">Completed</option>
          </select>
        );
      case 'change_priority':
        return (
          <select
            value={actionValue}
            onChange={(e) => setActionValue(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border bg-white/50 dark:bg-white/5 backdrop-blur-sm text-gray-900 dark:text-gray-100 border-white/30 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          >
            <option value="">Select priority...</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="none">None</option>
          </select>
        );
      case 'add_tag':
        return (
          <select
            value={actionValue}
            onChange={(e) => setActionValue(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border bg-white/50 dark:bg-white/5 backdrop-blur-sm text-gray-900 dark:text-gray-100 border-white/30 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          >
            <option value="">Select tag...</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
        );
      default:
        return (
          <input
            type="text"
            value={actionValue}
            onChange={(e) => setActionValue(e.target.value)}
            placeholder={actionOptions.find((a) => a.value === actionType)?.valueLabel}
            className="w-full px-4 py-2.5 rounded-xl border bg-white/50 dark:bg-white/5 backdrop-blur-sm text-gray-900 dark:text-gray-100 border-white/30 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          />
        );
    }
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold gradient-text">Automations</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Create rules to automate your workflow
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Rule
        </Button>
      </div>

      {automationRules.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg mb-4">
            <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No automations yet</h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Create your first automation rule to streamline your workflow
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {automationRules.map((rule) => (
            <div
              key={rule.id}
              className={`glass-subtle rounded-xl p-4 ${!rule.enabled ? 'opacity-60' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleAutomationRule(rule.id)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      rule.enabled
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        rule.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">{rule.name}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      When <span className="font-medium text-indigo-600 dark:text-indigo-400">
                        {triggerOptions.find((t) => t.value === rule.trigger)?.label}
                      </span>
                      {rule.conditions.length > 0 && ` (with ${rule.conditions.length} condition${rule.conditions.length !== 1 ? 's' : ''})`}
                      {' → '}
                      <span className="font-medium text-purple-600 dark:text-purple-400">
                        {actionOptions.find((a) => a.value === rule.action.type)?.label}
                      </span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => deleteAutomationRule(rule.id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Create Automation Rule"
        size="lg"
      >
        <div className="space-y-5">
          {/* Rule Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rule Name
            </label>
            <input
              type="text"
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
              placeholder="e.g., Mark complete when all tasks done"
              className="w-full px-4 py-2.5 rounded-xl border bg-white/50 dark:bg-white/5 backdrop-blur-sm text-gray-900 dark:text-gray-100 border-white/30 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>

          {/* Trigger */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              When this happens...
            </label>
            <div className="grid grid-cols-2 gap-2">
              {triggerOptions.map((trigger) => (
                <button
                  key={trigger.value}
                  onClick={() => setSelectedTrigger(trigger.value)}
                  className={`p-3 rounded-xl text-left transition-all ${
                    selectedTrigger === trigger.value
                      ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-2 border-purple-500/50'
                      : 'glass-subtle hover:bg-white/60 dark:hover:bg-white/15'
                  }`}
                >
                  <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{trigger.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{trigger.description}</p>
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
                onClick={addCondition}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                + Add condition
              </button>
            </div>
            {conditions.length > 0 && (
              <div className="space-y-2">
                {conditions.map((condition, index) => (
                  <div key={index} className="flex items-center gap-2 glass-subtle p-2 rounded-xl">
                    <select
                      value={condition.field}
                      onChange={(e) => updateCondition(index, { field: e.target.value as AutomationCondition['field'] })}
                      className="px-2 py-1.5 rounded-lg bg-white/50 dark:bg-white/10 text-sm border-0"
                    >
                      {conditionFieldOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <select
                      value={condition.operator}
                      onChange={(e) => updateCondition(index, { operator: e.target.value as AutomationCondition['operator'] })}
                      className="px-2 py-1.5 rounded-lg bg-white/50 dark:bg-white/10 text-sm border-0"
                    >
                      {conditionOperatorOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={condition.value}
                      onChange={(e) => updateCondition(index, { value: e.target.value })}
                      placeholder="Value"
                      className="flex-1 px-2 py-1.5 rounded-lg bg-white/50 dark:bg-white/10 text-sm border-0"
                    />
                    <button
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
              {actionOptions.map((action) => (
                <button
                  key={action.value}
                  onClick={() => {
                    setActionType(action.value);
                    setActionValue('');
                  }}
                  className={`p-2 rounded-xl text-center transition-all text-sm ${
                    actionType === action.value
                      ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-pink-500/50'
                      : 'glass-subtle hover:bg-white/60 dark:hover:bg-white/15'
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
            {renderActionValueInput()}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => {
              setShowCreateModal(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!ruleName.trim() || !actionValue}>
              Create Rule
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
