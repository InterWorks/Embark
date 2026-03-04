import { useState } from 'react';
import {
  X,
  Puzzle,
  Trash2,
  Settings,
  AlertCircle,
  Search,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { useMarketplace } from '../../hooks/useMarketplace';

interface InstalledAppsManagerProps {
  onClose: () => void;
}

export function InstalledAppsManager({ onClose }: InstalledAppsManagerProps) {
  const {
    installedAppsWithDetails,
    toggleApp,
    uninstallApp,
  } = useMarketplace();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [confirmUninstall, setConfirmUninstall] = useState<string | null>(null);

  const filteredApps = installedAppsWithDetails.filter((installed) =>
    installed.app?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUninstall = (appId: string) => {
    uninstallApp(appId);
    setConfirmUninstall(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Manage Installed Apps</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {installedAppsWithDetails.length} app{installedAppsWithDetails.length !== 1 ? 's' : ''} installed
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        {installedAppsWithDetails.length > 0 && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search installed apps..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* App List */}
        <div className="flex-1 overflow-y-auto p-4">
          {installedAppsWithDetails.length === 0 ? (
            <div className="text-center py-12">
              <Puzzle className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No apps installed
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Browse the marketplace to find apps to enhance your workflow.
              </p>
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                No apps match your search.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredApps.map((installed) => {
                const app = installed.app;
                if (!app) return null;

                return (
                  <div
                    key={installed.appId}
                    className={`border rounded-xl overflow-hidden transition-all ${
                      installed.enabled
                        ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-75'
                    }`}
                  >
                    <div className="flex items-center gap-4 p-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
                          installed.enabled
                            ? 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      >
                        {app.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900 dark:text-white truncate">{app.name}</h3>
                          {!installed.enabled && (
                            <span className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">
                              Disabled
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{app.description}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          Installed {new Date(installed.installedAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Toggle Enable/Disable */}
                        <button
                          onClick={() => toggleApp(installed.appId)}
                          className={`p-2 rounded-lg transition-colors ${
                            installed.enabled
                              ? 'text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30'
                              : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                          title={installed.enabled ? 'Disable app' : 'Enable app'}
                        >
                          {installed.enabled ? (
                            <ToggleRight className="w-6 h-6" />
                          ) : (
                            <ToggleLeft className="w-6 h-6" />
                          )}
                        </button>

                        {/* Settings */}
                        <button
                          onClick={() => setSelectedApp(selectedApp === installed.appId ? null : installed.appId)}
                          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Configure app"
                        >
                          <Settings className="w-5 h-5" />
                        </button>

                        {/* Uninstall */}
                        <button
                          onClick={() => setConfirmUninstall(installed.appId)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Uninstall app"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Expanded Settings */}
                    {selectedApp === installed.appId && (
                      <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">App Configuration</h4>

                        {/* Show what the app provides */}
                        <div className="space-y-3">
                          {app.provides?.widgets && app.provides.widgets.length > 0 && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <span className="font-medium">Widgets:</span>
                              <span>{app.provides.widgets.map(w => w.name).join(', ')}</span>
                            </div>
                          )}
                          {app.provides?.templates && app.provides.templates.length > 0 && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <span className="font-medium">Templates:</span>
                              <span>{app.provides.templates.map(t => t.name).join(', ')}</span>
                            </div>
                          )}
                          {app.provides?.automations && app.provides.automations.length > 0 && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <span className="font-medium">Automations:</span>
                              <span>{app.provides.automations.map(a => a.name).join(', ')}</span>
                            </div>
                          )}
                          {app.provides?.integrations && app.provides.integrations.length > 0 && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <span className="font-medium">Integrations:</span>
                              <span>{app.provides.integrations.map(i => i.name).join(', ')}</span>
                            </div>
                          )}
                        </div>

                        {/* Config stored */}
                        {installed.config && Object.keys(installed.config).length > 0 && (
                          <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                            <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Stored Configuration</h5>
                            <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-x-auto">
                              {JSON.stringify(installed.config, null, 2)}
                            </pre>
                          </div>
                        )}

                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                          Version {app.version} • By {app.author.name}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Confirm Uninstall Modal */}
        {confirmUninstall && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Uninstall App?</h3>
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to uninstall this app? This will remove all associated widgets from your dashboards and any stored configuration.
              </p>

              <div className="flex items-center gap-3 justify-end">
                <button
                  onClick={() => setConfirmUninstall(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUninstall(confirmUninstall)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  Uninstall
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
