import { useState, useCallback } from 'react';
import type { Bud, BudMessage, Client } from '../types';
import { aiTools, type ActionResult } from './useAIActions';

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string | AnthropicContent[];
}

interface AnthropicContent {
  type: 'text' | 'tool_use' | 'tool_result' | 'image';
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
  tool_use_id?: string;
  content?: string;
  is_error?: boolean;
  source?: {
    type: 'base64';
    media_type: string;
    data: string;
  };
}

interface AttachedFile {
  type: 'image' | 'document';
  mediaType: string;
  data: string;
  name: string;
}

interface ChatOptions {
  bud: Bud;
  messages: BudMessage[];
  client?: Client | null;
  allClients?: Client[];
  executeAction?: (toolName: string, toolInput: Record<string, unknown>, contextClientId?: string) => Promise<ActionResult>;
  enableTools?: boolean;
  attachedFiles?: AttachedFile[];
}

export function useAnthropicChat(apiKey: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildSystemPrompt = useCallback((bud: Bud, client?: Client | null, allClients?: Client[], enableTools?: boolean) => {
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

    if (enableTools) {
      systemPrompt += `\n\n## Action Capabilities
You have the ability to directly modify the Embark system using tools. When users ask you to:
- Add a client → use the add_client tool
- Add a task → use the add_task tool
- Complete a task → use the complete_task tool
- Update client information → use the update_client tool
- And more...

IMPORTANT: When you successfully use a tool to make a change, confirm the action to the user in a friendly way. If a tool fails, explain what went wrong and suggest alternatives.

When the user mentions a client by name, use that name in the clientName parameter. The system will find the matching client automatically.`;
    }

    systemPrompt += `\n\n## Response Guidelines
- Be helpful, concise, and actionable
- Use markdown formatting for clarity
- When providing summaries, use clear structure with headers and bullet points
- Always stay in character as ${bud.name}`;

    return systemPrompt;
  }, []);

  const sendMessage = useCallback(async (
    userMessage: string,
    options: ChatOptions
  ): Promise<string> => {
    if (!apiKey) {
      throw new Error('Anthropic API key is not configured. Please add your API key in Settings.');
    }

    setIsLoading(true);
    setError(null);

    try {
      const enableTools = options.enableTools !== false && !!options.executeAction;
      const systemPrompt = buildSystemPrompt(options.bud, options.client, options.allClients, enableTools);

      // Convert previous messages to Anthropic format
      const previousMessages: AnthropicMessage[] = options.messages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      // Build user message content
      const userContent: AnthropicContent[] = [];

      // Add attached images first (for vision models)
      if (options.attachedFiles && options.attachedFiles.length > 0) {
        for (const file of options.attachedFiles) {
          if (file.type === 'image') {
            userContent.push({
              type: 'image',
              source: {
                type: 'base64',
                media_type: file.mediaType,
                data: file.data,
              },
            });
          } else {
            // For non-image files, include as text description
            userContent.push({
              type: 'text',
              text: `[Attached document: ${file.name}]`,
            });
          }
        }
      }

      // Add the text message
      if (userMessage) {
        userContent.push({
          type: 'text',
          text: userMessage,
        });
      }

      // Add the new user message
      let allMessages: AnthropicMessage[] = [
        ...previousMessages,
        {
          role: 'user',
          content: userContent.length === 1 && userContent[0].type === 'text'
            ? userContent[0].text!
            : userContent
        },
      ];

      // Keep making requests until we get a final text response
      let maxIterations = 10; // Safety limit
      let finalResponse = '';

      while (maxIterations > 0) {
        maxIterations--;

        const requestBody: Record<string, unknown> = {
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          system: systemPrompt,
          messages: allMessages,
        };

        // Add tools if enabled
        if (enableTools) {
          requestBody.tools = aiTools;
        }

        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || `API request failed: ${response.status}`);
        }

        const data = await response.json();

        // Check if we have tool use
        const toolUses = data.content?.filter((c: AnthropicContent) => c.type === 'tool_use') || [];
        const textContent = data.content?.filter((c: AnthropicContent) => c.type === 'text') || [];

        // Collect any text response
        for (const text of textContent) {
          if (text.text) {
            finalResponse += (finalResponse ? '\n\n' : '') + text.text;
          }
        }

        // If there are no tool uses or no executeAction, we're done
        if (toolUses.length === 0 || !options.executeAction) {
          break;
        }

        // Process tool uses
        const toolResults: AnthropicContent[] = [];

        for (const toolUse of toolUses) {
          const result = await options.executeAction(
            toolUse.name!,
            toolUse.input as Record<string, unknown>,
            options.client?.id
          );

          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: JSON.stringify(result),
            is_error: !result.success,
          });
        }

        // Add assistant message with tool uses and our tool results
        allMessages = [
          ...allMessages,
          { role: 'assistant', content: data.content },
          { role: 'user', content: toolResults },
        ];

        // If stop_reason is end_turn, we might be done
        if (data.stop_reason === 'end_turn') {
          break;
        }
      }

      if (!finalResponse) {
        finalResponse = 'I completed the requested actions.';
      }

      setIsLoading(false);
      return finalResponse;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      setIsLoading(false);
      throw err;
    }
  }, [apiKey, buildSystemPrompt]);

  return {
    sendMessage,
    isLoading,
    error,
  };
}
