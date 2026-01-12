import React, { useEffect, useRef, useCallback } from "react";
import { Message, TypingIndicator } from "../../types";
import {
  cn,
  formatMessageTime,
  getInitials,
  stringToColor,
} from "../../lib/utils";
import {
  Check,
  CheckCheck,
  MoreVertical,
  Edit2,
  Trash2,
  Copy,
  Reply,
  FileIcon,
  ImageIcon,
  Loader2,
} from "lucide-react";

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  typingIndicators?: TypingIndicator[];
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onEditMessage?: (messageId: string, content: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onCopyMessage?: (content: string) => void;
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  onEdit?: (messageId: string, content: string) => void;
  onDelete?: (messageId: string) => void;
  onCopy?: (content: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  showAvatar,
  onEdit,
  onDelete,
  onCopy,
}) => {
  const [showMenu, setShowMenu] = React.useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const renderAttachment = () => {
    if (!message.attachment) return null;

    const { attachment } = message;
    const isImage = attachment.contentType.startsWith("image/");

    if (isImage) {
      return (
        <div className="mt-2 max-w-xs">
          <img
            src={attachment.previewUrl || attachment.downloadUrl}
            alt={attachment.fileName}
            className="rounded-lg max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(attachment.downloadUrl, "_blank")}
          />
          <p className="text-xs mt-1 opacity-70">{attachment.fileName}</p>
        </div>
      );
    }

    return (
      <a
        href={attachment.downloadUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "mt-2 flex items-center gap-2 p-2 rounded-lg transition-colors",
          isOwn
            ? "bg-white/10 hover:bg-white/20"
            : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600",
        )}
      >
        <FileIcon className="w-5 h-5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{attachment.fileName}</p>
          <p className="text-xs opacity-70">
            {attachment.fileExtension.toUpperCase()} •{" "}
            {Math.round(attachment.fileSize / 1024)} KB
          </p>
        </div>
      </a>
    );
  };

  const renderReadStatus = () => {
    if (!isOwn) return null;

    const hasBeenRead = message.readBy.length > 0;
    return hasBeenRead ? (
      <CheckCheck className="w-4 h-4 text-blue-400" />
    ) : (
      <Check className="w-4 h-4 opacity-50" />
    );
  };

  if (message.isDeleted) {
    return (
      <div
        className={cn(
          "flex items-start gap-2 mb-4",
          isOwn ? "flex-row-reverse" : "flex-row",
        )}
      >
        {showAvatar && !isOwn && (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0"
            style={{ backgroundColor: stringToColor(message.senderName) }}
          >
            {message.senderAvatar ? (
              <img
                src={message.senderAvatar}
                alt={message.senderName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              getInitials(message.senderName)
            )}
          </div>
        )}
        {!showAvatar && !isOwn && <div className="w-8 shrink-0" />}
        <div
          className={cn(
            "px-4 py-2 rounded-2xl max-w-[70%] italic text-gray-500 dark:text-gray-400",
            isOwn
              ? "bg-gray-200 dark:bg-gray-700"
              : "bg-gray-100 dark:bg-gray-800",
          )}
        >
          This message was deleted
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-start gap-2 mb-4 group",
        isOwn ? "flex-row-reverse" : "flex-row",
      )}
    >
      {/* Avatar */}
      {showAvatar && !isOwn && (
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0"
          style={{ backgroundColor: stringToColor(message.senderName) }}
        >
          {message.senderAvatar ? (
            <img
              src={message.senderAvatar}
              alt={message.senderName}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            getInitials(message.senderName)
          )}
        </div>
      )}
      {!showAvatar && !isOwn && <div className="w-8 shrink-0" />}

      {/* Message Content */}
      <div className={cn("flex flex-col", isOwn ? "items-end" : "items-start")}>
        {/* Sender name for group chats */}
        {showAvatar && !isOwn && (
          <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 ml-1">
            {message.senderName}
          </span>
        )}

        <div className="relative flex items-center gap-1">
          {/* Context Menu Button (appears on hover) */}
          {isOwn && (
            <div
              ref={menuRef}
              className={cn(
                "opacity-0 group-hover:opacity-100 transition-opacity relative",
                showMenu && "opacity-100",
              )}
            >
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              >
                <MoreVertical className="w-4 h-4 text-gray-500" />
              </button>

              {/* Dropdown Menu */}
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10 min-w-[120px]">
                  {onEdit && (
                    <button
                      onClick={() => {
                        onEdit(message.id, message.content);
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                  )}
                  {onCopy && (
                    <button
                      onClick={() => {
                        onCopy(message.content);
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      Copy
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => {
                        onDelete(message.id);
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Message Bubble */}
          <div
            className={cn(
              "px-4 py-2 rounded-2xl max-w-[70%]",
              isOwn
                ? "bg-blue-500 text-white rounded-br-md"
                : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md",
            )}
            style={{ wordBreak: "normal", overflowWrap: "anywhere" }}
          >
            <p className="whitespace-pre-wrap">{message.content}</p>
            {renderAttachment()}
          </div>

          {/* Context Menu Button for other's messages */}
          {!isOwn && onCopy && (
            <button
              onClick={() => onCopy(message.content)}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-opacity"
              title="Copy message"
            >
              <Copy className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>

        {/* Time and read status */}
        <div
          className={cn(
            "flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-400",
            isOwn ? "mr-1" : "ml-1",
          )}
        >
          <span>{formatMessageTime(message.createdAt)}</span>
          {message.editedAt && <span className="italic">(edited)</span>}
          {renderReadStatus()}
        </div>
      </div>
    </div>
  );
};

const TypingBubble: React.FC<{ indicators: TypingIndicator[] }> = ({
  indicators,
}) => {
  if (indicators.length === 0) return null;

  const names =
    indicators.length === 1
      ? indicators[0].userName
      : indicators.length === 2
        ? `${indicators[0].userName} and ${indicators[1].userName}`
        : `${indicators[0].userName} and ${indicators.length - 1} others`;

  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
        <div className="flex gap-1">
          <span
            className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
      <span className="text-sm text-gray-500 dark:text-gray-400 italic">
        {names} {indicators.length === 1 ? "is" : "are"} typing...
      </span>
    </div>
  );
};

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserId,
  typingIndicators = [],
  isLoading = false,
  hasMore = false,
  onLoadMore,
  onEditMessage,
  onDeleteMessage,
  onCopyMessage,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(messages.length);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      // New message added, scroll to bottom
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages.length]);

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (!containerRef.current || !hasMore || isLoading) return;

    const { scrollTop } = containerRef.current;
    if (scrollTop < 100 && onLoadMore) {
      onLoadMore();
    }
  }, [hasMore, isLoading, onLoadMore]);

  // Check if we should show avatar (first message or different sender)
  const shouldShowAvatar = (index: number): boolean => {
    if (index === 0) return true;
    return messages[index].senderId !== messages[index - 1].senderId;
  };

  // Group messages by date
  const renderDateDivider = (date: Date, index: number): React.ReactNode => {
    if (index === 0) return null;

    const prevDate = new Date(messages[index - 1].createdAt);
    const currentDate = new Date(date);

    if (prevDate.toDateString() !== currentDate.toDateString()) {
      return (
        <div className="flex items-center justify-center my-4">
          <div className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-xs text-gray-600 dark:text-gray-300">
            {currentDate.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <ImageIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
            No messages yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Start the conversation by sending a message below.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-4 scroll-smooth"
    >
      {/* Loading indicator at top */}
      {isLoading && hasMore && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      )}

      {/* Messages */}
      {messages.map((message, index) => (
        <React.Fragment key={message.id}>
          {renderDateDivider(message.createdAt, index)}
          <MessageBubble
            message={message}
            isOwn={message.senderId === currentUserId || message.isOwner}
            showAvatar={shouldShowAvatar(index)}
            onEdit={onEditMessage}
            onDelete={onDeleteMessage}
            onCopy={onCopyMessage}
          />
        </React.Fragment>
      ))}

      {/* Typing indicators */}
      <TypingBubble indicators={typingIndicators} />

      {/* Scroll anchor */}
      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;
