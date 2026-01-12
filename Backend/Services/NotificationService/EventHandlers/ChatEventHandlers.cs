using EventBus.Abstractions;
using EventBus.Events;
using NotificationService.Models;
using NotificationService.Models.DTOs;
using NotificationService.Services;

namespace NotificationService.EventHandlers;

/// <summary>
/// Handles MessageSentEvent from ChatService
/// Creates notifications for message recipients
/// </summary>
public class MessageSentEventHandler : IIntegrationEventHandler<MessageSentEvent>
{
    private readonly INotificationService _notificationService;
    private readonly ILogger<MessageSentEventHandler> _logger;

    public MessageSentEventHandler(
        INotificationService notificationService,
        ILogger<MessageSentEventHandler> logger)
    {
        _notificationService = notificationService ?? throw new ArgumentNullException(nameof(notificationService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task HandleAsync(MessageSentEvent @event)
    {
        _logger.LogInformation("Handling MessageSentEvent: MessageId={MessageId}, ConversationId={ConversationId}",
            @event.MessageId, @event.ConversationId);

        try
        {
            // Create notifications for all recipients except the sender
            foreach (var recipientId in @event.RecipientIds.Where(id => id != @event.SenderId))
            {
                var request = new CreateNotificationRequest
                {
                    UserId = recipientId,
                    Type = NotificationTypes.NewMessage,
                    Title = @event.SenderName,
                    Body = TruncateMessage(@event.Content, 100),
                    IconUrl = @event.SenderAvatar,
                    ActionUrl = $"/conversations/{@event.ConversationId}",
                    Priority = NotificationPriority.Normal,
                    SourceUserId = @event.SenderId,
                    SourceConversationId = @event.ConversationId,
                    SourceMessageId = @event.MessageId,
                    Data = new Dictionary<string, object>
                    {
                        ["messageType"] = @event.MessageType,
                        ["senderName"] = @event.SenderName
                    }
                };

                await _notificationService.CreateNotificationAsync(request);
            }

            _logger.LogInformation("Created notifications for {Count} recipients for message {MessageId}",
                @event.RecipientIds.Count - 1, @event.MessageId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling MessageSentEvent for message {MessageId}", @event.MessageId);
            throw;
        }
    }

    private static string TruncateMessage(string message, int maxLength)
    {
        if (string.IsNullOrEmpty(message) || message.Length <= maxLength)
            return message;

        return message[..(maxLength - 3)] + "...";
    }
}

/// <summary>
/// Handles ConversationCreatedEvent from ChatService
/// Notifies participants about new conversation
/// </summary>
public class ConversationCreatedEventHandler : IIntegrationEventHandler<ConversationCreatedEvent>
{
    private readonly INotificationService _notificationService;
    private readonly ILogger<ConversationCreatedEventHandler> _logger;

    public ConversationCreatedEventHandler(
        INotificationService notificationService,
        ILogger<ConversationCreatedEventHandler> logger)
    {
        _notificationService = notificationService ?? throw new ArgumentNullException(nameof(notificationService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task HandleAsync(ConversationCreatedEvent @event)
    {
        _logger.LogInformation("Handling ConversationCreatedEvent: ConversationId={ConversationId}, Type={Type}",
            @event.ConversationId, @event.Type);

        try
        {
            // Notify all participants except the creator
            foreach (var participantId in @event.ParticipantIds.Where(id => id != @event.CreatedById))
            {
                var title = @event.Type == "group"
                    ? "Bạn được thêm vào nhóm mới"
                    : "Cuộc trò chuyện mới";

                var body = @event.Type == "group" && !string.IsNullOrEmpty(@event.Name)
                    ? $"Bạn đã được thêm vào nhóm \"{@event.Name}\""
                    : "Một cuộc trò chuyện mới đã được bắt đầu";

                var request = new CreateNotificationRequest
                {
                    UserId = participantId,
                    Type = NotificationTypes.ConversationInvite,
                    Title = title,
                    Body = body,
                    IconUrl = @event.AvatarUrl,
                    ActionUrl = $"/conversations/{@event.ConversationId}",
                    Priority = NotificationPriority.Normal,
                    SourceUserId = @event.CreatedById,
                    SourceConversationId = @event.ConversationId,
                    Data = new Dictionary<string, object>
                    {
                        ["conversationType"] = @event.Type,
                        ["conversationName"] = @event.Name ?? ""
                    }
                };

                await _notificationService.CreateNotificationAsync(request);
            }

            _logger.LogInformation("Created conversation invite notifications for {Count} participants",
                @event.ParticipantIds.Count - 1);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling ConversationCreatedEvent for conversation {ConversationId}",
                @event.ConversationId);
            throw;
        }
    }
}

/// <summary>
/// Handles ParticipantJoinedEvent from ChatService
/// Notifies other participants when someone joins
/// </summary>
public class ParticipantJoinedEventHandler : IIntegrationEventHandler<ParticipantJoinedEvent>
{
    private readonly INotificationService _notificationService;
    private readonly ILogger<ParticipantJoinedEventHandler> _logger;

    public ParticipantJoinedEventHandler(
        INotificationService notificationService,
        ILogger<ParticipantJoinedEventHandler> logger)
    {
        _notificationService = notificationService ?? throw new ArgumentNullException(nameof(notificationService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task HandleAsync(ParticipantJoinedEvent @event)
    {
        _logger.LogInformation("Handling ParticipantJoinedEvent: UserId={UserId}, ConversationId={ConversationId}",
            @event.UserId, @event.ConversationId);

        try
        {
            // Notify other participants
            foreach (var participantId in @event.OtherParticipantIds)
            {
                var request = new CreateNotificationRequest
                {
                    UserId = participantId,
                    Type = NotificationTypes.ParticipantJoined,
                    Title = "Thành viên mới",
                    Body = $"{@event.UserName} đã tham gia cuộc trò chuyện",
                    ActionUrl = $"/conversations/{@event.ConversationId}",
                    Priority = NotificationPriority.Low,
                    SourceUserId = @event.UserId,
                    SourceConversationId = @event.ConversationId,
                    Data = new Dictionary<string, object>
                    {
                        ["joinedUserName"] = @event.UserName,
                        ["role"] = @event.Role
                    }
                };

                await _notificationService.CreateNotificationAsync(request);
            }

            // Notify the user who was added
            var welcomeRequest = new CreateNotificationRequest
            {
                UserId = @event.UserId,
                Type = NotificationTypes.ConversationInvite,
                Title = "Bạn đã được thêm vào cuộc trò chuyện",
                Body = "Nhấn để xem cuộc trò chuyện",
                ActionUrl = $"/conversations/{@event.ConversationId}",
                Priority = NotificationPriority.Normal,
                SourceUserId = @event.AddedById,
                SourceConversationId = @event.ConversationId
            };

            await _notificationService.CreateNotificationAsync(welcomeRequest);

            _logger.LogInformation("Created participant joined notifications for conversation {ConversationId}",
                @event.ConversationId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling ParticipantJoinedEvent for user {UserId}", @event.UserId);
            throw;
        }
    }
}

/// <summary>
/// Handles ParticipantLeftEvent from ChatService
/// Notifies remaining participants when someone leaves
/// </summary>
public class ParticipantLeftEventHandler : IIntegrationEventHandler<ParticipantLeftEvent>
{
    private readonly INotificationService _notificationService;
    private readonly ILogger<ParticipantLeftEventHandler> _logger;

    public ParticipantLeftEventHandler(
        INotificationService notificationService,
        ILogger<ParticipantLeftEventHandler> logger)
    {
        _notificationService = notificationService ?? throw new ArgumentNullException(nameof(notificationService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task HandleAsync(ParticipantLeftEvent @event)
    {
        _logger.LogInformation("Handling ParticipantLeftEvent: UserId={UserId}, ConversationId={ConversationId}, Reason={Reason}",
            @event.UserId, @event.ConversationId, @event.Reason);

        try
        {
            var body = @event.Reason switch
            {
                "kicked" => $"{@event.UserName} đã bị xóa khỏi cuộc trò chuyện",
                "removed" => $"{@event.UserName} đã bị xóa khỏi cuộc trò chuyện",
                _ => $"{@event.UserName} đã rời khỏi cuộc trò chuyện"
            };

            // Notify remaining participants
            foreach (var participantId in @event.RemainingParticipantIds)
            {
                var request = new CreateNotificationRequest
                {
                    UserId = participantId,
                    Type = NotificationTypes.ParticipantLeft,
                    Title = "Thành viên rời nhóm",
                    Body = body,
                    ActionUrl = $"/conversations/{@event.ConversationId}",
                    Priority = NotificationPriority.Low,
                    SourceUserId = @event.UserId,
                    SourceConversationId = @event.ConversationId,
                    Data = new Dictionary<string, object>
                    {
                        ["leftUserName"] = @event.UserName,
                        ["reason"] = @event.Reason
                    }
                };

                await _notificationService.CreateNotificationAsync(request);
            }

            // If user was removed/kicked, notify them
            if (@event.Reason is "kicked" or "removed" && @event.RemovedById.HasValue)
            {
                var removedRequest = new CreateNotificationRequest
                {
                    UserId = @event.UserId,
                    Type = NotificationTypes.ConversationUpdate,
                    Title = "Bạn đã bị xóa khỏi cuộc trò chuyện",
                    Body = "Bạn không còn là thành viên của cuộc trò chuyện này",
                    Priority = NotificationPriority.High,
                    SourceUserId = @event.RemovedById,
                    SourceConversationId = @event.ConversationId
                };

                await _notificationService.CreateNotificationAsync(removedRequest);
            }

            _logger.LogInformation("Created participant left notifications for conversation {ConversationId}",
                @event.ConversationId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling ParticipantLeftEvent for user {UserId}", @event.UserId);
            throw;
        }
    }
}

/// <summary>
/// Handles UserOnlineEvent from ChatService
/// Can be used for presence notifications if enabled
/// </summary>
public class UserOnlineEventHandler : IIntegrationEventHandler<UserOnlineEvent>
{
    private readonly ILogger<UserOnlineEventHandler> _logger;

    public UserOnlineEventHandler(ILogger<UserOnlineEventHandler> logger)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public Task HandleAsync(UserOnlineEvent @event)
    {
        // Just log for now - presence notifications are typically handled differently
        _logger.LogDebug("User {UserId} ({UserName}) came online", @event.UserId, @event.UserName);
        return Task.CompletedTask;
    }
}

/// <summary>
/// Handles UserOfflineEvent from ChatService
/// Can be used for presence notifications if enabled
/// </summary>
public class UserOfflineEventHandler : IIntegrationEventHandler<UserOfflineEvent>
{
    private readonly ILogger<UserOfflineEventHandler> _logger;

    public UserOfflineEventHandler(ILogger<UserOfflineEventHandler> logger)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public Task HandleAsync(UserOfflineEvent @event)
    {
        // Just log for now - presence notifications are typically handled differently
        _logger.LogDebug("User {UserId} ({UserName}) went offline. Last seen: {LastSeen}",
            @event.UserId, @event.UserName, @event.LastSeen);
        return Task.CompletedTask;
    }
}
