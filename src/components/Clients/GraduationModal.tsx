import { useEffect, useState } from 'react';
import type { Client, SuccessPlan } from '../../types';
import { useGraduationSummary } from '../../hooks/useGraduationSummary';
import { Button } from '../UI/Button';
import confetti from 'canvas-confetti';

interface GraduationModalProps {
  client: Client;
  onConfirm: (summary: string, successPlan?: SuccessPlan) => void;
  onDismiss: () => void;
}

type Step = 'graduation' | 'success-plan';

function buildNinetyDayPlan(): SuccessPlan {
  const addDays = (n: number): string => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().split('T')[0];
  };

  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    templateName: '90-Day Success Plan',
    tasks: [
      { id: crypto.randomUUID(), title: 'Complete product onboarding training', completed: false, category: 'adoption', dueDate: addDays(30) },
      { id: crypto.randomUUID(), title: 'Achieve 80% feature adoption', completed: false, category: 'adoption', dueDate: addDays(60) },
      { id: crypto.randomUUID(), title: '30-day check-in call', completed: false, category: 'qbr', dueDate: addDays(30) },
      { id: crypto.randomUUID(), title: '60-day business review', completed: false, category: 'qbr', dueDate: addDays(60) },
      { id: crypto.randomUUID(), title: '90-day executive QBR', completed: false, category: 'qbr', dueDate: addDays(90) },
      { id: crypto.randomUUID(), title: 'Identify expansion opportunity', completed: false, category: 'expansion', dueDate: addDays(60) },
      { id: crypto.randomUUID(), title: 'Collect NPS survey response', completed: false, category: 'renewal-prep', dueDate: addDays(45) },
      { id: crypto.randomUUID(), title: 'Renewal discussion and pricing review', completed: false, category: 'renewal-prep', dueDate: addDays(80) },
    ],
  };
}

function buildAnnualPlan(): SuccessPlan {
  const addDays = (n: number): string => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().split('T')[0];
  };

  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    templateName: 'Annual Account Plan',
    tasks: [
      { id: crypto.randomUUID(), title: 'Complete full product certification', completed: false, category: 'adoption', dueDate: addDays(60) },
      { id: crypto.randomUUID(), title: 'Achieve 90% seat utilization', completed: false, category: 'adoption', dueDate: addDays(120) },
      { id: crypto.randomUUID(), title: 'Advanced feature adoption drive', completed: false, category: 'adoption', dueDate: addDays(180) },
      { id: crypto.randomUUID(), title: 'Q1 Business Review', completed: false, category: 'qbr', dueDate: addDays(90) },
      { id: crypto.randomUUID(), title: 'Q2 Mid-Year Review', completed: false, category: 'qbr', dueDate: addDays(180) },
      { id: crypto.randomUUID(), title: 'Q3 Strategic Alignment', completed: false, category: 'qbr', dueDate: addDays(270) },
      { id: crypto.randomUUID(), title: 'Q4 Annual Executive Review', completed: false, category: 'qbr', dueDate: addDays(360) },
      { id: crypto.randomUUID(), title: 'Upsell discovery call', completed: false, category: 'expansion', dueDate: addDays(120) },
      { id: crypto.randomUUID(), title: 'Present expansion proposal', completed: false, category: 'expansion', dueDate: addDays(200) },
      { id: crypto.randomUUID(), title: 'Annual NPS survey', completed: false, category: 'renewal-prep', dueDate: addDays(300) },
      { id: crypto.randomUUID(), title: 'Renewal negotiation kickoff', completed: false, category: 'renewal-prep', dueDate: addDays(330) },
      { id: crypto.randomUUID(), title: 'Contract renewal signed', completed: false, category: 'renewal-prep', dueDate: addDays(355) },
    ],
  };
}

export function GraduationModal({ client, onConfirm, onDismiss }: GraduationModalProps) {
  const { generate, summary, setSummary, isLoading, error } = useGraduationSummary();
  const [step, setStep] = useState<Step>('graduation');
  const [pendingSummary, setPendingSummary] = useState('');

  useEffect(() => {
    generate(client);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConfirmGraduation = () => {
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
    });
    // Only proceed to success plan step if the client doesn't already have one
    if (!client.successPlan) {
      setPendingSummary(summary);
      setStep('success-plan');
    } else {
      onConfirm(summary);
    }
  };

  // ---- Step: Success Plan ----
  if (step === 'success-plan') {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onDismiss} />
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative glass-strong rounded-2xl shadow-2xl p-6 max-w-md w-full border border-white/30 dark:border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-3xl">🏆</div>
              <div>
                <h3 className="text-xl font-bold gradient-text">Create a Success Plan?</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Continue driving value for {client.name} post-onboarding.
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              A Success Plan helps you track adoption milestones, QBRs, expansion targets, and renewal readiness.
              Choose a template to get started, or skip and create one later.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => onConfirm(pendingSummary, buildNinetyDayPlan())}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-medium text-sm shadow-lg shadow-purple-500/25 hover:opacity-90 transition-opacity text-left"
              >
                <span className="text-xl">📋</span>
                <div>
                  <div className="font-semibold">90-Day Success Plan</div>
                  <div className="text-xs text-white/70">Check-ins, QBRs, adoption milestones &amp; renewal prep</div>
                </div>
              </button>

              <button
                onClick={() => onConfirm(pendingSummary, buildAnnualPlan())}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium text-sm shadow-lg shadow-blue-500/25 hover:opacity-90 transition-opacity text-left"
              >
                <span className="text-xl">📅</span>
                <div>
                  <div className="font-semibold">Annual Account Plan</div>
                  <div className="text-xs text-white/70">Quarterly reviews, expansion &amp; annual renewal</div>
                </div>
              </button>

              <Button
                variant="secondary"
                onClick={() => onConfirm(pendingSummary)}
              >
                Not Now — Skip
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---- Step: Graduation ----
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
            <Button onClick={handleConfirmGraduation} disabled={isLoading}>
              🎉 Confirm Graduation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
