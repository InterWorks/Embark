import { useState } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { AISettings, AIProvider } from '../types';

type StoredSettings = Omit<AISettings, 'anthropicApiKey'>;

const defaultStoredSettings: StoredSettings = {
  provider: 'anthropic',
  anthropicModel: 'claude-sonnet-4-20250514',
  ollamaEndpoint: 'http://localhost:11434',
  ollamaModel: 'llama3',
  enableTools: true,
  maxTokens: 4096,
};

export function useAISettings() {
  const [storedSettings, setStoredSettings] = useLocalStorage<StoredSettings>('embark-ai-settings', defaultStoredSettings);

  // On first load, migrate any key that was previously persisted to localStorage,
  // then keep it only in React state going forward.
  const [apiKey, setApiKey] = useState<string>(() => {
    try {
      const raw = localStorage.getItem('embark-ai-settings');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.anthropicApiKey === 'string' && parsed.anthropicApiKey) {
          // Remove the key from the stored object immediately
          const { anthropicApiKey: _removed, ...rest } = parsed;
          localStorage.setItem('embark-ai-settings', JSON.stringify(rest));
          return parsed.anthropicApiKey as string;
        }
      }
    } catch {
      // ignore
    }
    return '';
  });

  // Expose a combined settings object so consumers see the full AISettings shape.
  const settings: AISettings = { ...storedSettings, anthropicApiKey: apiKey };

  const updateSettings = (updates: Partial<AISettings>) => {
    const { anthropicApiKey, ...rest } = updates;
    if (anthropicApiKey !== undefined) {
      setApiKey(anthropicApiKey);
    }
    if (Object.keys(rest).length > 0) {
      setStoredSettings(prev => ({ ...prev, ...rest }));
    }
  };

  const setProvider = (provider: AIProvider) => {
    updateSettings({ provider });
  };

  const setAnthropicKey = (key: string) => {
    setApiKey(key);
  };

  const setOllamaEndpoint = (endpoint: string) => {
    updateSettings({ ollamaEndpoint: endpoint });
  };

  const setOllamaModel = (model: string) => {
    updateSettings({ ollamaModel: model });
  };

  const toggleTools = () => {
    updateSettings({ enableTools: !storedSettings.enableTools });
  };

  return {
    settings,
    updateSettings,
    setProvider,
    setAnthropicKey,
    setOllamaEndpoint,
    setOllamaModel,
    toggleTools,
  };
}
