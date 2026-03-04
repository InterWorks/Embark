import { useState, useMemo } from 'react';
import {
  Store,
  Search,
  Star,
  Download,
  Check,
  Sparkles,
  Layout,
  Zap,
  MessageSquare,
  BarChart3,
  Puzzle,
  Eye,
  Bot,
  Grid3X3,
  X,
  Shield,
} from 'lucide-react';
import { useMarketplace } from '../../hooks/useMarketplace';
import type { MarketplaceApp, AppCategory, TemplateDefinition } from '../../types/marketplace';
import { AppDetailModal } from './AppDetailModal';
import { InstalledAppsManager } from './InstalledAppsManager';
import { TemplateApplicator } from './TemplateApplicator';

const categoryConfig: Record<AppCategory, { icon: React.ElementType; label: string; description: string }> = {
  templates: { icon: Layout, label: 'Templates', description: 'Industry-specific onboarding templates' },
  productivity: { icon: Zap, label: 'Productivity', description: 'Boost your workflow efficiency' },
  communication: { icon: MessageSquare, label: 'Communication', description: 'Connect with clients and teams' },
  reporting: { icon: BarChart3, label: 'Reporting', description: 'Analytics and insights' },
  integrations: { icon: Puzzle, label: 'Integrations', description: 'Connect external services' },
  views: { icon: Eye, label: 'Views', description: 'New ways to visualize data' },
  automation: { icon: Bot, label: 'Automation', description: 'Automate repetitive tasks' },
  widgets: { icon: Grid3X3, label: 'Widgets', description: 'Dashboard components' },
};

export function MarketplaceView() {
  const {
    allApps,
    featuredApps,
    searchApps,
    getAppsByCategory,
    isInstalled,
    installApp,
    uninstallApp,
    installedAppsWithDetails,
  } = useMarketplace();

  const [selectedCategory, setSelectedCategory] = useState<AppCategory | 'all' | 'featured' | 'installed'>('featured');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState<MarketplaceApp | null>(null);
  const [showInstalled, setShowInstalled] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateDefinition | null>(null);

  const displayedApps = useMemo(() => {
    if (searchQuery) {
      return searchApps(searchQuery);
    }
    if (selectedCategory === 'featured') {
      return featuredApps;
    }
    if (selectedCategory === 'all') {
      return allApps;
    }
    if (selectedCategory === 'installed') {
      return installedAppsWithDetails.map(i => i.app).filter(Boolean) as MarketplaceApp[];
    }
    return getAppsByCategory(selectedCategory);
  }, [selectedCategory, searchQuery, allApps, featuredApps, searchApps, getAppsByCategory, installedAppsWithDetails]);

  const handleInstall = (appId: string) => {
    installApp(appId);
  };

  const handleUninstall = (appId: string) => {
    uninstallApp(appId);
  };

  return (
    <div className="h-full flex bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Store className="w-6 h-6 text-violet-600" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Marketplace</h1>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search apps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2">
          <div className="mb-4">
            <button
              onClick={() => { setSelectedCategory('featured'); setSearchQuery(''); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                selectedCategory === 'featured'
                  ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Sparkles className="w-5 h-5" />
              <span className="font-medium">Featured</span>
            </button>

            <button
              onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Store className="w-5 h-5" />
              <span className="font-medium">All Apps</span>
            </button>

            <button
              onClick={() => { setSelectedCategory('installed'); setSearchQuery(''); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                selectedCategory === 'installed'
                  ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Download className="w-5 h-5" />
              <span className="font-medium">Installed</span>
              {installedAppsWithDetails.length > 0 && (
                <span className="ml-auto bg-violet-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {installedAppsWithDetails.length}
                </span>
              )}
            </button>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <p className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Categories
            </p>
            {(Object.entries(categoryConfig) as [AppCategory, typeof categoryConfig[AppCategory]][]).map(([category, config]) => {
              const Icon = config.icon;
              const count = getAppsByCategory(category).length;
              return (
                <button
                  key={category}
                  onClick={() => { setSelectedCategory(category); setSearchQuery(''); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    selectedCategory === category
                      ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{config.label}</span>
                  <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">{count}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Manage Installed */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowInstalled(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Puzzle className="w-4 h-4" />
            <span className="text-sm font-medium">Manage Apps</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white p-8">
          <h2 className="text-3xl font-bold mb-2">
            {selectedCategory === 'featured' && 'Featured Apps'}
            {selectedCategory === 'all' && 'All Apps'}
            {selectedCategory === 'installed' && 'Installed Apps'}
            {selectedCategory !== 'featured' && selectedCategory !== 'all' && selectedCategory !== 'installed' && categoryConfig[selectedCategory]?.label}
          </h2>
          <p className="text-violet-200">
            {selectedCategory === 'featured' && 'Discover our top-rated and most popular apps'}
            {selectedCategory === 'all' && 'Browse all available apps and integrations'}
            {selectedCategory === 'installed' && 'Manage your installed apps and configurations'}
            {selectedCategory !== 'featured' && selectedCategory !== 'all' && selectedCategory !== 'installed' && categoryConfig[selectedCategory]?.description}
          </p>
          {searchQuery && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-violet-200">Searching for:</span>
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm">{searchQuery}</span>
              <button
                onClick={() => setSearchQuery('')}
                className="p-1 hover:bg-white/20 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* App Grid */}
        <div className="p-6">
          {displayedApps.length === 0 ? (
            <div className="text-center py-12">
              <Store className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchQuery ? 'No apps found' : 'No apps in this category'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {searchQuery ? 'Try a different search term' : 'Check back later for new additions'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedApps.map((app) => (
                <AppCard
                  key={app.id}
                  app={app}
                  isInstalled={isInstalled(app.id)}
                  onInstall={() => handleInstall(app.id)}
                  onUninstall={() => handleUninstall(app.id)}
                  onViewDetails={() => setSelectedApp(app)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* App Detail Modal */}
      {selectedApp && (
        <AppDetailModal
          app={selectedApp}
          isInstalled={isInstalled(selectedApp.id)}
          onInstall={() => handleInstall(selectedApp.id)}
          onUninstall={() => handleUninstall(selectedApp.id)}
          onClose={() => setSelectedApp(null)}
          onUseTemplate={(template) => {
            setSelectedTemplate(template);
            setSelectedApp(null);
          }}
        />
      )}

      {/* Template Applicator */}
      {selectedTemplate && (
        <TemplateApplicator
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          onSuccess={() => {
            setSelectedTemplate(null);
            // Client created successfully
          }}
        />
      )}

      {/* Installed Apps Manager */}
      {showInstalled && (
        <InstalledAppsManager onClose={() => setShowInstalled(false)} />
      )}
    </div>
  );
}

interface AppCardProps {
  app: MarketplaceApp;
  isInstalled: boolean;
  onInstall: () => void;
  onUninstall: () => void;
  onViewDetails: () => void;
}

function AppCard({ app, isInstalled, onInstall, onUninstall, onViewDetails }: AppCardProps) {
  const CategoryIcon = categoryConfig[app.category]?.icon || Puzzle;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-2xl flex-shrink-0">
            {app.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">{app.name}</h3>
              {app.featured && (
                <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
              )}
              {app.new && (
                <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs px-1.5 py-0.5 rounded">
                  New
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">{app.rating.average.toFixed(1)}</span>
              </div>
              <span className="text-gray-300 dark:text-gray-600">•</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">{app.installs.toLocaleString()} installs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
          {app.description}
        </p>

        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs">
            <CategoryIcon className="w-3 h-3" />
            {categoryConfig[app.category]?.label}
          </span>
          {app.premium && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded text-xs">
              Premium
            </span>
          )}
        </div>

        {/* Author */}
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
          <span>By {app.author.name}</span>
          {app.author.verified && (
            <Shield className="w-4 h-4 text-blue-500" />
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onViewDetails}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            View Details
          </button>
          {isInstalled ? (
            <button
              onClick={onUninstall}
              className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
            >
              <Check className="w-4 h-4" />
              Installed
            </button>
          ) : (
            <button
              onClick={onInstall}
              className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Install
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
