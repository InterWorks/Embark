import type { CharacterClass, DeedDefinition, DeedId, MemberGamificationState, MemberGamificationStats } from '../types';

export const LEVEL_XP_THRESHOLDS: number[] = [
  0, 100, 250, 500, 850, 1300, 1900, 2650, 3550, 4600,
  5800, 7150, 8650, 10300, 12100, 14050, 16150, 18400, 20800, 23350,
  26050,
];

export const MAX_NAMED_LEVEL = 20;

export function getLevel(totalXP: number): number {
  let level = 1;
  for (let i = 0; i < LEVEL_XP_THRESHOLDS.length; i++) {
    if (totalXP >= LEVEL_XP_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  return level;
}

export function getXPForLevel(level: number): number {
  return LEVEL_XP_THRESHOLDS[Math.min(level - 1, LEVEL_XP_THRESHOLDS.length - 1)] ?? 0;
}

export function getXPForNextLevel(level: number): number {
  return LEVEL_XP_THRESHOLDS[Math.min(level, LEVEL_XP_THRESHOLDS.length - 1)] ?? LEVEL_XP_THRESHOLDS[LEVEL_XP_THRESHOLDS.length - 1];
}

export function getLevelProgress(totalXP: number): { level: number; currentLevelXP: number; nextLevelXP: number; progressPct: number; isMythic: boolean } {
  const level = getLevel(totalXP);
  const isMythic = level > MAX_NAMED_LEVEL;
  const currentLevelXP = getXPForLevel(level);
  const nextLevelXP = isMythic ? currentLevelXP + 5000 : getXPForNextLevel(level);
  const xpInLevel = totalXP - currentLevelXP;
  const xpNeeded = nextLevelXP - currentLevelXP;
  const progressPct = Math.min(100, Math.round((xpInLevel / xpNeeded) * 100));
  return { level, currentLevelXP, nextLevelXP, progressPct, isMythic };
}

const CLASS_TITLES: Record<CharacterClass, string[]> = {
  paladin: ['Squire', 'Squire', 'Squire', 'Knight', 'Knight', 'Knight', 'Holy Warrior', 'Holy Warrior', 'Holy Warrior', 'Crusader', 'Crusader', 'Crusader', 'Templar', 'Templar', 'Templar', 'Templar', 'Paladin Lord', 'Paladin Lord', 'Paladin Lord', 'Paladin Lord'],
  wizard:  ['Apprentice', 'Apprentice', 'Apprentice', 'Arcanist', 'Arcanist', 'Arcanist', 'Spellblade', 'Spellblade', 'Spellblade', 'Archmage', 'Archmage', 'Archmage', 'Grand Sorcerer', 'Grand Sorcerer', 'Grand Sorcerer', 'Grand Sorcerer', 'Mystic Overlord', 'Mystic Overlord', 'Mystic Overlord', 'Mystic Overlord'],
  ranger:  ['Scout', 'Scout', 'Scout', 'Tracker', 'Tracker', 'Tracker', 'Marksman', 'Marksman', 'Marksman', 'Strider', 'Strider', 'Strider', 'Warden', 'Warden', 'Warden', 'Warden', 'Ranger Lord', 'Ranger Lord', 'Ranger Lord', 'Ranger Lord'],
  rogue:   ['Cutpurse', 'Cutpurse', 'Cutpurse', 'Trickster', 'Trickster', 'Trickster', 'Shadow', 'Shadow', 'Shadow', 'Assassin', 'Assassin', 'Assassin', 'Blade Master', 'Blade Master', 'Blade Master', 'Blade Master', 'Phantom', 'Phantom', 'Phantom', 'Phantom'],
};

const MYTHIC_TITLES: Record<CharacterClass, string> = {
  paladin: 'Divine Champion',
  wizard: 'Arcane Legend',
  ranger: 'Mythic Hunter',
  rogue: 'Legend of Shadows',
};

export function getTitle(characterClass: CharacterClass | null, level: number): string {
  if (!characterClass) return `Level ${level}`;
  if (level > MAX_NAMED_LEVEL) return MYTHIC_TITLES[characterClass];
  return CLASS_TITLES[characterClass][Math.min(level - 1, 19)];
}

export function getClassIcon(characterClass: CharacterClass | null): string {
  if (!characterClass) return '⚔️';
  return { paladin: '⚔️', wizard: '🧙', ranger: '🏹', rogue: '🗡️' }[characterClass];
}

export const DEEDS: Record<DeedId, DeedDefinition> = {
  journey_begins:  { id: 'journey_begins',  name: 'The Journey Begins', icon: '🗺️', description: 'Add your first client', flavor: 'Every legend starts with a single step.', category: 'progression' },
  first_blood:     { id: 'first_blood',     name: 'First Blood',        icon: '⚔️', description: 'Complete your first task', flavor: 'The adventure has begun.', category: 'progression' },
  milestone_maker: { id: 'milestone_maker', name: 'Milestone Maker',    icon: '🧱', description: 'Complete your first milestone', flavor: 'Stone by stone, empires are built.', category: 'progression' },
  quest_complete:  { id: 'quest_complete',  name: 'Quest Complete',     icon: '🎉', description: 'Graduate your first client', flavor: 'The realm grows stronger.', category: 'progression' },
  legendary:       { id: 'legendary',       name: 'Legendary',          icon: '⭐', description: 'Reach Level 20', flavor: 'Songs are sung in your honor.', category: 'progression' },
  ascended:        { id: 'ascended',        name: 'Ascended',           icon: '🌟', description: 'Reach Mythic rank (Level 21+)', flavor: 'You have transcended mortal limits.', category: 'progression' },
  swift_justice:   { id: 'swift_justice',   name: 'Swift Justice',      icon: '⚡', description: 'Complete 10 tasks before their due date', flavor: 'They never saw you coming.', category: 'speed' },
  dead_eye:        { id: 'dead_eye',        name: 'Dead Eye',           icon: '🎯', description: 'Complete 50 tasks before their due date', flavor: 'Your precision is legendary.', category: 'speed' },
  speed_runner:    { id: 'speed_runner',    name: 'Speed Runner',       icon: '🚀', description: 'Graduate a client in under 7 days', flavor: 'Blink and they missed it.', category: 'speed' },
  triple_crown:    { id: 'triple_crown',    name: 'Triple Crown',       icon: '🏆', description: 'Graduate 3 clients in one week', flavor: 'Three quests. One week. Legendary.', category: 'speed' },
  perfectionist:   { id: 'perfectionist',   name: 'Perfectionist',      icon: '💎', description: 'Graduate a client with zero overdue tasks', flavor: 'Not a single foe left standing.', category: 'speed' },
  dungeon_crawler: { id: 'dungeon_crawler', name: 'Dungeon Crawler',    icon: '👾', description: 'Graduate a client with 20+ checklist items', flavor: 'You cleared the entire dungeon.', category: 'speed' },
  on_a_roll:       { id: 'on_a_roll',       name: 'On a Roll',          icon: '🔥', description: 'Complete 5 tasks in a single day', flavor: 'The dice are hot tonight.', category: 'volume' },
  centurion:       { id: 'centurion',       name: 'Centurion',          icon: '💯', description: 'Complete 100 tasks total', flavor: 'A hundred victories behind you.', category: 'volume' },
  war_veteran:     { id: 'war_veteran',     name: 'War Veteran',        icon: '💪', description: 'Complete 500 tasks total', flavor: 'You have seen things others cannot imagine.', category: 'volume' },
  dragon_slayer:   { id: 'dragon_slayer',   name: 'Dragon Slayer',      icon: '🐉', description: 'Graduate 10 clients total', flavor: 'The dragons fear your name.', category: 'volume' },
  guild_master:    { id: 'guild_master',    name: 'Guild Master',       icon: '👑', description: 'Have 5+ active clients at once', flavor: 'The guild hall overflows with work.', category: 'volume' },
  the_oracle:      { id: 'the_oracle',      name: 'The Oracle',         icon: '🔮', description: 'Complete 10 milestones total', flavor: 'The path ahead is always clear to you.', category: 'volume' },
  iron_will:       { id: 'iron_will',       name: 'Iron Will',          icon: '🛡️', description: 'Reach a 7-day streak', flavor: 'Seven days. Unbroken.', category: 'consistency' },
  unstoppable:     { id: 'unstoppable',     name: 'Unstoppable',        icon: '🔱', description: 'Reach a 30-day streak', flavor: 'Not even the gods could halt your progress.', category: 'consistency' },
  the_planner:     { id: 'the_planner',     name: 'The Planner',        icon: '📅', description: 'Use the Daily Planner 5 days in a row', flavor: 'Fortune favors the prepared.', category: 'consistency' },
  dawn_patrol:     { id: 'dawn_patrol',     name: 'Dawn Patrol',        icon: '🌅', description: 'Complete a task before 9am', flavor: 'The early rogue catches the gold.', category: 'consistency' },
  night_owl:       { id: 'night_owl',       name: 'Night Owl',          icon: '🌙', description: 'Complete a task after 10pm', flavor: 'The dungeon never sleeps, and neither do you.', category: 'consistency' },
  fellowship:      { id: 'fellowship',      name: 'Fellowship',         icon: '🤝', description: 'Assign tasks to 3 different teammates', flavor: 'No hero walks alone.', category: 'teamwork' },
  the_tactician:   { id: 'the_tactician',   name: 'The Tactician',      icon: '🗡️', description: 'Set up 5 automation rules', flavor: 'Let the traps do the work.', category: 'teamwork' },
  scribe:          { id: 'scribe',          name: 'Scribe',             icon: '📜', description: 'Log 20 communications or notes', flavor: 'History is written by those who show up.', category: 'teamwork' },
  town_crier:      { id: 'town_crier',      name: 'Town Crier',         icon: '📣', description: 'Log 50 communications', flavor: "Everyone knows your clients' stories.", category: 'teamwork' },
  lorekeeper:      { id: 'lorekeeper',      name: 'Lorekeeper',         icon: '📖', description: 'Fill out custom fields on 10 clients', flavor: 'Knowledge is the sharpest blade.', category: 'teamwork' },
};

export const DEFAULT_STATS: MemberGamificationStats = {
  tasksCompleted: 0,
  tasksOnTime: 0,
  clientsGraduated: 0,
  clientsGraduatedPerfect: 0,
  clientFirstActiveDates: {},
  milestonesCompleted: 0,
  communicationsLogged: 0,
  customFieldsFilled: 0,
  plannerDaysUsed: [],
  taskCompletionDatetimes: [],
  uniqueAssigneesUsed: [],
  automationRulesCreated: 0,
  peakActiveClientsCount: 0,
  weeklyClientGraduations: {},
};

export function createDefaultMember(memberId: string, displayName: string): MemberGamificationState {
  return {
    memberId,
    displayName,
    characterClass: null,
    totalXP: 0,
    weeklyXP: 0,
    weekStartDate: getWeekStart(new Date()),
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: '',
    unlockedDeeds: [],
    stats: { ...DEFAULT_STATS },
  };
}

export function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

export function getWeekKey(date: Date): string {
  return getWeekStart(date);
}

export function checkDeedConditions(
  stats: MemberGamificationStats,
  totalXP: number,
  currentStreak: number,
  unlockedDeeds: DeedId[],
  activeClientsCount: number,
): DeedId[] {
  const todayStr = new Date().toISOString().split('T')[0];

  const tasksToday = stats.taskCompletionDatetimes.filter(dt =>
    dt.startsWith(todayStr)
  ).length;

  const hasEarlyTask = stats.taskCompletionDatetimes.some(dt => {
    const h = new Date(dt).getHours();
    return h < 9;
  });
  const hasLateTask = stats.taskCompletionDatetimes.some(dt => {
    const h = new Date(dt).getHours();
    return h >= 22;
  });

  const thisWeek = getWeekKey(new Date());
  const weekGrads = stats.weeklyClientGraduations[thisWeek] ?? 0;

  const level = getLevel(totalXP);

  const candidates: DeedId[] = [];

  if (Object.keys(stats.clientFirstActiveDates).length >= 1) candidates.push('journey_begins');
  if (stats.tasksCompleted >= 1) candidates.push('first_blood');
  if (stats.milestonesCompleted >= 1) candidates.push('milestone_maker');
  if (stats.clientsGraduated >= 1) candidates.push('quest_complete');
  if (level >= 20) candidates.push('legendary');
  if (level > 20) candidates.push('ascended');

  if (stats.tasksOnTime >= 10) candidates.push('swift_justice');
  if (stats.tasksOnTime >= 50) candidates.push('dead_eye');
  if (weekGrads >= 3) candidates.push('triple_crown');
  if (stats.clientsGraduatedPerfect >= 1) candidates.push('perfectionist');

  if (tasksToday >= 5) candidates.push('on_a_roll');
  if (stats.tasksCompleted >= 100) candidates.push('centurion');
  if (stats.tasksCompleted >= 500) candidates.push('war_veteran');
  if (stats.clientsGraduated >= 10) candidates.push('dragon_slayer');
  if (activeClientsCount >= 5 || stats.peakActiveClientsCount >= 5) candidates.push('guild_master');
  if (stats.milestonesCompleted >= 10) candidates.push('the_oracle');

  if (currentStreak >= 7) candidates.push('iron_will');
  if (currentStreak >= 30) candidates.push('unstoppable');
  if (stats.plannerDaysUsed.length >= 5) candidates.push('the_planner');
  if (hasEarlyTask) candidates.push('dawn_patrol');
  if (hasLateTask) candidates.push('night_owl');

  if (stats.uniqueAssigneesUsed.length >= 3) candidates.push('fellowship');
  if (stats.automationRulesCreated >= 5) candidates.push('the_tactician');
  if (stats.communicationsLogged >= 20) candidates.push('scribe');
  if (stats.communicationsLogged >= 50) candidates.push('town_crier');
  if (stats.customFieldsFilled >= 10) candidates.push('lorekeeper');

  return candidates.filter(id => !unlockedDeeds.includes(id));
}
