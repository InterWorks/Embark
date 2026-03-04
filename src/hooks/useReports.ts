import { useMemo } from 'react';
import type { Client, Priority } from '../types';
import { getClientHealth } from '../utils/clientHealth';
import type { HealthStatus } from '../utils/clientHealth';

export interface VelocityEntry {
  clientName: string;
  days: number;
}

export interface TrendEntry {
  date: string; // 'YYYY-MM-DD'
  count: number;
}

export interface ProgressEntry {
  id: string;
  name: string;
  healthStatus: HealthStatus | null;
  pctDone: number;
  daysActive: number;
  priority: Priority;
  assignedTo: string;
}

export interface TeamEntry {
  member: string;
  completed: number;
  overdue: number;
}

export interface BottleneckEntry {
  title: string;
  avgDays: number;
  count: number;
}

export interface VelocityTrendEntry {
  month: string; // 'YYYY-MM'
  avgDays: number;
  count: number;
}

export interface PhaseDurationEntry {
  phaseName: string;
  avgDays: number;
  count: number;
}

export interface ReportData {
  velocity: VelocityEntry[];
  avgVelocity: number;
  completionTrend: TrendEntry[];
  clientProgress: ProgressEntry[];
  teamPerformance: TeamEntry[];
  bottlenecks: BottleneckEntry[];
  velocityTrend: VelocityTrendEntry[];
  phaseDurations: PhaseDurationEntry[];
}

export function useReports(clients: Client[], trendDays: 7 | 30 | 90 = 30): ReportData {
  return useMemo(() => {
    const now = new Date();

    // 1. Onboarding Velocity — completed clients only
    const velocity: VelocityEntry[] = clients
      .filter((c) => !c.archived && c.status === 'completed' && c.checklist.length > 0)
      .map((c) => {
        const lastCompleted = c.checklist
          .filter((t) => t.completed && t.dueDate)
          .map((t) => new Date(t.dueDate!).getTime())
          .sort((a, b) => b - a)[0];
        const end = lastCompleted ?? now.getTime();
        const start = new Date(c.createdAt).getTime();
        const days = Math.max(0, Math.round((end - start) / 86400000));
        return { clientName: c.name, days };
      });

    const avgVelocity =
      velocity.length > 0
        ? Math.round(velocity.reduce((sum, v) => sum + v.days, 0) / velocity.length)
        : 0;

    // 2. Completion Trend — tasks completed per day from activityLog
    const cutoff = new Date(now.getTime() - trendDays * 86400000);
    const countByDate: Record<string, number> = {};
    clients.forEach((c) => {
      (c.activityLog ?? [])
        .filter((e) => e.type === 'task_completed' && new Date(e.timestamp) >= cutoff)
        .forEach((e) => {
          const date = e.timestamp.slice(0, 10);
          countByDate[date] = (countByDate[date] ?? 0) + 1;
        });
    });
    const completionTrend: TrendEntry[] = Object.entries(countByDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 3. Client Progress Table — active clients
    const clientProgress: ProgressEntry[] = clients
      .filter((c) => !c.archived && c.status === 'active')
      .map((c) => {
        const total = c.checklist.length;
        const done = c.checklist.filter((t) => t.completed).length;
        const daysActive = Math.round(
          (now.getTime() - new Date(c.createdAt).getTime()) / 86400000
        );
        const health = getClientHealth(c);
        return {
          id: c.id,
          name: c.name,
          healthStatus: health?.status ?? null,
          pctDone: total > 0 ? Math.round((done / total) * 100) : 0,
          daysActive,
          priority: c.priority,
          assignedTo: c.assignedTo,
        };
      });

    // 4. Team Performance — last 30 days
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
    const memberMap: Record<string, { completed: number; overdue: number }> = {};

    clients.forEach((c) => {
      const member = c.assignedTo || 'Unassigned';
      if (!memberMap[member]) memberMap[member] = { completed: 0, overdue: 0 };

      (c.activityLog ?? [])
        .filter((e) => e.type === 'task_completed' && new Date(e.timestamp) >= thirtyDaysAgo)
        .forEach(() => {
          memberMap[member].completed += 1;
        });

      c.checklist
        .filter((t) => !t.completed && t.dueDate && new Date(t.dueDate) < now)
        .forEach(() => {
          memberMap[member].overdue += 1;
        });
    });

    const teamPerformance: TeamEntry[] = Object.entries(memberMap)
      .map(([member, stats]) => ({ member, ...stats }))
      .sort((a, b) => b.completed - a.completed);

    // 5. Bottleneck Heatmap — avg days from task_added to task_completed by task title
    const taskTimings: Record<string, number[]> = {};
    clients.forEach(c => {
      const log = c.activityLog ?? [];
      const addedMap: Record<string, number> = {};
      log.forEach(e => {
        if (e.type === 'task_added' && e.description) {
          const match = e.description.match(/added task[:\s]+(.+)/i);
          if (match) addedMap[match[1].trim()] = new Date(e.timestamp).getTime();
        }
        if (e.type === 'task_completed' && e.description) {
          const match = e.description.match(/(?:completed|finished)[:\s]+(.+)/i);
          const title = match?.[1]?.trim();
          if (title && addedMap[title]) {
            const days = (new Date(e.timestamp).getTime() - addedMap[title]) / 86400000;
            if (!taskTimings[title]) taskTimings[title] = [];
            taskTimings[title].push(days);
          }
        }
      });
    });
    const bottlenecks: BottleneckEntry[] = Object.entries(taskTimings)
      .map(([title, days]) => ({ title, avgDays: Math.round(days.reduce((s, d) => s + d, 0) / days.length), count: days.length }))
      .filter(b => b.count > 0)
      .sort((a, b) => b.avgDays - a.avgDays)
      .slice(0, 10);

    // 6. Onboarding Velocity Trend — completed clients grouped by month
    const monthMap: Record<string, number[]> = {};
    clients
      .filter(c => c.status === 'completed' && c.checklist.length > 0)
      .forEach(c => {
        const logEntries = (c.activityLog ?? []).filter(e => e.type === 'task_completed');
        if (logEntries.length === 0) return;
        const lastCompleted = logEntries[logEntries.length - 1];
        const month = lastCompleted.timestamp.slice(0, 7);
        const days = Math.max(0, Math.round(
          (new Date(lastCompleted.timestamp).getTime() - new Date(c.createdAt).getTime()) / 86400000
        ));
        if (!monthMap[month]) monthMap[month] = [];
        monthMap[month].push(days);
      });
    const velocityTrend: VelocityTrendEntry[] = Object.entries(monthMap)
      .map(([month, days]) => ({ month, avgDays: Math.round(days.reduce((s, d) => s + d, 0) / days.length), count: days.length }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // 7. Phase Duration Breakdown — avg days per phase from phase first task to phase_advanced log
    const phaseMap: Record<string, number[]> = {};
    clients.forEach(c => {
      const phases = c.phases ?? [];
      const log = c.activityLog ?? [];
      phases.forEach(phase => {
        if (!phase.completedAt) return;
        const phaseTasks = c.checklist.filter(t => t.phaseId === phase.id);
        if (phaseTasks.length === 0) return;
        const startEntry = log.find(e => e.type === 'task_added' && phaseTasks.some(t => e.description?.includes(t.title)));
        const endMs = new Date(phase.completedAt).getTime();
        const startMs = startEntry ? new Date(startEntry.timestamp).getTime() : new Date(c.createdAt).getTime();
        const days = Math.max(0, Math.round((endMs - startMs) / 86400000));
        if (!phaseMap[phase.name]) phaseMap[phase.name] = [];
        phaseMap[phase.name].push(days);
      });
    });
    const phaseDurations: PhaseDurationEntry[] = Object.entries(phaseMap)
      .map(([phaseName, days]) => ({ phaseName, avgDays: Math.round(days.reduce((s, d) => s + d, 0) / days.length), count: days.length }))
      .sort((a, b) => b.avgDays - a.avgDays);

    return { velocity, avgVelocity, completionTrend, clientProgress, teamPerformance, bottlenecks, velocityTrend, phaseDurations };
  }, [clients, trendDays]);
}
