using AuthService.Application.DTOs;
using SharedKernel.Common;

namespace AuthService.Application.Interfaces;

public interface IAuthService
{
    Task<Result<AuthResponse>> RegisterAsync(RegisterRequest request);
    Task<Result<AuthResponse>> LoginAsync(LoginRequest request);
    Task<Result<AuthResponse>> RefreshTokenAsync(string refreshToken);
    Task<Result> LogoutAsync(string refreshToken);
    Task<Result> ChangePasswordAsync(Guid userId, string currentPassword, string newPassword);
}
