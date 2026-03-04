import { useState, useRef, useEffect, useCallback } from 'react';
import { useBuds } from '../../hooks/useBuds';
import { useAnthropicChat } from '../../hooks/useAnthropicChat';
import { useOllamaChat } from '../../hooks/useOllamaChat';
import { useAISettings } from '../../hooks/useAISettings';
import { useAIActions } from '../../hooks/useAIActions';
import { useToast } from '../UI/Toast';
import type { Bud, Client } from '../../types';

interface BudChatProps {
  bud: Bud;
  initialClient?: Client;
  onClose: () => void;
}

export function BudChat({ bud, initialClient, onClose }: BudChatProps) {
  const { createOrGetConversation, addMessage, clearConversation } = useBuds();
  const { settings } = useAISettings();
  const anthropicChat = useAnthropicChat(settings.anthropicApiKey || '');
  const ollamaChat = useOllamaChat(settings.ollamaEndpoint);
  const { executeAction, clients } = useAIActions();
  const { showToast } = useToast();

  // Determine which chat to use based on provider
  const isOllama = settings.provider === 'ollama';
  const isLoading = isOllama ? ollamaChat.isLoading : anthropicChat.isLoading;
  const error = isOllama ? ollamaChat.error : anthropicChat.error;

  // Check if AI is properly configured
  const isAIConfigured = isOllama
    ? ollamaChat.isConnected === true
    : !!settings.anthropicApiKey;

  // Wrap executeAction to show toast notifications
  const executeActionWithToast = useCallback(
    async (toolName: string, toolInput: Record<string, unknown>, contextClientId?: string) => {
      const result = await executeAction(toolName, toolInput, contextClientId);
      if (result.success) {
        showToast(result.message, 'success');
      } else {
        showToast(result.message, 'error');
      }
      return result;
    },
    [executeAction, showToast]
  );

  const [selectedClientId, setSelectedClientId] = useState<string | undefined>(initialClient?.id);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeClients = clients.filter((c) => !c.archived);
  const selectedClient = selectedClientId ? clients.find((c) => c.id === selectedClientId) : null;

  const conversation = createOrGetConversation(bud.id, selectedClientId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation.messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');

    // Add user message to conversation
    addMessage(conversation.id, 'user', userMessage);

    try {
      const budWithTools = {
        ...bud,
        systemPrompt: bud.systemPrompt + `\n\nYou have the ability to directly modify the Embark system using tools. When users ask you to add clients, create tasks, mark tasks complete, update information, etc., USE YOUR TOOLS to actually do it. Don't just describe what should be done - actually do it.`,
      };

      let response: string;

      if (isOllama) {
        // Use Ollama for local AI processing
        response = await ollamaChat.sendMessage(userMessage, {
          bud: budWithTools,
          messages: conversation.messages,
          client: selectedClient,
          allClients: !selectedClient ? activeClients : undefined,
        }, settings.ollamaModel);
      } else {
        // Use Anthropic Claude API
        response = await anthropicChat.sendMessage(userMessage, {
          bud: budWithTools,
          messages: conversation.messages,
          client: selectedClient,
          allClients: !selectedClient ? activeClients : undefined,
          executeAction: settings.enableTools ? executeActionWithToast : undefined,
          enableTools: settings.enableTools,
        });
      }

      // Add assistant message to conversation
      addMessage(conversation.id, 'assistant', response);
    } catch {
      // Error is already handled in the hook
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    if (confirm('Clear all messages in this conversation?')) {
      clearConversation(conversation.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl h-[80vh] flex flex-col glass-strong rounded-2xl shadow-2xl border border-white/30 dark:border-white/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/20 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${bud.color} flex items-center justify-center text-xl`}>
              {bud.icon}
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">{bud.name}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">{bud.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClearChat}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-white/10 rounded-lg transition-colors"
              title="Clear conversation"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Client Selector */}
        <div className="px-4 py-2 border-b border-white/10 dark:border-white/5 bg-white/20 dark:bg-white/5">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Context:</span>
            <select
              value={selectedClientId || ''}
              onChange={(e) => setSelectedClientId(e.target.value || undefined)}
              className="flex-1 px-3 py-1.5 text-sm bg-white/50 dark:bg-white/10 rounded-lg border border-white/30 dark:border-white/10 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            >
              <option value="">All Clients (General)</option>
              {activeClients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {conversation.messages.length === 0 && (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">{bud.icon}</div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                Hey! I'm {bud.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                {bud.description}. How can I help you today?
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {bud.type === 'status-reporter' && (
                  <>
                    <SuggestedPrompt text="Give me a status update" onClick={setInput} />
                    <SuggestedPrompt text="What tasks are overdue?" onClick={setInput} />
                  </>
                )}
                {bud.type === 'project-manager' && (
                  <>
                    <SuggestedPrompt text="Help me plan a new project" onClick={setInput} />
                    <SuggestedPrompt text="What are the next milestones?" onClick={setInput} />
                  </>
                )}
                {bud.type === 'standup-manager' && (
                  <>
                    <SuggestedPrompt text="Generate a standup update" onClick={setInput} />
                    <SuggestedPrompt text="What was completed this week?" onClick={setInput} />
                  </>
                )}
                {bud.type === 'priorities-manager' && (
                  <>
                    <SuggestedPrompt text="What should I focus on today?" onClick={setInput} />
                    <SuggestedPrompt text="Are there any urgent tasks?" onClick={setInput} />
                  </>
                )}
                {bud.type === 'custom' && (
                  <SuggestedPrompt text="How can you help me?" onClick={setInput} />
                )}
              </div>
            </div>
          )}

          {conversation.messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                    : 'glass-subtle text-gray-900 dark:text-gray-100'
                }`}
              >
                <div className="text-sm whitespace-pre-wrap prose prose-sm dark:prose-invert max-w-none">
                  {message.content}
                </div>
                <div
                  className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-white/70' : 'text-gray-400'
                  }`}
                >
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="glass-subtle rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {bud.name} is thinking...
                  </span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-center">
              <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg px-4 py-2 text-sm">
                {error}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/20 dark:border-white/10">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${bud.name}...`}
              rows={1}
              className="flex-1 px-4 py-3 text-sm bg-white/50 dark:bg-white/10 rounded-xl border border-white/30 dark:border-white/10 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
              style={{ minHeight: '48px', maxHeight: '120px' }}
              disabled={!isAIConfigured}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading || !isAIConfigured}
              className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          {!isAIConfigured && (
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
              {isOllama
                ? 'Connect to Ollama in Settings to chat with Buds locally'
                : 'Add your Anthropic API key in Settings to chat with Buds'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function SuggestedPrompt({ text, onClick }: { text: string; onClick: (text: string) => void }) {
  return (
    <button
      onClick={() => onClick(text)}
      className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-white/10 hover:bg-white/70 dark:hover:bg-white/15 rounded-full transition-colors"
    >
      {text}
    </button>
  );
}
