export type SLAType =
  | 'onboarding_completion'
  | 'task_completion'
  | 'communication_frequency'
  | 'first_response';

export type SLAStatusValue = 'on_track' | 'warning' | 'breached';

export type SLAEscalationAction = 'notify' | 'webhook';

export interface SLADefinition {
  id: string;
  name: string;
  slaType: SLAType;
  targetDays: number;
  warningThreshold: number; // 0.0–1.0 fraction of targetDays
  escalationActions: SLAEscalationAction[];
  enabled: boolean;
  createdAt: string;
}

export interface ClientSLAStatus {
  clientId: string;
  slaId: string;
  slaName: string;
  slaType: SLAType;
  status: SLAStatusValue;
  percentUsed: number;
  daysUsed: number;
  targetDays: number;
  daysOverdue: number;
}
