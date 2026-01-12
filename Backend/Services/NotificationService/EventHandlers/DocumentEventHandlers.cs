using EventBus.Abstractions;
using EventBus.Events;
using NotificationService.Models;
using NotificationService.Models.DTOs;
using NotificationService.Services;

namespace NotificationService.EventHandlers;

/// <summary>
/// Handles DocumentUploadedEvent from DocumentService
/// Creates notifications for users when documents are uploaded to shared conversations
/// </summary>
public class DocumentUploadedEventHandler : IIntegrationEventHandler<DocumentUploadedEvent>
{
    private readonly INotificationService _notificationService;
    private readonly ILogger<DocumentUploadedEventHandler> _logger;

    public DocumentUploadedEventHandler(
        INotificationService notificationService,
        ILogger<DocumentUploadedEventHandler> logger)
    {
        _notificationService = notificationService ?? throw new ArgumentNullException(nameof(notificationService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task HandleAsync(DocumentUploadedEvent @event)
    {
        _logger.LogInformation("Handling DocumentUploadedEvent: DocumentId={DocumentId}, FileName={FileName}",
            @event.DocumentId, @event.FileName);

        try
        {
            // Create notifications for all recipients except the uploader
            foreach (var recipientId in @event.RecipientIds.Where(id => id != @event.UploadedById))
            {
                var request = new CreateNotificationRequest
                {
                    UserId = recipientId,
                    Type = NotificationTypes.DocumentUploaded,
                    Title = "Tài liệu mới",
                    Body = $"{@event.UploadedByName} đã tải lên \"{@event.FileName}\"",
                    ActionUrl = @event.ConversationId.HasValue
                        ? $"/conversations/{@event.ConversationId}?document={@event.DocumentId}"
                        : $"/documents/{@event.DocumentId}",
                    Priority = NotificationPriority.Normal,
                    SourceUserId = @event.UploadedById,
                    SourceConversationId = @event.ConversationId,
                    SourceDocumentId = @event.DocumentId,
                    Data = new Dictionary<string, object>
                    {
                        ["fileName"] = @event.FileName,
                        ["fileSize"] = @event.FileSize,
                        ["contentType"] = @event.ContentType,
                        ["uploaderName"] = @event.UploadedByName
                    }
                };

                await _notificationService.CreateNotificationAsync(request);
            }

            _logger.LogInformation("Created upload notifications for {Count} recipients for document {DocumentId}",
                @event.RecipientIds.Count - 1, @event.DocumentId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling DocumentUploadedEvent for document {DocumentId}", @event.DocumentId);
            throw;
        }
    }
}

/// <summary>
/// Handles DocumentSharedEvent from DocumentService
/// Creates notifications when documents are shared with users
/// </summary>
public class DocumentSharedEventHandler : IIntegrationEventHandler<DocumentSharedEvent>
{
    private readonly INotificationService _notificationService;
    private readonly ILogger<DocumentSharedEventHandler> _logger;

    public DocumentSharedEventHandler(
        INotificationService notificationService,
        ILogger<DocumentSharedEventHandler> logger)
    {
        _notificationService = notificationService ?? throw new ArgumentNullException(nameof(notificationService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task HandleAsync(DocumentSharedEvent @event)
    {
        _logger.LogInformation("Handling DocumentSharedEvent: DocumentId={DocumentId}, SharedWith={Count} users",
            @event.DocumentId, @event.SharedWithUserIds.Count);

        try
        {
            var permissionText = @event.Permission switch
            {
                "edit" => "chỉnh sửa",
                "admin" => "quản trị",
                _ => "xem"
            };

            foreach (var userId in @event.SharedWithUserIds)
            {
                var request = new CreateNotificationRequest
                {
                    UserId = userId,
                    Type = NotificationTypes.DocumentShared,
                    Title = "Tài liệu được chia sẻ",
                    Body = $"{@event.SharedByName} đã chia sẻ \"{@event.FileName}\" với bạn (quyền {permissionText})",
                    ActionUrl = $"/documents/{@event.DocumentId}",
                    Priority = NotificationPriority.Normal,
                    SourceUserId = @event.SharedById,
                    SourceConversationId = @event.ConversationId,
                    SourceDocumentId = @event.DocumentId,
                    Data = new Dictionary<string, object>
                    {
                        ["fileName"] = @event.FileName,
                        ["permission"] = @event.Permission,
                        ["sharedByName"] = @event.SharedByName
                    }
                };

                await _notificationService.CreateNotificationAsync(request);
            }

            _logger.LogInformation("Created share notifications for {Count} users for document {DocumentId}",
                @event.SharedWithUserIds.Count, @event.DocumentId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling DocumentSharedEvent for document {DocumentId}", @event.DocumentId);
            throw;
        }
    }
}

/// <summary>
/// Handles DocumentDeletedEvent from DocumentService
/// Creates notifications when documents are deleted
/// </summary>
public class DocumentDeletedEventHandler : IIntegrationEventHandler<DocumentDeletedEvent>
{
    private readonly INotificationService _notificationService;
    private readonly ILogger<DocumentDeletedEventHandler> _logger;

    public DocumentDeletedEventHandler(
        INotificationService notificationService,
        ILogger<DocumentDeletedEventHandler> logger)
    {
        _notificationService = notificationService ?? throw new ArgumentNullException(nameof(notificationService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task HandleAsync(DocumentDeletedEvent @event)
    {
        _logger.LogInformation("Handling DocumentDeletedEvent: DocumentId={DocumentId}, FileName={FileName}",
            @event.DocumentId, @event.FileName);

        try
        {
            // Notify affected users about the deletion
            foreach (var userId in @event.AffectedUserIds.Where(id => id != @event.DeletedById))
            {
                var request = new CreateNotificationRequest
                {
                    UserId = userId,
                    Type = NotificationTypes.DocumentShared, // Reuse type for document-related notifications
                    Title = "Tài liệu đã bị xóa",
                    Body = $"{@event.DeletedByName} đã xóa tài liệu \"{@event.FileName}\"",
                    Priority = NotificationPriority.Low,
                    SourceUserId = @event.DeletedById,
                    SourceConversationId = @event.ConversationId,
                    Data = new Dictionary<string, object>
                    {
                        ["fileName"] = @event.FileName,
                        ["deletedByName"] = @event.DeletedByName,
                        ["documentId"] = @event.DocumentId.ToString()
                    }
                };

                await _notificationService.CreateNotificationAsync(request);
            }

            _logger.LogInformation("Created deletion notifications for {Count} users for document {DocumentId}",
                @event.AffectedUserIds.Count - 1, @event.DocumentId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling DocumentDeletedEvent for document {DocumentId}", @event.DocumentId);
            throw;
        }
    }
}

/// <summary>
/// Handles DocumentVersionCreatedEvent from DocumentService
/// Creates notifications when new versions of documents are uploaded
/// </summary>
public class DocumentVersionCreatedEventHandler : IIntegrationEventHandler<DocumentVersionCreatedEvent>
{
    private readonly INotificationService _notificationService;
    private readonly ILogger<DocumentVersionCreatedEventHandler> _logger;

    public DocumentVersionCreatedEventHandler(
        INotificationService notificationService,
        ILogger<DocumentVersionCreatedEventHandler> logger)
    {
        _notificationService = notificationService ?? throw new ArgumentNullException(nameof(notificationService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task HandleAsync(DocumentVersionCreatedEvent @event)
    {
        _logger.LogInformation("Handling DocumentVersionCreatedEvent: DocumentId={DocumentId}, Version={Version}",
            @event.DocumentId, @event.VersionNumber);

        try
        {
            foreach (var userId in @event.AffectedUserIds.Where(id => id != @event.CreatedById))
            {
                var body = string.IsNullOrEmpty(@event.Comment)
                    ? $"{@event.CreatedByName} đã tải lên phiên bản {@event.VersionNumber} của \"{@event.FileName}\""
                    : $"{@event.CreatedByName} đã cập nhật \"{@event.FileName}\": {@event.Comment}";

                var request = new CreateNotificationRequest
                {
                    UserId = userId,
                    Type = NotificationTypes.DocumentUploaded,
                    Title = "Phiên bản mới",
                    Body = body,
                    ActionUrl = $"/documents/{@event.DocumentId}?version={@event.VersionId}",
                    Priority = NotificationPriority.Normal,
                    SourceUserId = @event.CreatedById,
                    SourceDocumentId = @event.DocumentId,
                    Data = new Dictionary<string, object>
                    {
                        ["fileName"] = @event.FileName,
                        ["versionNumber"] = @event.VersionNumber,
                        ["versionId"] = @event.VersionId.ToString(),
                        ["createdByName"] = @event.CreatedByName
                    }
                };

                await _notificationService.CreateNotificationAsync(request);
            }

            _logger.LogInformation("Created version notifications for {Count} users for document {DocumentId}",
                @event.AffectedUserIds.Count - 1, @event.DocumentId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling DocumentVersionCreatedEvent for document {DocumentId}", @event.DocumentId);
            throw;
        }
    }
}

/// <summary>
/// Handles DocumentPermissionChangedEvent from DocumentService
/// Creates notifications when document permissions are changed
/// </summary>
public class DocumentPermissionChangedEventHandler : IIntegrationEventHandler<DocumentPermissionChangedEvent>
{
    private readonly INotificationService _notificationService;
    private readonly ILogger<DocumentPermissionChangedEventHandler> _logger;

    public DocumentPermissionChangedEventHandler(
        INotificationService notificationService,
        ILogger<DocumentPermissionChangedEventHandler> logger)
    {
        _notificationService = notificationService ?? throw new ArgumentNullException(nameof(notificationService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task HandleAsync(DocumentPermissionChangedEvent @event)
    {
        _logger.LogInformation("Handling DocumentPermissionChangedEvent: DocumentId={DocumentId}, UserId={UserId}, Permission={Permission}",
            @event.DocumentId, @event.UserId, @event.NewPermission);

        try
        {
            string title;
            string body;
            var priority = NotificationPriority.Normal;

            if (@event.NewPermission == "revoked")
            {
                title = "Quyền truy cập bị thu hồi";
                body = $"{@event.ChangedByName} đã thu hồi quyền truy cập của bạn vào \"{@event.FileName}\"";
                priority = NotificationPriority.High;
            }
            else
            {
                var permissionText = @event.NewPermission switch
                {
                    "edit" => "chỉnh sửa",
                    "admin" => "quản trị",
                    _ => "xem"
                };

                title = "Quyền truy cập đã thay đổi";
                body = $"{@event.ChangedByName} đã thay đổi quyền của bạn thành \"{permissionText}\" cho \"{@event.FileName}\"";
            }

            var request = new CreateNotificationRequest
            {
                UserId = @event.UserId,
                Type = NotificationTypes.DocumentShared,
                Title = title,
                Body = body,
                ActionUrl = @event.NewPermission != "revoked" ? $"/documents/{@event.DocumentId}" : null,
                Priority = priority,
                SourceUserId = @event.ChangedById,
                SourceDocumentId = @event.DocumentId,
                Data = new Dictionary<string, object>
                {
                    ["fileName"] = @event.FileName,
                    ["previousPermission"] = @event.PreviousPermission ?? "none",
                    ["newPermission"] = @event.NewPermission,
                    ["changedByName"] = @event.ChangedByName
                }
            };

            await _notificationService.CreateNotificationAsync(request);

            _logger.LogInformation("Created permission change notification for user {UserId} for document {DocumentId}",
                @event.UserId, @event.DocumentId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling DocumentPermissionChangedEvent for document {DocumentId}", @event.DocumentId);
            throw;
        }
    }
}

/// <summary>
/// Handles UserRegisteredEvent from AuthService
/// Can be used to send welcome notifications
/// </summary>
public class UserRegisteredEventHandler : IIntegrationEventHandler<UserRegisteredEvent>
{
    private readonly INotificationService _notificationService;
    private readonly ILogger<UserRegisteredEventHandler> _logger;

    public UserRegisteredEventHandler(
        INotificationService notificationService,
        ILogger<UserRegisteredEventHandler> logger)
    {
        _notificationService = notificationService ?? throw new ArgumentNullException(nameof(notificationService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task HandleAsync(UserRegisteredEvent @event)
    {
        _logger.LogInformation("Handling UserRegisteredEvent: UserId={UserId}, UserName={UserName}",
            @event.UserId, @event.UserName);

        try
        {
            // Create welcome notification for new user
            var request = new CreateNotificationRequest
            {
                UserId = @event.UserId,
                Type = NotificationTypes.SystemUpdate,
                Title = "Chào mừng bạn!",
                Body = $"Xin chào {@event.DisplayName}! Chào mừng bạn đến với hệ thống. Hãy bắt đầu bằng cách cập nhật hồ sơ của bạn.",
                ActionUrl = "/profile",
                Priority = NotificationPriority.Normal,
                Data = new Dictionary<string, object>
                {
                    ["userName"] = @event.UserName,
                    ["displayName"] = @event.DisplayName,
                    ["welcomeMessage"] = true
                }
            };

            await _notificationService.CreateNotificationAsync(request);

            _logger.LogInformation("Created welcome notification for new user {UserId}", @event.UserId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling UserRegisteredEvent for user {UserId}", @event.UserId);
            throw;
        }
    }
}
