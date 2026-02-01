using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using AuthService.Models.DTOs;
using AuthService.Services;

namespace AuthService.Controllers;

/// <summary>
/// Authentication controller for user registration, login, and token management
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    /// <summary>
    /// Register a new user
    /// </summary>
    /// <param name="request">Registration details</param>
    /// <returns>Auth response with tokens and user info</returns>
    [HttpPost("register")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<AuthResponse>.Fail("Invalid request data"));
        }

        var result = await _authService.RegisterAsync(request);

        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Login with email and password
    /// </summary>
    /// <param name="request">Login credentials</param>
    /// <returns>Auth response with tokens and user info</returns>
    [HttpPost("login")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<AuthResponse>.Fail("Invalid request data"));
        }

        var result = await _authService.LoginAsync(request);

        if (!result.Success)
        {
            return Unauthorized(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Refresh access token using refresh token
    /// </summary>
    /// <param name="request">Refresh token request</param>
    /// <returns>New auth response with fresh tokens</returns>
    [HttpPost("refresh")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<AuthResponse>.Fail("Invalid request data"));
        }

        var result = await _authService.RefreshTokenAsync(request);

        if (!result.Success)
        {
            return Unauthorized(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Logout - revoke refresh token
    /// </summary>
    /// <returns>Success response</returns>
    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Logout()
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized(ApiResponse.Fail("Invalid user"));
        }

        // Get refresh token from request body or header
        var refreshToken = Request.Headers["X-Refresh-Token"].FirstOrDefault();

        if (string.IsNullOrEmpty(refreshToken))
        {
            // Try to get from body
            return Ok(ApiResponse.Ok("Logged out"));
        }

        var result = await _authService.RevokeTokenAsync(refreshToken, userId.Value);

        return Ok(result);
    }

    /// <summary>
    /// Change password for authenticated user
    /// </summary>
    /// <param name="request">Password change request</param>
    /// <returns>Success response</returns>
    [HttpPost("change-password")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse.Fail("Invalid request data"));
        }

        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized(ApiResponse.Fail("Invalid user"));
        }

        var result = await _authService.ChangePasswordAsync(userId.Value, request);

        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Get current user profile
    /// </summary>
    /// <returns>User profile</returns>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<UserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetCurrentUser()
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized(ApiResponse.Fail("Invalid user"));
        }

        var user = await _authService.GetUserByIdAsync(userId.Value);
        if (user == null)
        {
            return NotFound(ApiResponse.Fail("User not found"));
        }

        var userDto = new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            FullName = user.FullName,
            AvatarUrl = user.AvatarUrl,
            IsOnline = user.IsOnline,
            LastSeen = user.LastSeen,
            CreatedAt = user.CreatedAt
        };

        return Ok(ApiResponse<UserDto>.Ok(userDto));
    }

    /// <summary>
    /// Update current user profile
    /// </summary>
    /// <param name="request">Profile update request</param>
    /// <returns>Updated user profile</returns>
    [HttpPut("profile")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<UserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<UserDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized(ApiResponse.Fail("Invalid user"));
        }

        var result = await _authService.UpdateProfileAsync(userId.Value, request);

        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Search users by term
    /// </summary>
    /// <param name="searchTerm">Search term</param>
    /// <param name="page">Page number</param>
    /// <param name="pageSize">Page size</param>
    /// <returns>List of users</returns>
    [HttpGet("users")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<UserDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> SearchUsers(
        [FromQuery] string? searchTerm = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var users = await _authService.GetUsersAsync(searchTerm, page, pageSize);
        return Ok(ApiResponse<IEnumerable<UserDto>>.Ok(users));
    }

    /// <summary>
    /// Get user by ID
    /// </summary>
    /// <param name="id">User ID</param>
    /// <returns>User profile</returns>
    [HttpGet("users/{id:guid}")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<UserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetUserById(Guid id)
    {
        var user = await _authService.GetUserByIdAsync(id);
        if (user == null)
        {
            return NotFound(ApiResponse.Fail("User not found"));
        }

        var userDto = new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            FullName = user.FullName,
            AvatarUrl = user.AvatarUrl,
            IsOnline = user.IsOnline,
            LastSeen = user.LastSeen,
            CreatedAt = user.CreatedAt
        };

        return Ok(ApiResponse<UserDto>.Ok(userDto));
    }

    /// <summary>
    /// Validate token
    /// </summary>
    /// <param name="token">Token to validate</param>
    /// <returns>Validation result</returns>
    [HttpPost("validate")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ValidateToken([FromBody] string token)
    {
        var isValid = await _authService.ValidateTokenAsync(token);
        return Ok(ApiResponse<bool>.Ok(isValid));
    }

    /// <summary>
    /// Health check endpoint
    /// </summary>
    [HttpGet("health")]
    [ProducesResponseType(typeof(string), StatusCodes.Status200OK)]
    public IActionResult Health()
    {
        return Ok("AuthService is healthy");
    }

    // ==================== Private Helper Methods ====================

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return null;
        }
        return userId;
    }
}
