using System.Text.Json.Serialization;

namespace EventBus.Events
{
    #region Document Events

    /// <summary>
    /// Event raised when a document is uploaded
    /// </summary>
    public class DocumentUploadedEvent : IntegrationEvent
    {
        [JsonPropertyName("documentId")]
        public Guid DocumentId { get; set; }

        [JsonPropertyName("fileName")]
        public string FileName { get; set; } = string.Empty;

        [JsonPropertyName("fileSize")]
        public long FileSize { get; set; }

        [JsonPropertyName("contentType")]
        public string ContentType { get; set; } = string.Empty;

        [JsonPropertyName("uploadedById")]
        public Guid UploadedById { get; set; }

        [JsonPropertyName("uploadedByName")]
        public string UploadedByName { get; set; } = string.Empty;

        [JsonPropertyName("conversationId")]
        public Guid? ConversationId { get; set; }

        [JsonPropertyName("recipientIds")]
        public List<Guid> RecipientIds { get; set; } = new();

        [JsonPropertyName("uploadedAt")]
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

        public DocumentUploadedEvent() : base()
        {
            Source = "DocumentService";
        }

        public override string GetRoutingKey() => "document.uploaded";
    }

    /// <summary>
    /// Event raised when a document is shared with users
    /// </summary>
    public class DocumentSharedEvent : IntegrationEvent
    {
        [JsonPropertyName("documentId")]
        public Guid DocumentId { get; set; }

        [JsonPropertyName("fileName")]
        public string FileName { get; set; } = string.Empty;

        [JsonPropertyName("sharedById")]
        public Guid SharedById { get; set; }

        [JsonPropertyName("sharedByName")]
        public string SharedByName { get; set; } = string.Empty;

        [JsonPropertyName("sharedWithUserIds")]
        public List<Guid> SharedWithUserIds { get; set; } = new();

        [JsonPropertyName("conversationId")]
        public Guid? ConversationId { get; set; }

        [JsonPropertyName("permission")]
        public string Permission { get; set; } = "view"; // "view", "edit", "admin"

        [JsonPropertyName("sharedAt")]
        public DateTime SharedAt { get; set; } = DateTime.UtcNow;

        public DocumentSharedEvent() : base()
        {
            Source = "DocumentService";
        }

        public override string GetRoutingKey() => "document.shared";
    }

    /// <summary>
    /// Event raised when a document is deleted
    /// </summary>
    public class DocumentDeletedEvent : IntegrationEvent
    {
        [JsonPropertyName("documentId")]
        public Guid DocumentId { get; set; }

        [JsonPropertyName("fileName")]
        public string FileName { get; set; } = string.Empty;

        [JsonPropertyName("deletedById")]
        public Guid DeletedById { get; set; }

        [JsonPropertyName("deletedByName")]
        public string DeletedByName { get; set; } = string.Empty;

        [JsonPropertyName("conversationId")]
        public Guid? ConversationId { get; set; }

        [JsonPropertyName("affectedUserIds")]
        public List<Guid> AffectedUserIds { get; set; } = new();

        [JsonPropertyName("deletedAt")]
        public DateTime DeletedAt { get; set; } = DateTime.UtcNow;

        public DocumentDeletedEvent() : base()
        {
            Source = "DocumentService";
        }

        public override string GetRoutingKey() => "document.deleted";
    }

    /// <summary>
    /// Event raised when a document is updated (renamed, moved, etc.)
    /// </summary>
    public class DocumentUpdatedEvent : IntegrationEvent
    {
        [JsonPropertyName("documentId")]
        public Guid DocumentId { get; set; }

        [JsonPropertyName("fileName")]
        public string FileName { get; set; } = string.Empty;

        [JsonPropertyName("previousFileName")]
        public string? PreviousFileName { get; set; }

        [JsonPropertyName("updatedById")]
        public Guid UpdatedById { get; set; }

        [JsonPropertyName("updatedByName")]
        public string UpdatedByName { get; set; } = string.Empty;

        [JsonPropertyName("updateType")]
        public string UpdateType { get; set; } = "modified"; // "renamed", "moved", "modified"

        [JsonPropertyName("affectedUserIds")]
        public List<Guid> AffectedUserIds { get; set; } = new();

        [JsonPropertyName("updatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public DocumentUpdatedEvent() : base()
        {
            Source = "DocumentService";
        }

        public override string GetRoutingKey() => "document.updated";
    }

    /// <summary>
    /// Event raised when a new version of a document is uploaded
    /// </summary>
    public class DocumentVersionCreatedEvent : IntegrationEvent
    {
        [JsonPropertyName("documentId")]
        public Guid DocumentId { get; set; }

        [JsonPropertyName("versionId")]
        public Guid VersionId { get; set; }

        [JsonPropertyName("fileName")]
        public string FileName { get; set; } = string.Empty;

        [JsonPropertyName("versionNumber")]
        public int VersionNumber { get; set; }

        [JsonPropertyName("fileSize")]
        public long FileSize { get; set; }

        [JsonPropertyName("createdById")]
        public Guid CreatedById { get; set; }

        [JsonPropertyName("createdByName")]
        public string CreatedByName { get; set; } = string.Empty;

        [JsonPropertyName("comment")]
        public string? Comment { get; set; }

        [JsonPropertyName("affectedUserIds")]
        public List<Guid> AffectedUserIds { get; set; } = new();

        [JsonPropertyName("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DocumentVersionCreatedEvent() : base()
        {
            Source = "DocumentService";
        }

        public override string GetRoutingKey() => "document.version.created";
    }

    /// <summary>
    /// Event raised when a document is downloaded
    /// </summary>
    public class DocumentDownloadedEvent : IntegrationEvent
    {
        [JsonPropertyName("documentId")]
        public Guid DocumentId { get; set; }

        [JsonPropertyName("fileName")]
        public string FileName { get; set; } = string.Empty;

        [JsonPropertyName("downloadedById")]
        public Guid DownloadedById { get; set; }

        [JsonPropertyName("downloadedByName")]
        public string DownloadedByName { get; set; } = string.Empty;

        [JsonPropertyName("versionId")]
        public Guid? VersionId { get; set; }

        [JsonPropertyName("downloadedAt")]
        public DateTime DownloadedAt { get; set; } = DateTime.UtcNow;

        public DocumentDownloadedEvent() : base()
        {
            Source = "DocumentService";
        }

        public override string GetRoutingKey() => "document.downloaded";
    }

    /// <summary>
    /// Event raised when document permissions are changed
    /// </summary>
    public class DocumentPermissionChangedEvent : IntegrationEvent
    {
        [JsonPropertyName("documentId")]
        public Guid DocumentId { get; set; }

        [JsonPropertyName("fileName")]
        public string FileName { get; set; } = string.Empty;

        [JsonPropertyName("changedById")]
        public Guid ChangedById { get; set; }

        [JsonPropertyName("changedByName")]
        public string ChangedByName { get; set; } = string.Empty;

        [JsonPropertyName("userId")]
        public Guid UserId { get; set; }

        [JsonPropertyName("previousPermission")]
        public string? PreviousPermission { get; set; }

        [JsonPropertyName("newPermission")]
        public string NewPermission { get; set; } = string.Empty; // "view", "edit", "admin", "revoked"

        [JsonPropertyName("changedAt")]
        public DateTime ChangedAt { get; set; } = DateTime.UtcNow;

        public DocumentPermissionChangedEvent() : base()
        {
            Source = "DocumentService";
        }

        public override string GetRoutingKey() => "document.permission.changed";
    }

    #endregion

    #region Auth/User Events

    /// <summary>
    /// Event raised when a new user is registered
    /// </summary>
    public class UserRegisteredEvent : IntegrationEvent
    {
        [JsonPropertyName("userId")]
        public Guid UserId { get; set; }

        [JsonPropertyName("userName")]
        public string UserName { get; set; } = string.Empty;

        [JsonPropertyName("email")]
        public string Email { get; set; } = string.Empty;

        [JsonPropertyName("displayName")]
        public string DisplayName { get; set; } = string.Empty;

        [JsonPropertyName("avatarUrl")]
        public string? AvatarUrl { get; set; }

        [JsonPropertyName("registeredAt")]
        public DateTime RegisteredAt { get; set; } = DateTime.UtcNow;

        public UserRegisteredEvent() : base()
        {
            Source = "AuthService";
        }

        public override string GetRoutingKey() => "user.registered";
    }

    /// <summary>
    /// Event raised when a user profile is updated
    /// </summary>
    public class UserProfileUpdatedEvent : IntegrationEvent
    {
        [JsonPropertyName("userId")]
        public Guid UserId { get; set; }

        [JsonPropertyName("userName")]
        public string UserName { get; set; } = string.Empty;

        [JsonPropertyName("displayName")]
        public string DisplayName { get; set; } = string.Empty;

        [JsonPropertyName("avatarUrl")]
        public string? AvatarUrl { get; set; }

        [JsonPropertyName("updatedFields")]
        public List<string> UpdatedFields { get; set; } = new();

        [JsonPropertyName("updatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public UserProfileUpdatedEvent() : base()
        {
            Source = "AuthService";
        }

        public override string GetRoutingKey() => "user.profile.updated";
    }

    /// <summary>
    /// Event raised when a user is deactivated/deleted
    /// </summary>
    public class UserDeactivatedEvent : IntegrationEvent
    {
        [JsonPropertyName("userId")]
        public Guid UserId { get; set; }

        [JsonPropertyName("userName")]
        public string UserName { get; set; } = string.Empty;

        [JsonPropertyName("reason")]
        public string? Reason { get; set; }

        [JsonPropertyName("deactivatedAt")]
        public DateTime DeactivatedAt { get; set; } = DateTime.UtcNow;

        public UserDeactivatedEvent() : base()
        {
            Source = "AuthService";
        }

        public override string GetRoutingKey() => "user.deactivated";
    }

    #endregion
}
