import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { Notification, NotificationType, NotificationPreferences } from '../types';

const defaultPreferences: NotificationPreferences = {
  enabled: true,
  taskDueSoon: true,
  taskDueSoonDays: 3,
  taskOverdue: true,
  taskAssigned: true,
  taskCompleted: true,
  milestoneReached: true,
  clientCompleted: true,
  mentions: true,
  automations: true,
  contractRenewal: true,
  contractRenewalDays: [90, 60, 30, 14, 7],
  playSound: false,
  showBadge: true,
};

export function useNotifications() {
  const [notifications, setNotifications] = useLocalStorage<Notification[]>('embark-notifications', []);
  const [preferences, setPreferences] = useLocalStorage<NotificationPreferences>('embark-notification-preferences', defaultPreferences);

  // Add a notification
  const addNotification = useCallback((
    notification: Omit<Notification, 'id' | 'read' | 'dismissed' | 'createdAt'>
  ) => {
    // Check if this type of notification is enabled
    const typeEnabled = checkTypeEnabled(notification.type, preferences);
    if (!preferences.enabled || !typeEnabled) return null;

    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      read: false,
      dismissed: false,
      createdAt: new Date().toISOString(),
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Play sound if enabled
    if (preferences.playSound) {
      playNotificationSound();
    }

    return newNotification;
  }, [preferences, setNotifications]);

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  }, [setNotifications]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  }, [setNotifications]);

  // Dismiss a notification
  const dismissNotification = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, dismissed: true } : n)
    );
  }, [setNotifications]);

  // Delete a notification
  const deleteNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, [setNotifications]);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, [setNotifications]);

  // Clear old notifications (older than 7 days)
  const clearOld = useCallback(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    setNotifications(prev =>
      prev.filter(n => new Date(n.createdAt) > sevenDaysAgo)
    );
  }, [setNotifications]);

  // Update preferences
  const updatePreferences = useCallback((updates: Partial<NotificationPreferences>) => {
    setPreferences(prev => ({ ...prev, ...updates }));
  }, [setPreferences]);

  // Get visible notifications (not dismissed)
  const visibleNotifications = useMemo(() => {
    return notifications.filter(n => !n.dismissed);
  }, [notifications]);

  // Get unread count
  const unreadCount = useMemo(() => {
    return visibleNotifications.filter(n => !n.read).length;
  }, [visibleNotifications]);

  // Get notifications by type
  const getByType = useCallback((type: NotificationType) => {
    return visibleNotifications.filter(n => n.type === type);
  }, [visibleNotifications]);

  // Get notifications for a specific client
  const getByClient = useCallback((clientId: string) => {
    return visibleNotifications.filter(n => n.clientId === clientId);
  }, [visibleNotifications]);

  // Helper notifications
  const notifyTaskDueSoon = useCallback((
    taskTitle: string,
    clientName: string,
    dueDate: string,
    clientId: string,
    taskId: string
  ) => {
    return addNotification({
      type: 'task_due_soon',
      title: 'Task Due Soon',
      message: `"${taskTitle}" for ${clientName} is due on ${new Date(dueDate).toLocaleDateString()}`,
      clientId,
      taskId,
    });
  }, [addNotification]);

  const notifyTaskOverdue = useCallback((
    taskTitle: string,
    clientName: string,
    dueDate: string,
    clientId: string,
    taskId: string
  ) => {
    return addNotification({
      type: 'task_overdue',
      title: 'Task Overdue',
      message: `"${taskTitle}" for ${clientName} was due on ${new Date(dueDate).toLocaleDateString()}`,
      clientId,
      taskId,
    });
  }, [addNotification]);

  const notifyTaskAssigned = useCallback((
    taskTitle: string,
    clientName: string,
    assignedBy: string,
    clientId: string,
    taskId: string
  ) => {
    return addNotification({
      type: 'task_assigned',
      title: 'Task Assigned to You',
      message: `${assignedBy} assigned you "${taskTitle}" for ${clientName}`,
      clientId,
      taskId,
      triggeredBy: assignedBy,
    });
  }, [addNotification]);

  const notifyTaskCompleted = useCallback((
    taskTitle: string,
    clientName: string,
    completedBy: string,
    clientId: string,
    taskId: string
  ) => {
    return addNotification({
      type: 'task_completed',
      title: 'Task Completed',
      message: `${completedBy} completed "${taskTitle}" for ${clientName}`,
      clientId,
      taskId,
      triggeredBy: completedBy,
    });
  }, [addNotification]);

  const notifyMilestoneReached = useCallback((
    milestoneTitle: string,
    clientName: string,
    clientId: string
  ) => {
    return addNotification({
      type: 'milestone_reached',
      title: 'Milestone Reached',
      message: `${clientName} reached milestone: "${milestoneTitle}"`,
      clientId,
    });
  }, [addNotification]);

  const notifyClientCompleted = useCallback((
    clientName: string,
    clientId: string
  ) => {
    return addNotification({
      type: 'client_completed',
      title: 'Client Onboarding Complete',
      message: `${clientName} has completed their onboarding!`,
      clientId,
    });
  }, [addNotification]);

  const notifyMention = useCallback((
    mentionedBy: string,
    context: string,
    clientId: string
  ) => {
    return addNotification({
      type: 'mention',
      title: 'You were mentioned',
      message: `${mentionedBy} mentioned you: "${context}"`,
      clientId,
      triggeredBy: mentionedBy,
    });
  }, [addNotification]);

  const notifyAutomation = useCallback((
    automationName: string,
    action: string,
    clientId?: string
  ) => {
    return addNotification({
      type: 'automation',
      title: 'Automation Triggered',
      message: `"${automationName}" executed: ${action}`,
      clientId,
    });
  }, [addNotification]);

  const notifySystem = useCallback((
    title: string,
    message: string
  ) => {
    return addNotification({
      type: 'system',
      title,
      message,
    });
  }, [addNotification]);

  const notifyContractRenewal = useCallback((
    clientName: string,
    renewalDate: string,
    daysUntil: number,
    clientId: string,
    threshold: number
  ) => {
    return addNotification({
      type: 'contract_renewal',
      title: 'Contract Renewal Approaching',
      message: `${clientName}'s contract renews in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`,
      clientId,
      triggeredBy: `renewal-${renewalDate}-threshold-${threshold}`,
    });
  }, [addNotification]);

  const notifyPortalTaskCompleted = useCallback((clientId: string, clientName: string, taskTitle: string) => {
    addNotification({
      type: 'portal_task_completed',
      title: 'Client completed a task',
      message: `${clientName} completed "${taskTitle}" via their portal`,
      clientId,
    });
  }, [addNotification]);

  return {
    // State
    notifications: visibleNotifications,
    unreadCount,
    preferences,

    // Actions
    addNotification,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    deleteNotification,
    clearAll,
    clearOld,
    updatePreferences,

    // Queries
    getByType,
    getByClient,

    // Helper notifications
    notifyTaskDueSoon,
    notifyTaskOverdue,
    notifyTaskAssigned,
    notifyTaskCompleted,
    notifyMilestoneReached,
    notifyClientCompleted,
    notifyMention,
    notifyAutomation,
    notifySystem,
    notifyContractRenewal,
    notifyPortalTaskCompleted,
  };
}

function checkTypeEnabled(type: NotificationType, preferences: NotificationPreferences): boolean {
  switch (type) {
    case 'task_due_soon': return preferences.taskDueSoon;
    case 'task_overdue': return preferences.taskOverdue;
    case 'task_assigned': return preferences.taskAssigned;
    case 'task_completed': return preferences.taskCompleted;
    case 'milestone_reached': return preferences.milestoneReached;
    case 'client_completed': return preferences.clientCompleted;
    case 'mention': return preferences.mentions;
    case 'automation': return preferences.automations;
    case 'contract_renewal': return preferences.contractRenewal ?? true;
    case 'portal_task_completed': return true;
    case 'client_created':
    case 'system':
    default: return true;
  }
}

function playNotificationSound() {
  // Create a simple beep sound
  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.value = 0.1;

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
  } catch {
    // Audio not supported
  }
}
