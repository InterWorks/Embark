import { useState } from 'react';
import type { OnboardingForm, FormField, Client } from '../../types';
import { generateId } from '../../utils/helpers';

interface FormPublicViewProps {
  form: OnboardingForm;
}

function writeToLocalStorage(key: string, updater: (prev: unknown[]) => unknown[]) {
  try {
    const raw = localStorage.getItem(key);
    const prev = raw ? JSON.parse(raw) : [];
    const next = updater(Array.isArray(prev) ? prev : []);
    localStorage.setItem(key, JSON.stringify(next));
    window.dispatchEvent(new StorageEvent('storage', { key, newValue: JSON.stringify(next) }));
  } catch { /* ignore */ }
}

function evaluateShowIf(field: FormField, values: Record<string, unknown>): boolean {
  if (!field.showIf) return true;
  return values[field.showIf.fieldId] === field.showIf.value;
}

export function FormPublicView({ form }: FormPublicViewProps) {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const visibleFields = form.fields
    .slice()
    .sort((a, b) => a.order - b.order)
    .filter(f => evaluateShowIf(f, values));

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    for (const f of visibleFields) {
      if (f.required) {
        const v = values[f.id];
        if (!v || (typeof v === 'string' && !v.trim())) {
          errs[f.id] = 'This field is required';
        }
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    await new Promise(r => setTimeout(r, 400));

    // Create client from form data
    const clientId = generateId();
    const nameField = form.fields.find(f => f.mapsTo === 'name' || f.label.toLowerCase().includes('name'));
    const emailField = form.fields.find(f => f.mapsTo === 'email' || f.type === 'email');
    const companyField = form.fields.find(f => f.mapsTo === 'company' || f.label.toLowerCase().includes('company'));

    const clientName = (nameField ? String(values[nameField.id] ?? '') : '') || (companyField ? String(values[companyField.id] ?? '') : '') || 'New Client';
    const clientEmail = emailField ? String(values[emailField.id] ?? '') : '';

    const newClient: Partial<Client> = {
      id: clientId,
      name: clientName,
      email: clientEmail,
      phone: '',
      assignedTo: '',
      services: [],
      checklist: [],
      notes: '',
      createdAt: new Date().toISOString(),
      status: 'active',
      priority: 'medium',
      tags: [],
      activityLog: [{
        id: generateId(),
        type: 'created',
        description: `Client created via intake form "${form.name}"`,
        timestamp: new Date().toISOString(),
      }],
    };

    // Apply linked template if any
    if (form.linkedTemplateId) {
      try {
        const raw = localStorage.getItem('embark-templates');
        const templates = raw ? JSON.parse(raw) : [];
        const template = templates.find((t: { id: string }) => t.id === form.linkedTemplateId);
        if (template?.items) {
          newClient.checklist = template.items.map((item: { title: string; dueOffsetDays?: number }, idx: number) => ({
            id: generateId(),
            title: item.title,
            completed: false,
            order: idx,
            dueDate: item.dueOffsetDays != null
              ? new Date(Date.now() + item.dueOffsetDays * 86400000).toISOString().split('T')[0]
              : undefined,
          }));
        }
      } catch { /* ignore */ }
    }

    // Write client
    writeToLocalStorage('embark-clients', (prev) => {
      const clients = prev as Client[];
      return [...clients, newClient];
    });

    // Write submission
    const submissionId = generateId();
    const submission = {
      id: submissionId,
      formId: form.id,
      clientId,
      submittedAt: new Date().toISOString(),
      data: values,
    };
    writeToLocalStorage('embark-form-submissions', (prev) => [...prev, submission]);

    setSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="glass rounded-3xl p-10 max-w-md w-full text-center shadow-2xl">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">You're all set!</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Your information has been submitted. Your dedicated team will be in touch shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 p-6 flex items-start justify-center">
      <div className="glass rounded-3xl p-8 max-w-2xl w-full shadow-2xl mt-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{form.name}</h1>
          {form.description && <p className="text-gray-600 dark:text-gray-400 mt-1">{form.description}</p>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {visibleFields.map(field => (
            <div key={field.id}>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>

              {field.type === 'textarea' ? (
                <textarea
                  value={String(values[field.id] ?? '')}
                  onChange={e => setValues(v => ({ ...v, [field.id]: e.target.value }))}
                  placeholder={field.placeholder}
                  rows={4}
                  className="w-full glass-subtle rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-gray-100 border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                />
              ) : field.type === 'dropdown' ? (
                <select
                  value={String(values[field.id] ?? '')}
                  onChange={e => setValues(v => ({ ...v, [field.id]: e.target.value }))}
                  className="w-full glass-subtle rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-gray-100 border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                >
                  <option value="">Select an option...</option>
                  {(field.options ?? []).map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : field.type === 'checkbox-group' ? (
                <div className="space-y-2">
                  {(field.options ?? []).map(opt => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(values[field.id] as string[] ?? []).includes(opt)}
                        onChange={e => {
                          const prev = values[field.id] as string[] ?? [];
                          setValues(v => ({
                            ...v,
                            [field.id]: e.target.checked ? [...prev, opt] : prev.filter(x => x !== opt),
                          }));
                        }}
                        className="w-4 h-4 accent-purple-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{opt}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <input
                  type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : field.type === 'date' ? 'date' : 'text'}
                  value={String(values[field.id] ?? '')}
                  onChange={e => setValues(v => ({ ...v, [field.id]: e.target.value }))}
                  placeholder={field.placeholder}
                  className="w-full glass-subtle rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-gray-100 border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              )}

              {errors[field.id] && (
                <p className="mt-1 text-xs text-red-500">{errors[field.id]}</p>
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-6 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all shadow-lg"
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
}
