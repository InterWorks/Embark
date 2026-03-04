import { useCallback } from 'react';
import type { Client, CommunicationLogEntry } from '../types';
import { generateId } from '../utils/helpers';

const CLIENTS_KEY = 'embark-clients';
const PORTAL_VIEWS_PREFIX = 'embark_portal_views_';

function readClients(): Client[] {
  try {
    const raw = localStorage.getItem(CLIENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeClients(clients: Client[]) {
  const value = JSON.stringify(clients);
  localStorage.setItem(CLIENTS_KEY, value);
  window.dispatchEvent(new StorageEvent('storage', { key: CLIENTS_KEY, newValue: value }));
}

export function usePortalWriter(clientId: string) {
  const completeTask = useCallback((taskId: string) => {
    const clients = readClients();
    const updated = clients.map(c => {
      if (c.id !== clientId) return c;
      return {
        ...c,
        checklist: c.checklist.map(item =>
          item.id === taskId ? { ...item, completed: true, status: 'done' as const } : item
        ),
        activityLog: [
          ...c.activityLog,
          {
            id: generateId(),
            type: 'task_completed' as const,
            description: `Task completed via client portal`,
            timestamp: new Date().toISOString(),
          },
        ],
      };
    });
    writeClients(updated);
  }, [clientId]);

  const addComment = useCallback((taskId: string, text: string) => {
    const clients = readClients();
    const updated = clients.map(c => {
      if (c.id !== clientId) return c;
      return {
        ...c,
        checklist: c.checklist.map(item => {
          if (item.id !== taskId) return item;
          return {
            ...item,
            comments: [
              ...(item.comments ?? []),
              {
                id: generateId(),
                text,
                author: 'Client',
                createdAt: new Date().toISOString(),
              },
            ],
          };
        }),
      };
    });
    writeClients(updated);
  }, [clientId]);

  const addStatusUpdate = useCallback((message: string) => {
    const clients = readClients();
    const updated = clients.map(c => {
      if (c.id !== clientId) return c;
      const entry: CommunicationLogEntry = {
        id: generateId(),
        type: 'note',
        subject: 'Client Status Update',
        content: message,
        timestamp: new Date().toISOString(),
        source: 'client-portal',
      };
      return {
        ...c,
        communicationLog: [...(c.communicationLog ?? []), entry],
      };
    });
    writeClients(updated);
  }, [clientId]);

  const attachFile = useCallback((taskId: string, file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      alert('File must be under 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const clients = readClients();
      const updated = clients.map(c => {
        if (c.id !== clientId) return c;
        return {
          ...c,
          checklist: c.checklist.map(item => {
            if (item.id !== taskId) return item;
            return {
              ...item,
              attachments: [
                ...(item.attachments ?? []),
                {
                  id: generateId(),
                  name: file.name,
                  size: file.size,
                  type: file.type,
                  dataUrl,
                  uploadedAt: new Date().toISOString(),
                },
              ],
            };
          }),
        };
      });
      writeClients(updated);
    };
    reader.readAsDataURL(file);
  }, [clientId]);

  const logPortalView = useCallback(() => {
    const key = `${PORTAL_VIEWS_PREFIX}${clientId}`;
    const entry = { viewedAt: new Date().toISOString() };
    localStorage.setItem(key, JSON.stringify(entry));
  }, [clientId]);

  return { completeTask, addComment, addStatusUpdate, attachFile, logPortalView };
}

export function getPortalLastView(clientId: string): string | null {
  try {
    const raw = localStorage.getItem(`${PORTAL_VIEWS_PREFIX}${clientId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.viewedAt ?? null;
  } catch {
    return null;
  }
}
