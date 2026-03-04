import type { OnboardingPhase, ChecklistItem } from '../../types';

interface PhaseFilterProps {
  phases: OnboardingPhase[];
  selectedPhaseId: string | null;
  onSelect: (phaseId: string | null) => void;
  checklist?: ChecklistItem[];
}

export function PhaseFilter({ phases, selectedPhaseId, onSelect, checklist = [] }: PhaseFilterProps) {
  if (!phases || phases.length === 0) return null;

  const sorted = [...phases].sort((a, b) => a.order - b.order);

  const blockedCountForPhase = (phaseId: string) =>
    checklist.filter(item => item.phaseId === phaseId && item.isBlocked && !item.completed).length;

  return (
    <div className="flex items-center gap-1.5 flex-wrap mb-3">
      <button
        onClick={() => onSelect(null)}
        className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
          selectedPhaseId === null
            ? 'bg-gray-800 dark:bg-white text-white dark:text-gray-900 shadow-sm'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
        }`}
      >
        All Phases
      </button>
      {sorted.map((phase) => {
        const blockedCount = blockedCountForPhase(phase.id);
        return (
          <button
            key={phase.id}
            onClick={() => onSelect(phase.id)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
              selectedPhaseId === phase.id
                ? `${phase.color || 'bg-violet-500'} text-white shadow-sm`
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {phase.name}
            {blockedCount > 0 && (
              <span className={`text-[10px] font-semibold ${selectedPhaseId === phase.id ? 'text-red-200' : 'text-red-500 dark:text-red-400'}`}>
                ({blockedCount} blocked)
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
