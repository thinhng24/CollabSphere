using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DocumentService.Models.DTOs;
using DocumentService.Services;
using System.Security.Claims;

namespace DocumentService.Controllers;

/// <summary>
/// API Controller for Document operations
/// Handles file uploads, downloads, and document management
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DocumentController : ControllerBase
{
    private readonly IDocumentService _documentService;
    private readonly ILogger<DocumentController> _logger;

    public DocumentController(IDocumentService documentService, ILogger<DocumentController> logger)
    {
        _documentService = documentService ?? throw new ArgumentNullException(nameof(documentService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    #region Document CRUD Endpoints

    /// <summary>
    /// Get all documents for the current user
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(DocumentsResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<DocumentsResponse>> GetDocuments(
        [FromQuery] DocumentFilter filter,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var documents = await _documentService.GetDocumentsAsync(userId, filter, cancellationToken);
        return Ok(documents);
    }

    /// <summary>
    /// Search documents with filters (POST version for complex queries)
    /// </summary>
    [HttpPost("search")]
    [ProducesResponseType(typeof(DocumentsResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<DocumentsResponse>> SearchDocuments(
        [FromBody] DocumentFilter filter,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var documents = await _documentService.GetDocumentsAsync(userId, filter, cancellationToken);
        return Ok(documents);
    }

    /// <summary>
    /// Get a specific document by ID
    /// </summary>
    [HttpGet("{documentId:guid}")]
    [ProducesResponseType(typeof(DocumentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DocumentDto>> GetDocument(
        Guid documentId,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var document = await _documentService.GetDocumentAsync(documentId, userId, cancellationToken);

        if (document == null)
        {
            return NotFound(new { Message = "Document not found or access denied" });
        }

        return Ok(document);
    }

    /// <summary>
    /// Get document details including versions and sharing info
    /// </summary>
    [HttpGet("{documentId:guid}/details")]
    [ProducesResponseType(typeof(DocumentDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DocumentDetailDto>> GetDocumentDetails(
        Guid documentId,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var document = await _documentService.GetDocumentDetailAsync(documentId, userId, cancellationToken);

        if (document == null)
        {
            return NotFound(new { Message = "Document not found or access denied" });
        }

        return Ok(document);
    }

    /// <summary>
    /// Upload a new document
    /// </summary>
    [HttpPost("upload")]
    [ProducesResponseType(typeof(DocumentDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [RequestSizeLimit(104857600)] // 100 MB
    public async Task<ActionResult<DocumentDto>> UploadDocument(
        IFormFile file,
        [FromForm] UploadDocumentRequest? request = null,
        CancellationToken cancellationToken = default)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { Message = "No file provided" });
        }

        try
        {
            var userId = GetCurrentUserId();
            var document = await _documentService.UploadDocumentAsync(userId, file, request, cancellationToken);
            return CreatedAtAction(nameof(GetDocument), new { documentId = document.Id }, document);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    /// <summary>
    /// Upload multiple documents
    /// </summary>
    [HttpPost("upload/multiple")]
    [HttpPost("upload-multiple")]
    [ProducesResponseType(typeof(List<DocumentUploadResult>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [RequestSizeLimit(524288000)] // 500 MB total
    public async Task<ActionResult<List<DocumentUploadResult>>> UploadMultipleDocuments(
        IFormFileCollection files,
        [FromForm] UploadDocumentRequest? request = null,
        CancellationToken cancellationToken = default)
    {
        if (files == null || files.Count == 0)
        {
            return BadRequest(new { Message = "No files provided" });
        }

        var userId = GetCurrentUserId();
        var results = await _documentService.UploadDocumentsAsync(userId, files, request, cancellationToken);
        return Ok(results);
    }

    /// <summary>
    /// Update document metadata
    /// </summary>
    [HttpPut("{documentId:guid}")]
    [ProducesResponseType(typeof(DocumentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DocumentDto>> UpdateDocument(
        Guid documentId,
        [FromBody] UpdateDocumentRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = GetCurrentUserId();
            var document = await _documentService.UpdateDocumentAsync(documentId, userId, request, cancellationToken);
            return Ok(document);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { Message = "Document not found" });
        }
    }

    /// <summary>
    /// Delete a document (soft delete)
    /// </summary>
    [HttpDelete("{documentId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteDocument(
        Guid documentId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _documentService.DeleteDocumentAsync(documentId, userId, cancellationToken);

            if (!result)
            {
                return NotFound(new { Message = "Document not found" });
            }

            return NoContent();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    /// <summary>
    /// Permanently delete a document (hard delete)
    /// </summary>
    [HttpDelete("{documentId:guid}/permanent")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> PermanentDeleteDocument(
        Guid documentId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _documentService.PermanentDeleteDocumentAsync(documentId, userId, cancellationToken);

            if (!result)
            {
                return NotFound(new { Message = "Document not found" });
            }

            return NoContent();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    /// <summary>
    /// Restore a soft-deleted document
    /// </summary>
    [HttpPost("{documentId:guid}/restore")]
    [ProducesResponseType(typeof(DocumentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DocumentDto>> RestoreDocument(
        Guid documentId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = GetCurrentUserId();
            var document = await _documentService.RestoreDocumentAsync(documentId, userId, cancellationToken);

            if (document == null)
            {
                return NotFound(new { Message = "Document not found" });
            }

            return Ok(document);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    #endregion

    #region File Download/Preview Endpoints

    /// <summary>
    /// Download a document
    /// </summary>
    [HttpGet("{documentId:guid}/download")]
    [ProducesResponseType(typeof(FileStreamResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DownloadDocument(
        Guid documentId,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var result = await _documentService.DownloadDocumentAsync(documentId, userId, cancellationToken);

        if (result == null)
        {
            return NotFound(new { Message = "Document not found or access denied" });
        }

        return File(result.Value.FileStream, result.Value.ContentType, result.Value.FileName);
    }

    /// <summary>
    /// Get document preview (for images, PDFs, etc.)
    /// </summary>
    [HttpGet("{documentId:guid}/preview")]
    [ProducesResponseType(typeof(FileStreamResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetDocumentPreview(
        Guid documentId,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var result = await _documentService.GetDocumentPreviewAsync(documentId, userId, cancellationToken);

        if (result == null)
        {
            return NotFound(new { Message = "Preview not available" });
        }

        return File(result.Value.FileStream, result.Value.ContentType);
    }

    /// <summary>
    /// Get document thumbnail
    /// </summary>
    [HttpGet("{documentId:guid}/thumbnail")]
    [ProducesResponseType(typeof(FileStreamResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetDocumentThumbnail(
        Guid documentId,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var result = await _documentService.GetDocumentThumbnailAsync(documentId, userId, cancellationToken);

        if (result == null)
        {
            return NotFound(new { Message = "Thumbnail not available" });
        }

        return File(result.Value.FileStream, result.Value.ContentType);
    }

    #endregion

    #region Chunked Upload Endpoints

    /// <summary>
    /// Initiate a chunked upload session for large files
    /// </summary>
    [HttpPost("upload/initiate")]
    [ProducesResponseType(typeof(UploadSessionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<UploadSessionResponse>> InitiateChunkedUpload(
        [FromBody] InitiateUploadRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = GetCurrentUserId();
            var session = await _documentService.InitiateChunkedUploadAsync(userId, request, cancellationToken);
            return Ok(session);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    /// <summary>
    /// Upload a chunk of a file
    /// </summary>
    [HttpPost("upload/{sessionId:guid}/chunks/{chunkNumber:int}")]
    [ProducesResponseType(typeof(ChunkUploadResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [RequestSizeLimit(10485760)] // 10 MB per chunk
    public async Task<ActionResult<ChunkUploadResponse>> UploadChunk(
        Guid sessionId,
        int chunkNumber,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _documentService.UploadChunkAsync(
                userId, sessionId, chunkNumber, Request.Body, cancellationToken);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    /// <summary>
    /// Complete a chunked upload and create the document
    /// </summary>
    [HttpPost("upload/{sessionId:guid}/complete")]
    [ProducesResponseType(typeof(DocumentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DocumentDto>> CompleteChunkedUpload(
        Guid sessionId,
        [FromBody] UploadDocumentRequest? request = null,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var document = await _documentService.CompleteChunkedUploadAsync(userId, sessionId, request, cancellationToken);

        if (document == null)
        {
            return BadRequest(new { Message = "Upload session not found or not completed" });
        }

        return Ok(document);
    }

    /// <summary>
    /// Cancel a chunked upload session
    /// </summary>
    [HttpDelete("upload/{sessionId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CancelChunkedUpload(
        Guid sessionId,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var result = await _documentService.CancelChunkedUploadAsync(userId, sessionId, cancellationToken);

        if (!result)
        {
            return NotFound(new { Message = "Upload session not found" });
        }

        return NoContent();
    }

    #endregion

    #region Sharing Endpoints

    /// <summary>
    /// Share document with users
    /// </summary>
    [HttpPost("{documentId:guid}/share")]
    [ProducesResponseType(typeof(DocumentDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DocumentDetailDto>> ShareDocument(
        Guid documentId,
        [FromBody] ShareDocumentRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = GetCurrentUserId();
            var document = await _documentService.ShareDocumentAsync(documentId, userId, request, cancellationToken);
            return Ok(document);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { Message = "Document not found" });
        }
    }

    /// <summary>
    /// Revoke user access to document
    /// </summary>
    [HttpDelete("{documentId:guid}/share/{userToRevokeId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RevokeAccess(
        Guid documentId,
        Guid userToRevokeId,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var result = await _documentService.RevokeAccessAsync(documentId, userId, userToRevokeId, cancellationToken);

        if (!result)
        {
            return NotFound(new { Message = "Document or access not found" });
        }

        return NoContent();
    }

    /// <summary>
    /// Get users who have access to a document
    /// </summary>
    [HttpGet("{documentId:guid}/share")]
    [ProducesResponseType(typeof(List<DocumentAccessDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<DocumentAccessDto>>> GetDocumentAccessList(
        Guid documentId,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var accessList = await _documentService.GetDocumentAccessListAsync(documentId, userId, cancellationToken);
        return Ok(accessList);
    }

    #endregion

    #region Version Control Endpoints

    /// <summary>
    /// Upload a new version of a document
    /// </summary>
    [HttpPost("{documentId:guid}/versions")]
    [ProducesResponseType(typeof(DocumentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [RequestSizeLimit(104857600)] // 100 MB
    public async Task<ActionResult<DocumentDto>> UploadNewVersion(
        Guid documentId,
        IFormFile file,
        [FromForm] string? changeDescription = null,
        CancellationToken cancellationToken = default)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { Message = "No file provided" });
        }

        try
        {
            var userId = GetCurrentUserId();
            var document = await _documentService.UploadNewVersionAsync(
                documentId, userId, file, changeDescription, cancellationToken);
            return Ok(document);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { Message = "Document not found" });
        }
    }

    /// <summary>
    /// Get all versions of a document
    /// </summary>
    [HttpGet("{documentId:guid}/versions")]
    [ProducesResponseType(typeof(List<DocumentVersionDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<DocumentVersionDto>>> GetDocumentVersions(
        Guid documentId,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var versions = await _documentService.GetDocumentVersionsAsync(documentId, userId, cancellationToken);
        return Ok(versions);
    }

    /// <summary>
    /// Download a specific version of a document
    /// </summary>
    [HttpGet("{documentId:guid}/versions/{versionId:guid}/download")]
    [ProducesResponseType(typeof(FileStreamResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DownloadVersion(
        Guid documentId,
        Guid versionId,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var result = await _documentService.DownloadVersionAsync(documentId, versionId, userId, cancellationToken);

        if (result == null)
        {
            return NotFound(new { Message = "Version not found or access denied" });
        }

        return File(result.Value.FileStream, result.Value.ContentType, result.Value.FileName);
    }

    /// <summary>
    /// Restore a previous version as the current version
    /// </summary>
    [HttpPost("{documentId:guid}/versions/{versionId:guid}/restore")]
    [ProducesResponseType(typeof(DocumentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DocumentDto>> RestoreVersion(
        Guid documentId,
        Guid versionId,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var document = await _documentService.RestoreVersionAsync(documentId, versionId, userId, cancellationToken);

        if (document == null)
        {
            return NotFound(new { Message = "Document or version not found" });
        }

        return Ok(document);
    }

    #endregion

    #region Utility Endpoints

    /// <summary>
    /// Search documents
    /// </summary>
    [HttpGet("search")]
    [ProducesResponseType(typeof(DocumentsResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<DocumentsResponse>> SearchDocuments(
        [FromQuery] string q,
        [FromQuery] DocumentFilter? filter = null,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var documents = await _documentService.SearchDocumentsAsync(userId, q, filter, cancellationToken);
        return Ok(documents);
    }

    /// <summary>
    /// Get documents for a specific conversation
    /// </summary>
    [HttpGet("conversation/{conversationId:guid}")]
    [ProducesResponseType(typeof(DocumentsResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<DocumentsResponse>> GetConversationDocuments(
        Guid conversationId,
        [FromQuery] DocumentFilter filter,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var documents = await _documentService.GetConversationDocumentsAsync(
            conversationId, userId, filter, cancellationToken);
        return Ok(documents);
    }

    /// <summary>
    /// Get storage statistics for the current user
    /// </summary>
    [HttpGet("stats")]
    [ProducesResponseType(typeof(StorageStatsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<StorageStatsDto>> GetStorageStats(
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var stats = await _documentService.GetUserStorageStatsAsync(userId, cancellationToken);
        return Ok(stats);
    }

    #endregion

    #region Helper Methods

    /// <summary>
    /// Get the current user's ID from JWT claims
    /// </summary>
    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;

        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("Invalid user token");
        }

        return userId;
    }

    #endregion
}
