import { useEffect, useState } from 'react';
import type { Client } from '../../types';
import { useKickoffPackGenerator } from '../../hooks/useKickoffPackGenerator';
import { useClientContext } from '../../context/ClientContext';
import { Button } from '../UI/Button';

interface KickoffPackModalProps {
  client: Client;
  onClose: () => void;
}

export function KickoffPackModal({ client, onClose }: KickoffPackModalProps) {
  const { kickoffEmail, setKickoffEmail, teamBrief, setTeamBrief, isLoading, error, generate } = useKickoffPackGenerator();
  const { addEmailTemplate } = useClientContext() as { addEmailTemplate?: (t: { name: string; subject: string; body: string }) => void };
  const [activeTab, setActiveTab] = useState<'email' | 'brief'>('email');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    generate(client);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const activeContent = activeTab === 'email' ? kickoffEmail : teamBrief;
  const setActiveContent = activeTab === 'email' ? setKickoffEmail : setTeamBrief;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: use execCommand
      const el = document.createElement('textarea');
      el.value = activeContent;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveAsTemplate = () => {
    if (!addEmailTemplate) return;
    addEmailTemplate({
      name: `${client.name} - Kickoff Email`,
      subject: `Welcome to Your Onboarding — ${client.name}`,
      body: kickoffEmail,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative glass-strong rounded-2xl shadow-2xl p-6 max-w-2xl w-full border border-white/30 dark:border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold gradient-text">Kickoff Pack — {client.name}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-1 mb-4 p-1 bg-white/30 dark:bg-white/10 rounded-lg w-fit">
            {(['email', 'brief'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                  activeTab === tab
                    ? 'bg-white dark:bg-white/20 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {tab === 'email' ? '📧 Kickoff Email' : '📋 Internal Brief'}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-gray-500 dark:text-gray-400">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating kickoff pack...
            </div>
          ) : error ? (
            <div className="text-sm text-red-500 py-4">{error}</div>
          ) : (
            <textarea
              value={activeContent}
              onChange={e => setActiveContent(e.target.value)}
              rows={12}
              className="w-full rounded-xl border bg-white/50 dark:bg-white/5 backdrop-blur-sm text-gray-900 dark:text-gray-100 border-white/30 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm p-3 resize-none"
            />
          )}

          <div className="flex items-center justify-between mt-4">
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={handleCopy} disabled={isLoading || !activeContent}>
                {copied ? '✓ Copied!' : 'Copy to Clipboard'}
              </Button>
              {activeTab === 'email' && kickoffEmail && (
                <Button variant="secondary" size="sm" onClick={handleSaveAsTemplate}>
                  Save as Email Template
                </Button>
              )}
            </div>
            <Button variant="secondary" onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
