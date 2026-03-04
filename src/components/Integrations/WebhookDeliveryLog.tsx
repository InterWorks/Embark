import { useState } from 'react';
import { useWebhooks } from '../../hooks/useWebhooks';
import { Button } from '../UI/Button';

export function WebhookDeliveryLog() {
  const { deliveries, clearDeliveries } = useWebhooks();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black font-display text-zinc-900 dark:text-white">Delivery Log</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Last {deliveries.length} deliveries</p>
        </div>
        {deliveries.length > 0 && (
          <Button variant="secondary" onClick={clearDeliveries}>Clear Log</Button>
        )}
      </div>

      {deliveries.length === 0 ? (
        <p className="text-sm text-zinc-400 dark:text-zinc-500 py-8 text-center">No deliveries yet. Webhook events will appear here.</p>
      ) : (
        <div className="border-2 border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800 border-b-2 border-zinc-200 dark:border-zinc-700">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-bold text-zinc-600 dark:text-zinc-400">Status</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-zinc-600 dark:text-zinc-400">Endpoint</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-zinc-600 dark:text-zinc-400">Event</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-zinc-600 dark:text-zinc-400">Time</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-zinc-600 dark:text-zinc-400">Details</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.map(d => (
                <>
                  <tr key={d.id} className="border-t border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                        d.status === 'success'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                      }`}>
                        {d.status === 'success' ? `✓ ${d.statusCode ?? 200}` : `✗ ${d.statusCode ?? 'Error'}`}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-medium text-zinc-900 dark:text-white truncate max-w-[150px]">{d.endpointName}</td>
                    <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400 font-mono text-xs">{d.event}</td>
                    <td className="px-4 py-2 text-zinc-500 dark:text-zinc-400 text-xs whitespace-nowrap">
                      {new Date(d.deliveredAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}
                        className="text-xs text-violet-600 dark:text-violet-400 hover:underline"
                      >
                        {expandedId === d.id ? 'Hide' : 'Payload'}
                      </button>
                    </td>
                  </tr>
                  {expandedId === d.id && (
                    <tr key={`${d.id}-expanded`} className="bg-zinc-50 dark:bg-zinc-800/50">
                      <td colSpan={5} className="px-4 py-3">
                        {d.error && (
                          <p className="text-xs text-red-600 dark:text-red-400 mb-2">Error: {d.error}</p>
                        )}
                        <pre className="text-xs font-mono text-zinc-700 dark:text-zinc-300 overflow-x-auto whitespace-pre-wrap max-h-48">
                          {JSON.stringify(d.payload, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
