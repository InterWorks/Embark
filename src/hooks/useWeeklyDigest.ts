import { useMemo } from 'react';
import type { Client } from '../types';
import { getClientHealth } from '../utils/clientHealth';

export interface DigestData {
  weeklyXP: number;
  tasksCompletedThisWeek: number;
  clientsGraduatedThisWeek: number;
  needsAttentionClients: { name: string; reason: string }[];
  upcomingTasks: { clientName: string; taskTitle: string; dueDate: string }[];
  flavorText: string;
}

const FLAVOR_LINES = [
  'The guild awaits your return, adventurer.',
  'New quests await. Steel your resolve.',
  'The dungeon does not rest. Neither should you.',
  'Another week, another chance at glory.',
  'Your legend grows with every completed quest.',
];

function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return toLocalDateStr(d);
}

export function useWeeklyDigest(clients: Client[], weeklyXP: number): DigestData {
  return useMemo(() => {
    const now = new Date();
    const weekStartStr = getWeekStart(now);
    const weekEndDate = new Date(now);
    const dayOfWeek = now.getDay();
    const daysToSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    weekEndDate.setDate(now.getDate() + daysToSunday);
    const weekEndStr = toLocalDateStr(weekEndDate);

    // Tasks completed and clients graduated this week
    let tasksCompletedThisWeek = 0;
    let clientsGraduatedThisWeek = 0;

    for (const client of clients) {
      if (client.archived) continue;
      for (const entry of (client.activityLog ?? [])) {
        const entryDate = entry.timestamp?.split('T')[0] ?? '';
        if (entryDate >= weekStartStr && entryDate <= weekEndStr) {
          if (entry.type === 'task_completed') tasksCompletedThisWeek++;
          if (entry.type === 'status_changed' && entry.description?.toLowerCase().includes('completed')) {
            clientsGraduatedThisWeek++;
          }
        }
      }
    }

    // Clients needing attention
    const needsAttentionClients = clients
      .filter(c => !c.archived)
      .map(c => ({ name: c.name, health: getClientHealth(c) }))
      .filter(({ health }) => health && (health.status === 'needs-attention' || health.status === 'stalled'))
      .slice(0, 3)
      .map(({ name, health }) => ({ name, reason: health!.reason }));

    // Upcoming tasks this week
    const upcomingTasks: DigestData['upcomingTasks'] = [];
    for (const client of clients) {
      if (client.archived || client.status !== 'active') continue;
      for (const item of client.checklist) {
        if (!item.completed && item.dueDate) {
          const due = item.dueDate.split('T')[0];
          if (due >= weekStartStr && due <= weekEndStr) {
            upcomingTasks.push({ clientName: client.name, taskTitle: item.title, dueDate: due });
          }
        }
      }
    }
    upcomingTasks.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    // Stable flavor text seeded from week start date (changes weekly, stable within a week)
    const weekSeed = weekStartStr.split('-').reduce((acc, n) => acc + parseInt(n), 0);
    const flavorText = FLAVOR_LINES[weekSeed % FLAVOR_LINES.length];

    return {
      weeklyXP,
      tasksCompletedThisWeek,
      clientsGraduatedThisWeek,
      needsAttentionClients,
      upcomingTasks: upcomingTasks.slice(0, 5),
      flavorText,
    };
  }, [clients, weeklyXP]);
}
