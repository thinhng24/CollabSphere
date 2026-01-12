import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, Settings, X, Loader2 } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import { cn, formatRelativeTime } from '../../lib/utils';
import { Notification, NotificationType } from '../../types';

interface NotificationDropdownProps {
  className?: string;
}

// Notification type icons and colors
const notificationStyles: Record<NotificationType, { icon: string; bgColor: string; textColor: string }> = {
  [NotificationType.System]: { icon: '⚙️', bgColor: 'bg-gray-100', textColor: 'text-gray-600' },
  [NotificationType.Message]: { icon: '💬', bgColor: 'bg-blue-100', textColor: 'text-blue-600' },
  [NotificationType.DocumentShared]: { icon: '📄', bgColor: 'bg-green-100', textColor: 'text-green-600' },
  [NotificationType.DocumentComment]: { icon: '💬', bgColor: 'bg-purple-100', textColor: 'text-purple-600' },
  [NotificationType.GroupInvitation]: { icon: '👥', bgColor: 'bg-indigo-100', textColor: 'text-indigo-600' },
  [NotificationType.TaskAssignment]: { icon: '✅', bgColor: 'bg-orange-100', textColor: 'text-orange-600' },
  [NotificationType.Reminder]: { icon: '⏰', bgColor: 'bg-yellow-100', textColor: 'text-yellow-600' },
  [NotificationType.Mention]: { icon: '@', bgColor: 'bg-pink-100', textColor: 'text-pink-600' },
};

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClick?: (notification: Notification) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onDelete,
  onClick,
}) => {
  const style = notificationStyles[notification.type] || notificationStyles[NotificationType.System];

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
    onClick?.(notification);
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors group',
        !notification.isRead && 'bg-blue-50/50'
      )}
      onClick={handleClick}
    >
      {/* Icon */}
      <div
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-lg',
          style.bgColor
        )}
      >
        {style.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              'text-sm',
              notification.isRead ? 'text-gray-600' : 'text-gray-900 font-medium'
            )}
          >
            {notification.title}
          </p>
          {!notification.isRead && (
            <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
          )}
        </div>
        <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">
          {notification.content}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {notification.timeAgo || formatRelativeTime(notification.createdAt)}
        </p>
      </div>

      {/* Actions (appear on hover) */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!notification.isRead && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsRead(notification.id);
            }}
            className="p-1.5 hover:bg-gray-200 rounded-full text-gray-500"
            title="Mark as read"
          >
            <Check size={14} />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification.id);
          }}
          className="p-1.5 hover:bg-red-100 rounded-full text-gray-500 hover:text-red-500"
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  className,
}) => {
  const {
    notifications,
    unreadCount,
    isLoading,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotification();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const filteredNotifications =
    filter === 'unread'
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  const handleNotificationClick = (notification: Notification) => {
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'relative p-2 rounded-full transition-colors',
          isOpen
            ? 'bg-blue-100 text-blue-600'
            : 'hover:bg-gray-100 text-gray-600'
        )}
        title="Notifications"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 max-h-[70vh] bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead()}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                >
                  <CheckCheck size={14} />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-1 px-4 py-2 border-b border-gray-100">
            <button
              onClick={() => setFilter('all')}
              className={cn(
                'px-3 py-1 text-sm font-medium rounded-full transition-colors',
                filter === 'all'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={cn(
                'px-3 py-1 text-sm font-medium rounded-full transition-colors',
                filter === 'unread'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto max-h-[400px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Bell className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm text-center">
                  {filter === 'unread'
                    ? "You're all caught up!"
                    : 'No notifications yet'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    onDelete={deleteNotification}
                    onClick={handleNotificationClick}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {filteredNotifications.length > 0 && (
            <div className="border-t border-gray-200 px-4 py-2">
              <button
                onClick={() => {
                  // Navigate to full notifications page
                  window.location.href = '/notifications';
                }}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium py-2"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
