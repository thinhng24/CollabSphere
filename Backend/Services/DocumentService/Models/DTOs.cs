using System.ComponentModel.DataAnnotations;

namespace DocumentService.Models.DTOs;

// ==================== Document DTOs ====================

public record DocumentDto
{
    public Guid Id { get; init; }
    public string FileName { get; init; } = string.Empty;
    public string OriginalFileName { get; init; } = string.Empty;
    public string ContentType { get; init; } = string.Empty;
    public string FileExtension { get; init; } = string.Empty;
    public long FileSize { get; init; }
    public string FileSizeFormatted { get; init; } = string.Empty;
    public Guid UploadedById { get; init; }
    public string? UploadedByName { get; init; }
    public DateTime UploadedAt { get; init; }
    public DateTime? ModifiedAt { get; init; }
    public DocumentStatus Status { get; init; }
    public Guid? ConversationId { get; init; }
    public Guid? MessageId { get; init; }
    public string? Description { get; init; }
    public bool IsPublic { get; init; }
    public int DownloadCount { get; init; }
    public string? ThumbnailUrl { get; init; }
    public string DownloadUrl { get; init; } = string.Empty;
    public string PreviewUrl { get; init; } = string.Empty;
}

public record DocumentDetailDto : DocumentDto
{
    public Dictionary<string, object>? Metadata { get; init; }
    public List<DocumentVersionDto> Versions { get; init; } = new();
    public List<DocumentAccessDto> SharedWith { get; init; } = new();
}

public record DocumentVersionDto
{
    public Guid Id { get; init; }
    public int VersionNumber { get; init; }
    public long FileSize { get; init; }
    public string FileSizeFormatted { get; init; } = string.Empty;
    public Guid CreatedById { get; init; }
    public string? CreatedByName { get; init; }
    public DateTime CreatedAt { get; init; }
    public string? ChangeDescription { get; init; }
}

public record DocumentAccessDto
{
    public Guid Id { get; init; }
    public Guid UserId { get; init; }
    public string? UserName { get; init; }
    public string? UserEmail { get; init; }
    public DocumentAccessLevel AccessLevel { get; init; }
    public DateTime GrantedAt { get; init; }
    public DateTime? ExpiresAt { get; init; }
}

// ==================== Request DTOs ====================

public record UploadDocumentRequest
{
    [MaxLength(500)]
    public string? Description { get; init; }

    public Guid? ConversationId { get; init; }

    public Guid? MessageId { get; init; }

    public bool IsPublic { get; init; } = false;
}

public record UpdateDocumentRequest
{
    [MaxLength(255)]
    public string? FileName { get; init; }

    [MaxLength(500)]
    public string? Description { get; init; }

    public bool? IsPublic { get; init; }
}

public record ShareDocumentRequest
{
    [Required]
    public List<Guid> UserIds { get; init; } = new();

    public DocumentAccessLevel AccessLevel { get; init; } = DocumentAccessLevel.Read;

    public DateTime? ExpiresAt { get; init; }
}

public record RevokeAccessRequest
{
    [Required]
    public Guid UserId { get; init; }
}

public record InitiateUploadRequest
{
    [Required]
    [MaxLength(255)]
    public string FileName { get; init; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string ContentType { get; init; } = string.Empty;

    [Required]
    public long TotalSize { get; init; }

    [Required]
    public int TotalChunks { get; init; }
}

public record UploadChunkRequest
{
    [Required]
    public Guid SessionId { get; init; }

    [Required]
    public int ChunkNumber { get; init; }
}

// ==================== Response DTOs ====================

public record DocumentsResponse
{
    public List<DocumentDto> Documents { get; init; } = new();
    public int TotalCount { get; init; }
    public int Page { get; init; }
    public int PageSize { get; init; }
    public int TotalPages { get; init; }
    public bool HasPreviousPage { get; init; }
    public bool HasNextPage { get; init; }
}

public record UploadSessionResponse
{
    public Guid SessionId { get; init; }
    public string UploadUrl { get; init; } = string.Empty;
    public DateTime ExpiresAt { get; init; }
    public int TotalChunks { get; init; }
}

public record ChunkUploadResponse
{
    public Guid SessionId { get; init; }
    public int ChunkNumber { get; init; }
    public int UploadedChunks { get; init; }
    public int TotalChunks { get; init; }
    public bool IsComplete { get; init; }
    public Guid? DocumentId { get; init; }
}

public record DocumentUploadResult
{
    public bool Success { get; init; }
    public Guid? DocumentId { get; init; }
    public string? FileName { get; init; }
    public long? FileSize { get; init; }
    public string? ErrorMessage { get; init; }
    public string? DownloadUrl { get; init; }
}

// ==================== Filter/Query DTOs ====================

public record DocumentFilter
{
    public string? SearchTerm { get; init; }
    public string? ContentType { get; init; }
    public string? FileExtension { get; init; }
    public Guid? ConversationId { get; init; }
    public Guid? UploadedById { get; init; }
    public DateTime? UploadedAfter { get; init; }
    public DateTime? UploadedBefore { get; init; }
    public DocumentStatus? Status { get; init; }
    public bool? IsPublic { get; init; }
    public string? SortBy { get; init; } = "UploadedAt";
    public bool SortDescending { get; init; } = true;
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 20;
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

// ==================== File Type Helpers ====================

public static class FileTypeHelper
{
    private static readonly HashSet<string> ImageExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".svg", ".ico"
    };

    private static readonly HashSet<string> VideoExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".mp4", ".avi", ".mov", ".wmv", ".flv", ".webm", ".mkv"
    };

    private static readonly HashSet<string> AudioExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".mp3", ".wav", ".ogg", ".flac", ".aac", ".wma", ".m4a"
    };

    private static readonly HashSet<string> DocumentExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".rtf", ".odt", ".ods", ".odp"
    };

    private static readonly HashSet<string> ArchiveExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".zip", ".rar", ".7z", ".tar", ".gz", ".bz2"
    };

    public static bool IsImage(string extension) => ImageExtensions.Contains(extension);
    public static bool IsVideo(string extension) => VideoExtensions.Contains(extension);
    public static bool IsAudio(string extension) => AudioExtensions.Contains(extension);
    public static bool IsDocument(string extension) => DocumentExtensions.Contains(extension);
    public static bool IsArchive(string extension) => ArchiveExtensions.Contains(extension);

    public static string GetFileCategory(string extension)
    {
        if (IsImage(extension)) return "image";
        if (IsVideo(extension)) return "video";
        if (IsAudio(extension)) return "audio";
        if (IsDocument(extension)) return "document";
        if (IsArchive(extension)) return "archive";
        return "other";
    }

    public static string FormatFileSize(long bytes)
    {
        string[] sizes = { "B", "KB", "MB", "GB", "TB" };
        int order = 0;
        double size = bytes;

        while (size >= 1024 && order < sizes.Length - 1)
        {
            order++;
            size /= 1024;
        }

        return $"{size:0.##} {sizes[order]}";
    }
}
