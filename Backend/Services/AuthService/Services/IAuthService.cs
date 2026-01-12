using AuthService.Models;
using AuthService.Models.DTOs;

namespace AuthService.Services;

/// <summary>
/// Interface for authentication service operations
/// </summary>
public interface IAuthService
{
    /// <summary>
    /// Register a new user
    /// </summary>
    Task<ApiResponse<AuthResponse>> RegisterAsync(RegisterRequest request);

    /// <summary>
    /// Login with email and password
    /// </summary>
    Task<ApiResponse<AuthResponse>> LoginAsync(LoginRequest request);

    /// <summary>
    /// Refresh access token using refresh token
    /// </summary>
    Task<ApiResponse<AuthResponse>> RefreshTokenAsync(RefreshTokenRequest request);

    /// <summary>
    /// Revoke a refresh token (logout)
    /// </summary>
    Task<ApiResponse> RevokeTokenAsync(string refreshToken, Guid userId);

    /// <summary>
    /// Change user password
    /// </summary>
    Task<ApiResponse> ChangePasswordAsync(Guid userId, ChangePasswordRequest request);

    /// <summary>
    /// Get user by ID
    /// </summary>
    Task<User?> GetUserByIdAsync(Guid userId);

    /// <summary>
    /// Get user by email
    /// </summary>
    Task<User?> GetUserByEmailAsync(string email);

    /// <summary>
    /// Update user profile
    /// </summary>
    Task<ApiResponse<UserDto>> UpdateProfileAsync(Guid userId, UpdateProfileRequest request);

    /// <summary>
    /// Validate user credentials
    /// </summary>
    Task<User?> ValidateCredentialsAsync(string email, string password);

    /// <summary>
    /// Set user online status
    /// </summary>
    Task UpdateUserOnlineStatusAsync(Guid userId, bool isOnline);

    /// <summary>
    /// Get all users (for admin/search purposes)
    /// </summary>
    Task<IEnumerable<UserDto>> GetUsersAsync(string? searchTerm = null, int page = 1, int pageSize = 20);

    /// <summary>
    /// Validate if a token is valid
    /// </summary>
    Task<bool> ValidateTokenAsync(string token);
}
