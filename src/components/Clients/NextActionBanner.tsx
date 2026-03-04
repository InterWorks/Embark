import type { NextAction } from '../../utils/nextAction';

interface NextActionBannerProps {
  action: NextAction;
  onClick?: () => void;
}

const TYPE_STYLES: Record<NextAction['type'], string> = {
  overdue:  'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
  blocked:  'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800',
  due_soon: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
  sla:      'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  no_comm:  'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
};

const TYPE_ICONS: Record<NextAction['type'], string> = {
  overdue:  '⚠',
  blocked:  '🚧',
  due_soon: '📅',
  sla:      '⏱',
  no_comm:  '💬',
};

export function NextActionBanner({ action, onClick }: NextActionBannerProps) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      className={`flex items-center gap-1.5 w-full px-3 py-1.5 rounded-lg border text-xs font-medium transition-opacity hover:opacity-80 text-left ${TYPE_STYLES[action.type]}`}
      title="Next recommended action"
    >
      <span>{TYPE_ICONS[action.type]}</span>
      <span className="truncate">{action.label}</span>
    </button>
  );
}
