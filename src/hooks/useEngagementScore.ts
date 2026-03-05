import { useMemo } from 'react';
import type { Client } from '../types';
import { computeEngagementScore, type EngagementBreakdown } from '../utils/engagementScore';

export function useEngagementScore(client: Client): EngagementBreakdown {
  return useMemo(() => computeEngagementScore(client), [client]);
}
