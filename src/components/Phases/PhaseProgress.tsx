import type { OnboardingPhase, ChecklistItem } from '../../types';

interface PhaseProgressProps {
  phases: OnboardingPhase[];
  checklist: ChecklistItem[];
}

function phasePct(phase: OnboardingPhase, checklist: ChecklistItem[]): number | null {
  const items = checklist.filter((t) => t.phaseId === phase.id);
  if (!items.length) return null;
  return Math.round((items.filter((t) => t.completed).length / items.length) * 100);
}

const PHASE_COLORS = [
  'bg-violet-500',
  'bg-blue-500',
  'bg-cyan-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
];

export function PhaseProgress({ phases, checklist }: PhaseProgressProps) {
  if (!phases || phases.length === 0) return null;

  const sorted = [...phases].sort((a, b) => a.order - b.order);
  const currentPhaseIdx = sorted.findIndex((p) => {
    const pct = phasePct(p, checklist);
    return pct !== null && pct < 100;
  });

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {sorted.map((phase, idx) => {
        const pct = phasePct(phase, checklist);
        const isDone = pct === 100;
        const isCurrent = idx === currentPhaseIdx;
        const colorClass = phase.color || PHASE_COLORS[idx % PHASE_COLORS.length];

        return (
          <div key={phase.id} className="flex items-center gap-1">
            {idx > 0 && (
              <svg className="w-3 h-3 text-gray-300 dark:text-gray-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
            <div
              title={phase.description || phase.name}
              className={`
                flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all
                ${isDone
                  ? `${colorClass} text-white opacity-80`
                  : isCurrent
                    ? `${colorClass} text-white ring-2 ring-offset-1 ring-current shadow-md`
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }
              `}
            >
              {isDone && (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
              <span>{phase.name}</span>
              {pct !== null && !isDone && (
                <span className={`${isCurrent ? 'opacity-90' : 'opacity-60'}`}>{pct}%</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
