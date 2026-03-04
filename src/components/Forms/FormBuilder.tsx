import { useState } from 'react';
import type { OnboardingForm, FormField, FormFieldType } from '../../types';
import { useForms, createField } from '../../hooks/useForms';

const FIELD_TYPES: { type: FormFieldType; label: string; icon: string }[] = [
  { type: 'text',          label: 'Text',          icon: '𝐓' },
  { type: 'email',         label: 'Email',         icon: '✉' },
  { type: 'phone',         label: 'Phone',         icon: '☎' },
  { type: 'textarea',      label: 'Long Text',     icon: '≡' },
  { type: 'dropdown',      label: 'Dropdown',      icon: '▾' },
  { type: 'date',          label: 'Date',          icon: '📅' },
  { type: 'checkbox-group',label: 'Checkboxes',    icon: '☑' },
];

interface FormBuilderProps {
  form: OnboardingForm;
}

export function FormBuilder({ form }: FormBuilderProps) {
  const { updateForm } = useForms();
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

  const selectedField = form.fields.find(f => f.id === selectedFieldId) ?? null;

  const addField = (type: FormFieldType) => {
    const field = createField(type, `New ${type} field`, form.fields.length);
    updateForm(form.id, { fields: [...form.fields, field] });
    setSelectedFieldId(field.id);
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    updateForm(form.id, {
      fields: form.fields.map(f => f.id === fieldId ? { ...f, ...updates } : f),
    });
  };

  const removeField = (fieldId: string) => {
    updateForm(form.id, { fields: form.fields.filter(f => f.id !== fieldId) });
    if (selectedFieldId === fieldId) setSelectedFieldId(null);
  };

  const moveField = (fieldId: string, dir: -1 | 1) => {
    const fields = [...form.fields].sort((a, b) => a.order - b.order);
    const idx = fields.findIndex(f => f.id === fieldId);
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= fields.length) return;
    [fields[idx], fields[newIdx]] = [fields[newIdx], fields[idx]];
    updateForm(form.id, { fields: fields.map((f, i) => ({ ...f, order: i })) });
  };

  const sortedFields = [...form.fields].sort((a, b) => a.order - b.order);

  return (
    <div className="flex gap-4 h-full">
      {/* Field palette */}
      <div className="w-40 shrink-0">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Add Field</p>
        <div className="space-y-1">
          {FIELD_TYPES.map(ft => (
            <button
              key={ft.type}
              onClick={() => addField(ft.type)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm glass-subtle rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 text-gray-700 dark:text-gray-300 transition-colors"
            >
              <span className="w-5 text-center text-gray-400">{ft.icon}</span>
              {ft.label}
            </button>
          ))}
        </div>
      </div>

      {/* Field list */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Fields ({sortedFields.length})</p>
        {sortedFields.length === 0 ? (
          <div className="glass-subtle rounded-xl p-8 text-center text-gray-400">
            <p className="text-sm">No fields yet.</p>
            <p className="text-xs mt-1">Click a field type to add it.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedFields.map((field, idx) => (
              <div
                key={field.id}
                onClick={() => setSelectedFieldId(field.id)}
                className={`glass-subtle rounded-xl px-4 py-3 cursor-pointer transition-all flex items-center justify-between gap-2
                  ${selectedFieldId === field.id ? 'ring-2 ring-purple-500/50' : 'hover:ring-1 hover:ring-purple-400/30'}`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{field.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{field.type}{field.required ? ' · required' : ''}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={e => { e.stopPropagation(); moveField(field.id, -1); }}
                    disabled={idx === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  >↑</button>
                  <button
                    onClick={e => { e.stopPropagation(); moveField(field.id, 1); }}
                    disabled={idx === sortedFields.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  >↓</button>
                  <button
                    onClick={e => { e.stopPropagation(); removeField(field.id); }}
                    className="p-1 text-red-400 hover:text-red-600"
                  >×</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Config panel */}
      {selectedField && (
        <div className="w-64 shrink-0">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Field Config</p>
          <div className="glass-subtle rounded-xl p-4 space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Label</label>
              <input
                value={selectedField.label}
                onChange={e => updateField(selectedField.id, { label: e.target.value })}
                className="mt-1 w-full text-sm glass rounded-lg px-3 py-2 border border-white/20 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Placeholder</label>
              <input
                value={selectedField.placeholder ?? ''}
                onChange={e => updateField(selectedField.id, { placeholder: e.target.value })}
                className="mt-1 w-full text-sm glass rounded-lg px-3 py-2 border border-white/20 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedField.required}
                onChange={e => updateField(selectedField.id, { required: e.target.checked })}
                className="accent-purple-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Required</span>
            </label>
            {(selectedField.type === 'dropdown' || selectedField.type === 'checkbox-group') && (
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Options (one per line)</label>
                <textarea
                  value={(selectedField.options ?? []).join('\n')}
                  onChange={e => updateField(selectedField.id, { options: e.target.value.split('\n').filter(Boolean) })}
                  rows={4}
                  className="mt-1 w-full text-sm glass rounded-lg px-3 py-2 border border-white/20 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
                />
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Maps to field</label>
              <input
                value={selectedField.mapsTo ?? ''}
                onChange={e => updateField(selectedField.id, { mapsTo: e.target.value || undefined })}
                placeholder="name, email, company..."
                className="mt-1 w-full text-sm glass rounded-lg px-3 py-2 border border-white/20 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
