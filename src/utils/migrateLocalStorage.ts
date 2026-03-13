import { api } from '../lib/api';

export async function migrateClientsFromLocalStorage(): Promise<number> {
  const raw = localStorage.getItem('embark-clients');
  if (!raw) return 0;

  let clients: unknown[];
  try {
    clients = JSON.parse(raw);
    if (!Array.isArray(clients)) return 0;
  } catch {
    // Malformed data — mark complete to avoid infinite retry on every login
    localStorage.setItem('embark-migrated-clients', 'true');
    return 0;
  }

  let migrated = 0;
  for (const client of clients) {
    const res = await api.post('/api/v1/clients', {
      name:           (client as Record<string, unknown>).name,
      status:         (client as Record<string, unknown>).status,
      lifecycleStage: (client as Record<string, unknown>).lifecycleStage,
      industry:       (client as Record<string, unknown>).industry,
      website:        (client as Record<string, unknown>).website,
    });
    if (res.data) migrated++;
  }

  // Only mark complete if at least one record made it through (guards against transient errors)
  if (migrated > 0) {
    localStorage.setItem('embark-migrated-clients', 'true');
  }
  return migrated;
}
