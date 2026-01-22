using AuthService.Application.DTOs;
using SharedKernel.Common;

namespace AuthService.Application.Interfaces;

public interface IUserService
{
    Task<Result<PagedResult<UserDto>>> GetAllUsersAsync(int pageNumber, int pageSize);
    Task<Result<UserDto>> GetUserByIdAsync(Guid id);
    Task<Result<UserDto>> GetUserByEmailAsync(string email);
    Task<Result<UserDto>> UpdateUserAsync(Guid id, UpdateUserRequest request);
    Task<Result> DeactivateUserAsync(Guid id);
    Task<Result> ActivateUserAsync(Guid id);
}
