import { useState, useCallback } from 'react';
import type { Client } from '../types';
import type { ClientSLAStatus } from '../types/sla';
import { useAISettings } from './useAISettings';

export type RiskTier = 'Low' | 'Medium' | 'High' | 'Critical';

interface RiskBriefEntry {
  brief: string;
  riskTier: RiskTier;
  generatedAt: string;
}

const STORAGE_KEY = 'embark-ai-risk-brief';

function loadCache(): Record<string, RiskBriefEntry> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveCache(cache: Record<string, RiskBriefEntry>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
}

function parseTier(text: string): RiskTier {
  const match = text.match(/\[TIER:\s*(Low|Medium|High|Critical)\]/i);
  if (match) return match[1] as RiskTier;
  const lower = text.toLowerCase();
  if (lower.includes('critical')) return 'Critical';
  if (lower.includes('high')) return 'High';
  if (lower.includes('medium') || lower.includes('moderate')) return 'Medium';
  return 'Low';
}

export function useAIRiskBrief(client: Client, slaStatuses: ClientSLAStatus[]) {
  const { settings } = useAISettings();
  const cached = loadCache()[client.id];
  const [brief, setBrief] = useState<string>(cached?.brief ?? '');
  const [riskTier, setRiskTier] = useState<RiskTier>(cached?.riskTier ?? 'Low');
  const [generatedAt, setGeneratedAt] = useState<string>(cached?.generatedAt ?? '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!settings.anthropicApiKey) {
      setError('Configure AI in Settings to enable risk briefs.');
      return;
    }
    setIsLoading(true);
    setError(null);

    const totalTasks = client.checklist.length;
    const completedTasks = client.checklist.filter(t => t.completed).length;
    const overdueTasks = client.checklist.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length;
    const blockedTasks = client.checklist.filter(t => t.isBlocked && !t.completed).length;
    const commLog = client.communicationLog ?? [];
    const lastComm = commLog.length > 0 ? commLog[commLog.length - 1] : null;
    const daysSinceComm = lastComm
      ? Math.floor((Date.now() - new Date(lastComm.timestamp).getTime()) / 86400000)
      : null;
    const slaBreached = slaStatuses.filter(s => s.clientId === client.id && s.status === 'breached').length;
    const slaWarning = slaStatuses.filter(s => s.clientId === client.id && s.status === 'warning').length;
    const phasesTotal = (client.phases ?? []).length;
    const phasesCompleted = (client.phases ?? []).filter(p => p.completedAt).length;

    const prompt = `Analyze this client's onboarding risk and provide a concise risk brief.

Client: ${client.name}
Status: ${client.status}
Tasks: ${completedTasks}/${totalTasks} complete (${overdueTasks} overdue, ${blockedTasks} blocked)
Phases: ${phasesCompleted}/${phasesTotal} complete
Days since last communication: ${daysSinceComm ?? 'unknown'}
SLA breached: ${slaBreached} | SLA warning: ${slaWarning}

Start your response with exactly: [TIER: Low] or [TIER: Medium] or [TIER: High] or [TIER: Critical]

Then in 3-4 sentences, identify the top risks and recommended actions. Be direct and specific.`;

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
          model: settings.anthropicModel || 'claude-haiku-4-5-20251001',
          max_tokens: 400,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error?.message || 'API error');
      const text = data.content?.[0]?.text ?? '';
      const tier = parseTier(text);
      const now = new Date().toISOString();
      setBrief(text);
      setRiskTier(tier);
      setGeneratedAt(now);
      const cache = loadCache();
      cache[client.id] = { brief: text, riskTier: tier, generatedAt: now };
      saveCache(cache);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [client, slaStatuses, settings]);

  return { brief, riskTier, generatedAt, isLoading, error, refresh };
}
