import { useState, useCallback } from 'react';
import type { Client } from '../types';
import { useAISettings } from './useAISettings';

export function useGraduationSummary() {
  const { settings } = useAISettings();
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (client: Client) => {
    if (!settings.anthropicApiKey) {
      setError('No Anthropic API key configured.');
      return;
    }
    setIsLoading(true);
    setError(null);

    const services = client.services.map(s => s.name).join(', ') || 'N/A';
    const completedTasks = client.checklist.filter(t => t.completed).length;
    const totalTasks = client.checklist.length;
    const milestones = (client.milestones ?? []).filter(m => m.completedAt).map(m => m.title).join(', ') || 'None';
    const team = (client.assignments ?? []).map(a => a.memberId).join(', ') || 'N/A';
    const startDate = client.createdAt.slice(0, 10);
    const daysToGraduate = Math.round((Date.now() - new Date(client.createdAt).getTime()) / 86400000);

    const prompt = `Write a concise onboarding handoff summary for client "${client.name}".
Services: ${services}
Team: ${team}
Started: ${startDate} (${daysToGraduate} days ago)
Tasks completed: ${completedTasks}/${totalTasks}
Milestones reached: ${milestones}

Write 3-4 sentences covering: what was accomplished, key milestones, next steps for ongoing success. Be professional and positive.`;

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
      setSummary(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [settings]);

  return { generate, summary, setSummary, isLoading, error };
}
