import React from 'react';
import { Phone, Video, MoreVertical, ArrowLeft, Users, Info, Bell, BellOff, Pin, Search } from 'lucide-react';
import { ConversationDetail, Participant } from '../../types';
import { cn, getInitials, stringToColor } from '../../lib/utils';

interface ChatHeaderProps {
  conversation: ConversationDetail | null;
  onlineUsers: Set<string>;
  typingUsers?: string[];
  onBack?: () => void;
  onInfoClick?: () => void;
  onVoiceCall?: () => void;
  onVideoCall?: () => void;
  onSearch?: () => void;
  onToggleMute?: () => void;
  onTogglePin?: () => void;
  className?: string;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  conversation,
  onlineUsers,
  typingUsers = [],
  onBack,
  onInfoClick,
  onVoiceCall,
  onVideoCall,
  onSearch,
  onToggleMute,
  onTogglePin,
  className,
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

  if (!conversation) {
    return (
      <div className={cn('flex items-center justify-center h-16 border-b bg-white', className)}>
        <p className="text-gray-500">Select a conversation to start chatting</p>
      </div>
    );
  }

  const { name, type, avatarUrl, participants, isMuted, isPinned } = conversation;

  // Get online participants
  const onlineParticipants = participants.filter((p) => onlineUsers.has(p.userId));
  const isOnline = type === 'private' && onlineParticipants.length > 0;

  // Get status text
  const getStatusText = (): string => {
    if (typingUsers.length > 0) {
      if (typingUsers.length === 1) {
        return `${typingUsers[0]} is typing...`;
      }
      return `${typingUsers.length} people are typing...`;
    }

    if (type === 'group') {
      const onlineCount = onlineParticipants.length;
      return `${participants.length} members${onlineCount > 0 ? `, ${onlineCount} online` : ''}`;
    }

    if (isOnline) {
      return 'Online';
    }

    // Find the other participant for private chat
    const otherParticipant = participants[0];
    if (otherParticipant?.lastSeen) {
      return `Last seen ${new Date(otherParticipant.lastSeen).toLocaleString()}`;
    }

    return 'Offline';
  };

  return (
    <div className={cn('flex items-center justify-between h-16 px-4 border-b bg-white', className)}>
      {/* Left section */}
      <div className="flex items-center gap-3">
        {/* Back button (mobile) */}
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 -ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full lg:hidden"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        {/* Avatar */}
        <div className="relative cursor-pointer" onClick={onInfoClick}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
              style={{ backgroundColor: stringToColor(name) }}
            >
              {type === 'group' ? <Users size={18} /> : getInitials(name)}
            </div>
          )}
          {/* Online indicator */}
          {isOnline && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
          )}
        </div>

        {/* Name and status */}
        <div className="cursor-pointer" onClick={onInfoClick}>
          <h3 className="font-semibold text-gray-900 flex items-center gap-1.5">
            {name}
            {isPinned && <Pin size={12} className="text-gray-400" />}
            {isMuted && <BellOff size={12} className="text-gray-400" />}
          </h3>
          <p
            className={cn(
              'text-sm',
              typingUsers.length > 0
                ? 'text-green-600 font-medium'
                : isOnline
                ? 'text-green-600'
                : 'text-gray-500'
            )}
          >
            {getStatusText()}
          </p>
        </div>
      </div>

      {/* Right section - Action buttons */}
      <div className="flex items-center gap-1">
        {/* Search in conversation */}
        {onSearch && (
          <button
            onClick={onSearch}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
            title="Search in conversation"
          >
            <Search className="w-5 h-5" />
          </button>
        )}

        {/* Voice call */}
        {onVoiceCall && (
          <button
            onClick={onVoiceCall}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
            title="Voice call"
          >
            <Phone className="w-5 h-5" />
          </button>
        )}

        {/* Video call */}
        {onVideoCall && (
          <button
            onClick={onVideoCall}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
            title="Video call"
          >
            <Video className="w-5 h-5" />
          </button>
        )}

        {/* Info */}
        {onInfoClick && (
          <button
            onClick={onInfoClick}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
            title="Conversation info"
          >
            <Info className="w-5 h-5" />
          </button>
        )}

        {/* More options */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
            title="More options"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {/* Dropdown menu */}
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
              {onTogglePin && (
                <button
                  onClick={() => {
                    onTogglePin();
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <Pin className="w-4 h-4" />
                  {isPinned ? 'Unpin conversation' : 'Pin conversation'}
                </button>
              )}
              {onToggleMute && (
                <button
                  onClick={() => {
                    onToggleMute();
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  {isMuted ? (
                    <>
                      <Bell className="w-4 h-4" />
                      Unmute notifications
                    </>
                  ) : (
                    <>
                      <BellOff className="w-4 h-4" />
                      Mute notifications
                    </>
                  )}
                </button>
              )}
              {onSearch && (
                <button
                  onClick={() => {
                    onSearch();
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  Search messages
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
