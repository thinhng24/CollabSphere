import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import {
  Conversation,
  ConversationDetail,
  Message,
  ConversationFilter,
  CreateConversationRequest,
  SendMessageRequest,
  EditMessageRequest,
  DeleteMessageRequest,
  TypingIndicator,
  UserStatus,
  ChatContextType,
} from "../types";
import { chatApi } from "../services/api.service";
import { signalRService } from "../services/signalr.service";
import toast from "react-hot-toast";

// ==================== State ====================

interface ChatState {
  conversations: Conversation[];
  activeConversation: ConversationDetail | null;
  messages: Message[];
  isLoading: boolean;
  isLoadingMessages: boolean;
  isConnected: boolean;
  typingUsers: Map<string, TypingIndicator[]>;
  onlineUsers: Set<string>;
  unreadCount: number;
  hasMoreMessages: boolean;
  currentPage: number;
}

const initialState: ChatState = {
  conversations: [],
  activeConversation: null,
  messages: [],
  isLoading: false,
  isLoadingMessages: false,
  isConnected: false,
  typingUsers: new Map(),
  onlineUsers: new Set(),
  unreadCount: 0,
  hasMoreMessages: true,
  currentPage: 1,
};

// ==================== Actions ====================

type ChatAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_LOADING_MESSAGES"; payload: boolean }
  | { type: "SET_CONNECTED"; payload: boolean }
  | { type: "SET_CONVERSATIONS"; payload: Conversation[] }
  | { type: "ADD_CONVERSATION"; payload: Conversation }
  | {
      type: "UPDATE_CONVERSATION";
      payload: Partial<Conversation> & { id: string };
    }
  | { type: "SET_ACTIVE_CONVERSATION"; payload: ConversationDetail | null }
  | { type: "SET_MESSAGES"; payload: { messages: Message[]; hasMore: boolean } }
  | { type: "ADD_MESSAGE"; payload: Message }
  | { type: "UPDATE_MESSAGE"; payload: Message }
  | { type: "DELETE_MESSAGE"; payload: string }
  | {
      type: "PREPEND_MESSAGES";
      payload: { messages: Message[]; hasMore: boolean };
    }
  | { type: "SET_TYPING"; payload: TypingIndicator }
  | { type: "SET_USER_ONLINE"; payload: UserStatus }
  | { type: "SET_USER_OFFLINE"; payload: UserStatus }
  | { type: "SET_UNREAD_COUNT"; payload: number }
  | { type: "INCREMENT_PAGE" }
  | { type: "RESET_MESSAGES" };

// ==================== Reducer ====================

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

    case "SET_LOADING_MESSAGES":
      return { ...state, isLoadingMessages: action.payload };

    case "SET_CONNECTED":
      return { ...state, isConnected: action.payload };

    case "SET_CONVERSATIONS":
      return { ...state, conversations: action.payload };

    case "ADD_CONVERSATION":
      return {
        ...state,
        conversations: [action.payload, ...state.conversations],
      };

    case "UPDATE_CONVERSATION": {
      const updated = state.conversations.map((conv) =>
        conv.id === action.payload.id ? { ...conv, ...action.payload } : conv,
      );
      // Re-sort by lastMessageAt
      updated.sort((a, b) => {
        const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return dateB - dateA;
      });
      return { ...state, conversations: updated };
    }

    case "SET_ACTIVE_CONVERSATION":
      return {
        ...state,
        activeConversation: action.payload,
        messages: [],
        hasMoreMessages: true,
        currentPage: 1,
      };

    case "SET_MESSAGES":
      return {
        ...state,
        messages: action.payload.messages,
        hasMoreMessages: action.payload.hasMore,
      };

    case "ADD_MESSAGE": {
      // Avoid duplicates
      const exists = state.messages.some((m) => m.id === action.payload.id);
      if (exists) return state;
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };
    }

    case "UPDATE_MESSAGE":
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.payload.id ? action.payload : m,
        ),
      };

    case "DELETE_MESSAGE":
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.payload
            ? { ...m, isDeleted: true, content: "Message deleted" }
            : m,
        ),
      };

    case "PREPEND_MESSAGES":
      return {
        ...state,
        messages: [...action.payload.messages, ...state.messages],
        hasMoreMessages: action.payload.hasMore,
      };

    case "SET_TYPING": {
      const newTypingUsers = new Map(state.typingUsers);
      const conversationTyping =
        newTypingUsers.get(action.payload.conversationId) || [];

      if (action.payload.isTyping) {
        // Add typing user if not already present
        const exists = conversationTyping.some(
          (t) => t.userId === action.payload.userId,
        );
        if (!exists) {
          newTypingUsers.set(action.payload.conversationId, [
            ...conversationTyping,
            action.payload,
          ]);
        }
      } else {
        // Remove typing user
        newTypingUsers.set(
          action.payload.conversationId,
          conversationTyping.filter((t) => t.userId !== action.payload.userId),
        );
      }
      return { ...state, typingUsers: newTypingUsers };
    }

    case "SET_USER_ONLINE": {
      const newOnline = new Set(state.onlineUsers);
      newOnline.add(action.payload.userId);
      return { ...state, onlineUsers: newOnline };
    }

    case "SET_USER_OFFLINE": {
      const newOnline = new Set(state.onlineUsers);
      newOnline.delete(action.payload.userId);
      return { ...state, onlineUsers: newOnline };
    }

    case "SET_UNREAD_COUNT":
      return { ...state, unreadCount: action.payload };

    case "INCREMENT_PAGE":
      return { ...state, currentPage: state.currentPage + 1 };

    case "RESET_MESSAGES":
      return {
        ...state,
        messages: [],
        hasMoreMessages: true,
        currentPage: 1,
      };

    default:
      return state;
  }
}

// ==================== Context ====================

const ChatContext = createContext<ChatContextType | null>(null);

interface ChatProviderProps {
  children: ReactNode;
  accessToken?: string | null;
}

export function ChatProvider({ children, accessToken }: ChatProviderProps) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const typingTimeoutRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  // ==================== SignalR Connection ====================

  useEffect(() => {
    // In development mode, connect without token (demo auth on backend)
    const isDev = import.meta.env.DEV;

    const connect = async () => {
      try {
        // Use empty string for token in dev mode - backend handles demo auth
        const tokenToUse = accessToken || (isDev ? "" : null);
        if (tokenToUse === null) {
          dispatch({ type: "SET_CONNECTED", payload: false });
          return;
        }

        const success = await signalRService.startChatConnection(tokenToUse);
        dispatch({ type: "SET_CONNECTED", payload: success });

        if (success) {
          console.log("[Chat] SignalR connected successfully");
        }
      } catch (error) {
        console.error("[Chat] Failed to connect SignalR:", error);
        dispatch({ type: "SET_CONNECTED", payload: false });
      }
    };

    connect();

    const unsubscribeConnection = signalRService.onChatConnectionChange(
      (isConnected) => {
        dispatch({ type: "SET_CONNECTED", payload: isConnected });
      },
    );

    return () => {
      unsubscribeConnection();
      signalRService.stopChatConnection();
    };
  }, [accessToken]);

  // ==================== SignalR Event Handlers ====================

  useEffect(() => {
    // Receive new message
    const unsubMessage = signalRService.onChatEvent<Message>(
      "ReceiveMessage",
      (message) => {
        console.log("[Chat] ReceiveMessage event:", message);
        dispatch({ type: "ADD_MESSAGE", payload: message });
        // Update conversation list
        dispatch({
          type: "UPDATE_CONVERSATION",
          payload: {
            id: message.conversationId,
            lastMessagePreview: message.content,
            lastMessageAt: message.createdAt,
          },
        });
      },
    );

    // Message edited
    const unsubEdit = signalRService.onChatEvent<Message>(
      "MessageEdited",
      (message) => {
        dispatch({ type: "UPDATE_MESSAGE", payload: message });
      },
    );

    // Message deleted
    const unsubDelete = signalRService.onChatEvent<{ messageId: string }>(
      "MessageDeleted",
      (data) => {
        dispatch({ type: "DELETE_MESSAGE", payload: data.messageId });
      },
    );

    // Typing indicator
    const unsubTyping = signalRService.onChatEvent<TypingIndicator>(
      "UserTyping",
      (indicator) => {
        dispatch({ type: "SET_TYPING", payload: indicator });
      },
    );

    // User online
    const unsubOnline = signalRService.onChatEvent<UserStatus>(
      "UserOnline",
      (status) => {
        dispatch({ type: "SET_USER_ONLINE", payload: status });
      },
    );

    // User offline
    const unsubOffline = signalRService.onChatEvent<UserStatus>(
      "UserOffline",
      (status) => {
        dispatch({ type: "SET_USER_OFFLINE", payload: status });
      },
    );

    // New conversation created
    const unsubConvCreated = signalRService.onChatEvent<Conversation>(
      "ConversationCreated",
      (conversation) => {
        console.log("[Chat] ConversationCreated event:", conversation);
        dispatch({ type: "ADD_CONVERSATION", payload: conversation });
      },
    );

    // Conversation updated
    const unsubConvUpdated = signalRService.onChatEvent<
      Partial<Conversation> & { id: string }
    >("ConversationUpdated", (data) => {
      dispatch({ type: "UPDATE_CONVERSATION", payload: data });
    });

    return () => {
      unsubMessage();
      unsubEdit();
      unsubDelete();
      unsubTyping();
      unsubOnline();
      unsubOffline();
      unsubConvCreated();
      unsubConvUpdated();
    };
  }, []);

  // ==================== Actions ====================

  const loadConversations = useCallback(async (filter?: ConversationFilter) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const response = await chatApi.getConversations(filter);
      dispatch({ type: "SET_CONVERSATIONS", payload: response.items });

      // Calculate total unread
      const unread = response.items.reduce(
        (sum, conv) => sum + conv.unreadCount,
        0,
      );
      dispatch({ type: "SET_UNREAD_COUNT", payload: unread });
    } catch (error) {
      console.error("Failed to load conversations:", error);
      toast.error("Failed to load conversations");
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  const selectConversation = useCallback(
    async (conversationId: string) => {
      dispatch({ type: "SET_LOADING_MESSAGES", payload: true });
      try {
        // Leave previous conversation group (ignore errors if not connected)
        if (state.activeConversation) {
          try {
            await signalRService.leaveConversation(state.activeConversation.id);
          } catch (e) {
            console.log("[Chat] Could not leave previous conversation:", e);
          }
        }

        // Get conversation details
        const conversation = await chatApi.getConversation(conversationId);
        dispatch({ type: "SET_ACTIVE_CONVERSATION", payload: conversation });

        // Join new conversation group (ignore errors if not connected)
        try {
          await signalRService.joinConversation(conversationId);
          console.log("[Chat] Joined conversation group:", conversationId);
        } catch (e) {
          console.log("[Chat] Could not join conversation via SignalR:", e);
        }

        // Load messages
        const messagesResponse = await chatApi.getMessages(
          conversationId,
          1,
          50,
        );
        dispatch({
          type: "SET_MESSAGES",
          payload: {
            messages: messagesResponse.messages.reverse(), // Oldest first
            hasMore: messagesResponse.hasMore,
          },
        });

        // Mark as read (ignore errors)
        try {
          await chatApi.markAsRead(conversationId);
          dispatch({
            type: "UPDATE_CONVERSATION",
            payload: { id: conversationId, unreadCount: 0 },
          });
        } catch (e) {
          console.log("[Chat] Could not mark as read:", e);
        }
      } catch (error) {
        console.error("Failed to select conversation:", error);
        toast.error("Failed to load conversation");
      } finally {
        dispatch({ type: "SET_LOADING_MESSAGES", payload: false });
      }
    },
    [state.activeConversation],
  );

  const createConversation = useCallback(
    async (request: CreateConversationRequest): Promise<Conversation> => {
      try {
        const conversation = await chatApi.createConversation(request);
        dispatch({ type: "ADD_CONVERSATION", payload: conversation });
        toast.success("Conversation created");
        return conversation;
      } catch (error) {
        console.error("Failed to create conversation:", error);
        toast.error("Failed to create conversation");
        throw error;
      }
    },
    [],
  );

  const sendMessage = useCallback(async (request: SendMessageRequest) => {
    try {
      const message = await chatApi.sendMessage(
        request.conversationId,
        request,
      );
      // Message will be received via SignalR
      console.log("Message sent:", message.id);
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
      throw error;
    }
  }, []);

  const editMessage = useCallback(async (request: EditMessageRequest) => {
    try {
      await chatApi.editMessage(request.messageId, request);
      // Update will come via SignalR
    } catch (error) {
      console.error("Failed to edit message:", error);
      toast.error("Failed to edit message");
      throw error;
    }
  }, []);

  const deleteMessage = useCallback(async (request: DeleteMessageRequest) => {
    try {
      await chatApi.deleteMessage(
        request.messageId,
        request.deleteForEveryone ?? false,
      );
      // Update will come via SignalR
    } catch (error) {
      console.error("Failed to delete message:", error);
      toast.error("Failed to delete message");
      throw error;
    }
  }, []);

  const loadMoreMessages = useCallback(async () => {
    if (
      !state.activeConversation ||
      !state.hasMoreMessages ||
      state.isLoadingMessages
    ) {
      return;
    }

    dispatch({ type: "SET_LOADING_MESSAGES", payload: true });
    try {
      const oldestMessage = state.messages[0];
      if (!oldestMessage) return;

      const response = await chatApi.getMessagesBefore(
        state.activeConversation.id,
        oldestMessage.createdAt,
        50,
      );

      dispatch({
        type: "PREPEND_MESSAGES",
        payload: {
          messages: response.messages.reverse(),
          hasMore: response.hasMore,
        },
      });
      dispatch({ type: "INCREMENT_PAGE" });
    } catch (error) {
      console.error("Failed to load more messages:", error);
    } finally {
      dispatch({ type: "SET_LOADING_MESSAGES", payload: false });
    }
  }, [
    state.activeConversation,
    state.hasMoreMessages,
    state.isLoadingMessages,
    state.messages,
  ]);

  const markAsRead = useCallback(async (conversationId: string) => {
    try {
      await chatApi.markAsRead(conversationId);
      await signalRService.markAsRead(conversationId);
      dispatch({
        type: "UPDATE_CONVERSATION",
        payload: { id: conversationId, unreadCount: 0 },
      });
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  }, []);

  const startTyping = useCallback((conversationId: string) => {
    // Clear existing timeout
    const existingTimeout = typingTimeoutRef.current.get(conversationId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Send typing event
    signalRService.startTyping(conversationId).catch(console.error);

    // Set timeout to stop typing after 3 seconds
    const timeout = setTimeout(() => {
      signalRService.stopTyping(conversationId).catch(console.error);
      typingTimeoutRef.current.delete(conversationId);
    }, 3000);

    typingTimeoutRef.current.set(conversationId, timeout);
  }, []);

  const stopTyping = useCallback((conversationId: string) => {
    const timeout = typingTimeoutRef.current.get(conversationId);
    if (timeout) {
      clearTimeout(timeout);
      typingTimeoutRef.current.delete(conversationId);
    }
    signalRService.stopTyping(conversationId).catch(console.error);
  }, []);

  // ==================== Context Value ====================

  const value: ChatContextType = {
    conversations: state.conversations,
    activeConversation: state.activeConversation,
    messages: state.messages,
    isLoading: state.isLoading,
    isConnected: state.isConnected,
    typingUsers: state.typingUsers,
    onlineUsers: state.onlineUsers,
    unreadCount: state.unreadCount,
    loadConversations,
    selectConversation,
    createConversation,
    sendMessage,
    editMessage,
    deleteMessage,
    loadMoreMessages,
    markAsRead,
    startTyping,
    stopTyping,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

// ==================== Hook ====================

export function useChat(): ChatContextType {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
