using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using ChatService.Data;
using ChatService.Models;
using ChatService.Models.DTOs;
using ChatService.Hubs;
using EventBus.Abstractions;
using EventBus.Events;
using System.Text.Json;

namespace ChatService.Services;

/// <summary>
/// Implementation of Chat Service
/// Handles all chat-related business logic
/// </summary>
public class ChatServiceImpl : IChatService
{
    private readonly ChatDbContext _context;
    private readonly IHubContext<ChatHub> _hubContext;
    private readonly ILogger<ChatServiceImpl> _logger;
    private readonly IEventBus _eventBus;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;

    public ChatServiceImpl(
        ChatDbContext context,
        IHubContext<ChatHub> hubContext,
        ILogger<ChatServiceImpl> logger,
        IEventBus eventBus,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _hubContext = hubContext ?? throw new ArgumentNullException(nameof(hubContext));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _eventBus = eventBus ?? throw new ArgumentNullException(nameof(eventBus));
        _httpClientFactory = httpClientFactory ?? throw new ArgumentNullException(nameof(httpClientFactory));
        _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
    }

    #region Conversation Operations

    public async Task<ConversationsResponse> GetUserConversationsAsync(
        Guid userId,
        ConversationFilter filter,
        CancellationToken cancellationToken = default)
    {
        var query = _context.ConversationParticipants
            .Where(cp => cp.UserId == userId && cp.IsActive)
            .Include(cp => cp.Conversation)
                .ThenInclude(c => c.Participants.Where(p => p.IsActive))
            .Select(cp => cp.Conversation)
            .Where(c => c.IsActive);

        // Apply filters
        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            query = query.Where(c =>
                (c.Name != null && c.Name.Contains(filter.SearchTerm)) ||
                (c.LastMessagePreview != null && c.LastMessagePreview.Contains(filter.SearchTerm)));
        }

        if (!string.IsNullOrWhiteSpace(filter.Type))
        {
            query = query.Where(c => c.Type == filter.Type);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var conversations = await query
            .OrderByDescending(c => c.LastMessageAt ?? c.CreatedAt)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync(cancellationToken);

        var conversationDtos = new List<ConversationDto>();

        foreach (var conv in conversations)
        {
            var participant = await _context.ConversationParticipants
                .FirstOrDefaultAsync(cp => cp.ConversationId == conv.Id && cp.UserId == userId, cancellationToken);

            conversationDtos.Add(await MapToConversationDtoAsync(conv, participant, cancellationToken));
        }

        var totalPages = (int)Math.Ceiling(totalCount / (double)filter.PageSize);

        return new ConversationsResponse
        {
            Items = conversationDtos,
            TotalCount = totalCount,
            PageNumber = filter.Page,
            PageSize = filter.PageSize,
            TotalPages = totalPages,
            HasPreviousPage = filter.Page > 1,
            HasNextPage = filter.Page < totalPages
        };
    }

    public async Task<ConversationDetailDto?> GetConversationAsync(
        Guid conversationId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var hasAccess = await UserHasAccessAsync(conversationId, userId, cancellationToken);
        if (!hasAccess)
        {
            return null;
        }

        var conversation = await _context.Conversations
            .Include(c => c.Participants.Where(p => p.IsActive))
            .FirstOrDefaultAsync(c => c.Id == conversationId && c.IsActive, cancellationToken);

        if (conversation == null)
        {
            return null;
        }

        return await MapToConversationDetailDtoAsync(conversation, cancellationToken);
    }

    public async Task<ConversationDetailDto> CreateConversationAsync(
        Guid creatorId,
        CreateConversationRequest request,
        CancellationToken cancellationToken = default)
    {
        // Validate request
        if (request.Type == "direct" && request.ParticipantIds.Count != 1)
        {
            throw new ArgumentException("Direct conversation must have exactly one other participant");
        }

        // Check for existing direct conversation
        if (request.Type == "direct")
        {
            var existingConversation = await FindExistingDirectConversationAsync(
                creatorId, request.ParticipantIds[0], cancellationToken);

            if (existingConversation != null)
            {
                return await MapToConversationDetailDtoAsync(existingConversation, cancellationToken);
            }
        }

        var conversation = new Conversation
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Type = request.Type,
            AvatarUrl = request.AvatarUrl,
            CreatedById = creatorId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Add creator as admin
        conversation.Participants.Add(new ConversationParticipant
        {
            Id = Guid.NewGuid(),
            ConversationId = conversation.Id,
            UserId = creatorId,
            Role = "admin",
            JoinedAt = DateTime.UtcNow
        });

        // Add other participants
        foreach (var participantId in request.ParticipantIds.Where(id => id != creatorId))
        {
            conversation.Participants.Add(new ConversationParticipant
            {
                Id = Guid.NewGuid(),
                ConversationId = conversation.Id,
                UserId = participantId,
                Role = "member",
                JoinedAt = DateTime.UtcNow
            });
        }

        _context.Conversations.Add(conversation);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Created conversation {ConversationId} by user {UserId}",
            conversation.Id, creatorId);

        // Notify participants via SignalR
        foreach (var participant in conversation.Participants)
        {
            await _hubContext.Clients.User(participant.UserId.ToString())
                .SendAsync("ConversationCreated", new { ConversationId = conversation.Id }, cancellationToken);
        }

        // Publish ConversationCreatedEvent
        try
        {
            await _eventBus.PublishAsync(new ConversationCreatedEvent
            {
                ConversationId = conversation.Id,
                Name = conversation.Name ?? string.Empty,
                Type = conversation.Type,
                CreatedById = creatorId,
                ParticipantIds = conversation.Participants.Select(p => p.UserId).ToList(),
                AvatarUrl = conversation.AvatarUrl
            });
            _logger.LogDebug("Published ConversationCreatedEvent for conversation: {ConversationId}", conversation.Id);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to publish ConversationCreatedEvent for conversation: {ConversationId}", conversation.Id);
        }

        return await MapToConversationDetailDtoAsync(conversation, cancellationToken);
    }

    public async Task<ConversationDetailDto> GetOrCreatePrivateConversationAsync(
        Guid userId1,
        Guid userId2,
        CancellationToken cancellationToken = default)
    {
        var existingConversation = await FindExistingDirectConversationAsync(userId1, userId2, cancellationToken);

        if (existingConversation != null)
        {
            return await MapToConversationDetailDtoAsync(existingConversation, cancellationToken);
        }

        var request = new CreateConversationRequest
        {
            Type = "direct",
            ParticipantIds = new List<Guid> { userId2 }
        };

        return await CreateConversationAsync(userId1, request, cancellationToken);
    }

    public async Task<ConversationDetailDto> UpdateConversationAsync(
        Guid conversationId,
        Guid userId,
        UpdateConversationRequest request,
        CancellationToken cancellationToken = default)
    {
        var conversation = await _context.Conversations
            .Include(c => c.Participants)
            .FirstOrDefaultAsync(c => c.Id == conversationId && c.IsActive, cancellationToken);

        if (conversation == null)
        {
            throw new KeyNotFoundException("Conversation not found");
        }

        var participant = conversation.Participants.FirstOrDefault(p => p.UserId == userId && p.IsActive);
        if (participant == null || (participant.Role != "admin" && conversation.Type == "group"))
        {
            throw new UnauthorizedAccessException("Not authorized to update this conversation");
        }

        if (request.Name != null)
        {
            conversation.Name = request.Name;
        }

        if (request.AvatarUrl != null)
        {
            conversation.AvatarUrl = request.AvatarUrl;
        }

        conversation.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        // Notify participants
        await _hubContext.Clients.Group(conversationId.ToString())
            .SendAsync("ConversationUpdated", new { ConversationId = conversationId }, cancellationToken);

        return await MapToConversationDetailDtoAsync(conversation, cancellationToken);
    }

    public async Task<bool> DeleteConversationAsync(
        Guid conversationId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var conversation = await _context.Conversations
            .Include(c => c.Participants)
            .FirstOrDefaultAsync(c => c.Id == conversationId && c.IsActive, cancellationToken);

        if (conversation == null)
        {
            return false;
        }

        var participant = conversation.Participants.FirstOrDefault(p => p.UserId == userId && p.IsActive);
        if (participant == null || participant.Role != "admin")
        {
            throw new UnauthorizedAccessException("Not authorized to delete this conversation");
        }

        conversation.IsActive = false;
        conversation.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        // Notify participants
        await _hubContext.Clients.Group(conversationId.ToString())
            .SendAsync("ConversationDeleted", new { ConversationId = conversationId }, cancellationToken);

        return true;
    }

    public async Task<bool> LeaveConversationAsync(
        Guid conversationId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var participant = await _context.ConversationParticipants
            .FirstOrDefaultAsync(cp => cp.ConversationId == conversationId &&
                                       cp.UserId == userId &&
                                       cp.IsActive, cancellationToken);

        if (participant == null)
        {
            return false;
        }

        participant.IsActive = false;
        await _context.SaveChangesAsync(cancellationToken);

        // Notify others
        await _hubContext.Clients.Group(conversationId.ToString())
            .SendAsync("ParticipantLeft", new { ConversationId = conversationId, UserId = userId }, cancellationToken);

        return true;
    }

    public async Task<bool> UserHasAccessAsync(
        Guid conversationId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        return await _context.ConversationParticipants
            .AnyAsync(cp => cp.ConversationId == conversationId &&
                           cp.UserId == userId &&
                           cp.IsActive, cancellationToken);
    }

    #endregion

    #region Participant Operations

    public async Task<ConversationDetailDto> AddParticipantsAsync(
        Guid conversationId,
        Guid requesterId,
        AddParticipantsRequest request,
        CancellationToken cancellationToken = default)
    {
        var conversation = await _context.Conversations
            .Include(c => c.Participants)
            .FirstOrDefaultAsync(c => c.Id == conversationId && c.IsActive, cancellationToken);

        if (conversation == null)
        {
            throw new KeyNotFoundException("Conversation not found");
        }

        if (conversation.Type == "direct")
        {
            throw new InvalidOperationException("Cannot add participants to a direct conversation");
        }

        var requester = conversation.Participants.FirstOrDefault(p => p.UserId == requesterId && p.IsActive);
        if (requester == null || requester.Role != "admin")
        {
            throw new UnauthorizedAccessException("Not authorized to add participants");
        }

        foreach (var userId in request.UserIds)
        {
            var existingParticipant = conversation.Participants.FirstOrDefault(p => p.UserId == userId);
            if (existingParticipant != null)
            {
                existingParticipant.IsActive = true;
            }
            else
            {
                conversation.Participants.Add(new ConversationParticipant
                {
                    Id = Guid.NewGuid(),
                    ConversationId = conversationId,
                    UserId = userId,
                    Role = "member",
                    JoinedAt = DateTime.UtcNow
                });
            }
        }

        conversation.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        // Notify all participants
        await _hubContext.Clients.Group(conversationId.ToString())
            .SendAsync("ParticipantsAdded", new { ConversationId = conversationId, UserIds = request.UserIds }, cancellationToken);

        return await MapToConversationDetailDtoAsync(conversation, cancellationToken);
    }

    public async Task<bool> RemoveParticipantAsync(
        Guid conversationId,
        Guid requesterId,
        Guid userToRemoveId,
        CancellationToken cancellationToken = default)
    {
        var conversation = await _context.Conversations
            .Include(c => c.Participants)
            .FirstOrDefaultAsync(c => c.Id == conversationId && c.IsActive, cancellationToken);

        if (conversation == null)
        {
            throw new KeyNotFoundException("Conversation not found");
        }

        var requester = conversation.Participants.FirstOrDefault(p => p.UserId == requesterId && p.IsActive);
        if (requester == null || (requester.Role != "admin" && requesterId != userToRemoveId))
        {
            throw new UnauthorizedAccessException("Not authorized to remove participant");
        }

        var participantToRemove = conversation.Participants.FirstOrDefault(p => p.UserId == userToRemoveId && p.IsActive);
        if (participantToRemove == null)
        {
            return false;
        }

        participantToRemove.IsActive = false;
        await _context.SaveChangesAsync(cancellationToken);

        await _hubContext.Clients.Group(conversationId.ToString())
            .SendAsync("ParticipantRemoved", new { ConversationId = conversationId, UserId = userToRemoveId }, cancellationToken);

        return true;
    }

    public async Task<bool> UpdateParticipantSettingsAsync(
        Guid conversationId,
        Guid userId,
        bool? isMuted = null,
        bool? isPinned = null,
        CancellationToken cancellationToken = default)
    {
        var participant = await _context.ConversationParticipants
            .FirstOrDefaultAsync(cp => cp.ConversationId == conversationId &&
                                       cp.UserId == userId &&
                                       cp.IsActive, cancellationToken);

        if (participant == null)
        {
            return false;
        }

        if (isMuted.HasValue)
        {
            participant.IsMuted = isMuted.Value;
        }

        if (isPinned.HasValue)
        {
            participant.IsPinned = isPinned.Value;
        }

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    #endregion

    #region Message Operations

    public async Task<MessagesResponse> GetMessagesAsync(
        Guid conversationId,
        Guid userId,
        MessageFilter filter,
        CancellationToken cancellationToken = default)
    {
        if (!await UserHasAccessAsync(conversationId, userId, cancellationToken))
        {
            throw new UnauthorizedAccessException("No access to this conversation");
        }

        var query = _context.Messages
            .Where(m => m.ConversationId == conversationId && !m.IsDeleted)
            .Include(m => m.ReadReceipts)
            .Include(m => m.ReplyToMessage)
            .AsQueryable();

        // Apply filters
        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            query = query.Where(m => m.Content.Contains(filter.SearchTerm));
        }

        if (filter.Before.HasValue)
        {
            query = query.Where(m => m.CreatedAt < filter.Before.Value);
        }

        if (filter.After.HasValue)
        {
            query = query.Where(m => m.CreatedAt > filter.After.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var messages = await query
            .OrderByDescending(m => m.CreatedAt)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync(cancellationToken);

        var messageDtos = new List<MessageDto>();
        foreach (var message in messages)
        {
            messageDtos.Add(await MapToMessageDtoAsync(message, userId, cancellationToken));
        }

        return new MessagesResponse
        {
            Messages = messageDtos.OrderBy(m => m.CreatedAt).ToList(),
            TotalCount = totalCount,
            PageNumber = filter.Page,
            PageSize = filter.PageSize,
            HasMore = filter.Page * filter.PageSize < totalCount,
            OldestMessageDate = messageDtos.Any() ? messageDtos.Min(m => m.CreatedAt) : null,
            NewestMessageDate = messageDtos.Any() ? messageDtos.Max(m => m.CreatedAt) : null
        };
    }

    public async Task<MessageDto?> GetMessageAsync(
        Guid messageId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var message = await _context.Messages
            .Include(m => m.ReadReceipts)
            .Include(m => m.ReplyToMessage)
            .FirstOrDefaultAsync(m => m.Id == messageId && !m.IsDeleted, cancellationToken);

        if (message == null)
        {
            return null;
        }

        if (!await UserHasAccessAsync(message.ConversationId, userId, cancellationToken))
        {
            return null;
        }

        return await MapToMessageDtoAsync(message, userId, cancellationToken);
    }

    public async Task<MessageDto> SendMessageAsync(
        Guid senderId,
        Guid conversationId,
        SendMessageRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!await UserHasAccessAsync(conversationId, senderId, cancellationToken))
        {
            throw new UnauthorizedAccessException("No access to this conversation");
        }

        var message = new Message
        {
            Id = Guid.NewGuid(),
            ConversationId = conversationId,
            SenderId = senderId,
            Content = request.Content,
            Type = request.Type,
            CreatedAt = DateTime.UtcNow,
            ReplyToMessageId = request.ReplyToMessageId,
            AttachmentId = request.AttachmentId
        };

        _context.Messages.Add(message);

        // Update conversation last message
        var conversation = await _context.Conversations.FindAsync(new object[] { conversationId }, cancellationToken);
        if (conversation != null)
        {
            conversation.LastMessageAt = message.CreatedAt;
            conversation.LastMessagePreview = request.Content.Length > 100
                ? request.Content.Substring(0, 100) + "..."
                : request.Content;
            conversation.UpdatedAt = DateTime.UtcNow;
        }

        // Increment unread count for other participants
        var otherParticipants = await _context.ConversationParticipants
            .Where(cp => cp.ConversationId == conversationId &&
                        cp.UserId != senderId &&
                        cp.IsActive)
            .ToListAsync(cancellationToken);

        foreach (var participant in otherParticipants)
        {
            participant.UnreadCount++;
        }

        await _context.SaveChangesAsync(cancellationToken);

        var messageDto = await MapToMessageDtoAsync(message, senderId, cancellationToken);

        // Broadcast to conversation group
        await _hubContext.Clients.Group(conversationId.ToString())
            .SendAsync("NewMessage", messageDto, cancellationToken);

        _logger.LogDebug("Message {MessageId} sent by {SenderId} in conversation {ConversationId}",
            message.Id, senderId, conversationId);

        // Publish MessageSentEvent
        try
        {
            await _eventBus.PublishAsync(new MessageSentEvent
            {
                MessageId = message.Id,
                ConversationId = conversationId,
                SenderId = senderId,
                SenderName = messageDto.SenderName,
                SenderAvatar = messageDto.SenderAvatar,
                Content = message.Content,
                MessageType = (int)Enum.Parse<MessageType>(message.Type, true),
                AttachmentId = message.AttachmentId,
                RecipientIds = otherParticipants.Select(p => p.UserId).ToList(),
                Timestamp = message.CreatedAt
            });
            _logger.LogDebug("Published MessageSentEvent for message: {MessageId}", message.Id);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to publish MessageSentEvent for message: {MessageId}", message.Id);
        }

        return messageDto;
    }

    public async Task<MessageDto> EditMessageAsync(
        Guid userId,
        Guid messageId,
        EditMessageRequest request,
        CancellationToken cancellationToken = default)
    {
        var message = await _context.Messages.FindAsync(new object[] { messageId }, cancellationToken);

        if (message == null || message.IsDeleted)
        {
            throw new KeyNotFoundException("Message not found");
        }

        if (message.SenderId != userId)
        {
            throw new UnauthorizedAccessException("Cannot edit other user's message");
        }

        message.Content = request.Content;
        message.EditedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        var messageDto = await MapToMessageDtoAsync(message, userId, cancellationToken);

        // Broadcast edit
        await _hubContext.Clients.Group(message.ConversationId.ToString())
            .SendAsync("MessageEdited", messageDto, cancellationToken);

        // Publish MessageEditedEvent
        try
        {
            await _eventBus.PublishAsync(new MessageEditedEvent
            {
                MessageId = message.Id,
                ConversationId = message.ConversationId,
                EditorId = userId,
                NewContent = message.Content,
                EditedAt = message.EditedAt ?? DateTime.UtcNow
            });
            _logger.LogDebug("Published MessageEditedEvent for message: {MessageId}", message.Id);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to publish MessageEditedEvent for message: {MessageId}", message.Id);
        }

        return messageDto;
    }

    public async Task<bool> DeleteMessageAsync(
        Guid userId,
        Guid messageId,
        bool deleteForEveryone = false,
        CancellationToken cancellationToken = default)
    {
        var message = await _context.Messages.FindAsync(new object[] { messageId }, cancellationToken);

        if (message == null)
        {
            return false;
        }

        if (message.SenderId != userId)
        {
            throw new UnauthorizedAccessException("Cannot delete other user's message");
        }

        message.IsDeleted = true;
        message.DeletedAt = DateTime.UtcNow;
        message.Content = "[Message deleted]";

        await _context.SaveChangesAsync(cancellationToken);

        // Broadcast deletion
        await _hubContext.Clients.Group(message.ConversationId.ToString())
            .SendAsync("MessageDeleted", new MessageDeletedDto
            {
                MessageId = messageId,
                ConversationId = message.ConversationId,
                DeletedBy = userId
            }, cancellationToken);

        // Publish MessageDeletedEvent
        try
        {
            await _eventBus.PublishAsync(new MessageDeletedEvent
            {
                MessageId = messageId,
                ConversationId = message.ConversationId,
                DeletedById = userId,
                DeleteForEveryone = deleteForEveryone,
                DeletedAt = message.DeletedAt ?? DateTime.UtcNow
            });
            _logger.LogDebug("Published MessageDeletedEvent for message: {MessageId}", messageId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to publish MessageDeletedEvent for message: {MessageId}", messageId);
        }

        return true;
    }

    public async Task<int> MarkMessagesAsReadAsync(
        Guid conversationId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        // Get all unread messages
        var unreadMessages = await _context.Messages
            .Where(m => m.ConversationId == conversationId &&
                       m.SenderId != userId &&
                       !m.IsDeleted &&
                       !m.ReadReceipts.Any(r => r.UserId == userId))
            .ToListAsync(cancellationToken);

        foreach (var message in unreadMessages)
        {
            _context.MessageReadReceipts.Add(new MessageReadReceipt
            {
                Id = Guid.NewGuid(),
                MessageId = message.Id,
                UserId = userId,
                ReadAt = DateTime.UtcNow
            });
        }

        // Reset unread count for participant
        var participant = await _context.ConversationParticipants
            .FirstOrDefaultAsync(cp => cp.ConversationId == conversationId && cp.UserId == userId, cancellationToken);

        if (participant != null)
        {
            participant.UnreadCount = 0;
            participant.LastReadAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);

        return unreadMessages.Count;
    }

    public async Task<MessagesResponse> SearchMessagesAsync(
        Guid userId,
        string searchTerm,
        Guid? conversationId = null,
        MessageFilter? filter = null,
        CancellationToken cancellationToken = default)
    {
        filter ??= new MessageFilter();

        IQueryable<Message> query;

        if (conversationId.HasValue)
        {
            if (!await UserHasAccessAsync(conversationId.Value, userId, cancellationToken))
            {
                throw new UnauthorizedAccessException("No access to this conversation");
            }

            query = _context.Messages.Where(m => m.ConversationId == conversationId.Value);
        }
        else
        {
            var userConversationIds = await _context.ConversationParticipants
                .Where(cp => cp.UserId == userId && cp.IsActive)
                .Select(cp => cp.ConversationId)
                .ToListAsync(cancellationToken);

            query = _context.Messages.Where(m => userConversationIds.Contains(m.ConversationId));
        }

        query = query.Where(m => !m.IsDeleted && m.Content.Contains(searchTerm));

        var totalCount = await query.CountAsync(cancellationToken);

        var messages = await query
            .OrderByDescending(m => m.CreatedAt)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Include(m => m.ReadReceipts)
            .ToListAsync(cancellationToken);

        var messageDtos = new List<MessageDto>();
        foreach (var message in messages)
        {
            messageDtos.Add(await MapToMessageDtoAsync(message, userId, cancellationToken));
        }

        return new MessagesResponse
        {
            Messages = messageDtos,
            TotalCount = totalCount,
            PageNumber = filter.Page,
            PageSize = filter.PageSize,
            HasMore = filter.Page * filter.PageSize < totalCount
        };
    }

    #endregion

    #region User Cache Operations

    public async Task<UserDto?> GetUserCacheAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var cache = await _context.UserCaches.FindAsync(new object[] { userId }, cancellationToken);

        if (cache == null || cache.ExpiresAt < DateTime.UtcNow)
        {
            // Try to fetch from AuthService
            var userFromAuth = await FetchUserFromAuthServiceAsync(userId, cancellationToken);
            if (userFromAuth != null)
            {
                // Update cache
                await UpdateUserCacheAsync(
                    userId,
                    userFromAuth.Username,
                    userFromAuth.FullName,
                    userFromAuth.AvatarUrl,
                    cancellationToken);
                return userFromAuth;
            }
            return null;
        }

        return new UserDto
        {
            Id = cache.UserId,
            Username = cache.Username,
            FullName = cache.FullName,
            AvatarUrl = cache.AvatarUrl,
            IsOnline = cache.IsOnline,
            LastSeen = cache.LastSeen
        };
    }

    private async Task<UserDto?> FetchUserFromAuthServiceAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var authServiceUrl = _configuration["ServiceSettings:AuthServiceUrl"] ?? "http://auth-service:5001";
            var client = _httpClientFactory.CreateClient();

            var response = await client.GetAsync(
                $"{authServiceUrl}/api/auth/internal/users/{userId}",
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Failed to fetch user {UserId} from AuthService: {StatusCode}",
                    userId, response.StatusCode);
                return null;
            }

            var content = await response.Content.ReadAsStringAsync(cancellationToken);
            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };

            // AuthService returns ApiResponse<UserDto>
            var apiResponse = JsonSerializer.Deserialize<AuthServiceUserResponse>(content, options);

            if (apiResponse?.Success == true && apiResponse.Data != null)
            {
                return new UserDto
                {
                    Id = apiResponse.Data.Id,
                    Username = apiResponse.Data.Username,
                    Email = apiResponse.Data.Email,
                    FullName = apiResponse.Data.FullName,
                    AvatarUrl = apiResponse.Data.AvatarUrl,
                    IsOnline = apiResponse.Data.IsOnline,
                    LastSeen = apiResponse.Data.LastSeen,
                    CreatedAt = apiResponse.Data.CreatedAt
                };
            }

            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching user {UserId} from AuthService", userId);
            return null;
        }
    }

    // Helper class for deserializing AuthService response
    private class AuthServiceUserResponse
    {
        public bool Success { get; set; }
        public string? Message { get; set; }
        public AuthServiceUserData? Data { get; set; }
    }

    private class AuthServiceUserData
    {
        public Guid Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public bool IsOnline { get; set; }
        public DateTime? LastSeen { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public async Task UpdateUserCacheAsync(
        Guid userId,
        string username,
        string fullName,
        string? avatarUrl,
        CancellationToken cancellationToken = default)
    {
        var cache = await _context.UserCaches.FindAsync(new object[] { userId }, cancellationToken);

        if (cache == null)
        {
            cache = new UserCache
            {
                UserId = userId,
                Username = username,
                FullName = fullName,
                AvatarUrl = avatarUrl,
                CachedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddHours(1)
            };
            _context.UserCaches.Add(cache);
        }
        else
        {
            cache.Username = username;
            cache.FullName = fullName;
            cache.AvatarUrl = avatarUrl;
            cache.CachedAt = DateTime.UtcNow;
            cache.ExpiresAt = DateTime.UtcNow.AddHours(1);
        }

        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateUserOnlineStatusAsync(
        Guid userId,
        bool isOnline,
        CancellationToken cancellationToken = default)
    {
        var cache = await _context.UserCaches.FindAsync(new object[] { userId }, cancellationToken);

        if (cache != null)
        {
            cache.IsOnline = isOnline;
            if (!isOnline)
            {
                cache.LastSeen = DateTime.UtcNow;
            }
            await _context.SaveChangesAsync(cancellationToken);
        }
    }

    #endregion

    #region Private Helper Methods

    private async Task<Conversation?> FindExistingDirectConversationAsync(
        Guid userId1,
        Guid userId2,
        CancellationToken cancellationToken)
    {
        var userConversations = await _context.ConversationParticipants
            .Where(cp => cp.UserId == userId1 && cp.IsActive)
            .Select(cp => cp.ConversationId)
            .ToListAsync(cancellationToken);

        return await _context.Conversations
            .Include(c => c.Participants)
            .Where(c => c.Type == "direct" &&
                       c.IsActive &&
                       userConversations.Contains(c.Id) &&
                       c.Participants.Any(p => p.UserId == userId2 && p.IsActive))
            .FirstOrDefaultAsync(cancellationToken);
    }

    private async Task<ConversationDto> MapToConversationDtoAsync(
        Conversation conversation,
        ConversationParticipant? currentUserParticipant,
        CancellationToken cancellationToken)
    {
        var participants = new List<ParticipantDto>();

        foreach (var p in conversation.Participants.Where(p => p.IsActive))
        {
            var userCache = await GetUserCacheAsync(p.UserId, cancellationToken);
            participants.Add(new ParticipantDto
            {
                Id = p.Id,
                UserId = p.UserId,
                Username = userCache?.Username ?? "Unknown",
                FullName = userCache?.FullName ?? "Unknown User",
                AvatarUrl = userCache?.AvatarUrl,
                IsOnline = userCache?.IsOnline ?? false,
                LastSeen = userCache?.LastSeen,
                Role = p.Role,
                JoinedAt = p.JoinedAt
            });
        }

        return new ConversationDto
        {
            Id = conversation.Id,
            Name = conversation.Name,
            Type = conversation.Type,
            AvatarUrl = conversation.AvatarUrl,
            LastMessagePreview = conversation.LastMessagePreview,
            LastMessageAt = conversation.LastMessageAt,
            UnreadCount = currentUserParticipant?.UnreadCount ?? 0,
            IsPinned = currentUserParticipant?.IsPinned ?? false,
            IsMuted = currentUserParticipant?.IsMuted ?? false,
            Participants = participants
        };
    }

    private async Task<ConversationDetailDto> MapToConversationDetailDtoAsync(
        Conversation conversation,
        CancellationToken cancellationToken)
    {
        var participants = new List<ParticipantDto>();

        foreach (var p in conversation.Participants.Where(p => p.IsActive))
        {
            var userCache = await GetUserCacheAsync(p.UserId, cancellationToken);
            participants.Add(new ParticipantDto
            {
                Id = p.Id,
                UserId = p.UserId,
                Username = userCache?.Username ?? "Unknown",
                FullName = userCache?.FullName ?? "Unknown User",
                AvatarUrl = userCache?.AvatarUrl,
                IsOnline = userCache?.IsOnline ?? false,
                LastSeen = userCache?.LastSeen,
                Role = p.Role,
                JoinedAt = p.JoinedAt
            });
        }

        var creatorCache = await GetUserCacheAsync(conversation.CreatedById, cancellationToken);

        var totalMessages = await _context.Messages
            .CountAsync(m => m.ConversationId == conversation.Id && !m.IsDeleted, cancellationToken);

        return new ConversationDetailDto
        {
            Id = conversation.Id,
            Name = conversation.Name,
            Type = conversation.Type,
            AvatarUrl = conversation.AvatarUrl,
            CreatedAt = conversation.CreatedAt,
            UpdatedAt = conversation.UpdatedAt,
            CreatedBy = creatorCache != null ? new UserDto
            {
                Id = conversation.CreatedById,
                Username = creatorCache.Username,
                FullName = creatorCache.FullName,
                AvatarUrl = creatorCache.AvatarUrl,
                IsOnline = creatorCache.IsOnline,
                LastSeen = creatorCache.LastSeen
            } : null,
            Participants = participants,
            TotalMessages = totalMessages
        };
    }

    private async Task<MessageDto> MapToMessageDtoAsync(
        Message message,
        Guid currentUserId,
        CancellationToken cancellationToken)
    {
        var senderCache = await GetUserCacheAsync(message.SenderId, cancellationToken);

        MessageDto? replyToDto = null;
        if (message.ReplyToMessage != null)
        {
            var replyToSenderCache = await GetUserCacheAsync(message.ReplyToMessage.SenderId, cancellationToken);
            replyToDto = new MessageDto
            {
                Id = message.ReplyToMessage.Id,
                ConversationId = message.ReplyToMessage.ConversationId,
                SenderId = message.ReplyToMessage.SenderId,
                SenderName = replyToSenderCache?.FullName ?? "Unknown",
                SenderAvatar = replyToSenderCache?.AvatarUrl,
                Content = message.ReplyToMessage.Content,
                Type = message.ReplyToMessage.Type,
                CreatedAt = message.ReplyToMessage.CreatedAt,
                EditedAt = message.ReplyToMessage.EditedAt,
                IsDeleted = message.ReplyToMessage.IsDeleted,
                IsOwner = message.ReplyToMessage.SenderId == currentUserId
            };
        }

        AttachmentDto? attachmentDto = null;
        if (message.AttachmentId.HasValue && !string.IsNullOrEmpty(message.AttachmentFileName))
        {
            attachmentDto = new AttachmentDto
            {
                Id = message.AttachmentId.Value,
                FileName = message.AttachmentFileName,
                ContentType = message.AttachmentContentType ?? "application/octet-stream",
                FileSize = message.AttachmentFileSize ?? 0,
                FileExtension = Path.GetExtension(message.AttachmentFileName),
                DownloadUrl = $"/api/documents/{message.AttachmentId}/download"
            };
        }

        var readReceipts = message.ReadReceipts?.Select(r => new ReadReceiptDto
        {
            UserId = r.UserId,
            ReadAt = r.ReadAt
        }).ToList() ?? new List<ReadReceiptDto>();

        return new MessageDto
        {
            Id = message.Id,
            ConversationId = message.ConversationId,
            SenderId = message.SenderId,
            SenderName = senderCache?.FullName ?? "Unknown",
            SenderAvatar = senderCache?.AvatarUrl,
            Content = message.Content,
            Type = message.Type,
            CreatedAt = message.CreatedAt,
            EditedAt = message.EditedAt,
            IsDeleted = message.IsDeleted,
            Attachment = attachmentDto,
            ReadBy = readReceipts,
            IsOwner = message.SenderId == currentUserId,
            ReplyTo = replyToDto
        };
    }

    #endregion
}
