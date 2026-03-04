import { useState } from 'react';
import { useClientContext } from '../../context/ClientContext';
import { Button } from '../UI/Button';
import { TemplateForm } from './TemplateForm';
import { TemplateCard } from './TemplateCard';
import { AutomationManager } from '../UI/AutomationManager';
import { CustomFieldManager } from '../CustomFields/CustomFieldManager';
import { NotesTemplateManager } from '../Notes/NotesTemplateManager';
import { EmailTemplateManager } from '../Email/EmailTemplateManager';

export function TemplateList() {
  const { templates } = useClientContext();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      {/* Templates Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold gradient-text">
              Checklist Templates
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Create reusable checklists to speed up client onboarding
            </p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Template
          </Button>
        </div>

        {templates.length === 0 ? (
          <div className="text-center py-16 glass-card">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <svg
                className="h-7 w-7 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
              No templates yet
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Create your first checklist template to streamline onboarding.
            </p>
            <Button onClick={() => setIsFormOpen(true)} className="mt-6">
              Create Your First Template
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onEdit={() => setEditingTemplate(template.id)}
              />
            ))}
          </div>
        )}

        <TemplateForm
          isOpen={isFormOpen || editingTemplate !== null}
          onClose={() => {
            setIsFormOpen(false);
            setEditingTemplate(null);
          }}
          templateId={editingTemplate}
        />
      </div>

      {/* Automations Section */}
      <AutomationManager />

      {/* Custom Fields Section */}
      <CustomFieldManager />

      {/* Notes Templates Section */}
      <NotesTemplateManager />

      {/* Email Templates Section */}
      <EmailTemplateManager />
    </div>
  );
}
