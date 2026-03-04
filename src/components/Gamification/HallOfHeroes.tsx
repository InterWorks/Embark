import { useGamificationContext } from '../../context/GamificationContext';
import { getLevelProgress, getTitle, getClassIcon, DEEDS } from '../../utils/gamification';

export function HallOfHeroes() {
  const { allMembers, currentPlayerId } = useGamificationContext();
  const sorted = [...allMembers].sort((a, b) => b.totalXP - a.totalXP);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-zinc-900 dark:text-white">Hall of Heroes</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">The legends of Embark, ranked by glory earned.</p>
      </div>

      {sorted.length === 0 && (
        <div className="text-center py-16 text-zinc-400">
          <div className="text-5xl mb-3">🏰</div>
          <div className="font-black">No heroes yet</div>
          <div className="text-sm">Complete tasks to begin your legend.</div>
        </div>
      )}

      <div className="space-y-3">
        {sorted.map((member, index) => {
          const { level, progressPct, isMythic } = getLevelProgress(member.totalXP);
          const title = getTitle(member.characterClass, level);
          const icon = getClassIcon(member.characterClass);
          const isYou = member.memberId === currentPlayerId;
          const recentDeeds = member.unlockedDeeds.slice(-5).reverse();
          const rank = index + 1;
          const rankEmoji = rank === 1 ? '👑' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

          return (
            <div
              key={member.memberId}
              className={`
                flex items-center gap-4 p-4 rounded-[4px] border-2 transition-all
                ${isYou
                  ? 'border-yellow-400 bg-violet-700/10 dark:bg-violet-700/20'
                  : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800'}
              `}
            >
              <div className="w-8 text-center text-lg font-black text-zinc-500 dark:text-zinc-400 flex-shrink-0">
                {rankEmoji}
              </div>
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-[4px] bg-violet-700 flex items-center justify-center text-2xl border-2 border-zinc-900 dark:border-white">
                  {icon}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-zinc-900 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border border-zinc-900">
                  {level > 20 ? '✦' : level}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-900 dark:text-white font-black truncate">{member.displayName}</span>
                  {isYou && <span className="text-[10px] bg-violet-700 text-white px-1.5 py-0.5 rounded-[4px] font-black">You</span>}
                </div>
                <div className="text-zinc-500 dark:text-zinc-400 text-xs font-medium">{title}{isMythic ? ' (Mythic)' : ''}</div>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-[2px] overflow-hidden max-w-[120px] border border-zinc-300 dark:border-zinc-600">
                    <div
                      className="h-full bg-yellow-400"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <span className="text-zinc-500 dark:text-zinc-400 text-xs font-medium">{member.totalXP.toLocaleString()} XP</span>
                </div>
              </div>
              <div className="hidden sm:block text-center flex-shrink-0">
                <div className="text-yellow-500 dark:text-yellow-400 font-black text-lg">{member.weeklyXP}</div>
                <div className="text-zinc-500 dark:text-zinc-400 text-xs font-medium">XP this week</div>
              </div>
              <div className="hidden md:flex items-center gap-1 flex-shrink-0">
                {recentDeeds.length === 0 && (
                  <span className="text-zinc-500 text-xs italic">No deeds yet</span>
                )}
                {recentDeeds.map(deedId => (
                  <span key={deedId} title={DEEDS[deedId]?.name} className="text-lg">
                    {DEEDS[deedId]?.icon}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
