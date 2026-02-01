using Microsoft.EntityFrameworkCore;
using ProjectService.Application.DTOs;
using ProjectService.Application.Interfaces;
using ProjectService.Domain.Entities;
using SharedKernel.Common;
using SharedKernel.Enums;
using SharedKernel.Interfaces;

namespace ProjectService.Application.Services;

public class ProjectServiceImpl : IProjectService
{
    private readonly IRepository<Project> _projectRepository;
    private readonly IRepository<ProjectApproval> _approvalRepository;
    private readonly IRepository<Milestone> _milestoneRepository;
    private readonly IAIService _aiService;

    public ProjectServiceImpl(
        IRepository<Project> projectRepository,
        IRepository<ProjectApproval> approvalRepository,
        IRepository<Milestone> milestoneRepository,
        IAIService aiService)
    {
        _projectRepository = projectRepository;
        _approvalRepository = approvalRepository;
        _milestoneRepository = milestoneRepository;
        _aiService = aiService;
    }

    public async Task<Result<PagedResult<ProjectDto>>> GetAllProjectsAsync(int pageNumber, int pageSize)
    {
        var query = _projectRepository.GetAll()
            .Include(p => p.Milestones)
            .Where(p => !p.IsDeleted);
            
        var totalCount = await query.CountAsync();

        var projects = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new ProjectDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                Objectives = p.Objectives,
                SyllabusId = p.SyllabusId,
                ClassId = p.ClassId,
                Status = p.Status,
                CreatedBy = p.CreatedBy,
                CreatedAt = p.CreatedAt,
                SubmittedAt = p.SubmittedAt,
                ApprovedAt = p.ApprovedAt,
                ApprovedBy = p.ApprovedBy,
                RejectionReason = p.RejectionReason,
                Milestones = p.Milestones.Select(m => new MilestoneDto
                {
                    Id = m.Id,
                    ProjectId = m.ProjectId,
                    Title = m.Title,
                    Description = m.Description,
                    DueDate = m.DueDate,
                    Order = m.Order,
                    IsCompleted = m.IsCompleted,
                    CompletedAt = m.CompletedAt
                }).ToList()
            })
            .ToListAsync();

        var pagedResult = new PagedResult<ProjectDto>
        {
            Items = projects,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };

        return Result<PagedResult<ProjectDto>>.Success(pagedResult);
    }

    public async Task<Result<ProjectDto>> GetProjectByIdAsync(Guid id)
    {
        var project = await _projectRepository.GetAll()
            .Include(p => p.Milestones)
            .FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted);

        if (project == null)
            return Result<ProjectDto>.Failure("Project not found");

        var projectDto = new ProjectDto
        {
            Id = project.Id,
            Name = project.Name,
            Description = project.Description,
            Objectives = project.Objectives,
            SyllabusId = project.SyllabusId,
            ClassId = project.ClassId,
            Status = project.Status,
            CreatedBy = project.CreatedBy,
            CreatedAt = project.CreatedAt,
            SubmittedAt = project.SubmittedAt,
            ApprovedAt = project.ApprovedAt,
            ApprovedBy = project.ApprovedBy,
            RejectionReason = project.RejectionReason,
            Milestones = project.Milestones.Select(m => new MilestoneDto
            {
                Id = m.Id,
                ProjectId = m.ProjectId,
                Title = m.Title,
                Description = m.Description,
                DueDate = m.DueDate,
                Order = m.Order,
                IsCompleted = m.IsCompleted,
                CompletedAt = m.CompletedAt
            }).ToList()
        };

        return Result<ProjectDto>.Success(projectDto);
    }

    public async Task<Result<ProjectDto>> CreateProjectAsync(CreateProjectRequest request, Guid userId)
    {
        var project = new Project
        {
            Name = request.Name,
            Description = request.Description,
            Objectives = request.Objectives,
            SyllabusId = request.SyllabusId,
            ClassId = request.ClassId,
            Status = ProjectStatus.Pending,
            CreatedBy = userId
        };

        await _projectRepository.AddAsync(project);

        var projectDto = new ProjectDto
        {
            Id = project.Id,
            Name = project.Name,
            Description = project.Description,
            Objectives = project.Objectives,
            SyllabusId = project.SyllabusId,
            ClassId = project.ClassId,
            Status = project.Status,
            CreatedBy = project.CreatedBy,
            CreatedAt = project.CreatedAt
        };

        return Result<ProjectDto>.Success(projectDto);
    }

    public async Task<Result<ProjectDto>> UpdateProjectAsync(Guid id, UpdateProjectRequest request)
    {
        var project = await _projectRepository.GetByIdAsync(id);

        if (project == null)
            return Result<ProjectDto>.Failure("Project not found");

        if (project.Status == ProjectStatus.Approved)
            return Result<ProjectDto>.Failure("Cannot update approved project");

        if (!string.IsNullOrEmpty(request.Name))
            project.Name = request.Name;
        
        if (!string.IsNullOrEmpty(request.Description))
            project.Description = request.Description;
        
        if (!string.IsNullOrEmpty(request.Objectives))
            project.Objectives = request.Objectives;

        project.UpdatedAt = DateTime.UtcNow;

        await _projectRepository.UpdateAsync(project);

        var projectDto = new ProjectDto
        {
            Id = project.Id,
            Name = project.Name,
            Description = project.Description,
            Objectives = project.Objectives,
            Status = project.Status,
            CreatedBy = project.CreatedBy,
            CreatedAt = project.CreatedAt
        };

        return Result<ProjectDto>.Success(projectDto);
    }

    public async Task<Result> DeleteProjectAsync(Guid id)
    {
        var project = await _projectRepository.GetByIdAsync(id);

        if (project == null)
            return Result.Failure("Project not found");

        await _projectRepository.DeleteAsync(id);
        return Result.Success();
    }

    public async Task<Result> SubmitForApprovalAsync(Guid id)
    {
        var project = await _projectRepository.GetByIdAsync(id);

        if (project == null)
            return Result.Failure("Project not found");

        if (project.Status != ProjectStatus.Pending)
            return Result.Failure("Project is not in pending status");

        project.Status = ProjectStatus.Pending;
        project.SubmittedAt = DateTime.UtcNow;
        await _projectRepository.UpdateAsync(project);

        return Result.Success();
    }

    public async Task<Result> ApproveProjectAsync(Guid id, Guid reviewerId, string? comments)
    {
        var project = await _projectRepository.GetByIdAsync(id);

        if (project == null)
            return Result.Failure("Project not found");

        project.Status = ProjectStatus.Approved;
        project.ApprovedAt = DateTime.UtcNow;
        project.ApprovedBy = reviewerId;
        await _projectRepository.UpdateAsync(project);

        var approval = new ProjectApproval
        {
            ProjectId = id,
            ReviewerId = reviewerId,
            Status = ProjectStatus.Approved,
            Comments = comments,
            ReviewedAt = DateTime.UtcNow
        };

        await _approvalRepository.AddAsync(approval);

        return Result.Success();
    }

    public async Task<Result> RejectProjectAsync(Guid id, Guid reviewerId, string reason)
    {
        var project = await _projectRepository.GetByIdAsync(id);

        if (project == null)
            return Result.Failure("Project not found");

        project.Status = ProjectStatus.Denied;
        project.RejectionReason = reason;
        await _projectRepository.UpdateAsync(project);

        var approval = new ProjectApproval
        {
            ProjectId = id,
            ReviewerId = reviewerId,
            Status = ProjectStatus.Denied,
            Comments = reason,
            ReviewedAt = DateTime.UtcNow
        };

        await _approvalRepository.AddAsync(approval);

        return Result.Success();
    }

    public async Task<Result<List<MilestoneDto>>> GenerateMilestonesAsync(
        Guid projectId,
        GenerateMilestonesRequest request)
    {
        var project = await _projectRepository.GetByIdAsync(projectId);
        if (project == null)
            return Result<List<MilestoneDto>>.Failure("Project not found");

        // TODO: Fetch syllabus content if syllabusId is provided
        string? syllabusContent = null;
        if (!string.IsNullOrEmpty(request.SyllabusId))
        {
            // In production, fetch from AcademicService
            syllabusContent = "Sample syllabus content for context";
        }

        var generatedMilestones = await _aiService.GenerateMilestonesAsync(
            project.Name,
            project.Description,
            project.Objectives,
            syllabusContent,
            request.NumberOfMilestones);

        if (!generatedMilestones.IsSuccess)
            return Result<List<MilestoneDto>>.Failure(generatedMilestones.Message);

        var milestoneDtos = new List<MilestoneDto>();
        var baseDate = DateTime.UtcNow;

        foreach (var generated in generatedMilestones.Data!)
        {
            var milestone = new Milestone
            {
                ProjectId = projectId,
                Title = generated.Title,
                Description = generated.Description,
                Order = generated.Order,
                DueDate = baseDate.AddDays(generated.EstimatedDurationDays * generated.Order),
                IsCompleted = false
            };

            await _milestoneRepository.AddAsync(milestone);

            milestoneDtos.Add(new MilestoneDto
            {
                Id = milestone.Id,
                ProjectId = milestone.ProjectId,
                Title = milestone.Title,
                Description = milestone.Description,
                DueDate = milestone.DueDate,
                Order = milestone.Order,
                IsCompleted = milestone.IsCompleted
            });

            baseDate = milestone.DueDate;
        }

        return Result<List<MilestoneDto>>.Success(milestoneDtos);
    }
}
