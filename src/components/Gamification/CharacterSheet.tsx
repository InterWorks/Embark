import { createPortal } from 'react-dom';
import { useGamificationContext } from '../../context/GamificationContext';
import { getLevelProgress, getTitle, getClassIcon, DEEDS } from '../../utils/gamification';
import type { CharacterClass, DeedId } from '../../types';

const CLASSES: { id: CharacterClass; label: string; icon: string; tagline: string }[] = [
  { id: 'paladin',  label: 'Paladin',  icon: '⚔️', tagline: 'Protector of the realm' },
  { id: 'wizard',   label: 'Wizard',   icon: '🧙', tagline: 'Master of knowledge' },
  { id: 'ranger',   label: 'Ranger',   icon: '🏹', tagline: 'Swift and efficient' },
  { id: 'rogue',    label: 'Rogue',    icon: '🗡️', tagline: 'Quick and cunning' },
];

interface CharacterSheetProps {
  onClose: () => void;
}

export function CharacterSheet({ onClose }: CharacterSheetProps) {
  const { getCurrentPlayerState, selectClass } = useGamificationContext();
  const player = getCurrentPlayerState();
  const { level, progressPct, isMythic, currentLevelXP, nextLevelXP } = getLevelProgress(player.totalXP);
  const title = getTitle(player.characterClass, level);
  const icon = getClassIcon(player.characterClass);

  const allDeedIds = Object.keys(DEEDS) as DeedId[];
  const categories = ['progression', 'speed', 'volume', 'consistency', 'teamwork'] as const;

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/80" onClick={onClose} aria-hidden="true" />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl bg-zinc-900 border-2 border-yellow-400 shadow-[8px_8px_0_0_#facc15] rounded-[4px]">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b-2 border-yellow-400">
            <div className="flex items-center gap-3">
              <div className="text-4xl">{icon}</div>
              <div>
                <div className="text-white font-black text-xl">{title}</div>
                <div className="text-yellow-400 text-sm font-bold">Level {level}{isMythic ? ' (Mythic)' : ''} · {player.totalXP.toLocaleString()} XP</div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-[4px] hover:bg-zinc-800 border border-transparent hover:border-zinc-600 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* XP Bar */}
            <div>
              <div className="flex justify-between text-xs text-zinc-400 font-bold mb-1">
                <span>{currentLevelXP.toLocaleString()} XP</span>
                <span>{nextLevelXP.toLocaleString()} XP</span>
              </div>
              <div className="h-3 bg-zinc-700 rounded-[2px] overflow-hidden border border-zinc-600">
                <div
                  className="h-full bg-yellow-400 transition-all duration-700"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Class picker */}
            {!player.characterClass ? (
              <div>
                <div className="text-yellow-400 text-xs uppercase tracking-widest font-black mb-3">Choose Your Class</div>
                <div className="grid grid-cols-2 gap-3">
                  {CLASSES.map(cls => (
                    <button
                      key={cls.id}
                      onClick={() => selectClass(cls.id)}
                      className="flex items-center gap-3 p-3 rounded-[4px] border-2 border-zinc-700 hover:border-yellow-400 hover:bg-zinc-800 transition-all text-left"
                    >
                      <span className="text-2xl">{cls.icon}</span>
                      <div>
                        <div className="text-white font-black text-sm">{cls.label}</div>
                        <div className="text-zinc-400 text-xs">{cls.tagline}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div className="text-yellow-400 text-xs uppercase tracking-widest font-black mb-3">Class</div>
                <div className="flex items-center gap-3 flex-wrap">
                  {CLASSES.map(cls => (
                    <button
                      key={cls.id}
                      onClick={() => selectClass(cls.id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-[4px] border-2 text-sm font-bold transition-all ${
                        player.characterClass === cls.id
                          ? 'border-yellow-400 bg-yellow-400 text-zinc-900'
                          : 'border-zinc-600 text-zinc-400 hover:border-zinc-400 hover:text-white'
                      }`}
                    >
                      <span>{cls.icon}</span>
                      <span>{cls.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Stats */}
            <div>
              <div className="text-yellow-400 text-xs uppercase tracking-widest font-black mb-3">Legend</div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Tasks Done', value: player.stats.tasksCompleted },
                  { label: 'Clients Won', value: player.stats.clientsGraduated },
                  { label: 'Milestones', value: player.stats.milestonesCompleted },
                  { label: 'Best Streak', value: `${player.longestStreak}d` },
                  { label: 'Current Streak', value: `${player.currentStreak}d` },
                  { label: 'Deeds Earned', value: `${player.unlockedDeeds.length}/28` },
                ].map(stat => (
                  <div key={stat.label} className="bg-zinc-800 border-2 border-zinc-700 rounded-[4px] p-3 text-center">
                    <div className="text-white font-black text-xl">{stat.value}</div>
                    <div className="text-zinc-400 text-xs mt-0.5 font-medium">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Deeds */}
            {categories.map(cat => {
              const catDeeds = allDeedIds.filter(id => DEEDS[id].category === cat);
              return (
                <div key={cat}>
                  <div className="text-yellow-400 text-xs uppercase tracking-widest font-black mb-2 capitalize">{cat} Deeds</div>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {catDeeds.map(deedId => {
                      const deed = DEEDS[deedId];
                      const unlocked = player.unlockedDeeds.includes(deedId);
                      return (
                        <div
                          key={deedId}
                          title={unlocked ? `${deed.name}: ${deed.description}` : `??? — ${deed.description}`}
                          className={`flex flex-col items-center gap-1 p-2 rounded-[4px] border-2 text-center transition-all ${
                            unlocked
                              ? 'border-yellow-400 bg-yellow-400/10'
                              : 'border-zinc-700 bg-zinc-800 opacity-40 grayscale'
                          }`}
                        >
                          <span className="text-xl">{unlocked ? deed.icon : '❓'}</span>
                          <span className={`text-[9px] leading-tight font-bold ${unlocked ? 'text-yellow-300' : 'text-zinc-500'}`}>
                            {unlocked ? deed.name : '???'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
