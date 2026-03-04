import { useState, useCallback } from 'react';
import type { Bud, BudMessage, Client, OllamaModel } from '../types';

interface OllamaMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatOptions {
  bud: Bud;
  messages: BudMessage[];
  client?: Client | null;
  allClients?: Client[];
}

export function useOllamaChat(endpoint: string = 'http://localhost:11434') {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  // Check if Ollama is running
  const checkConnection = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(`${endpoint}/api/tags`, {
        method: 'GET',
      });
      const connected = response.ok;
      setIsConnected(connected);
      return connected;
    } catch {
      setIsConnected(false);
      return false;
    }
  }, [endpoint]);

  // List available models
  const listModels = useCallback(async (): Promise<OllamaModel[]> => {
    try {
      const response = await fetch(`${endpoint}/api/tags`);
      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }
      const data = await response.json();
      return data.models || [];
    } catch (err) {
      console.error('Failed to list Ollama models:', err);
      return [];
    }
  }, [endpoint]);

  // Build system prompt (same logic as Anthropic)
  const buildSystemPrompt = useCallback((bud: Bud, client?: Client | null, allClients?: Client[]) => {
    let systemPrompt = bud.systemPrompt;

    // Add context about the current client if provided
    if (client) {
      const completedTasks = client.checklist.filter(t => t.completed).length;
      const totalTasks = client.checklist.length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      const overdueTasks = client.checklist.filter(t => {
        if (t.completed || !t.dueDate) return false;
        return new Date(t.dueDate) < new Date();
      });

      systemPrompt += `\n\n## Current Client Context
- **Client ID:** ${client.id}
- **Client Name:** ${client.name}
- **Email:** ${client.email}
- **Phone:** ${client.phone || 'Not provided'}
- **Status:** ${client.status}
- **Priority:** ${client.priority}
- **Assigned To:** ${client.assignedTo}
- **Progress:** ${progress}% (${completedTasks}/${totalTasks} tasks completed)
- **Overdue Tasks:** ${overdueTasks.length}

### Tasks:
${client.checklist.map(t => `- [${t.completed ? 'x' : ' '}] ${t.title} (ID: ${t.id})${t.dueDate ? ` (Due: ${t.dueDate})` : ''}`).join('\n')}

### Services:
${client.services.map(s => `- ${s.name}`).join('\n') || 'No services listed'}

### Notes:
${client.notes || 'No notes'}

### Milestones:
${client.milestones?.map(m => `- [${m.completedAt ? 'x' : ' '}] ${m.title}`).join('\n') || 'No milestones'}
`;
    }

    // Add summary of all clients if in global context
    if (allClients && allClients.length > 0 && !client) {
      const activeClients = allClients.filter(c => !c.archived);
      const totalTasks = activeClients.reduce((sum, c) => sum + c.checklist.length, 0);
      const completedTasks = activeClients.reduce((sum, c) => sum + c.checklist.filter(t => t.completed).length, 0);

      systemPrompt += `\n\n## All Clients Overview
- **Total Active Clients:** ${activeClients.length}
- **Total Tasks:** ${totalTasks}
- **Completed Tasks:** ${completedTasks}
- **Overall Progress:** ${totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%

### Client Summary:
${activeClients.map(c => {
  const completed = c.checklist.filter(t => t.completed).length;
  const total = c.checklist.length;
  const prog = total > 0 ? Math.round((completed / total) * 100) : 0;
  return `- **${c.name}** (ID: ${c.id}, ${c.status}, ${c.priority} priority): ${prog}% complete`;
}).join('\n')}
`;
    }

    systemPrompt += `\n\n## Response Guidelines
- Be helpful, concise, and actionable
- Use markdown formatting for clarity
- When providing summaries, use clear structure with headers and bullet points
- Always stay in character as ${bud.name}

Note: You are running locally via Ollama. Tool use is not available in this mode, but you can provide guidance and recommendations.`;

    return systemPrompt;
  }, []);

  // Send a message to Ollama
  const sendMessage = useCallback(async (
    userMessage: string,
    options: ChatOptions,
    model: string = 'llama3'
  ): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      const systemPrompt = buildSystemPrompt(options.bud, options.client, options.allClients);

      // Convert previous messages to Ollama format
      const messages: OllamaMessage[] = [
        { role: 'system', content: systemPrompt },
        ...options.messages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        { role: 'user', content: userMessage },
      ];

      const response = await fetch(`${endpoint}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama request failed: ${errorText}`);
      }

      const data = await response.json();
      setIsLoading(false);

      return data.message?.content || 'No response received.';
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      setIsLoading(false);
      throw err;
    }
  }, [endpoint, buildSystemPrompt]);

  // Stream a message (for real-time responses)
  const streamMessage = useCallback(async (
    userMessage: string,
    options: ChatOptions,
    model: string = 'llama3',
    onChunk: (text: string) => void
  ): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      const systemPrompt = buildSystemPrompt(options.bud, options.client, options.allClients);

      const messages: OllamaMessage[] = [
        { role: 'system', content: systemPrompt },
        ...options.messages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        { role: 'user', content: userMessage },
      ];

      const response = await fetch(`${endpoint}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama request failed: ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const json = JSON.parse(line);
            if (json.message?.content) {
              fullResponse += json.message.content;
              onChunk(json.message.content);
            }
          } catch {
            // Ignore parse errors for incomplete chunks
          }
        }
      }

      setIsLoading(false);
      return fullResponse;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      setIsLoading(false);
      throw err;
    }
  }, [endpoint, buildSystemPrompt]);

  return {
    sendMessage,
    streamMessage,
    checkConnection,
    listModels,
    isLoading,
    isConnected,
    error,
  };
}
