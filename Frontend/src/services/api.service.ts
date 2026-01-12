import axios, {
  AxiosInstance,
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import {
  ApiResponse,
  Conversation,
  ConversationDetail,
  ConversationFilter,
  ConversationListResponse,
  CreateConversationRequest,
  UpdateConversationRequest,
  Message,
  MessageListResponse,
  SendMessageRequest,
  EditMessageRequest,
  DeleteMessageRequest,
  Notification,
  NotificationFilter,
  NotificationListResponse,
  NotificationCount,
  MarkNotificationsReadRequest,
  Document,
  DocumentSearchRequest,
  DocumentListResponse,
  DocumentUploadRequest,
  DocumentUploadResponse,
  DocumentUpdateRequest,
  BulkDocumentActionRequest,
  BulkDocumentActionResponse,
} from "../types";

// ==================== Configuration ====================

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// ==================== Axios Instance ====================

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ==================== Storage Keys ====================

const STORAGE_KEYS = {
  ACCESS_TOKEN: "auth_access_token",
  REFRESH_TOKEN: "auth_refresh_token",
  ACCESS_TOKEN_EXPIRES: "auth_access_token_expires",
  REFRESH_TOKEN_EXPIRES: "auth_refresh_token_expires",
} as const;

// ==================== Token Management ====================

let authToken: string | null = null;
let refreshToken: string | null = null;
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string | null) => void;
  reject: (error: Error) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export const setAuthToken = (token: string | null): void => {
  authToken = token;
  if (token) {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  } else {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  }
};

export const setRefreshToken = (token: string | null): void => {
  refreshToken = token;
  if (token) {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  } else {
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  }
};

export const getAuthToken = (): string | null => {
  if (!authToken) {
    authToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }
  return authToken;
};

export const getRefreshToken = (): string | null => {
  if (!refreshToken) {
    refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }
  return refreshToken;
};

export const clearAuthTokens = (): void => {
  authToken = null;
  refreshToken = null;
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
};

const isTokenExpired = (expiresKey: string): boolean => {
  const expiresAt = localStorage.getItem(expiresKey);
  if (!expiresAt) return true;
  try {
    const expiry = new Date(expiresAt);
    // Consider token expired 30 seconds before actual expiry
    return expiry.getTime() - 30000 < Date.now();
  } catch {
    return true;
  }
};

// Refresh token API call
const refreshAccessToken = async (): Promise<string | null> => {
  const currentAccessToken = getAuthToken();
  const currentRefreshToken = getRefreshToken();

  if (!currentAccessToken || !currentRefreshToken) {
    throw new Error("No tokens available for refresh");
  }

  // Check if refresh token is expired
  if (isTokenExpired(STORAGE_KEYS.REFRESH_TOKEN_EXPIRES)) {
    throw new Error("Refresh token has expired");
  }

  const response = await axios.post<{
    success: boolean;
    message?: string;
    data?: {
      accessToken: string;
      refreshToken: string;
      accessTokenExpiresAt: string;
      refreshTokenExpiresAt: string;
    };
  }>(`${API_BASE_URL}/auth/refresh`, {
    accessToken: currentAccessToken,
    refreshToken: currentRefreshToken,
  });

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || "Token refresh failed");
  }

  const {
    accessToken,
    refreshToken: newRefreshToken,
    accessTokenExpiresAt,
    refreshTokenExpiresAt,
  } = response.data.data;

  // Update stored tokens
  setAuthToken(accessToken);
  setRefreshToken(newRefreshToken);
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRES, accessTokenExpiresAt);
  localStorage.setItem(
    STORAGE_KEYS.REFRESH_TOKEN_EXPIRES,
    refreshTokenExpiresAt,
  );

  console.log("[API] Token refreshed successfully");
  return accessToken;
};

// ==================== Request Interceptor ====================

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Skip token for auth endpoints (except /me, /validate, /logout)
    const isAuthEndpoint = config.url?.includes("/auth/");
    const requiresAuth =
      config.url?.includes("/auth/me") ||
      config.url?.includes("/auth/validate") ||
      config.url?.includes("/auth/logout") ||
      config.url?.includes("/auth/change-password") ||
      config.url?.includes("/auth/revoke-all");

    if (isAuthEndpoint && !requiresAuth) {
      return config;
    }

    let token = getAuthToken();

    // Check if token is expired and try to refresh
    if (token && isTokenExpired(STORAGE_KEYS.ACCESS_TOKEN_EXPIRES)) {
      const currentRefreshToken = getRefreshToken();

      if (
        currentRefreshToken &&
        !isTokenExpired(STORAGE_KEYS.REFRESH_TOKEN_EXPIRES)
      ) {
        // Try to refresh the token
        if (!isRefreshing) {
          isRefreshing = true;

          try {
            token = await refreshAccessToken();
            processQueue(null, token);
          } catch (refreshError) {
            processQueue(refreshError as Error, null);
            clearAuthTokens();
            window.location.href = "/login";
            return Promise.reject(refreshError);
          } finally {
            isRefreshing = false;
          }
        } else {
          // Wait for the refresh to complete
          token = await new Promise<string | null>((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          });
        }
      }
    }

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

// ==================== Response Interceptor ====================

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle 401 errors (token expired during request)
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      // Check if we can refresh the token
      const currentRefreshToken = getRefreshToken();

      if (
        currentRefreshToken &&
        !isTokenExpired(STORAGE_KEYS.REFRESH_TOKEN_EXPIRES)
      ) {
        if (!isRefreshing) {
          isRefreshing = true;

          try {
            const newToken = await refreshAccessToken();
            processQueue(null, newToken);

            // Retry the original request with the new token
            if (newToken && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return apiClient(originalRequest);
          } catch (refreshError) {
            processQueue(refreshError as Error, null);
            clearAuthTokens();
            window.location.href = "/login";
            return Promise.reject(refreshError);
          } finally {
            isRefreshing = false;
          }
        } else {
          // Wait for the refresh to complete and retry
          return new Promise((resolve, reject) => {
            failedQueue.push({
              resolve: (token) => {
                if (token && originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                resolve(apiClient(originalRequest));
              },
              reject: (err) => {
                reject(err);
              },
            });
          });
        }
      } else {
        // No refresh token or it's expired - redirect to login
        clearAuthTokens();
        window.location.href = "/login";
      }
    }

    if (error.response?.status === 403) {
      console.error("[API] Access forbidden:", error.response.data);
    }

    if (error.response?.status === 500) {
      console.error("[API] Server error:", error.response.data);
    }

    return Promise.reject(error);
  },
);

// ==================== Generic API Methods ====================

const handleResponse = <T>(response: { data: T }): T => response.data;

const handleError = (error: AxiosError): never => {
  const message =
    (error.response?.data as { message?: string })?.message || error.message;
  throw new Error(message);
};

// ==================== Chat API Service ====================

export const chatApi = {
  // Conversations
  getConversations: async (
    filter?: ConversationFilter,
  ): Promise<ConversationListResponse> => {
    try {
      const response = await apiClient.get<ConversationListResponse>(
        "/chat/conversations",
        {
          params: filter,
        },
      );
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  getConversation: async (
    conversationId: string,
  ): Promise<ConversationDetail> => {
    try {
      const response = await apiClient.get<ConversationDetail>(
        `/chat/conversations/${conversationId}`,
      );
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  createConversation: async (
    request: CreateConversationRequest,
  ): Promise<ConversationDetail> => {
    try {
      const response = await apiClient.post<ConversationDetail>(
        "/chat/conversations",
        request,
      );
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  getOrCreatePrivateConversation: async (
    otherUserId: string,
  ): Promise<ConversationDetail> => {
    try {
      const response = await apiClient.post<ConversationDetail>(
        `/chat/conversations/private/${otherUserId}`,
      );
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  updateConversation: async (
    conversationId: string,
    request: UpdateConversationRequest,
  ): Promise<ConversationDetail> => {
    try {
      const response = await apiClient.put<ConversationDetail>(
        `/chat/conversations/${conversationId}`,
        request,
      );
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  leaveConversation: async (conversationId: string): Promise<void> => {
    try {
      await apiClient.post(`/chat/conversations/${conversationId}/leave`);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  addParticipants: async (
    conversationId: string,
    userIds: string[],
  ): Promise<ConversationDetail> => {
    try {
      const response = await apiClient.post<ConversationDetail>(
        `/chat/conversations/${conversationId}/participants`,
        { userIds },
      );
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  removeParticipant: async (
    conversationId: string,
    userId: string,
  ): Promise<void> => {
    try {
      await apiClient.delete(
        `/chat/conversations/${conversationId}/participants/${userId}`,
      );
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  searchConversations: async (
    searchTerm: string,
    limit = 10,
  ): Promise<Conversation[]> => {
    try {
      const response = await apiClient.get<Conversation[]>(
        "/chat/conversations/search",
        {
          params: { searchTerm, limit },
        },
      );
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  togglePin: async (
    conversationId: string,
    isPinned: boolean,
  ): Promise<void> => {
    try {
      await apiClient.post(
        `/chat/conversations/${conversationId}/pin`,
        isPinned,
      );
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  toggleMute: async (
    conversationId: string,
    isMuted: boolean,
  ): Promise<void> => {
    try {
      await apiClient.post(
        `/chat/conversations/${conversationId}/mute`,
        isMuted,
      );
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  // Messages
  getMessages: async (
    conversationId: string,
    pageNumber = 1,
    pageSize = 50,
  ): Promise<MessageListResponse> => {
    try {
      const response = await apiClient.get<MessageListResponse>(
        `/chat/conversations/${conversationId}/messages`,
        { params: { pageNumber, pageSize } },
      );
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  getMessagesBefore: async (
    conversationId: string,
    beforeDate: Date,
    limit = 50,
  ): Promise<MessageListResponse> => {
    try {
      const response = await apiClient.get<MessageListResponse>(
        `/chat/conversations/${conversationId}/messages/before`,
        { params: { beforeDate: beforeDate.toISOString(), limit } },
      );
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  getMessagesAfter: async (
    conversationId: string,
    afterDate: Date,
  ): Promise<Message[]> => {
    try {
      const response = await apiClient.get<Message[]>(
        `/chat/conversations/${conversationId}/messages/after`,
        { params: { afterDate: afterDate.toISOString() } },
      );
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  sendMessage: async (
    conversationId: string,
    request: SendMessageRequest,
  ): Promise<Message> => {
    try {
      const response = await apiClient.post<Message>(
        `/chat/conversations/${conversationId}/messages`,
        request,
      );
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  editMessage: async (
    messageId: string,
    request: EditMessageRequest,
  ): Promise<Message> => {
    try {
      const response = await apiClient.put<Message>(
        `/chat/messages/${messageId}`,
        request,
      );
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  deleteMessage: async (
    messageId: string,
    deleteForEveryone = false,
  ): Promise<void> => {
    try {
      await apiClient.delete(`/chat/messages/${messageId}`, {
        params: { deleteForEveryone },
      });
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  searchMessages: async (
    conversationId: string,
    searchTerm: string,
    pageNumber = 1,
    pageSize = 20,
  ): Promise<MessageListResponse> => {
    try {
      const response = await apiClient.get<MessageListResponse>(
        `/chat/conversations/${conversationId}/messages/search`,
        { params: { searchTerm, pageNumber, pageSize } },
      );
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  markAsRead: async (
    conversationId: string,
  ): Promise<{ markedCount: number }> => {
    try {
      const response = await apiClient.post<{ markedCount: number }>(
        `/chat/conversations/${conversationId}/read`,
      );
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  getUnreadCount: async (): Promise<{ unreadCount: number }> => {
    try {
      const response = await apiClient.get<{ unreadCount: number }>(
        "/chat/unread-count",
      );
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },
};

// ==================== Notification API Service ====================

export const notificationApi = {
  getNotifications: async (
    filter?: NotificationFilter,
  ): Promise<NotificationListResponse> => {
    try {
      const response = await apiClient.get<NotificationListResponse>(
        "/notification",
        {
          params: filter,
        },
      );
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  getNotification: async (id: string): Promise<Notification> => {
    try {
      const response = await apiClient.get<Notification>(`/notification/${id}`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  getRecentNotifications: async (count = 10): Promise<Notification[]> => {
    try {
      const response = await apiClient.get<Notification[]>(
        "/notification/recent",
        {
          params: { count },
        },
      );
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  getUnreadCount: async (): Promise<{ unreadCount: number }> => {
    try {
      const response = await apiClient.get<{ unreadCount: number }>(
        "/notification/unread-count",
      );
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  getStats: async (): Promise<NotificationCount> => {
    try {
      const response = await apiClient.get<NotificationCount>(
        "/notification/stats",
      );
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  markAsRead: async (id: string): Promise<void> => {
    try {
      await apiClient.patch(`/notification/${id}/read`);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  markMultipleAsRead: async (
    request: MarkNotificationsReadRequest,
  ): Promise<{ markedCount: number }> => {
    try {
      const response = await apiClient.patch<{ markedCount: number }>(
        "/notification/read",
        request,
      );
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  markAllAsRead: async (): Promise<{ markedCount: number }> => {
    try {
      const response = await apiClient.patch<{ markedCount: number }>(
        "/notification/read-all",
      );
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  markAsUnread: async (id: string): Promise<void> => {
    try {
      await apiClient.patch(`/notification/${id}/unread`);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  deleteNotification: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/notification/${id}`);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  deleteAllNotifications: async (): Promise<{ deletedCount: number }> => {
    try {
      const response = await apiClient.delete<{ deletedCount: number }>(
        "/notification/all",
      );
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },
};

// ==================== Document API Service ====================

export const documentApi = {
  upload: async (
    file: File,
    request?: DocumentUploadRequest,
    onProgress?: (progress: number) => void,
  ): Promise<DocumentUploadResponse> => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (request?.conversationId)
        formData.append("conversationId", request.conversationId);
      if (request?.groupId) formData.append("groupId", request.groupId);
      if (request?.description)
        formData.append("description", request.description);
      if (request?.fileName) formData.append("fileName", request.fileName);

      const response = await apiClient.post<Document>(
        "/document/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total && onProgress) {
              const progress = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total,
              );
              onProgress(progress);
            }
          },
        },
      );
      // Backend returns DocumentDto directly, wrap it in DocumentUploadResponse
      const document = handleResponse(response);
      return {
        success: true,
        document: document,
        errors: [],
      };
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      return {
        success: false,
        message:
          axiosError.response?.data?.message ||
          axiosError.message ||
          "Upload failed",
        errors: [axiosError.message || "Upload failed"],
      };
    }
  },

  uploadMultiple: async (
    files: File[],
    conversationId?: string,
    groupId?: string,
  ): Promise<DocumentUploadResponse[]> => {
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      if (conversationId) formData.append("conversationId", conversationId);
      if (groupId) formData.append("groupId", groupId);

      const response = await apiClient.post<DocumentUploadResponse[]>(
        "/document/upload-multiple",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  download: async (documentId: string): Promise<Blob> => {
    try {
      const response = await apiClient.get(`/document/${documentId}/download`, {
        responseType: "blob",
      });
      return response.data;
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  getPreviewUrl: async (
    documentId: string,
  ): Promise<{ previewUrl: string }> => {
    try {
      const response = await apiClient.get<{ previewUrl: string }>(
        `/document/${documentId}/preview`,
      );
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  getById: async (documentId: string): Promise<Document> => {
    try {
      const response = await apiClient.get<Document>(`/document/${documentId}`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  getMyDocuments: async (): Promise<Document[]> => {
    try {
      const response = await apiClient.get<Document[]>(
        "/document/my-documents",
      );
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  getRecentDocuments: async (count = 10): Promise<Document[]> => {
    try {
      const response = await apiClient.get<Document[]>("/document/recent", {
        params: { count },
      });
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  getConversationDocuments: async (
    conversationId: string,
  ): Promise<Document[]> => {
    try {
      const response = await apiClient.get<Document[]>(
        `/document/conversation/${conversationId}`,
      );
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  search: async (
    request: DocumentSearchRequest,
  ): Promise<DocumentListResponse> => {
    try {
      const response = await apiClient.post<DocumentListResponse>(
        "/document/search",
        request,
      );
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  update: async (
    documentId: string,
    request: DocumentUpdateRequest,
  ): Promise<Document> => {
    try {
      const response = await apiClient.put<Document>(
        `/document/${documentId}`,
        request,
      );
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  delete: async (documentId: string): Promise<void> => {
    try {
      await apiClient.delete(`/document/${documentId}`);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  bulkAction: async (
    request: BulkDocumentActionRequest,
  ): Promise<BulkDocumentActionResponse> => {
    try {
      const response = await apiClient.post<BulkDocumentActionResponse>(
        "/document/bulk-action",
        request,
      );
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  getStorageStats: async (): Promise<{
    storageUsed: number;
    storageUsedFormatted: string;
    documentCount: number;
  }> => {
    try {
      const response = await apiClient.get<{
        storageUsed: number;
        storageUsedFormatted: string;
        documentCount: number;
      }>("/document/storage-stats");
      return handleResponse(response);
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },
};

// ==================== User API Service ====================

export interface UserSearchResult {
  id: string;
  username: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  isOnline: boolean;
  createdAt: string;
}

export const userApi = {
  searchUsers: async (
    searchTerm?: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<UserSearchResult[]> => {
    try {
      const response = await apiClient.get<ApiResponse<UserSearchResult[]>>(
        "/auth/users",
        {
          params: { searchTerm, page, pageSize },
        },
      );
      return response.data.data || [];
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },
};

// ==================== Export Default ====================

export default {
  chat: chatApi,
  notification: notificationApi,
  document: documentApi,
  user: userApi,
  setAuthToken,
  getAuthToken,
};
