import { useState, useEffect } from 'react';
import { useAISettings } from '../../hooks/useAISettings';
import { useOllamaChat } from '../../hooks/useOllamaChat';
import type { AIProvider, OllamaModel } from '../../types';

export function AISettingsPanel() {
  const { settings, updateSettings, setProvider } = useAISettings();
  const { checkConnection, listModels, isConnected } = useOllamaChat(settings.ollamaEndpoint);

  const [ollamaModels, setOllamaModels] = useState<OllamaModel[]>([]);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Check Ollama connection when endpoint changes
  useEffect(() => {
    if (settings.provider === 'ollama') {
      handleCheckConnection();
    }
  }, [settings.ollamaEndpoint, settings.provider]);

  const handleCheckConnection = async () => {
    setIsCheckingConnection(true);
    const connected = await checkConnection();
    if (connected) {
      const models = await listModels();
      setOllamaModels(models);
    }
    setIsCheckingConnection(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          AI Provider Settings
        </h3>

        {/* Provider Selection */}
        <div className="space-y-3 mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            AI Provider
          </label>
          <div className="grid grid-cols-2 gap-3">
            <ProviderCard
              provider="anthropic"
              title="Claude API"
              description="Powerful AI with tool use capabilities"
              icon="🤖"
              badge="Cloud"
              badgeColor="blue"
              selected={settings.provider === 'anthropic'}
              onClick={() => setProvider('anthropic')}
            />
            <ProviderCard
              provider="ollama"
              title="Ollama (Local)"
              description="Private, runs entirely on your machine"
              icon="🏠"
              badge="Private"
              badgeColor="green"
              selected={settings.provider === 'ollama'}
              onClick={() => setProvider('ollama')}
            />
          </div>
        </div>

        {/* Provider-specific settings */}
        {settings.provider === 'anthropic' ? (
          <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🤖</span>
              <h4 className="font-medium text-gray-900 dark:text-white">Claude API Settings</h4>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                API Key
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={settings.anthropicApiKey || ''}
                  onChange={(e) => updateSettings({ anthropicApiKey: e.target.value })}
                  placeholder="sk-ant-api..."
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                >
                  {showApiKey ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Get your API key from{' '}
                <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="text-violet-600 dark:text-violet-400 hover:underline">
                  console.anthropic.com
                </a>
              </p>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex gap-2">
                <span className="text-amber-500">⚠️</span>
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Data Privacy Notice</p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                    When using Claude API, your messages are sent to Anthropic's servers.
                    For sensitive client data, consider using Ollama (local mode).
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🏠</span>
              <h4 className="font-medium text-gray-900 dark:text-white">Ollama Settings (Local AI)</h4>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ollama Endpoint
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={settings.ollamaEndpoint}
                  onChange={(e) => updateSettings({ ollamaEndpoint: e.target.value })}
                  placeholder="http://localhost:11434"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500"
                />
                <button
                  onClick={handleCheckConnection}
                  disabled={isCheckingConnection}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {isCheckingConnection ? 'Checking...' : 'Test'}
                </button>
              </div>
            </div>

            {/* Connection Status */}
            <div className={`p-3 rounded-lg ${
              isConnected === null
                ? 'bg-gray-100 dark:bg-gray-700'
                : isConnected
                ? 'bg-green-100 dark:bg-green-900/30'
                : 'bg-red-100 dark:bg-red-900/30'
            }`}>
              <div className="flex items-center gap-2">
                {isConnected === null ? (
                  <>
                    <span className="text-gray-500">○</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Not tested</span>
                  </>
                ) : isConnected ? (
                  <>
                    <span className="text-green-500">●</span>
                    <span className="text-sm text-green-700 dark:text-green-300">Connected to Ollama</span>
                  </>
                ) : (
                  <>
                    <span className="text-red-500">●</span>
                    <span className="text-sm text-red-700 dark:text-red-300">Cannot connect to Ollama</span>
                  </>
                )}
              </div>
            </div>

            {/* Model Selection */}
            {isConnected && ollamaModels.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Model
                </label>
                <select
                  value={settings.ollamaModel}
                  onChange={(e) => updateSettings({ ollamaModel: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500"
                >
                  {ollamaModels.map(model => (
                    <option key={model.name} value={model.name}>
                      {model.name} ({formatBytes(model.size)})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* No models warning */}
            {isConnected && ollamaModels.length === 0 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  No models found. Pull a model using: <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">ollama pull llama3</code>
                </p>
              </div>
            )}

            <div className="p-3 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex gap-2">
                <span className="text-green-500">🔒</span>
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">Data Never Leaves Your Machine</p>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                    All AI processing happens locally. Your client data stays private and secure.
                  </p>
                </div>
              </div>
            </div>

            {/* Ollama installation help */}
            {!isConnected && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p className="font-medium mb-2">Don't have Ollama installed?</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Download from <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" className="text-violet-600 dark:text-violet-400 hover:underline">ollama.ai</a></li>
                  <li>Install and run Ollama</li>
                  <li>Pull a model: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">ollama pull llama3</code></li>
                  <li>Click "Test" above to verify connection</li>
                </ol>
              </div>
            )}
          </div>
        )}

        {/* Tool use toggle */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Enable AI Actions</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Allow AI to perform actions like adding tasks and updating clients
                {settings.provider === 'ollama' && ' (limited support with local models)'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => updateSettings({ enableTools: !settings.enableTools })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.enableTools ? 'bg-violet-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
              disabled={settings.provider === 'ollama'}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.enableTools ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ProviderCardProps {
  provider: AIProvider;
  title: string;
  description: string;
  icon: string;
  badge: string;
  badgeColor: 'blue' | 'green';
  selected: boolean;
  onClick: () => void;
}

function ProviderCard({ title, description, icon, badge, badgeColor, selected, onClick }: ProviderCardProps) {
  const badgeColors = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-4 rounded-xl border-2 text-left transition-all ${
        selected
          ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${badgeColors[badgeColor]}`}>
          {badge}
        </span>
      </div>
      <h4 className="font-medium text-gray-900 dark:text-white">{title}</h4>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>
    </button>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
