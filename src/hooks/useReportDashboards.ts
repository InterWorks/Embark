import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { generateId } from '../utils/helpers';
import type { ReportDashboard, DashboardWidget } from '../types/reportBuilder';

export function useReportDashboards() {
  const [dashboards, setDashboards] = useLocalStorage<ReportDashboard[]>('embark-report-dashboards', []);

  const addDashboard = useCallback((name: string, widgets: DashboardWidget[] = []): ReportDashboard => {
    const now = new Date().toISOString();
    const dashboard: ReportDashboard = {
      id: generateId(),
      name,
      widgets,
      createdAt: now,
      updatedAt: now,
    };
    setDashboards(prev => [...prev, dashboard]);
    return dashboard;
  }, [setDashboards]);

  const updateDashboard = useCallback((id: string, updates: Partial<Omit<ReportDashboard, 'id' | 'createdAt'>>) => {
    setDashboards(prev =>
      prev.map(d => d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d)
    );
  }, [setDashboards]);

  const deleteDashboard = useCallback((id: string) => {
    setDashboards(prev => prev.filter(d => d.id !== id));
  }, [setDashboards]);

  const renameDashboard = useCallback((id: string, name: string) => {
    setDashboards(prev =>
      prev.map(d => d.id === id ? { ...d, name, updatedAt: new Date().toISOString() } : d)
    );
  }, [setDashboards]);

  const updateWidgets = useCallback((id: string, widgets: DashboardWidget[]) => {
    setDashboards(prev =>
      prev.map(d => d.id === id ? { ...d, widgets, updatedAt: new Date().toISOString() } : d)
    );
  }, [setDashboards]);

  return {
    dashboards,
    addDashboard,
    updateDashboard,
    deleteDashboard,
    renameDashboard,
    updateWidgets,
  };
}
