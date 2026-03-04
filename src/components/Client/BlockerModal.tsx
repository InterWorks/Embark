import { useState } from 'react';
import { Modal } from '../UI/Modal';
import { useClientContext } from '../../context/ClientContext';
import type { ChecklistItem } from '../../types';

interface BlockerModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  item: ChecklistItem;
}

export function BlockerModal({ isOpen, onClose, clientId, item }: BlockerModalProps) {
  const { updateChecklistItem } = useClientContext();
  const [blockedBy, setBlockedBy] = useState<'client' | 'internal' | 'external'>(item.blockedBy ?? 'internal');
  const [reason, setReason] = useState(item.blockReason ?? '');

  const isBlocked = !!item.isBlocked;

  const handleBlock = () => {
    updateChecklistItem(clientId, item.id, {
      isBlocked: true,
      blockedBy,
      blockReason: reason.trim() || undefined,
    });
    onClose();
  };

  const handleUnblock = () => {
    updateChecklistItem(clientId, item.id, {
      isBlocked: false,
      blockedBy: undefined,
      blockReason: undefined,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isBlocked ? 'Task Blocked' : 'Mark as Blocked'}
      size="sm"
    >
      {isBlocked ? (
        <div className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
            <p className="text-sm font-medium text-red-700 dark:text-red-300">
              Blocked by: <span className="capitalize">{item.blockedBy}</span>
            </p>
            {item.blockReason && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">{item.blockReason}</p>
            )}
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleUnblock}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
            >
              Unblock Task
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Who or what is blocking <strong>"{item.title}"</strong>?
          </p>

          <div className="grid grid-cols-3 gap-2">
            {(['client', 'internal', 'external'] as const).map(opt => (
              <button
                key={opt}
                onClick={() => setBlockedBy(opt)}
                className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition-colors capitalize ${
                  blockedBy === opt
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-red-300'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Reason (optional)
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Describe what's blocking this task..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 outline-none focus:ring-2 focus:ring-red-500/50 resize-none"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleBlock}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              Mark Blocked
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
