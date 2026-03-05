import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { Client } from '../../types';
import { useAISettings } from '../../hooks/useAISettings';
import { computeHealthScore } from '../../utils/healthScore';

interface MeetingBriefModalProps {
  client: Client;
  onClose: () => void;
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

function buildMeetingBriefPrompt(client: Client): string {
  const healthScore = computeHealthScore(client, []);
  const checklist = client.checklist ?? [];
  const totalTasks = checklist.length;
  const completedTasks = checklist.filter(t => t.completed).length;
  const pctComplete = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Current phase: find the first phase where not all tasks are done
  const phases = client.phases ?? [];
  let currentPhase = 'N/A';
  for (const phase of phases) {
    const phaseTasks = checklist.filter(t => t.phaseId === phase.id);
    const allDone = phaseTasks.length > 0 && phaseTasks.every(t => t.completed);
    if (!allDone) {
      currentPhase = phase.name;
      break;
    }
  }
  if (currentPhase === 'N/A' && phases.length > 0) {
    currentPhase = phases[phases.length - 1].name;
  }

  // Last 3 communication log entries
  const commLog = client.communicationLog ?? [];
  const last3Comms = [...commLog]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 3);

  const commsText =
    last3Comms.length > 0
      ? last3Comms
          .map(
            (c) =>
              `- Type: ${c.type}, Subject: "${c.subject}", Date: ${formatTimestamp(c.timestamp)}`
          )
          .join('\n')
      : '- No communication log entries recorded.';

  // Overdue tasks
  const now = new Date();
  const overdueTasks = checklist.filter(
    (t) => !t.completed && t.dueDate && new Date(t.dueDate) < now
  );
  const overdueText =
    overdueTasks.length > 0
      ? overdueTasks.map((t) => `- "${t.text}" (due ${formatTimestamp(t.dueDate!)})`).join('\n')
      : '- No overdue tasks.';

  // Blocked tasks
  const blockedTasks = checklist.filter((t) => t.isBlocked && !t.completed);
  const blockedText =
    blockedTasks.length > 0
      ? blockedTasks
          .map((t) => `- "${t.text}"${t.blockReason ? ` — Reason: ${t.blockReason}` : ''}`)
          .join('\n')
      : '- No blocked tasks.';

  return `You are an expert client success manager. Generate a structured pre-call meeting brief for the following client. Be concise, practical, and actionable.

CLIENT: ${client.name}
HEALTH SCORE: ${healthScore.total}/100 (${healthScore.label})
CURRENT PHASE: ${currentPhase}
PROGRESS: ${pctComplete}% complete (${completedTasks}/${totalTasks} tasks)
LIFECYCLE STAGE: ${client.lifecycleStage ?? 'onboarding'}
STATUS: ${client.status}

RECENT COMMUNICATIONS (last 3):
${commsText}

OVERDUE TASKS:
${overdueText}

BLOCKED TASKS:
${blockedText}

Generate a pre-call meeting brief with EXACTLY these five sections using markdown headings:

## 1. Client Status Snapshot
Summarize health score, phase, % complete, and lifecycle stage in 2-3 sentences.

## 2. Recent Communications
Summarize the recent communication entries above — note patterns, frequency, and last touchpoint.

## 3. Open Action Items
List overdue and blocked tasks that need to be addressed. If none, say so.

## 4. Talking Points
Based on what's stalled or blocked, suggest 3-4 specific talking points or questions to raise with the client.

## 5. Suggested Agenda
Provide a 3-4 bullet agenda for a 30-minute call with this client, based on the data above.`;
}

export function MeetingBriefModal({ client, onClose }: MeetingBriefModalProps) {
  const { settings } = useAISettings();

  const [brief, setBrief] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  const generate = useCallback(async () => {
    if (!settings.anthropicApiKey) {
      setError('No API key configured. Please add your Anthropic API key in Settings.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setBrief('');

    const prompt = buildMeetingBriefPrompt(client);

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
      setBrief(text);
      setGeneratedAt(new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [client, settings]);

  // Auto-generate on open
  useEffect(() => {
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopy = useCallback(() => {
    if (!brief) return;
    navigator.clipboard.writeText(brief).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [brief]);

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
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-white/20 dark:border-white/10 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/30">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  Meeting Brief — {client.name}
                </h2>
                {generatedAt && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Generated {formatTimestamp(generatedAt)}
                  </p>
                )}
                {!generatedAt && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Pre-call intelligence brief
                  </p>
                )}
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
            {/* Action row */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={generate}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white text-sm font-semibold shadow-lg shadow-sky-500/25 hover:from-sky-600 hover:to-blue-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Regenerate
                  </>
                )}
              </button>

              {brief && (
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
                      Copy to Clipboard
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Loading state */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <svg className="w-8 h-8 animate-spin text-sky-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Generating meeting brief for {client.name}...
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Generated brief */}
            {brief && !isLoading && (
              <div className="glass-subtle rounded-xl p-4">
                <MarkdownBlock text={brief} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
