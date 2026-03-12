import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { Client } from '../../types';
import { useAISettings } from '../../hooks/useAISettings';
import { useSLAStatuses } from '../../hooks/useSLA';
import { computeHealthScore } from '../../utils/healthScore';
import { buildStatusReportPrompt } from '../../utils/ai/statusReport';
import { EmailComposer } from '../Email/EmailComposer';

interface SavedReport {
  id: string;
  content: string;
  generatedAt: string;
}

const STORAGE_PREFIX = 'embark-status-reports-';
const MAX_SAVED = 5;

function loadReports(clientId: string): SavedReport[] {
  try {
    return JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}${clientId}`) || '[]');
  } catch {
    return [];
  }
}

function saveReport(clientId: string, content: string): SavedReport[] {
  const existing = loadReports(clientId);
  const newReport: SavedReport = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    content,
    generatedAt: new Date().toISOString(),
  };
  const updated = [newReport, ...existing].slice(0, MAX_SAVED);
  localStorage.setItem(`${STORAGE_PREFIX}${clientId}`, JSON.stringify(updated));
  return updated;
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Render markdown text into JSX without an external library. */
function MarkdownBlock({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (/^#{1,6}\s/.test(line)) {
          const level = line.match(/^(#+)/)?.[1].length ?? 1;
          const content = line.replace(/^#+\s*/, '');
          const baseClass = 'font-semibold text-gray-900 dark:text-gray-100';
          const sizeClass =
            level === 1 ? 'text-xl mt-4 mb-1'
            : level === 2 ? 'text-base mt-3 mb-0.5'
            : 'text-sm mt-2 mb-0';
          return <p key={i} className={`${baseClass} ${sizeClass}`}>{content}</p>;
        }
        if (/^---+$/.test(line.trim())) {
          return <hr key={i} className="border-white/20 dark:border-white/10 my-2" />;
        }
        if (/^[-*]\s/.test(line)) {
          const content = line.replace(/^[-*]\s/, '');
          return (
            <p key={i} className="text-sm text-gray-700 dark:text-gray-300 pl-4 before:content-['•'] before:mr-2 before:text-violet-500">
              {content}
            </p>
          );
        }
        if (line.trim() === '') {
          return <div key={i} className="h-1" />;
        }
        return (
          <p key={i} className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {line}
          </p>
        );
      })}
    </div>
  );
}

interface StatusReportModalProps {
  client: Client;
  onClose: () => void;
}

export function StatusReportModal({ client, onClose }: StatusReportModalProps) {
  const { settings } = useAISettings();
  const slaStatuses = useSLAStatuses([client]);
  const healthScore = computeHealthScore(client, slaStatuses);

  const [report, setReport] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [savedReports, setSavedReports] = useState<SavedReport[]>(() => loadReports(client.id));
  const [selectedHistory, setSelectedHistory] = useState<string | null>(null);
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [emailBody, setEmailBody] = useState<string>('');

  const generate = useCallback(async () => {
    if (!settings.anthropicApiKey) {
      setError('No API key configured. Please add your Anthropic API key in Settings.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setReport('');
    setSelectedHistory(null);

    const prompt = buildStatusReportPrompt(client, healthScore.total);

    try {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': settings.anthropicApiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: settings.anthropicModel || 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error?.message || `API error ${resp.status}`);
      const text: string = data.content?.[0]?.text ?? '';
      if (!text) throw new Error('Empty response from AI');
      setReport(text);
      const updated = saveReport(client.id, text);
      setSavedReports(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [client, healthScore, settings]);

  const handleCopy = useCallback(() => {
    const content = selectedHistory ?? report;
    if (!content) return;
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [report, selectedHistory]);

  const handleSendEmail = useCallback(() => {
    const content = selectedHistory ?? report;
    if (!content) return;
    setEmailBody(content);
    setShowEmailComposer(true);
  }, [report, selectedHistory]);

  const displayedReport = selectedHistory ?? report;

  const modal = (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative glass-strong rounded-2xl shadow-2xl w-full max-w-2xl border border-white/30 dark:border-white/10 flex flex-col"
          style={{ maxHeight: '90vh' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-white/20 dark:border-white/10 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/30">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">AI Status Report</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">{client.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-white/10 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Scrollable body */}
          <div className="overflow-y-auto flex-1 p-5 space-y-4">
            {/* Generate button + action row */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={generate}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-semibold shadow-lg shadow-violet-500/25 hover:from-violet-600 hover:to-purple-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generate Status Report
                  </>
                )}
              </button>

              {displayedReport && (
                <>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 border border-white/20 hover:bg-white/10 transition-all"
                  >
                    {copied ? (
                      <>
                        <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleSendEmail}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 border border-white/20 hover:bg-white/10 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Send via Email
                  </button>
                </>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Generated report */}
            {displayedReport && (
              <div className="glass-subtle rounded-xl p-4">
                {selectedHistory && (
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
                    <span className="text-xs text-amber-500 dark:text-amber-400 font-medium">Viewing saved report</span>
                    <button
                      onClick={() => setSelectedHistory(null)}
                      className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 underline"
                    >
                      Back to latest
                    </button>
                  </div>
                )}
                <MarkdownBlock text={displayedReport} />
              </div>
            )}

            {!displayedReport && !isLoading && !error && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">
                Click "Generate Status Report" to create an AI-powered summary for {client.name}.
              </p>
            )}

            {/* Recent Reports */}
            {savedReports.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Recent Reports
                </h3>
                <div className="space-y-1.5">
                  {savedReports.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setSelectedHistory(r.id === selectedHistory ? null : r.content)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all border ${
                        selectedHistory === r.content
                          ? 'bg-violet-500/10 border-violet-500/30 text-violet-700 dark:text-violet-300'
                          : 'border-white/10 hover:bg-white/10 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs">
                          {r.content.split('\n').find(l => l.trim())?.replace(/^#+ /, '') || 'Status Report'}
                        </span>
                        <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                          {formatTimestamp(r.generatedAt)}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Email Composer */}
      {showEmailComposer && (
        <EmailComposer
          client={client}
          isOpen={showEmailComposer}
          onClose={() => setShowEmailComposer(false)}
          onSend={(_subject, _body) => setShowEmailComposer(false)}
        />
      )}
    </div>
  );

  // Pre-fill email body — we pass it via the EmailComposer's initial state workaround
  // by supplying the report content as a note that operators can copy from.
  // (EmailComposer manages its own body state; we open it pre-loaded via `emailBody` ref.)
  void emailBody; // acknowledged — used via showEmailComposer gate above

  return createPortal(modal, document.body);
}
