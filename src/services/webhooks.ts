/**
 * Webhook service — local adapter that logs deliveries to localStorage.
 * Future: replace localStorage logic with fetch(endpoint.url, { method: 'POST', body })
 */
import { emit } from '../events/appEvents';
import type { AppEventType } from '../events/appEvents';
import type { WebhookEndpoint, WebhookDelivery } from '../types/webhooks';
import { generateId } from '../utils/helpers';

const ENDPOINTS_KEY = 'embark_webhook_endpoints';
const DELIVERIES_KEY = 'embark_webhook_deliveries';

function getEndpoints(): WebhookEndpoint[] {
  try {
    return JSON.parse(localStorage.getItem(ENDPOINTS_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function getDeliveries(): WebhookDelivery[] {
  try {
    return JSON.parse(localStorage.getItem(DELIVERIES_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function saveDelivery(delivery: WebhookDelivery): void {
  const deliveries = getDeliveries();
  // Keep last 200 deliveries
  const updated = [delivery, ...deliveries].slice(0, 200);
  localStorage.setItem(DELIVERIES_KEY, JSON.stringify(updated));
}

export function fire(eventType: AppEventType, payload: unknown): void {
  const endpoints = getEndpoints();
  const matching = endpoints.filter(e => e.enabled && e.events.includes(eventType));

  for (const endpoint of matching) {
    const delivery: WebhookDelivery = {
      id: generateId(),
      endpointId: endpoint.id,
      endpointName: endpoint.name,
      event: eventType,
      payload: payload as object,
      status: 'success',
      deliveredAt: new Date().toISOString(),
    };
    saveDelivery(delivery);
    emit({ type: 'webhook_delivered', endpointId: endpoint.id, event: eventType, timestamp: delivery.deliveredAt });
  }
}
