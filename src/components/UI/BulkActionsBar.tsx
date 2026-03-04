import { useState } from 'react';
import type { Client, Priority } from '../../types';
import { Button } from './Button';

interface BulkActionsBarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkStatusChange: (status: Client['status']) => void;
  onBulkPriorityChange: (priority: Priority) => void;
  onBulkArchive: () => void;
  onBulkDelete: () => void;
}

export function BulkActionsBar({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onBulkStatusChange,
  onBulkPriorityChange,
  onBulkArchive,
  onBulkDelete,
}: BulkActionsBarProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const allSelected = selectedCount === totalCount;

  return (
    <>
      <div className="bg-yellow-50 dark:bg-zinc-800 border-2 border-zinc-900 dark:border-white shadow-[4px_4px_0_0_#18181b] dark:shadow-[4px_4px_0_0_#ffffff] rounded-[4px] animate-slide-up px-4 py-3 mb-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={allSelected ? onDeselectAll : onSelectAll}
            className="flex items-center gap-2 text-sm text-zinc-900 dark:text-zinc-100 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            <span className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
              allSelected
                ? 'bg-yellow-400 border-zinc-900'
                : selectedCount > 0
                  ? 'bg-yellow-400 border-zinc-900'
                  : 'border-zinc-400'
            }`}>
              {allSelected ? (
                <svg className="w-3 h-3 text-zinc-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : selectedCount > 0 ? (
                <svg className="w-3 h-3 text-zinc-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
                </svg>
              ) : null}
            </span>
            {allSelected ? 'Deselect all' : 'Select all'}
          </button>
          <span className="text-sm text-zinc-900 dark:text-white font-medium">
            {selectedCount} selected
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className="px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center gap-1.5"
            >
              Set Status
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showStatusMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowStatusMenu(false)} />
                <div className="absolute left-0 mt-1 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 py-1">
                  {(['active', 'on-hold', 'completed'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => { onBulkStatusChange(status); setShowStatusMenu(false); }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 capitalize"
                    >
                      {status.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Priority dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowPriorityMenu(!showPriorityMenu)}
              className="px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center gap-1.5"
            >
              Set Priority
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showPriorityMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowPriorityMenu(false)} />
                <div className="absolute left-0 mt-1 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 py-1">
                  {(['high', 'medium', 'low', 'none'] as const).map((priority) => (
                    <button
                      key={priority}
                      onClick={() => { onBulkPriorityChange(priority); setShowPriorityMenu(false); }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 capitalize"
                    >
                      {priority}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Archive button */}
          <button
            onClick={onBulkArchive}
            className="px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            Archive
          </button>

          {/* Delete button */}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-3 py-1.5 text-sm bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>

          {/* Cancel button */}
          <button
            onClick={onDeselectAll}
            className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-sm w-full">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Delete {selectedCount} Client{selectedCount !== 1 ? 's' : ''}?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete {selectedCount} client{selectedCount !== 1 ? 's' : ''}? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={() => { onBulkDelete(); setShowDeleteConfirm(false); }}>
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
