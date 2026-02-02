import React from 'react';
import { Notification, NotificationType } from '../../types';
import { cn, formatRelativeTime } from '../../lib/utils';
import {
  MessageSquare,
  Bell,
  FileText,
  Users,
  Calendar,
  AtSign,
  CheckCircle,
  AlertCircle,
  X,
  MoreHorizontal,
  Check,
  Trash2,
  ExternalLink,
} from 'lucide-react';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: (notification: Notification) => void;
  showActions?: boolean;
}

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case NotificationType.Message:
      return <MessageSquare className="w-5 h-5" />;
    case NotificationType.DocumentShared:
    case NotificationType.DocumentComment:
      return <FileText className="w-5 h-5" />;
    case NotificationType.GroupInvitation:
      return <Users className="w-5 h-5" />;
    case NotificationType.TaskAssignment:
      return <CheckCircle className="w-5 h-5" />;
    case NotificationType.Reminder:
      return <Calendar className="w-5 h-5" />;
    case NotificationType.Mention:
      return <AtSign className="w-5 h-5" />;
    case NotificationType.System:
    default:
      return <Bell className="w-5 h-5" />;
  }
};

const getNotificationColor = (type: NotificationType): string => {
  switch (type) {
    case NotificationType.Message:
      return 'bg-blue-100 text-blue-600';
    case NotificationType.DocumentShared:
    case NotificationType.DocumentComment:
      return 'bg-purple-100 text-purple-600';
    case NotificationType.GroupInvitation:
      return 'bg-green-100 text-green-600';
    case NotificationType.TaskAssignment:
      return 'bg-orange-100 text-orange-600';
    case NotificationType.Reminder:
      return 'bg-yellow-100 text-yellow-600';
    case NotificationType.Mention:
      return 'bg-pink-100 text-pink-600';
    case NotificationType.System:
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onDelete,
  onClick,
  showActions = true,
}) => {
  const [showMenu, setShowMenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close menu on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on action buttons
    if ((e.target as HTMLElement).closest('[data-action]')) {
      return;
    }

    // Mark as read when clicked
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }

    // Navigate if has actionUrl or call onClick
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    } else if (onClick) {
      onClick(notification);
    }
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkAsRead?.(notification.id);
    setShowMenu(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(notification.id);
    setShowMenu(false);
  };

  return (
    <div
      className={cn(
        'relative flex items-start gap-3 p-4 transition-colors cursor-pointer group',
        notification.isRead
          ? 'bg-white hover:bg-gray-50'
          : 'bg-blue-50 hover:bg-blue-100'
      )}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick(e as unknown as React.MouseEvent);
        }
      }}
    >
      {/* Unread indicator */}
      {!notification.isRead && (
        <div className="absolute left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full" />
      )}

      {/* Icon */}
      <div
        className={cn(
          'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
          getNotificationColor(notification.type)
        )}
      >
        {getNotificationIcon(notification.type)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm',
            notification.isRead ? 'text-gray-700' : 'text-gray-900 font-medium'
          )}
        >
          {notification.title}
        </p>
        <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
          {notification.content}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {notification.timeAgo || formatRelativeTime(notification.createdAt)}
        </p>
      </div>

      {/* Actions */}
      {showActions && (
        <div
          ref={menuRef}
          className="relative flex-shrink-0"
          data-action="true"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className={cn(
              'p-1.5 rounded-full transition-colors',
              'opacity-0 group-hover:opacity-100',
              showMenu && 'opacity-100 bg-gray-200'
            )}
          >
            <MoreHorizontal className="w-4 h-4 text-gray-500" />
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[140px]">
              {!notification.isRead && onMarkAsRead && (
                <button
                  onClick={handleMarkAsRead}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  data-action="true"
                >
                  <Check className="w-4 h-4" />
                  Mark as read
                </button>
              )}
              {notification.actionUrl && (
                <a
                  href={notification.actionUrl}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  data-action="true"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="w-4 h-4" />
                  View details
                </a>
              )}
              {onDelete && (
                <button
                  onClick={handleDelete}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
                  data-action="true"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationItem;
