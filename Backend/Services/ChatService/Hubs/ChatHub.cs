using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using ChatService.Services;
using ChatService.Models.DTOs;
using System.Collections.Concurrent;

namespace ChatService.Hubs;

/// <summary>
/// SignalR Hub for real-time chat messaging
/// Handles connection management, message broadcasting, and typing indicators
/// </summary>
[Authorize]
public class ChatHub : Hub
{
    private readonly IChatService _chatService;
    private readonly ILogger<ChatHub> _logger;

    // Track user connections (userId -> connectionIds)
    private static readonly ConcurrentDictionary<string, HashSet<string>> _userConnections = new();

    // Track conversation groups (conversationId -> userIds)
    private static readonly ConcurrentDictionary<string, HashSet<string>> _conversationUsers = new();

    public ChatHub(IChatService chatService, ILogger<ChatHub> logger)
    {
        _chatService = chatService ?? throw new ArgumentNullException(nameof(chatService));
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
            _logger.LogWarning("Connection attempt without valid user ID");
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

        _logger.LogInformation("User {UserId} connected with connection {ConnectionId}", userId, connectionId);

        // Update user online status
        await _chatService.UpdateUserOnlineStatusAsync(Guid.Parse(userId), true);

        // Notify others that user is online
        await Clients.Others.SendAsync("UserOnline", new UserOnlineStatusDto
        {
            UserId = Guid.Parse(userId),
            IsOnline = true
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

                    // If no more connections, user is offline
                    if (connections.Count == 0)
                    {
                        _userConnections.TryRemove(userId, out _);

                        // Update user online status
                        _chatService.UpdateUserOnlineStatusAsync(Guid.Parse(userId), false).Wait();

                        // Notify others that user is offline
                        Clients.Others.SendAsync("UserOffline", new UserOnlineStatusDto
                        {
                            UserId = Guid.Parse(userId),
                            IsOnline = false,
                            LastSeen = DateTime.UtcNow
                        }).Wait();
                    }
                }
            }

            _logger.LogInformation("User {UserId} disconnected. Connection: {ConnectionId}", userId, connectionId);
        }

        if (exception != null)
        {
            _logger.LogError(exception, "Connection {ConnectionId} disconnected with error", connectionId);
        }

        await base.OnDisconnectedAsync(exception);
    }

    #endregion

    #region Conversation Management

    /// <summary>
    /// Join a conversation group to receive messages
    /// </summary>
    /// <param name="conversationId">The conversation ID to join</param>
    public async Task JoinConversation(string conversationId)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
        {
            await SendError("Not authenticated");
            return;
        }

        try
        {
            // Verify user has access to the conversation
            var hasAccess = await _chatService.UserHasAccessAsync(
                Guid.Parse(conversationId),
                Guid.Parse(userId));

            if (!hasAccess)
            {
                await SendError("Access denied to conversation");
                return;
            }

            // Add to SignalR group
            await Groups.AddToGroupAsync(Context.ConnectionId, conversationId);

            // Track user in conversation
            _conversationUsers.AddOrUpdate(
                conversationId,
                new HashSet<string> { userId },
                (_, users) =>
                {
                    lock (users)
                    {
                        users.Add(userId);
                    }
                    return users;
                });

            _logger.LogDebug("User {UserId} joined conversation {ConversationId}", userId, conversationId);

            // Notify others in the conversation
            await Clients.OthersInGroup(conversationId).SendAsync("UserJoinedConversation", new
            {
                ConversationId = conversationId,
                UserId = userId,
                JoinedAt = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error joining conversation {ConversationId}", conversationId);
            await SendError("Failed to join conversation");
        }
    }

    /// <summary>
    /// Leave a conversation group
    /// </summary>
    /// <param name="conversationId">The conversation ID to leave</param>
    public async Task LeaveConversation(string conversationId)
    {
        var userId = GetUserId();

        await Groups.RemoveFromGroupAsync(Context.ConnectionId, conversationId);

        // Remove user from conversation tracking
        if (_conversationUsers.TryGetValue(conversationId, out var users))
        {
            lock (users)
            {
                users.Remove(userId ?? "");
            }
        }

        _logger.LogDebug("User {UserId} left conversation {ConversationId}", userId, conversationId);

        // Notify others
        await Clients.OthersInGroup(conversationId).SendAsync("UserLeftConversation", new
        {
            ConversationId = conversationId,
            UserId = userId,
            LeftAt = DateTime.UtcNow
        });
    }

    #endregion

    #region Messaging

    /// <summary>
    /// Send a message to a conversation
    /// </summary>
    /// <param name="conversationId">The conversation ID</param>
    /// <param name="content">The message content</param>
    /// <param name="type">The message type (text, image, file)</param>
    /// <param name="replyToMessageId">Optional reply-to message ID</param>
    /// <param name="attachmentId">Optional attachment ID</param>
    public async Task SendMessage(string conversationId, string content, string type = "text", string? replyToMessageId = null, string? attachmentId = null)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
        {
            await SendError("Not authenticated");
            return;
        }

        try
        {
            var senderId = Guid.Parse(userId);
            var convId = Guid.Parse(conversationId);

            var request = new SendMessageRequest
            {
                Content = content,
                Type = type,
                ReplyToMessageId = string.IsNullOrEmpty(replyToMessageId) ? null : Guid.Parse(replyToMessageId),
                AttachmentId = string.IsNullOrEmpty(attachmentId) ? null : Guid.Parse(attachmentId)
            };

            // Send message via service (handles persistence and broadcasting)
            var message = await _chatService.SendMessageAsync(senderId, convId, request);

            // Send confirmation to caller
            await Clients.Caller.SendAsync("MessageSent", message);

            _logger.LogDebug("Message sent by {UserId} to conversation {ConversationId}",
                userId, conversationId);
        }
        catch (UnauthorizedAccessException)
        {
            await SendError("Not authorized to send messages to this conversation");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending message to conversation {ConversationId}", conversationId);
            await SendError("Failed to send message");
        }
    }

    /// <summary>
    /// Edit an existing message
    /// </summary>
    /// <param name="messageId">The message ID to edit</param>
    /// <param name="content">The new content</param>
    public async Task EditMessage(string messageId, string content)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
        {
            await SendError("Not authenticated");
            return;
        }

        try
        {
            var request = new EditMessageRequest { Content = content };
            var message = await _chatService.EditMessageAsync(Guid.Parse(userId), Guid.Parse(messageId), request);
            await Clients.Caller.SendAsync("MessageEditConfirmed", message);
        }
        catch (UnauthorizedAccessException)
        {
            await SendError("Not authorized to edit this message");
        }
        catch (KeyNotFoundException)
        {
            await SendError("Message not found");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error editing message {MessageId}", messageId);
            await SendError("Failed to edit message");
        }
    }

    /// <summary>
    /// Delete a message
    /// </summary>
    /// <param name="messageId">The message ID to delete</param>
    /// <param name="deleteForEveryone">Whether to delete for everyone</param>
    public async Task DeleteMessage(string messageId, bool deleteForEveryone = false)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
        {
            await SendError("Not authenticated");
            return;
        }

        try
        {
            var result = await _chatService.DeleteMessageAsync(Guid.Parse(userId), Guid.Parse(messageId), deleteForEveryone);
            await Clients.Caller.SendAsync("MessageDeleteConfirmed", new { MessageId = messageId, Success = result });
        }
        catch (UnauthorizedAccessException)
        {
            await SendError("Not authorized to delete this message");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting message {MessageId}", messageId);
            await SendError("Failed to delete message");
        }
    }

    #endregion

    #region Typing Indicators

    /// <summary>
    /// Notify that user started typing
    /// </summary>
    /// <param name="conversationId">The conversation ID</param>
    public async Task StartTyping(string conversationId)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return;

        var userCache = await _chatService.GetUserCacheAsync(Guid.Parse(userId));

        await Clients.OthersInGroup(conversationId).SendAsync("UserTyping", new TypingIndicatorDto
        {
            ConversationId = Guid.Parse(conversationId),
            UserId = Guid.Parse(userId),
            UserName = userCache?.FullName ?? "Unknown",
            IsTyping = true
        });
    }

    /// <summary>
    /// Notify that user stopped typing
    /// </summary>
    /// <param name="conversationId">The conversation ID</param>
    public async Task StopTyping(string conversationId)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return;

        var userCache = await _chatService.GetUserCacheAsync(Guid.Parse(userId));

        await Clients.OthersInGroup(conversationId).SendAsync("UserTyping", new TypingIndicatorDto
        {
            ConversationId = Guid.Parse(conversationId),
            UserId = Guid.Parse(userId),
            UserName = userCache?.FullName ?? "Unknown",
            IsTyping = false
        });
    }

    #endregion

    #region Read Status

    /// <summary>
    /// Mark messages in a conversation as read
    /// </summary>
    /// <param name="conversationId">The conversation ID</param>
    public async Task MarkAsRead(string conversationId)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return;

        try
        {
            var count = await _chatService.MarkMessagesAsReadAsync(
                Guid.Parse(conversationId),
                Guid.Parse(userId));

            _logger.LogDebug("User {UserId} marked {Count} messages as read in {ConversationId}",
                userId, count, conversationId);

            // Notify others about read status
            await Clients.OthersInGroup(conversationId).SendAsync("MessagesRead", new
            {
                ConversationId = conversationId,
                UserId = userId,
                ReadAt = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking messages as read");
        }
    }

    #endregion

    #region Presence

    /// <summary>
    /// Get online status of specific users
    /// </summary>
    /// <param name="userIds">List of user IDs to check</param>
    public async Task GetOnlineStatus(List<string> userIds)
    {
        var statuses = userIds.Select(userId => new UserOnlineStatusDto
        {
            UserId = Guid.Parse(userId),
            IsOnline = _userConnections.ContainsKey(userId)
        }).ToList();

        await Clients.Caller.SendAsync("OnlineStatusResult", statuses);
    }

    /// <summary>
    /// Get users currently viewing a conversation
    /// </summary>
    /// <param name="conversationId">The conversation ID</param>
    public async Task GetActiveUsers(string conversationId)
    {
        if (_conversationUsers.TryGetValue(conversationId, out var users))
        {
            await Clients.Caller.SendAsync("ActiveUsersResult", new
            {
                ConversationId = conversationId,
                UserIds = users.ToList()
            });
        }
        else
        {
            await Clients.Caller.SendAsync("ActiveUsersResult", new
            {
                ConversationId = conversationId,
                UserIds = new List<string>()
            });
        }
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
        await Clients.Caller.SendAsync("Error", new { Message = message, Timestamp = DateTime.UtcNow });
    }

    /// <summary>
    /// Check if a user is online
    /// </summary>
    public static bool IsUserOnline(string userId)
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

    #endregion
}
