import type { Client } from '../types';
import type { FilterSet, FilterCondition, FilterOperator } from '../components/Clients/FilterBuilder';
import { computeHealthScore } from './healthScore';

/**
 * Returns the number of days since the most recent communication log entry.
 * Returns Infinity if there are no entries.
 */
function daysSinceLastContact(client: Client): number {
  const log = client.communicationLog ?? [];
  if (log.length === 0) return Infinity;
  const sorted = [...log].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  const ms = Date.now() - new Date(sorted[0].timestamp).getTime();
  return Math.floor(ms / 86400000);
}

/**
 * Returns days until the targetGoLiveDate.
 * Negative means it is already past.
 * Returns Infinity if no date is set.
 */
function daysUntilGoLive(client: Client): number {
  if (!client.targetGoLiveDate) return Infinity;
  const ms = new Date(client.targetGoLiveDate).getTime() - Date.now();
  return Math.floor(ms / 86400000);
}

/** Evaluate a numeric comparison */
function compareNumeric(actual: number, operator: FilterOperator, condValue: number): boolean {
  switch (operator) {
    case 'equals': return actual === condValue;
    case 'not_equals': return actual !== condValue;
    case 'greater_than': return actual > condValue;
    case 'less_than': return actual < condValue;
    case 'in_days': return actual <= condValue; // "within N days"
    default: return false;
  }
}

/** Evaluate a string comparison */
function compareString(actual: string, operator: FilterOperator, condValue: string): boolean {
  const a = actual.toLowerCase();
  const v = condValue.toLowerCase();
  switch (operator) {
    case 'equals': return a === v;
    case 'not_equals': return a !== v;
    case 'contains': return a.includes(v);
    case 'not_contains': return !a.includes(v);
    default: return false;
  }
}

function matchesCondition(client: Client, condition: FilterCondition): boolean {
  const { field, operator, value } = condition;

  switch (field) {
    case 'health': {
      const score = computeHealthScore(client, []).total;
      const condValue = parseFloat(value);
      if (isNaN(condValue)) return true; // incomplete condition — skip
      return compareNumeric(score, operator, condValue);
    }

    case 'status': {
      if (!value) return true;
      return compareString(client.status, operator, value);
    }

    case 'priority': {
      if (!value) return true;
      return compareString(client.priority, operator, value);
    }

    case 'tags': {
      if (!value) return true;
      // client.tags is an array of tag IDs; we do a substring match on each
      const tagStr = client.tags.join(' ').toLowerCase();
      const v = value.toLowerCase();
      if (operator === 'contains') return tagStr.includes(v);
      if (operator === 'not_contains') return !tagStr.includes(v);
      return false;
    }

    case 'lastContact': {
      const days = daysSinceLastContact(client);
      if (days === Infinity) {
        // No contact ever — treat as very large number for gt/lt comparisons
        const condValue = parseFloat(value);
        if (isNaN(condValue)) return true;
        // "greater than N days" → matches (infinity > N)
        if (operator === 'greater_than' || operator === 'in_days') return true;
        // "less than N days" → no contact at all, doesn't match
        return false;
      }
      const condValue = parseFloat(value);
      if (isNaN(condValue)) return true;
      return compareNumeric(days, operator, condValue);
    }

    case 'goLiveProximity': {
      const days = daysUntilGoLive(client);
      if (days === Infinity) return false; // no target date — never matches
      const condValue = parseFloat(value);
      if (isNaN(condValue)) return true;
      return compareNumeric(days, operator, condValue);
    }

    case 'mrr': {
      const mrrDollars = (client.account?.mrr ?? 0) / 100;
      const condValue = parseFloat(value);
      if (isNaN(condValue)) return true;
      return compareNumeric(mrrDollars, operator, condValue);
    }

    case 'assignedTo': {
      if (!value) return true;
      // Check legacy assignedTo or first primary assignment member
      const assignee = client.assignedTo ||
        client.assignments?.find((a) => a.isPrimary)?.memberId ||
        client.assignments?.[0]?.memberId ||
        '';
      return compareString(assignee, operator, value);
    }

    case 'lifecycleStage': {
      if (!value) return true;
      const stage = client.lifecycleStage ?? 'onboarding';
      return compareString(stage, operator, value);
    }

    default:
      return true;
  }
}

/**
 * Filter a list of clients using the given FilterSet.
 * AND logic: all conditions must match.
 * OR logic: any condition must match.
 */
export function filterClients(clients: Client[], filters: FilterSet): Client[] {
  if (filters.conditions.length === 0) return clients;

  return clients.filter((client) => {
    if (filters.logic === 'AND') {
      return filters.conditions.every((c) => matchesCondition(client, c));
    } else {
      return filters.conditions.some((c) => matchesCondition(client, c));
    }
  });
}
