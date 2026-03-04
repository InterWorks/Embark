import { useState, useCallback } from 'react';
import type { Client } from '../types';
import { useAISettings } from './useAISettings';

export interface TaskSuggestion {
  title: string;
  dueDaysFromNow: number;
}

export function useTaskSuggestions() {
  const { settings } = useAISettings();
  const [suggestions, setSuggestions] = useState<TaskSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = useCallback(async (client: Client) => {
    if (!settings.anthropicApiKey) {
      setError('No Anthropic API key configured.');
      return;
    }
    setIsLoading(true);
    setError(null);

    const services = client.services.map(s => s.name).join(', ') || 'N/A';
    const goLive = client.targetGoLiveDate || 'TBD';
    const existingTasks = client.checklist.map(t => t.title).join(', ') || 'None';

    const prompt = `Suggest 5-8 onboarding tasks for client "${client.name}".
Services: ${services}
Target go-live: ${goLive}
Existing tasks: ${existingTasks}

Return ONLY a valid JSON array, no prose:
[{"title": "task title", "dueDaysFromNow": 7}, ...]
Suggest tasks that are NOT already in the existing tasks list. Make tasks specific and actionable.`;

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
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error?.message || 'API error');
      const text = data.content?.[0]?.text ?? '';
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) setSuggestions(parsed);
      } catch {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed)) setSuggestions(parsed);
        } else {
          throw new Error('Could not parse suggestions from AI response');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [settings]);

  return { suggestions, isLoading, error, fetchSuggestions };
}
