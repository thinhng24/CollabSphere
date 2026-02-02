// ==================== User Types ====================

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  isOnline: boolean;
  lastSeen?: Date;
  createdAt: Date;
}

export interface UserStatus {
  userId: string;
  username: string;
  isOnline: boolean;
  lastSeen?: Date;
  connectionId?: string;
}

// ==================== Conversation Types ====================

export interface Conversation {
  id: string;
  name: string;
  type: "private" | "group";
  avatarUrl?: string;
  lastMessagePreview?: string;
  lastMessageAt?: Date;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  participants: Participant[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationDetail extends Conversation {
  createdBy?: User;
  totalMessages: number;
}

export interface Participant {
  id: string;
  userId: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
  isOnline: boolean;
  lastSeen?: Date;
  role: "admin" | "member";
  joinedAt: Date;
}

export interface CreateConversationRequest {
  name: string;
  type: "private" | "group";
  participantIds: string[];
  avatarUrl?: string;
}

export interface UpdateConversationRequest {
  name?: string;
  avatarUrl?: string;
}

export interface ConversationFilter {
  searchTerm?: string;
  type?: "private" | "group";
  isPinned?: boolean;
  includeMuted?: boolean;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: "LastMessageAt" | "Name" | "CreatedAt";
  sortDescending?: boolean;
}

export interface ConversationListResponse {
  items: Conversation[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// ==================== Message Types ====================

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  type: MessageType;
  createdAt: Date;
  editedAt?: Date;
  isDeleted: boolean;
  attachment?: MessageAttachment;
  readBy: ReadStatus[];
  isOwner: boolean;
}

export enum MessageType {
  Text = 0,
  Image = 1,
  File = 2,
  System = 3,
}

export interface MessageAttachment {
  id: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  fileExtension: string;
  downloadUrl: string;
  previewUrl?: string;
}

export interface ReadStatus {
  userId: string;
  userName: string;
  readAt: Date;
}

export interface SendMessageRequest {
  conversationId: string;
  content: string;
  type?: MessageType;
  attachmentId?: string;
}

export interface EditMessageRequest {
  messageId: string;
  content: string;
}

export interface DeleteMessageRequest {
  messageId: string;
  deleteForEveryone?: boolean;
}

export interface MessageListRequest {
  conversationId: string;
  pageNumber?: number;
  pageSize?: number;
  before?: Date;
  after?: Date;
}

export interface MessageListResponse {
  messages: Message[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  hasMore: boolean;
  oldestMessageDate?: Date;
  newestMessageDate?: Date;
}

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}

// ==================== Notification Types ====================

export interface Notification {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: NotificationType;
  referenceId?: string;
  actionUrl?: string;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  timeAgo: string;
}

export enum NotificationType {
  System = "System",
  Message = "Message",
  DocumentShared = "DocumentShared",
  DocumentComment = "DocumentComment",
  GroupInvitation = "GroupInvitation",
  TaskAssignment = "TaskAssignment",
  Reminder = "Reminder",
  Mention = "Mention",
}

export interface NotificationFilter {
  page?: number;
  pageSize?: number;
  isRead?: boolean;
  type?: NotificationType;
  fromDate?: Date;
  toDate?: Date;
}

export interface NotificationListResponse {
  notifications: Notification[];
  totalCount: number;
  unreadCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface NotificationCount {
  totalCount: number;
  unreadCount: number;
  countByType: Record<string, number>;
}

export interface MarkNotificationsReadRequest {
  notificationIds?: string[];
  markAll?: boolean;
}

export interface NotificationPayload {
  action: "new" | "read" | "unread" | "delete" | "deleteAll";
  notification?: Notification;
  notificationIds?: string[];
  unreadCount: number;
}

// ==================== Document Types ====================

export interface Document {
  id: string;
  fileName: string;
  filePath: string;
  contentType: string;
  fileSize: number;
  fileExtension: string;
  description?: string;
  uploadedByUserId: string;
  uploadedByUserName: string;
  uploadedByAvatarUrl?: string;
  conversationId?: string;
  groupId?: string;
  createdAt: Date;
  updatedAt?: Date;
  downloadCount: number;
  lastDownloadedAt?: Date;
  status: DocumentStatus;
  fileSizeFormatted: string;
  isPreviewable: boolean;
  previewUrl: string;
  downloadUrl: string;
}

export enum DocumentStatus {
  Active = 1,
  Archived = 2,
  Deleted = 3,
  Processing = 4,
}

export interface DocumentUploadRequest {
  fileName?: string;
  description?: string;
  conversationId?: string;
  groupId?: string;
}

export interface DocumentUpdateRequest {
  fileName?: string;
  description?: string;
}

export interface DocumentSearchRequest {
  searchTerm?: string;
  conversationId?: string;
  groupId?: string;
  uploadedByUserId?: string;
  fileExtension?: string;
  fromDate?: Date;
  toDate?: Date;
  page?: number;
  pageSize?: number;
  sortBy?: "CreatedAt" | "FileName" | "FileSize" | "DownloadCount";
  sortDescending?: boolean;
}

export interface DocumentUploadResponse {
  success: boolean;
  message?: string;
  document?: Document;
  errors: string[];
}

export interface DocumentListResponse {
  documents: Document[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface BulkDocumentActionRequest {
  documentIds: string[];
  action: "delete" | "archive" | "move";
  targetGroupId?: string;
}

export interface BulkDocumentActionResponse {
  success: boolean;
  processedCount: number;
  failedCount: number;
  errors: string[];
}

// ==================== API Response Types ====================

export interface ApiResponse<T> {
  data?: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// ==================== SignalR Event Types ====================

export interface SignalRMessage {
  type: string;
  payload: unknown;
}

export interface ChatHubEvents {
  ReceiveMessage: (message: Message) => void;
  MessageEdited: (message: Message) => void;
  MessageDeleted: (data: { messageId: string }) => void;
  UserTyping: (indicator: TypingIndicator) => void;
  UserOnline: (status: UserStatus) => void;
  UserOffline: (status: UserStatus) => void;
  MessagesRead: (data: {
    conversationId: string;
    userId: string;
    readAt: Date;
  }) => void;
  ConversationCreated: (conversation: Conversation) => void;
  ConversationUpdated: (conversation: Partial<Conversation>) => void;
  UserJoinedConversation: (data: {
    conversationId: string;
    userId: string;
  }) => void;
  UserLeftConversation: (data: {
    conversationId: string;
    userId: string;
  }) => void;
  Error: (error: { message: string; timestamp: Date }) => void;
}

export interface NotificationHubEvents {
  ReceiveNotification: (payload: NotificationPayload) => void;
  NotificationUpdate: (payload: NotificationPayload) => void;
  NotificationMarkedAsRead: (notificationId: string) => void;
  AllNotificationsMarkedAsRead: () => void;
  NotificationDeleted: (notificationId: string) => void;
  Pong: (timestamp: Date) => void;
}

// ==================== Context Types ====================

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  refreshTokenValue: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  tokenExpiresAt: Date | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string,
    fullName?: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<void>;
}

export interface ChatContextType {
  conversations: Conversation[];
  activeConversation: ConversationDetail | null;
  messages: Message[];
  isLoading: boolean;
  isConnected: boolean;
  typingUsers: Map<string, TypingIndicator[]>;
  onlineUsers: Set<string>;
  unreadCount: number;

  // Actions
  loadConversations: (filter?: ConversationFilter) => Promise<void>;
  selectConversation: (conversationId: string) => Promise<void>;
  createConversation: (
    request: CreateConversationRequest,
  ) => Promise<Conversation>;
  sendMessage: (request: SendMessageRequest) => Promise<void>;
  editMessage: (request: EditMessageRequest) => Promise<void>;
  deleteMessage: (request: DeleteMessageRequest) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  markAsRead: (conversationId: string) => Promise<void>;
  startTyping: (conversationId: string) => void;
  stopTyping: (conversationId: string) => void;
}

export interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isConnected: boolean;

  // Actions
  loadNotifications: (filter?: NotificationFilter) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
}

export interface DocumentContextType {
  documents: Document[];
  selectedDocument: Document | null;
  isLoading: boolean;
  uploadProgress: number;

  // Actions
  loadDocuments: (request?: DocumentSearchRequest) => Promise<void>;
  uploadDocument: (
    file: File,
    request?: DocumentUploadRequest,
  ) => Promise<DocumentUploadResponse>;
  downloadDocument: (documentId: string) => Promise<void>;
  deleteDocument: (documentId: string) => Promise<void>;
  updateDocument: (
    documentId: string,
    request: DocumentUpdateRequest,
  ) => Promise<void>;
  previewDocument: (documentId: string) => Promise<string | null>;
}
