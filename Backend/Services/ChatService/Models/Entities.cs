using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ChatService.Models;

// ==================== Enums ====================

/// <summary>
/// Message type enumeration
/// </summary>
public enum MessageType
{
    Text = 0,
    Image = 1,
    File = 2,
    System = 3
}

// ==================== Conversation Entity ====================

/// <summary>
/// Represents a chat conversation (direct or group)
/// </summary>
public class Conversation
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [MaxLength(100)]
    public string? Name { get; set; }

    [Required]
    [MaxLength(20)]
    public string Type { get; set; } = "direct"; // "direct" or "group"

    [MaxLength(500)]
    public string? AvatarUrl { get; set; }

    public Guid CreatedById { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? LastMessageAt { get; set; }

    [MaxLength(500)]
    public string? LastMessagePreview { get; set; }

    public bool IsActive { get; set; } = true;

    // Navigation properties
    public virtual ICollection<ConversationParticipant> Participants { get; set; } = new List<ConversationParticipant>();
    public virtual ICollection<Message> Messages { get; set; } = new List<Message>();
}

// ==================== Conversation Participant Entity ====================

/// <summary>
/// Represents a participant in a conversation
/// </summary>
public class ConversationParticipant
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid ConversationId { get; set; }

    [Required]
    public Guid UserId { get; set; }

    [MaxLength(20)]
    public string Role { get; set; } = "member"; // "admin" or "member"

    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    public DateTime? LastReadAt { get; set; }

    public int UnreadCount { get; set; } = 0;

    public bool IsMuted { get; set; } = false;

    public bool IsPinned { get; set; } = false;

    public bool IsActive { get; set; } = true;

    // Navigation property
    [ForeignKey(nameof(ConversationId))]
    public virtual Conversation Conversation { get; set; } = null!;
}

// ==================== Message Entity ====================

/// <summary>
/// Represents a message in a conversation
/// </summary>
public class Message
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid ConversationId { get; set; }

    [Required]
    public Guid SenderId { get; set; }

    [Required]
    public string Content { get; set; } = string.Empty;

    [MaxLength(20)]
    public string Type { get; set; } = "text"; // "text", "image", "file", "system"

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? EditedAt { get; set; }

    public bool IsDeleted { get; set; } = false;

    public DateTime? DeletedAt { get; set; }

    public Guid? ReplyToMessageId { get; set; }

    // Attachment info (optional)
    public Guid? AttachmentId { get; set; }

    [MaxLength(255)]
    public string? AttachmentFileName { get; set; }

    [MaxLength(100)]
    public string? AttachmentContentType { get; set; }

    public long? AttachmentFileSize { get; set; }

    // Navigation properties
    [ForeignKey(nameof(ConversationId))]
    public virtual Conversation Conversation { get; set; } = null!;

    [ForeignKey(nameof(ReplyToMessageId))]
    public virtual Message? ReplyToMessage { get; set; }

    public virtual ICollection<MessageReadReceipt> ReadReceipts { get; set; } = new List<MessageReadReceipt>();
}

// ==================== Message Read Receipt Entity ====================

/// <summary>
/// Tracks who has read a message
/// </summary>
public class MessageReadReceipt
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid MessageId { get; set; }

    [Required]
    public Guid UserId { get; set; }

    public DateTime ReadAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    [ForeignKey(nameof(MessageId))]
    public virtual Message Message { get; set; } = null!;
}

// ==================== User Cache Entity ====================

/// <summary>
/// Cached user info from AuthService for display purposes
/// </summary>
public class UserCache
{
    [Key]
    public Guid UserId { get; set; }

    [Required]
    [MaxLength(50)]
    public string Username { get; set; } = string.Empty;

    [MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? AvatarUrl { get; set; }

    public bool IsOnline { get; set; } = false;

    public DateTime? LastSeen { get; set; }

    public DateTime CachedAt { get; set; } = DateTime.UtcNow;

    public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddHours(1);
}
