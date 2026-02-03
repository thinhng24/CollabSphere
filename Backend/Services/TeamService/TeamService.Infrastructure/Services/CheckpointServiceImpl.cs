using Microsoft.EntityFrameworkCore;
using TeamService.Application.DTOs;
using TeamService.Application.Interfaces;
using TeamService.Domain.Entities;
using SharedKernel.Common;
using SharedKernel.Interfaces;

using TeamService.Infrastructure.Data;
namespace TeamService.Infrastructure.Services;

public class CheckpointServiceImpl : ICheckpointService
{
    private readonly IRepository<Checkpoint> _checkpointRepository;
    private readonly TeamDbContext _assignmentRepository;
    private readonly IRepository<CheckpointSubmission> _submissionRepository;

    public CheckpointServiceImpl(
        IRepository<Checkpoint> checkpointRepository,
        TeamDbContext assignmentRepository,
        IRepository<CheckpointSubmission> submissionRepository)
    {
        _checkpointRepository = checkpointRepository;
        _assignmentRepository = assignmentRepository;
        _submissionRepository = submissionRepository;
    }

    public async Task<Result<CheckpointDto>> CreateCheckpointAsync(CreateCheckpointDto dto, Guid createdBy)
    {
        var checkpoint = new Checkpoint
        {
            TeamId = dto.TeamId,
            Name = dto.Name,
            Description = dto.Description,
            DueDate = dto.DueDate,
            CreatedBy = createdBy
        };

        await _checkpointRepository.AddAsync(checkpoint);

        // Add assignments
        if (dto.AssignedStudents.Any())
        {
            var assignments = dto.AssignedStudents.Select(studentId => new CheckpointAssignment
            {
                CheckpointId = checkpoint.Id,
                StudentId = studentId
            }).ToList();

            await _assignmentRepository.AddRangeAsync(assignments);
        }

        return await GetCheckpointByIdAsync(checkpoint.Id);
    }

    public async Task<Result<CheckpointDto>> GetCheckpointByIdAsync(Guid id)
    {
        var checkpoint = await _checkpointRepository.GetAll()
            .Include(c => c.CheckpointAssignments)
            .Include(c => c.CheckpointSubmissions)
            .FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted);

        if (checkpoint == null)
        {
            return Result<CheckpointDto>.Failure("Checkpoint not found", "NOT_FOUND");
        }

        var checkpointDto = new CheckpointDto
        {
            Id = checkpoint.Id,
            TeamId = checkpoint.TeamId,
            Name = checkpoint.Name,
            Description = checkpoint.Description,
            DueDate = checkpoint.DueDate,
            Status = checkpoint.Status,
            CreatedBy = checkpoint.CreatedBy,
            CreatedAt = checkpoint.CreatedAt,
            UpdatedAt = checkpoint.UpdatedAt,
            AssignedStudents = checkpoint.CheckpointAssignments.Select(a => a.StudentId).ToList(),
            Submissions = checkpoint.CheckpointSubmissions.Select(s => new CheckpointSubmissionDto
            {
                Id = s.Id,
                CheckpointId = s.CheckpointId,
                TeamId = s.TeamId,
                FileUrl = s.FileUrl,
                Description = s.Description,
                SubmittedAt = s.SubmittedAt,
                SubmittedBy = s.SubmittedBy
            }).ToList()
        };

        return Result<CheckpointDto>.Success(checkpointDto);
    }

    public async Task<Result<List<CheckpointDto>>> GetCheckpointsByTeamAsync(Guid teamId)
    {
        var checkpoints = await _checkpointRepository.GetAll()
            .Include(c => c.CheckpointAssignments)
            .Include(c => c.CheckpointSubmissions)
            .Where(c => c.TeamId == teamId && !c.IsDeleted)
            .Select(c => new CheckpointDto
            {
                Id = c.Id,
                TeamId = c.TeamId,
                Name = c.Name,
                Description = c.Description,
                DueDate = c.DueDate,
                Status = c.Status,
                CreatedBy = c.CreatedBy,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt,
                AssignedStudents = c.CheckpointAssignments.Select(a => a.StudentId).ToList(),
                Submissions = c.CheckpointSubmissions.Select(s => new CheckpointSubmissionDto
                {
                    Id = s.Id,
                    CheckpointId = s.CheckpointId,
                    TeamId = s.TeamId,
                    FileUrl = s.FileUrl,
                    Description = s.Description,
                    SubmittedAt = s.SubmittedAt,
                    SubmittedBy = s.SubmittedBy
                }).ToList()
            })
            .ToListAsync();

        return Result<List<CheckpointDto>>.Success(checkpoints);
    }

    public async Task<Result<CheckpointDto>> UpdateCheckpointAsync(Guid id, UpdateCheckpointDto dto)
    {
        var checkpoint = await _checkpointRepository.GetByIdAsync(id);

        if (checkpoint == null || checkpoint.IsDeleted)
        {
            return Result<CheckpointDto>.Failure("Checkpoint not found", "NOT_FOUND");
        }

        checkpoint.Name = dto.Name;
        checkpoint.Description = dto.Description;
        checkpoint.DueDate = dto.DueDate;
        checkpoint.Status = dto.Status;
        checkpoint.UpdatedAt = DateTime.UtcNow;

        await _checkpointRepository.UpdateAsync(checkpoint);

        return await GetCheckpointByIdAsync(checkpoint.Id);
    }

    public async Task<Result> DeleteCheckpointAsync(Guid id)
    {
        var checkpoint = await _checkpointRepository.GetByIdAsync(id);

        if (checkpoint == null || checkpoint.IsDeleted)
        {
            return Result.Failure("Checkpoint not found", "NOT_FOUND");
        }

        checkpoint.IsDeleted = true;
        checkpoint.DeletedAt = DateTime.UtcNow;

        await _checkpointRepository.UpdateAsync(checkpoint);

        return Result.Success("Checkpoint deleted successfully");
    }

    public async Task<Result<CheckpointSubmissionDto>> SubmitCheckpointAsync(CreateCheckpointSubmissionDto dto, Guid teamId, Guid submittedBy)
    {
        var checkpoint = await _checkpointRepository.GetByIdAsync(dto.CheckpointId);

        if (checkpoint == null || checkpoint.IsDeleted)
        {
            return Result<CheckpointSubmissionDto>.Failure("Checkpoint not found", "NOT_FOUND");
        }

        var submission = new CheckpointSubmission
        {
            CheckpointId = dto.CheckpointId,
            TeamId = teamId,
            FileUrl = dto.FileUrl,
            Description = dto.Description,
            SubmittedAt = DateTime.UtcNow,
            SubmittedBy = submittedBy
        };

        await _submissionRepository.AddAsync(submission);

        var submissionDto = new CheckpointSubmissionDto
        {
            Id = submission.Id,
            CheckpointId = submission.CheckpointId,
            TeamId = submission.TeamId,
            FileUrl = submission.FileUrl,
            Description = submission.Description,
            SubmittedAt = submission.SubmittedAt,
            SubmittedBy = submission.SubmittedBy
        };

        return Result<CheckpointSubmissionDto>.Success(submissionDto);
    }

    public async Task<Result<List<CheckpointSubmissionDto>>> GetCheckpointSubmissionsAsync(Guid checkpointId)
    {
        var submissions = await _submissionRepository.GetAll()
            .Where(s => s.CheckpointId == checkpointId && !s.IsDeleted)
            .Select(s => new CheckpointSubmissionDto
            {
                Id = s.Id,
                CheckpointId = s.CheckpointId,
                TeamId = s.TeamId,
                FileUrl = s.FileUrl,
                Description = s.Description,
                SubmittedAt = s.SubmittedAt,
                SubmittedBy = s.SubmittedBy
            })
            .ToListAsync();

        return Result<List<CheckpointSubmissionDto>>.Success(submissions);
    }
}
