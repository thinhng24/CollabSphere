using Microsoft.EntityFrameworkCore;
using DocumentService.Data;
using DocumentService.Models;
using DocumentService.Models.DTOs;
using Microsoft.AspNetCore.Http;
using System.Security.Cryptography;
using EventBus.Abstractions;
using EventBus.Events;

namespace DocumentService.Services;

/// <summary>
/// Implementation of Document Service
/// Handles all document-related business logic including file storage, access control, and versioning
/// </summary>
public class DocumentServiceImpl : IDocumentService
{
    private readonly DocumentDbContext _context;
    private readonly ILogger<DocumentServiceImpl> _logger;
    private readonly IConfiguration _configuration;
    private readonly IEventBus _eventBus;
    private readonly string _storagePath;
    private readonly long _maxFileSize;

    public DocumentServiceImpl(
        DocumentDbContext context,
        ILogger<DocumentServiceImpl> logger,
        IConfiguration configuration,
        IEventBus eventBus)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
        _eventBus = eventBus ?? throw new ArgumentNullException(nameof(eventBus));

        _storagePath = _configuration["Storage:BasePath"] ?? Path.Combine(Directory.GetCurrentDirectory(), "uploads");
        _maxFileSize = _configuration.GetValue<long>("Storage:MaxFileSizeBytes", 104857600); // 100 MB default

        // Ensure storage directory exists
        if (!Directory.Exists(_storagePath))
        {
            Directory.CreateDirectory(_storagePath);
        }
    }

    #region Document Operations

    public async Task<DocumentDto> UploadDocumentAsync(
        Guid userId,
        IFormFile file,
        UploadDocumentRequest? request = null,
        CancellationToken cancellationToken = default)
    {
        if (file == null || file.Length == 0)
        {
            throw new ArgumentException("File is empty or null");
        }

        if (file.Length > _maxFileSize)
        {
            throw new ArgumentException($"File size exceeds maximum allowed size of {FileTypeHelper.FormatFileSize(_maxFileSize)}");
        }

        var document = new Document
        {
            Id = Guid.NewGuid(),
            OriginalFileName = file.FileName,
            FileName = SanitizeFileName(file.FileName),
            ContentType = file.ContentType,
            FileExtension = Path.GetExtension(file.FileName).ToLowerInvariant(),
            FileSize = file.Length,
            UploadedById = userId,
            UploadedAt = DateTime.UtcNow,
            Description = request?.Description,
            ConversationId = request?.ConversationId,
            MessageId = request?.MessageId,
            IsPublic = request?.IsPublic ?? false,
            Status = DocumentStatus.Active
        };

        // Generate storage path
        var relativePath = GenerateStoragePath(document.Id, document.FileExtension);
        var fullPath = Path.Combine(_storagePath, relativePath);
        document.StoragePath = relativePath;

        // Ensure directory exists
        var directory = Path.GetDirectoryName(fullPath);
        if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
        {
            Directory.CreateDirectory(directory);
        }

        // Save file and calculate hash
        using (var stream = new FileStream(fullPath, FileMode.Create))
        {
            await file.CopyToAsync(stream, cancellationToken);
        }

        document.FileHash = await CalculateFileHashAsync(fullPath, cancellationToken);

        // Generate thumbnail if it's an image
        if (FileTypeHelper.IsImage(document.FileExtension))
        {
            try
            {
                var thumbnailPath = await GenerateThumbnailAsync(fullPath, document.Id, cancellationToken);
                if (thumbnailPath != null)
                {
                    document.ThumbnailPath = thumbnailPath;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to generate thumbnail for document {DocumentId}", document.Id);
            }
        }

        // Save to database
        _context.Documents.Add(document);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Document {DocumentId} uploaded by user {UserId}: {FileName} ({FileSize})",
            document.Id, userId, document.FileName, FileTypeHelper.FormatFileSize(document.FileSize));

        // Publish DocumentUploadedEvent
        try
        {
            await _eventBus.PublishAsync(new DocumentUploadedEvent
            {
                DocumentId = document.Id,
                FileName = document.FileName,
                FileSize = document.FileSize,
                ContentType = document.ContentType,
                UploadedById = userId,
                UploadedByName = string.Empty, // Will be enriched by consumer if needed
                ConversationId = document.ConversationId,
                RecipientIds = new List<Guid>(),
                UploadedAt = document.UploadedAt
            });
            _logger.LogDebug("Published DocumentUploadedEvent for document: {DocumentId}", document.Id);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to publish DocumentUploadedEvent for document: {DocumentId}", document.Id);
        }

        return MapToDocumentDto(document);
    }

    public async Task<List<DocumentUploadResult>> UploadDocumentsAsync(
        Guid userId,
        IFormFileCollection files,
        UploadDocumentRequest? request = null,
        CancellationToken cancellationToken = default)
    {
        var results = new List<DocumentUploadResult>();

        foreach (var file in files)
        {
            try
            {
                var document = await UploadDocumentAsync(userId, file, request, cancellationToken);
                results.Add(new DocumentUploadResult
                {
                    Success = true,
                    DocumentId = document.Id,
                    FileName = document.FileName,
                    FileSize = document.FileSize,
                    DownloadUrl = document.DownloadUrl
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to upload file {FileName}", file.FileName);
                results.Add(new DocumentUploadResult
                {
                    Success = false,
                    FileName = file.FileName,
                    ErrorMessage = ex.Message
                });
            }
        }

        return results;
    }

    public async Task<DocumentDto?> GetDocumentAsync(
        Guid documentId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var document = await _context.Documents
            .FirstOrDefaultAsync(d => d.Id == documentId && d.Status != DocumentStatus.Deleted, cancellationToken);

        if (document == null)
        {
            return null;
        }

        if (!await UserHasAccessAsync(documentId, userId, DocumentAccessLevel.Read, cancellationToken))
        {
            return null;
        }

        return MapToDocumentDto(document);
    }

    public async Task<DocumentDetailDto?> GetDocumentDetailAsync(
        Guid documentId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var document = await _context.Documents
            .FirstOrDefaultAsync(d => d.Id == documentId && d.Status != DocumentStatus.Deleted, cancellationToken);

        if (document == null)
        {
            return null;
        }

        if (!await UserHasAccessAsync(documentId, userId, DocumentAccessLevel.Read, cancellationToken))
        {
            return null;
        }

        var versions = await _context.DocumentVersions
            .Where(v => v.DocumentId == documentId)
            .OrderByDescending(v => v.VersionNumber)
            .ToListAsync(cancellationToken);

        var accessList = await _context.DocumentAccesses
            .Where(a => a.DocumentId == documentId && a.IsActive)
            .ToListAsync(cancellationToken);

        return new DocumentDetailDto
        {
            Id = document.Id,
            FileName = document.FileName,
            OriginalFileName = document.OriginalFileName,
            ContentType = document.ContentType,
            FileExtension = document.FileExtension,
            FileSize = document.FileSize,
            FileSizeFormatted = FileTypeHelper.FormatFileSize(document.FileSize),
            UploadedById = document.UploadedById,
            UploadedAt = document.UploadedAt,
            ModifiedAt = document.ModifiedAt,
            Status = document.Status,
            ConversationId = document.ConversationId,
            MessageId = document.MessageId,
            Description = document.Description,
            IsPublic = document.IsPublic,
            DownloadCount = document.DownloadCount,
            ThumbnailUrl = document.ThumbnailPath != null ? $"/api/documents/{document.Id}/thumbnail" : null,
            DownloadUrl = $"/api/documents/{document.Id}/download",
            PreviewUrl = $"/api/documents/{document.Id}/preview",
            Versions = versions.Select(v => new DocumentVersionDto
            {
                Id = v.Id,
                VersionNumber = v.VersionNumber,
                FileSize = v.FileSize,
                FileSizeFormatted = FileTypeHelper.FormatFileSize(v.FileSize),
                CreatedById = v.CreatedById,
                CreatedAt = v.CreatedAt,
                ChangeDescription = v.ChangeDescription
            }).ToList(),
            SharedWith = accessList.Select(a => new DocumentAccessDto
            {
                Id = a.Id,
                UserId = a.UserId,
                AccessLevel = a.AccessLevel,
                GrantedAt = a.GrantedAt,
                ExpiresAt = a.ExpiresAt
            }).ToList()
        };
    }

    public async Task<DocumentsResponse> GetDocumentsAsync(
        Guid userId,
        DocumentFilter filter,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Documents
            .Where(d => d.UploadedById == userId || d.IsPublic ||
                        _context.DocumentAccesses.Any(a => a.DocumentId == d.Id && a.UserId == userId && a.IsActive))
            .Where(d => d.Status != DocumentStatus.Deleted)
            .AsQueryable();

        // Apply filters
        query = ApplyFilters(query, filter);

        var totalCount = await query.CountAsync(cancellationToken);

        // Apply sorting
        query = ApplySorting(query, filter.SortBy, filter.SortDescending);

        var documents = await query
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync(cancellationToken);

        var totalPages = (int)Math.Ceiling(totalCount / (double)filter.PageSize);

        return new DocumentsResponse
        {
            Documents = documents.Select(MapToDocumentDto).ToList(),
            TotalCount = totalCount,
            Page = filter.Page,
            PageSize = filter.PageSize,
            TotalPages = totalPages,
            HasPreviousPage = filter.Page > 1,
            HasNextPage = filter.Page < totalPages
        };
    }

    public async Task<DocumentsResponse> GetConversationDocumentsAsync(
        Guid conversationId,
        Guid userId,
        DocumentFilter filter,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Documents
            .Where(d => d.ConversationId == conversationId)
            .Where(d => d.Status != DocumentStatus.Deleted)
            .AsQueryable();

        query = ApplyFilters(query, filter);

        var totalCount = await query.CountAsync(cancellationToken);

        query = ApplySorting(query, filter.SortBy, filter.SortDescending);

        var documents = await query
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync(cancellationToken);

        var totalPages = (int)Math.Ceiling(totalCount / (double)filter.PageSize);

        return new DocumentsResponse
        {
            Documents = documents.Select(MapToDocumentDto).ToList(),
            TotalCount = totalCount,
            Page = filter.Page,
            PageSize = filter.PageSize,
            TotalPages = totalPages,
            HasPreviousPage = filter.Page > 1,
            HasNextPage = filter.Page < totalPages
        };
    }

    public async Task<DocumentDto> UpdateDocumentAsync(
        Guid documentId,
        Guid userId,
        UpdateDocumentRequest request,
        CancellationToken cancellationToken = default)
    {
        var document = await _context.Documents
            .FirstOrDefaultAsync(d => d.Id == documentId && d.Status != DocumentStatus.Deleted, cancellationToken);

        if (document == null)
        {
            throw new KeyNotFoundException("Document not found");
        }

        if (!await UserHasAccessAsync(documentId, userId, DocumentAccessLevel.Write, cancellationToken))
        {
            throw new UnauthorizedAccessException("Not authorized to update this document");
        }

        if (!string.IsNullOrWhiteSpace(request.FileName))
        {
            document.FileName = SanitizeFileName(request.FileName);
        }

        if (request.Description != null)
        {
            document.Description = request.Description;
        }

        if (request.IsPublic.HasValue)
        {
            document.IsPublic = request.IsPublic.Value;
        }

        document.ModifiedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return MapToDocumentDto(document);
    }

    public async Task<bool> DeleteDocumentAsync(
        Guid documentId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var document = await _context.Documents
            .FirstOrDefaultAsync(d => d.Id == documentId && d.Status != DocumentStatus.Deleted, cancellationToken);

        if (document == null)
        {
            return false;
        }

        if (!await UserHasAccessAsync(documentId, userId, DocumentAccessLevel.Admin, cancellationToken))
        {
            throw new UnauthorizedAccessException("Not authorized to delete this document");
        }

        document.Status = DocumentStatus.Deleted;
        document.DeletedAt = DateTime.UtcNow;
        document.DeletedById = userId;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Document {DocumentId} soft-deleted by user {UserId}", documentId, userId);

        // Publish DocumentDeletedEvent
        try
        {
            await _eventBus.PublishAsync(new DocumentDeletedEvent
            {
                DocumentId = documentId,
                FileName = document.FileName,
                DeletedById = userId,
                DeletedByName = string.Empty,
                ConversationId = document.ConversationId,
                AffectedUserIds = new List<Guid>(),
                DeletedAt = document.DeletedAt ?? DateTime.UtcNow
            });
            _logger.LogDebug("Published DocumentDeletedEvent for document: {DocumentId}", documentId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to publish DocumentDeletedEvent for document: {DocumentId}", documentId);
        }

        return true;
    }

    public async Task<bool> PermanentDeleteDocumentAsync(
        Guid documentId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var document = await _context.Documents
            .FirstOrDefaultAsync(d => d.Id == documentId, cancellationToken);

        if (document == null)
        {
            return false;
        }

        if (document.UploadedById != userId)
        {
            throw new UnauthorizedAccessException("Only the document owner can permanently delete it");
        }

        // Delete physical files
        try
        {
            var fullPath = Path.Combine(_storagePath, document.StoragePath);
            if (File.Exists(fullPath))
            {
                File.Delete(fullPath);
            }

            if (!string.IsNullOrEmpty(document.ThumbnailPath))
            {
                var thumbnailFullPath = Path.Combine(_storagePath, document.ThumbnailPath);
                if (File.Exists(thumbnailFullPath))
                {
                    File.Delete(thumbnailFullPath);
                }
            }

            // Delete versions
            var versions = await _context.DocumentVersions
                .Where(v => v.DocumentId == documentId)
                .ToListAsync(cancellationToken);

            foreach (var version in versions)
            {
                var versionPath = Path.Combine(_storagePath, version.StoragePath);
                if (File.Exists(versionPath))
                {
                    File.Delete(versionPath);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete physical files for document {DocumentId}", documentId);
        }

        // Delete from database
        _context.Documents.Remove(document);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Document {DocumentId} permanently deleted by user {UserId}", documentId, userId);

        return true;
    }

    public async Task<DocumentDto?> RestoreDocumentAsync(
        Guid documentId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var document = await _context.Documents
            .FirstOrDefaultAsync(d => d.Id == documentId && d.Status == DocumentStatus.Deleted, cancellationToken);

        if (document == null)
        {
            return null;
        }

        if (document.UploadedById != userId)
        {
            throw new UnauthorizedAccessException("Only the document owner can restore it");
        }

        document.Status = DocumentStatus.Active;
        document.DeletedAt = null;
        document.DeletedById = null;
        document.ModifiedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Document {DocumentId} restored by user {UserId}", documentId, userId);

        return MapToDocumentDto(document);
    }

    #endregion

    #region File Operations

    public async Task<(Stream FileStream, string ContentType, string FileName)?> DownloadDocumentAsync(
        Guid documentId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var document = await _context.Documents
            .FirstOrDefaultAsync(d => d.Id == documentId && d.Status == DocumentStatus.Active, cancellationToken);

        if (document == null)
        {
            return null;
        }

        if (!await UserHasAccessAsync(documentId, userId, DocumentAccessLevel.Read, cancellationToken))
        {
            return null;
        }

        var fullPath = Path.Combine(_storagePath, document.StoragePath);
        if (!File.Exists(fullPath))
        {
            _logger.LogError("Document file not found on disk: {DocumentId}, Path: {Path}", documentId, fullPath);
            return null;
        }

        // Update download count and last accessed
        document.DownloadCount++;
        document.LastAccessedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        var stream = new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read);
        return (stream, document.ContentType, document.OriginalFileName);
    }

    public async Task<(Stream FileStream, string ContentType)?> GetDocumentPreviewAsync(
        Guid documentId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var document = await _context.Documents
            .FirstOrDefaultAsync(d => d.Id == documentId && d.Status == DocumentStatus.Active, cancellationToken);

        if (document == null)
        {
            return null;
        }

        if (!await UserHasAccessAsync(documentId, userId, DocumentAccessLevel.Read, cancellationToken))
        {
            return null;
        }

        var fullPath = Path.Combine(_storagePath, document.StoragePath);
        if (!File.Exists(fullPath))
        {
            return null;
        }

        // For preview, we return the original file for images and PDFs
        if (FileTypeHelper.IsImage(document.FileExtension) ||
            document.ContentType == "application/pdf")
        {
            var stream = new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read);
            return (stream, document.ContentType);
        }

        return null;
    }

    public async Task<(Stream FileStream, string ContentType)?> GetDocumentThumbnailAsync(
        Guid documentId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var document = await _context.Documents
            .FirstOrDefaultAsync(d => d.Id == documentId && d.Status == DocumentStatus.Active, cancellationToken);

        if (document == null || string.IsNullOrEmpty(document.ThumbnailPath))
        {
            return null;
        }

        if (!await UserHasAccessAsync(documentId, userId, DocumentAccessLevel.Read, cancellationToken))
        {
            return null;
        }

        var fullPath = Path.Combine(_storagePath, document.ThumbnailPath);
        if (!File.Exists(fullPath))
        {
            return null;
        }

        var stream = new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read);
        return (stream, "image/jpeg");
    }

    public async Task<bool> UserHasAccessAsync(
        Guid documentId,
        Guid userId,
        DocumentAccessLevel requiredLevel = DocumentAccessLevel.Read,
        CancellationToken cancellationToken = default)
    {
        var document = await _context.Documents
            .FirstOrDefaultAsync(d => d.Id == documentId, cancellationToken);

        if (document == null)
        {
            return false;
        }

        // Owner has full access
        if (document.UploadedById == userId)
        {
            return true;
        }

        // Public documents allow read access to everyone
        if (document.IsPublic && requiredLevel == DocumentAccessLevel.Read)
        {
            return true;
        }

        // Check explicit access grants
        var access = await _context.DocumentAccesses
            .FirstOrDefaultAsync(a => a.DocumentId == documentId &&
                                      a.UserId == userId &&
                                      a.IsActive &&
                                      (a.ExpiresAt == null || a.ExpiresAt > DateTime.UtcNow), cancellationToken);

        if (access == null)
        {
            return false;
        }

        return access.AccessLevel >= requiredLevel;
    }

    #endregion

    #region Chunked Upload Operations

    public async Task<UploadSessionResponse> InitiateChunkedUploadAsync(
        Guid userId,
        InitiateUploadRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request.TotalSize > _maxFileSize)
        {
            throw new ArgumentException($"File size exceeds maximum allowed size of {FileTypeHelper.FormatFileSize(_maxFileSize)}");
        }

        var session = new UploadSession
        {
            Id = Guid.NewGuid(),
            FileName = request.FileName,
            ContentType = request.ContentType,
            TotalSize = request.TotalSize,
            TotalChunks = request.TotalChunks,
            UserId = userId,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddHours(24),
            Status = UploadSessionStatus.InProgress
        };

        // Create temp directory for chunks
        var tempDir = Path.Combine(_storagePath, "temp", session.Id.ToString());
        Directory.CreateDirectory(tempDir);
        session.TempPath = tempDir;

        _context.UploadSessions.Add(session);
        await _context.SaveChangesAsync(cancellationToken);

        return new UploadSessionResponse
        {
            SessionId = session.Id,
            UploadUrl = $"/api/documents/upload/{session.Id}/chunks",
            ExpiresAt = session.ExpiresAt ?? DateTime.UtcNow.AddHours(24),
            TotalChunks = session.TotalChunks
        };
    }

    public async Task<ChunkUploadResponse> UploadChunkAsync(
        Guid userId,
        Guid sessionId,
        int chunkNumber,
        Stream chunkData,
        CancellationToken cancellationToken = default)
    {
        var session = await _context.UploadSessions
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId, cancellationToken);

        if (session == null || session.Status != UploadSessionStatus.InProgress)
        {
            throw new InvalidOperationException("Invalid or expired upload session");
        }

        if (chunkNumber < 0 || chunkNumber >= session.TotalChunks)
        {
            throw new ArgumentException("Invalid chunk number");
        }

        var chunkPath = Path.Combine(session.TempPath!, $"chunk_{chunkNumber:D6}");
        using (var fileStream = new FileStream(chunkPath, FileMode.Create))
        {
            await chunkData.CopyToAsync(fileStream, cancellationToken);
            session.UploadedSize += fileStream.Length;
        }

        session.UploadedChunks++;

        bool isComplete = session.UploadedChunks >= session.TotalChunks;

        if (isComplete)
        {
            session.Status = UploadSessionStatus.Completed;
        }

        await _context.SaveChangesAsync(cancellationToken);

        return new ChunkUploadResponse
        {
            SessionId = sessionId,
            ChunkNumber = chunkNumber,
            UploadedChunks = session.UploadedChunks,
            TotalChunks = session.TotalChunks,
            IsComplete = isComplete
        };
    }

    public async Task<DocumentDto?> CompleteChunkedUploadAsync(
        Guid userId,
        Guid sessionId,
        UploadDocumentRequest? request = null,
        CancellationToken cancellationToken = default)
    {
        var session = await _context.UploadSessions
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId, cancellationToken);

        if (session == null || session.Status != UploadSessionStatus.Completed)
        {
            return null;
        }

        // Merge chunks
        var document = new Document
        {
            Id = Guid.NewGuid(),
            OriginalFileName = session.FileName,
            FileName = SanitizeFileName(session.FileName),
            ContentType = session.ContentType,
            FileExtension = Path.GetExtension(session.FileName).ToLowerInvariant(),
            FileSize = session.TotalSize,
            UploadedById = userId,
            UploadedAt = DateTime.UtcNow,
            Description = request?.Description,
            ConversationId = request?.ConversationId,
            MessageId = request?.MessageId,
            IsPublic = request?.IsPublic ?? false,
            Status = DocumentStatus.Active
        };

        var relativePath = GenerateStoragePath(document.Id, document.FileExtension);
        var fullPath = Path.Combine(_storagePath, relativePath);
        document.StoragePath = relativePath;

        var directory = Path.GetDirectoryName(fullPath);
        if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
        {
            Directory.CreateDirectory(directory);
        }

        // Merge chunks into final file
        using (var outputStream = new FileStream(fullPath, FileMode.Create))
        {
            for (int i = 0; i < session.TotalChunks; i++)
            {
                var chunkPath = Path.Combine(session.TempPath!, $"chunk_{i:D6}");
                using var chunkStream = new FileStream(chunkPath, FileMode.Open, FileAccess.Read);
                await chunkStream.CopyToAsync(outputStream, cancellationToken);
            }
        }

        document.FileHash = await CalculateFileHashAsync(fullPath, cancellationToken);

        // Cleanup temp directory
        try
        {
            Directory.Delete(session.TempPath!, true);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to cleanup temp directory for session {SessionId}", sessionId);
        }

        session.ResultDocumentId = document.Id;

        _context.Documents.Add(document);
        await _context.SaveChangesAsync(cancellationToken);

        return MapToDocumentDto(document);
    }

    public async Task<bool> CancelChunkedUploadAsync(
        Guid userId,
        Guid sessionId,
        CancellationToken cancellationToken = default)
    {
        var session = await _context.UploadSessions
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId, cancellationToken);

        if (session == null)
        {
            return false;
        }

        session.Status = UploadSessionStatus.Cancelled;

        // Cleanup temp directory
        if (!string.IsNullOrEmpty(session.TempPath) && Directory.Exists(session.TempPath))
        {
            try
            {
                Directory.Delete(session.TempPath, true);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to cleanup temp directory for session {SessionId}", sessionId);
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }

    public async Task<UploadSession?> GetUploadSessionAsync(
        Guid sessionId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        return await _context.UploadSessions
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId, cancellationToken);
    }

    #endregion

    #region Access Control Operations

    public async Task<DocumentDetailDto> ShareDocumentAsync(
        Guid documentId,
        Guid ownerId,
        ShareDocumentRequest request,
        CancellationToken cancellationToken = default)
    {
        var document = await _context.Documents
            .FirstOrDefaultAsync(d => d.Id == documentId && d.Status == DocumentStatus.Active, cancellationToken);

        if (document == null)
        {
            throw new KeyNotFoundException("Document not found");
        }

        if (document.UploadedById != ownerId)
        {
            throw new UnauthorizedAccessException("Only the document owner can share it");
        }

        foreach (var userId in request.UserIds)
        {
            var existingAccess = await _context.DocumentAccesses
                .FirstOrDefaultAsync(a => a.DocumentId == documentId && a.UserId == userId, cancellationToken);

            if (existingAccess != null)
            {
                existingAccess.AccessLevel = request.AccessLevel;
                existingAccess.ExpiresAt = request.ExpiresAt;
                existingAccess.IsActive = true;
                existingAccess.GrantedAt = DateTime.UtcNow;
            }
            else
            {
                _context.DocumentAccesses.Add(new DocumentAccess
                {
                    Id = Guid.NewGuid(),
                    DocumentId = documentId,
                    UserId = userId,
                    AccessLevel = request.AccessLevel,
                    GrantedById = ownerId,
                    GrantedAt = DateTime.UtcNow,
                    ExpiresAt = request.ExpiresAt
                });
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        return (await GetDocumentDetailAsync(documentId, ownerId, cancellationToken))!;
    }

    public async Task<bool> RevokeAccessAsync(
        Guid documentId,
        Guid ownerId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var document = await _context.Documents
            .FirstOrDefaultAsync(d => d.Id == documentId, cancellationToken);

        if (document == null || document.UploadedById != ownerId)
        {
            return false;
        }

        var access = await _context.DocumentAccesses
            .FirstOrDefaultAsync(a => a.DocumentId == documentId && a.UserId == userId, cancellationToken);

        if (access == null)
        {
            return false;
        }

        access.IsActive = false;
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }

    public async Task<List<DocumentAccessDto>> GetDocumentAccessListAsync(
        Guid documentId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var document = await _context.Documents
            .FirstOrDefaultAsync(d => d.Id == documentId, cancellationToken);

        if (document == null || document.UploadedById != userId)
        {
            return new List<DocumentAccessDto>();
        }

        var accessList = await _context.DocumentAccesses
            .Where(a => a.DocumentId == documentId && a.IsActive)
            .ToListAsync(cancellationToken);

        return accessList.Select(a => new DocumentAccessDto
        {
            Id = a.Id,
            UserId = a.UserId,
            AccessLevel = a.AccessLevel,
            GrantedAt = a.GrantedAt,
            ExpiresAt = a.ExpiresAt
        }).ToList();
    }

    #endregion

    #region Version Control Operations

    public async Task<DocumentDto> UploadNewVersionAsync(
        Guid documentId,
        Guid userId,
        IFormFile file,
        string? changeDescription = null,
        CancellationToken cancellationToken = default)
    {
        var document = await _context.Documents
            .FirstOrDefaultAsync(d => d.Id == documentId && d.Status == DocumentStatus.Active, cancellationToken);

        if (document == null)
        {
            throw new KeyNotFoundException("Document not found");
        }

        if (!await UserHasAccessAsync(documentId, userId, DocumentAccessLevel.Write, cancellationToken))
        {
            throw new UnauthorizedAccessException("Not authorized to update this document");
        }

        // Get current version number
        var maxVersion = await _context.DocumentVersions
            .Where(v => v.DocumentId == documentId)
            .MaxAsync(v => (int?)v.VersionNumber, cancellationToken) ?? 0;

        // Create version entry for current file
        var version = new DocumentVersion
        {
            Id = Guid.NewGuid(),
            DocumentId = documentId,
            VersionNumber = maxVersion + 1,
            StoragePath = document.StoragePath,
            FileSize = document.FileSize,
            FileHash = document.FileHash,
            CreatedById = userId,
            CreatedAt = DateTime.UtcNow,
            ChangeDescription = changeDescription
        };

        _context.DocumentVersions.Add(version);

        // Upload new file
        var relativePath = GenerateStoragePath(document.Id, Path.GetExtension(file.FileName).ToLowerInvariant());
        var fullPath = Path.Combine(_storagePath, relativePath);

        var directory = Path.GetDirectoryName(fullPath);
        if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
        {
            Directory.CreateDirectory(directory);
        }

        using (var stream = new FileStream(fullPath, FileMode.Create))
        {
            await file.CopyToAsync(stream, cancellationToken);
        }

        document.StoragePath = relativePath;
        document.FileSize = file.Length;
        document.FileName = SanitizeFileName(file.FileName);
        document.OriginalFileName = file.FileName;
        document.ContentType = file.ContentType;
        document.FileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
        document.FileHash = await CalculateFileHashAsync(fullPath, cancellationToken);
        document.ModifiedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return MapToDocumentDto(document);
    }

    public async Task<List<DocumentVersionDto>> GetDocumentVersionsAsync(
        Guid documentId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        if (!await UserHasAccessAsync(documentId, userId, DocumentAccessLevel.Read, cancellationToken))
        {
            return new List<DocumentVersionDto>();
        }

        var versions = await _context.DocumentVersions
            .Where(v => v.DocumentId == documentId)
            .OrderByDescending(v => v.VersionNumber)
            .ToListAsync(cancellationToken);

        return versions.Select(v => new DocumentVersionDto
        {
            Id = v.Id,
            VersionNumber = v.VersionNumber,
            FileSize = v.FileSize,
            FileSizeFormatted = FileTypeHelper.FormatFileSize(v.FileSize),
            CreatedById = v.CreatedById,
            CreatedAt = v.CreatedAt,
            ChangeDescription = v.ChangeDescription
        }).ToList();
    }

    public async Task<(Stream FileStream, string ContentType, string FileName)?> DownloadVersionAsync(
        Guid documentId,
        Guid versionId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        if (!await UserHasAccessAsync(documentId, userId, DocumentAccessLevel.Read, cancellationToken))
        {
            return null;
        }

        var version = await _context.DocumentVersions
            .Include(v => v.Document)
            .FirstOrDefaultAsync(v => v.Id == versionId && v.DocumentId == documentId, cancellationToken);

        if (version == null)
        {
            return null;
        }

        var fullPath = Path.Combine(_storagePath, version.StoragePath);
        if (!File.Exists(fullPath))
        {
            return null;
        }

        var stream = new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read);
        return (stream, version.Document.ContentType, $"v{version.VersionNumber}_{version.Document.OriginalFileName}");
    }

    public async Task<DocumentDto?> RestoreVersionAsync(
        Guid documentId,
        Guid versionId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        if (!await UserHasAccessAsync(documentId, userId, DocumentAccessLevel.Write, cancellationToken))
        {
            return null;
        }

        var version = await _context.DocumentVersions
            .FirstOrDefaultAsync(v => v.Id == versionId && v.DocumentId == documentId, cancellationToken);

        if (version == null)
        {
            return null;
        }

        var document = await _context.Documents.FindAsync(new object[] { documentId }, cancellationToken);
        if (document == null)
        {
            return null;
        }

        // Create version of current state
        var maxVersion = await _context.DocumentVersions
            .Where(v => v.DocumentId == documentId)
            .MaxAsync(v => (int?)v.VersionNumber, cancellationToken) ?? 0;

        _context.DocumentVersions.Add(new DocumentVersion
        {
            Id = Guid.NewGuid(),
            DocumentId = documentId,
            VersionNumber = maxVersion + 1,
            StoragePath = document.StoragePath,
            FileSize = document.FileSize,
            FileHash = document.FileHash,
            CreatedById = userId,
            CreatedAt = DateTime.UtcNow,
            ChangeDescription = $"Restored from version {version.VersionNumber}"
        });

        // Restore from version
        document.StoragePath = version.StoragePath;
        document.FileSize = version.FileSize;
        document.FileHash = version.FileHash;
        document.ModifiedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return MapToDocumentDto(document);
    }

    #endregion

    #region Utility Operations

    public async Task<DocumentsResponse> SearchDocumentsAsync(
        Guid userId,
        string searchTerm,
        DocumentFilter? filter = null,
        CancellationToken cancellationToken = default)
    {
        filter ??= new DocumentFilter();

        var query = _context.Documents
            .Where(d => d.UploadedById == userId || d.IsPublic ||
                        _context.DocumentAccesses.Any(a => a.DocumentId == d.Id && a.UserId == userId && a.IsActive))
            .Where(d => d.Status != DocumentStatus.Deleted)
            .Where(d => d.FileName.Contains(searchTerm) ||
                       d.OriginalFileName.Contains(searchTerm) ||
                       (d.Description != null && d.Description.Contains(searchTerm)))
            .AsQueryable();

        query = ApplyFilters(query, filter);

        var totalCount = await query.CountAsync(cancellationToken);

        query = ApplySorting(query, filter.SortBy, filter.SortDescending);

        var documents = await query
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync(cancellationToken);

        var totalPages = (int)Math.Ceiling(totalCount / (double)filter.PageSize);

        return new DocumentsResponse
        {
            Documents = documents.Select(MapToDocumentDto).ToList(),
            TotalCount = totalCount,
            Page = filter.Page,
            PageSize = filter.PageSize,
            TotalPages = totalPages,
            HasPreviousPage = filter.Page > 1,
            HasNextPage = filter.Page < totalPages
        };
    }

    public async Task<StorageStatsDto> GetUserStorageStatsAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var documents = await _context.Documents
            .Where(d => d.UploadedById == userId)
            .ToListAsync(cancellationToken);

        var activeDocuments = documents.Where(d => d.Status == DocumentStatus.Active).ToList();
        var deletedDocuments = documents.Where(d => d.Status == DocumentStatus.Deleted).ToList();

        var byType = activeDocuments
            .GroupBy(d => FileTypeHelper.GetFileCategory(d.FileExtension))
            .ToDictionary(g => g.Key, g => g.Count());

        var storageByType = activeDocuments
            .GroupBy(d => FileTypeHelper.GetFileCategory(d.FileExtension))
            .ToDictionary(g => g.Key, g => g.Sum(d => d.FileSize));

        var totalStorage = activeDocuments.Sum(d => d.FileSize);

        return new StorageStatsDto
        {
            UserId = userId,
            TotalStorageUsed = totalStorage,
            TotalStorageUsedFormatted = FileTypeHelper.FormatFileSize(totalStorage),
            TotalDocuments = documents.Count,
            ActiveDocuments = activeDocuments.Count,
            DeletedDocuments = deletedDocuments.Count,
            DocumentsByType = byType,
            StorageByType = storageByType
        };
    }

    public async Task<int> CleanupExpiredSessionsAsync(
        CancellationToken cancellationToken = default)
    {
        var expiredSessions = await _context.UploadSessions
            .Where(s => s.Status == UploadSessionStatus.InProgress &&
                       s.ExpiresAt != null &&
                       s.ExpiresAt < DateTime.UtcNow)
            .ToListAsync(cancellationToken);

        foreach (var session in expiredSessions)
        {
            session.Status = UploadSessionStatus.Expired;

            if (!string.IsNullOrEmpty(session.TempPath) && Directory.Exists(session.TempPath))
            {
                try
                {
                    Directory.Delete(session.TempPath, true);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to cleanup expired session {SessionId}", session.Id);
                }
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        return expiredSessions.Count;
    }

    public async Task<int> CleanupDeletedDocumentsAsync(
        int olderThanDays = 30,
        CancellationToken cancellationToken = default)
    {
        var cutoffDate = DateTime.UtcNow.AddDays(-olderThanDays);

        var documentsToDelete = await _context.Documents
            .Where(d => d.Status == DocumentStatus.Deleted &&
                       d.DeletedAt != null &&
                       d.DeletedAt < cutoffDate)
            .ToListAsync(cancellationToken);

        int count = 0;
        foreach (var document in documentsToDelete)
        {
            try
            {
                var fullPath = Path.Combine(_storagePath, document.StoragePath);
                if (File.Exists(fullPath))
                {
                    File.Delete(fullPath);
                }

                if (!string.IsNullOrEmpty(document.ThumbnailPath))
                {
                    var thumbnailPath = Path.Combine(_storagePath, document.ThumbnailPath);
                    if (File.Exists(thumbnailPath))
                    {
                        File.Delete(thumbnailPath);
                    }
                }

                _context.Documents.Remove(document);
                count++;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to cleanup deleted document {DocumentId}", document.Id);
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        return count;
    }

    #endregion

    #region Private Helper Methods

    private string GenerateStoragePath(Guid documentId, string extension)
    {
        var date = DateTime.UtcNow;
        return Path.Combine(
            date.Year.ToString(),
            date.Month.ToString("D2"),
            date.Day.ToString("D2"),
            $"{documentId}{extension}");
    }

    private static string SanitizeFileName(string fileName)
    {
        var invalidChars = Path.GetInvalidFileNameChars();
        var sanitized = new string(fileName.Where(c => !invalidChars.Contains(c)).ToArray());
        return string.IsNullOrWhiteSpace(sanitized) ? "file" : sanitized;
    }

    private static async Task<string> CalculateFileHashAsync(string filePath, CancellationToken cancellationToken)
    {
        using var sha256 = SHA256.Create();
        using var stream = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read);
        var hashBytes = await sha256.ComputeHashAsync(stream, cancellationToken);
        return Convert.ToHexString(hashBytes).ToLowerInvariant();
    }

    private static Task<string?> GenerateThumbnailAsync(string filePath, Guid documentId, CancellationToken cancellationToken)
    {
        // Thumbnail generation would require image processing library like ImageSharp
        // For now, return null - can be implemented later
        return Task.FromResult<string?>(null);
    }

    private DocumentDto MapToDocumentDto(Document document)
    {
        return new DocumentDto
        {
            Id = document.Id,
            FileName = document.FileName,
            OriginalFileName = document.OriginalFileName,
            ContentType = document.ContentType,
            FileExtension = document.FileExtension,
            FileSize = document.FileSize,
            FileSizeFormatted = FileTypeHelper.FormatFileSize(document.FileSize),
            UploadedById = document.UploadedById,
            UploadedAt = document.UploadedAt,
            ModifiedAt = document.ModifiedAt,
            Status = document.Status,
            ConversationId = document.ConversationId,
            MessageId = document.MessageId,
            Description = document.Description,
            IsPublic = document.IsPublic,
            DownloadCount = document.DownloadCount,
            ThumbnailUrl = document.ThumbnailPath != null ? $"/api/documents/{document.Id}/thumbnail" : null,
            DownloadUrl = $"/api/documents/{document.Id}/download",
            PreviewUrl = $"/api/documents/{document.Id}/preview"
        };
    }

    private static IQueryable<Document> ApplyFilters(IQueryable<Document> query, DocumentFilter filter)
    {
        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            query = query.Where(d => d.FileName.Contains(filter.SearchTerm) ||
                                    d.OriginalFileName.Contains(filter.SearchTerm));
        }

        if (!string.IsNullOrWhiteSpace(filter.ContentType))
        {
            query = query.Where(d => d.ContentType == filter.ContentType);
        }

        if (!string.IsNullOrWhiteSpace(filter.FileExtension))
        {
            query = query.Where(d => d.FileExtension == filter.FileExtension);
        }

        if (filter.ConversationId.HasValue)
        {
            query = query.Where(d => d.ConversationId == filter.ConversationId.Value);
        }

        if (filter.UploadedById.HasValue)
        {
            query = query.Where(d => d.UploadedById == filter.UploadedById.Value);
        }

        if (filter.UploadedAfter.HasValue)
        {
            query = query.Where(d => d.UploadedAt >= filter.UploadedAfter.Value);
        }

        if (filter.UploadedBefore.HasValue)
        {
            query = query.Where(d => d.UploadedAt <= filter.UploadedBefore.Value);
        }

        if (filter.Status.HasValue)
        {
            query = query.Where(d => d.Status == filter.Status.Value);
        }

        if (filter.IsPublic.HasValue)
        {
            query = query.Where(d => d.IsPublic == filter.IsPublic.Value);
        }

        return query;
    }

    private static IQueryable<Document> ApplySorting(IQueryable<Document> query, string? sortBy, bool descending)
    {
        return sortBy?.ToLowerInvariant() switch
        {
            "filename" => descending ? query.OrderByDescending(d => d.FileName) : query.OrderBy(d => d.FileName),
            "filesize" => descending ? query.OrderByDescending(d => d.FileSize) : query.OrderBy(d => d.FileSize),
            "contenttype" => descending ? query.OrderByDescending(d => d.ContentType) : query.OrderBy(d => d.ContentType),
            "modifiedat" => descending ? query.OrderByDescending(d => d.ModifiedAt) : query.OrderBy(d => d.ModifiedAt),
            _ => descending ? query.OrderByDescending(d => d.UploadedAt) : query.OrderBy(d => d.UploadedAt)
        };
    }

    #endregion
}
