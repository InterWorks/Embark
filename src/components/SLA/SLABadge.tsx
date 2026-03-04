import type { SLAStatusValue } from '../../types/sla';

interface SLABadgeProps {
  status: SLAStatusValue;
  compact?: boolean;
}

const CONFIG: Record<SLAStatusValue, { dot: string; label: string; bg: string; text: string }> = {
  on_track:  { dot: 'bg-emerald-500', label: 'SLA OK',       bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300' },
  warning:   { dot: 'bg-amber-500',   label: 'SLA Warning',  bg: 'bg-amber-100 dark:bg-amber-900/30',    text: 'text-amber-700 dark:text-amber-300'    },
  breached:  { dot: 'bg-red-500',     label: 'SLA Breached', bg: 'bg-red-100 dark:bg-red-900/30',        text: 'text-red-700 dark:text-red-300'        },
};

export function SLABadge({ status, compact = false }: SLABadgeProps) {
  const cfg = CONFIG[status];
  if (compact) {
    return (
      <span title={cfg.label} className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
    );
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
