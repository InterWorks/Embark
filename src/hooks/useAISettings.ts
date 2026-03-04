import { useLocalStorage } from './useLocalStorage';
import type { AISettings, AIProvider } from '../types';

const defaultSettings: AISettings = {
  provider: 'anthropic',
  anthropicApiKey: '',
  anthropicModel: 'claude-sonnet-4-20250514',
  ollamaEndpoint: 'http://localhost:11434',
  ollamaModel: 'llama3',
  enableTools: true,
  maxTokens: 4096,
};

export function useAISettings() {
  const [settings, setSettings] = useLocalStorage<AISettings>('embark-ai-settings', defaultSettings);

  const updateSettings = (updates: Partial<AISettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const setProvider = (provider: AIProvider) => {
    updateSettings({ provider });
  };

  const setAnthropicKey = (key: string) => {
    updateSettings({ anthropicApiKey: key });
  };

  const setOllamaEndpoint = (endpoint: string) => {
    updateSettings({ ollamaEndpoint: endpoint });
  };

  const setOllamaModel = (model: string) => {
    updateSettings({ ollamaModel: model });
  };

  const toggleTools = () => {
    updateSettings({ enableTools: !settings.enableTools });
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
