using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ChatService.Models.DTOs;
using ChatService.Services;
using System.Security.Claims;

namespace ChatService.Controllers;

/// <summary>
/// API Controller for Chat operations
/// Handles conversations and messages
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ChatController : ControllerBase
{
    private readonly IChatService _chatService;
    private readonly ILogger<ChatController> _logger;

    public ChatController(IChatService chatService, ILogger<ChatController> logger)
    {
        _chatService = chatService ?? throw new ArgumentNullException(nameof(chatService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    #region Conversation Endpoints

    /// <summary>
    /// Get all conversations for the current user
    /// </summary>
    [HttpGet("conversations")]
    [ProducesResponseType(typeof(ConversationsResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<ConversationsResponse>> GetConversations(
        [FromQuery] ConversationFilter filter,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var conversations = await _chatService.GetUserConversationsAsync(userId, filter, cancellationToken);
        return Ok(conversations);
    }

    /// <summary>
    /// Get a specific conversation by ID
    /// </summary>
    [HttpGet("conversations/{conversationId:guid}")]
    [ProducesResponseType(typeof(ConversationDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ConversationDetailDto>> GetConversation(
        Guid conversationId,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var conversation = await _chatService.GetConversationAsync(conversationId, userId, cancellationToken);

        if (conversation == null)
        {
            return NotFound(new { Message = "Conversation not found or access denied" });
        }

        return Ok(conversation);
    }

    /// <summary>
    /// Create a new conversation
    /// </summary>
    [HttpPost("conversations")]
    [ProducesResponseType(typeof(ConversationDetailDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ConversationDetailDto>> CreateConversation(
        [FromBody] CreateConversationRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = GetCurrentUserId();
            var conversation = await _chatService.CreateConversationAsync(userId, request, cancellationToken);
            return CreatedAtAction(
                nameof(GetConversation),
                new { conversationId = conversation.Id },
                conversation);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    /// <summary>
    /// Get or create a private conversation with another user
    /// </summary>
    [HttpPost("conversations/private/{otherUserId:guid}")]
    [ProducesResponseType(typeof(ConversationDetailDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<ConversationDetailDto>> GetOrCreatePrivateConversation(
        Guid otherUserId,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var conversation = await _chatService.GetOrCreatePrivateConversationAsync(
            userId, otherUserId, cancellationToken);
        return Ok(conversation);
    }

    /// <summary>
    /// Update a conversation (name, avatar)
    /// </summary>
    [HttpPut("conversations/{conversationId:guid}")]
    [ProducesResponseType(typeof(ConversationDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ConversationDetailDto>> UpdateConversation(
        Guid conversationId,
        [FromBody] UpdateConversationRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = GetCurrentUserId();
            var conversation = await _chatService.UpdateConversationAsync(
                conversationId, userId, request, cancellationToken);
            return Ok(conversation);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { Message = "Conversation not found" });
        }
    }

    /// <summary>
    /// Delete a conversation
    /// </summary>
    [HttpDelete("conversations/{conversationId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteConversation(
        Guid conversationId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _chatService.DeleteConversationAsync(conversationId, userId, cancellationToken);

            if (!result)
            {
                return NotFound(new { Message = "Conversation not found" });
            }

            return NoContent();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    /// <summary>
    /// Leave a conversation
    /// </summary>
    [HttpPost("conversations/{conversationId:guid}/leave")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> LeaveConversation(
        Guid conversationId,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var result = await _chatService.LeaveConversationAsync(conversationId, userId, cancellationToken);

        if (!result)
        {
            return NotFound(new { Message = "Conversation not found or already left" });
        }

        return NoContent();
    }

    /// <summary>
    /// Add participants to a conversation
    /// </summary>
    [HttpPost("conversations/{conversationId:guid}/participants")]
    [ProducesResponseType(typeof(ConversationDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ConversationDetailDto>> AddParticipants(
        Guid conversationId,
        [FromBody] AddParticipantsRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = GetCurrentUserId();
            var conversation = await _chatService.AddParticipantsAsync(
                conversationId, userId, request, cancellationToken);
            return Ok(conversation);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { Message = "Conversation not found" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    /// <summary>
    /// Remove a participant from a conversation
    /// </summary>
    [HttpDelete("conversations/{conversationId:guid}/participants/{userToRemoveId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveParticipant(
        Guid conversationId,
        Guid userToRemoveId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _chatService.RemoveParticipantAsync(
                conversationId, userId, userToRemoveId, cancellationToken);

            if (!result)
            {
                return NotFound(new { Message = "Participant not found" });
            }

            return NoContent();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { Message = "Conversation not found" });
        }
    }

    /// <summary>
    /// Update participant settings (mute, pin)
    /// </summary>
    [HttpPatch("conversations/{conversationId:guid}/settings")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateParticipantSettings(
        Guid conversationId,
        [FromBody] UpdateParticipantSettingsRequest request,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var result = await _chatService.UpdateParticipantSettingsAsync(
            conversationId, userId, request.IsMuted, request.IsPinned, cancellationToken);

        if (!result)
        {
            return NotFound(new { Message = "Conversation not found" });
        }

        return NoContent();
    }

    #endregion

    #region Message Endpoints

    /// <summary>
    /// Get messages for a conversation
    /// </summary>
    [HttpGet("conversations/{conversationId:guid}/messages")]
    [ProducesResponseType(typeof(MessagesResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<MessagesResponse>> GetMessages(
        Guid conversationId,
        [FromQuery] MessageFilter filter,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = GetCurrentUserId();
            var messages = await _chatService.GetMessagesAsync(conversationId, userId, filter, cancellationToken);
            return Ok(messages);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    /// <summary>
    /// Get a specific message
    /// </summary>
    [HttpGet("messages/{messageId:guid}")]
    [ProducesResponseType(typeof(MessageDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<MessageDto>> GetMessage(
        Guid messageId,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var message = await _chatService.GetMessageAsync(messageId, userId, cancellationToken);

        if (message == null)
        {
            return NotFound(new { Message = "Message not found or access denied" });
        }

        return Ok(message);
    }

    /// <summary>
    /// Send a message to a conversation
    /// </summary>
    [HttpPost("conversations/{conversationId:guid}/messages")]
    [ProducesResponseType(typeof(MessageDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<MessageDto>> SendMessage(
        Guid conversationId,
        [FromBody] SendMessageRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = GetCurrentUserId();
            var message = await _chatService.SendMessageAsync(userId, conversationId, request, cancellationToken);
            return CreatedAtAction(nameof(GetMessage), new { messageId = message.Id }, message);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    /// <summary>
    /// Edit a message
    /// </summary>
    [HttpPut("messages/{messageId:guid}")]
    [ProducesResponseType(typeof(MessageDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<MessageDto>> EditMessage(
        Guid messageId,
        [FromBody] EditMessageRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = GetCurrentUserId();
            var message = await _chatService.EditMessageAsync(userId, messageId, request, cancellationToken);
            return Ok(message);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { Message = "Message not found" });
        }
    }

    /// <summary>
    /// Delete a message
    /// </summary>
    [HttpDelete("messages/{messageId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteMessage(
        Guid messageId,
        [FromQuery] bool deleteForEveryone = false,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _chatService.DeleteMessageAsync(userId, messageId, deleteForEveryone, cancellationToken);

            if (!result)
            {
                return NotFound(new { Message = "Message not found" });
            }

            return NoContent();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    /// <summary>
    /// Mark messages as read in a conversation
    /// </summary>
    [HttpPost("conversations/{conversationId:guid}/read")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult> MarkAsRead(
        Guid conversationId,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var count = await _chatService.MarkMessagesAsReadAsync(conversationId, userId, cancellationToken);
        return Ok(new { MarkedAsRead = count });
    }

    /// <summary>
    /// Search messages
    /// </summary>
    [HttpGet("messages/search")]
    [ProducesResponseType(typeof(MessagesResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<MessagesResponse>> SearchMessages(
        [FromQuery] string q,
        [FromQuery] Guid? conversationId = null,
        [FromQuery] MessageFilter? filter = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = GetCurrentUserId();
            var messages = await _chatService.SearchMessagesAsync(userId, q, conversationId, filter, cancellationToken);
            return Ok(messages);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
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

/// <summary>
/// Request to update participant settings
/// </summary>
public record UpdateParticipantSettingsRequest
{
    public bool? IsMuted { get; init; }
    public bool? IsPinned { get; init; }
}
