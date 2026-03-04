import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { generateId } from '../utils/helpers';
import type { WebhookEndpoint, WebhookDelivery } from '../types/webhooks';
import type { AppEventType } from '../events/appEvents';

const MAX_DELIVERIES = 50;

export function useWebhooks() {
  const [endpoints, setEndpoints] = useLocalStorage<WebhookEndpoint[]>('embark-webhook-endpoints', []);
  const [deliveries, setDeliveries] = useLocalStorage<WebhookDelivery[]>('embark-webhook-deliveries', []);

  const addEndpoint = useCallback((data: Omit<WebhookEndpoint, 'id' | 'createdAt'>): WebhookEndpoint => {
    const endpoint: WebhookEndpoint = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setEndpoints(prev => [...prev, endpoint]);
    return endpoint;
  }, [setEndpoints]);

  const updateEndpoint = useCallback((id: string, updates: Partial<Omit<WebhookEndpoint, 'id' | 'createdAt'>>) => {
    setEndpoints(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  }, [setEndpoints]);

  const deleteEndpoint = useCallback((id: string) => {
    setEndpoints(prev => prev.filter(e => e.id !== id));
  }, [setEndpoints]);

  const toggleEndpoint = useCallback((id: string) => {
    setEndpoints(prev => prev.map(e => e.id === id ? { ...e, enabled: !e.enabled } : e));
  }, [setEndpoints]);

  const logDelivery = useCallback((delivery: WebhookDelivery) => {
    setDeliveries(prev => [delivery, ...prev].slice(0, MAX_DELIVERIES));
  }, [setDeliveries]);

  const getEndpointsForEvent = useCallback((event: AppEventType): WebhookEndpoint[] => {
    return endpoints.filter(e => e.enabled && e.events.includes(event));
  }, [endpoints]);

  const clearDeliveries = useCallback(() => {
    setDeliveries([]);
  }, [setDeliveries]);

  return {
    endpoints,
    deliveries,
    addEndpoint,
    updateEndpoint,
    deleteEndpoint,
    toggleEndpoint,
    logDelivery,
    getEndpointsForEvent,
    clearDeliveries,
  };
}
