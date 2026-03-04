import { useState } from 'react';
import type { ChecklistTemplate } from '../../types';
import { useClientContext } from '../../context/ClientContext';
import { Button } from '../UI/Button';
import { formatDate } from '../../utils/helpers';

interface TemplateCardProps {
  template: ChecklistTemplate;
  onEdit: () => void;
}

export function TemplateCard({ template, onEdit }: TemplateCardProps) {
  const { deleteTemplate } = useClientContext();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <>
      <div className="glass-card p-5">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold gradient-text">
            {template.name}
          </h3>
          <div className="flex gap-1">
            <button
              onClick={onEdit}
              className="p-1.5 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-white/50 dark:hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Edit template"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-white/50 dark:hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Delete template"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {template.items.length} task{template.items.length !== 1 ? 's' : ''}
        </p>

        <ul className="space-y-2 mb-4 max-h-40 overflow-y-auto">
          {template.items.slice(0, 5).map((item, index) => (
            <li key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="truncate">{item.title}</span>
              {item.dueOffsetDays && (
                <span className="text-xs text-blue-600 dark:text-blue-400 flex-shrink-0">
                  +{item.dueOffsetDays}d
                </span>
              )}
            </li>
          ))}
          {template.items.length > 5 && (
            <li className="text-sm text-gray-400 dark:text-gray-500 italic">
              +{template.items.length - 5} more items
            </li>
          )}
        </ul>

        <p className="text-xs text-gray-400 dark:text-gray-500">
          Created {formatDate(template.createdAt)}
        </p>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative glass-strong rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-white/30 dark:border-white/10">
              <h3 className="text-lg font-semibold gradient-text mb-2">
                Delete Template?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete "{template.name}"? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={() => deleteTemplate(template.id)}>
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
