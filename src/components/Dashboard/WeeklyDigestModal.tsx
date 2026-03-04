import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { DigestData } from '../../hooks/useWeeklyDigest';

function useCountUp(target: number, duration = 600): number {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const t = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 4);
      setVal(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return val;
}

interface WeeklyDigestModalProps {
  digest: DigestData;
  onClose: () => void;
}

export function WeeklyDigestModal({ digest, onClose }: WeeklyDigestModalProps) {
  const xpCount        = useCountUp(digest.weeklyXP);
  const tasksCount     = useCountUp(digest.tasksCompletedThisWeek);
  const graduatedCount = useCountUp(digest.clientsGraduatedThisWeek);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    return () => previouslyFocused?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/80" onClick={onClose} aria-hidden="true" />
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="digest-title"
          className="relative w-full max-w-md bg-white dark:bg-zinc-800 border-2 border-zinc-900 dark:border-white shadow-[8px_8px_0_0_#18181b] dark:shadow-[8px_8px_0_0_#ffffff] rounded-[4px]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b-2 border-zinc-900 dark:border-white">
            <div>
              <div className="text-violet-700 dark:text-yellow-400 text-xs font-black uppercase tracking-widest mb-0.5">Weekly Digest</div>
              <div id="digest-title" className="text-zinc-900 dark:text-white font-black text-xl">Your Quest Report</div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white rounded-[4px] hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-transparent hover:border-zinc-900 dark:hover:border-white transition-colors"
              aria-label="Close"
              autoFocus
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: '⚡', label: 'XP This Week', value: `+${xpCount}` },
                { icon: '✅', label: 'Tasks Done', value: tasksCount },
                { icon: '🏆', label: 'Graduated', value: graduatedCount },
              ].map(stat => (
                <div key={stat.label} className="bg-yellow-50 dark:bg-zinc-700 border-2 border-zinc-900 dark:border-white rounded-[4px] p-3 text-center">
                  <div className="text-2xl mb-1">{stat.icon}</div>
                  <div className="text-zinc-900 dark:text-white font-black text-lg leading-none">{stat.value}</div>
                  <div className="text-zinc-500 dark:text-zinc-400 text-[10px] mt-1 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Needs attention */}
            {digest.needsAttentionClients.length > 0 && (
              <div>
                <div className="text-violet-700 dark:text-yellow-400 text-xs uppercase tracking-widest font-black mb-2">Focus On</div>
                <div className="space-y-1.5">
                  {digest.needsAttentionClients.map((c, i) => (
                    <div key={c.name} className="flex items-center gap-2 text-sm">
                      <span className="text-zinc-500 dark:text-zinc-400 w-4 font-bold">{i + 1}.</span>
                      <span className="text-zinc-900 dark:text-white font-bold truncate">{c.name}</span>
                      <span className="text-zinc-500 dark:text-zinc-400 text-xs truncate">— {c.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming tasks */}
            {digest.upcomingTasks.length > 0 && (
              <div>
                <div className="text-violet-700 dark:text-yellow-400 text-xs uppercase tracking-widest font-black mb-2">Due This Week</div>
                <div className="space-y-1.5">
                  {digest.upcomingTasks.map((t) => (
                    <div key={`${t.clientName}-${t.taskTitle}-${t.dueDate}`} className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-zinc-900 dark:text-white font-medium truncate">{t.taskTitle}</span>
                      <span className="text-zinc-500 dark:text-zinc-400 text-xs flex-shrink-0">{t.clientName} · {t.dueDate}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Flavor text */}
            <div className="border-t-2 border-zinc-200 dark:border-zinc-600 pt-4 text-center">
              <p className="text-violet-700 dark:text-yellow-400 text-sm italic font-medium">"{digest.flavorText}"</p>
            </div>
          </div>

          <div className="px-6 pb-6">
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-yellow-400 text-zinc-900 font-black rounded-[4px] border-2 border-zinc-900 shadow-[3px_3px_0_0_#18181b] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_#18181b] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
            >
              Begin the Week
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
