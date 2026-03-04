import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { generateId } from '../utils/helpers';
import type { Bud, BudType, BudConversation, BudMessage } from '../types';

// Pre-built Bud templates
export const budTemplates: Record<Exclude<BudType, 'custom'>, Omit<Bud, 'id' | 'createdAt'>> = {
  'status-reporter': {
    name: 'Status Reporter',
    type: 'status-reporter',
    description: 'Auto-generates progress summaries and flags blockers for stakeholders',
    systemPrompt: `You are a Status Reporter AI assistant for a client onboarding system called Embark. Your role is to:
- Generate clear, concise progress summaries for clients and projects
- Identify and flag potential blockers or issues
- Highlight key metrics and completion percentages
- Provide stakeholder-ready updates

When given client data, analyze it and provide structured status reports. Be professional, concise, and action-oriented. Format your responses with clear sections and bullet points when appropriate.`,
    icon: '📊',
    color: 'from-blue-500 to-cyan-500',
  },
  'project-manager': {
    name: 'Project Manager',
    type: 'project-manager',
    description: 'Captures goals and scope for clear and successful project starts and finishes',
    systemPrompt: `You are a Project Manager AI assistant for a client onboarding system called Embark. Your role is to:
- Help define clear project goals and scope
- Break down large objectives into actionable tasks
- Identify dependencies and potential risks
- Suggest timelines and milestones
- Ensure nothing falls through the cracks

Help users plan and structure their client onboarding projects effectively. Ask clarifying questions when needed and provide structured recommendations.`,
    icon: '📋',
    color: 'from-purple-500 to-pink-500',
  },
  'standup-manager': {
    name: 'StandUp Manager',
    type: 'standup-manager',
    description: 'Collects and shares team updates to keep everyone aligned on project status',
    systemPrompt: `You are a StandUp Manager AI assistant for a client onboarding system called Embark. Your role is to:
- Help collect and organize daily/weekly updates
- Summarize what was accomplished, what's in progress, and what's blocked
- Identify patterns across updates
- Generate standup-style reports
- Keep team communication clear and efficient

Format updates in a clear standup format: What was done, What's next, Any blockers. Be concise and actionable.`,
    icon: '🎯',
    color: 'from-green-500 to-emerald-500',
  },
  'priorities-manager': {
    name: 'Priorities Manager',
    type: 'priorities-manager',
    description: 'Continuously manages priorities, escalating and identifying urgent tasks',
    systemPrompt: `You are a Priorities Manager AI assistant for a client onboarding system called Embark. Your role is to:
- Analyze tasks and help prioritize them effectively
- Identify urgent items that need immediate attention
- Flag overdue tasks and suggest escalation
- Help users focus on what matters most
- Balance workload across clients

When analyzing tasks, consider due dates, client importance, dependencies, and overall impact. Provide clear priority recommendations with reasoning.`,
    icon: '🚀',
    color: 'from-orange-500 to-red-500',
  },
};

export function useBuds() {
  const [buds, setBuds] = useLocalStorage<Bud[]>('embark-buds', []);
  const [conversations, setConversations] = useLocalStorage<BudConversation[]>('embark-bud-conversations', []);
  const [apiKey, setApiKey] = useLocalStorage<string>('embark-anthropic-api-key', '');

  const createBud = useCallback((
    template: Omit<Bud, 'id' | 'createdAt'> | BudType
  ): Bud => {
    let budData: Omit<Bud, 'id' | 'createdAt'>;

    if (typeof template === 'string') {
      // It's a BudType, use the template
      if (template === 'custom') {
        budData = {
          name: 'New Bud',
          type: 'custom',
          description: 'A custom AI assistant',
          systemPrompt: 'You are a helpful AI assistant for a client onboarding system called Embark. Help users manage their clients, tasks, and projects effectively.',
          icon: '🤖',
          color: 'from-violet-500 to-purple-500',
        };
      } else {
        budData = budTemplates[template];
      }
    } else {
      budData = template;
    }

    const newBud: Bud = {
      ...budData,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };

    setBuds((prev) => [...prev, newBud]);
    return newBud;
  }, [setBuds]);

  const updateBud = useCallback((id: string, updates: Partial<Omit<Bud, 'id' | 'createdAt'>>) => {
    setBuds((prev) =>
      prev.map((bud) => (bud.id === id ? { ...bud, ...updates } : bud))
    );
  }, [setBuds]);

  const deleteBud = useCallback((id: string) => {
    setBuds((prev) => prev.filter((bud) => bud.id !== id));
    // Also delete conversations for this bud
    setConversations((prev) => prev.filter((conv) => conv.budId !== id));
  }, [setBuds, setConversations]);

  const assignBudToClient = useCallback((budId: string, clientId: string) => {
    setBuds((prev) =>
      prev.map((bud) => {
        if (bud.id !== budId) return bud;
        const currentClients = bud.assignedClientIds || [];
        if (currentClients.includes(clientId)) return bud;
        return { ...bud, assignedClientIds: [...currentClients, clientId] };
      })
    );
  }, [setBuds]);

  const unassignBudFromClient = useCallback((budId: string, clientId: string) => {
    setBuds((prev) =>
      prev.map((bud) => {
        if (bud.id !== budId) return bud;
        return {
          ...bud,
          assignedClientIds: (bud.assignedClientIds || []).filter((id) => id !== clientId),
        };
      })
    );
  }, [setBuds]);

  const getConversation = useCallback((budId: string, clientId?: string): BudConversation | null => {
    return conversations.find(
      (conv) => conv.budId === budId && conv.clientId === clientId
    ) || null;
  }, [conversations]);

  const createOrGetConversation = useCallback((budId: string, clientId?: string): BudConversation => {
    const existing = conversations.find(
      (conv) => conv.budId === budId && conv.clientId === clientId
    );

    if (existing) return existing;

    const newConversation: BudConversation = {
      id: generateId(),
      budId,
      clientId,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setConversations((prev) => [...prev, newConversation]);
    return newConversation;
  }, [conversations, setConversations]);

  const addMessage = useCallback((
    conversationId: string,
    role: 'user' | 'assistant',
    content: string
  ): BudMessage => {
    const message: BudMessage = {
      id: generateId(),
      role,
      content,
      timestamp: new Date().toISOString(),
    };

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId
          ? {
              ...conv,
              messages: [...conv.messages, message],
              updatedAt: new Date().toISOString(),
            }
          : conv
      )
    );

    return message;
  }, [setConversations]);

  const clearConversation = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId
          ? { ...conv, messages: [], updatedAt: new Date().toISOString() }
          : conv
      )
    );
  }, [setConversations]);

  const getBudsForClient = useCallback((clientId: string): Bud[] => {
    return buds.filter((bud) => bud.assignedClientIds?.includes(clientId));
  }, [buds]);

  return {
    buds,
    conversations,
    apiKey,
    setApiKey,
    createBud,
    updateBud,
    deleteBud,
    assignBudToClient,
    unassignBudFromClient,
    getConversation,
    createOrGetConversation,
    addMessage,
    clearConversation,
    getBudsForClient,
    budTemplates,
  };
}
