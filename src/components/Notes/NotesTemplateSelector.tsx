import { useState } from 'react';
import type { NotesTemplate } from '../../types';
import { useClientContext } from '../../context/ClientContext';

interface NotesTemplateSelectorProps {
  clientName: string;
  assignedTo: string;
  status: string;
  onApply: (content: string) => void;
}

export function NotesTemplateSelector({
  clientName,
  assignedTo,
  status,
  onApply,
}: NotesTemplateSelectorProps) {
  const { notesTemplates, applyNotesTemplate } = useClientContext();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<NotesTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  if (notesTemplates.length === 0) {
    return null;
  }

  const getVariables = (): Record<string, string> => ({
    clientName,
    assignedTo,
    status,
    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString(),
    datetime: new Date().toLocaleString(),
  });

  const handleSelect = (template: NotesTemplate) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  const handleApply = () => {
    if (selectedTemplate) {
      const content = applyNotesTemplate(selectedTemplate, getVariables());
      onApply(content);
      setShowPreview(false);
      setSelectedTemplate(null);
      setIsOpen(false);
    }
  };

  const previewContent = selectedTemplate
    ? applyNotesTemplate(selectedTemplate, getVariables())
    : '';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 glass-subtle rounded-lg transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        Use Template
        <svg
          className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && !showPreview && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-64 glass-strong rounded-xl shadow-xl z-20 border border-white/30 dark:border-white/10 overflow-hidden">
            <div className="p-2 border-b border-white/20 dark:border-white/10">
              <p className="text-xs text-gray-500 dark:text-gray-400 px-2">
                Select a template to apply
              </p>
            </div>
            <div className="max-h-64 overflow-y-auto p-2 space-y-1">
              {notesTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleSelect(template)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
                >
                  <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                    {template.name}
                  </p>
                  {template.category && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {template.category}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {showPreview && selectedTemplate && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              setShowPreview(false);
              setSelectedTemplate(null);
            }}
          />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative glass-strong rounded-2xl shadow-2xl p-6 max-w-lg w-full border border-white/30 dark:border-white/10">
              <h3 className="text-lg font-semibold gradient-text mb-2">
                Preview: {selectedTemplate.name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Variables like {'{{clientName}}'} will be replaced with actual values
              </p>
              <div className="bg-white/30 dark:bg-white/5 rounded-xl p-4 mb-4 max-h-64 overflow-y-auto">
                <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans">
                  {previewContent}
                </pre>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowPreview(false);
                    setSelectedTemplate(null);
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApply}
                  className="px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-lg hover:from-violet-600 hover:to-purple-700 transition-colors"
                >
                  Apply Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
