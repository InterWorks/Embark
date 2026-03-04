import { useState } from 'react';
import { useClientContext } from '../../context/ClientContext';
import type { CustomFieldType, CustomFieldDefinition } from '../../types';
import { Button } from '../UI/Button';
import { Modal } from '../UI/Modal';

const fieldTypeLabels: Record<CustomFieldType, string> = {
  text: 'Text',
  number: 'Number',
  date: 'Date',
  select: 'Dropdown',
  boolean: 'Yes/No',
};

export function CustomFieldManager() {
  const { customFieldDefinitions, addFieldDefinition, updateFieldDefinition, deleteFieldDefinition } = useClientContext();
  const [showForm, setShowForm] = useState(false);
  const [editingField, setEditingField] = useState<CustomFieldDefinition | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Form state
  const [fieldName, setFieldName] = useState('');
  const [fieldType, setFieldType] = useState<CustomFieldType>('text');
  const [fieldRequired, setFieldRequired] = useState(false);
  const [fieldOptions, setFieldOptions] = useState('');

  const resetForm = () => {
    setFieldName('');
    setFieldType('text');
    setFieldRequired(false);
    setFieldOptions('');
    setEditingField(null);
  };

  const openEditForm = (field: CustomFieldDefinition) => {
    setEditingField(field);
    setFieldName(field.name);
    setFieldType(field.type);
    setFieldRequired(field.required || false);
    setFieldOptions(field.options?.join(', ') || '');
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!fieldName.trim()) return;

    const options = fieldType === 'select'
      ? fieldOptions.split(',').map((o) => o.trim()).filter(Boolean)
      : undefined;

    if (editingField) {
      updateFieldDefinition(editingField.id, {
        name: fieldName.trim(),
        type: fieldType,
        required: fieldRequired,
        options,
      });
    } else {
      addFieldDefinition({
        name: fieldName.trim(),
        type: fieldType,
        required: fieldRequired,
        options,
      });
    }

    setShowForm(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    deleteFieldDefinition(id);
    setShowDeleteConfirm(null);
  };

  const sortedFields = [...customFieldDefinitions].sort((a, b) => a.order - b.order);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold gradient-text">Custom Fields</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Define custom fields for your clients
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Field
        </Button>
      </div>

      {sortedFields.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg mb-4">
            <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No custom fields</h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Add custom fields to capture additional client information
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedFields.map((field) => (
            <div
              key={field.id}
              className="glass-subtle rounded-xl p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-lg">
                  <FieldTypeIcon type={field.type} />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    {field.name}
                    {field.required && (
                      <span className="text-red-500 ml-1 text-sm">*</span>
                    )}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {fieldTypeLabels[field.type]}
                    {field.type === 'select' && field.options && (
                      <span className="ml-1">({field.options.length} options)</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditForm(field)}
                  className="p-2 text-gray-400 hover:text-purple-500 transition-colors"
                  title="Edit field"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(field.id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  title="Delete field"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Field Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          resetForm();
        }}
        title={editingField ? 'Edit Custom Field' : 'Add Custom Field'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Field Name
            </label>
            <input
              type="text"
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
              placeholder="e.g., Company Size"
              className="w-full px-4 py-2.5 rounded-xl border bg-white/50 dark:bg-white/5 backdrop-blur-sm text-gray-900 dark:text-gray-100 border-white/30 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Field Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(fieldTypeLabels) as [CustomFieldType, string][]).map(([type, label]) => (
                <button
                  key={type}
                  onClick={() => setFieldType(type)}
                  className={`p-2 rounded-lg text-sm text-center transition-all ${
                    fieldType === type
                      ? 'bg-gradient-to-r from-violet-500/20 to-purple-500/20 border-2 border-purple-500/50'
                      : 'glass-subtle hover:bg-white/60 dark:hover:bg-white/15'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {fieldType === 'select' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Options (comma-separated)
              </label>
              <input
                type="text"
                value={fieldOptions}
                onChange={(e) => setFieldOptions(e.target.value)}
                placeholder="e.g., Small, Medium, Large"
                className="w-full px-4 py-2.5 rounded-xl border bg-white/50 dark:bg-white/5 backdrop-blur-sm text-gray-900 dark:text-gray-100 border-white/30 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>
          )}

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={fieldRequired}
              onChange={(e) => setFieldRequired(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Required field</span>
          </label>

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
            <Button onClick={handleSubmit} disabled={!fieldName.trim()}>
              {editingField ? 'Save Changes' : 'Add Field'}
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
              <h3 className="text-lg font-semibold gradient-text mb-2">Delete Field?</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete this custom field? Existing data for this field will be lost.
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

function FieldTypeIcon({ type }: { type: CustomFieldType }) {
  const iconClass = 'w-4 h-4 text-violet-600 dark:text-violet-400';

  switch (type) {
    case 'text':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
        </svg>
      );
    case 'number':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
        </svg>
      );
    case 'date':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case 'select':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      );
    case 'boolean':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
}
