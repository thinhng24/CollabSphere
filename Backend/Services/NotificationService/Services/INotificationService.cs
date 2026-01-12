using NotificationService.Models;
using NotificationService.Models.DTOs;

namespace NotificationService.Services;

/// <summary>
/// Interface for Notification Service operations
/// Handles notification creation, delivery, preferences, and real-time broadcasting
/// </summary>
public interface INotificationService
{
    #region Notification Operations

    /// <summary>
    /// Create and send a notification to a user
    /// </summary>
    Task<NotificationDto> CreateNotificationAsync(
        CreateNotificationRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Send bulk notifications to multiple users
    /// </summary>
    Task<BulkNotificationResult> SendBulkNotificationAsync(
        SendBulkNotificationRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get notifications for a user with filtering and pagination
    /// </summary>
    Task<NotificationsResponse> GetNotificationsAsync(
        Guid userId,
        NotificationFilter filter,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get a specific notification by ID
    /// </summary>
    Task<NotificationDto?> GetNotificationAsync(
        Guid notificationId,
        Guid userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get notification counts for a user
    /// </summary>
    Task<NotificationCountResponse> GetNotificationCountsAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Mark a notification as read
    /// </summary>
    Task<bool> MarkAsReadAsync(
        Guid notificationId,
        Guid userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Mark multiple notifications as read
    /// </summary>
    Task<int> MarkMultipleAsReadAsync(
        Guid userId,
        List<Guid>? notificationIds = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Mark all notifications as read for a user
    /// </summary>
    Task<int> MarkAllAsReadAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Dismiss a notification
    /// </summary>
    Task<bool> DismissNotificationAsync(
        Guid notificationId,
        Guid userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Delete a notification
    /// </summary>
    Task<bool> DeleteNotificationAsync(
        Guid notificationId,
        Guid userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Delete all notifications for a user
    /// </summary>
    Task<int> DeleteAllNotificationsAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    #endregion

    #region Preference Operations

    /// <summary>
    /// Get notification preferences for a user
    /// </summary>
    Task<NotificationPreferenceDto> GetPreferencesAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Update notification preferences for a user
    /// </summary>
    Task<NotificationPreferenceDto> UpdatePreferencesAsync(
        Guid userId,
        UpdateNotificationPreferenceRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Check if user should receive notification based on preferences
    /// </summary>
    Task<bool> ShouldSendNotificationAsync(
        Guid userId,
        string notificationType,
        CancellationToken cancellationToken = default);

    #endregion

    #region Mute Operations

    /// <summary>
    /// Mute notifications from a conversation
    /// </summary>
    Task<bool> MuteConversationAsync(
        Guid userId,
        Guid conversationId,
        DateTime? muteUntil = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Unmute notifications from a conversation
    /// </summary>
    Task<bool> UnmuteConversationAsync(
        Guid userId,
        Guid conversationId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Check if a conversation is muted for a user
    /// </summary>
    Task<bool> IsConversationMutedAsync(
        Guid userId,
        Guid conversationId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get all muted conversations for a user
    /// </summary>
    Task<List<Guid>> GetMutedConversationsAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    #endregion

    #region Push Subscription Operations

    /// <summary>
    /// Register a push subscription for a user
    /// </summary>
    Task<PushSubscriptionDto> RegisterPushSubscriptionAsync(
        Guid userId,
        RegisterPushSubscriptionRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get push subscriptions for a user
    /// </summary>
    Task<List<PushSubscriptionDto>> GetPushSubscriptionsAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Remove a push subscription
    /// </summary>
    Task<bool> RemovePushSubscriptionAsync(
        Guid subscriptionId,
        Guid userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Remove all push subscriptions for a user
    /// </summary>
    Task<int> RemoveAllPushSubscriptionsAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Send push notification to user's devices
    /// </summary>
    Task<bool> SendPushNotificationAsync(
        Guid userId,
        RealTimeNotificationDto notification,
        CancellationToken cancellationToken = default);

    #endregion

    #region Real-time Operations

    /// <summary>
    /// Broadcast notification to user via SignalR
    /// </summary>
    Task BroadcastToUserAsync(
        Guid userId,
        RealTimeNotificationDto notification,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Broadcast notification to users in a conversation via SignalR
    /// </summary>
    Task BroadcastToConversationAsync(
        Guid conversationId,
        RealTimeNotificationDto notification,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Broadcast notification count update to user
    /// </summary>
    Task BroadcastCountUpdateAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Broadcast system notification to all users
    /// </summary>
    Task BroadcastSystemNotificationAsync(
        RealTimeNotificationDto notification,
        CancellationToken cancellationToken = default);

    #endregion

    #region Template Operations

    /// <summary>
    /// Get notification template by type and language
    /// </summary>
    Task<NotificationTemplate?> GetTemplateAsync(
        string type,
        string language = "en",
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Create notification from template
    /// </summary>
    Task<NotificationDto> CreateFromTemplateAsync(
        Guid userId,
        string templateType,
        Dictionary<string, string> placeholders,
        Guid? sourceUserId = null,
        Guid? sourceConversationId = null,
        Guid? sourceMessageId = null,
        Guid? sourceDocumentId = null,
        CancellationToken cancellationToken = default);

    #endregion

    #region Cleanup Operations

    /// <summary>
    /// Clean up expired notifications
    /// </summary>
    Task<int> CleanupExpiredNotificationsAsync(
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Clean up old read/dismissed notifications
    /// </summary>
    Task<int> CleanupOldNotificationsAsync(
        int olderThanDays = 30,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Clean up failed push subscriptions
    /// </summary>
    Task<int> CleanupFailedSubscriptionsAsync(
        int maxFailures = 5,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Clean up expired mutes
    /// </summary>
    Task<int> CleanupExpiredMutesAsync(
        CancellationToken cancellationToken = default);

    #endregion

    #region Batch Operations

    /// <summary>
    /// Create email digest batch for users
    /// </summary>
    Task<int> CreateEmailDigestBatchesAsync(
        EmailDigestFrequency frequency,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Process pending email digest batches
    /// </summary>
    Task<int> ProcessEmailDigestBatchesAsync(
        CancellationToken cancellationToken = default);

    #endregion
}
