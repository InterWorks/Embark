import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { marketplaceApps, searchApps, getAppsByCategory, getFeaturedApps } from '../data/marketplaceApps';
import type { InstalledApp, DashboardWidget, DashboardLayout } from '../types/marketplace';

export function useMarketplace() {
  const [installedApps, setInstalledApps] = useLocalStorage<InstalledApp[]>('installed-apps', []);
  const [dashboardLayouts, setDashboardLayouts] = useLocalStorage<DashboardLayout[]>('dashboard-layouts', []);
  const [activeLayoutId, setActiveLayoutId] = useLocalStorage<string | null>('active-layout-id', null);

  // Install an app
  const installApp = useCallback((appId: string, config?: Record<string, unknown>) => {
    const app = marketplaceApps.find(a => a.id === appId);
    if (!app) return false;

    // Check if already installed
    if (installedApps.some(a => a.appId === appId)) return false;

    const newInstall: InstalledApp = {
      appId,
      installedAt: new Date().toISOString(),
      enabled: true,
      config,
    };

    setInstalledApps(prev => [...prev, newInstall]);
    return true;
  }, [installedApps, setInstalledApps]);

  // Uninstall an app
  const uninstallApp = useCallback((appId: string) => {
    setInstalledApps(prev => prev.filter(a => a.appId !== appId));

    // Also remove any widgets from this app from layouts
    setDashboardLayouts(prev =>
      prev.map(layout => ({
        ...layout,
        widgets: layout.widgets.filter(w => w.appId !== appId),
      }))
    );
  }, [setInstalledApps, setDashboardLayouts]);

  // Toggle app enabled/disabled
  const toggleApp = useCallback((appId: string) => {
    setInstalledApps(prev =>
      prev.map(a => a.appId === appId ? { ...a, enabled: !a.enabled } : a)
    );
  }, [setInstalledApps]);

  // Update app config
  const updateAppConfig = useCallback((appId: string, config: Record<string, unknown>) => {
    setInstalledApps(prev =>
      prev.map(a => a.appId === appId ? { ...a, config: { ...a.config, ...config } } : a)
    );
  }, [setInstalledApps]);

  // Check if app is installed
  const isInstalled = useCallback((appId: string) => {
    return installedApps.some(a => a.appId === appId);
  }, [installedApps]);

  // Get installed app details
  const getInstalledApp = useCallback((appId: string) => {
    return installedApps.find(a => a.appId === appId);
  }, [installedApps]);

  // Get full app details for installed apps
  const installedAppsWithDetails = useMemo(() => {
    return installedApps.map(installed => ({
      ...installed,
      app: marketplaceApps.find(a => a.id === installed.appId),
    })).filter(a => a.app);
  }, [installedApps]);

  // Dashboard layout management
  const createLayout = useCallback((name: string) => {
    const newLayout: DashboardLayout = {
      id: crypto.randomUUID(),
      name,
      widgets: [],
      createdAt: new Date().toISOString(),
    };
    setDashboardLayouts(prev => [...prev, newLayout]);
    return newLayout;
  }, [setDashboardLayouts]);

  const deleteLayout = useCallback((layoutId: string) => {
    setDashboardLayouts(prev => prev.filter(l => l.id !== layoutId));
    if (activeLayoutId === layoutId) {
      setActiveLayoutId(null);
    }
  }, [activeLayoutId, setDashboardLayouts, setActiveLayoutId]);

  const addWidgetToLayout = useCallback((layoutId: string, widget: Omit<DashboardWidget, 'id'>) => {
    const newWidget: DashboardWidget = {
      ...widget,
      id: crypto.randomUUID(),
    };

    setDashboardLayouts(prev =>
      prev.map(l => l.id === layoutId
        ? { ...l, widgets: [...l.widgets, newWidget] }
        : l
      )
    );
    return newWidget;
  }, [setDashboardLayouts]);

  const removeWidgetFromLayout = useCallback((layoutId: string, widgetId: string) => {
    setDashboardLayouts(prev =>
      prev.map(l => l.id === layoutId
        ? { ...l, widgets: l.widgets.filter(w => w.id !== widgetId) }
        : l
      )
    );
  }, [setDashboardLayouts]);

  const updateWidgetConfig = useCallback((layoutId: string, widgetId: string, config: Record<string, unknown>) => {
    setDashboardLayouts(prev =>
      prev.map(l => l.id === layoutId
        ? {
            ...l,
            widgets: l.widgets.map(w =>
              w.id === widgetId ? { ...w, config: { ...w.config, ...config } } : w
            ),
          }
        : l
      )
    );
  }, [setDashboardLayouts]);

  const updateWidgetPosition = useCallback((
    layoutId: string,
    widgetId: string,
    position: { x: number; y: number },
    size?: { width: number; height: number }
  ) => {
    setDashboardLayouts(prev =>
      prev.map(l => l.id === layoutId
        ? {
            ...l,
            widgets: l.widgets.map(w =>
              w.id === widgetId ? { ...w, position, ...(size ? { size } : {}) } : w
            ),
          }
        : l
      )
    );
  }, [setDashboardLayouts]);

  // Get active layout
  const activeLayout = useMemo(() => {
    return dashboardLayouts.find(l => l.id === activeLayoutId) || dashboardLayouts[0];
  }, [dashboardLayouts, activeLayoutId]);

  // Get available widgets from installed apps
  const availableWidgets = useMemo(() => {
    return installedAppsWithDetails
      .filter(a => a.enabled && a.app?.provides?.widgets)
      .flatMap(a => a.app!.provides!.widgets!.map(w => ({ ...w, appId: a.appId })));
  }, [installedAppsWithDetails]);

  // Get available templates from installed apps
  const availableTemplates = useMemo(() => {
    return installedAppsWithDetails
      .filter(a => a.enabled && a.app?.provides?.templates)
      .flatMap(a => a.app!.provides!.templates!.map(t => ({ ...t, appId: a.appId })));
  }, [installedAppsWithDetails]);

  return {
    // All marketplace apps
    allApps: marketplaceApps,
    featuredApps: getFeaturedApps(),
    searchApps,
    getAppsByCategory,

    // Installed apps
    installedApps,
    installedAppsWithDetails,
    installApp,
    uninstallApp,
    toggleApp,
    updateAppConfig,
    isInstalled,
    getInstalledApp,

    // Dashboard layouts
    dashboardLayouts,
    activeLayout,
    activeLayoutId,
    setActiveLayoutId,
    createLayout,
    deleteLayout,
    addWidgetToLayout,
    removeWidgetFromLayout,
    updateWidgetConfig,
    updateWidgetPosition,

    // Available features from installed apps
    availableWidgets,
    availableTemplates,
  };
}
