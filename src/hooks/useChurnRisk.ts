import { useMemo } from 'react';
import type { HealthSnapshot } from './useHealthHistory';

export type ChurnRiskLevel = 'stable' | 'declining' | 'high-risk';

export interface ChurnRiskResult {
  level: ChurnRiskLevel;
  weeklySlope: number;      // Points per week (negative = declining)
  currentScore: number;     // Latest health score
  label: string;            // Human-readable label
  color: string;            // Tailwind color class for chip
}

export function computeChurnRisk(snapshots: HealthSnapshot[], currentScore: number): ChurnRiskResult {
  // Fewer than 2 snapshots: stable
  if (snapshots.length < 2) {
    return {
      level: 'stable',
      weeklySlope: 0,
      currentScore,
      label: 'Stable \u2713',
      color: 'bg-emerald-100 text-emerald-700',
    };
  }

  const first = snapshots[0];
  const last = snapshots[snapshots.length - 1];
  const daysBetween =
    (new Date(last.date).getTime() - new Date(first.date).getTime()) / 86_400_000;

  // Avoid division by zero
  const weeklySlope =
    daysBetween > 0 ? ((last.score - first.score) / daysBetween) * 7 : 0;

  // Absolute score threshold
  if (currentScore < 40) {
    return {
      level: 'high-risk',
      weeklySlope,
      currentScore,
      label: 'High Risk \uD83D\uDD34',
      color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
    };
  }

  // Steep decline
  if (weeklySlope < -15) {
    return {
      level: 'high-risk',
      weeklySlope,
      currentScore,
      label: 'High Risk \uD83D\uDD34',
      color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
    };
  }

  // Moderate decline
  if (weeklySlope < -5) {
    return {
      level: 'declining',
      weeklySlope,
      currentScore,
      label: 'Declining \u26A0',
      color: 'bg-yellow-100 text-yellow-700',
    };
  }

  // No clear decline and score is reasonable
  return {
    level: 'stable',
    weeklySlope,
    currentScore,
    label: 'Stable \u2713',
    color: 'bg-emerald-100 text-emerald-700',
  };
}

export function useChurnRisk(snapshots: HealthSnapshot[]): ChurnRiskResult {
  return useMemo(() => {
    const currentScore = snapshots.length > 0 ? snapshots[snapshots.length - 1].score : 50;
    return computeChurnRisk(snapshots, currentScore);
  }, [snapshots]);
}
