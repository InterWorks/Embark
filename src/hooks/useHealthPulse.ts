import { useState, useCallback } from 'react';
import type { Client } from '../types';
import type { ClientSLAStatus } from '../types/sla';
import { useAISettings } from './useAISettings';

interface PulseEntry {
  text: string;
  generatedAt: string;
}

const STORAGE_KEY = 'embark-health-pulse';

function loadCache(): Record<string, PulseEntry> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveCache(cache: Record<string, PulseEntry>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
}

export function useHealthPulse(client: Client, slaStatuses: ClientSLAStatus[]) {
  const { settings } = useAISettings();
  const cached = loadCache()[client.id];
  const [pulse, setPulse] = useState<string>(cached?.text ?? '');
  const [generatedAt, setGeneratedAt] = useState<string>(cached?.generatedAt ?? '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!settings.anthropicApiKey) {
      setError('No Anthropic API key configured.');
      return;
    }
    setIsLoading(true);
    setError(null);

    const totalTasks = client.checklist.length;
    const completedTasks = client.checklist.filter(t => t.completed).length;
    const overdueTasks = client.checklist.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length;
    const blockedCount = client.checklist.filter(t => t.isBlocked && !t.completed).length;
    const recentActivity = client.activityLog.slice(-10).map(e => `${e.timestamp.slice(0, 10)}: ${e.description}`).join('\n');
    const commLog = client.communicationLog ?? [];
    const lastComm = commLog.length > 0 ? commLog[commLog.length - 1] : null;
    const daysSinceComm = lastComm
      ? Math.floor((Date.now() - new Date(lastComm.timestamp).getTime()) / 86400000)
      : null;
    const clientSLAs = slaStatuses.filter(s => s.clientId === client.id);
    const slaInfo = clientSLAs.length > 0
      ? clientSLAs.map(s => `${s.slaName}: ${s.status}`).join(', ')
      : 'No SLAs configured';

    const prompt = `Give a brief 3-5 sentence health pulse for client "${client.name}".
Progress: ${completedTasks}/${totalTasks} tasks complete
Overdue tasks: ${overdueTasks}
Blocked tasks: ${blockedCount}
Days since last communication: ${daysSinceComm ?? 'unknown'}
SLA status: ${slaInfo}
Recent activity:
${recentActivity}

Write a concise, actionable health assessment. Be direct and highlight the most important risks or wins.`;

    try {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': settings.anthropicApiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: settings.anthropicModel || 'claude-sonnet-4-20250514',
          max_tokens: 512,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error?.message || 'API error');
      const text = data.content?.[0]?.text ?? '';
      const now = new Date().toISOString();
      setPulse(text);
      setGeneratedAt(now);
      const cache = loadCache();
      cache[client.id] = { text, generatedAt: now };
      saveCache(cache);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [client, slaStatuses, settings]);

  return { pulse, generatedAt, isLoading, error, refresh };
}
