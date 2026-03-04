import { useState } from 'react';
import {
  X,
  Star,
  Download,
  Check,
  Shield,
  Layout,
  Zap,
  Puzzle,
  Grid3X3,
  Bot,
  Sparkles,
} from 'lucide-react';
import type { MarketplaceApp, AppCategory, TemplateDefinition } from '../../types/marketplace';

const categoryLabels: Record<AppCategory, string> = {
  templates: 'Templates',
  productivity: 'Productivity',
  communication: 'Communication',
  reporting: 'Reporting',
  integrations: 'Integrations',
  views: 'Views',
  automation: 'Automation',
  widgets: 'Widgets',
};

interface AppDetailModalProps {
  app: MarketplaceApp;
  isInstalled: boolean;
  onInstall: () => void;
  onUninstall: () => void;
  onClose: () => void;
  onUseTemplate?: (template: TemplateDefinition) => void;
}

export function AppDetailModal({ app, isInstalled, onInstall, onUninstall, onClose, onUseTemplate }: AppDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'features' | 'reviews'>('overview');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-violet-600 to-indigo-600 text-white p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-4xl flex-shrink-0">
              {app.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-bold">{app.name}</h2>
                {app.featured && (
                  <span className="bg-amber-400 text-amber-900 text-xs px-2 py-0.5 rounded-full font-medium">
                    Featured
                  </span>
                )}
                {app.premium && (
                  <span className="bg-amber-400/20 text-amber-200 text-xs px-2 py-0.5 rounded-full">
                    Premium
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-violet-200 mb-3">
                <span>By {app.author.name}</span>
                {app.author.verified && (
                  <Shield className="w-4 h-4 text-white" />
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <span className="font-medium">{app.rating.average.toFixed(1)}</span>
                  <span className="text-violet-200">({app.rating.count} reviews)</span>
                </div>
                <div className="flex items-center gap-1 text-violet-200">
                  <Download className="w-4 h-4" />
                  <span>{app.installs.toLocaleString()} installs</span>
                </div>
                <span className="bg-white/20 px-2 py-0.5 rounded text-sm">v{app.version}</span>
              </div>
            </div>
          </div>

          {/* Install Button */}
          <div className="absolute bottom-6 right-6">
            {isInstalled ? (
              <button
                onClick={onUninstall}
                className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors"
              >
                <Check className="w-5 h-5" />
                Installed
              </button>
            ) : (
              <button
                onClick={onInstall}
                className="flex items-center gap-2 px-6 py-3 bg-white text-violet-600 rounded-xl font-medium hover:bg-violet-50 transition-colors"
              >
                <Download className="w-5 h-5" />
                Install App
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6">
          <nav className="flex gap-6">
            {(['overview', 'features', 'reviews'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 border-b-2 font-medium text-sm capitalize transition-colors ${
                  activeTab === tab
                    ? 'border-violet-600 text-violet-600 dark:text-violet-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Description</h3>
                <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
                  {app.longDescription || app.description}
                </p>
              </div>

              {/* Tags */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full text-sm">
                    {categoryLabels[app.category]}
                  </span>
                  {app.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Meta Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Category</div>
                  <div className="font-medium text-gray-900 dark:text-white">{categoryLabels[app.category]}</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Version</div>
                  <div className="font-medium text-gray-900 dark:text-white">{app.version}</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Updated</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {new Date(app.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Released</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {new Date(app.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Requirements */}
              {app.requirements && app.requirements.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Requirements</h3>
                  <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
                    {app.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'features' && (
            <div className="space-y-6">
              {/* Widgets */}
              {app.provides?.widgets && app.provides.widgets.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Grid3X3 className="w-5 h-5 text-violet-600" />
                    Widgets ({app.provides.widgets.length})
                  </h3>
                  <div className="grid gap-3">
                    {app.provides.widgets.map((widget) => (
                      <div
                        key={widget.id}
                        className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                      >
                        <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-xl">
                          {widget.icon}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{widget.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{widget.description}</p>
                          <span className="text-xs text-gray-500 dark:text-gray-500 mt-1 inline-block">
                            Size: {widget.size}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Templates */}
              {app.provides?.templates && app.provides.templates.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Layout className="w-5 h-5 text-violet-600" />
                    Templates ({app.provides.templates.length})
                  </h3>
                  <div className="grid gap-3">
                    {app.provides.templates.map((template) => (
                      <div
                        key={template.id}
                        className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                      >
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                          style={{ backgroundColor: template.color + '20' }}
                        >
                          {template.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">{template.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{template.description}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-500">
                            <span>{template.tasks.length} tasks</span>
                            {template.milestones && <span>{template.milestones.length} milestones</span>}
                            {template.estimatedDuration && <span>Est: {template.estimatedDuration}</span>}
                          </div>
                        </div>
                        {onUseTemplate && isInstalled && (
                          <button
                            onClick={() => onUseTemplate(template)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 transition-colors"
                          >
                            <Sparkles className="w-4 h-4" />
                            Use
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Automations */}
              {app.provides?.automations && app.provides.automations.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Bot className="w-5 h-5 text-violet-600" />
                    Automations ({app.provides.automations.length})
                  </h3>
                  <div className="grid gap-3">
                    {app.provides.automations.map((automation) => (
                      <div
                        key={automation.id}
                        className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                      >
                        <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                          <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{automation.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{automation.description}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                              Trigger: {automation.trigger}
                            </span>
                            {automation.actions.map((action, i) => (
                              <span
                                key={i}
                                className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded"
                              >
                                {action}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Integrations */}
              {app.provides?.integrations && app.provides.integrations.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Puzzle className="w-5 h-5 text-violet-600" />
                    Integrations ({app.provides.integrations.length})
                  </h3>
                  <div className="grid gap-3">
                    {app.provides.integrations.map((integration) => (
                      <div
                        key={integration.id}
                        className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                      >
                        <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-xl">
                          {integration.icon}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{integration.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{integration.description}</p>
                          <span className="text-xs text-gray-500 dark:text-gray-500 mt-1 inline-block">
                            Auth: {integration.authType}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No features */}
              {!app.provides && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Puzzle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No additional features specified for this app.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-6">
              {/* Rating Summary */}
              <div className="flex items-center gap-8 p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div className="text-center">
                  <div className="text-5xl font-bold text-gray-900 dark:text-white">{app.rating.average.toFixed(1)}</div>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= Math.round(app.rating.average)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-gray-300 dark:text-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{app.rating.count} reviews</div>
                </div>

                {/* Rating Bars */}
                <div className="flex-1 space-y-2">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    // Simulated distribution
                    const percentage = stars === 5 ? 65 : stars === 4 ? 20 : stars === 3 ? 10 : stars === 2 ? 3 : 2;
                    return (
                      <div key={stars} className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400 w-3">{stars}</span>
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400 w-8">{percentage}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sample Reviews */}
              <div className="space-y-4">
                {[
                  { name: 'Sarah M.', rating: 5, text: 'Exactly what I needed for my onboarding workflow. The templates are well thought out and save me hours of setup time.', date: '2 weeks ago' },
                  { name: 'James K.', rating: 4, text: 'Great app overall. Would love to see more customization options in future updates.', date: '1 month ago' },
                  { name: 'Emily R.', rating: 5, text: 'This has transformed how we handle client onboarding. Highly recommended!', date: '1 month ago' },
                ].map((review, index) => (
                  <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-sm font-medium text-violet-600 dark:text-violet-400">
                          {review.name[0]}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">{review.name}</span>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{review.date}</span>
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= review.rating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">{review.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
