import { useState, useCallback } from 'react';
import type { Client } from '../types';
import { useAISettings } from './useAISettings';
import { getClientHealth } from '../utils/clientHealth';

export interface AtRiskClient {
  name: string;
  clientId: string;
  reasons: string[];
  recommendedPlay: string;
}

export interface PortfolioIntelligence {
  atRiskClients: AtRiskClient[];
  narrative: string;
  generatedAt: string;
}

const STORAGE_KEY = 'embark-portfolio-intelligence';

function loadCache(): PortfolioIntelligence | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveCache(data: PortfolioIntelligence): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function usePortfolioIntelligence(clients: Client[]) {
  const { settings } = useAISettings();
  const cached = loadCache();
  const [intelligence, setIntelligence] = useState<PortfolioIntelligence | null>(cached);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async () => {
    if (!settings.anthropicApiKey) {
      setError('Configure AI in Settings to enable portfolio intelligence.');
      return;
    }
    setIsLoading(true);
    setError(null);

    const activeClients = clients.filter(c => c.status === 'active' && !c.archived);
    const summaries = activeClients.map(c => {
      const health = getClientHealth(c);
      const overdue = c.checklist.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length;
      const blocked = c.checklist.filter(t => t.isBlocked && !t.completed).length;
      const pct = c.checklist.length > 0
        ? Math.round((c.checklist.filter(t => t.completed).length / c.checklist.length) * 100)
        : 0;
      return `${c.name}: ${pct}% complete, ${overdue} overdue, ${blocked} blocked, health=${health?.status ?? 'unknown'}`;
    }).join('\n');

    const prompt = `Analyze this portfolio of ${activeClients.length} active onboarding clients and identify the top at-risk clients.

Client summaries:
${summaries}

Respond with valid JSON in a code block like this:
\`\`\`json
{
  "atRiskClients": [
    {
      "name": "Client Name",
      "reasons": ["reason1", "reason2"],
      "recommendedPlay": "specific action to take"
    }
  ],
  "narrative": "2-3 sentence portfolio overview"
}
\`\`\`

Identify at most 3 clients that need the most attention. Be specific and actionable.`;

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
          max_tokens: 800,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error?.message || 'API error');
      const text = data.content?.[0]?.text ?? '';

      // Extract JSON from code block
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
      if (!jsonMatch) throw new Error('Could not parse AI response');
      const parsed = JSON.parse(jsonMatch[1]);

      // Map client names to IDs
      const withIds: AtRiskClient[] = (parsed.atRiskClients ?? []).map((r: { name: string; reasons: string[]; recommendedPlay: string }) => {
        const c = activeClients.find(cl => cl.name.toLowerCase() === r.name.toLowerCase());
        return { ...r, clientId: c?.id ?? '' };
      });

      const result: PortfolioIntelligence = {
        atRiskClients: withIds,
        narrative: parsed.narrative ?? '',
        generatedAt: new Date().toISOString(),
      };
      setIntelligence(result);
      saveCache(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [clients, settings]);

  return { intelligence, isLoading, error, analyze };
}
