import React, { useEffect, useState } from "react";
import { useChat } from "../../contexts/ChatContext";
import { useAuth } from "../../contexts/AuthContext";
import ConversationList from "./ConversationList";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import CreateConversationModal from "./CreateConversationModal";
import { cn, copyToClipboard } from "../../lib/utils";
import {
  Menu,
  X,
  Phone,
  Video,
  MoreVertical,
  Users,
  Settings,
  Search,
  Info,
  ArrowLeft,
  Wifi,
  WifiOff,
} from "lucide-react";
import toast from "react-hot-toast";

interface ChatContainerProps {
  className?: string;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({ className }) => {
  const { user } = useAuth();
  const {
    activeConversation,
    messages,
    typingUsers,
    isConnected,
    isLoading,
    loadMoreMessages,
    editMessage,
    deleteMessage,
  } = useChat();

  const [showSidebar, setShowSidebar] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setShowSidebar(true);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Hide sidebar on mobile when conversation is selected
  useEffect(() => {
    if (isMobile && activeConversation) {
      setShowSidebar(false);
    }
  }, [activeConversation, isMobile]);

  const handleEditMessage = (messageId: string, content: string) => {
    const newContent = prompt("Edit message:", content);
    if (newContent && newContent !== content) {
      editMessage({ messageId, content: newContent });
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    if (confirm("Delete this message?")) {
      deleteMessage({ messageId, deleteForEveryone: true });
    }
  };

  const handleCopyMessage = async (content: string) => {
    const success = await copyToClipboard(content);
    if (success) {
      toast.success("Message copied");
    }
  };

  const currentTypingUsers = activeConversation
    ? typingUsers.get(activeConversation.id) || []
    : [];

  return (
    <div className={cn("flex h-full bg-gray-50", className)}>
      {/* Sidebar - Conversation List */}
      <div
        className={cn(
          "w-full md:w-80 lg:w-96 flex-shrink-0 transition-all duration-300",
          isMobile && !showSidebar && "hidden",
          !isMobile && "border-r border-gray-200",
        )}
      >
        <ConversationList
          onCreateConversation={() => setShowCreateModal(true)}
        />
      </div>

      {/* Main Chat Area */}
      <div
        className={cn(
          "flex-1 flex flex-col",
          isMobile && showSidebar && "hidden",
        )}
      >
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
              <div className="flex items-center gap-3">
                {/* Back button on mobile */}
                {isMobile && (
                  <button
                    onClick={() => setShowSidebar(true)}
                    className="p-2 -ml-2 hover:bg-gray-100 rounded-full"
                  >
                    <ArrowLeft size={20} />
                  </button>
                )}

                {/* Avatar */}
                <div className="relative">
                  {activeConversation.avatarUrl ? (
                    <img
                      src={activeConversation.avatarUrl}
                      alt={activeConversation.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                      {activeConversation.type === "group" ? (
                        <Users size={18} />
                      ) : (
                        activeConversation.name.charAt(0).toUpperCase()
                      )}
                    </div>
                  )}
                </div>

                {/* Name and status */}
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {activeConversation.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {activeConversation.type === "group" ? (
                      `${activeConversation.participants.length} members`
                    ) : currentTypingUsers.length > 0 ? (
                      <span className="text-green-600">typing...</span>
                    ) : (
                      "Online"
                    )}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                {/* Connection Status */}
                <div
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-full text-xs",
                    isConnected
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700",
                  )}
                >
                  {isConnected ? (
                    <>
                      <Wifi size={12} />
                      <span className="hidden sm:inline">Connected</span>
                    </>
                  ) : (
                    <>
                      <WifiOff size={12} />
                      <span className="hidden sm:inline">Disconnected</span>
                    </>
                  )}
                </div>

                <button
                  className="p-2 hover:bg-gray-100 rounded-full text-gray-600"
                  title="Search in conversation"
                >
                  <Search size={20} />
                </button>

                <button
                  className="p-2 hover:bg-gray-100 rounded-full text-gray-600 hidden sm:block"
                  title="Voice call"
                >
                  <Phone size={20} />
                </button>

                <button
                  className="p-2 hover:bg-gray-100 rounded-full text-gray-600 hidden sm:block"
                  title="Video call"
                >
                  <Video size={20} />
                </button>

                <button
                  onClick={() => setShowInfo(!showInfo)}
                  className={cn(
                    "p-2 hover:bg-gray-100 rounded-full",
                    showInfo ? "text-blue-600 bg-blue-50" : "text-gray-600",
                  )}
                  title="Conversation info"
                >
                  <Info size={20} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <MessageList
              messages={messages}
              currentUserId={user?.id || ""}
              typingIndicators={currentTypingUsers}
              isLoading={isLoading}
              hasMore={true}
              onLoadMore={loadMoreMessages}
              onEditMessage={handleEditMessage}
              onDeleteMessage={handleDeleteMessage}
              onCopyMessage={handleCopyMessage}
            />

            {/* Input */}
            <MessageInput
              conversationId={activeConversation.id}
              disabled={!isConnected}
            />
          </>
        ) : (
          // No conversation selected
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                <Users className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Welcome to Chat
              </h3>
              <p className="text-gray-500 max-w-sm">
                Select a conversation from the sidebar to start messaging, or
                create a new one.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Info Panel (optional) */}
      {showInfo && activeConversation && (
        <div className="w-80 border-l border-gray-200 bg-white hidden lg:block">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold">Conversation Info</h3>
            <button
              onClick={() => setShowInfo(false)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-4">
            {/* Avatar and name */}
            <div className="text-center mb-6">
              {activeConversation.avatarUrl ? (
                <img
                  src={activeConversation.avatarUrl}
                  alt={activeConversation.name}
                  className="w-20 h-20 rounded-full mx-auto mb-3 object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-blue-500 mx-auto mb-3 flex items-center justify-center text-white text-2xl font-bold">
                  {activeConversation.name.charAt(0).toUpperCase()}
                </div>
              )}
              <h4 className="text-lg font-semibold">
                {activeConversation.name}
              </h4>
              <p className="text-sm text-gray-500">
                {activeConversation.type === "group"
                  ? `Group · ${activeConversation.participants.length} members`
                  : "Private conversation"}
              </p>
            </div>

            {/* Participants */}
            {activeConversation.type === "group" && (
              <div className="mb-6">
                <h5 className="text-sm font-medium text-gray-900 mb-3">
                  Members ({activeConversation.participants.length})
                </h5>
                <ul className="space-y-2">
                  {activeConversation.participants.map((participant) => (
                    <li
                      key={participant.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
                    >
                      {participant.avatarUrl ? (
                        <img
                          src={participant.avatarUrl}
                          alt={participant.fullName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium">
                          {participant.fullName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {participant.fullName}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {participant.role}
                        </p>
                      </div>
                      {participant.isOnline && (
                        <span className="w-2 h-2 bg-green-500 rounded-full" />
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2">
              <button className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <Search size={18} />
                <span>Search in conversation</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings size={18} />
                <span>Notification settings</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Create Conversation Modal */}
      <CreateConversationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
};

export default ChatContainer;
