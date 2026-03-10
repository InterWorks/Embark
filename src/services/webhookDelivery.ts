import { subscribe, emit } from '../events/appEvents';
import type { AppEvent, AppEventType } from '../events/appEvents';
import type { WebhookEndpoint, WebhookDelivery } from '../types/webhooks';
import { generateId } from '../utils/helpers';

function buildSlackPayload(event: AppEvent): Record<string, unknown> {
  switch (event.type) {
    case 'client_created':
      return {
        blocks: [
          { type: 'header', text: { type: 'plain_text', text: '🎉 New Client Created' } },
          { type: 'section', text: { type: 'mrkdwn', text: `*${event.clientName}* has been added to Embark.` } },
          { type: 'context', elements: [{ type: 'mrkdwn', text: `<!date^${Math.floor(new Date(event.timestamp).getTime() / 1000)}^{date_short_pretty} at {time}|${event.timestamp}>` }] },
        ],
      };
    case 'client_completed':
      return {
        blocks: [
          { type: 'header', text: { type: 'plain_text', text: '✅ Client Onboarding Complete' } },
          { type: 'section', text: { type: 'mrkdwn', text: `*${event.clientName}* has completed onboarding! 🎊` } },
          { type: 'context', elements: [{ type: 'mrkdwn', text: `<!date^${Math.floor(new Date(event.timestamp).getTime() / 1000)}^{date_short_pretty} at {time}|${event.timestamp}>` }] },
        ],
      };
    case 'client_status_changed':
      return {
        blocks: [
          { type: 'header', text: { type: 'plain_text', text: '🔄 Client Status Changed' } },
          { type: 'section', text: { type: 'mrkdwn', text: `*${event.clientName}*: \`${event.oldStatus}\` → \`${event.newStatus}\`` } },
        ],
      };
    case 'task_completed':
      return {
        blocks: [
          { type: 'header', text: { type: 'plain_text', text: '☑️ Task Completed' } },
          { type: 'section', text: { type: 'mrkdwn', text: `Task *${event.taskTitle}* completed for *${event.clientName}*` } },
        ],
      };
    case 'milestone_reached':
      return {
        blocks: [
          { type: 'header', text: { type: 'plain_text', text: '🏆 Milestone Reached' } },
          { type: 'section', text: { type: 'mrkdwn', text: `*${event.milestoneTitle}* reached for *${event.clientName}*` } },
        ],
      };
    case 'sla_breached':
      return {
        blocks: [
          { type: 'header', text: { type: 'plain_text', text: '🚨 SLA Breached' } },
          { type: 'section', text: { type: 'mrkdwn', text: `*${event.clientName}* — SLA \`${event.slaType}\` breached by *${event.daysOverdue}d*` } },
        ],
      };
    case 'sla_warning':
      return {
        blocks: [
          { type: 'header', text: { type: 'plain_text', text: '⚠️ SLA Warning' } },
          { type: 'section', text: { type: 'mrkdwn', text: `*${event.clientName}* — SLA \`${event.slaType}\` at *${Math.round(event.percentUsed * 100)}%* capacity` } },
        ],
      };
    default:
      return { text: `Embark event: ${event.type}` };
  }
}

function buildCustomPayload(event: AppEvent): Record<string, unknown> {
  const payload = { ...(event as Record<string, unknown>) };
  delete payload.type;
  delete payload.timestamp;
  return { event: event.type, timestamp: event.timestamp, data: payload };
}

export function initWebhookDelivery(
  getEndpoints: () => WebhookEndpoint[],
  logDelivery: (d: WebhookDelivery) => void
): () => void {
  return subscribe(async (event: AppEvent) => {
    const endpoints = getEndpoints();
    const matching = endpoints.filter(
      e => e.enabled && e.events.includes(event.type as AppEventType)
    );

    for (const endpoint of matching) {
      const payload = endpoint.type === 'slack'
        ? buildSlackPayload(event)
        : buildCustomPayload(event);

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (endpoint.secretHeader) {
        headers['X-Embark-Secret'] = endpoint.secretHeader;
      }

      try {
        const res = await fetch(endpoint.url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        const delivery: WebhookDelivery = {
          id: generateId(),
          endpointId: endpoint.id,
          endpointName: endpoint.name,
          event: event.type as AppEventType,
          payload,
          status: res.ok ? 'success' : 'failed',
          statusCode: res.status,
          deliveredAt: new Date().toISOString(),
        };
        logDelivery(delivery);

        if (res.ok) {
          emit({ type: 'webhook_delivered', endpointId: endpoint.id, event: event.type as AppEventType, timestamp: delivery.deliveredAt });
        } else {
          emit({ type: 'webhook_failed', endpointId: endpoint.id, event: event.type as AppEventType, error: `HTTP ${res.status}`, timestamp: delivery.deliveredAt });
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Network error';
        const delivery: WebhookDelivery = {
          id: generateId(),
          endpointId: endpoint.id,
          endpointName: endpoint.name,
          event: event.type as AppEventType,
          payload,
          status: 'failed',
          error: errorMsg,
          deliveredAt: new Date().toISOString(),
        };
        logDelivery(delivery);
        emit({ type: 'webhook_failed', endpointId: endpoint.id, event: event.type as AppEventType, error: errorMsg, timestamp: delivery.deliveredAt });
      }
    }
  });
}
