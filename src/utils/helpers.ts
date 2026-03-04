export function generateId(): string {
  return crypto.randomUUID();
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

export function formatRelativeTime(isoString: string): string {
  const ms = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function getEffectiveStatus(item: import('../types').ChecklistItem): import('../types').TaskStatus {
  if (item.status) return item.status;
  if (item.completed) return 'done';
  if (item.isBlocked) return 'blocked';
  return 'todo';
}

export function buildTasksFromTemplate(
  template: import('../types').ChecklistTemplate,
  goLiveDate?: string
): Omit<import('../types').ChecklistItem, 'id' | 'order'>[] {
  const base = goLiveDate ? new Date(goLiveDate) : new Date();
  return template.items.map(item => ({
    title: item.title,
    completed: false,
    dueDate: item.dueOffsetDays != null
      ? new Date(base.getTime() + item.dueOffsetDays * 86400000).toISOString().split('T')[0]
      : undefined,
    phaseId: item.phaseId,
  }));
}
