import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import type { Client, EmailTemplate, CommunicationLogEntry } from '../../types';
import { useEmailTemplates } from '../../hooks/useEmailTemplates';
import { useClientContext } from '../../context/ClientContext';
import { Button } from '../UI/Button';

interface EmailComposerProps {
  client: Client;
  isOpen: boolean;
  onClose: () => void;
  toEmail?: string;
  onSend?: (subject: string, body: string) => void;
}

export function EmailComposer({ client, isOpen, onClose, toEmail, onSend }: EmailComposerProps) {
  const { templates } = useEmailTemplates();
  const { addCommunication } = useClientContext();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [logEmail, setLogEmail] = useState(true);

  const completedTasks = client.checklist.filter((t) => t.completed);
  const pendingTasks = client.checklist.filter((t) => !t.completed);
  const progress = client.checklist.length > 0
    ? Math.round((completedTasks.length / client.checklist.length) * 100)
    : 0;

  const variables: Record<string, string> = useMemo(() => ({
    clientName: client.name,
    clientEmail: client.email,
    assignedTo: client.assignedTo,
    status: client.status,
    progress: String(progress),
    completedTasks: completedTasks.length > 0
      ? completedTasks.map((t) => `- ${t.title}`).join('\n')
      : '- No tasks completed yet',
    pendingTasks: pendingTasks.length > 0
      ? pendingTasks.map((t) => `- ${t.title}`).join('\n')
      : '- All tasks complete!',
    date: new Date().toLocaleDateString(),
  }), [client, completedTasks, pendingTasks, progress]);

  const replaceVariables = (text: string): string => {
    let result = text;
    Object.entries(variables).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return result;
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setSubject(replaceVariables(template.subject));
      setBody(replaceVariables(template.body));
    }
  };

  const handleSendEmail = () => {
    const emailTo = toEmail ?? client.email;
    const mailtoLink = `mailto:${encodeURIComponent(emailTo)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    if (logEmail) {
      const entry: Omit<CommunicationLogEntry, 'id' | 'timestamp'> = {
        type: 'email',
        subject,
        content: body,
      };
      addCommunication(client.id, entry);
    }

    onSend?.(subject, body);
    window.open(mailtoLink, '_blank');
    onClose();
  };

  const handleCopyToClipboard = async () => {
    const emailContent = `To: ${client.email}\nSubject: ${subject}\n\n${body}`;
    try {
      await navigator.clipboard.writeText(emailContent);
    } catch {
      // Fallback for browsers that don't support clipboard API
      const textarea = document.createElement('textarea');
      textarea.value = emailContent;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  };

  if (!isOpen) return null;

  const groupedTemplates = templates.reduce((acc, template) => {
    const category = template.category || 'custom';
    if (!acc[category]) acc[category] = [];
    acc[category].push(template);
    return acc;
  }, {} as Record<string, EmailTemplate[]>);

  const categoryLabels: Record<string, string> = {
    welcome: 'Welcome',
    followup: 'Follow Up',
    update: 'Updates',
    reminder: 'Reminders',
    custom: 'Custom',
  };

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative glass-strong rounded-2xl shadow-2xl w-full max-w-2xl border border-white/30 dark:border-white/10 animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/20 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold gradient-text">Compose Email</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  To: {client.name} ({toEmail ?? client.email})
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Template Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Use Template
              </label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
                  <div key={category} className="space-y-1">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      {categoryLabels[category]}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {categoryTemplates.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => handleTemplateSelect(template.id)}
                          className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                            selectedTemplateId === template.id
                              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                              : 'glass-subtle text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-white/20'
                          }`}
                        >
                          {template.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="input w-full"
                placeholder="Enter email subject..."
              />
            </div>

            {/* Body */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Message
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="input w-full h-48 resize-none font-mono text-sm"
                placeholder="Enter email message..."
              />
            </div>

            {/* Available Variables */}
            <div className="glass-subtle p-3 rounded-lg">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                Available Variables (click to insert):
              </p>
              <div className="flex flex-wrap gap-1">
                {Object.keys(variables).map((variable) => (
                  <button
                    key={variable}
                    onClick={() => setBody((prev) => prev + `{{${variable}}}`)}
                    className="px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-900 transition-colors"
                  >
                    {`{{${variable}}}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Log Email Checkbox */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={logEmail}
                onChange={(e) => setLogEmail(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Log this email in communication history
              </span>
            </label>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center gap-3 p-6 border-t border-white/20 dark:border-white/10">
            <Button variant="secondary" onClick={handleCopyToClipboard}>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              Copy
            </Button>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSendEmail} disabled={!subject || !body}>
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Open Email Client
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
