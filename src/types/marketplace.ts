// Marketplace Types - Plugin/App Architecture
import type { AutomationTrigger, AutomationActionType } from './index';

export type AppCategory =
  | 'templates'
  | 'productivity'
  | 'communication'
  | 'reporting'
  | 'integrations'
  | 'views'
  | 'automation'
  | 'widgets';

export type AppType =
  | 'template'      // Industry onboarding templates
  | 'widget'        // Dashboard widgets
  | 'view'          // New client view types
  | 'integration'   // External service connections
  | 'automation'    // Automation recipes
  | 'field-type'    // Custom field types
  | 'theme';        // Visual themes

export interface AppRating {
  average: number;
  count: number;
}

export interface AppAuthor {
  name: string;
  verified: boolean;
  avatar?: string;
}

export interface MarketplaceApp {
  id: string;
  name: string;
  description: string;
  longDescription?: string;
  icon: string;
  category: AppCategory;
  type: AppType;
  author: AppAuthor;
  version: string;
  rating: AppRating;
  installs: number;
  featured?: boolean;
  new?: boolean;
  premium?: boolean;
  tags: string[];
  screenshots?: string[];

  // What the app provides
  provides?: {
    widgets?: WidgetDefinition[];
    templates?: TemplateDefinition[];
    views?: ViewDefinition[];
    automations?: AutomationRecipe[];
    fieldTypes?: FieldTypeDefinition[];
    integrations?: IntegrationDefinition[];
  };

  // Requirements
  requirements?: string[];

  createdAt: string;
  updatedAt: string;
}

export interface InstalledApp {
  appId: string;
  installedAt: string;
  enabled: boolean;
  config?: Record<string, unknown>;
}

// Widget System
export interface WidgetDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  size: 'small' | 'medium' | 'large' | 'full';
  component: string; // Component identifier
  configSchema?: WidgetConfigField[];
  defaultConfig?: Record<string, unknown>;
}

export interface WidgetConfigField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean' | 'color' | 'client-select';
  options?: { value: string; label: string }[];
  default?: unknown;
  required?: boolean;
}

export interface DashboardWidget {
  id: string;
  widgetId: string; // References WidgetDefinition
  appId: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  config: Record<string, unknown>;
}

// Template System
export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  industry: string;
  icon: string;
  color: string;

  // What the template includes
  tasks: TemplateTask[];
  milestones?: TemplateMilestone[];
  services?: string[];
  customFields?: TemplateCustomField[];
  automations?: string[]; // IDs of automation recipes

  estimatedDuration?: string; // e.g., "2-4 weeks"
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

export interface TemplateTask {
  title: string;
  description?: string;
  dueOffsetDays?: number;
  startOffsetDays?: number;
  group?: string;
  subtasks?: string[];
  dependsOn?: number[]; // Indices of other tasks
}

export interface TemplateMilestone {
  title: string;
  description?: string;
  targetOffsetDays?: number;
  color?: string;
}

export interface TemplateCustomField {
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'boolean';
  options?: string[];
  required?: boolean;
}

// View System
export interface ViewDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  component: string;
}

// Automation Recipes
export interface AutomationRecipe {
  id: string;
  name: string;
  description: string;
  trigger: AutomationTrigger;
  conditions?: string[];
  actions: AutomationActionType[];
}

// Custom Field Types
export interface FieldTypeDefinition {
  id: string;
  name: string;
  icon: string;
  component: string;
  validationSchema?: Record<string, unknown>;
}

// Integration System
export interface IntegrationDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  authType: 'oauth' | 'api-key' | 'webhook' | 'none';
  configFields?: IntegrationConfigField[];
  actions?: IntegrationAction[];
  triggers?: IntegrationTrigger[];
}

export interface IntegrationConfigField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'url';
  placeholder?: string;
  required?: boolean;
}

export interface IntegrationAction {
  id: string;
  name: string;
  description: string;
}

export interface IntegrationTrigger {
  id: string;
  name: string;
  description: string;
}

// User's customized dashboard layout
export interface DashboardLayout {
  id: string;
  name: string;
  widgets: DashboardWidget[];
  isDefault?: boolean;
  createdAt: string;
}
