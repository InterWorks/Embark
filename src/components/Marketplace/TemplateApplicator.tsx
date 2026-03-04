import { useState } from 'react';
import {
  X,
  ChevronRight,
  Check,
  Clock,
  ListTodo,
  Flag,
  Sparkles,
} from 'lucide-react';
import type { TemplateDefinition } from '../../types/marketplace';
import { useClientContext } from '../../context/ClientContext';

interface TemplateApplicatorProps {
  template: TemplateDefinition;
  onClose: () => void;
  onSuccess: (clientId: string) => void;
}

export function TemplateApplicator({ template, onClose, onSuccess }: TemplateApplicatorProps) {
  const { addClient, addChecklistItem, addMilestone } = useClientContext();
  const [step, setStep] = useState<'preview' | 'configure' | 'applying' | 'complete'>('preview');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [createdClientId, setCreatedClientId] = useState<string | null>(null);

  const handleApplyTemplate = async () => {
    if (!clientName.trim() || !clientEmail.trim()) return;

    setStep('applying');

    try {
      // Create the client
      const newClient = addClient({
        name: clientName,
        email: clientEmail,
        phone: '',
        status: 'active',
        priority: 'medium',
        assignedTo: 'Unassigned',
      });

      const startDateObj = new Date(startDate);

      // Add tasks from template
      for (const task of template.tasks) {
        const dueDate = task.dueOffsetDays
          ? new Date(startDateObj.getTime() + task.dueOffsetDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          : undefined;

        addChecklistItem(newClient.id, task.title, dueDate, undefined, task.group);
      }

      // Add milestones from template
      if (template.milestones) {
        for (const milestone of template.milestones) {
          const targetDate = milestone.targetOffsetDays
            ? new Date(startDateObj.getTime() + milestone.targetOffsetDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            : undefined;

          addMilestone(newClient.id, {
            title: milestone.title,
            description: milestone.description,
            targetDate,
            color: milestone.color,
          });
        }
      }

      setCreatedClientId(newClient.id);
      setStep('complete');
    } catch (error) {
      console.error('Failed to apply template:', error);
      setStep('configure');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
              style={{ backgroundColor: template.color + '20' }}
            >
              {template.icon}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{template.name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{template.industry}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'preview' && (
            <div className="space-y-6">
              <p className="text-gray-600 dark:text-gray-400">{template.description}</p>

              {/* Template Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 text-center">
                  <ListTodo className="w-6 h-6 text-violet-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{template.tasks.length}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Tasks</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 text-center">
                  <Flag className="w-6 h-6 text-violet-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{template.milestones?.length || 0}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Milestones</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 text-center">
                  <Clock className="w-6 h-6 text-violet-600 mx-auto mb-2" />
                  <div className="text-xl font-bold text-gray-900 dark:text-white">{template.estimatedDuration || 'Varies'}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Duration</div>
                </div>
              </div>

              {/* Task Preview */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Included Tasks</h3>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                  {template.tasks.map((task, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <div className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center text-xs text-gray-500">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white text-sm">{task.title}</div>
                        {task.group && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">{task.group}</div>
                        )}
                      </div>
                      {task.dueOffsetDays && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Day {task.dueOffsetDays}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Milestones Preview */}
              {template.milestones && template.milestones.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Milestones</h3>
                  <div className="flex flex-wrap gap-2">
                    {template.milestones.map((milestone, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 rounded-full text-sm font-medium"
                        style={{
                          backgroundColor: (milestone.color || '#8b5cf6') + '20',
                          color: milestone.color || '#8b5cf6',
                        }}
                      >
                        {milestone.title}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => setStep('configure')}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 transition-colors"
              >
                Use This Template
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {step === 'configure' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Configure New Client</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Client Name *
                    </label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Enter client or company name"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Client Email *
                    </label>
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="client@example.com"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Task due dates will be calculated from this date
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStep('preview')}
                  className="flex-1 px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleApplyTemplate}
                  disabled={!clientName.trim() || !clientEmail.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Sparkles className="w-5 h-5" />
                  Create Client
                </button>
              </div>
            </div>
          )}

          {step === 'applying' && (
            <div className="py-12 text-center">
              <div className="w-16 h-16 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Creating Client</h3>
              <p className="text-gray-500 dark:text-gray-400">Setting up tasks and milestones...</p>
            </div>
          )}

          {step === 'complete' && (
            <div className="py-8 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Client Created!</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {clientName} has been created with {template.tasks.length} tasks
                {template.milestones ? ` and ${template.milestones.length} milestones` : ''}.
              </p>
              <div className="flex items-center gap-3 justify-center">
                <button
                  onClick={onClose}
                  className="px-6 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => createdClientId && onSuccess(createdClientId)}
                  className="px-6 py-2 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 transition-colors"
                >
                  View Client
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
