export type AppEventType =
  | 'client_created'
  | 'client_status_changed'
  | 'client_completed'
  | 'task_completed'
  | 'milestone_reached'
  | 'sla_warning'
  | 'sla_breached'
  | 'automation_fired'
  | 'webhook_delivered'
  | 'webhook_failed'
  | 'graduation_ready'
  | 'phase_advanced'
  | 'client_health_drop';

export type AppEvent =
  | { type: 'client_created';        clientId: string; clientName: string; timestamp: string }
  | { type: 'client_status_changed'; clientId: string; clientName: string; oldStatus: string; newStatus: string; timestamp: string }
  | { type: 'client_completed';      clientId: string; clientName: string; timestamp: string }
  | { type: 'task_completed';        clientId: string; clientName: string; taskId: string; taskTitle: string; timestamp: string }
  | { type: 'milestone_reached';     clientId: string; clientName: string; milestoneId: string; milestoneTitle: string; timestamp: string }
  | { type: 'sla_warning';           clientId: string; clientName: string; slaType: string; percentUsed: number; timestamp: string }
  | { type: 'sla_breached';          clientId: string; clientName: string; slaType: string; daysOverdue: number; timestamp: string }
  | { type: 'automation_fired';      ruleName: string; clientId: string; timestamp: string }
  | { type: 'webhook_delivered';     endpointId: string; event: AppEventType; timestamp: string }
  | { type: 'webhook_failed';        endpointId: string; event: AppEventType; error: string; timestamp: string }
  | { type: 'graduation_ready';      clientId: string; clientName: string; timestamp: string }
  | { type: 'phase_advanced';        clientId: string; phaseName: string; timestamp: string }
  | { type: 'client_health_drop';    clientId: string; clientName: string; healthStatus: string; timestamp: string };

type Handler = (event: AppEvent) => void;
const handlers: Handler[] = [];

export function emit(event: AppEvent): void {
  handlers.forEach(h => {
    try { h(event); } catch { /* ignore handler errors */ }
  });
}

export function subscribe(handler: Handler): () => void {
  handlers.push(handler);
  return () => {
    const i = handlers.indexOf(handler);
    if (i !== -1) handlers.splice(i, 1);
  };
}
