import React from 'react';
import { cn, getInitials, stringToColor } from '../../lib/utils';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: AvatarSize;
  isOnline?: boolean;
  showOnlineIndicator?: boolean;
  className?: string;
  onClick?: () => void;
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

const onlineIndicatorSizes: Record<AvatarSize, string> = {
  xs: 'w-2 h-2 border',
  sm: 'w-2.5 h-2.5 border-2',
  md: 'w-3 h-3 border-2',
  lg: 'w-3.5 h-3.5 border-2',
  xl: 'w-4 h-4 border-2',
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  isOnline = false,
  showOnlineIndicator = false,
  className,
  onClick,
}) => {
  const initials = getInitials(name);
  const backgroundColor = stringToColor(name);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    // Hide broken image and show initials instead
    e.currentTarget.style.display = 'none';
  };

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center rounded-full flex-shrink-0',
        sizeClasses[size],
        onClick && 'cursor-pointer',
        className
      )}
      style={{ backgroundColor: src ? 'transparent' : backgroundColor }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className={cn(
            'w-full h-full rounded-full object-cover',
            sizeClasses[size]
          )}
          onError={handleImageError}
        />
      ) : (
        <span className="font-medium text-white select-none">{initials}</span>
      )}

      {/* Online indicator */}
      {showOnlineIndicator && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-white',
            onlineIndicatorSizes[size],
            isOnline ? 'bg-green-500' : 'bg-gray-400'
          )}
        />
      )}
    </div>
  );
};

// Avatar Group Component
interface AvatarGroupProps {
  users: Array<{
    id: string;
    name: string;
    avatarUrl?: string | null;
  }>;
  max?: number;
  size?: AvatarSize;
  className?: string;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  users,
  max = 3,
  size = 'sm',
  className,
}) => {
  const visibleUsers = users.slice(0, max);
  const remainingCount = users.length - max;

  const overlapClasses: Record<AvatarSize, string> = {
    xs: '-ml-1.5',
    sm: '-ml-2',
    md: '-ml-2.5',
    lg: '-ml-3',
    xl: '-ml-4',
  };

  return (
    <div className={cn('flex items-center', className)}>
      {visibleUsers.map((user, index) => (
        <div
          key={user.id}
          className={cn(
            'ring-2 ring-white rounded-full',
            index > 0 && overlapClasses[size]
          )}
          style={{ zIndex: visibleUsers.length - index }}
        >
          <Avatar src={user.avatarUrl} name={user.name} size={size} />
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          className={cn(
            'flex items-center justify-center rounded-full bg-gray-200 text-gray-600 font-medium ring-2 ring-white',
            sizeClasses[size],
            overlapClasses[size]
          )}
          style={{ zIndex: 0 }}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
};

export default Avatar;
