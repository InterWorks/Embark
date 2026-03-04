import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type {
  GamificationStore, GamificationEvent, MemberGamificationState,
  CharacterClass, DeedDefinition, DeedId,
} from '../types';
import {
  getLevel, getTitle, getClassIcon, createDefaultMember,
  getWeekStart, getWeekKey, checkDeedConditions, DEEDS,
} from '../utils/gamification';

const DEFAULT_PLAYER_ID = 'default';

function makeDefaultStore(): GamificationStore {
  return {
    members: {
      [DEFAULT_PLAYER_ID]: createDefaultMember(DEFAULT_PLAYER_ID, 'You'),
    },
    currentPlayerId: DEFAULT_PLAYER_ID,
    pendingEvents: [],
  };
}

export interface AwardXPResult {
  xpGained: number;
  leveledUp: boolean;
  previousLevel: number;
  newLevel: number;
  newDeeds: DeedDefinition[];
}

export interface TrackTaskCompletedOptions {
  onTime: boolean;
  clientId?: string;
  completedAt?: string;
  assignee?: string;
}

export function useGamification() {
  const [store, setStore] = useLocalStorage<GamificationStore>('embark-gamification', makeDefaultStore());

  const getCurrentPlayerState = useCallback((): MemberGamificationState => {
    return store.members[store.currentPlayerId] ?? createDefaultMember(store.currentPlayerId, 'You');
  }, [store]);

  const getPendingEvents = useCallback((): GamificationEvent[] => {
    return store.pendingEvents;
  }, [store]);

  const dismissEvent = useCallback((eventId: string) => {
    setStore(prev => ({
      ...prev,
      pendingEvents: prev.pendingEvents.filter(e => e.id !== eventId),
    }));
  }, [setStore]);

  const selectClass = useCallback((characterClass: CharacterClass, memberId?: string) => {
    setStore(prev => {
      const id = memberId ?? prev.currentPlayerId;
      return {
        ...prev,
        members: {
          ...prev.members,
          [id]: {
            ...(prev.members[id] ?? createDefaultMember(id, 'You')),
            characterClass,
          },
        },
      };
    });
  }, [setStore]);

  const setCurrentPlayer = useCallback((memberId: string, displayName?: string) => {
    setStore(prev => ({
      ...prev,
      currentPlayerId: memberId,
      members: {
        ...prev.members,
        [memberId]: prev.members[memberId] ?? createDefaultMember(memberId, displayName ?? memberId),
      },
    }));
  }, [setStore]);

  const awardXP = useCallback((amount: number, memberId?: string): AwardXPResult => {
    let result: AwardXPResult = {
      xpGained: amount, leveledUp: false, previousLevel: 1, newLevel: 1, newDeeds: [],
    };

    setStore(prev => {
      const id = memberId ?? prev.currentPlayerId;
      const member = prev.members[id] ?? createDefaultMember(id, 'You');
      const previousLevel = getLevel(member.totalXP);
      const newTotalXP = member.totalXP + amount;
      const newLevel = getLevel(newTotalXP);
      const leveledUp = newLevel > previousLevel;

      const thisWeek = getWeekStart(new Date());
      const isNewWeek = member.weekStartDate !== thisWeek;
      const weeklyXP = isNewWeek ? amount : member.weeklyXP + amount;

      const newDeedIds = checkDeedConditions(
        member.stats, newTotalXP, member.currentStreak, member.unlockedDeeds,
        member.stats.peakActiveClientsCount
      );
      const newDeeds = newDeedIds.map(deedId => DEEDS[deedId]);

      const now = new Date().toISOString();
      const newEvents: GamificationEvent[] = [
        {
          id: crypto.randomUUID(),
          type: 'xp_gained',
          memberId: id,
          xpGained: amount,
          totalXP: newTotalXP,
          createdAt: now,
        },
      ];
      if (leveledUp) {
        newEvents.push({
          id: crypto.randomUUID(),
          type: 'level_up',
          memberId: id,
          previousLevel,
          newLevel,
          newTitle: getTitle(member.characterClass, newLevel),
          totalXP: newTotalXP,
          createdAt: now,
        });
      }
      for (const deed of newDeeds) {
        newEvents.push({
          id: crypto.randomUUID(),
          type: 'deed_unlocked',
          memberId: id,
          deed,
          createdAt: now,
        });
      }

      result = { xpGained: amount, leveledUp, previousLevel, newLevel, newDeeds };

      return {
        ...prev,
        pendingEvents: [...prev.pendingEvents, ...newEvents],
        members: {
          ...prev.members,
          [id]: {
            ...member,
            totalXP: newTotalXP,
            weeklyXP,
            weekStartDate: isNewWeek ? thisWeek : member.weekStartDate,
            unlockedDeeds: [...member.unlockedDeeds, ...newDeedIds],
          },
        },
      };
    });

    return result;
  }, [setStore]);

  const trackDailyActivity = useCallback((dateStr?: string, memberId?: string) => {
    setStore(prev => {
      const id = memberId ?? prev.currentPlayerId;
      const member = prev.members[id] ?? createDefaultMember(id, 'You');
      const today = dateStr ?? new Date().toISOString().split('T')[0];

      if (member.lastActivityDate === today) return prev;

      const yesterday = new Date(today + 'T12:00:00Z');
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const streak = member.lastActivityDate === yesterdayStr
        ? member.currentStreak + 1
        : 1;
      const longestStreak = Math.max(member.longestStreak, streak);

      const newStreakDeeds: DeedId[] = [];
      if (streak >= 7 && !member.unlockedDeeds.includes('iron_will')) newStreakDeeds.push('iron_will');
      if (streak >= 30 && !member.unlockedDeeds.includes('unstoppable')) newStreakDeeds.push('unstoppable');

      const now = new Date().toISOString();
      const deedEvents: GamificationEvent[] = newStreakDeeds.map(deedId => ({
        id: crypto.randomUUID(), type: 'deed_unlocked' as const,
        memberId: id, deed: DEEDS[deedId], createdAt: now,
      }));

      return {
        ...prev,
        pendingEvents: [...prev.pendingEvents, ...deedEvents],
        members: {
          ...prev.members,
          [id]: {
            ...member,
            lastActivityDate: today,
            currentStreak: streak,
            longestStreak,
            unlockedDeeds: [...member.unlockedDeeds, ...newStreakDeeds],
          },
        },
      };
    });
  }, [setStore]);

  const trackTaskCompleted = useCallback((opts: TrackTaskCompletedOptions, memberId?: string) => {
    setStore(prev => {
      const id = memberId ?? prev.currentPlayerId;
      const member = prev.members[id] ?? createDefaultMember(id, 'You');
      const completedAt = opts.completedAt ?? new Date().toISOString();
      const newStats = {
        ...member.stats,
        tasksCompleted: member.stats.tasksCompleted + 1,
        tasksOnTime: opts.onTime ? member.stats.tasksOnTime + 1 : member.stats.tasksOnTime,
        taskCompletionDatetimes: [...member.stats.taskCompletionDatetimes, completedAt],
        uniqueAssigneesUsed: opts.assignee && !member.stats.uniqueAssigneesUsed.includes(opts.assignee)
          ? [...member.stats.uniqueAssigneesUsed, opts.assignee]
          : member.stats.uniqueAssigneesUsed,
      };
      const newDeedIds = checkDeedConditions(
        newStats, member.totalXP, member.currentStreak, member.unlockedDeeds,
        member.stats.peakActiveClientsCount
      );
      const now = new Date().toISOString();
      const deedEvents: GamificationEvent[] = newDeedIds.map(deedId => ({
        id: crypto.randomUUID(), type: 'deed_unlocked' as const,
        memberId: id, deed: DEEDS[deedId], createdAt: now,
      }));
      return {
        ...prev,
        pendingEvents: [...prev.pendingEvents, ...deedEvents],
        members: {
          ...prev.members,
          [id]: { ...member, stats: newStats, unlockedDeeds: [...member.unlockedDeeds, ...newDeedIds] },
        },
      };
    });
  }, [setStore]);

  const trackClientAdded = useCallback((clientId: string, activeCount: number, memberId?: string) => {
    setStore(prev => {
      const id = memberId ?? prev.currentPlayerId;
      const member = prev.members[id] ?? createDefaultMember(id, 'You');
      const today = new Date().toISOString().split('T')[0];
      const newStats = {
        ...member.stats,
        clientFirstActiveDates: { ...member.stats.clientFirstActiveDates, [clientId]: today },
        peakActiveClientsCount: Math.max(member.stats.peakActiveClientsCount, activeCount),
      };
      const newDeedIds = checkDeedConditions(
        newStats, member.totalXP, member.currentStreak, member.unlockedDeeds, activeCount
      );
      const now = new Date().toISOString();
      const deedEvents: GamificationEvent[] = newDeedIds.map(deedId => ({
        id: crypto.randomUUID(), type: 'deed_unlocked' as const,
        memberId: id, deed: DEEDS[deedId], createdAt: now,
      }));
      return {
        ...prev,
        pendingEvents: [...prev.pendingEvents, ...deedEvents],
        members: {
          ...prev.members,
          [id]: { ...member, stats: newStats, unlockedDeeds: [...member.unlockedDeeds, ...newDeedIds] },
        },
      };
    });
  }, [setStore]);

  const trackClientGraduated = useCallback((
    _clientId: string,
    opts: { perfect: boolean; daysToGraduate: number; checklistSize: number; clientName: string },
    memberId?: string
  ) => {
    setStore(prev => {
      const id = memberId ?? prev.currentPlayerId;
      const member = prev.members[id] ?? createDefaultMember(id, 'You');
      const now = new Date();
      const weekKey = getWeekKey(now);
      const newWeekGrads = { ...member.stats.weeklyClientGraduations };
      newWeekGrads[weekKey] = (newWeekGrads[weekKey] ?? 0) + 1;
      const newStats = {
        ...member.stats,
        clientsGraduated: member.stats.clientsGraduated + 1,
        clientsGraduatedPerfect: opts.perfect
          ? member.stats.clientsGraduatedPerfect + 1
          : member.stats.clientsGraduatedPerfect,
        weeklyClientGraduations: newWeekGrads,
      };
      const extraDeeds: DeedId[] = [];
      if (opts.daysToGraduate < 7 && !member.unlockedDeeds.includes('speed_runner')) extraDeeds.push('speed_runner');
      if (opts.checklistSize >= 20 && !member.unlockedDeeds.includes('dungeon_crawler')) extraDeeds.push('dungeon_crawler');
      const autoDeeds = checkDeedConditions(
        newStats, member.totalXP, member.currentStreak, member.unlockedDeeds,
        member.stats.peakActiveClientsCount
      );
      const allNewDeeds = [...new Set([...autoDeeds, ...extraDeeds])].filter(d => !member.unlockedDeeds.includes(d));
      const nowIso = now.toISOString();
      const questEvent: GamificationEvent = {
        id: crypto.randomUUID(), type: 'quest_complete', memberId: id,
        clientName: opts.clientName, xpGained: 75, createdAt: nowIso,
      };
      const deedEvents: GamificationEvent[] = allNewDeeds.map(deedId => ({
        id: crypto.randomUUID(), type: 'deed_unlocked' as const,
        memberId: id, deed: DEEDS[deedId], createdAt: nowIso,
      }));
      return {
        ...prev,
        pendingEvents: [...prev.pendingEvents, questEvent, ...deedEvents],
        members: {
          ...prev.members,
          [id]: { ...member, stats: newStats, unlockedDeeds: [...member.unlockedDeeds, ...allNewDeeds] },
        },
      };
    });
  }, [setStore]);

  const trackMilestoneCompleted = useCallback((memberId?: string) => {
    setStore(prev => {
      const id = memberId ?? prev.currentPlayerId;
      const member = prev.members[id] ?? createDefaultMember(id, 'You');
      const newStats = { ...member.stats, milestonesCompleted: member.stats.milestonesCompleted + 1 };
      const newDeedIds = checkDeedConditions(newStats, member.totalXP, member.currentStreak, member.unlockedDeeds, member.stats.peakActiveClientsCount);
      const now = new Date().toISOString();
      const deedEvents: GamificationEvent[] = newDeedIds.map(deedId => ({
        id: crypto.randomUUID(), type: 'deed_unlocked' as const, memberId: id, deed: DEEDS[deedId], createdAt: now,
      }));
      return {
        ...prev,
        pendingEvents: [...prev.pendingEvents, ...deedEvents],
        members: { ...prev.members, [id]: { ...member, stats: newStats, unlockedDeeds: [...member.unlockedDeeds, ...newDeedIds] } },
      };
    });
  }, [setStore]);

  const trackCommunicationLogged = useCallback((memberId?: string) => {
    setStore(prev => {
      const id = memberId ?? prev.currentPlayerId;
      const member = prev.members[id] ?? createDefaultMember(id, 'You');
      const newStats = { ...member.stats, communicationsLogged: member.stats.communicationsLogged + 1 };
      const newDeedIds = checkDeedConditions(newStats, member.totalXP, member.currentStreak, member.unlockedDeeds, member.stats.peakActiveClientsCount);
      const now = new Date().toISOString();
      const deedEvents: GamificationEvent[] = newDeedIds.map(deedId => ({
        id: crypto.randomUUID(), type: 'deed_unlocked' as const, memberId: id, deed: DEEDS[deedId], createdAt: now,
      }));
      return {
        ...prev,
        pendingEvents: [...prev.pendingEvents, ...deedEvents],
        members: { ...prev.members, [id]: { ...member, stats: newStats, unlockedDeeds: [...member.unlockedDeeds, ...newDeedIds] } },
      };
    });
  }, [setStore]);

  const trackCustomFieldFilled = useCallback((memberId?: string) => {
    setStore(prev => {
      const id = memberId ?? prev.currentPlayerId;
      const member = prev.members[id] ?? createDefaultMember(id, 'You');
      const newStats = { ...member.stats, customFieldsFilled: member.stats.customFieldsFilled + 1 };
      const newDeedIds = checkDeedConditions(newStats, member.totalXP, member.currentStreak, member.unlockedDeeds, member.stats.peakActiveClientsCount);
      const now = new Date().toISOString();
      const deedEvents: GamificationEvent[] = newDeedIds.map(deedId => ({
        id: crypto.randomUUID(), type: 'deed_unlocked' as const, memberId: id, deed: DEEDS[deedId], createdAt: now,
      }));
      return {
        ...prev,
        pendingEvents: [...prev.pendingEvents, ...deedEvents],
        members: { ...prev.members, [id]: { ...member, stats: newStats, unlockedDeeds: [...member.unlockedDeeds, ...newDeedIds] } },
      };
    });
  }, [setStore]);

  const trackAutomationCreated = useCallback((memberId?: string) => {
    setStore(prev => {
      const id = memberId ?? prev.currentPlayerId;
      const member = prev.members[id] ?? createDefaultMember(id, 'You');
      const newStats = { ...member.stats, automationRulesCreated: member.stats.automationRulesCreated + 1 };
      const newDeedIds = checkDeedConditions(newStats, member.totalXP, member.currentStreak, member.unlockedDeeds, member.stats.peakActiveClientsCount);
      const now = new Date().toISOString();
      const deedEvents: GamificationEvent[] = newDeedIds.map(deedId => ({
        id: crypto.randomUUID(), type: 'deed_unlocked' as const, memberId: id, deed: DEEDS[deedId], createdAt: now,
      }));
      return {
        ...prev,
        pendingEvents: [...prev.pendingEvents, ...deedEvents],
        members: { ...prev.members, [id]: { ...member, stats: newStats, unlockedDeeds: [...member.unlockedDeeds, ...newDeedIds] } },
      };
    });
  }, [setStore]);

  const trackPlannerDay = useCallback((dateStr?: string, memberId?: string) => {
    setStore(prev => {
      const id = memberId ?? prev.currentPlayerId;
      const member = prev.members[id] ?? createDefaultMember(id, 'You');
      const today = dateStr ?? new Date().toISOString().split('T')[0];
      if (member.stats.plannerDaysUsed.includes(today)) return prev;

      const newPlannerDays = [...member.stats.plannerDaysUsed, today];

      // Check 5 consecutive planner days
      const sorted = [...newPlannerDays].sort();
      let consecutive = 1;
      let maxConsecutive = 1;
      for (let i = 1; i < sorted.length; i++) {
        const prev_date = new Date(sorted[i - 1] + 'T12:00:00Z');
        const curr_date = new Date(sorted[i] + 'T12:00:00Z');
        const diffDays = Math.round((curr_date.getTime() - prev_date.getTime()) / 86400000);
        if (diffDays === 1) {
          consecutive++;
          maxConsecutive = Math.max(maxConsecutive, consecutive);
        } else {
          consecutive = 1;
        }
      }

      const newPlannerDeeds: DeedId[] = [];
      if (maxConsecutive >= 5 && !member.unlockedDeeds.includes('the_planner')) {
        newPlannerDeeds.push('the_planner');
      }

      const newStats = { ...member.stats, plannerDaysUsed: newPlannerDays };
      const now = new Date().toISOString();
      const deedEvents: GamificationEvent[] = newPlannerDeeds.map(deedId => ({
        id: crypto.randomUUID(), type: 'deed_unlocked' as const, memberId: id, deed: DEEDS[deedId], createdAt: now,
      }));

      return {
        ...prev,
        pendingEvents: [...prev.pendingEvents, ...deedEvents],
        members: {
          ...prev.members,
          [id]: { ...member, stats: newStats, unlockedDeeds: [...member.unlockedDeeds, ...newPlannerDeeds] },
        },
      };
    });
  }, [setStore]);

  const allMembers = useMemo(() => Object.values(store.members), [store.members]);

  return {
    getCurrentPlayerState,
    getPendingEvents,
    dismissEvent,
    selectClass,
    setCurrentPlayer,
    awardXP,
    trackDailyActivity,
    trackTaskCompleted,
    trackClientAdded,
    trackClientGraduated,
    trackMilestoneCompleted,
    trackCommunicationLogged,
    trackCustomFieldFilled,
    trackAutomationCreated,
    trackPlannerDay,
    allMembers,
    currentPlayerId: store.currentPlayerId,
    getLevel,
    getTitle,
    getClassIcon,
  };
}
