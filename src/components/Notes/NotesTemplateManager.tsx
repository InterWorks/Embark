import { useState } from 'react';
import type { NotesTemplate } from '../../types';
import { useClientContext } from '../../context/ClientContext';
import { Button } from '../UI/Button';
import { Modal } from '../UI/Modal';

const availableVariables = [
  { key: 'clientName', description: 'Client name' },
  { key: 'assignedTo', description: 'Assigned team member' },
  { key: 'status', description: 'Current status' },
  { key: 'date', description: 'Current date' },
  { key: 'time', description: 'Current time' },
  { key: 'datetime', description: 'Current date and time' },
];

export function NotesTemplateManager() {
  const { notesTemplates, addNotesTemplate, updateNotesTemplate, deleteNotesTemplate } =
    useClientContext();
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotesTemplate | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');

  const resetForm = () => {
    setName('');
    setContent('');
    setCategory('');
    setEditingTemplate(null);
  };

  const openEditForm = (template: NotesTemplate) => {
    setEditingTemplate(template);
    setName(template.name);
    setContent(template.content);
    setCategory(template.category || '');
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!name.trim() || !content.trim()) return;

    if (editingTemplate) {
      updateNotesTemplate(editingTemplate.id, {
        name: name.trim(),
        content: content.trim(),
        category: category.trim() || undefined,
      });
    } else {
      addNotesTemplate({
        name: name.trim(),
        content: content.trim(),
        category: category.trim() || undefined,
      });
    }

    setShowForm(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    deleteNotesTemplate(id);
    setShowDeleteConfirm(null);
  };

  const insertVariable = (variable: string) => {
    setContent((prev) => prev + `{{${variable}}}`);
  };

  const categories = [...new Set(notesTemplates.map((t) => t.category).filter(Boolean))];

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold gradient-text">Notes Templates</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Create reusable note templates with dynamic variables
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Template
        </Button>
      </div>

      {notesTemplates.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-pink-500/20 flex items-center justify-center mb-3">
            <svg
              className="h-6 w-6 text-violet-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400">
            No templates yet. Create one to speed up note taking.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {notesTemplates.map((template) => (
            <div
              key={template.id}
              className="group glass-subtle p-4 rounded-xl hover:bg-white/60 dark:hover:bg-white/15 transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    {template.name}
                  </h4>
                  {template.category && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400">
                      {template.category}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEditForm(template)}
                    className="p-1.5 text-gray-400 hover:text-purple-500 rounded-lg hover:bg-white/50 dark:hover:bg-white/10"
                    title="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(template.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-white/50 dark:hover:bg-white/10"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 whitespace-pre-wrap">
                {template.content}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                Created {new Date(template.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Template Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          resetForm();
        }}
        title={editingTemplate ? 'Edit Template' : 'Create Notes Template'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Template Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Initial Contact Notes"
              className="w-full px-4 py-2.5 rounded-xl border bg-white/50 dark:bg-white/5 backdrop-blur-sm text-gray-900 dark:text-gray-100 border-white/30 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category (optional)
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., Onboarding, Follow-up"
              list="categories"
              className="w-full px-4 py-2.5 rounded-xl border bg-white/50 dark:bg-white/5 backdrop-blur-sm text-gray-900 dark:text-gray-100 border-white/30 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
            <datalist id="categories">
              {categories.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Template Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your template content..."
              rows={6}
              className="w-full px-4 py-2.5 rounded-xl border bg-white/50 dark:bg-white/5 backdrop-blur-sm text-gray-900 dark:text-gray-100 border-white/30 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none font-mono text-sm"
            />
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Available Variables
            </p>
            <div className="flex flex-wrap gap-2">
              {availableVariables.map((v) => (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => insertVariable(v.key)}
                  className="px-2 py-1 text-xs rounded-lg bg-purple-500/20 text-purple-600 dark:text-purple-400 hover:bg-purple-500/30 transition-colors"
                  title={v.description}
                >
                  {`{{${v.key}}}`}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Click a variable to insert it at the end of your template
            </p>
          </div>

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
            <Button onClick={handleSubmit} disabled={!name.trim() || !content.trim()}>
              {editingTemplate ? 'Save Changes' : 'Create Template'}
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
              <h3 className="text-lg font-semibold gradient-text mb-2">Delete Template?</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete this template? This action cannot be undone.
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
