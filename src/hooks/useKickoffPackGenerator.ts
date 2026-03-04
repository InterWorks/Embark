import { useState, useCallback } from 'react';
import type { Client } from '../types';
import { useAISettings } from './useAISettings';

export function useKickoffPackGenerator() {
  const { settings } = useAISettings();
  const [kickoffEmail, setKickoffEmail] = useState('');
  const [teamBrief, setTeamBrief] = useState('');
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
    const upcomingTasks = [...client.checklist]
      .filter(t => !t.completed)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .slice(0, 5)
      .map(t => t.title)
      .join(', ');
    const primaryContact = client.contacts?.find(c => c.isPrimary) || client.contacts?.[0];
    const contactName = primaryContact?.name || client.name;
    const goLive = client.targetGoLiveDate || 'TBD';

    const prompt = `Generate a kickoff pack for client "${client.name}".
Services: ${services}
Primary contact: ${contactName}
Target go-live: ${goLive}
First 5 upcoming tasks: ${upcomingTasks || 'None yet'}

Return ONLY a valid JSON object with exactly these two keys:
{
  "kickoffEmail": "full email text here",
  "teamBrief": "internal team brief text here"
}
kickoffEmail: Professional welcome email to the client (3-4 paragraphs, introduce team, outline first steps, set timeline expectations).
teamBrief: Internal team brief (bullet points: client background, key contacts, success criteria, first 30 days plan).`;

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
        setKickoffEmail(parsed.kickoffEmail || '');
        setTeamBrief(parsed.teamBrief || '');
      } catch {
        // Fallback: try to extract JSON from the text
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          setKickoffEmail(parsed.kickoffEmail || text);
          setTeamBrief(parsed.teamBrief || '');
        } else {
          setKickoffEmail(text);
          setTeamBrief('');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [settings]);

  return { kickoffEmail, setKickoffEmail, teamBrief, setTeamBrief, isLoading, error, generate };
}
