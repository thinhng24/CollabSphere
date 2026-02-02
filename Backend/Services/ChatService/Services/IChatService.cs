using ChatService.Models;
using ChatService.Models.DTOs;

namespace ChatService.Services;

/// <summary>
/// Interface for Chat Service operations
/// Handles conversations, messages, and real-time communication
/// </summary>
public interface IChatService
{
    #region Conversation Operations

    /// <summary>
    /// Get all conversations for a user with filtering and pagination
    /// </summary>
    Task<ConversationsResponse> GetUserConversationsAsync(
        Guid userId,
        ConversationFilter filter,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get a specific conversation by ID
    /// </summary>
    Task<ConversationDetailDto?> GetConversationAsync(
        Guid conversationId,
        Guid userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Create a new conversation
    /// </summary>
    Task<ConversationDetailDto> CreateConversationAsync(
        Guid creatorId,
        CreateConversationRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get or create a direct (private) conversation between two users
    /// </summary>
    Task<ConversationDetailDto> GetOrCreatePrivateConversationAsync(
        Guid userId1,
        Guid userId2,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Update a conversation (name, avatar)
    /// </summary>
    Task<ConversationDetailDto> UpdateConversationAsync(
        Guid conversationId,
        Guid userId,
        UpdateConversationRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Delete/archive a conversation
    /// </summary>
    Task<bool> DeleteConversationAsync(
        Guid conversationId,
        Guid userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Leave a conversation
    /// </summary>
    Task<bool> LeaveConversationAsync(
        Guid conversationId,
        Guid userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Check if user has access to a conversation
    /// </summary>
    Task<bool> UserHasAccessAsync(
        Guid conversationId,
        Guid userId,
        CancellationToken cancellationToken = default);

    #endregion

    #region Participant Operations

    /// <summary>
    /// Add participants to a conversation
    /// </summary>
    Task<ConversationDetailDto> AddParticipantsAsync(
        Guid conversationId,
        Guid requesterId,
        AddParticipantsRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Remove a participant from a conversation
    /// </summary>
    Task<bool> RemoveParticipantAsync(
        Guid conversationId,
        Guid requesterId,
        Guid userToRemoveId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Update participant settings (mute, pin)
    /// </summary>
    Task<bool> UpdateParticipantSettingsAsync(
        Guid conversationId,
        Guid userId,
        bool? isMuted = null,
        bool? isPinned = null,
        CancellationToken cancellationToken = default);

    #endregion

    #region Message Operations

    /// <summary>
    /// Get messages for a conversation with pagination
    /// </summary>
    Task<MessagesResponse> GetMessagesAsync(
        Guid conversationId,
        Guid userId,
        MessageFilter filter,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get a specific message by ID
    /// </summary>
    Task<MessageDto?> GetMessageAsync(
        Guid messageId,
        Guid userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Send a new message
    /// </summary>
    Task<MessageDto> SendMessageAsync(
        Guid senderId,
        Guid conversationId,
        SendMessageRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Edit an existing message
    /// </summary>
    Task<MessageDto> EditMessageAsync(
        Guid userId,
        Guid messageId,
        EditMessageRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Delete a message
    /// </summary>
    Task<bool> DeleteMessageAsync(
        Guid userId,
        Guid messageId,
        bool deleteForEveryone = false,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Mark messages as read in a conversation
    /// </summary>
    Task<int> MarkMessagesAsReadAsync(
        Guid conversationId,
        Guid userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Search messages in a conversation or across all user's conversations
    /// </summary>
    Task<MessagesResponse> SearchMessagesAsync(
        Guid userId,
        string searchTerm,
        Guid? conversationId = null,
        MessageFilter? filter = null,
        CancellationToken cancellationToken = default);

    #endregion

    #region User Cache Operations

    /// <summary>
    /// Get cached user info
    /// </summary>
    Task<UserDto?> GetUserCacheAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Update or create user cache entry
    /// </summary>
    Task UpdateUserCacheAsync(
        Guid userId,
        string username,
        string fullName,
        string? avatarUrl,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Update user online status
    /// </summary>
    Task UpdateUserOnlineStatusAsync(
        Guid userId,
        bool isOnline,
        CancellationToken cancellationToken = default);

    #endregion
}
