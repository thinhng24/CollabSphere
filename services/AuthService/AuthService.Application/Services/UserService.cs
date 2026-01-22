using AuthService.Application.DTOs;
using AuthService.Application.Interfaces;
using AuthService.Domain.Entities;
using SharedKernel.Common;
using SharedKernel.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Application.Services;

public class UserService : IUserService
{
    private readonly IRepository<User> _userRepository;

    public UserService(IRepository<User> userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<Result<PagedResult<UserDto>>> GetAllUsersAsync(int pageNumber, int pageSize)
    {
        var query = _userRepository.GetAll().Where(u => !u.IsDeleted);
        var totalCount = await query.CountAsync();

        var users = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new UserDto
            {
                Id = u.Id,
                Email = u.Email,
                FullName = u.FullName,
                PhoneNumber = u.PhoneNumber,
                Role = u.Role,
                IsActive = u.IsActive,
                CreatedAt = u.CreatedAt
            })
            .ToListAsync();

        var pagedResult = new PagedResult<UserDto>
        {
            Items = users,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };

        return Result<PagedResult<UserDto>>.Success(pagedResult);
    }

    public async Task<Result<UserDto>> GetUserByIdAsync(Guid id)
    {
        var user = await _userRepository.GetByIdAsync(id);

        if (user == null || user.IsDeleted)
            return Result<UserDto>.Failure("User not found");

        var userDto = new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            FullName = user.FullName,
            PhoneNumber = user.PhoneNumber,
            Role = user.Role,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt
        };

        return Result<UserDto>.Success(userDto);
    }

    public async Task<Result<UserDto>> GetUserByEmailAsync(string email)
    {
        var user = await _userRepository.GetAll()
            .FirstOrDefaultAsync(u => u.Email == email && !u.IsDeleted);

        if (user == null)
            return Result<UserDto>.Failure("User not found");

        var userDto = new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            FullName = user.FullName,
            PhoneNumber = user.PhoneNumber,
            Role = user.Role,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt
        };

        return Result<UserDto>.Success(userDto);
    }

    public async Task<Result<UserDto>> UpdateUserAsync(Guid id, UpdateUserRequest request)
    {
        var user = await _userRepository.GetByIdAsync(id);

        if (user == null || user.IsDeleted)
            return Result<UserDto>.Failure("User not found");

        if (!string.IsNullOrEmpty(request.FullName))
            user.FullName = request.FullName;

        if (!string.IsNullOrEmpty(request.PhoneNumber))
            user.PhoneNumber = request.PhoneNumber;

        user.UpdatedAt = DateTime.UtcNow;
        await _userRepository.UpdateAsync(user);

        var userDto = new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            FullName = user.FullName,
            PhoneNumber = user.PhoneNumber,
            Role = user.Role,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt
        };

        return Result<UserDto>.Success(userDto);
    }

    public async Task<Result> DeactivateUserAsync(Guid id)
    {
        var user = await _userRepository.GetByIdAsync(id);

        if (user == null || user.IsDeleted)
            return Result.Failure("User not found");

        user.IsActive = false;
        user.UpdatedAt = DateTime.UtcNow;
        await _userRepository.UpdateAsync(user);

        return Result.Success();
    }

    public async Task<Result> ActivateUserAsync(Guid id)
    {
        var user = await _userRepository.GetByIdAsync(id);

        if (user == null || user.IsDeleted)
            return Result.Failure("User not found");

        user.IsActive = true;
        user.UpdatedAt = DateTime.UtcNow;
        await _userRepository.UpdateAsync(user);

        return Result.Success();
    }
}
