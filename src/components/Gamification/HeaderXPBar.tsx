import { useGamificationContext } from '../../context/GamificationContext';
import { getLevelProgress, getClassIcon, getTitle } from '../../utils/gamification';

interface HeaderXPBarProps {
  onOpenCharacterSheet: () => void;
}

export function HeaderXPBar({ onOpenCharacterSheet }: HeaderXPBarProps) {
  const { getCurrentPlayerState } = useGamificationContext();
  const player = getCurrentPlayerState();
  const { level, progressPct, isMythic } = getLevelProgress(player.totalXP);
  const title = getTitle(player.characterClass, level);
  const classIcon = getClassIcon(player.characterClass);

  return (
    <button
      onClick={onOpenCharacterSheet}
      className="flex items-center gap-2 px-2 py-1 rounded-[4px] hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-transparent hover:border-zinc-900 dark:hover:border-white transition-all"
      aria-label="Open character sheet"
      title={`${classIcon} ${title} — Level ${level}`}
    >
      <div className="relative flex-shrink-0">
        <div className="w-8 h-8 rounded-[4px] bg-violet-700 flex items-center justify-center text-base border border-zinc-900 dark:border-white">
          {classIcon}
        </div>
        <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-zinc-900 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center leading-none border border-zinc-900">
          {isMythic ? '✦' : level}
        </div>
      </div>
      <div className="hidden sm:flex flex-col items-start min-w-0">
        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200 leading-none truncate max-w-[80px]">
          {title}
        </span>
        <div className="mt-1 w-20 h-1.5 bg-zinc-200 dark:bg-zinc-600 rounded-[2px] overflow-hidden border border-zinc-300 dark:border-zinc-500">
          <div
            className="h-full bg-yellow-400 progress-bar"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>
    </button>
  );
}
