import React, { useEffect, useState, useMemo } from "react";
import { Search, Plus, Pin, BellOff, Users, User } from "lucide-react";
import { useChat } from "../../contexts/ChatContext";
import {
  cn,
  formatConversationDate,
  truncate,
  getInitials,
  stringToColor,
} from "../../lib/utils";
import { Conversation, ConversationFilter } from "../../types";

interface ConversationListProps {
  onCreateConversation?: () => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  onCreateConversation,
}) => {
  const {
    conversations,
    activeConversation,
    isLoading,
    onlineUsers,
    loadConversations,
    selectConversation,
  } = useChat();

  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "groups">("all");

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Filter and search conversations
  const filteredConversations = useMemo(() => {
    let result = [...conversations];

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (conv) =>
          conv.name.toLowerCase().includes(term) ||
          conv.lastMessagePreview?.toLowerCase().includes(term),
      );
    }

    // Apply filter
    switch (filter) {
      case "unread":
        result = result.filter((conv) => conv.unreadCount > 0);
        break;
      case "groups":
        result = result.filter((conv) => conv.type === "group");
        break;
    }

    // Sort: pinned first, then by last message date
    result.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return dateB - dateA;
    });

    return result;
  }, [conversations, searchTerm, filter]);

  const handleSelectConversation = (conversationId: string) => {
    selectConversation(conversationId);
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Messages</h2>
        <button
          onClick={onCreateConversation}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
          title="New conversation"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-transparent rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex px-3 pb-2 gap-1">
        {(["all", "unread", "groups"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-full transition-colors",
              filter === f
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:bg-gray-100",
            )}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <p className="text-sm">No conversations found</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={activeConversation?.id === conversation.id}
                isOnline={
                  conversation.type === "private" &&
                  conversation.participants.some((p) =>
                    onlineUsers.has(p.userId),
                  )
                }
                onClick={() => handleSelectConversation(conversation.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

// ==================== Conversation Item ====================

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  isOnline: boolean;
  onClick: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isActive,
  isOnline,
  onClick,
}) => {
  const {
    name,
    type,
    avatarUrl,
    lastMessagePreview,
    lastMessageAt,
    unreadCount,
    isPinned,
    isMuted,
  } = conversation;

  return (
    <li>
      <button
        onClick={onClick}
        className={cn(
          "w-full flex items-start gap-3 p-3 text-left transition-colors",
          isActive ? "bg-blue-50" : "hover:bg-gray-50",
        )}
      >
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-medium"
              style={{ backgroundColor: stringToColor(name) }}
            >
              {type === "group" ? <Users size={20} /> : getInitials(name)}
            </div>
          )}
          {/* Online indicator */}
          {type === "private" && isOnline && (
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className={cn(
                  "font-medium truncate",
                  unreadCount > 0 ? "text-gray-900" : "text-gray-700",
                )}
              >
                {name}
              </span>
              {isPinned && (
                <Pin size={12} className="text-gray-400 flex-shrink-0" />
              )}
              {isMuted && (
                <BellOff size={12} className="text-gray-400 flex-shrink-0" />
              )}
            </div>
            <span className="text-xs text-gray-500 flex-shrink-0">
              {formatConversationDate(lastMessageAt)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 mt-0.5">
            <p
              className={cn(
                "text-sm truncate",
                unreadCount > 0 ? "text-gray-900 font-medium" : "text-gray-500",
              )}
            >
              {lastMessagePreview || "No messages yet"}
            </p>
            {unreadCount > 0 && (
              <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium text-white bg-blue-600 rounded-full">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
        </div>
      </button>
    </li>
  );
};

export default ConversationList;
