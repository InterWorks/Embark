import { useState } from 'react';
import { generateId } from '../../utils/helpers';

export type FilterField =
  | 'health'
  | 'status'
  | 'priority'
  | 'tags'
  | 'lastContact'
  | 'goLiveProximity'
  | 'mrr'
  | 'assignedTo'
  | 'lifecycleStage';

export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'contains'
  | 'not_contains'
  | 'in_days';

export interface FilterCondition {
  id: string;
  field: FilterField;
  operator: FilterOperator;
  value: string;
}

export type FilterLogic = 'AND' | 'OR';

export interface FilterSet {
  id: string;
  name?: string;
  conditions: FilterCondition[];
  logic: FilterLogic;
}

interface FilterBuilderProps {
  filters: FilterSet;
  onChange: (filters: FilterSet) => void;
  onSaveSegment?: (name: string, filters: FilterSet) => void;
}

// Field metadata: label, allowed operators, value type
const FIELD_CONFIG: Record<
  FilterField,
  {
    label: string;
    operators: FilterOperator[];
    valueType: 'text' | 'number' | 'select';
    options?: string[];
  }
> = {
  health: {
    label: 'Health Score',
    operators: ['greater_than', 'less_than', 'equals'],
    valueType: 'number',
  },
  status: {
    label: 'Status',
    operators: ['equals', 'not_equals'],
    valueType: 'select',
    options: ['active', 'completed', 'on-hold'],
  },
  priority: {
    label: 'Priority',
    operators: ['equals', 'not_equals'],
    valueType: 'select',
    options: ['high', 'medium', 'low', 'none'],
  },
  tags: {
    label: 'Tags',
    operators: ['contains', 'not_contains'],
    valueType: 'text',
  },
  lastContact: {
    label: 'Days Since Last Contact',
    operators: ['greater_than', 'less_than', 'equals', 'in_days'],
    valueType: 'number',
  },
  goLiveProximity: {
    label: 'Go-Live Proximity (days)',
    operators: ['less_than', 'greater_than', 'equals', 'in_days'],
    valueType: 'number',
  },
  mrr: {
    label: 'MRR ($)',
    operators: ['greater_than', 'less_than', 'equals'],
    valueType: 'number',
  },
  assignedTo: {
    label: 'Assigned To',
    operators: ['equals', 'not_equals', 'contains'],
    valueType: 'text',
  },
  lifecycleStage: {
    label: 'Lifecycle Stage',
    operators: ['equals', 'not_equals'],
    valueType: 'select',
    options: ['onboarding', 'active-client', 'at-risk', 'churned'],
  },
};

const OPERATOR_LABELS: Record<FilterOperator, string> = {
  equals: 'equals',
  not_equals: 'does not equal',
  greater_than: 'greater than',
  less_than: 'less than',
  contains: 'contains',
  not_contains: 'does not contain',
  in_days: 'within (days)',
};

function ConditionRow({
  condition,
  onChange,
  onRemove,
}: {
  condition: FilterCondition;
  onChange: (updated: FilterCondition) => void;
  onRemove: () => void;
}) {
  const fieldCfg = FIELD_CONFIG[condition.field];
  const availableOperators = fieldCfg.operators;

  const handleFieldChange = (newField: FilterField) => {
    const newCfg = FIELD_CONFIG[newField];
    onChange({
      ...condition,
      field: newField,
      operator: newCfg.operators[0],
      value: '',
    });
  };

  const handleOperatorChange = (newOp: FilterOperator) => {
    onChange({ ...condition, operator: newOp });
  };

  const handleValueChange = (newVal: string) => {
    onChange({ ...condition, value: newVal });
  };

  const selectClass =
    'px-2 py-1.5 text-sm rounded-md border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400';

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Field */}
      <select
        value={condition.field}
        onChange={(e) => handleFieldChange(e.target.value as FilterField)}
        className={selectClass}
        aria-label="Filter field"
      >
        {(Object.keys(FIELD_CONFIG) as FilterField[]).map((f) => (
          <option key={f} value={f}>
            {FIELD_CONFIG[f].label}
          </option>
        ))}
      </select>

      {/* Operator */}
      <select
        value={condition.operator}
        onChange={(e) => handleOperatorChange(e.target.value as FilterOperator)}
        className={selectClass}
        aria-label="Filter operator"
      >
        {availableOperators.map((op) => (
          <option key={op} value={op}>
            {OPERATOR_LABELS[op]}
          </option>
        ))}
      </select>

      {/* Value */}
      {fieldCfg.valueType === 'select' && fieldCfg.options ? (
        <select
          value={condition.value}
          onChange={(e) => handleValueChange(e.target.value)}
          className={selectClass}
          aria-label="Filter value"
        >
          <option value="">-- select --</option>
          {fieldCfg.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={fieldCfg.valueType === 'number' ? 'number' : 'text'}
          value={condition.value}
          onChange={(e) => handleValueChange(e.target.value)}
          placeholder={fieldCfg.valueType === 'number' ? '0' : 'value...'}
          className="px-2 py-1.5 text-sm rounded-md border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 w-28"
          aria-label="Filter value"
        />
      )}

      {/* Remove */}
      <button
        onClick={onRemove}
        className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        title="Remove condition"
        aria-label="Remove condition"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function FilterBuilder({ filters, onChange, onSaveSegment }: FilterBuilderProps) {
  const [savingName, setSavingName] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);

  const setLogic = (logic: FilterLogic) => {
    onChange({ ...filters, logic });
  };

  const addCondition = () => {
    const newCondition: FilterCondition = {
      id: generateId(),
      field: 'status',
      operator: 'equals',
      value: '',
    };
    onChange({ ...filters, conditions: [...filters.conditions, newCondition] });
  };

  const updateCondition = (id: string, updated: FilterCondition) => {
    onChange({
      ...filters,
      conditions: filters.conditions.map((c) => (c.id === id ? updated : c)),
    });
  };

  const removeCondition = (id: string) => {
    onChange({
      ...filters,
      conditions: filters.conditions.filter((c) => c.id !== id),
    });
  };

  const handleSave = () => {
    if (!savingName.trim()) return;
    onSaveSegment?.(savingName.trim(), filters);
    setSavingName('');
    setShowSaveInput(false);
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 p-4 space-y-4">
      {/* Header row: AND/OR toggle */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Match</span>
          <div className="flex rounded-md border border-gray-300 dark:border-gray-600 overflow-hidden">
            {(['AND', 'OR'] as FilterLogic[]).map((l) => (
              <button
                key={l}
                onClick={() => setLogic(l)}
                className={`px-3 py-1 text-sm font-semibold transition-colors ${
                  filters.logic === l
                    ? 'bg-yellow-400 text-zinc-900'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">conditions</span>
        </div>

        {onSaveSegment && (
          <div className="flex items-center gap-2">
            {showSaveInput ? (
              <>
                <input
                  type="text"
                  value={savingName}
                  onChange={(e) => setSavingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave();
                    if (e.key === 'Escape') setShowSaveInput(false);
                  }}
                  placeholder="Segment name..."
                  autoFocus
                  className="px-2 py-1 text-sm rounded-md border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 w-40"
                />
                <button
                  onClick={handleSave}
                  disabled={!savingName.trim()}
                  className="px-3 py-1 text-sm font-bold bg-yellow-400 text-zinc-900 rounded-md border-2 border-zinc-900 shadow-[2px_2px_0_0_#18181b] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_#18181b] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-40 disabled:pointer-events-none"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowSaveInput(false)}
                  className="px-2 py-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowSaveInput(true)}
                disabled={filters.conditions.length === 0}
                className="px-3 py-1 text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                Save as Segment
              </button>
            )}
          </div>
        )}
      </div>

      {/* Conditions */}
      {filters.conditions.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 italic py-1">
          No conditions yet. Add one below.
        </p>
      ) : (
        <div className="space-y-2">
          {filters.conditions.map((condition, index) => (
            <div key={condition.id} className="flex items-center gap-2">
              {index > 0 && (
                <span className="text-xs font-bold text-gray-400 w-7 text-right shrink-0">
                  {filters.logic}
                </span>
              )}
              {index === 0 && <span className="w-7 shrink-0" />}
              <ConditionRow
                condition={condition}
                onChange={(updated) => updateCondition(condition.id, updated)}
                onRemove={() => removeCondition(condition.id)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Add condition */}
      <button
        onClick={addCondition}
        className="flex items-center gap-1.5 text-sm font-semibold text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add condition
      </button>
    </div>
  );
}

/** Create an empty FilterSet */
export function createEmptyFilterSet(): FilterSet {
  return {
    id: generateId(),
    conditions: [],
    logic: 'AND',
  };
}
