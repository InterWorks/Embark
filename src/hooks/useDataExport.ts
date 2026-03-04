import { useCallback } from 'react';

// All localStorage keys used by Embark
const EMBARK_STORAGE_KEYS = [
  'onboarding-clients',
  'checklist-templates',
  'embark-tags',
  'time-blocks',
  'embark-daily-entries',
  'calendar-connections',
  'calendar-events',
  'embark-team',
  'embark-notifications',
  'notification-preferences',
  'embark-automation-rules',
  'ai-settings',
  'embark-ai-conversations',
  'embark-bud-conversations',
  'embark-buds',
  'embark-custom-fields',
  'embark-notes-templates',
  'embark-email-templates',
  'embark-theme',
  'embark-color-theme',
  'embark-sidebar-collapsed',
  'embark-webhook-endpoints',
  'embark-webhook-deliveries',
  'embark-sla-definitions',
  'embark-report-dashboards',
] as const;

export interface EmbarkExportData {
  version: string;
  exportedAt: string;
  data: Record<string, unknown>;
}

export function useDataExport() {
  const exportData = useCallback((): EmbarkExportData => {
    const data: Record<string, unknown> = {};

    EMBARK_STORAGE_KEYS.forEach((key) => {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          data[key] = JSON.parse(value);
        } catch {
          data[key] = value;
        }
      }
    });

    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      data,
    };
  }, []);

  const downloadExport = useCallback(() => {
    const exportedData = exportData();
    const blob = new Blob([JSON.stringify(exportedData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `embark-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [exportData]);

  const importData = useCallback((file: File): Promise<{ success: boolean; message: string; keysImported?: number }> => {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const imported = JSON.parse(content) as EmbarkExportData;

          // Validate structure
          if (!imported.version || !imported.data) {
            resolve({
              success: false,
              message: 'Invalid backup file format. Missing version or data.',
            });
            return;
          }

          // Import each key
          let keysImported = 0;
          Object.entries(imported.data).forEach(([key, value]) => {
            if (EMBARK_STORAGE_KEYS.includes(key as typeof EMBARK_STORAGE_KEYS[number])) {
              localStorage.setItem(key, JSON.stringify(value));
              keysImported++;
            }
          });

          resolve({
            success: true,
            message: `Successfully imported ${keysImported} data categories.`,
            keysImported,
          });
        } catch (error) {
          resolve({
            success: false,
            message: `Failed to parse backup file: ${error instanceof Error ? error.message : 'Unknown error'}`,
          });
        }
      };

      reader.onerror = () => {
        resolve({
          success: false,
          message: 'Failed to read file.',
        });
      };

      reader.readAsText(file);
    });
  }, []);

  const getStorageStats = useCallback(() => {
    let totalSize = 0;
    const stats: Record<string, number> = {};

    EMBARK_STORAGE_KEYS.forEach((key) => {
      const value = localStorage.getItem(key);
      if (value) {
        const size = new Blob([value]).size;
        stats[key] = size;
        totalSize += size;
      }
    });

    return {
      totalSize,
      totalSizeFormatted: formatBytes(totalSize),
      byKey: stats,
    };
  }, []);

  return {
    exportData,
    downloadExport,
    importData,
    getStorageStats,
  };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
