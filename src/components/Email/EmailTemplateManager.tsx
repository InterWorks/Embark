import { useState } from 'react';
import type { EmailTemplate } from '../../types';
import { useEmailTemplates } from '../../hooks/useEmailTemplates';
import { Button } from '../UI/Button';

export function EmailTemplateManager() {
  const { templates, addTemplate, updateTemplate, deleteTemplate, resetToDefaults } = useEmailTemplates();
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editForm, setEditForm] = useState<Partial<EmailTemplate>>({});

  const categoryLabels: Record<string, string> = {
    welcome: 'Welcome',
    followup: 'Follow Up',
    update: 'Updates',
    reminder: 'Reminders',
    custom: 'Custom',
  };

  const categoryColors: Record<string, string> = {
    welcome: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
    followup: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    update: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
    reminder: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
    custom: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditForm(template);
    setIsEditing(template.id);
  };

  const handleSave = () => {
    if (isEditing && editForm.name && editForm.subject && editForm.body) {
      updateTemplate(isEditing, editForm);
      setIsEditing(null);
      setEditForm({});
    } else if (isCreating && editForm.name && editForm.subject && editForm.body) {
      addTemplate({
        name: editForm.name,
        subject: editForm.subject,
        body: editForm.body,
        category: (editForm.category as EmailTemplate['category']) || 'custom',
      });
      setIsCreating(false);
      setEditForm({});
    }
  };

  const handleCancel = () => {
    setIsEditing(null);
    setIsCreating(false);
    setEditForm({});
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      deleteTemplate(id);
    }
  };

  const handleCreate = () => {
    setEditForm({ category: 'custom' });
    setIsCreating(true);
  };

  return (
    <div className="glass-card">
      <div className="p-6 border-b border-white/20 dark:border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Email Templates
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage your email templates for client communications
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={resetToDefaults}>
              Reset
            </Button>
            <Button onClick={handleCreate}>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Template
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Create/Edit Form */}
        {(isCreating || isEditing) && (
          <div className="mb-6 glass-subtle p-4 rounded-xl space-y-4">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">
              {isCreating ? 'Create New Template' : 'Edit Template'}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Template Name
                </label>
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="input w-full"
                  placeholder="e.g., Welcome Email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={editForm.category || 'custom'}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value as EmailTemplate['category'] })}
                  className="input w-full"
                >
                  <option value="welcome">Welcome</option>
                  <option value="followup">Follow Up</option>
                  <option value="update">Updates</option>
                  <option value="reminder">Reminders</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Subject Line
              </label>
              <input
                type="text"
                value={editForm.subject || ''}
                onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                className="input w-full"
                placeholder="e.g., Welcome to Our Onboarding Process - {{clientName}}"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Body
              </label>
              <textarea
                value={editForm.body || ''}
                onChange={(e) => setEditForm({ ...editForm, body: e.target.value })}
                className="input w-full h-40 resize-none font-mono text-sm"
                placeholder="Enter email body... Use {{variable}} for dynamic content"
              />
            </div>

            <div className="glass-subtle p-3 rounded-lg">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                Available Variables:
              </p>
              <div className="flex flex-wrap gap-1 text-xs">
                {['clientName', 'clientEmail', 'assignedTo', 'status', 'progress', 'completedTasks', 'pendingTasks', 'date'].map((v) => (
                  <code key={v} className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded">
                    {`{{${v}}}`}
                  </code>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!editForm.name || !editForm.subject || !editForm.body}>
                Save Template
              </Button>
            </div>
          </div>
        )}

        {/* Templates List */}
        <div className="space-y-3">
          {templates.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No email templates yet. Create your first template!
            </div>
          ) : (
            templates.map((template) => (
              <div
                key={template.id}
                className="glass-subtle p-4 rounded-xl hover:bg-white/30 dark:hover:bg-white/5 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {template.name}
                      </h4>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${categoryColors[template.category || 'custom']}`}>
                        {categoryLabels[template.category || 'custom']}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Subject: {template.subject}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 line-clamp-2">
                      {template.body.substring(0, 150)}...
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-4">
                    <button
                      onClick={() => handleEdit(template)}
                      className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-lg transition-colors"
                      title="Edit template"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-colors"
                      title="Delete template"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
