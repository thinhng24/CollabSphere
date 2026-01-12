using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DocumentService.Models;

// ==================== Document Entity ====================

/// <summary>
/// Represents a document/file stored in the system
/// </summary>
public class Document
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(255)]
    public string FileName { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    public string OriginalFileName { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string ContentType { get; set; } = string.Empty;

    [MaxLength(20)]
    public string FileExtension { get; set; } = string.Empty;

    public long FileSize { get; set; }

    [Required]
    [MaxLength(500)]
    public string StoragePath { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? ThumbnailPath { get; set; }

    [MaxLength(64)]
    public string? FileHash { get; set; }

    public Guid UploadedById { get; set; }

    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    public DateTime? ModifiedAt { get; set; }

    public DocumentStatus Status { get; set; } = DocumentStatus.Active;

    public DateTime? DeletedAt { get; set; }

    public Guid? DeletedById { get; set; }

    // Optional: Link to conversation/message
    public Guid? ConversationId { get; set; }

    public Guid? MessageId { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    // Metadata as JSON
    [MaxLength(2000)]
    public string? Metadata { get; set; }

    // Access control
    public bool IsPublic { get; set; } = false;

    public int DownloadCount { get; set; } = 0;

    public DateTime? LastAccessedAt { get; set; }
}

/// <summary>
/// Document status enum
/// </summary>
public enum DocumentStatus
{
    Active = 1,
    Archived = 2,
    PendingDeletion = 3,
    Deleted = 4
}

// ==================== Document Access Entity ====================

/// <summary>
/// Tracks who has access to a document
/// </summary>
public class DocumentAccess
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid DocumentId { get; set; }

    [Required]
    public Guid UserId { get; set; }

    public DocumentAccessLevel AccessLevel { get; set; } = DocumentAccessLevel.Read;

    public DateTime GrantedAt { get; set; } = DateTime.UtcNow;

    public Guid GrantedById { get; set; }

    public DateTime? ExpiresAt { get; set; }

    public bool IsActive { get; set; } = true;

    // Navigation property
    [ForeignKey(nameof(DocumentId))]
    public virtual Document Document { get; set; } = null!;
}

/// <summary>
/// Access levels for documents
/// </summary>
public enum DocumentAccessLevel
{
    Read = 1,
    Write = 2,
    Admin = 3
}

// ==================== Document Version Entity ====================

/// <summary>
/// Tracks document versions for version control
/// </summary>
public class DocumentVersion
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid DocumentId { get; set; }

    public int VersionNumber { get; set; }

    [Required]
    [MaxLength(500)]
    public string StoragePath { get; set; } = string.Empty;

    public long FileSize { get; set; }

    [MaxLength(64)]
    public string? FileHash { get; set; }

    public Guid CreatedById { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [MaxLength(500)]
    public string? ChangeDescription { get; set; }

    // Navigation property
    [ForeignKey(nameof(DocumentId))]
    public virtual Document Document { get; set; } = null!;
}

// ==================== Upload Session Entity ====================

/// <summary>
/// Tracks chunked upload sessions for large files
/// </summary>
public class UploadSession
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(255)]
    public string FileName { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string ContentType { get; set; } = string.Empty;

    public long TotalSize { get; set; }

    public long UploadedSize { get; set; } = 0;

    public int TotalChunks { get; set; }

    public int UploadedChunks { get; set; } = 0;

    public Guid UserId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? ExpiresAt { get; set; }

    public UploadSessionStatus Status { get; set; } = UploadSessionStatus.InProgress;

    [MaxLength(500)]
    public string? TempPath { get; set; }

    public Guid? ResultDocumentId { get; set; }
}

/// <summary>
/// Upload session status enum
/// </summary>
public enum UploadSessionStatus
{
    InProgress = 1,
    Completed = 2,
    Failed = 3,
    Cancelled = 4,
    Expired = 5
}
