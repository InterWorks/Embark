import { useCallback } from 'react';
import type { ChecklistTemplate } from '../types';
import { useLocalStorage } from './useLocalStorage';
import { generateId } from '../utils/helpers';

// Default templates that ship with the app
const DEFAULT_TEMPLATES: ChecklistTemplate[] = [
  {
    id: 'default-onboarding-checklist',
    name: 'Onboarding Checklist',
    items: [
      // Pre-Onboarding Prerequisites
      { title: '[Pre-Onboarding] Confirm SLA Agreement signed and add copy to client Box folder' },
      { title: '[Pre-Onboarding] Create MOAS job(s)' },
      { title: '[Pre-Onboarding] Schedule client kickoff call' },
      { title: '[Pre-Onboarding] Client Kickoff Meeting' },
      { title: '[Pre-Onboarding] Complete any client-required onboarding' },
      { title: '[Pre-Onboarding] Get access credentials from client' },
      // Onboarding Tasks - DL
      { title: '[Onboarding - DL] Add to Client-Master Sheet' },
      { title: '[Onboarding - DL] Add credentials to 1Password' },
      { title: '[Onboarding - DL] Create P360 Project and setup monitoring' },
      { title: '[Onboarding - DL] Setup backup and monitoring scripts (see notes)' },
      { title: '[Onboarding - DL] Install Datto Agent/Logic Monitor/Ansible' },
      { title: '[Onboarding - DL] Create client documentation and fill out environment information' },
      { title: '[Onboarding - DL] Client adds sla@interworks.com Support Only role to their Tableau customer portal' },
      { title: '[Onboarding - DL] Conduct and deliver P360 after 2-weeks of counters', dueOffsetDays: 14 },
      { title: '[Onboarding - DL] Update Maintenance document and deliver to client' },
      // Linux-Only Tasks
      { title: '[Linux Only] Request creation of Interworks user with sudo access and provide public key to authorized_users file' },
      { title: '[Linux Only] Run Linux User Management ansible script to setup all ServerCare access' },
      { title: '[Linux Only] Set a password for the Interworks user for TSM GUI and add to 1Password' },
      // Tableau Cloud Advisory Only Onboarding
      { title: '[Tableau Cloud Advisory] Internal call to review KeepWatch hand off checklist' },
      { title: '[Tableau Cloud Advisory] Review all relevant project documentation' },
      { title: '[Tableau Cloud Advisory] Request MOAS job in Comms tab of Tableau Cloud migration job' },
      { title: '[Tableau Cloud Advisory] Create client folder in SLA Box' },
      { title: '[Tableau Cloud Advisory] Verify client-side delegated contacts' },
      { title: '[Tableau Cloud Advisory] Identify KW engineer to assist on intro call / have awareness' },
      { title: '[Tableau Cloud Advisory] Schedule external intro call' },
      { title: '[Tableau Cloud Advisory] Prepare support documentation' },
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

export function useTemplates() {
  const [storedTemplates, setTemplates] = useLocalStorage<ChecklistTemplate[]>('onboarding-templates', []);

  // Merge default templates with user templates (defaults first, then user-created)
  const templates = [
    ...DEFAULT_TEMPLATES.filter(dt => !storedTemplates.some(st => st.id === dt.id)),
    ...storedTemplates,
  ];

  const addTemplate = useCallback((name: string, items: { title: string; dueOffsetDays?: number }[]): ChecklistTemplate => {
    const newTemplate: ChecklistTemplate = {
      id: generateId(),
      name,
      items,
      createdAt: new Date().toISOString(),
    };
    setTemplates((prev) => [...prev, newTemplate]);
    return newTemplate;
  }, [setTemplates]);

  const updateTemplate = useCallback((id: string, data: Partial<Omit<ChecklistTemplate, 'id' | 'createdAt'>>) => {
    setTemplates((prev) =>
      prev.map((template) =>
        template.id === id ? { ...template, ...data } : template
      )
    );
  }, [setTemplates]);

  const deleteTemplate = useCallback((id: string) => {
    setTemplates((prev) => prev.filter((template) => template.id !== id));
  }, [setTemplates]);

  return {
    templates,
    addTemplate,
    updateTemplate,
    deleteTemplate,
  };
}
