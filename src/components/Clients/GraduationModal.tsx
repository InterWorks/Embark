import { useEffect } from 'react';
import type { Client } from '../../types';
import { useGraduationSummary } from '../../hooks/useGraduationSummary';
import { Button } from '../UI/Button';
import confetti from 'canvas-confetti';

interface GraduationModalProps {
  client: Client;
  onConfirm: (summary: string) => void;
  onDismiss: () => void;
}

export function GraduationModal({ client, onConfirm, onDismiss }: GraduationModalProps) {
  const { generate, summary, setSummary, isLoading, error } = useGraduationSummary();

  useEffect(() => {
    generate(client);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConfirm = () => {
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
    });
    onConfirm(summary);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onDismiss} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative glass-strong rounded-2xl shadow-2xl p-6 max-w-lg w-full border border-white/30 dark:border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-3xl">🎓</div>
            <div>
              <h3 className="text-xl font-bold gradient-text">Onboarding Complete!</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{client.name} has completed all tasks.</p>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Handoff Summary
            </label>
            {isLoading ? (
              <div className="flex items-center gap-2 py-6 justify-center text-gray-500 dark:text-gray-400">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating AI summary...
              </div>
            ) : error ? (
              <div className="text-sm text-red-500 dark:text-red-400 py-2">
                {error} — you can still confirm without a summary.
              </div>
            ) : (
              <textarea
                value={summary}
                onChange={e => setSummary(e.target.value)}
                rows={5}
                className="w-full rounded-xl border bg-white/50 dark:bg-white/5 backdrop-blur-sm text-gray-900 dark:text-gray-100 border-white/30 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm p-3 resize-none"
                placeholder="Enter a handoff summary..."
              />
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={onDismiss}>
              Dismiss
            </Button>
            <Button onClick={handleConfirm} disabled={isLoading}>
              🎉 Confirm Graduation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
