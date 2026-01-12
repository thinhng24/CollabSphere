using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NotificationService.Models;

// ==================== Notification Entity ====================

/// <summary>
/// Represents a notification sent to a user
/// </summary>
public class Notification
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid UserId { get; set; }

    [Required]
    [MaxLength(50)]
    public string Type { get; set; } = string.Empty; // "message", "mention", "system", "document", etc.

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(1000)]
    public string Body { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? IconUrl { get; set; }

    [MaxLength(500)]
    public string? ActionUrl { get; set; }

    [MaxLength(2000)]
    public string? Data { get; set; } // JSON data for additional context

    public NotificationPriority Priority { get; set; } = NotificationPriority.Normal;

    public NotificationStatus Status { get; set; } = NotificationStatus.Unread;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? ReadAt { get; set; }

    public DateTime? DismissedAt { get; set; }

    public DateTime? ExpiresAt { get; set; }

    // Source information
    public Guid? SourceUserId { get; set; }

    public Guid? SourceConversationId { get; set; }

    public Guid? SourceMessageId { get; set; }

    public Guid? SourceDocumentId { get; set; }

    // Delivery tracking
    public bool IsDelivered { get; set; } = false;

    public DateTime? DeliveredAt { get; set; }

    public bool IsPushSent { get; set; } = false;

    public bool IsEmailSent { get; set; } = false;
}

/// <summary>
/// Notification priority levels
/// </summary>
public enum NotificationPriority
{
    Low = 0,
    Normal = 1,
    High = 2,
    Urgent = 3
}

/// <summary>
/// Notification status
/// </summary>
public enum NotificationStatus
{
    Unread = 0,
    Read = 1,
    Dismissed = 2,
    Expired = 3
}

// ==================== Notification Preference Entity ====================

/// <summary>
/// User preferences for notifications
/// </summary>
public class NotificationPreference
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid UserId { get; set; }

    // Global settings
    public bool EnableNotifications { get; set; } = true;

    public bool EnablePushNotifications { get; set; } = true;

    public bool EnableEmailNotifications { get; set; } = true;

    public bool EnableSoundNotifications { get; set; } = true;

    // Type-specific settings
    public bool NotifyOnNewMessage { get; set; } = true;

    public bool NotifyOnMention { get; set; } = true;

    public bool NotifyOnDocumentShare { get; set; } = true;

    public bool NotifyOnConversationInvite { get; set; } = true;

    public bool NotifyOnSystemUpdate { get; set; } = true;

    // Quiet hours
    public bool EnableQuietHours { get; set; } = false;

    public TimeSpan? QuietHoursStart { get; set; }

    public TimeSpan? QuietHoursEnd { get; set; }

    [MaxLength(50)]
    public string? Timezone { get; set; } = "UTC";

    // Email digest settings
    public EmailDigestFrequency EmailDigestFrequency { get; set; } = EmailDigestFrequency.Instant;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Email digest frequency options
/// </summary>
public enum EmailDigestFrequency
{
    Instant = 0,
    Hourly = 1,
    Daily = 2,
    Weekly = 3,
    Never = 4
}

// ==================== Push Subscription Entity ====================

/// <summary>
/// Push notification subscription for web push
/// </summary>
public class PushSubscription
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid UserId { get; set; }

    [Required]
    [MaxLength(500)]
    public string Endpoint { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string P256dhKey { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string AuthKey { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? UserAgent { get; set; }

    [MaxLength(50)]
    public string? DeviceType { get; set; } // "web", "mobile", "desktop"

    [MaxLength(100)]
    public string? DeviceName { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? LastUsedAt { get; set; }

    public int FailureCount { get; set; } = 0;

    public DateTime? LastFailureAt { get; set; }
}

// ==================== Notification Template Entity ====================

/// <summary>
/// Templates for notification content
/// </summary>
public class NotificationTemplate
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(50)]
    public string Type { get; set; } = string.Empty; // Matches notification type

    [Required]
    [MaxLength(50)]
    public string Language { get; set; } = "en";

    [Required]
    [MaxLength(200)]
    public string TitleTemplate { get; set; } = string.Empty;

    [Required]
    [MaxLength(1000)]
    public string BodyTemplate { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? IconUrl { get; set; }

    [MaxLength(500)]
    public string? ActionUrlTemplate { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

// ==================== Muted Conversation Entity ====================

/// <summary>
/// Tracks muted conversations for notification suppression
/// </summary>
public class MutedConversation
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid UserId { get; set; }

    [Required]
    public Guid ConversationId { get; set; }

    public DateTime MutedAt { get; set; } = DateTime.UtcNow;

    public DateTime? MutedUntil { get; set; } // null = indefinitely

    public bool IsMuted { get; set; } = true;
}

// ==================== Notification Batch Entity ====================

/// <summary>
/// Groups notifications for batch processing (e.g., email digests)
/// </summary>
public class NotificationBatch
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid UserId { get; set; }

    public BatchType Type { get; set; } = BatchType.EmailDigest;

    public BatchStatus Status { get; set; } = BatchStatus.Pending;

    public int NotificationCount { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? ScheduledAt { get; set; }

    public DateTime? ProcessedAt { get; set; }

    [MaxLength(500)]
    public string? ErrorMessage { get; set; }
}

/// <summary>
/// Batch types
/// </summary>
public enum BatchType
{
    EmailDigest = 0,
    PushBatch = 1
}

/// <summary>
/// Batch processing status
/// </summary>
public enum BatchStatus
{
    Pending = 0,
    Processing = 1,
    Completed = 2,
    Failed = 3
}
