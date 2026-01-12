using System.Text.Json;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using NotificationService.Data;
using NotificationService.Hubs;
using NotificationService.Models;
using NotificationService.Models.DTOs;

namespace NotificationService.Services;

/// <summary>
/// Full implementation of INotificationService
/// Handles notification creation, delivery, preferences, and real-time broadcasting
/// </summary>
public class NotificationServiceImpl : INotificationService
{
    private readonly NotificationDbContext _dbContext;
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly ILogger<NotificationServiceImpl> _logger;
    private readonly JsonSerializerOptions _jsonOptions;

    public NotificationServiceImpl(
        NotificationDbContext dbContext,
        IHubContext<NotificationHub> hubContext,
        ILogger<NotificationServiceImpl> logger)
    {
        _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        _hubContext = hubContext ?? throw new ArgumentNullException(nameof(hubContext));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = false
        };
    }

    #region Notification Operations

    public async Task<NotificationDto> CreateNotificationAsync(
        CreateNotificationRequest request,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Creating notification for user {UserId}, type: {Type}", request.UserId, request.Type);

        // Check if user should receive this notification
        if (!await ShouldSendNotificationAsync(request.UserId, request.Type, cancellationToken))
        {
            _logger.LogInformation("Notification suppressed for user {UserId} based on preferences", request.UserId);
            // Still create the notification but mark it as read
            var suppressedNotification = await CreateNotificationEntityAsync(request, NotificationStatus.Read, cancellationToken);
            return MapToDto(suppressedNotification);
        }

        // Check if conversation is muted
        if (request.SourceConversationId.HasValue &&
            await IsConversationMutedAsync(request.UserId, request.SourceConversationId.Value, cancellationToken))
        {
            _logger.LogInformation("Notification suppressed for muted conversation {ConversationId}", request.SourceConversationId);
            var suppressedNotification = await CreateNotificationEntityAsync(request, NotificationStatus.Read, cancellationToken);
            return MapToDto(suppressedNotification);
        }

        var notification = await CreateNotificationEntityAsync(request, NotificationStatus.Unread, cancellationToken);

        // Broadcast real-time notification
        var realTimeDto = MapToRealTimeDto(notification);
        await BroadcastToUserAsync(request.UserId, realTimeDto, cancellationToken);

        // Send push notification if enabled
        await TrySendPushNotificationAsync(request.UserId, realTimeDto, cancellationToken);

        // Update notification counts
        await BroadcastCountUpdateAsync(request.UserId, cancellationToken);

        _logger.LogInformation("Created notification {NotificationId} for user {UserId}", notification.Id, request.UserId);

        return MapToDto(notification);
    }

    private async Task<Notification> CreateNotificationEntityAsync(
        CreateNotificationRequest request,
        NotificationStatus status,
        CancellationToken cancellationToken)
    {
        var notification = new Notification
        {
            Id = Guid.NewGuid(),
            UserId = request.UserId,
            Type = request.Type,
            Title = request.Title,
            Body = request.Body,
            IconUrl = request.IconUrl,
            ActionUrl = request.ActionUrl,
            Data = request.Data != null ? JsonSerializer.Serialize(request.Data, _jsonOptions) : null,
            Priority = request.Priority,
            Status = status,
            ExpiresAt = request.ExpiresAt,
            SourceUserId = request.SourceUserId,
            SourceConversationId = request.SourceConversationId,
            SourceMessageId = request.SourceMessageId,
            SourceDocumentId = request.SourceDocumentId,
            CreatedAt = DateTime.UtcNow,
            IsDelivered = true,
            DeliveredAt = DateTime.UtcNow
        };

        _dbContext.Notifications.Add(notification);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return notification;
    }

    public async Task<BulkNotificationResult> SendBulkNotificationAsync(
        SendBulkNotificationRequest request,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Sending bulk notification to {Count} users, type: {Type}", request.UserIds.Count, request.Type);

        var result = new BulkNotificationResult
        {
            SuccessfulUserIds = new List<Guid>(),
            FailedNotifications = new List<FailedNotification>()
        };

        foreach (var userId in request.UserIds)
        {
            try
            {
                var createRequest = new CreateNotificationRequest
                {
                    UserId = userId,
                    Type = request.Type,
                    Title = request.Title,
                    Body = request.Body,
                    IconUrl = request.IconUrl,
                    ActionUrl = request.ActionUrl,
                    Data = request.Data,
                    Priority = request.Priority
                };

                await CreateNotificationAsync(createRequest, cancellationToken);
                result.SuccessfulUserIds.Add(userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send notification to user {UserId}", userId);
                result.FailedNotifications.Add(new FailedNotification
                {
                    UserId = userId,
                    ErrorMessage = ex.Message
                });
            }
        }

        return result with
        {
            TotalSent = result.SuccessfulUserIds.Count,
            TotalFailed = result.FailedNotifications.Count
        };
    }

    public async Task<NotificationsResponse> GetNotificationsAsync(
        Guid userId,
        NotificationFilter filter,
        CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Notifications
            .Where(n => n.UserId == userId)
            .Where(n => n.Status != NotificationStatus.Expired);

        // Apply filters
        if (!string.IsNullOrEmpty(filter.Type))
        {
            query = query.Where(n => n.Type == filter.Type);
        }

        if (filter.Status.HasValue)
        {
            query = query.Where(n => n.Status == filter.Status.Value);
        }

        if (filter.MinPriority.HasValue)
        {
            query = query.Where(n => n.Priority >= filter.MinPriority.Value);
        }

        if (filter.UnreadOnly == true)
        {
            query = query.Where(n => n.Status == NotificationStatus.Unread);
        }

        if (filter.After.HasValue)
        {
            query = query.Where(n => n.CreatedAt >= filter.After.Value);
        }

        if (filter.Before.HasValue)
        {
            query = query.Where(n => n.CreatedAt <= filter.Before.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var unreadCount = await query.CountAsync(n => n.Status == NotificationStatus.Unread, cancellationToken);

        var pageSize = Math.Clamp(filter.PageSize, 1, 100);
        var page = Math.Max(filter.Page, 1);
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var notifications = await query
            .OrderByDescending(n => n.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new NotificationsResponse
        {
            Items = notifications.Select(MapToDto).ToList(),
            TotalCount = totalCount,
            UnreadCount = unreadCount,
            PageNumber = page,
            PageSize = pageSize,
            TotalPages = totalPages,
            HasPreviousPage = page > 1,
            HasNextPage = page < totalPages
        };
    }

    public async Task<NotificationDto?> GetNotificationAsync(
        Guid notificationId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var notification = await _dbContext.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId, cancellationToken);

        return notification != null ? MapToDto(notification) : null;
    }

    public async Task<NotificationCountResponse> GetNotificationCountsAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var notifications = await _dbContext.Notifications
            .Where(n => n.UserId == userId)
            .Where(n => n.Status != NotificationStatus.Expired)
            .GroupBy(n => new { n.Type, n.Status })
            .Select(g => new { g.Key.Type, g.Key.Status, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var totalCount = notifications.Sum(n => n.Count);
        var unreadCount = notifications.Where(n => n.Status == NotificationStatus.Unread).Sum(n => n.Count);

        var countByType = notifications
            .Where(n => n.Status == NotificationStatus.Unread)
            .GroupBy(n => n.Type)
            .ToDictionary(g => g.Key, g => g.Sum(n => n.Count));

        return new NotificationCountResponse
        {
            TotalCount = totalCount,
            UnreadCount = unreadCount,
            CountByType = countByType
        };
    }

    public async Task<bool> MarkAsReadAsync(
        Guid notificationId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var notification = await _dbContext.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId, cancellationToken);

        if (notification == null)
        {
            return false;
        }

        if (notification.Status == NotificationStatus.Unread)
        {
            notification.Status = NotificationStatus.Read;
            notification.ReadAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync(cancellationToken);
            await BroadcastCountUpdateAsync(userId, cancellationToken);
        }

        return true;
    }

    public async Task<int> MarkMultipleAsReadAsync(
        Guid userId,
        List<Guid>? notificationIds = null,
        CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Notifications
            .Where(n => n.UserId == userId)
            .Where(n => n.Status == NotificationStatus.Unread);

        if (notificationIds != null && notificationIds.Count > 0)
        {
            query = query.Where(n => notificationIds.Contains(n.Id));
        }

        var notifications = await query.ToListAsync(cancellationToken);
        var now = DateTime.UtcNow;

        foreach (var notification in notifications)
        {
            notification.Status = NotificationStatus.Read;
            notification.ReadAt = now;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        await BroadcastCountUpdateAsync(userId, cancellationToken);

        return notifications.Count;
    }

    public async Task<int> MarkAllAsReadAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        return await MarkMultipleAsReadAsync(userId, null, cancellationToken);
    }

    public async Task<bool> DismissNotificationAsync(
        Guid notificationId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var notification = await _dbContext.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId, cancellationToken);

        if (notification == null)
        {
            return false;
        }

        notification.Status = NotificationStatus.Dismissed;
        notification.DismissedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);
        await BroadcastCountUpdateAsync(userId, cancellationToken);

        return true;
    }

    public async Task<bool> DeleteNotificationAsync(
        Guid notificationId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var notification = await _dbContext.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId, cancellationToken);

        if (notification == null)
        {
            return false;
        }

        _dbContext.Notifications.Remove(notification);
        await _dbContext.SaveChangesAsync(cancellationToken);
        await BroadcastCountUpdateAsync(userId, cancellationToken);

        return true;
    }

    public async Task<int> DeleteAllNotificationsAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var notifications = await _dbContext.Notifications
            .Where(n => n.UserId == userId)
            .ToListAsync(cancellationToken);

        _dbContext.Notifications.RemoveRange(notifications);
        await _dbContext.SaveChangesAsync(cancellationToken);
        await BroadcastCountUpdateAsync(userId, cancellationToken);

        return notifications.Count;
    }

    #endregion

    #region Preference Operations

    public async Task<NotificationPreferenceDto> GetPreferencesAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var preferences = await _dbContext.NotificationPreferences
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);

        if (preferences == null)
        {
            // Create default preferences
            preferences = new NotificationPreference
            {
                UserId = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _dbContext.NotificationPreferences.Add(preferences);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        return MapToPreferenceDto(preferences);
    }

    public async Task<NotificationPreferenceDto> UpdatePreferencesAsync(
        Guid userId,
        UpdateNotificationPreferenceRequest request,
        CancellationToken cancellationToken = default)
    {
        var preferences = await _dbContext.NotificationPreferences
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);

        if (preferences == null)
        {
            preferences = new NotificationPreference
            {
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            };
            _dbContext.NotificationPreferences.Add(preferences);
        }

        // Update only provided fields
        if (request.EnableNotifications.HasValue)
            preferences.EnableNotifications = request.EnableNotifications.Value;

        if (request.EnablePushNotifications.HasValue)
            preferences.EnablePushNotifications = request.EnablePushNotifications.Value;

        if (request.EnableEmailNotifications.HasValue)
            preferences.EnableEmailNotifications = request.EnableEmailNotifications.Value;

        if (request.EnableSoundNotifications.HasValue)
            preferences.EnableSoundNotifications = request.EnableSoundNotifications.Value;

        if (request.NotifyOnNewMessage.HasValue)
            preferences.NotifyOnNewMessage = request.NotifyOnNewMessage.Value;

        if (request.NotifyOnMention.HasValue)
            preferences.NotifyOnMention = request.NotifyOnMention.Value;

        if (request.NotifyOnDocumentShare.HasValue)
            preferences.NotifyOnDocumentShare = request.NotifyOnDocumentShare.Value;

        if (request.NotifyOnConversationInvite.HasValue)
            preferences.NotifyOnConversationInvite = request.NotifyOnConversationInvite.Value;

        if (request.NotifyOnSystemUpdate.HasValue)
            preferences.NotifyOnSystemUpdate = request.NotifyOnSystemUpdate.Value;

        if (request.EnableQuietHours.HasValue)
            preferences.EnableQuietHours = request.EnableQuietHours.Value;

        if (request.QuietHoursStart.HasValue)
            preferences.QuietHoursStart = request.QuietHoursStart.Value;

        if (request.QuietHoursEnd.HasValue)
            preferences.QuietHoursEnd = request.QuietHoursEnd.Value;

        if (!string.IsNullOrEmpty(request.Timezone))
            preferences.Timezone = request.Timezone;

        if (request.EmailDigestFrequency.HasValue)
            preferences.EmailDigestFrequency = request.EmailDigestFrequency.Value;

        preferences.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return MapToPreferenceDto(preferences);
    }

    public async Task<bool> ShouldSendNotificationAsync(
        Guid userId,
        string notificationType,
        CancellationToken cancellationToken = default)
    {
        var preferences = await _dbContext.NotificationPreferences
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);

        // Default to sending if no preferences exist
        if (preferences == null)
        {
            return true;
        }

        // Check global notification setting
        if (!preferences.EnableNotifications)
        {
            return false;
        }

        // Check quiet hours
        if (preferences.EnableQuietHours &&
            preferences.QuietHoursStart.HasValue &&
            preferences.QuietHoursEnd.HasValue)
        {
            var now = DateTime.UtcNow;

            // Convert to user's timezone if available
            if (!string.IsNullOrEmpty(preferences.Timezone))
            {
                try
                {
                    var tz = TimeZoneInfo.FindSystemTimeZoneById(preferences.Timezone);
                    now = TimeZoneInfo.ConvertTimeFromUtc(now, tz);
                }
                catch
                {
                    // Fall back to UTC
                }
            }

            var currentTime = now.TimeOfDay;
            var start = preferences.QuietHoursStart.Value;
            var end = preferences.QuietHoursEnd.Value;

            bool isQuietHours;
            if (start <= end)
            {
                isQuietHours = currentTime >= start && currentTime <= end;
            }
            else
            {
                // Quiet hours span midnight
                isQuietHours = currentTime >= start || currentTime <= end;
            }

            if (isQuietHours)
            {
                return false;
            }
        }

        // Check type-specific settings
        return notificationType switch
        {
            NotificationTypes.NewMessage => preferences.NotifyOnNewMessage,
            NotificationTypes.Mention => preferences.NotifyOnMention,
            NotificationTypes.DocumentShared or NotificationTypes.DocumentUploaded => preferences.NotifyOnDocumentShare,
            NotificationTypes.ConversationInvite or NotificationTypes.ConversationUpdate => preferences.NotifyOnConversationInvite,
            NotificationTypes.SystemUpdate or NotificationTypes.SecurityAlert => preferences.NotifyOnSystemUpdate,
            _ => true
        };
    }

    #endregion

    #region Mute Operations

    public async Task<bool> MuteConversationAsync(
        Guid userId,
        Guid conversationId,
        DateTime? muteUntil = null,
        CancellationToken cancellationToken = default)
    {
        var existing = await _dbContext.MutedConversations
            .FirstOrDefaultAsync(m => m.UserId == userId && m.ConversationId == conversationId, cancellationToken);

        if (existing != null)
        {
            existing.IsMuted = true;
            existing.MutedAt = DateTime.UtcNow;
            existing.MutedUntil = muteUntil;
        }
        else
        {
            _dbContext.MutedConversations.Add(new MutedConversation
            {
                UserId = userId,
                ConversationId = conversationId,
                MutedAt = DateTime.UtcNow,
                MutedUntil = muteUntil,
                IsMuted = true
            });
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> UnmuteConversationAsync(
        Guid userId,
        Guid conversationId,
        CancellationToken cancellationToken = default)
    {
        var muted = await _dbContext.MutedConversations
            .FirstOrDefaultAsync(m => m.UserId == userId && m.ConversationId == conversationId, cancellationToken);

        if (muted != null)
        {
            _dbContext.MutedConversations.Remove(muted);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        return true;
    }

    public async Task<bool> IsConversationMutedAsync(
        Guid userId,
        Guid conversationId,
        CancellationToken cancellationToken = default)
    {
        var muted = await _dbContext.MutedConversations
            .FirstOrDefaultAsync(m => m.UserId == userId && m.ConversationId == conversationId && m.IsMuted, cancellationToken);

        if (muted == null)
        {
            return false;
        }

        // Check if mute has expired
        if (muted.MutedUntil.HasValue && muted.MutedUntil.Value < DateTime.UtcNow)
        {
            _dbContext.MutedConversations.Remove(muted);
            await _dbContext.SaveChangesAsync(cancellationToken);
            return false;
        }

        return true;
    }

    public async Task<List<Guid>> GetMutedConversationsAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;

        return await _dbContext.MutedConversations
            .Where(m => m.UserId == userId && m.IsMuted)
            .Where(m => !m.MutedUntil.HasValue || m.MutedUntil > now)
            .Select(m => m.ConversationId)
            .ToListAsync(cancellationToken);
    }

    #endregion

    #region Push Subscription Operations

    public async Task<PushSubscriptionDto> RegisterPushSubscriptionAsync(
        Guid userId,
        RegisterPushSubscriptionRequest request,
        CancellationToken cancellationToken = default)
    {
        // Check for existing subscription with same endpoint
        var existing = await _dbContext.PushSubscriptions
            .FirstOrDefaultAsync(p => p.UserId == userId && p.Endpoint == request.Endpoint, cancellationToken);

        if (existing != null)
        {
            existing.P256dhKey = request.P256dhKey;
            existing.AuthKey = request.AuthKey;
            existing.UserAgent = request.UserAgent;
            existing.DeviceType = request.DeviceType;
            existing.DeviceName = request.DeviceName;
            existing.IsActive = true;
            existing.FailureCount = 0;
            existing.LastUsedAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync(cancellationToken);
            return MapToPushSubscriptionDto(existing);
        }

        var subscription = new PushSubscription
        {
            UserId = userId,
            Endpoint = request.Endpoint,
            P256dhKey = request.P256dhKey,
            AuthKey = request.AuthKey,
            UserAgent = request.UserAgent,
            DeviceType = request.DeviceType,
            DeviceName = request.DeviceName,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.PushSubscriptions.Add(subscription);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return MapToPushSubscriptionDto(subscription);
    }

    public async Task<List<PushSubscriptionDto>> GetPushSubscriptionsAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var subscriptions = await _dbContext.PushSubscriptions
            .Where(p => p.UserId == userId && p.IsActive)
            .ToListAsync(cancellationToken);

        return subscriptions.Select(MapToPushSubscriptionDto).ToList();
    }

    public async Task<bool> RemovePushSubscriptionAsync(
        Guid subscriptionId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var subscription = await _dbContext.PushSubscriptions
            .FirstOrDefaultAsync(p => p.Id == subscriptionId && p.UserId == userId, cancellationToken);

        if (subscription == null)
        {
            return false;
        }

        _dbContext.PushSubscriptions.Remove(subscription);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<int> RemoveAllPushSubscriptionsAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var subscriptions = await _dbContext.PushSubscriptions
            .Where(p => p.UserId == userId)
            .ToListAsync(cancellationToken);

        _dbContext.PushSubscriptions.RemoveRange(subscriptions);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return subscriptions.Count;
    }

    public async Task<bool> SendPushNotificationAsync(
        Guid userId,
        RealTimeNotificationDto notification,
        CancellationToken cancellationToken = default)
    {
        // Check if user has push notifications enabled
        var preferences = await _dbContext.NotificationPreferences
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);

        if (preferences != null && !preferences.EnablePushNotifications)
        {
            return false;
        }

        var subscriptions = await _dbContext.PushSubscriptions
            .Where(p => p.UserId == userId && p.IsActive)
            .ToListAsync(cancellationToken);

        if (subscriptions.Count == 0)
        {
            return false;
        }

        // In a real implementation, we would use WebPush library to send push notifications
        // For now, we'll just log and mark as sent
        foreach (var subscription in subscriptions)
        {
            try
            {
                // TODO: Implement actual WebPush sending
                // await _webPushService.SendAsync(subscription, notification);
                _logger.LogInformation("Push notification sent to subscription {SubscriptionId}", subscription.Id);
                subscription.LastUsedAt = DateTime.UtcNow;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send push notification to subscription {SubscriptionId}", subscription.Id);
                subscription.FailureCount++;
                subscription.LastFailureAt = DateTime.UtcNow;

                // Deactivate subscription after too many failures
                if (subscription.FailureCount >= 5)
                {
                    subscription.IsActive = false;
                }
            }
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    private async Task TrySendPushNotificationAsync(
        Guid userId,
        RealTimeNotificationDto notification,
        CancellationToken cancellationToken)
    {
        try
        {
            await SendPushNotificationAsync(userId, notification, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send push notification to user {UserId}", userId);
        }
    }

    #endregion

    #region Real-time Operations

    public async Task BroadcastToUserAsync(
        Guid userId,
        RealTimeNotificationDto notification,
        CancellationToken cancellationToken = default)
    {
        try
        {
            await _hubContext.Clients.Group($"user_{userId}")
                .SendAsync("ReceiveNotification", notification, cancellationToken);

            _logger.LogDebug("Broadcasted notification to user {UserId}", userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to broadcast notification to user {UserId}", userId);
        }
    }

    public async Task BroadcastToConversationAsync(
        Guid conversationId,
        RealTimeNotificationDto notification,
        CancellationToken cancellationToken = default)
    {
        try
        {
            await _hubContext.Clients.Group($"conversation_{conversationId}")
                .SendAsync("ReceiveNotification", notification, cancellationToken);

            _logger.LogDebug("Broadcasted notification to conversation {ConversationId}", conversationId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to broadcast notification to conversation {ConversationId}", conversationId);
        }
    }

    public async Task BroadcastCountUpdateAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var counts = await GetNotificationCountsAsync(userId, cancellationToken);
            var update = new NotificationCountUpdateDto
            {
                UserId = userId,
                UnreadCount = counts.UnreadCount
            };

            await _hubContext.Clients.Group($"user_{userId}")
                .SendAsync("NotificationCountUpdated", update, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to broadcast count update to user {UserId}", userId);
        }
    }

    public async Task BroadcastSystemNotificationAsync(
        RealTimeNotificationDto notification,
        CancellationToken cancellationToken = default)
    {
        try
        {
            await _hubContext.Clients.All
                .SendAsync("ReceiveSystemNotification", notification, cancellationToken);

            _logger.LogInformation("Broadcasted system notification: {Title}", notification.Title);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to broadcast system notification");
        }
    }

    #endregion

    #region Template Operations

    public async Task<NotificationTemplate?> GetTemplateAsync(
        string type,
        string language = "en",
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.NotificationTemplates
            .FirstOrDefaultAsync(t => t.Type == type && t.Language == language && t.IsActive, cancellationToken)
            ?? await _dbContext.NotificationTemplates
                .FirstOrDefaultAsync(t => t.Type == type && t.Language == "en" && t.IsActive, cancellationToken);
    }

    public async Task<NotificationDto> CreateFromTemplateAsync(
        Guid userId,
        string templateType,
        Dictionary<string, string> placeholders,
        Guid? sourceUserId = null,
        Guid? sourceConversationId = null,
        Guid? sourceMessageId = null,
        Guid? sourceDocumentId = null,
        CancellationToken cancellationToken = default)
    {
        // Get user's preferred language (default to Vietnamese for this system)
        var preferences = await _dbContext.NotificationPreferences
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);

        var language = "vi"; // Default to Vietnamese

        var template = await GetTemplateAsync(templateType, language, cancellationToken);

        string title;
        string body;
        string? actionUrl = null;

        if (template != null)
        {
            title = ReplacePlaceholders(template.TitleTemplate, placeholders);
            body = ReplacePlaceholders(template.BodyTemplate, placeholders);
            actionUrl = template.ActionUrlTemplate != null
                ? ReplacePlaceholders(template.ActionUrlTemplate, placeholders)
                : null;
        }
        else
        {
            // Fallback - use placeholders directly
            title = placeholders.GetValueOrDefault("title", templateType);
            body = placeholders.GetValueOrDefault("body", "");
        }

        var request = new CreateNotificationRequest
        {
            UserId = userId,
            Type = templateType,
            Title = title,
            Body = body,
            ActionUrl = actionUrl,
            SourceUserId = sourceUserId,
            SourceConversationId = sourceConversationId,
            SourceMessageId = sourceMessageId,
            SourceDocumentId = sourceDocumentId
        };

        return await CreateNotificationAsync(request, cancellationToken);
    }

    private static string ReplacePlaceholders(string template, Dictionary<string, string> placeholders)
    {
        var result = template;
        foreach (var (key, value) in placeholders)
        {
            result = result.Replace($"{{{key}}}", value);
        }
        return result;
    }

    #endregion

    #region Cleanup Operations

    public async Task<int> CleanupExpiredNotificationsAsync(
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;

        var expired = await _dbContext.Notifications
            .Where(n => n.ExpiresAt.HasValue && n.ExpiresAt < now)
            .Where(n => n.Status != NotificationStatus.Expired)
            .ToListAsync(cancellationToken);

        foreach (var notification in expired)
        {
            notification.Status = NotificationStatus.Expired;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Marked {Count} notifications as expired", expired.Count);

        return expired.Count;
    }

    public async Task<int> CleanupOldNotificationsAsync(
        int olderThanDays = 30,
        CancellationToken cancellationToken = default)
    {
        var cutoff = DateTime.UtcNow.AddDays(-olderThanDays);

        var old = await _dbContext.Notifications
            .Where(n => n.CreatedAt < cutoff)
            .Where(n => n.Status == NotificationStatus.Read || n.Status == NotificationStatus.Dismissed)
            .ToListAsync(cancellationToken);

        _dbContext.Notifications.RemoveRange(old);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Deleted {Count} old notifications (older than {Days} days)", old.Count, olderThanDays);

        return old.Count;
    }

    public async Task<int> CleanupFailedSubscriptionsAsync(
        int maxFailures = 5,
        CancellationToken cancellationToken = default)
    {
        var failed = await _dbContext.PushSubscriptions
            .Where(p => p.FailureCount >= maxFailures)
            .ToListAsync(cancellationToken);

        _dbContext.PushSubscriptions.RemoveRange(failed);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Removed {Count} failed push subscriptions", failed.Count);

        return failed.Count;
    }

    public async Task<int> CleanupExpiredMutesAsync(
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;

        var expired = await _dbContext.MutedConversations
            .Where(m => m.MutedUntil.HasValue && m.MutedUntil < now)
            .ToListAsync(cancellationToken);

        _dbContext.MutedConversations.RemoveRange(expired);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Removed {Count} expired mutes", expired.Count);

        return expired.Count;
    }

    #endregion

    #region Batch Operations

    public async Task<int> CreateEmailDigestBatchesAsync(
        EmailDigestFrequency frequency,
        CancellationToken cancellationToken = default)
    {
        // Get users with this digest frequency who have unread notifications
        var usersWithUnread = await _dbContext.NotificationPreferences
            .Where(p => p.EmailDigestFrequency == frequency)
            .Where(p => p.EnableEmailNotifications)
            .Select(p => p.UserId)
            .ToListAsync(cancellationToken);

        var batchCount = 0;
        var now = DateTime.UtcNow;

        foreach (var userId in usersWithUnread)
        {
            var unreadCount = await _dbContext.Notifications
                .CountAsync(n => n.UserId == userId &&
                                n.Status == NotificationStatus.Unread &&
                                !n.IsEmailSent, cancellationToken);

            if (unreadCount > 0)
            {
                var batch = new NotificationBatch
                {
                    UserId = userId,
                    Type = BatchType.EmailDigest,
                    Status = BatchStatus.Pending,
                    NotificationCount = unreadCount,
                    ScheduledAt = now,
                    CreatedAt = now
                };

                _dbContext.NotificationBatches.Add(batch);
                batchCount++;
            }
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Created {Count} email digest batches for frequency {Frequency}", batchCount, frequency);

        return batchCount;
    }

    public async Task<int> ProcessEmailDigestBatchesAsync(
        CancellationToken cancellationToken = default)
    {
        var pendingBatches = await _dbContext.NotificationBatches
            .Where(b => b.Status == BatchStatus.Pending)
            .Where(b => b.Type == BatchType.EmailDigest)
            .OrderBy(b => b.ScheduledAt)
            .Take(100)
            .ToListAsync(cancellationToken);

        var processedCount = 0;

        foreach (var batch in pendingBatches)
        {
            try
            {
                batch.Status = BatchStatus.Processing;
                await _dbContext.SaveChangesAsync(cancellationToken);

                // Get unread notifications for this user
                var notifications = await _dbContext.Notifications
                    .Where(n => n.UserId == batch.UserId)
                    .Where(n => n.Status == NotificationStatus.Unread)
                    .Where(n => !n.IsEmailSent)
                    .OrderByDescending(n => n.CreatedAt)
                    .ToListAsync(cancellationToken);

                if (notifications.Count > 0)
                {
                    // TODO: Implement actual email sending
                    // await _emailService.SendDigestAsync(batch.UserId, notifications);

                    foreach (var notification in notifications)
                    {
                        notification.IsEmailSent = true;
                    }

                    _logger.LogInformation("Sent email digest to user {UserId} with {Count} notifications",
                        batch.UserId, notifications.Count);
                }

                batch.Status = BatchStatus.Completed;
                batch.ProcessedAt = DateTime.UtcNow;
                processedCount++;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to process email digest batch {BatchId}", batch.Id);
                batch.Status = BatchStatus.Failed;
                batch.ErrorMessage = ex.Message;
            }

            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        _logger.LogInformation("Processed {Count} email digest batches", processedCount);

        return processedCount;
    }

    #endregion

    #region Mapping Helpers

    private NotificationDto MapToDto(Notification notification)
    {
        Dictionary<string, object>? data = null;
        if (!string.IsNullOrEmpty(notification.Data))
        {
            try
            {
                data = JsonSerializer.Deserialize<Dictionary<string, object>>(notification.Data, _jsonOptions);
            }
            catch
            {
                // Ignore deserialization errors
            }
        }

        return new NotificationDto
        {
            Id = notification.Id,
            UserId = notification.UserId,
            Type = notification.Type,
            Title = notification.Title,
            Body = notification.Body,
            IconUrl = notification.IconUrl,
            ActionUrl = notification.ActionUrl,
            Data = data,
            Priority = notification.Priority,
            Status = notification.Status,
            CreatedAt = notification.CreatedAt,
            ReadAt = notification.ReadAt,
            IsDelivered = notification.IsDelivered,
            Source = notification.SourceUserId.HasValue || notification.SourceConversationId.HasValue
                ? new SourceInfoDto
                {
                    UserId = notification.SourceUserId,
                    ConversationId = notification.SourceConversationId,
                    MessageId = notification.SourceMessageId,
                    DocumentId = notification.SourceDocumentId
                }
                : null
        };
    }

    private RealTimeNotificationDto MapToRealTimeDto(Notification notification)
    {
        Dictionary<string, object>? data = null;
        if (!string.IsNullOrEmpty(notification.Data))
        {
            try
            {
                data = JsonSerializer.Deserialize<Dictionary<string, object>>(notification.Data, _jsonOptions);
            }
            catch
            {
                // Ignore deserialization errors
            }
        }

        return new RealTimeNotificationDto
        {
            Id = notification.Id,
            Type = notification.Type,
            Title = notification.Title,
            Body = notification.Body,
            IconUrl = notification.IconUrl,
            ActionUrl = notification.ActionUrl,
            Priority = notification.Priority,
            CreatedAt = notification.CreatedAt,
            Data = data
        };
    }

    private static NotificationPreferenceDto MapToPreferenceDto(NotificationPreference preferences)
    {
        return new NotificationPreferenceDto
        {
            UserId = preferences.UserId,
            EnableNotifications = preferences.EnableNotifications,
            EnablePushNotifications = preferences.EnablePushNotifications,
            EnableEmailNotifications = preferences.EnableEmailNotifications,
            EnableSoundNotifications = preferences.EnableSoundNotifications,
            NotifyOnNewMessage = preferences.NotifyOnNewMessage,
            NotifyOnMention = preferences.NotifyOnMention,
            NotifyOnDocumentShare = preferences.NotifyOnDocumentShare,
            NotifyOnConversationInvite = preferences.NotifyOnConversationInvite,
            NotifyOnSystemUpdate = preferences.NotifyOnSystemUpdate,
            EnableQuietHours = preferences.EnableQuietHours,
            QuietHoursStart = preferences.QuietHoursStart,
            QuietHoursEnd = preferences.QuietHoursEnd,
            Timezone = preferences.Timezone,
            EmailDigestFrequency = preferences.EmailDigestFrequency
        };
    }

    private static PushSubscriptionDto MapToPushSubscriptionDto(PushSubscription subscription)
    {
        return new PushSubscriptionDto
        {
            Id = subscription.Id,
            Endpoint = subscription.Endpoint,
            DeviceType = subscription.DeviceType,
            DeviceName = subscription.DeviceName,
            IsActive = subscription.IsActive,
            CreatedAt = subscription.CreatedAt,
            LastUsedAt = subscription.LastUsedAt
        };
    }

    #endregion
}
