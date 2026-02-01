using System.Text.Json.Serialization;

namespace EventBus.Events
{
    #region Message Events

    /// <summary>
    /// Event raised when a new message is sent in a conversation
    /// </summary>
    public class MessageSentEvent : IntegrationEvent
    {
        [JsonPropertyName("messageId")]
        public Guid MessageId { get; set; }

        [JsonPropertyName("conversationId")]
        public Guid ConversationId { get; set; }

        [JsonPropertyName("senderId")]
        public Guid SenderId { get; set; }

        [JsonPropertyName("senderName")]
        public string SenderName { get; set; } = string.Empty;

        [JsonPropertyName("senderAvatar")]
        public string? SenderAvatar { get; set; }

        [JsonPropertyName("content")]
        public string Content { get; set; } = string.Empty;

        [JsonPropertyName("messageType")]
        public int MessageType { get; set; }

        [JsonPropertyName("attachmentId")]
        public Guid? AttachmentId { get; set; }

        [JsonPropertyName("recipientIds")]
        public List<Guid> RecipientIds { get; set; } = new();

        [JsonPropertyName("timestamp")]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        public MessageSentEvent() : base()
        {
            Source = "ChatService";
        }

        public override string GetRoutingKey() => "chat.message.sent";
    }

    /// <summary>
    /// Event raised when a message is edited
    /// </summary>
    public class MessageEditedEvent : IntegrationEvent
    {
        [JsonPropertyName("messageId")]
        public Guid MessageId { get; set; }

        [JsonPropertyName("conversationId")]
        public Guid ConversationId { get; set; }

        [JsonPropertyName("editorId")]
        public Guid EditorId { get; set; }

        [JsonPropertyName("newContent")]
        public string NewContent { get; set; } = string.Empty;

        [JsonPropertyName("editedAt")]
        public DateTime EditedAt { get; set; } = DateTime.UtcNow;

        public MessageEditedEvent() : base()
        {
            Source = "ChatService";
        }

        public override string GetRoutingKey() => "chat.message.edited";
    }

    /// <summary>
    /// Event raised when a message is deleted
    /// </summary>
    public class MessageDeletedEvent : IntegrationEvent
    {
        [JsonPropertyName("messageId")]
        public Guid MessageId { get; set; }

        [JsonPropertyName("conversationId")]
        public Guid ConversationId { get; set; }

        [JsonPropertyName("deletedById")]
        public Guid DeletedById { get; set; }

        [JsonPropertyName("deleteForEveryone")]
        public bool DeleteForEveryone { get; set; }

        [JsonPropertyName("deletedAt")]
        public DateTime DeletedAt { get; set; } = DateTime.UtcNow;

        public MessageDeletedEvent() : base()
        {
            Source = "ChatService";
        }

        public override string GetRoutingKey() => "chat.message.deleted";
    }

    /// <summary>
    /// Event raised when messages are marked as read
    /// </summary>
    public class MessagesReadEvent : IntegrationEvent
    {
        [JsonPropertyName("conversationId")]
        public Guid ConversationId { get; set; }

        [JsonPropertyName("userId")]
        public Guid UserId { get; set; }

        [JsonPropertyName("readCount")]
        public int ReadCount { get; set; }

        [JsonPropertyName("readAt")]
        public DateTime ReadAt { get; set; } = DateTime.UtcNow;

        public MessagesReadEvent() : base()
        {
            Source = "ChatService";
        }

        public override string GetRoutingKey() => "chat.messages.read";
    }

    #endregion

    #region Conversation Events

    /// <summary>
    /// Event raised when a new conversation is created
    /// </summary>
    public class ConversationCreatedEvent : IntegrationEvent
    {
        [JsonPropertyName("conversationId")]
        public Guid ConversationId { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("type")]
        public string Type { get; set; } = "private"; // "private" or "group"

        [JsonPropertyName("createdById")]
        public Guid CreatedById { get; set; }

        [JsonPropertyName("participantIds")]
        public List<Guid> ParticipantIds { get; set; } = new();

        [JsonPropertyName("avatarUrl")]
        public string? AvatarUrl { get; set; }

        public ConversationCreatedEvent() : base()
        {
            Source = "ChatService";
        }

        public override string GetRoutingKey() => "chat.conversation.created";
    }

    /// <summary>
    /// Event raised when a conversation is updated
    /// </summary>
    public class ConversationUpdatedEvent : IntegrationEvent
    {
        [JsonPropertyName("conversationId")]
        public Guid ConversationId { get; set; }

        [JsonPropertyName("name")]
        public string? Name { get; set; }

        [JsonPropertyName("avatarUrl")]
        public string? AvatarUrl { get; set; }

        [JsonPropertyName("updatedById")]
        public Guid UpdatedById { get; set; }

        [JsonPropertyName("participantIds")]
        public List<Guid> ParticipantIds { get; set; } = new();

        public ConversationUpdatedEvent() : base()
        {
            Source = "ChatService";
        }

        public override string GetRoutingKey() => "chat.conversation.updated";
    }

    /// <summary>
    /// Event raised when a conversation is deleted
    /// </summary>
    public class ConversationDeletedEvent : IntegrationEvent
    {
        [JsonPropertyName("conversationId")]
        public Guid ConversationId { get; set; }

        [JsonPropertyName("deletedById")]
        public Guid DeletedById { get; set; }

        [JsonPropertyName("participantIds")]
        public List<Guid> ParticipantIds { get; set; } = new();

        public ConversationDeletedEvent() : base()
        {
            Source = "ChatService";
        }

        public override string GetRoutingKey() => "chat.conversation.deleted";
    }

    #endregion

    #region Participant Events

    /// <summary>
    /// Event raised when a user joins a conversation
    /// </summary>
    public class ParticipantJoinedEvent : IntegrationEvent
    {
        [JsonPropertyName("conversationId")]
        public Guid ConversationId { get; set; }

        [JsonPropertyName("userId")]
        public Guid UserId { get; set; }

        [JsonPropertyName("userName")]
        public string UserName { get; set; } = string.Empty;

        [JsonPropertyName("addedById")]
        public Guid AddedById { get; set; }

        [JsonPropertyName("role")]
        public string Role { get; set; } = "member";

        [JsonPropertyName("otherParticipantIds")]
        public List<Guid> OtherParticipantIds { get; set; } = new();

        public ParticipantJoinedEvent() : base()
        {
            Source = "ChatService";
        }

        public override string GetRoutingKey() => "chat.participant.joined";
    }

    /// <summary>
    /// Event raised when a user leaves a conversation
    /// </summary>
    public class ParticipantLeftEvent : IntegrationEvent
    {
        [JsonPropertyName("conversationId")]
        public Guid ConversationId { get; set; }

        [JsonPropertyName("userId")]
        public Guid UserId { get; set; }

        [JsonPropertyName("userName")]
        public string UserName { get; set; } = string.Empty;

        [JsonPropertyName("reason")]
        public string Reason { get; set; } = "left"; // "left", "removed", "kicked"

        [JsonPropertyName("removedById")]
        public Guid? RemovedById { get; set; }

        [JsonPropertyName("remainingParticipantIds")]
        public List<Guid> RemainingParticipantIds { get; set; } = new();

        public ParticipantLeftEvent() : base()
        {
            Source = "ChatService";
        }

        public override string GetRoutingKey() => "chat.participant.left";
    }

    #endregion

    #region Typing Events

    /// <summary>
    /// Event raised when a user starts or stops typing
    /// </summary>
    public class UserTypingEvent : IntegrationEvent
    {
        [JsonPropertyName("conversationId")]
        public Guid ConversationId { get; set; }

        [JsonPropertyName("userId")]
        public Guid UserId { get; set; }

        [JsonPropertyName("userName")]
        public string UserName { get; set; } = string.Empty;

        [JsonPropertyName("isTyping")]
        public bool IsTyping { get; set; }

        [JsonPropertyName("recipientIds")]
        public List<Guid> RecipientIds { get; set; } = new();

        public UserTypingEvent() : base()
        {
            Source = "ChatService";
        }

        public override string GetRoutingKey() => "chat.user.typing";
    }

    #endregion

    #region Presence Events

    /// <summary>
    /// Event raised when a user comes online
    /// </summary>
    public class UserOnlineEvent : IntegrationEvent
    {
        [JsonPropertyName("userId")]
        public Guid UserId { get; set; }

        [JsonPropertyName("userName")]
        public string UserName { get; set; } = string.Empty;

        [JsonPropertyName("connectionId")]
        public string? ConnectionId { get; set; }

        [JsonPropertyName("connectedAt")]
        public DateTime ConnectedAt { get; set; } = DateTime.UtcNow;

        public UserOnlineEvent() : base()
        {
            Source = "ChatService";
        }

        public override string GetRoutingKey() => "chat.user.online";
    }

    /// <summary>
    /// Event raised when a user goes offline
    /// </summary>
    public class UserOfflineEvent : IntegrationEvent
    {
        [JsonPropertyName("userId")]
        public Guid UserId { get; set; }

        [JsonPropertyName("userName")]
        public string UserName { get; set; } = string.Empty;

        [JsonPropertyName("lastSeen")]
        public DateTime LastSeen { get; set; } = DateTime.UtcNow;

        public UserOfflineEvent() : base()
        {
            Source = "ChatService";
        }

        public override string GetRoutingKey() => "chat.user.offline";
    }

    #endregion
}
