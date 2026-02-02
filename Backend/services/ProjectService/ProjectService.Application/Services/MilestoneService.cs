using Microsoft.EntityFrameworkCore;
using ProjectService.Application.DTOs;
using ProjectService.Application.Interfaces;
using ProjectService.Domain.Entities;
using SharedKernel.Common;
using SharedKernel.Interfaces;

namespace ProjectService.Application.Services;

public class MilestoneService : IMilestoneService
{
    private readonly IRepository<Milestone> _milestoneRepository;
    private readonly IRepository<Project> _projectRepository;

    public MilestoneService(
        IRepository<Milestone> milestoneRepository,
        IRepository<Project> projectRepository)
    {
        _milestoneRepository = milestoneRepository;
        _projectRepository = projectRepository;
    }

    public async Task<Result<List<MilestoneDto>>> GetMilestonesByProjectIdAsync(Guid projectId)
    {
        var milestones = await _milestoneRepository.GetAll()
            .Where(m => m.ProjectId == projectId && !m.IsDeleted)
            .OrderBy(m => m.Order)
            .Select(m => new MilestoneDto
            {
                Id = m.Id,
                ProjectId = m.ProjectId,
                Title = m.Title,
                Description = m.Description,
                DueDate = m.DueDate,
                Order = m.Order,
                IsCompleted = m.IsCompleted,
                CompletedAt = m.CompletedAt
            })
            .ToListAsync();

        return Result<List<MilestoneDto>>.Success(milestones);
    }

    public async Task<Result<MilestoneDto>> GetMilestoneByIdAsync(Guid id)
    {
        var milestone = await _milestoneRepository.GetByIdAsync(id);

        if (milestone == null)
            return Result<MilestoneDto>.Failure("Milestone not found");

        var milestoneDto = new MilestoneDto
        {
            Id = milestone.Id,
            ProjectId = milestone.ProjectId,
            Title = milestone.Title,
            Description = milestone.Description,
            DueDate = milestone.DueDate,
            Order = milestone.Order,
            IsCompleted = milestone.IsCompleted,
            CompletedAt = milestone.CompletedAt
        };

        return Result<MilestoneDto>.Success(milestoneDto);
    }

    public async Task<Result<MilestoneDto>> CreateMilestoneAsync(CreateMilestoneRequest request)
    {
        var projectExists = await _projectRepository.ExistsAsync(request.ProjectId);
        if (!projectExists)
            return Result<MilestoneDto>.Failure("Project not found");

        var milestone = new Milestone
        {
            ProjectId = request.ProjectId,
            Title = request.Title,
            Description = request.Description,
            DueDate = request.DueDate,
            Order = request.Order
        };

        await _milestoneRepository.AddAsync(milestone);

        var milestoneDto = new MilestoneDto
        {
            Id = milestone.Id,
            ProjectId = milestone.ProjectId,
            Title = milestone.Title,
            Description = milestone.Description,
            DueDate = milestone.DueDate,
            Order = milestone.Order,
            IsCompleted = milestone.IsCompleted
        };

        return Result<MilestoneDto>.Success(milestoneDto);
    }

    public async Task<Result<MilestoneDto>> UpdateMilestoneAsync(Guid id, UpdateMilestoneRequest request)
    {
        var milestone = await _milestoneRepository.GetByIdAsync(id);

        if (milestone == null)
            return Result<MilestoneDto>.Failure("Milestone not found");

        if (!string.IsNullOrEmpty(request.Title))
            milestone.Title = request.Title;

        if (!string.IsNullOrEmpty(request.Description))
            milestone.Description = request.Description;

        if (request.DueDate.HasValue)
            milestone.DueDate = request.DueDate.Value;

        if (request.Order.HasValue)
            milestone.Order = request.Order.Value;

        milestone.UpdatedAt = DateTime.UtcNow;

        await _milestoneRepository.UpdateAsync(milestone);

        var milestoneDto = new MilestoneDto
        {
            Id = milestone.Id,
            ProjectId = milestone.ProjectId,
            Title = milestone.Title,
            Description = milestone.Description,
            DueDate = milestone.DueDate,
            Order = milestone.Order,
            IsCompleted = milestone.IsCompleted,
            CompletedAt = milestone.CompletedAt
        };

        return Result<MilestoneDto>.Success(milestoneDto);
    }

    public async Task<Result> DeleteMilestoneAsync(Guid id)
    {
        var milestone = await _milestoneRepository.GetByIdAsync(id);

        if (milestone == null)
            return Result.Failure("Milestone not found");

        await _milestoneRepository.DeleteAsync(id);
        return Result.Success();
    }

    public async Task<Result> CompleteMilestoneAsync(Guid id)
    {
        var milestone = await _milestoneRepository.GetByIdAsync(id);

        if (milestone == null)
            return Result.Failure("Milestone not found");

        if (milestone.IsCompleted)
            return Result.Failure("Milestone is already completed");

        milestone.IsCompleted = true;
        milestone.CompletedAt = DateTime.UtcNow;
        await _milestoneRepository.UpdateAsync(milestone);

        return Result.Success();
    }
}
