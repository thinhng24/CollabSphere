using DocumentService.Models;
using DocumentService.Models.DTOs;
using Microsoft.AspNetCore.Http;

namespace DocumentService.Services;

/// <summary>
/// Interface for Document Service operations
/// Handles file uploads, storage, retrieval, and access control
/// </summary>
public interface IDocumentService
{
    #region Document Operations

    /// <summary>
    /// Upload a new document
    /// </summary>
    Task<DocumentDto> UploadDocumentAsync(
        Guid userId,
        IFormFile file,
        UploadDocumentRequest? request = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Upload multiple documents
    /// </summary>
    Task<List<DocumentUploadResult>> UploadDocumentsAsync(
        Guid userId,
        IFormFileCollection files,
        UploadDocumentRequest? request = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get document by ID
    /// </summary>
    Task<DocumentDto?> GetDocumentAsync(
        Guid documentId,
        Guid userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get document details including versions and access info
    /// </summary>
    Task<DocumentDetailDto?> GetDocumentDetailAsync(
        Guid documentId,
        Guid userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get documents with filtering and pagination
    /// </summary>
    Task<DocumentsResponse> GetDocumentsAsync(
        Guid userId,
        DocumentFilter filter,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get documents for a specific conversation
    /// </summary>
    Task<DocumentsResponse> GetConversationDocumentsAsync(
        Guid conversationId,
        Guid userId,
        DocumentFilter filter,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Update document metadata
    /// </summary>
    Task<DocumentDto> UpdateDocumentAsync(
        Guid documentId,
        Guid userId,
        UpdateDocumentRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Delete a document (soft delete)
    /// </summary>
    Task<bool> DeleteDocumentAsync(
        Guid documentId,
        Guid userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Permanently delete a document (hard delete)
    /// </summary>
    Task<bool> PermanentDeleteDocumentAsync(
        Guid documentId,
        Guid userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Restore a soft-deleted document
    /// </summary>
    Task<DocumentDto?> RestoreDocumentAsync(
        Guid documentId,
        Guid userId,
        CancellationToken cancellationToken = default);

    #endregion

    #region File Operations

    /// <summary>
    /// Download document file
    /// </summary>
    Task<(Stream FileStream, string ContentType, string FileName)?> DownloadDocumentAsync(
        Guid documentId,
        Guid userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get document preview (for images, PDFs, etc.)
    /// </summary>
    Task<(Stream FileStream, string ContentType)?> GetDocumentPreviewAsync(
        Guid documentId,
        Guid userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get document thumbnail
    /// </summary>
    Task<(Stream FileStream, string ContentType)?> GetDocumentThumbnailAsync(
        Guid documentId,
        Guid userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Check if user has access to document
    /// </summary>
    Task<bool> UserHasAccessAsync(
        Guid documentId,
        Guid userId,
        DocumentAccessLevel requiredLevel = DocumentAccessLevel.Read,
        CancellationToken cancellationToken = default);

    #endregion

    #region Chunked Upload Operations

    /// <summary>
    /// Initiate a chunked upload session for large files
    /// </summary>
    Task<UploadSessionResponse> InitiateChunkedUploadAsync(
        Guid userId,
        InitiateUploadRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Upload a chunk of a file
    /// </summary>
    Task<ChunkUploadResponse> UploadChunkAsync(
        Guid userId,
        Guid sessionId,
        int chunkNumber,
        Stream chunkData,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Complete a chunked upload and create the document
    /// </summary>
    Task<DocumentDto?> CompleteChunkedUploadAsync(
        Guid userId,
        Guid sessionId,
        UploadDocumentRequest? request = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Cancel a chunked upload session
    /// </summary>
    Task<bool> CancelChunkedUploadAsync(
        Guid userId,
        Guid sessionId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get upload session status
    /// </summary>
    Task<UploadSession?> GetUploadSessionAsync(
        Guid sessionId,
        Guid userId,
        CancellationToken cancellationToken = default);

    #endregion

    #region Access Control Operations

    /// <summary>
    /// Share document with users
    /// </summary>
    Task<DocumentDetailDto> ShareDocumentAsync(
        Guid documentId,
        Guid ownerId,
        ShareDocumentRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Revoke user access to document
    /// </summary>
    Task<bool> RevokeAccessAsync(
        Guid documentId,
        Guid ownerId,
        Guid userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get users who have access to a document
    /// </summary>
    Task<List<DocumentAccessDto>> GetDocumentAccessListAsync(
        Guid documentId,
        Guid userId,
        CancellationToken cancellationToken = default);

    #endregion

    #region Version Control Operations

    /// <summary>
    /// Upload a new version of a document
    /// </summary>
    Task<DocumentDto> UploadNewVersionAsync(
        Guid documentId,
        Guid userId,
        IFormFile file,
        string? changeDescription = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get all versions of a document
    /// </summary>
    Task<List<DocumentVersionDto>> GetDocumentVersionsAsync(
        Guid documentId,
        Guid userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Download a specific version of a document
    /// </summary>
    Task<(Stream FileStream, string ContentType, string FileName)?> DownloadVersionAsync(
        Guid documentId,
        Guid versionId,
        Guid userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Restore a previous version as the current version
    /// </summary>
    Task<DocumentDto?> RestoreVersionAsync(
        Guid documentId,
        Guid versionId,
        Guid userId,
        CancellationToken cancellationToken = default);

    #endregion

    #region Utility Operations

    /// <summary>
    /// Search documents
    /// </summary>
    Task<DocumentsResponse> SearchDocumentsAsync(
        Guid userId,
        string searchTerm,
        DocumentFilter? filter = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get storage statistics for a user
    /// </summary>
    Task<StorageStatsDto> GetUserStorageStatsAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Clean up expired upload sessions
    /// </summary>
    Task<int> CleanupExpiredSessionsAsync(
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Clean up soft-deleted documents older than specified days
    /// </summary>
    Task<int> CleanupDeletedDocumentsAsync(
        int olderThanDays = 30,
        CancellationToken cancellationToken = default);

    #endregion
}

/// <summary>
/// Storage statistics DTO
/// </summary>
public record StorageStatsDto
{
    public Guid UserId { get; init; }
    public long TotalStorageUsed { get; init; }
    public string TotalStorageUsedFormatted { get; init; } = string.Empty;
    public int TotalDocuments { get; init; }
    public int ActiveDocuments { get; init; }
    public int DeletedDocuments { get; init; }
    public Dictionary<string, int> DocumentsByType { get; init; } = new();
    public Dictionary<string, long> StorageByType { get; init; } = new();
}
