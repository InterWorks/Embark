import type { AppEventType } from '../events/appEvents';

export interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  type: 'slack' | 'custom';
  events: AppEventType[];
  secretHeader?: string;
  enabled: boolean;
  createdAt: string;
}

export interface WebhookDelivery {
  id: string;
  endpointId: string;
  endpointName: string;
  event: AppEventType;
  payload: Record<string, unknown>;
  status: 'success' | 'failed';
  statusCode?: number;
  error?: string;
  deliveredAt: string;
}
