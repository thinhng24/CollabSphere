using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NotificationService.Models.DTOs;
using NotificationService.Services;
using System.Security.Claims;

namespace NotificationService.Controllers;

/// <summary>
/// API Controller for Notification operations
/// Handles notification management, preferences, and subscriptions
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationController : ControllerBase
{
    private readonly INotificationService _notificationService;
    private readonly ILogger<NotificationController> _logger;

    public NotificationController(INotificationService notificationService, ILogger<NotificationController> logger)
    {
        _notificationService = notificationService ?? throw new ArgumentNullException(nameof(notificationService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    #region Notification Endpoints

    /// <summary>
    /// Get notifications for the current user
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(NotificationsResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<NotificationsResponse>> GetNotifications(
        [FromQuery] NotificationFilter filter,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var notifications = await _notificationService.GetNotificationsAsync(userId, filter, cancellationToken);
        return Ok(notifications);
    }

    /// <summary>
    /// Get a specific notification by ID
    /// </summary>
    [HttpGet("{notificationId:guid}")]
    [ProducesResponseType(typeof(NotificationDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<NotificationDto>> GetNotification(
        Guid notificationId,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var notification = await _notificationService.GetNotificationAsync(notificationId, userId, cancellationToken);

        if (notification == null)
        {
            return NotFound(new { Message = "Notification not found" });
        }

        return Ok(notification);
    }

    /// <summary>
    /// Get notification counts for the current user
    /// </summary>
    [HttpGet("count")]
    [ProducesResponseType(typeof(NotificationCountResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<NotificationCountResponse>> GetNotificationCounts(
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var counts = await _notificationService.GetNotificationCountsAsync(userId, cancellationToken);
        return Ok(counts);
    }

    /// <summary>
    /// Mark a notification as read
    /// </summary>
    [HttpPost("{notificationId:guid}/read")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarkAsRead(
        Guid notificationId,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var result = await _notificationService.MarkAsReadAsync(notificationId, userId, cancellationToken);

        if (!result)
        {
            return NotFound(new { Message = "Notification not found" });
        }

        return NoContent();
    }

    /// <summary>
    /// Mark multiple notifications as read
    /// </summary>
    [HttpPost("read")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult> MarkMultipleAsRead(
        [FromBody] MarkNotificationsReadRequest request,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var count = await _notificationService.MarkMultipleAsReadAsync(userId, request.NotificationIds, cancellationToken);
        return Ok(new { MarkedAsRead = count });
    }

    /// <summary>
    /// Mark all notifications as read
    /// </summary>
    [HttpPost("read-all")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult> MarkAllAsRead(
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var count = await _notificationService.MarkAllAsReadAsync(userId, cancellationToken);
        return Ok(new { MarkedAsRead = count });
    }

    /// <summary>
    /// Dismiss a notification
    /// </summary>
    [HttpPost("{notificationId:guid}/dismiss")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DismissNotification(
        Guid notificationId,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var result = await _notificationService.DismissNotificationAsync(notificationId, userId, cancellationToken);

        if (!result)
        {
            return NotFound(new { Message = "Notification not found" });
        }

        return NoContent();
    }

    /// <summary>
    /// Delete a notification
    /// </summary>
    [HttpDelete("{notificationId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteNotification(
        Guid notificationId,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var result = await _notificationService.DeleteNotificationAsync(notificationId, userId, cancellationToken);

        if (!result)
        {
            return NotFound(new { Message = "Notification not found" });
        }

        return NoContent();
    }

    /// <summary>
    /// Delete all notifications
    /// </summary>
    [HttpDelete]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult> DeleteAllNotifications(
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var count = await _notificationService.DeleteAllNotificationsAsync(userId, cancellationToken);
        return Ok(new { Deleted = count });
    }

    #endregion

    #region Preference Endpoints

    /// <summary>
    /// Get notification preferences
    /// </summary>
    [HttpGet("preferences")]
    [ProducesResponseType(typeof(NotificationPreferenceDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<NotificationPreferenceDto>> GetPreferences(
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var preferences = await _notificationService.GetPreferencesAsync(userId, cancellationToken);
        return Ok(preferences);
    }

    /// <summary>
    /// Update notification preferences
    /// </summary>
    [HttpPut("preferences")]
    [ProducesResponseType(typeof(NotificationPreferenceDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<NotificationPreferenceDto>> UpdatePreferences(
        [FromBody] UpdateNotificationPreferenceRequest request,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var preferences = await _notificationService.UpdatePreferencesAsync(userId, request, cancellationToken);
        return Ok(preferences);
    }

    #endregion

    #region Mute Endpoints

    /// <summary>
    /// Mute a conversation
    /// </summary>
    [HttpPost("mute")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> MuteConversation(
        [FromBody] MuteConversationRequest request,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        await _notificationService.MuteConversationAsync(userId, request.ConversationId, request.MuteUntil, cancellationToken);
        return NoContent();
    }

    /// <summary>
    /// Unmute a conversation
    /// </summary>
    [HttpDelete("mute/{conversationId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> UnmuteConversation(
        Guid conversationId,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        await _notificationService.UnmuteConversationAsync(userId, conversationId, cancellationToken);
        return NoContent();
    }

    /// <summary>
    /// Get muted conversations
    /// </summary>
    [HttpGet("muted")]
    [ProducesResponseType(typeof(List<Guid>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<Guid>>> GetMutedConversations(
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var mutedConversations = await _notificationService.GetMutedConversationsAsync(userId, cancellationToken);
        return Ok(mutedConversations);
    }

    #endregion

    #region Push Subscription Endpoints

    /// <summary>
    /// Register a push subscription
    /// </summary>
    [HttpPost("push/subscribe")]
    [ProducesResponseType(typeof(PushSubscriptionDto), StatusCodes.Status201Created)]
    public async Task<ActionResult<PushSubscriptionDto>> RegisterPushSubscription(
        [FromBody] RegisterPushSubscriptionRequest request,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var subscription = await _notificationService.RegisterPushSubscriptionAsync(userId, request, cancellationToken);
        return CreatedAtAction(nameof(GetPushSubscriptions), null, subscription);
    }

    /// <summary>
    /// Get push subscriptions
    /// </summary>
    [HttpGet("push/subscriptions")]
    [ProducesResponseType(typeof(List<PushSubscriptionDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<PushSubscriptionDto>>> GetPushSubscriptions(
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var subscriptions = await _notificationService.GetPushSubscriptionsAsync(userId, cancellationToken);
        return Ok(subscriptions);
    }

    /// <summary>
    /// Remove a push subscription
    /// </summary>
    [HttpDelete("push/subscriptions/{subscriptionId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemovePushSubscription(
        Guid subscriptionId,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var result = await _notificationService.RemovePushSubscriptionAsync(subscriptionId, userId, cancellationToken);

        if (!result)
        {
            return NotFound(new { Message = "Subscription not found" });
        }

        return NoContent();
    }

    /// <summary>
    /// Remove all push subscriptions
    /// </summary>
    [HttpDelete("push/subscriptions")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult> RemoveAllPushSubscriptions(
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var count = await _notificationService.RemoveAllPushSubscriptionsAsync(userId, cancellationToken);
        return Ok(new { Removed = count });
    }

    #endregion

    #region Admin Endpoints (would need admin authorization in production)

    /// <summary>
    /// Send a notification (admin/service use)
    /// </summary>
    [HttpPost("send")]
    [ProducesResponseType(typeof(NotificationDto), StatusCodes.Status201Created)]
    public async Task<ActionResult<NotificationDto>> SendNotification(
        [FromBody] CreateNotificationRequest request,
        CancellationToken cancellationToken = default)
    {
        var notification = await _notificationService.CreateNotificationAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetNotification), new { notificationId = notification.Id }, notification);
    }

    /// <summary>
    /// Send bulk notifications (admin/service use)
    /// </summary>
    [HttpPost("send/bulk")]
    [ProducesResponseType(typeof(BulkNotificationResult), StatusCodes.Status200OK)]
    public async Task<ActionResult<BulkNotificationResult>> SendBulkNotification(
        [FromBody] SendBulkNotificationRequest request,
        CancellationToken cancellationToken = default)
    {
        var result = await _notificationService.SendBulkNotificationAsync(request, cancellationToken);
        return Ok(result);
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
