import { useEffect, useState } from 'react';
import { formatRelativeTime } from '../../utils/helpers';
import { getPortalLastView } from '../../hooks/usePortalWriter';
import type { Client } from '../../types';
import { ClientPortalView } from './ClientPortalView';
import { usePortalExport } from '../../hooks/usePortalExport';
import { Button } from '../UI/Button';

interface PortalModalProps {
  client: Client;
  onClose: () => void;
}

export function PortalModal({ client, onClose }: PortalModalProps) {
  const { exportPortal } = usePortalExport();
  const [viewMode, setViewMode] = useState<'client' | 'csm'>('client');
  const lastViewedAt = getPortalLastView(client.id);
  const portalComments = (client.communicationLog ?? []).filter(e => e.source === 'client-portal');
  const clientCompletedTasks = client.checklist.filter(t => t.completed && t.ownerType === 'client');

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label={`${client.name} Portal`}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 bg-zinc-900 border-b border-zinc-700 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-white">{client.name} — Client Portal</span>
          <div className="flex gap-1 p-0.5 bg-zinc-800 rounded-lg">
            <button
              onClick={() => setViewMode('client')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${viewMode === 'client' ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              Client View
            </button>
            <button
              onClick={() => setViewMode('csm')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${viewMode === 'csm' ? 'bg-zinc-600 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              CSM Summary
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => exportPortal(client)}
            variant="secondary"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export HTML
          </Button>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-zinc-800"
            aria-label="Close portal"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Portal content (scrollable) */}
      <div className="flex-1 overflow-y-auto">
        {viewMode === 'client' ? (
          <ClientPortalView client={client} />
        ) : (
          <div className="max-w-2xl mx-auto p-8 space-y-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Portal Activity Summary</h2>
            <div className="glass-subtle rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Last viewed by client</span>
                <span className="text-sm text-gray-500">
                  {lastViewedAt ? formatRelativeTime(lastViewedAt) : 'Never'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Client tasks completed via portal</span>
                <span className="text-sm text-gray-500">{clientCompletedTasks.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Status updates posted</span>
                <span className="text-sm text-gray-500">{portalComments.length}</span>
              </div>
            </div>
            {portalComments.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Recent Status Updates</h3>
                <div className="space-y-2">
                  {portalComments.slice(-5).reverse().map(entry => (
                    <div key={entry.id} className="glass-subtle rounded-xl p-3">
                      <p className="text-sm text-gray-700 dark:text-gray-300">{entry.content}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(entry.timestamp)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
