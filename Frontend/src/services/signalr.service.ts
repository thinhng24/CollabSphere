import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
  HttpTransportType,
  IRetryPolicy,
  RetryContext,
} from "@microsoft/signalr";

// Types for SignalR events
export type ConnectionCallback = (isConnected: boolean) => void;
export type MessageCallback<T> = (data: T) => void;

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * SignalR Service for managing real-time connections
 * Handles Chat and Notification hubs
 */
class SignalRService {
  private chatConnection: HubConnection | null = null;
  private notificationConnection: HubConnection | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;

  // Connection state callbacks
  private chatConnectionCallbacks: Set<ConnectionCallback> = new Set();
  private notificationConnectionCallbacks: Set<ConnectionCallback> = new Set();

  // Message handlers
  private chatHandlers: Map<string, Set<MessageCallback<unknown>>> = new Map();
  private notificationHandlers: Map<string, Set<MessageCallback<unknown>>> =
    new Map();

  /**
   * Build a new hub connection with common configuration
   * In development mode, token can be empty and backend will use demo auth
   */
  private buildConnection(hubPath: string, accessToken: string): HubConnection {
    const isDev = import.meta.env.DEV;

    const builder = new HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}${hubPath}`, {
        // Only use token factory if token is provided
        ...(accessToken ? { accessTokenFactory: () => accessToken } : {}),
        transport:
          HttpTransportType.WebSockets |
          HttpTransportType.ServerSentEvents |
          HttpTransportType.LongPolling,
        withCredentials: true,
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (
          retryContext: RetryContext,
        ): number | null => {
          if (retryContext.previousRetryCount >= this.maxReconnectAttempts) {
            return null; // Stop retrying
          }
          // Exponential backoff
          return Math.min(
            1000 * Math.pow(2, retryContext.previousRetryCount),
            30000,
          );
        },
      } as IRetryPolicy)
      .configureLogging(isDev ? LogLevel.Information : LogLevel.Warning);

    return builder.build();
  }

  /**
   * Configure connection event handlers
   */
  private setupConnectionEvents(
    connection: HubConnection,
    callbacks: Set<ConnectionCallback>,
    connectionName: string,
  ): void {
    connection.onreconnecting((error: Error | undefined) => {
      console.log(`[${connectionName}] Reconnecting...`, error);
      callbacks.forEach((cb) => cb(false));
    });

    connection.onreconnected((connectionId: string | undefined) => {
      console.log(`[${connectionName}] Reconnected with ID: ${connectionId}`);
      this.reconnectAttempts = 0;
      callbacks.forEach((cb) => cb(true));
    });

    connection.onclose((error: Error | undefined) => {
      console.log(`[${connectionName}] Connection closed`, error);
      callbacks.forEach((cb) => cb(false));
    });
  }

  // ==================== Chat Hub ====================

  /**
   * Start the chat hub connection
   */
  async startChatConnection(accessToken: string): Promise<boolean> {
    if (this.chatConnection?.state === HubConnectionState.Connected) {
      console.log("[ChatHub] Already connected");
      return true;
    }

    try {
      this.chatConnection = this.buildConnection("/hubs/chat", accessToken);
      this.setupConnectionEvents(
        this.chatConnection,
        this.chatConnectionCallbacks,
        "ChatHub",
      );

      // Register all existing handlers
      this.chatHandlers.forEach((handlers, event) => {
        handlers.forEach((handler) => {
          this.chatConnection?.on(event, handler);
        });
      });

      await this.chatConnection.start();
      console.log("[ChatHub] Connected successfully");
      this.chatConnectionCallbacks.forEach((cb) => cb(true));
      return true;
    } catch (error) {
      console.error("[ChatHub] Connection failed:", error);
      this.chatConnectionCallbacks.forEach((cb) => cb(false));
      return false;
    }
  }

  /**
   * Stop the chat hub connection
   */
  async stopChatConnection(): Promise<void> {
    if (this.chatConnection) {
      try {
        await this.chatConnection.stop();
        console.log("[ChatHub] Disconnected");
      } catch (error) {
        console.error("[ChatHub] Error stopping connection:", error);
      }
      this.chatConnection = null;
    }
  }

  /**
   * Register a callback for chat connection state changes
   */
  onChatConnectionChange(callback: ConnectionCallback): () => void {
    this.chatConnectionCallbacks.add(callback);
    return () => this.chatConnectionCallbacks.delete(callback);
  }

  /**
   * Subscribe to a chat event
   */
  onChatEvent<T>(event: string, callback: MessageCallback<T>): () => void {
    if (!this.chatHandlers.has(event)) {
      this.chatHandlers.set(event, new Set());
    }
    this.chatHandlers.get(event)?.add(callback as MessageCallback<unknown>);

    // If already connected, register the handler immediately
    if (this.chatConnection?.state === HubConnectionState.Connected) {
      this.chatConnection.on(event, callback);
    }

    // Return unsubscribe function
    return () => {
      this.chatHandlers
        .get(event)
        ?.delete(callback as MessageCallback<unknown>);
      this.chatConnection?.off(event, callback);
    };
  }

  /**
   * Invoke a method on the chat hub
   */
  async invokeChatMethod<T = void>(
    method: string,
    ...args: unknown[]
  ): Promise<T> {
    if (this.chatConnection?.state !== HubConnectionState.Connected) {
      throw new Error("Chat hub is not connected");
    }
    return this.chatConnection.invoke<T>(method, ...args);
  }

  /**
   * Join a conversation group
   */
  async joinConversation(conversationId: string): Promise<void> {
    await this.invokeChatMethod("JoinConversation", conversationId);
  }

  /**
   * Leave a conversation group
   */
  async leaveConversation(conversationId: string): Promise<void> {
    await this.invokeChatMethod("LeaveConversation", conversationId);
  }

  /**
   * Start typing indicator
   */
  async startTyping(conversationId: string): Promise<void> {
    await this.invokeChatMethod("StartTyping", conversationId);
  }

  /**
   * Stop typing indicator
   */
  async stopTyping(conversationId: string): Promise<void> {
    await this.invokeChatMethod("StopTyping", conversationId);
  }

  /**
   * Mark messages as read
   */
  async markAsRead(conversationId: string): Promise<void> {
    await this.invokeChatMethod("MarkAsRead", conversationId);
  }

  /**
   * Get online status of users
   */
  async getOnlineStatus(userIds: string[]): Promise<void> {
    await this.invokeChatMethod("GetOnlineStatus", userIds);
  }

  /**
   * Get active users in a conversation
   */
  async getActiveUsers(conversationId: string): Promise<void> {
    await this.invokeChatMethod("GetActiveUsers", conversationId);
  }

  // ==================== Notification Hub ====================

  /**
   * Start the notification hub connection
   */
  async startNotificationConnection(accessToken: string): Promise<boolean> {
    if (this.notificationConnection?.state === HubConnectionState.Connected) {
      console.log("[NotificationHub] Already connected");
      return true;
    }

    try {
      this.notificationConnection = this.buildConnection(
        "/hubs/notifications",
        accessToken,
      );
      this.setupConnectionEvents(
        this.notificationConnection,
        this.notificationConnectionCallbacks,
        "NotificationHub",
      );

      // Register all existing handlers
      this.notificationHandlers.forEach((handlers, event) => {
        handlers.forEach((handler) => {
          this.notificationConnection?.on(event, handler);
        });
      });

      await this.notificationConnection.start();
      console.log("[NotificationHub] Connected successfully");
      this.notificationConnectionCallbacks.forEach((cb) => cb(true));
      return true;
    } catch (error) {
      console.error("[NotificationHub] Connection failed:", error);
      this.notificationConnectionCallbacks.forEach((cb) => cb(false));
      return false;
    }
  }

  /**
   * Stop the notification hub connection
   */
  async stopNotificationConnection(): Promise<void> {
    if (this.notificationConnection) {
      try {
        await this.notificationConnection.stop();
        console.log("[NotificationHub] Disconnected");
      } catch (error) {
        console.error("[NotificationHub] Error stopping connection:", error);
      }
      this.notificationConnection = null;
    }
  }

  /**
   * Register a callback for notification connection state changes
   */
  onNotificationConnectionChange(callback: ConnectionCallback): () => void {
    this.notificationConnectionCallbacks.add(callback);
    return () => this.notificationConnectionCallbacks.delete(callback);
  }

  /**
   * Subscribe to a notification event
   */
  onNotificationEvent<T>(
    event: string,
    callback: MessageCallback<T>,
  ): () => void {
    if (!this.notificationHandlers.has(event)) {
      this.notificationHandlers.set(event, new Set());
    }
    this.notificationHandlers
      .get(event)
      ?.add(callback as MessageCallback<unknown>);

    // If already connected, register the handler immediately
    if (this.notificationConnection?.state === HubConnectionState.Connected) {
      this.notificationConnection.on(event, callback);
    }

    // Return unsubscribe function
    return () => {
      this.notificationHandlers
        .get(event)
        ?.delete(callback as MessageCallback<unknown>);
      this.notificationConnection?.off(event, callback);
    };
  }

  /**
   * Invoke a method on the notification hub
   */
  async invokeNotificationMethod<T = void>(
    method: string,
    ...args: unknown[]
  ): Promise<T> {
    if (this.notificationConnection?.state !== HubConnectionState.Connected) {
      throw new Error("Notification hub is not connected");
    }
    return this.notificationConnection.invoke<T>(method, ...args);
  }

  /**
   * Mark a notification as read via SignalR
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    await this.invokeNotificationMethod("MarkAsRead", notificationId);
  }

  /**
   * Mark all notifications as read via SignalR
   */
  async markAllNotificationsAsRead(): Promise<void> {
    await this.invokeNotificationMethod("MarkAllAsRead");
  }

  /**
   * Delete a notification via SignalR
   */
  async deleteNotification(notificationId: string): Promise<void> {
    await this.invokeNotificationMethod("DeleteNotification", notificationId);
  }

  /**
   * Subscribe to specific notification types
   */
  async subscribeToNotificationTypes(types: string[]): Promise<void> {
    await this.invokeNotificationMethod("SubscribeToTypes", types);
  }

  /**
   * Unsubscribe from specific notification types
   */
  async unsubscribeFromNotificationTypes(types: string[]): Promise<void> {
    await this.invokeNotificationMethod("UnsubscribeFromTypes", types);
  }

  /**
   * Ping the notification hub to keep connection alive
   */
  async pingNotificationHub(): Promise<void> {
    await this.invokeNotificationMethod("Ping");
  }

  // ==================== Utility Methods ====================

  /**
   * Start all hub connections
   */
  async startAllConnections(accessToken: string): Promise<{
    chat: boolean;
    notification: boolean;
  }> {
    const [chat, notification] = await Promise.all([
      this.startChatConnection(accessToken),
      this.startNotificationConnection(accessToken),
    ]);
    return { chat, notification };
  }

  /**
   * Stop all hub connections
   */
  async stopAllConnections(): Promise<void> {
    await Promise.all([
      this.stopChatConnection(),
      this.stopNotificationConnection(),
    ]);
  }

  /**
   * Get current connection states
   */
  getConnectionStates(): {
    chat: HubConnectionState;
    notification: HubConnectionState;
  } {
    return {
      chat: this.chatConnection?.state ?? HubConnectionState.Disconnected,
      notification:
        this.notificationConnection?.state ?? HubConnectionState.Disconnected,
    };
  }

  /**
   * Check if chat hub is connected
   */
  get isChatConnected(): boolean {
    return this.chatConnection?.state === HubConnectionState.Connected;
  }

  /**
   * Check if notification hub is connected
   */
  get isNotificationConnected(): boolean {
    return this.notificationConnection?.state === HubConnectionState.Connected;
  }
}

// Export singleton instance
export const signalRService = new SignalRService();

// Export class for testing
export { SignalRService };
