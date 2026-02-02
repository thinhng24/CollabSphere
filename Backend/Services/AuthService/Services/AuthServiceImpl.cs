using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using AuthService.Data;
using AuthService.Models;
using AuthService.Models.DTOs;
using EventBus.Abstractions;
using EventBus.Events;

namespace AuthService.Services;

/// <summary>
/// Implementation of authentication service
/// </summary>
public class AuthServiceImpl : IAuthService
{
    private readonly AuthDbContext _context;
    private readonly JwtSettings _jwtSettings;
    private readonly ILogger<AuthServiceImpl> _logger;
    private readonly IEventBus _eventBus;

    public AuthServiceImpl(
        AuthDbContext context,
        IOptions<JwtSettings> jwtSettings,
        ILogger<AuthServiceImpl> logger,
        IEventBus eventBus)
    {
        _context = context;
        _jwtSettings = jwtSettings.Value;
        _logger = logger;
        _eventBus = eventBus;
    }

    public async Task<ApiResponse<AuthResponse>> RegisterAsync(RegisterRequest request)
    {
        try
        {
            // Check if email already exists
            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            {
                return ApiResponse<AuthResponse>.Fail("Email is already registered", "EMAIL_EXISTS");
            }

            // Check if username already exists
            if (await _context.Users.AnyAsync(u => u.Username == request.Username))
            {
                return ApiResponse<AuthResponse>.Fail("Username is already taken", "USERNAME_EXISTS");
            }

            // Create new user
            var user = new User
            {
                Id = Guid.NewGuid(),
                Username = request.Username,
                Email = request.Email.ToLower(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                FullName = request.FullName ?? request.Username,
                AvatarUrl = $"https://api.dicebear.com/7.x/avataaars/svg?seed={request.Username}",
                IsOnline = true,
                IsActive = true,
                EmailConfirmed = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Generate tokens
            var authResponse = await GenerateAuthResponseAsync(user);

            _logger.LogInformation("User registered successfully: {Email}", user.Email);

            // Publish UserRegisteredEvent
            try
            {
                await _eventBus.PublishAsync(new UserRegisteredEvent
                {
                    UserId = user.Id,
                    UserName = user.Username,
                    Email = user.Email,
                    DisplayName = user.FullName,
                    AvatarUrl = user.AvatarUrl,
                    RegisteredAt = user.CreatedAt
                });
                _logger.LogDebug("Published UserRegisteredEvent for user: {UserId}", user.Id);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to publish UserRegisteredEvent for user: {UserId}", user.Id);
            }

            return ApiResponse<AuthResponse>.Ok(authResponse, "Registration successful");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during registration for email: {Email}", request.Email);
            return ApiResponse<AuthResponse>.Fail("An error occurred during registration");
        }
    }

    public async Task<ApiResponse<AuthResponse>> LoginAsync(LoginRequest request)
    {
        try
        {
            var user = await ValidateCredentialsAsync(request.Email, request.Password);
            if (user == null)
            {
                return ApiResponse<AuthResponse>.Fail("Invalid email or password", "INVALID_CREDENTIALS");
            }

            if (!user.IsActive)
            {
                return ApiResponse<AuthResponse>.Fail("Account is deactivated", "ACCOUNT_INACTIVE");
            }

            // Update online status
            user.IsOnline = true;
            user.LastSeen = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Generate tokens
            var authResponse = await GenerateAuthResponseAsync(user);

            _logger.LogInformation("User logged in: {Email}", user.Email);

            return ApiResponse<AuthResponse>.Ok(authResponse, "Login successful");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login for email: {Email}", request.Email);
            return ApiResponse<AuthResponse>.Fail("An error occurred during login");
        }
    }

    public async Task<ApiResponse<AuthResponse>> RefreshTokenAsync(RefreshTokenRequest request)
    {
        try
        {
            // Find the refresh token
            var refreshToken = await _context.RefreshTokens
                .Include(rt => rt.User)
                .FirstOrDefaultAsync(rt => rt.Token == request.RefreshToken);

            if (refreshToken == null)
            {
                return ApiResponse<AuthResponse>.Fail("Invalid refresh token", "INVALID_TOKEN");
            }

            if (!refreshToken.IsActive)
            {
                // Token has been revoked or expired
                // Revoke all descendant tokens
                await RevokeDescendantTokensAsync(refreshToken, "Attempted reuse of revoked token");
                return ApiResponse<AuthResponse>.Fail("Refresh token has been revoked", "TOKEN_REVOKED");
            }

            var user = refreshToken.User;
            if (!user.IsActive)
            {
                return ApiResponse<AuthResponse>.Fail("Account is deactivated", "ACCOUNT_INACTIVE");
            }

            // Rotate refresh token
            var newRefreshToken = await RotateRefreshTokenAsync(refreshToken);

            // Generate new access token
            var accessToken = GenerateAccessToken(user);
            var accessTokenExpiry = DateTime.UtcNow.AddMinutes(_jwtSettings.ExpiryMinutes);

            var authResponse = new AuthResponse
            {
                AccessToken = accessToken,
                RefreshToken = newRefreshToken.Token,
                AccessTokenExpiresAt = accessTokenExpiry,
                RefreshTokenExpiresAt = newRefreshToken.ExpiresAt,
                User = MapToUserDto(user)
            };

            _logger.LogInformation("Token refreshed for user: {UserId}", user.Id);

            return ApiResponse<AuthResponse>.Ok(authResponse);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during token refresh");
            return ApiResponse<AuthResponse>.Fail("An error occurred during token refresh");
        }
    }

    public async Task<ApiResponse> RevokeTokenAsync(string refreshToken, Guid userId)
    {
        try
        {
            var token = await _context.RefreshTokens
                .FirstOrDefaultAsync(rt => rt.Token == refreshToken && rt.UserId == userId);

            if (token == null)
            {
                return ApiResponse.Fail("Token not found", "TOKEN_NOT_FOUND");
            }

            if (!token.IsActive)
            {
                return ApiResponse.Ok("Token already revoked");
            }

            token.RevokedAt = DateTime.UtcNow;
            token.ReasonRevoked = "User logout";

            // Update user online status
            var user = await _context.Users.FindAsync(userId);
            if (user != null)
            {
                user.IsOnline = false;
                user.LastSeen = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Token revoked for user: {UserId}", userId);

            return ApiResponse.Ok("Logged out successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error revoking token for user: {UserId}", userId);
            return ApiResponse.Fail("An error occurred during logout");
        }
    }

    public async Task<ApiResponse> ChangePasswordAsync(Guid userId, ChangePasswordRequest request)
    {
        try
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return ApiResponse.Fail("User not found", "USER_NOT_FOUND");
            }

            if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            {
                return ApiResponse.Fail("Current password is incorrect", "INVALID_PASSWORD");
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            user.UpdatedAt = DateTime.UtcNow;

            // Revoke all refresh tokens for security
            var activeTokens = await _context.RefreshTokens
                .Where(rt => rt.UserId == userId && rt.RevokedAt == null)
                .ToListAsync();

            foreach (var token in activeTokens)
            {
                token.RevokedAt = DateTime.UtcNow;
                token.ReasonRevoked = "Password changed";
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Password changed for user: {UserId}", userId);

            return ApiResponse.Ok("Password changed successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error changing password for user: {UserId}", userId);
            return ApiResponse.Fail("An error occurred while changing password");
        }
    }

    public async Task<User?> GetUserByIdAsync(Guid userId)
    {
        return await _context.Users.FindAsync(userId);
    }

    public async Task<User?> GetUserByEmailAsync(string email)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.Email == email.ToLower());
    }

    public async Task<ApiResponse<UserDto>> UpdateProfileAsync(Guid userId, UpdateProfileRequest request)
    {
        try
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return ApiResponse<UserDto>.Fail("User not found", "USER_NOT_FOUND");
            }

            if (request.FullName != null)
                user.FullName = request.FullName;

            if (request.AvatarUrl != null)
                user.AvatarUrl = request.AvatarUrl;

            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Profile updated for user: {UserId}", userId);

            // Publish UserProfileUpdatedEvent
            try
            {
                var updatedFields = new List<string>();
                if (request.FullName != null) updatedFields.Add("FullName");
                if (request.AvatarUrl != null) updatedFields.Add("AvatarUrl");

                await _eventBus.PublishAsync(new UserProfileUpdatedEvent
                {
                    UserId = user.Id,
                    UserName = user.Username,
                    DisplayName = user.FullName,
                    AvatarUrl = user.AvatarUrl,
                    UpdatedFields = updatedFields,
                    UpdatedAt = user.UpdatedAt ?? DateTime.UtcNow
                });
                _logger.LogDebug("Published UserProfileUpdatedEvent for user: {UserId}", userId);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to publish UserProfileUpdatedEvent for user: {UserId}", userId);
            }

            return ApiResponse<UserDto>.Ok(MapToUserDto(user), "Profile updated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating profile for user: {UserId}", userId);
            return ApiResponse<UserDto>.Fail("An error occurred while updating profile");
        }
    }

    public async Task<User?> ValidateCredentialsAsync(string email, string password)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == email.ToLower());

        if (user == null)
            return null;

        if (!BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
            return null;

        return user;
    }

    public async Task UpdateUserOnlineStatusAsync(Guid userId, bool isOnline)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user != null)
        {
            user.IsOnline = isOnline;
            user.LastSeen = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }

    public async Task<IEnumerable<UserDto>> GetUsersAsync(string? searchTerm = null, int page = 1, int pageSize = 20)
    {
        var query = _context.Users.AsQueryable();

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var term = searchTerm.ToLower();
            query = query.Where(u =>
                u.Username.ToLower().Contains(term) ||
                u.Email.ToLower().Contains(term) ||
                u.FullName.ToLower().Contains(term));
        }

        var users = await query
            .OrderBy(u => u.Username)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return users.Select(MapToUserDto);
    }

    public async Task<bool> ValidateTokenAsync(string token)
    {
        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_jwtSettings.SecretKey);

            tokenHandler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidIssuer = _jwtSettings.Issuer,
                ValidateAudience = true,
                ValidAudience = _jwtSettings.Audience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            }, out SecurityToken validatedToken);

            return true;
        }
        catch
        {
            return false;
        }
    }

    // ==================== Private Helper Methods ====================

    private async Task<AuthResponse> GenerateAuthResponseAsync(User user)
    {
        var accessToken = GenerateAccessToken(user);
        var refreshToken = await GenerateRefreshTokenAsync(user.Id);
        var accessTokenExpiry = DateTime.UtcNow.AddMinutes(_jwtSettings.ExpiryMinutes);

        return new AuthResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken.Token,
            AccessTokenExpiresAt = accessTokenExpiry,
            RefreshTokenExpiresAt = refreshToken.ExpiresAt,
            User = MapToUserDto(user)
        };
    }

    private string GenerateAccessToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.SecretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.Username),
            new(ClaimTypes.Email, user.Email),
            new("fullName", user.FullName),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64)
        };

        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_jwtSettings.ExpiryMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private async Task<RefreshToken> GenerateRefreshTokenAsync(Guid userId)
    {
        var refreshToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Token = GenerateSecureToken(),
            ExpiresAt = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpiryDays),
            CreatedAt = DateTime.UtcNow
        };

        _context.RefreshTokens.Add(refreshToken);
        await _context.SaveChangesAsync();

        return refreshToken;
    }

    private async Task<RefreshToken> RotateRefreshTokenAsync(RefreshToken oldToken)
    {
        var newToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = oldToken.UserId,
            Token = GenerateSecureToken(),
            ExpiresAt = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpiryDays),
            CreatedAt = DateTime.UtcNow
        };

        // Revoke old token
        oldToken.RevokedAt = DateTime.UtcNow;
        oldToken.ReplacedByToken = newToken.Token;
        oldToken.ReasonRevoked = "Rotated";

        _context.RefreshTokens.Add(newToken);
        await _context.SaveChangesAsync();

        return newToken;
    }

    private async Task RevokeDescendantTokensAsync(RefreshToken token, string reason)
    {
        if (!string.IsNullOrEmpty(token.ReplacedByToken))
        {
            var childToken = await _context.RefreshTokens
                .FirstOrDefaultAsync(rt => rt.Token == token.ReplacedByToken);

            if (childToken != null)
            {
                if (childToken.IsActive)
                {
                    childToken.RevokedAt = DateTime.UtcNow;
                    childToken.ReasonRevoked = reason;
                }

                await RevokeDescendantTokensAsync(childToken, reason);
            }
        }

        await _context.SaveChangesAsync();
    }

    private static string GenerateSecureToken()
    {
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }

    private static UserDto MapToUserDto(User user)
    {
        return new UserDto
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
    }
}

/// <summary>
/// JWT Settings configuration
/// </summary>
public class JwtSettings
{
    public string SecretKey { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public int ExpiryMinutes { get; set; } = 60;
    public int RefreshTokenExpiryDays { get; set; } = 7;
}
