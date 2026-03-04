import { useState } from 'react';
import type { ClientFormData, ClientContact, ClientAssignment } from '../../../types';
import { useClientContext } from '../../../context/ClientContext';
import { buildTasksFromTemplate } from '../../../utils/helpers';
import { Button } from '../../UI/Button';
import { Step1ClientInfo, type ContactEntry } from './Step1ClientInfo';
import { Step2Template } from './Step2Template';
import { Step3Team, type AssignmentEntry } from './Step3Team';

interface IntakeWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

const STEPS = ['Client Info', 'Template', 'Team'];

export function IntakeWizard({ isOpen, onClose }: IntakeWizardProps) {
  const { addClient, addChecklistItemWithData, templates } = useClientContext();

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [contacts, setContacts] = useState<ContactEntry[]>([]);
  const [goLiveDate, setGoLiveDate] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<AssignmentEntry[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleClose = () => {
    // Reset state
    setStep(0);
    setName('');
    setContacts([]);
    setGoLiveDate('');
    setSelectedTemplateId(null);
    setAssignments([]);
    setErrors({});
    onClose();
  };

  const validateStep1 = (): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Client name is required';
    if (contacts.length === 0) {
      e.contacts = 'Add at least one contact';
    } else {
      const invalid = contacts.find(c => !c.name.trim() || !c.email.trim());
      if (invalid) e.contacts = 'Each contact needs a name and email';
      else {
        const badEmail = contacts.find(c => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email));
        if (badEmail) e.contacts = 'Enter valid email addresses';
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (step === 0 && !validateStep1()) return;
    setErrors({});
    setStep(s => s + 1);
  };

  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = () => {
    // Build primary contact's email for legacy field
    const primaryContact = contacts.find(c => c.isPrimary) ?? contacts[0];

    const clientContacts: ClientContact[] = contacts.map(c => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone || undefined,
      title: c.title || undefined,
      isPrimary: c.isPrimary,
      createdAt: new Date().toISOString(),
    }));

    const clientAssignments: ClientAssignment[] = assignments
      .filter(a => a.memberId && a.roleId)
      .map(a => ({
        id: a.id,
        memberId: a.memberId,
        roleId: a.roleId,
        isPrimary: a.isPrimary,
        assignedAt: new Date().toISOString(),
      }));

    // Derive legacy assignedTo from primary assignment member name (fallback to empty)
    const primaryAssignment = clientAssignments.find(a => a.isPrimary) ?? clientAssignments[0];

    const formData: ClientFormData = {
      name: name.trim(),
      email: primaryContact?.email ?? '',
      phone: primaryContact?.phone,
      assignedTo: primaryAssignment?.memberId ?? '',
      status: 'active',
      priority: 'none',
      targetGoLiveDate: goLiveDate || undefined,
      contacts: clientContacts,
      assignments: clientAssignments,
    };

    const newClient = addClient(formData);

    // Apply template tasks
    if (selectedTemplateId) {
      const template = templates.find(t => t.id === selectedTemplateId);
      if (template) {
        const tasks = buildTasksFromTemplate(template, goLiveDate || undefined);
        tasks.forEach(task => {
          addChecklistItemWithData(newClient.id, {
            title: task.title,
            completed: false,
            dueDate: task.dueDate,
            phaseId: task.phaseId,
          });
        });
      }
    }

    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative glass-strong rounded-2xl shadow-2xl p-6 max-w-lg w-full border border-white/30 dark:border-white/10">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold gradient-text">New Client</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Step {step + 1} of {STEPS.length}</p>
            </div>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress bar */}
          <div className="flex gap-1.5 mb-6">
            {STEPS.map((label, i) => (
              <div key={label} className="flex-1">
                <div className={`h-1.5 rounded-full transition-all ${
                  i <= step ? 'bg-gradient-to-r from-violet-500 to-purple-500' : 'bg-white/20 dark:bg-white/10'
                }`} />
                <p className={`text-xs mt-1 text-center font-medium ${
                  i === step ? 'text-violet-600 dark:text-violet-400' : 'text-gray-400'
                }`}>{label}</p>
              </div>
            ))}
          </div>

          {/* Step content */}
          <div className="min-h-[240px]">
            {step === 0 && (
              <Step1ClientInfo
                name={name}
                setName={setName}
                contacts={contacts}
                setContacts={setContacts}
                goLiveDate={goLiveDate}
                setGoLiveDate={setGoLiveDate}
                error={errors.contacts ?? errors.name ?? ''}
              />
            )}
            {step === 1 && (
              <Step2Template
                templates={templates}
                selectedTemplateId={selectedTemplateId}
                setSelectedTemplateId={setSelectedTemplateId}
                goLiveDate={goLiveDate}
              />
            )}
            {step === 2 && (
              <Step3Team
                assignments={assignments}
                setAssignments={setAssignments}
                error={errors.assignments ?? ''}
              />
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between mt-6 pt-4 border-t border-white/20">
            <Button
              variant="secondary"
              onClick={step === 0 ? handleClose : handleBack}
            >
              {step === 0 ? 'Cancel' : 'Back'}
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={handleNext}>Next</Button>
            ) : (
              <Button onClick={handleSubmit} disabled={!name.trim()}>
                Create Client
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
