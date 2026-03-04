import { useState } from 'react';
import { useForms } from '../../hooks/useForms';
import { FormBuilder } from './FormBuilder';
import { SubmissionsLog } from './SubmissionsLog';
import type { OnboardingForm } from '../../types';

type FormTab = 'builder' | 'submissions';

export function FormsView() {
  const { forms, submissions, addForm, deleteForm } = useForms();
  const [selectedFormId, setSelectedFormId] = useState<string | null>(forms[0]?.id ?? null);
  const [formTab, setFormTab] = useState<FormTab>('builder');
  const [newFormName, setNewFormName] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);

  const selectedForm = forms.find(f => f.id === selectedFormId) ?? null;
  const formSubmissions = selectedForm ? submissions.filter(s => s.formId === selectedForm.id) : [];

  const handleCreateForm = () => {
    if (!newFormName.trim()) return;
    const form = addForm(newFormName.trim());
    setSelectedFormId(form.id);
    setNewFormName('');
    setShowNewForm(false);
  };

  const handleDeleteForm = (form: OnboardingForm) => {
    if (!confirm(`Delete form "${form.name}"?`)) return;
    deleteForm(form.id);
    if (selectedFormId === form.id) {
      const remaining = forms.filter(f => f.id !== form.id);
      setSelectedFormId(remaining[0]?.id ?? null);
    }
  };

  const getFormUrl = (form: OnboardingForm) => {
    return `${window.location.origin}${window.location.pathname}#form/${form.id}`;
  };

  const copyLink = (form: OnboardingForm) => {
    navigator.clipboard.writeText(getFormUrl(form)).catch(() => {});
  };

  return (
    <div className="h-full flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 shrink-0 glass border-r border-white/20 flex flex-col">
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900 dark:text-gray-100">Intake Forms</h2>
            <button
              onClick={() => setShowNewForm(true)}
              className="p-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          {showNewForm && (
            <div className="flex gap-2">
              <input
                autoFocus
                value={newFormName}
                onChange={e => setNewFormName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleCreateForm(); if (e.key === 'Escape') setShowNewForm(false); }}
                placeholder="Form name..."
                className="flex-1 text-sm glass-subtle rounded-lg px-3 py-1.5 border border-white/20 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <button onClick={handleCreateForm} className="text-sm text-purple-600 font-medium hover:text-purple-700">Add</button>
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {forms.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">No forms yet. Create one!</p>
          ) : (
            forms.map(form => (
              <div
                key={form.id}
                onClick={() => setSelectedFormId(form.id)}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all mb-1
                  ${selectedFormId === form.id ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-100' : 'hover:bg-white/20 text-gray-700 dark:text-gray-300'}`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{form.name}</p>
                  <p className="text-xs text-gray-400">{submissions.filter(s => s.formId === form.id).length} responses</p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); handleDeleteForm(form); }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 transition-opacity"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main area */}
      {selectedForm ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{selectedForm.name}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {selectedForm.fields.length} fields · {formSubmissions.length} responses
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => copyLink(selectedForm)}
                className="flex items-center gap-2 px-3 py-2 glass-subtle rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-white/20 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Link
              </button>
              <a
                href={getFormUrl(selectedForm)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors"
              >
                Preview ↗
              </a>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-4 border-b border-white/10">
            <button
              onClick={() => setFormTab('builder')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${formTab === 'builder' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'}`}
            >
              Builder
            </button>
            <button
              onClick={() => setFormTab('submissions')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-1.5 ${formTab === 'submissions' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'}`}
            >
              Submissions
              {formSubmissions.length > 0 && (
                <span className="px-1.5 py-0.5 bg-purple-600 text-white text-xs rounded-full">{formSubmissions.length}</span>
              )}
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {formTab === 'builder' ? (
              <FormBuilder form={selectedForm} />
            ) : (
              <SubmissionsLog form={selectedForm} submissions={formSubmissions} />
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="font-medium">No form selected</p>
            <p className="text-sm mt-1">Create a form or select one from the sidebar</p>
          </div>
        </div>
      )}
    </div>
  );
}
