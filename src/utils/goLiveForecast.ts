import type { Client } from '../types';

export interface GoLiveForecast {
  predictedDate: string | null;  // ISO date YYYY-MM-DD
  daysFromToday: number | null;
  daysVsTarget: number | null;   // negative = ahead, positive = behind
  status: 'on-track' | 'at-risk' | 'late' | 'no-data';
  velocityPerDay: number;        // avg tasks completed per day
}

export function computeGoLiveForecast(client: Client): GoLiveForecast {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();

  const windowStart = todayMs - 14 * 86_400_000;

  // Count task_completed entries in the last 14 days
  const recentCompletions = (client.activityLog ?? []).filter(
    (entry) =>
      entry.type === 'task_completed' &&
      new Date(entry.timestamp).getTime() >= windowStart
  ).length;

  const velocityPerDay = recentCompletions / 14;

  const remainingTasks = client.checklist.filter((t) => !t.completed).length;

  // No velocity and there are remaining tasks — cannot predict
  if (velocityPerDay === 0 && remainingTasks > 0) {
    return {
      predictedDate: null,
      daysFromToday: null,
      daysVsTarget: null,
      status: 'no-data',
      velocityPerDay: 0,
    };
  }

  // All tasks done or no tasks — predict today
  const daysToComplete =
    velocityPerDay > 0 ? Math.ceil(remainingTasks / velocityPerDay) : 0;

  const predictedMs = todayMs + daysToComplete * 86_400_000;
  const predictedDate = new Date(predictedMs).toISOString().split('T')[0];
  const daysFromToday = daysToComplete;

  let daysVsTarget: number | null = null;
  let status: GoLiveForecast['status'] = 'on-track';

  if (client.targetGoLiveDate) {
    const targetMs = new Date(client.targetGoLiveDate).getTime();
    // positive = late (predicted after target), negative = ahead
    daysVsTarget = Math.ceil((predictedMs - targetMs) / 86_400_000);

    if (daysVsTarget <= 0) {
      status = 'on-track';
    } else if (daysVsTarget <= 14) {
      status = 'at-risk';
    } else {
      status = 'late';
    }
  }

  return {
    predictedDate,
    daysFromToday,
    daysVsTarget,
    status,
    velocityPerDay,
  };
}
