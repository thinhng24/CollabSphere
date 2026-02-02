using System.ComponentModel.DataAnnotations;

namespace NotificationService.Models.DTOs;

// ==================== Notification DTOs ====================

public record NotificationDto
{
    public Guid Id { get; init; }
    public Guid UserId { get; init; }
    public string Type { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string Body { get; init; } = string.Empty;
    public string? IconUrl { get; init; }
    public string? ActionUrl { get; init; }
    public Dictionary<string, object>? Data { get; init; }
    public NotificationPriority Priority { get; init; }
    public NotificationStatus Status { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? ReadAt { get; init; }
    public bool IsDelivered { get; init; }
    public SourceInfoDto? Source { get; init; }
}

public record SourceInfoDto
{
    public Guid? UserId { get; init; }
    public string? UserName { get; init; }
    public string? UserAvatar { get; init; }
    public Guid? ConversationId { get; init; }
    public string? ConversationName { get; init; }
    public Guid? MessageId { get; init; }
    public Guid? DocumentId { get; init; }
    public string? DocumentName { get; init; }
}

public record NotificationPreferenceDto
{
    public Guid UserId { get; init; }
    public bool EnableNotifications { get; init; }
    public bool EnablePushNotifications { get; init; }
    public bool EnableEmailNotifications { get; init; }
    public bool EnableSoundNotifications { get; init; }
    public bool NotifyOnNewMessage { get; init; }
    public bool NotifyOnMention { get; init; }
    public bool NotifyOnDocumentShare { get; init; }
    public bool NotifyOnConversationInvite { get; init; }
    public bool NotifyOnSystemUpdate { get; init; }
    public bool EnableQuietHours { get; init; }
    public TimeSpan? QuietHoursStart { get; init; }
    public TimeSpan? QuietHoursEnd { get; init; }
    public string? Timezone { get; init; }
    public EmailDigestFrequency EmailDigestFrequency { get; init; }
}

public record PushSubscriptionDto
{
    public Guid Id { get; init; }
    public string Endpoint { get; init; } = string.Empty;
    public string? DeviceType { get; init; }
    public string? DeviceName { get; init; }
    public bool IsActive { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? LastUsedAt { get; init; }
}

// ==================== Request DTOs ====================

public record CreateNotificationRequest
{
    [Required]
    public Guid UserId { get; init; }

    [Required]
    [MaxLength(50)]
    public string Type { get; init; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Title { get; init; } = string.Empty;

    [Required]
    [MaxLength(1000)]
    public string Body { get; init; } = string.Empty;

    [MaxLength(500)]
    public string? IconUrl { get; init; }

    [MaxLength(500)]
    public string? ActionUrl { get; init; }

    public Dictionary<string, object>? Data { get; init; }

    public NotificationPriority Priority { get; init; } = NotificationPriority.Normal;

    public DateTime? ExpiresAt { get; init; }

    public Guid? SourceUserId { get; init; }

    public Guid? SourceConversationId { get; init; }

    public Guid? SourceMessageId { get; init; }

    public Guid? SourceDocumentId { get; init; }
}

public record SendBulkNotificationRequest
{
    [Required]
    [MinLength(1)]
    public List<Guid> UserIds { get; init; } = new();

    [Required]
    [MaxLength(50)]
    public string Type { get; init; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Title { get; init; } = string.Empty;

    [Required]
    [MaxLength(1000)]
    public string Body { get; init; } = string.Empty;

    [MaxLength(500)]
    public string? IconUrl { get; init; }

    [MaxLength(500)]
    public string? ActionUrl { get; init; }

    public Dictionary<string, object>? Data { get; init; }

    public NotificationPriority Priority { get; init; } = NotificationPriority.Normal;
}

public record UpdateNotificationPreferenceRequest
{
    public bool? EnableNotifications { get; init; }
    public bool? EnablePushNotifications { get; init; }
    public bool? EnableEmailNotifications { get; init; }
    public bool? EnableSoundNotifications { get; init; }
    public bool? NotifyOnNewMessage { get; init; }
    public bool? NotifyOnMention { get; init; }
    public bool? NotifyOnDocumentShare { get; init; }
    public bool? NotifyOnConversationInvite { get; init; }
    public bool? NotifyOnSystemUpdate { get; init; }
    public bool? EnableQuietHours { get; init; }
    public TimeSpan? QuietHoursStart { get; init; }
    public TimeSpan? QuietHoursEnd { get; init; }
    public string? Timezone { get; init; }
    public EmailDigestFrequency? EmailDigestFrequency { get; init; }
}

public record RegisterPushSubscriptionRequest
{
    [Required]
    [MaxLength(500)]
    public string Endpoint { get; init; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string P256dhKey { get; init; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string AuthKey { get; init; } = string.Empty;

    [MaxLength(100)]
    public string? UserAgent { get; init; }

    [MaxLength(50)]
    public string? DeviceType { get; init; }

    [MaxLength(100)]
    public string? DeviceName { get; init; }
}

public record MuteConversationRequest
{
    [Required]
    public Guid ConversationId { get; init; }

    public DateTime? MuteUntil { get; init; } // null = indefinitely
}

public record MarkNotificationsReadRequest
{
    public List<Guid>? NotificationIds { get; init; } // null = mark all as read
}

// ==================== Response DTOs ====================

public record NotificationsResponse
{
    public List<NotificationDto> Items { get; init; } = new();
    public int TotalCount { get; init; }
    public int UnreadCount { get; init; }
    public int PageNumber { get; init; }
    public int PageSize { get; init; }
    public int TotalPages { get; init; }
    public bool HasPreviousPage { get; init; }
    public bool HasNextPage { get; init; }
}

public record NotificationCountResponse
{
    public int TotalCount { get; init; }
    public int UnreadCount { get; init; }
    public Dictionary<string, int> CountByType { get; init; } = new();
}

public record BulkNotificationResult
{
    public int TotalSent { get; init; }
    public int TotalFailed { get; init; }
    public List<Guid> SuccessfulUserIds { get; init; } = new();
    public List<FailedNotification> FailedNotifications { get; init; } = new();
}

public record FailedNotification
{
    public Guid UserId { get; init; }
    public string ErrorMessage { get; init; } = string.Empty;
}

// ==================== Filter/Query DTOs ====================

public record NotificationFilter
{
    public string? Type { get; init; }
    public NotificationStatus? Status { get; init; }
    public NotificationPriority? MinPriority { get; init; }
    public bool? UnreadOnly { get; init; }
    public DateTime? After { get; init; }
    public DateTime? Before { get; init; }
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 20;
}

// ==================== SignalR Event DTOs ====================

public record RealTimeNotificationDto
{
    public Guid Id { get; init; }
    public string Type { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string Body { get; init; } = string.Empty;
    public string? IconUrl { get; init; }
    public string? ActionUrl { get; init; }
    public NotificationPriority Priority { get; init; }
    public DateTime CreatedAt { get; init; }
    public Dictionary<string, object>? Data { get; init; }
}

public record NotificationCountUpdateDto
{
    public Guid UserId { get; init; }
    public int UnreadCount { get; init; }
}

// ==================== API Response Wrapper ====================

public record ApiResponse<T>
{
    public bool Success { get; init; }
    public string? Message { get; init; }
    public T? Data { get; init; }
    public string? ErrorCode { get; init; }

    public static ApiResponse<T> Ok(T data, string? message = null) => new()
    {
        Success = true,
        Data = data,
        Message = message
    };

    public static ApiResponse<T> Fail(string message, string? errorCode = null) => new()
    {
        Success = false,
        Message = message,
        ErrorCode = errorCode
    };
}

public record ApiResponse
{
    public bool Success { get; init; }
    public string? Message { get; init; }
    public string? ErrorCode { get; init; }

    public static ApiResponse Ok(string? message = null) => new()
    {
        Success = true,
        Message = message
    };

    public static ApiResponse Fail(string message, string? errorCode = null) => new()
    {
        Success = false,
        Message = message,
        ErrorCode = errorCode
    };
}

// ==================== Notification Types Constants ====================

public static class NotificationTypes
{
    public const string NewMessage = "new_message";
    public const string Mention = "mention";
    public const string DocumentShared = "document_shared";
    public const string DocumentUploaded = "document_uploaded";
    public const string ConversationInvite = "conversation_invite";
    public const string ConversationUpdate = "conversation_update";
    public const string ParticipantJoined = "participant_joined";
    public const string ParticipantLeft = "participant_left";
    public const string SystemUpdate = "system_update";
    public const string SecurityAlert = "security_alert";
    public const string AccountUpdate = "account_update";
    public const string Reminder = "reminder";
}
