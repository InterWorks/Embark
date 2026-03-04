import type { OnboardingPhase, ChecklistItem } from '../../types';

interface PhaseGateButtonProps {
  clientId: string;
  phase: OnboardingPhase;
  checklist: ChecklistItem[];
  onAdvance: (clientId: string, phaseId: string) => void;
}

export function PhaseGateButton({ clientId, phase, checklist, onAdvance }: PhaseGateButtonProps) {
  if (phase.completedAt) return null;

  const phaseTasks = checklist.filter(t => t.phaseId === phase.id);
  if (phaseTasks.length === 0) return null;

  const allDone = phaseTasks.every(t => t.completed);
  if (!allDone) return null;

  return (
    <button
      onClick={() => onAdvance(clientId, phase.id)}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white text-sm font-semibold shadow-lg shadow-emerald-500/25 hover:opacity-90 transition-all"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Advance Phase: {phase.name}
    </button>
  );
}
