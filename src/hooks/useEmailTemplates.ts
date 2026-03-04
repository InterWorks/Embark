import { useLocalStorage } from './useLocalStorage';
import type { EmailTemplate } from '../types';

const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: 'welcome-1',
    name: 'Welcome Email',
    subject: 'Welcome to Our Onboarding Process - {{clientName}}',
    body: `Hi {{clientName}},

Welcome aboard! We're excited to begin your onboarding process.

Your dedicated team member, {{assignedTo}}, will be guiding you through each step. Here's what to expect:

1. Initial setup and configuration
2. Training and documentation review
3. Go-live preparation
4. Post-launch support

If you have any questions, please don't hesitate to reach out.

Best regards,
{{assignedTo}}`,
    category: 'welcome',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'followup-1',
    name: 'Check-in Follow Up',
    subject: 'Checking In - {{clientName}} Onboarding Progress',
    body: `Hi {{clientName}},

I wanted to check in and see how everything is going with your onboarding.

Your current progress: {{progress}}% complete

Upcoming tasks:
{{pendingTasks}}

Please let me know if you have any questions or need any assistance.

Best regards,
{{assignedTo}}`,
    category: 'followup',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'update-1',
    name: 'Status Update',
    subject: 'Onboarding Status Update - {{clientName}}',
    body: `Hi {{clientName}},

Here's a quick update on your onboarding status:

Status: {{status}}
Progress: {{progress}}% complete

Recent accomplishments:
{{completedTasks}}

Next steps:
{{pendingTasks}}

Feel free to reach out if you have any questions.

Best regards,
{{assignedTo}}`,
    category: 'update',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'reminder-1',
    name: 'Task Reminder',
    subject: 'Reminder: Upcoming Tasks for {{clientName}}',
    body: `Hi {{clientName}},

This is a friendly reminder about your upcoming onboarding tasks:

{{pendingTasks}}

Please complete these at your earliest convenience to keep your onboarding on track.

Let me know if you need any help!

Best regards,
{{assignedTo}}`,
    category: 'reminder',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'completion-1',
    name: 'Onboarding Complete',
    subject: 'Congratulations! {{clientName}} Onboarding Complete',
    body: `Hi {{clientName}},

Congratulations! Your onboarding process is now complete!

We're thrilled to have you fully set up and ready to go. Here's a summary of what was accomplished:

{{completedTasks}}

If you need any support going forward, please don't hesitate to reach out.

Thank you for choosing us!

Best regards,
{{assignedTo}}`,
    category: 'welcome',
    createdAt: new Date().toISOString(),
  },
];

export function useEmailTemplates() {
  const [templates, setTemplates] = useLocalStorage<EmailTemplate[]>(
    'email-templates',
    DEFAULT_TEMPLATES
  );

  const addTemplate = (template: Omit<EmailTemplate, 'id' | 'createdAt'>) => {
    const newTemplate: EmailTemplate = {
      ...template,
      id: `email-template-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setTemplates((prev) => [...prev, newTemplate]);
    return newTemplate;
  };

  const updateTemplate = (id: string, updates: Partial<EmailTemplate>) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const deleteTemplate = (id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  const resetToDefaults = () => {
    setTemplates(DEFAULT_TEMPLATES);
  };

  return {
    templates,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    resetToDefaults,
  };
}
