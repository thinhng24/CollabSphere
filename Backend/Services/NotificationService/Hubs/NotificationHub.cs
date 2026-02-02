using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using NotificationService.Models.DTOs;
using System.Collections.Concurrent;

namespace NotificationService.Hubs;

/// <summary>
/// SignalR Hub for real-time notifications
/// Handles connection management and notification broadcasting
/// </summary>
[Authorize]
public class NotificationHub : Hub
{
    private readonly ILogger<NotificationHub> _logger;

    // Track user connections (userId -> connectionIds)
    private static readonly ConcurrentDictionary<string, HashSet<string>> _userConnections = new();

    public NotificationHub(ILogger<NotificationHub> logger)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    #region Connection Lifecycle

    /// <summary>
    /// Called when a client connects to the hub
    /// </summary>
    public override async Task OnConnectedAsync()
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
        {
            _logger.LogWarning("Notification hub connection attempt without valid user ID");
            await base.OnConnectedAsync();
            return;
        }

        var connectionId = Context.ConnectionId;

        // Add connection to user's connection list
        _userConnections.AddOrUpdate(
            userId,
            new HashSet<string> { connectionId },
            (_, connections) =>
            {
                lock (connections)
                {
                    connections.Add(connectionId);
                }
                return connections;
            });

        // Add user to their personal group for targeted notifications
        await Groups.AddToGroupAsync(connectionId, $"user_{userId}");

        _logger.LogInformation("User {UserId} connected to notification hub. Connection: {ConnectionId}", userId, connectionId);

        // Send unread count on connect
        await Clients.Caller.SendAsync("Connected", new
        {
            ConnectionId = connectionId,
            Timestamp = DateTime.UtcNow
        });

        await base.OnConnectedAsync();
    }

    /// <summary>
    /// Called when a client disconnects from the hub
    /// </summary>
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = GetUserId();
        var connectionId = Context.ConnectionId;

        if (!string.IsNullOrEmpty(userId))
        {
            // Remove connection from user's connection list
            if (_userConnections.TryGetValue(userId, out var connections))
            {
                lock (connections)
                {
                    connections.Remove(connectionId);

                    if (connections.Count == 0)
                    {
                        _userConnections.TryRemove(userId, out _);
                    }
                }
            }

            // Remove from personal group
            await Groups.RemoveFromGroupAsync(connectionId, $"user_{userId}");

            _logger.LogInformation("User {UserId} disconnected from notification hub. Connection: {ConnectionId}", userId, connectionId);
        }

        if (exception != null)
        {
            _logger.LogError(exception, "Notification hub connection {ConnectionId} disconnected with error", connectionId);
        }

        await base.OnDisconnectedAsync(exception);
    }

    #endregion

    #region Client Methods

    /// <summary>
    /// Subscribe to notifications for specific conversation
    /// </summary>
    /// <param name="conversationId">The conversation ID to subscribe to</param>
    public async Task SubscribeToConversation(string conversationId)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
        {
            await SendError("Not authenticated");
            return;
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, $"conversation_{conversationId}");
        _logger.LogDebug("User {UserId} subscribed to conversation {ConversationId} notifications", userId, conversationId);
    }

    /// <summary>
    /// Unsubscribe from notifications for specific conversation
    /// </summary>
    /// <param name="conversationId">The conversation ID to unsubscribe from</param>
    public async Task UnsubscribeFromConversation(string conversationId)
    {
        var userId = GetUserId();

        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"conversation_{conversationId}");
        _logger.LogDebug("User {UserId} unsubscribed from conversation {ConversationId} notifications", userId, conversationId);
    }

    /// <summary>
    /// Mark a notification as read
    /// </summary>
    /// <param name="notificationId">The notification ID to mark as read</param>
    public async Task MarkAsRead(string notificationId)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
        {
            await SendError("Not authenticated");
            return;
        }

        // Notify all user's connections about the read status
        await Clients.Group($"user_{userId}").SendAsync("NotificationRead", new
        {
            NotificationId = notificationId,
            ReadAt = DateTime.UtcNow
        });

        _logger.LogDebug("User {UserId} marked notification {NotificationId} as read", userId, notificationId);
    }

    /// <summary>
    /// Mark all notifications as read
    /// </summary>
    public async Task MarkAllAsRead()
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
        {
            await SendError("Not authenticated");
            return;
        }

        await Clients.Group($"user_{userId}").SendAsync("AllNotificationsRead", new
        {
            ReadAt = DateTime.UtcNow
        });

        _logger.LogDebug("User {UserId} marked all notifications as read", userId);
    }

    /// <summary>
    /// Dismiss a notification
    /// </summary>
    /// <param name="notificationId">The notification ID to dismiss</param>
    public async Task Dismiss(string notificationId)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
        {
            await SendError("Not authenticated");
            return;
        }

        await Clients.Group($"user_{userId}").SendAsync("NotificationDismissed", new
        {
            NotificationId = notificationId,
            DismissedAt = DateTime.UtcNow
        });

        _logger.LogDebug("User {UserId} dismissed notification {NotificationId}", userId, notificationId);
    }

    /// <summary>
    /// Request current unread count
    /// </summary>
    public async Task RequestUnreadCount()
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
        {
            await SendError("Not authenticated");
            return;
        }

        // This would typically call the notification service to get the actual count
        // For now, send a request acknowledgment
        await Clients.Caller.SendAsync("UnreadCountRequested", new
        {
            UserId = userId,
            RequestedAt = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Ping to keep connection alive
    /// </summary>
    public async Task Ping()
    {
        await Clients.Caller.SendAsync("Pong", new
        {
            Timestamp = DateTime.UtcNow
        });
    }

    #endregion

    #region Helper Methods

    /// <summary>
    /// Get the current user's ID from the connection context
    /// </summary>
    private string? GetUserId()
    {
        return Context.UserIdentifier ?? Context.User?.FindFirst("sub")?.Value;
    }

    /// <summary>
    /// Send an error message to the caller
    /// </summary>
    private async Task SendError(string message)
    {
        await Clients.Caller.SendAsync("Error", new
        {
            Message = message,
            Timestamp = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Check if a user is connected
    /// </summary>
    public static bool IsUserConnected(string userId)
    {
        return _userConnections.ContainsKey(userId);
    }

    /// <summary>
    /// Get all connection IDs for a user
    /// </summary>
    public static IEnumerable<string> GetUserConnections(string userId)
    {
        if (_userConnections.TryGetValue(userId, out var connections))
        {
            lock (connections)
            {
                return connections.ToList();
            }
        }
        return Enumerable.Empty<string>();
    }

    /// <summary>
    /// Get count of connected users
    /// </summary>
    public static int GetConnectedUsersCount()
    {
        return _userConnections.Count;
    }

    /// <summary>
    /// Get all connected user IDs
    /// </summary>
    public static IEnumerable<string> GetConnectedUserIds()
    {
        return _userConnections.Keys.ToList();
    }

    #endregion
}

/// <summary>
/// Static helper class for sending notifications through the hub
/// Can be used by services to broadcast notifications
/// </summary>
public static class NotificationHubExtensions
{
    /// <summary>
    /// Send notification to a specific user
    /// </summary>
    public static async Task SendToUserAsync(
        this IHubContext<NotificationHub> hubContext,
        Guid userId,
        RealTimeNotificationDto notification)
    {
        await hubContext.Clients.Group($"user_{userId}").SendAsync("NewNotification", notification);
    }

    /// <summary>
    /// Send notification count update to a user
    /// </summary>
    public static async Task SendCountUpdateAsync(
        this IHubContext<NotificationHub> hubContext,
        Guid userId,
        int unreadCount)
    {
        await hubContext.Clients.Group($"user_{userId}").SendAsync("UnreadCountUpdate", new NotificationCountUpdateDto
        {
            UserId = userId,
            UnreadCount = unreadCount
        });
    }

    /// <summary>
    /// Send notification to all users in a conversation
    /// </summary>
    public static async Task SendToConversationAsync(
        this IHubContext<NotificationHub> hubContext,
        Guid conversationId,
        RealTimeNotificationDto notification)
    {
        await hubContext.Clients.Group($"conversation_{conversationId}").SendAsync("NewNotification", notification);
    }

    /// <summary>
    /// Broadcast notification to all connected users
    /// </summary>
    public static async Task BroadcastAsync(
        this IHubContext<NotificationHub> hubContext,
        RealTimeNotificationDto notification)
    {
        await hubContext.Clients.All.SendAsync("BroadcastNotification", notification);
    }
}
