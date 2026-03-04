import { useState } from 'react';
import { useWebhooks } from '../../hooks/useWebhooks';
import { Button } from '../UI/Button';
import type { WebhookEndpoint } from '../../types/webhooks';
import type { AppEventType } from '../../events/appEvents';

const ALL_EVENTS: AppEventType[] = [
  'client_created', 'client_status_changed', 'client_completed',
  'task_completed', 'milestone_reached', 'sla_warning', 'sla_breached',
];

const EVENT_LABELS: Record<AppEventType, string> = {
  client_created: 'Client Created',
  client_status_changed: 'Status Changed',
  client_completed: 'Client Completed',
  task_completed: 'Task Completed',
  milestone_reached: 'Milestone Reached',
  sla_warning: 'SLA Warning',
  sla_breached: 'SLA Breached',
  automation_fired: 'Automation Fired',
  webhook_delivered: 'Webhook Delivered',
  webhook_failed: 'Webhook Failed',
  graduation_ready: 'Graduation Ready',
  phase_advanced: 'Phase Advanced',
};

interface EndpointFormState {
  name: string;
  url: string;
  type: 'slack' | 'custom';
  events: AppEventType[];
  secretHeader: string;
}

const EMPTY_FORM: EndpointFormState = {
  name: '',
  url: '',
  type: 'slack',
  events: [],
  secretHeader: '',
};

export function WebhookSettings() {
  const { endpoints, addEndpoint, updateEndpoint, deleteEndpoint, toggleEndpoint } = useWebhooks();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EndpointFormState>(EMPTY_FORM);
  const [testStatus, setTestStatus] = useState<Record<string, 'idle' | 'sending' | 'ok' | 'fail'>>({});

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (ep: WebhookEndpoint) => {
    setForm({
      name: ep.name,
      url: ep.url,
      type: ep.type,
      events: ep.events,
      secretHeader: ep.secretHeader || '',
    });
    setEditingId(ep.id);
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim() || !form.url.trim() || form.events.length === 0) return;
    if (editingId) {
      updateEndpoint(editingId, {
        name: form.name,
        url: form.url,
        type: form.type,
        events: form.events,
        secretHeader: form.secretHeader || undefined,
      });
    } else {
      addEndpoint({
        name: form.name,
        url: form.url,
        type: form.type,
        events: form.events,
        secretHeader: form.secretHeader || undefined,
        enabled: true,
      });
    }
    setShowForm(false);
    setEditingId(null);
  };

  const toggleEvent = (evt: AppEventType) => {
    setForm(prev => ({
      ...prev,
      events: prev.events.includes(evt)
        ? prev.events.filter(e => e !== evt)
        : [...prev.events, evt],
    }));
  };

  const handleTest = async (ep: WebhookEndpoint) => {
    setTestStatus(prev => ({ ...prev, [ep.id]: 'sending' }));
    const payload = ep.type === 'slack'
      ? { blocks: [{ type: 'section', text: { type: 'mrkdwn', text: '✅ *Embark webhook test* — connection is working!' } }] }
      : { event: 'test', timestamp: new Date().toISOString(), data: { message: 'Embark webhook test' } };
    try {
      const res = await fetch(ep.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setTestStatus(prev => ({ ...prev, [ep.id]: res.ok ? 'ok' : 'fail' }));
    } catch {
      setTestStatus(prev => ({ ...prev, [ep.id]: 'fail' }));
    }
    setTimeout(() => setTestStatus(prev => ({ ...prev, [ep.id]: 'idle' })), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black font-display text-zinc-900 dark:text-white">Webhook Endpoints</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Send real-time events to Slack or custom URLs.
          </p>
        </div>
        <Button onClick={openAdd}>+ Add Endpoint</Button>
      </div>

      {/* CORS notice */}
      <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg text-sm text-amber-800 dark:text-amber-200">
        <strong>Note:</strong> Slack Incoming Webhooks work from browsers natively. Custom endpoints must have CORS enabled (allow <code>*</code> origin or this domain).
      </div>

      {/* Endpoint list */}
      {endpoints.length === 0 ? (
        <p className="text-sm text-zinc-400 dark:text-zinc-500 py-8 text-center">No endpoints yet. Add one to start receiving events.</p>
      ) : (
        <div className="space-y-3">
          {endpoints.map(ep => (
            <div key={ep.id} className="border-2 border-zinc-200 dark:border-zinc-700 rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-zinc-900 dark:text-white">{ep.name}</span>
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${ep.type === 'slack' ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'}`}>
                      {ep.type === 'slack' ? 'Slack' : 'Custom'}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${ep.enabled ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800'}`}>
                      {ep.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 truncate">{ep.url}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {ep.events.map(evt => (
                      <span key={evt} className="px-1.5 py-0.5 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded">
                        {EVENT_LABELS[evt] ?? evt}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleTest(ep)}
                    disabled={testStatus[ep.id] === 'sending'}
                    className="px-3 py-1.5 text-xs font-bold border-2 border-zinc-300 dark:border-zinc-600 rounded-md hover:border-zinc-500 transition-colors disabled:opacity-50"
                  >
                    {testStatus[ep.id] === 'sending' ? '…' : testStatus[ep.id] === 'ok' ? '✓ Sent' : testStatus[ep.id] === 'fail' ? '✗ Failed' : 'Test'}
                  </button>
                  <button onClick={() => toggleEndpoint(ep.id)} className="px-3 py-1.5 text-xs font-bold border-2 border-zinc-300 dark:border-zinc-600 rounded-md hover:border-zinc-500 transition-colors">
                    {ep.enabled ? 'Disable' : 'Enable'}
                  </button>
                  <button onClick={() => openEdit(ep)} className="px-3 py-1.5 text-xs font-bold border-2 border-zinc-300 dark:border-zinc-600 rounded-md hover:border-zinc-500 transition-colors">
                    Edit
                  </button>
                  <button onClick={() => deleteEndpoint(ep.id)} className="px-3 py-1.5 text-xs font-bold border-2 border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-600 rounded-xl p-6 w-full max-w-lg space-y-4">
            <h3 className="text-lg font-black font-display text-zinc-900 dark:text-white">
              {editingId ? 'Edit Endpoint' : 'Add Webhook Endpoint'}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Team Slack"
                  className="w-full px-3 py-2 border-2 border-zinc-300 dark:border-zinc-600 rounded-lg text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Type</label>
                <div className="flex gap-3">
                  {(['slack', 'custom'] as const).map(t => (
                    <label key={t} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={form.type === t} onChange={() => setForm(prev => ({ ...prev, type: t }))} className="accent-violet-600" />
                      <span className="text-sm capitalize text-zinc-800 dark:text-zinc-200">{t === 'slack' ? 'Slack Incoming Webhook' : 'Custom URL'}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">URL</label>
                <input
                  type="url"
                  value={form.url}
                  onChange={e => setForm(prev => ({ ...prev, url: e.target.value }))}
                  placeholder={form.type === 'slack' ? 'https://hooks.slack.com/services/…' : 'https://your-server.com/webhook'}
                  className="w-full px-3 py-2 border-2 border-zinc-300 dark:border-zinc-600 rounded-lg text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400"
                />
              </div>
              {form.type === 'custom' && (
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Secret Header (X-Embark-Secret) — optional</label>
                  <input
                    type="text"
                    value={form.secretHeader}
                    onChange={e => setForm(prev => ({ ...prev, secretHeader: e.target.value }))}
                    placeholder="your-secret"
                    className="w-full px-3 py-2 border-2 border-zinc-300 dark:border-zinc-600 rounded-lg text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">Events to Subscribe</label>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_EVENTS.map(evt => (
                    <label key={evt} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.events.includes(evt)}
                        onChange={() => toggleEvent(evt)}
                        className="accent-violet-600"
                      />
                      <span className="text-xs text-zinc-700 dark:text-zinc-300">{EVENT_LABELS[evt]}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={!form.name.trim() || !form.url.trim() || form.events.length === 0}>
                {editingId ? 'Save Changes' : 'Add Endpoint'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
