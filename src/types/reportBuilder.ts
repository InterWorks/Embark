export type WidgetType =
  | 'stats_bar'
  | 'client_health'
  | 'task_completion_trend'
  | 'onboarding_velocity'
  | 'team_performance'
  | 'sla_status'
  | 'priority_distribution'
  | 'tag_distribution'
  | 'upcoming_renewals'
  | 'activity_feed'
  | 'webhook_delivery_rate'
  | 'task_bottleneck_heatmap'
  | 'onboarding_velocity_trend'
  | 'phase_duration_breakdown';

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  cols: 1 | 2 | 4;
  order: number;
}

export interface ReportDashboard {
  id: string;
  name: string;
  widgets: DashboardWidget[];
  createdAt: string;
  updatedAt: string;
}

export const WIDGET_META: Record<WidgetType, { label: string; description: string; defaultCols: 1 | 2 | 4 }> = {
  stats_bar:              { label: 'Stats Bar',              description: 'Key totals at a glance',          defaultCols: 4 },
  client_health:          { label: 'Client Health',          description: 'Health status breakdown',         defaultCols: 2 },
  task_completion_trend:  { label: 'Task Completion Trend',  description: 'Tasks completed over time',       defaultCols: 4 },
  onboarding_velocity:    { label: 'Onboarding Velocity',    description: 'Days to complete onboarding',     defaultCols: 2 },
  team_performance:       { label: 'Team Performance',       description: 'Completed vs overdue by member',  defaultCols: 2 },
  sla_status:             { label: 'SLA Status',             description: 'SLA on-track / warning / breach', defaultCols: 2 },
  priority_distribution:  { label: 'Priority Distribution',  description: 'Clients by priority',             defaultCols: 1 },
  tag_distribution:       { label: 'Tag Distribution',       description: 'Clients by tag',                  defaultCols: 1 },
  upcoming_renewals:      { label: 'Upcoming Renewals',      description: 'Contracts renewing soon',         defaultCols: 2 },
  activity_feed:          { label: 'Activity Feed',          description: 'Recent client activity',          defaultCols: 2 },
  webhook_delivery_rate:        { label: 'Webhook Delivery Rate',        description: 'Success rate for webhooks',              defaultCols: 2 },
  task_bottleneck_heatmap:      { label: 'Task Bottleneck Heatmap',      description: 'Slowest tasks by avg completion time',   defaultCols: 2 },
  onboarding_velocity_trend:    { label: 'Onboarding Velocity Trend',    description: 'Avg days to complete by month',          defaultCols: 4 },
  phase_duration_breakdown:     { label: 'Phase Duration Breakdown',     description: 'Avg days spent per onboarding phase',    defaultCols: 2 },
};

export const STARTER_DASHBOARDS: Omit<ReportDashboard, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Weekly Ops',
    widgets: [
      { id: 'w1', type: 'stats_bar',             title: 'Stats Bar',            cols: 4, order: 0 },
      { id: 'w2', type: 'client_health',         title: 'Client Health',        cols: 2, order: 1 },
      { id: 'w3', type: 'sla_status',            title: 'SLA Status',           cols: 2, order: 2 },
      { id: 'w4', type: 'task_completion_trend', title: 'Task Completion Trend',cols: 4, order: 3 },
      { id: 'w5', type: 'upcoming_renewals',     title: 'Upcoming Renewals',    cols: 2, order: 4 },
      { id: 'w6', type: 'activity_feed',         title: 'Activity Feed',        cols: 2, order: 5 },
    ],
  },
  {
    name: 'Executive Summary',
    widgets: [
      { id: 'e1', type: 'stats_bar',             title: 'Stats Bar',            cols: 4, order: 0 },
      { id: 'e2', type: 'onboarding_velocity',   title: 'Onboarding Velocity',  cols: 2, order: 1 },
      { id: 'e3', type: 'team_performance',      title: 'Team Performance',     cols: 2, order: 2 },
      { id: 'e4', type: 'priority_distribution', title: 'Priority Distribution',cols: 1, order: 3 },
      { id: 'e5', type: 'tag_distribution',      title: 'Tag Distribution',     cols: 1, order: 4 },
      { id: 'e6', type: 'webhook_delivery_rate', title: 'Webhook Delivery Rate',cols: 2, order: 5 },
    ],
  },
];
