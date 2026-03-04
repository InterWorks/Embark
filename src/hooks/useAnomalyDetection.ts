import { useEffect, useRef } from 'react';
import type { Client } from '../types';
import { getClientHealth } from '../utils/clientHealth';
import { emit } from '../events/appEvents';

const SNAPSHOTS_KEY = 'embark-health-snapshots';
const INTERVAL_MS = 60_000; // 60 seconds

interface HealthSnapshot {
  clientId: string;
  status: string;
  capturedAt: string;
}

function loadSnapshots(): Record<string, HealthSnapshot> {
  try {
    return JSON.parse(localStorage.getItem(SNAPSHOTS_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveSnapshots(snapshots: Record<string, HealthSnapshot>): void {
  localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(snapshots));
}

const AT_RISK_TRANSITION = new Set(['at-risk', 'behind']);

export function useAnomalyDetection(clients: Client[]) {
  const clientsRef = useRef(clients);
  clientsRef.current = clients;

  useEffect(() => {
    const check = () => {
      const snapshots = loadSnapshots();
      const now = new Date().toISOString();
      const updated: Record<string, HealthSnapshot> = { ...snapshots };

      for (const client of clientsRef.current) {
        if (client.archived || client.status === 'completed') continue;
        const health = getClientHealth(client);
        if (!health) continue;
        const currentStatus = health.status;
        const prev = snapshots[client.id];

        if (prev && !AT_RISK_TRANSITION.has(prev.status) && AT_RISK_TRANSITION.has(currentStatus)) {
          // Health dropped — emit event
          emit({
            type: 'client_health_drop',
            clientId: client.id,
            clientName: client.name,
            healthStatus: currentStatus,
            timestamp: now,
          });
        }

        updated[client.id] = { clientId: client.id, status: currentStatus, capturedAt: now };
      }

      saveSnapshots(updated);
    };

    // Check immediately on mount
    check();
    const interval = setInterval(check, INTERVAL_MS);
    return () => clearInterval(interval);
  }, []); // intentionally empty — uses ref
}
