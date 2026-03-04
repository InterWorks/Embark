import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import type { Notification, NotificationType } from '../../types';

const typeIcons: Record<NotificationType, { icon: string; color: string }> = {
  task_due_soon: { icon: '⏰', color: 'text-amber-500' },
  task_overdue: { icon: '⚠️', color: 'text-red-500' },
  task_assigned: { icon: '📋', color: 'text-blue-500' },
  task_completed: { icon: '✅', color: 'text-green-500' },
  milestone_reached: { icon: '🎯', color: 'text-violet-500' },
  client_completed: { icon: '🎉', color: 'text-emerald-500' },
  client_created: { icon: '👤', color: 'text-blue-500' },
  mention: { icon: '@', color: 'text-indigo-500' },
  automation: { icon: '⚡', color: 'text-amber-500' },
  contract_renewal: { icon: '📄', color: 'text-orange-500' },
  system: { icon: 'ℹ️', color: 'text-gray-500' },
};

interface NotificationCenterProps {
  onNavigateToClient?: (clientId: string) => void;
}

export function NotificationCenter({ onNavigateToClient }: NotificationCenterProps) {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    clearAll,
    preferences,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.clientId && onNavigateToClient) {
      onNavigateToClient(notification.clientId);
      setIsOpen(false);
    }
  };

  if (!preferences.enabled) return null;

  return (
    <div ref={containerRef} className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        {/* Badge */}
        {preferences.showBadge && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-scale-in">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-h-[32rem] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-violet-600 dark:text-violet-400 hover:underline"
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                filter === 'all'
                  ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                filter === 'unread'
                  ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                </p>
              </div>
            ) : (
              filteredNotifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={() => handleNotificationClick(notification)}
                  onDismiss={() => dismissNotification(notification.id)}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onClick: () => void;
  onDismiss: () => void;
}

function NotificationItem({ notification, onClick, onDismiss }: NotificationItemProps) {
  const { icon, color } = typeIcons[notification.type] || typeIcons.system;

  return (
    <div
      className={`px-4 py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${
        !notification.read ? 'bg-violet-50/50 dark:bg-violet-900/10' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className={`text-lg ${color}`}>{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
              {notification.title}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-0.5">
            {notification.message}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {formatRelativeTime(notification.createdAt)}
          </p>
        </div>
        {!notification.read && (
          <div className="w-2 h-2 rounded-full bg-violet-500 flex-shrink-0 mt-2" />
        )}
      </div>
    </div>
  );
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
