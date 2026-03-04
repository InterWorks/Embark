import { useEffect } from 'react';
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
          <span className="text-sm font-bold text-white">{client.name} — Client Portal Preview</span>
          <span className="px-2 py-0.5 bg-violet-700 text-white text-xs font-bold rounded-full">Preview</span>
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
        <ClientPortalView client={client} />
      </div>
    </div>
  );
}
