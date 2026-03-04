import { useState, lazy, Suspense } from 'react';
import { WebhookSettings } from './WebhookSettings';
import { WebhookDeliveryLog } from './WebhookDeliveryLog';

const SLAManager = lazy(() => import('../SLA/SLAManager').then(m => ({ default: m.SLAManager })));

type Tab = 'webhooks' | 'delivery-log' | 'sla';

export function IntegrationsView() {
  const [tab, setTab] = useState<Tab>('webhooks');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'webhooks', label: 'Webhooks' },
    { id: 'delivery-log', label: 'Delivery Log' },
    { id: 'sla', label: 'SLA Rules' },
  ];

  return (
    <div className="p-6 max-w-5xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black font-display text-zinc-900 dark:text-white">Integrations</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Configure webhooks, Slack alerts, and SLA enforcement rules.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b-2 border-zinc-200 dark:border-zinc-700">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-bold transition-colors border-b-2 -mb-[2px] ${
              tab === t.id
                ? 'border-zinc-900 dark:border-white text-zinc-900 dark:text-white'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {tab === 'webhooks' && <WebhookSettings />}
        {tab === 'delivery-log' && <WebhookDeliveryLog />}
        {tab === 'sla' && (
          <Suspense fallback={<div className="py-8 text-center text-sm text-zinc-400">Loading…</div>}>
            <SLAManager />
          </Suspense>
        )}
      </div>
    </div>
  );
}
