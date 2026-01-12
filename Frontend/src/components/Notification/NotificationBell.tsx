import React, { useState, useRef, useEffect } from 'react';
import { Bell, Volume2, VolumeX } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import { cn } from '../../lib/utils';
import NotificationDropdown from './NotificationDropdown';

interface NotificationBellProps {
  className?: string;
  showDropdown?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'ghost' | 'outline';
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
};

const iconSizes = {
  sm: 18,
  md: 22,
  lg: 26,
};

const badgeSizes = {
  sm: 'min-w-[14px] h-[14px] text-[10px] -top-0.5 -right-0.5',
  md: 'min-w-[18px] h-[18px] text-xs -top-0.5 -right-0.5',
  lg: 'min-w-[20px] h-[20px] text-xs -top-1 -right-1',
};

export const NotificationBell: React.FC<NotificationBellProps> = ({
  className,
  showDropdown = true,
  size = 'md',
  variant = 'default',
}) => {
  const { unreadCount, isConnected } = useNotification();
  const [isOpen, setIsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevUnreadCountRef = useRef(unreadCount);

  // Animate bell when new notification arrives
  useEffect(() => {
    if (unreadCount > prevUnreadCountRef.current) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 500);
      return () => clearTimeout(timer);
    }
    prevUnreadCountRef.current = unreadCount;
  }, [unreadCount]);

  const variantClasses = {
    default: cn(
      'bg-white border border-gray-200 shadow-sm',
      'hover:bg-gray-50 hover:border-gray-300',
      isOpen && 'bg-blue-50 border-blue-300'
    ),
    ghost: cn(
      'hover:bg-gray-100',
      isOpen && 'bg-blue-100'
    ),
    outline: cn(
      'border-2 border-gray-300',
      'hover:border-gray-400',
      isOpen && 'border-blue-400 bg-blue-50'
    ),
  };

  const handleToggle = () => {
    if (showDropdown) {
      setIsOpen(!isOpen);
    }
  };

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
    // TODO: Implement actual mute/unmute logic
  };

  return (
    <div className={cn('relative inline-flex', className)}>
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        className={cn(
          'relative flex items-center justify-center rounded-full transition-all duration-200',
          sizeClasses[size],
          variantClasses[variant],
          isAnimating && 'animate-wiggle'
        )}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        title={isMuted ? 'Notifications muted' : 'Notifications'}
      >
        {/* Bell Icon */}
        <Bell
          size={iconSizes[size]}
          className={cn(
            'transition-colors',
            isOpen ? 'text-blue-600' : 'text-gray-600',
            isMuted && 'opacity-50'
          )}
        />

        {/* Muted indicator */}
        {isMuted && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-gray-500 rounded-full flex items-center justify-center">
            <VolumeX size={8} className="text-white" />
          </span>
        )}

        {/* Badge */}
        {unreadCount > 0 && !isMuted && (
          <span
            className={cn(
              'absolute flex items-center justify-center px-1',
              'font-bold text-white bg-red-500 rounded-full',
              'animate-pulse-subtle',
              badgeSizes[size]
            )}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {/* Connection status indicator */}
        {!isConnected && (
          <span
            className="absolute -bottom-0.5 -left-0.5 w-3 h-3 bg-orange-400 rounded-full border-2 border-white"
            title="Reconnecting..."
          />
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div
            className="fixed inset-0 z-40 bg-black/20 md:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Panel */}
          <div className="absolute right-0 top-full mt-2 z-50">
            <NotificationDropdown />
          </div>
        </>
      )}
    </div>
  );
};

// Simple bell without dropdown for use in other contexts
export const SimpleNotificationBell: React.FC<{
  unreadCount: number;
  onClick?: () => void;
  className?: string;
}> = ({ unreadCount, onClick, className }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative p-2 rounded-full hover:bg-gray-100 transition-colors',
        className
      )}
    >
      <Bell size={22} className="text-gray-600" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-xs font-bold text-white bg-red-500 rounded-full">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
};

export default NotificationBell;
