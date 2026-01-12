using System.ComponentModel.DataAnnotations;

namespace ChatService.Models.DTOs;

// ==================== Conversation DTOs ====================

public record ConversationDto
{
    public Guid Id { get; init; }
    public string? Name { get; init; }
    public string Type { get; init; } = "direct";
    public string? AvatarUrl { get; init; }
    public string? LastMessagePreview { get; init; }
    public DateTime? LastMessageAt { get; init; }
    public int UnreadCount { get; init; }
    public bool IsPinned { get; init; }
    public bool IsMuted { get; init; }
    public List<ParticipantDto> Participants { get; init; } = new();
}

public record ConversationDetailDto
{
    public Guid Id { get; init; }
    public string? Name { get; init; }
    public string Type { get; init; } = "direct";
    public string? AvatarUrl { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
    public UserDto? CreatedBy { get; init; }
    public List<ParticipantDto> Participants { get; init; } = new();
    public int TotalMessages { get; init; }
}

public record ParticipantDto
{
    public Guid Id { get; init; }
    public Guid UserId { get; init; }
    public string Username { get; init; } = string.Empty;
    public string FullName { get; init; } = string.Empty;
    public string? AvatarUrl { get; init; }
    public bool IsOnline { get; init; }
    public DateTime? LastSeen { get; init; }
    public string Role { get; init; } = "member";
    public DateTime JoinedAt { get; init; }
}

public record UserDto
{
    public Guid Id { get; init; }
    public string Username { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string FullName { get; init; } = string.Empty;
    public string? AvatarUrl { get; init; }
    public bool IsOnline { get; init; }
    public DateTime? LastSeen { get; init; }
    public DateTime CreatedAt { get; init; }
}

// ==================== Message DTOs ====================

public record MessageDto
{
    public Guid Id { get; init; }
    public Guid ConversationId { get; init; }
    public Guid SenderId { get; init; }
    public string SenderName { get; init; } = string.Empty;
    public string? SenderAvatar { get; init; }
    public string Content { get; init; } = string.Empty;
    public string Type { get; init; } = "text";
    public DateTime CreatedAt { get; init; }
    public DateTime? EditedAt { get; init; }
    public bool IsDeleted { get; init; }
    public AttachmentDto? Attachment { get; init; }
    public List<ReadReceiptDto> ReadBy { get; init; } = new();
    public bool IsOwner { get; init; }
    public MessageDto? ReplyTo { get; init; }
}

public record AttachmentDto
{
    public Guid Id { get; init; }
    public string FileName { get; init; } = string.Empty;
    public string ContentType { get; init; } = string.Empty;
    public long FileSize { get; init; }
    public string FileExtension { get; init; } = string.Empty;
    public string? PreviewUrl { get; init; }
    public string DownloadUrl { get; init; } = string.Empty;
}

public record ReadReceiptDto
{
    public Guid UserId { get; init; }
    public string UserName { get; init; } = string.Empty;
    public DateTime ReadAt { get; init; }
}

// ==================== Request DTOs ====================

public record CreateConversationRequest
{
    [MaxLength(100)]
    public string? Name { get; init; }

    [Required]
    public string Type { get; init; } = "direct";

    [Required]
    [MinLength(1)]
    public List<Guid> ParticipantIds { get; init; } = new();

    [MaxLength(500)]
    public string? AvatarUrl { get; init; }
}

public record UpdateConversationRequest
{
    [MaxLength(100)]
    public string? Name { get; init; }

    [MaxLength(500)]
    public string? AvatarUrl { get; init; }
}

public record SendMessageRequest
{
    [Required]
    [MinLength(1)]
    public string Content { get; init; } = string.Empty;

    public string Type { get; init; } = "text";

    public Guid? ReplyToMessageId { get; init; }

    public Guid? AttachmentId { get; init; }
}

public record EditMessageRequest
{
    [Required]
    [MinLength(1)]
    public string Content { get; init; } = string.Empty;
}

public record DeleteMessageRequest
{
    public bool DeleteForEveryone { get; init; } = false;
}

public record AddParticipantsRequest
{
    [Required]
    [MinLength(1)]
    public List<Guid> UserIds { get; init; } = new();
}

// ==================== Response DTOs ====================

public record ConversationsResponse
{
    public List<ConversationDto> Items { get; init; } = new();
    public int TotalCount { get; init; }
    public int PageNumber { get; init; }
    public int PageSize { get; init; }
    public int TotalPages { get; init; }
    public bool HasPreviousPage { get; init; }
    public bool HasNextPage { get; init; }
}

public record MessagesResponse
{
    public List<MessageDto> Messages { get; init; } = new();
    public int TotalCount { get; init; }
    public int PageNumber { get; init; }
    public int PageSize { get; init; }
    public bool HasMore { get; init; }
    public DateTime? OldestMessageDate { get; init; }
    public DateTime? NewestMessageDate { get; init; }
}

// ==================== SignalR Event DTOs ====================

public record TypingIndicatorDto
{
    public Guid ConversationId { get; init; }
    public Guid UserId { get; init; }
    public string UserName { get; init; } = string.Empty;
    public bool IsTyping { get; init; }
}

public record UserOnlineStatusDto
{
    public Guid UserId { get; init; }
    public string UserName { get; init; } = string.Empty;
    public bool IsOnline { get; init; }
    public DateTime? LastSeen { get; init; }
}

public record MessageDeletedDto
{
    public Guid MessageId { get; init; }
    public Guid ConversationId { get; init; }
    public Guid DeletedBy { get; init; }
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

// ==================== Filter/Query DTOs ====================

public record ConversationFilter
{
    public string? SearchTerm { get; init; }
    public string? Type { get; init; }
    public bool? UnreadOnly { get; init; }
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 20;
}

public record MessageFilter
{
    public string? SearchTerm { get; init; }
    public DateTime? Before { get; init; }
    public DateTime? After { get; init; }
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 50;
}
