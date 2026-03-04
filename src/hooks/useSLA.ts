import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { generateId } from '../utils/helpers';
import type { SLADefinition, ClientSLAStatus, SLAStatusValue } from '../types/sla';
import type { Client } from '../types';

export function useSLA() {
  const [definitions, setDefinitions] = useLocalStorage<SLADefinition[]>('embark-sla-definitions', []);

  const addDefinition = useCallback((data: Omit<SLADefinition, 'id' | 'createdAt'>): SLADefinition => {
    const def: SLADefinition = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setDefinitions(prev => [...prev, def]);
    return def;
  }, [setDefinitions]);

  const updateDefinition = useCallback((id: string, updates: Partial<Omit<SLADefinition, 'id' | 'createdAt'>>) => {
    setDefinitions(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  }, [setDefinitions]);

  const deleteDefinition = useCallback((id: string) => {
    setDefinitions(prev => prev.filter(d => d.id !== id));
  }, [setDefinitions]);

  const toggleDefinition = useCallback((id: string) => {
    setDefinitions(prev => prev.map(d => d.id === id ? { ...d, enabled: !d.enabled } : d));
  }, [setDefinitions]);

  const computeStatuses = useCallback((clients: Client[]): ClientSLAStatus[] => {
    const now = new Date();
    const statuses: ClientSLAStatus[] = [];

    for (const def of definitions) {
      if (!def.enabled) continue;

      for (const client of clients) {
        if (client.archived || client.status === 'completed') continue;

        const daysUsed = Math.floor(
          (now.getTime() - new Date(client.createdAt).getTime()) / 86400000
        );

        let relevantDaysUsed = daysUsed;

        if (def.slaType === 'communication_frequency') {
          const log = client.communicationLog ?? [];
          const lastEntry = log[log.length - 1];
          relevantDaysUsed = lastEntry
            ? Math.floor((now.getTime() - new Date(lastEntry.timestamp).getTime()) / 86400000)
            : daysUsed;
        }

        if (def.slaType === 'first_response') {
          const hasAnyTask = client.checklist.some(t => t.completed);
          if (hasAnyTask) continue; // already responded
          relevantDaysUsed = daysUsed;
        }

        if (def.slaType === 'task_completion') {
          // One status per uncompleted task that's overdue
          const pendingTasks = client.checklist.filter(t => !t.completed);
          for (const task of pendingTasks) {
            const taskDaysUsed = task.dueDate
              ? Math.max(0, Math.floor((now.getTime() - new Date(task.dueDate).getTime()) / 86400000))
              : daysUsed;
            const percentUsed = Math.min(taskDaysUsed / def.targetDays, 2);
            const daysOverdue = Math.max(0, taskDaysUsed - def.targetDays);
            let status: SLAStatusValue = 'on_track';
            if (percentUsed >= 1) status = 'breached';
            else if (percentUsed >= def.warningThreshold) status = 'warning';

            statuses.push({
              clientId: client.id,
              slaId: def.id,
              slaName: def.name,
              slaType: def.slaType,
              status,
              percentUsed,
              daysUsed: taskDaysUsed,
              targetDays: def.targetDays,
              daysOverdue,
            });
          }
          continue;
        }

        const percentUsed = Math.min(relevantDaysUsed / def.targetDays, 2);
        const daysOverdue = Math.max(0, relevantDaysUsed - def.targetDays);
        let status: SLAStatusValue = 'on_track';
        if (percentUsed >= 1) status = 'breached';
        else if (percentUsed >= def.warningThreshold) status = 'warning';

        statuses.push({
          clientId: client.id,
          slaId: def.id,
          slaName: def.name,
          slaType: def.slaType,
          status,
          percentUsed,
          daysUsed: relevantDaysUsed,
          targetDays: def.targetDays,
          daysOverdue,
        });
      }
    }

    return statuses;
  }, [definitions]);

  // Deduplicate task_completion statuses per client to worst status
  const deduplicateByClient = useCallback((statuses: ClientSLAStatus[]): ClientSLAStatus[] => {
    const statusOrder: Record<SLAStatusValue, number> = { breached: 0, warning: 1, on_track: 2 };
    const byClientSla = new Map<string, ClientSLAStatus>();

    for (const s of statuses) {
      const key = `${s.clientId}:${s.slaId}`;
      const existing = byClientSla.get(key);
      if (!existing || statusOrder[s.status] < statusOrder[existing.status]) {
        byClientSla.set(key, s);
      }
    }

    return Array.from(byClientSla.values());
  }, []);

  return {
    definitions,
    addDefinition,
    updateDefinition,
    deleteDefinition,
    toggleDefinition,
    computeStatuses,
    deduplicateByClient,
  };
}

export function useSLAStatuses(clients: Client[]) {
  const { definitions, computeStatuses, deduplicateByClient } = useSLA();
  return useMemo(() => {
    const raw = computeStatuses(clients);
    return deduplicateByClient(raw);
  }, [clients, computeStatuses, deduplicateByClient, definitions]); // eslint-disable-line react-hooks/exhaustive-deps
}
