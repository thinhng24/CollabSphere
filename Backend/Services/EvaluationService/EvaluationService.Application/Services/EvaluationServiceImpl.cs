using Microsoft.EntityFrameworkCore;
using EvaluationService.Application.DTOs;
using EvaluationService.Application.Interfaces;
using EvaluationService.Domain.Entities;
using SharedKernel.Common;
using SharedKernel.Interfaces;

namespace EvaluationService.Application.Services;

public class EvaluationServiceImpl : IEvaluationService
{
    private readonly IRepository<TeamEvaluation> _teamEvaluationRepository;
    private readonly IRepository<MemberEvaluation> _memberEvaluationRepository;
    private readonly IRepository<MilestoneAnswerEvaluation> _milestoneAnswerEvaluationRepository;
    private readonly IRepository<CheckpointEvaluation> _checkpointEvaluationRepository;

    public EvaluationServiceImpl(
        IRepository<TeamEvaluation> teamEvaluationRepository,
        IRepository<MemberEvaluation> memberEvaluationRepository,
        IRepository<MilestoneAnswerEvaluation> milestoneAnswerEvaluationRepository,
        IRepository<CheckpointEvaluation> checkpointEvaluationRepository)
    {
        _teamEvaluationRepository = teamEvaluationRepository;
        _memberEvaluationRepository = memberEvaluationRepository;
        _milestoneAnswerEvaluationRepository = milestoneAnswerEvaluationRepository;
        _checkpointEvaluationRepository = checkpointEvaluationRepository;
    }

    #region Team Evaluations

    public async Task<Result<TeamEvaluationDto>> CreateTeamEvaluationAsync(CreateTeamEvaluationDto dto, Guid evaluatorId)
    {
        var evaluation = new TeamEvaluation
        {
            TeamId = dto.TeamId,
            EvaluatorId = evaluatorId,
            EvaluatorType = dto.EvaluatorType,
            Score = dto.Score,
            Comments = dto.Comments,
            EvaluatedAt = DateTime.UtcNow
        };

        await _teamEvaluationRepository.AddAsync(evaluation);

        var evaluationDto = new TeamEvaluationDto
        {
            Id = evaluation.Id,
            TeamId = evaluation.TeamId,
            EvaluatorId = evaluation.EvaluatorId,
            EvaluatorType = evaluation.EvaluatorType,
            Score = evaluation.Score,
            Comments = evaluation.Comments,
            EvaluatedAt = evaluation.EvaluatedAt,
            CreatedAt = evaluation.CreatedAt,
            UpdatedAt = evaluation.UpdatedAt
        };

        return Result<TeamEvaluationDto>.Success(evaluationDto, "Team evaluation created successfully");
    }

    public async Task<Result<TeamEvaluationDto>> GetTeamEvaluationByIdAsync(Guid id)
    {
        var evaluation = await _teamEvaluationRepository.GetByIdAsync(id);

        if (evaluation == null || evaluation.IsDeleted)
        {
            return Result<TeamEvaluationDto>.Failure("Team evaluation not found", "NOT_FOUND");
        }

        var evaluationDto = new TeamEvaluationDto
        {
            Id = evaluation.Id,
            TeamId = evaluation.TeamId,
            EvaluatorId = evaluation.EvaluatorId,
            EvaluatorType = evaluation.EvaluatorType,
            Score = evaluation.Score,
            Comments = evaluation.Comments,
            EvaluatedAt = evaluation.EvaluatedAt,
            CreatedAt = evaluation.CreatedAt,
            UpdatedAt = evaluation.UpdatedAt
        };

        return Result<TeamEvaluationDto>.Success(evaluationDto);
    }

    public async Task<Result<List<TeamEvaluationDto>>> GetTeamEvaluationsByTeamIdAsync(Guid teamId)
    {
        var evaluations = await _teamEvaluationRepository.GetAll()
            .Where(e => e.TeamId == teamId && !e.IsDeleted)
            .Select(e => new TeamEvaluationDto
            {
                Id = e.Id,
                TeamId = e.TeamId,
                EvaluatorId = e.EvaluatorId,
                EvaluatorType = e.EvaluatorType,
                Score = e.Score,
                Comments = e.Comments,
                EvaluatedAt = e.EvaluatedAt,
                CreatedAt = e.CreatedAt,
                UpdatedAt = e.UpdatedAt
            })
            .ToListAsync();

        return Result<List<TeamEvaluationDto>>.Success(evaluations);
    }

    public async Task<Result<List<TeamEvaluationDto>>> GetTeamEvaluationsByEvaluatorIdAsync(Guid evaluatorId)
    {
        var evaluations = await _teamEvaluationRepository.GetAll()
            .Where(e => e.EvaluatorId == evaluatorId && !e.IsDeleted)
            .Select(e => new TeamEvaluationDto
            {
                Id = e.Id,
                TeamId = e.TeamId,
                EvaluatorId = e.EvaluatorId,
                EvaluatorType = e.EvaluatorType,
                Score = e.Score,
                Comments = e.Comments,
                EvaluatedAt = e.EvaluatedAt,
                CreatedAt = e.CreatedAt,
                UpdatedAt = e.UpdatedAt
            })
            .ToListAsync();

        return Result<List<TeamEvaluationDto>>.Success(evaluations);
    }

    public async Task<Result<TeamEvaluationDto>> UpdateTeamEvaluationAsync(Guid id, UpdateTeamEvaluationDto dto)
    {
        var evaluation = await _teamEvaluationRepository.GetByIdAsync(id);

        if (evaluation == null || evaluation.IsDeleted)
        {
            return Result<TeamEvaluationDto>.Failure("Team evaluation not found", "NOT_FOUND");
        }

        evaluation.Score = dto.Score;
        evaluation.Comments = dto.Comments;
        evaluation.UpdatedAt = DateTime.UtcNow;

        await _teamEvaluationRepository.UpdateAsync(evaluation);

        var evaluationDto = new TeamEvaluationDto
        {
            Id = evaluation.Id,
            TeamId = evaluation.TeamId,
            EvaluatorId = evaluation.EvaluatorId,
            EvaluatorType = evaluation.EvaluatorType,
            Score = evaluation.Score,
            Comments = evaluation.Comments,
            EvaluatedAt = evaluation.EvaluatedAt,
            CreatedAt = evaluation.CreatedAt,
            UpdatedAt = evaluation.UpdatedAt
        };

        return Result<TeamEvaluationDto>.Success(evaluationDto, "Team evaluation updated successfully");
    }

    public async Task<Result> DeleteTeamEvaluationAsync(Guid id)
    {
        var evaluation = await _teamEvaluationRepository.GetByIdAsync(id);

        if (evaluation == null || evaluation.IsDeleted)
        {
            return Result.Failure("Team evaluation not found", "NOT_FOUND");
        }

        evaluation.IsDeleted = true;
        evaluation.DeletedAt = DateTime.UtcNow;

        await _teamEvaluationRepository.UpdateAsync(evaluation);

        return Result.Success("Team evaluation deleted successfully");
    }

    #endregion

    #region Member Evaluations

    public async Task<Result<MemberEvaluationDto>> CreateMemberEvaluationAsync(CreateMemberEvaluationDto dto, Guid evaluatorId)
    {
        var evaluation = new MemberEvaluation
        {
            TeamId = dto.TeamId,
            EvaluatedStudentId = dto.EvaluatedStudentId,
            EvaluatorId = evaluatorId,
            EvaluatorType = dto.EvaluatorType,
            Score = dto.Score,
            Comments = dto.Comments,
            EvaluatedAt = DateTime.UtcNow
        };

        await _memberEvaluationRepository.AddAsync(evaluation);

        var evaluationDto = new MemberEvaluationDto
        {
            Id = evaluation.Id,
            TeamId = evaluation.TeamId,
            EvaluatedStudentId = evaluation.EvaluatedStudentId,
            EvaluatorId = evaluation.EvaluatorId,
            EvaluatorType = evaluation.EvaluatorType,
            Score = evaluation.Score,
            Comments = evaluation.Comments,
            EvaluatedAt = evaluation.EvaluatedAt,
            CreatedAt = evaluation.CreatedAt,
            UpdatedAt = evaluation.UpdatedAt
        };

        return Result<MemberEvaluationDto>.Success(evaluationDto, "Member evaluation created successfully");
    }

    public async Task<Result<MemberEvaluationDto>> GetMemberEvaluationByIdAsync(Guid id)
    {
        var evaluation = await _memberEvaluationRepository.GetByIdAsync(id);

        if (evaluation == null || evaluation.IsDeleted)
        {
            return Result<MemberEvaluationDto>.Failure("Member evaluation not found", "NOT_FOUND");
        }

        var evaluationDto = new MemberEvaluationDto
        {
            Id = evaluation.Id,
            TeamId = evaluation.TeamId,
            EvaluatedStudentId = evaluation.EvaluatedStudentId,
            EvaluatorId = evaluation.EvaluatorId,
            EvaluatorType = evaluation.EvaluatorType,
            Score = evaluation.Score,
            Comments = evaluation.Comments,
            EvaluatedAt = evaluation.EvaluatedAt,
            CreatedAt = evaluation.CreatedAt,
            UpdatedAt = evaluation.UpdatedAt
        };

        return Result<MemberEvaluationDto>.Success(evaluationDto);
    }

    public async Task<Result<List<MemberEvaluationDto>>> GetMemberEvaluationsByTeamIdAsync(Guid teamId)
    {
        var evaluations = await _memberEvaluationRepository.GetAll()
            .Where(e => e.TeamId == teamId && !e.IsDeleted)
            .Select(e => new MemberEvaluationDto
            {
                Id = e.Id,
                TeamId = e.TeamId,
                EvaluatedStudentId = e.EvaluatedStudentId,
                EvaluatorId = e.EvaluatorId,
                EvaluatorType = e.EvaluatorType,
                Score = e.Score,
                Comments = e.Comments,
                EvaluatedAt = e.EvaluatedAt,
                CreatedAt = e.CreatedAt,
                UpdatedAt = e.UpdatedAt
            })
            .ToListAsync();

        return Result<List<MemberEvaluationDto>>.Success(evaluations);
    }

    public async Task<Result<List<MemberEvaluationDto>>> GetMemberEvaluationsByStudentIdAsync(Guid studentId)
    {
        var evaluations = await _memberEvaluationRepository.GetAll()
            .Where(e => e.EvaluatedStudentId == studentId && !e.IsDeleted)
            .Select(e => new MemberEvaluationDto
            {
                Id = e.Id,
                TeamId = e.TeamId,
                EvaluatedStudentId = e.EvaluatedStudentId,
                EvaluatorId = e.EvaluatorId,
                EvaluatorType = e.EvaluatorType,
                Score = e.Score,
                Comments = e.Comments,
                EvaluatedAt = e.EvaluatedAt,
                CreatedAt = e.CreatedAt,
                UpdatedAt = e.UpdatedAt
            })
            .ToListAsync();

        return Result<List<MemberEvaluationDto>>.Success(evaluations);
    }

    public async Task<Result<List<MemberEvaluationDto>>> GetMemberEvaluationsByEvaluatorIdAsync(Guid evaluatorId)
    {
        var evaluations = await _memberEvaluationRepository.GetAll()
            .Where(e => e.EvaluatorId == evaluatorId && !e.IsDeleted)
            .Select(e => new MemberEvaluationDto
            {
                Id = e.Id,
                TeamId = e.TeamId,
                EvaluatedStudentId = e.EvaluatedStudentId,
                EvaluatorId = e.EvaluatorId,
                EvaluatorType = e.EvaluatorType,
                Score = e.Score,
                Comments = e.Comments,
                EvaluatedAt = e.EvaluatedAt,
                CreatedAt = e.CreatedAt,
                UpdatedAt = e.UpdatedAt
            })
            .ToListAsync();

        return Result<List<MemberEvaluationDto>>.Success(evaluations);
    }

    public async Task<Result<MemberEvaluationDto>> UpdateMemberEvaluationAsync(Guid id, UpdateMemberEvaluationDto dto)
    {
        var evaluation = await _memberEvaluationRepository.GetByIdAsync(id);

        if (evaluation == null || evaluation.IsDeleted)
        {
            return Result<MemberEvaluationDto>.Failure("Member evaluation not found", "NOT_FOUND");
        }

        evaluation.Score = dto.Score;
        evaluation.Comments = dto.Comments;
        evaluation.UpdatedAt = DateTime.UtcNow;

        await _memberEvaluationRepository.UpdateAsync(evaluation);

        var evaluationDto = new MemberEvaluationDto
        {
            Id = evaluation.Id,
            TeamId = evaluation.TeamId,
            EvaluatedStudentId = evaluation.EvaluatedStudentId,
            EvaluatorId = evaluation.EvaluatorId,
            EvaluatorType = evaluation.EvaluatorType,
            Score = evaluation.Score,
            Comments = evaluation.Comments,
            EvaluatedAt = evaluation.EvaluatedAt,
            CreatedAt = evaluation.CreatedAt,
            UpdatedAt = evaluation.UpdatedAt
        };

        return Result<MemberEvaluationDto>.Success(evaluationDto, "Member evaluation updated successfully");
    }

    public async Task<Result> DeleteMemberEvaluationAsync(Guid id)
    {
        var evaluation = await _memberEvaluationRepository.GetByIdAsync(id);

        if (evaluation == null || evaluation.IsDeleted)
        {
            return Result.Failure("Member evaluation not found", "NOT_FOUND");
        }

        evaluation.IsDeleted = true;
        evaluation.DeletedAt = DateTime.UtcNow;

        await _memberEvaluationRepository.UpdateAsync(evaluation);

        return Result.Success("Member evaluation deleted successfully");
    }

    #endregion

    #region Milestone Answer Evaluations

    public async Task<Result<MilestoneAnswerEvaluationDto>> CreateMilestoneAnswerEvaluationAsync(CreateMilestoneAnswerEvaluationDto dto, Guid evaluatorId)
    {
        var evaluation = new MilestoneAnswerEvaluation
        {
            MilestoneAnswerId = dto.MilestoneAnswerId,
            EvaluatorId = evaluatorId,
            EvaluatorType = dto.EvaluatorType,
            Score = dto.Score,
            Feedback = dto.Feedback,
            EvaluatedAt = DateTime.UtcNow
        };

        await _milestoneAnswerEvaluationRepository.AddAsync(evaluation);

        var evaluationDto = new MilestoneAnswerEvaluationDto
        {
            Id = evaluation.Id,
            MilestoneAnswerId = evaluation.MilestoneAnswerId,
            EvaluatorId = evaluation.EvaluatorId,
            EvaluatorType = evaluation.EvaluatorType,
            Score = evaluation.Score,
            Feedback = evaluation.Feedback,
            EvaluatedAt = evaluation.EvaluatedAt,
            CreatedAt = evaluation.CreatedAt,
            UpdatedAt = evaluation.UpdatedAt
        };

        return Result<MilestoneAnswerEvaluationDto>.Success(evaluationDto, "Milestone answer evaluation created successfully");
    }

    public async Task<Result<MilestoneAnswerEvaluationDto>> GetMilestoneAnswerEvaluationByIdAsync(Guid id)
    {
        var evaluation = await _milestoneAnswerEvaluationRepository.GetByIdAsync(id);

        if (evaluation == null || evaluation.IsDeleted)
        {
            return Result<MilestoneAnswerEvaluationDto>.Failure("Milestone answer evaluation not found", "NOT_FOUND");
        }

        var evaluationDto = new MilestoneAnswerEvaluationDto
        {
            Id = evaluation.Id,
            MilestoneAnswerId = evaluation.MilestoneAnswerId,
            EvaluatorId = evaluation.EvaluatorId,
            EvaluatorType = evaluation.EvaluatorType,
            Score = evaluation.Score,
            Feedback = evaluation.Feedback,
            EvaluatedAt = evaluation.EvaluatedAt,
            CreatedAt = evaluation.CreatedAt,
            UpdatedAt = evaluation.UpdatedAt
        };

        return Result<MilestoneAnswerEvaluationDto>.Success(evaluationDto);
    }

    public async Task<Result<List<MilestoneAnswerEvaluationDto>>> GetMilestoneAnswerEvaluationsByAnswerIdAsync(Guid milestoneAnswerId)
    {
        var evaluations = await _milestoneAnswerEvaluationRepository.GetAll()
            .Where(e => e.MilestoneAnswerId == milestoneAnswerId && !e.IsDeleted)
            .Select(e => new MilestoneAnswerEvaluationDto
            {
                Id = e.Id,
                MilestoneAnswerId = e.MilestoneAnswerId,
                EvaluatorId = e.EvaluatorId,
                EvaluatorType = e.EvaluatorType,
                Score = e.Score,
                Feedback = e.Feedback,
                EvaluatedAt = e.EvaluatedAt,
                CreatedAt = e.CreatedAt,
                UpdatedAt = e.UpdatedAt
            })
            .ToListAsync();

        return Result<List<MilestoneAnswerEvaluationDto>>.Success(evaluations);
    }

    public async Task<Result<List<MilestoneAnswerEvaluationDto>>> GetMilestoneAnswerEvaluationsByEvaluatorIdAsync(Guid evaluatorId)
    {
        var evaluations = await _milestoneAnswerEvaluationRepository.GetAll()
            .Where(e => e.EvaluatorId == evaluatorId && !e.IsDeleted)
            .Select(e => new MilestoneAnswerEvaluationDto
            {
                Id = e.Id,
                MilestoneAnswerId = e.MilestoneAnswerId,
                EvaluatorId = e.EvaluatorId,
                EvaluatorType = e.EvaluatorType,
                Score = e.Score,
                Feedback = e.Feedback,
                EvaluatedAt = e.EvaluatedAt,
                CreatedAt = e.CreatedAt,
                UpdatedAt = e.UpdatedAt
            })
            .ToListAsync();

        return Result<List<MilestoneAnswerEvaluationDto>>.Success(evaluations);
    }

    public async Task<Result<MilestoneAnswerEvaluationDto>> UpdateMilestoneAnswerEvaluationAsync(Guid id, UpdateMilestoneAnswerEvaluationDto dto)
    {
        var evaluation = await _milestoneAnswerEvaluationRepository.GetByIdAsync(id);

        if (evaluation == null || evaluation.IsDeleted)
        {
            return Result<MilestoneAnswerEvaluationDto>.Failure("Milestone answer evaluation not found", "NOT_FOUND");
        }

        evaluation.Score = dto.Score;
        evaluation.Feedback = dto.Feedback;
        evaluation.UpdatedAt = DateTime.UtcNow;

        await _milestoneAnswerEvaluationRepository.UpdateAsync(evaluation);

        var evaluationDto = new MilestoneAnswerEvaluationDto
        {
            Id = evaluation.Id,
            MilestoneAnswerId = evaluation.MilestoneAnswerId,
            EvaluatorId = evaluation.EvaluatorId,
            EvaluatorType = evaluation.EvaluatorType,
            Score = evaluation.Score,
            Feedback = evaluation.Feedback,
            EvaluatedAt = evaluation.EvaluatedAt,
            CreatedAt = evaluation.CreatedAt,
            UpdatedAt = evaluation.UpdatedAt
        };

        return Result<MilestoneAnswerEvaluationDto>.Success(evaluationDto, "Milestone answer evaluation updated successfully");
    }

    public async Task<Result> DeleteMilestoneAnswerEvaluationAsync(Guid id)
    {
        var evaluation = await _milestoneAnswerEvaluationRepository.GetByIdAsync(id);

        if (evaluation == null || evaluation.IsDeleted)
        {
            return Result.Failure("Milestone answer evaluation not found", "NOT_FOUND");
        }

        evaluation.IsDeleted = true;
        evaluation.DeletedAt = DateTime.UtcNow;

        await _milestoneAnswerEvaluationRepository.UpdateAsync(evaluation);

        return Result.Success("Milestone answer evaluation deleted successfully");
    }

    #endregion

    #region Checkpoint Evaluations

    public async Task<Result<CheckpointEvaluationDto>> CreateCheckpointEvaluationAsync(CreateCheckpointEvaluationDto dto, Guid evaluatorId)
    {
        var evaluation = new CheckpointEvaluation
        {
            CheckpointSubmissionId = dto.CheckpointSubmissionId,
            EvaluatorId = evaluatorId,
            Score = dto.Score,
            Feedback = dto.Feedback,
            EvaluatedAt = DateTime.UtcNow
        };

        await _checkpointEvaluationRepository.AddAsync(evaluation);

        var evaluationDto = new CheckpointEvaluationDto
        {
            Id = evaluation.Id,
            CheckpointSubmissionId = evaluation.CheckpointSubmissionId,
            EvaluatorId = evaluation.EvaluatorId,
            Score = evaluation.Score,
            Feedback = evaluation.Feedback,
            EvaluatedAt = evaluation.EvaluatedAt,
            CreatedAt = evaluation.CreatedAt,
            UpdatedAt = evaluation.UpdatedAt
        };

        return Result<CheckpointEvaluationDto>.Success(evaluationDto, "Checkpoint evaluation created successfully");
    }

    public async Task<Result<CheckpointEvaluationDto>> GetCheckpointEvaluationByIdAsync(Guid id)
    {
        var evaluation = await _checkpointEvaluationRepository.GetByIdAsync(id);

        if (evaluation == null || evaluation.IsDeleted)
        {
            return Result<CheckpointEvaluationDto>.Failure("Checkpoint evaluation not found", "NOT_FOUND");
        }

        var evaluationDto = new CheckpointEvaluationDto
        {
            Id = evaluation.Id,
            CheckpointSubmissionId = evaluation.CheckpointSubmissionId,
            EvaluatorId = evaluation.EvaluatorId,
            Score = evaluation.Score,
            Feedback = evaluation.Feedback,
            EvaluatedAt = evaluation.EvaluatedAt,
            CreatedAt = evaluation.CreatedAt,
            UpdatedAt = evaluation.UpdatedAt
        };

        return Result<CheckpointEvaluationDto>.Success(evaluationDto);
    }

    public async Task<Result<List<CheckpointEvaluationDto>>> GetCheckpointEvaluationsBySubmissionIdAsync(Guid checkpointSubmissionId)
    {
        var evaluations = await _checkpointEvaluationRepository.GetAll()
            .Where(e => e.CheckpointSubmissionId == checkpointSubmissionId && !e.IsDeleted)
            .Select(e => new CheckpointEvaluationDto
            {
                Id = e.Id,
                CheckpointSubmissionId = e.CheckpointSubmissionId,
                EvaluatorId = e.EvaluatorId,
                Score = e.Score,
                Feedback = e.Feedback,
                EvaluatedAt = e.EvaluatedAt,
                CreatedAt = e.CreatedAt,
                UpdatedAt = e.UpdatedAt
            })
            .ToListAsync();

        return Result<List<CheckpointEvaluationDto>>.Success(evaluations);
    }

    public async Task<Result<List<CheckpointEvaluationDto>>> GetCheckpointEvaluationsByEvaluatorIdAsync(Guid evaluatorId)
    {
        var evaluations = await _checkpointEvaluationRepository.GetAll()
            .Where(e => e.EvaluatorId == evaluatorId && !e.IsDeleted)
            .Select(e => new CheckpointEvaluationDto
            {
                Id = e.Id,
                CheckpointSubmissionId = e.CheckpointSubmissionId,
                EvaluatorId = e.EvaluatorId,
                Score = e.Score,
                Feedback = e.Feedback,
                EvaluatedAt = e.EvaluatedAt,
                CreatedAt = e.CreatedAt,
                UpdatedAt = e.UpdatedAt
            })
            .ToListAsync();

        return Result<List<CheckpointEvaluationDto>>.Success(evaluations);
    }

    public async Task<Result<CheckpointEvaluationDto>> UpdateCheckpointEvaluationAsync(Guid id, UpdateCheckpointEvaluationDto dto)
    {
        var evaluation = await _checkpointEvaluationRepository.GetByIdAsync(id);

        if (evaluation == null || evaluation.IsDeleted)
        {
            return Result<CheckpointEvaluationDto>.Failure("Checkpoint evaluation not found", "NOT_FOUND");
        }

        evaluation.Score = dto.Score;
        evaluation.Feedback = dto.Feedback;
        evaluation.UpdatedAt = DateTime.UtcNow;

        await _checkpointEvaluationRepository.UpdateAsync(evaluation);

        var evaluationDto = new CheckpointEvaluationDto
        {
            Id = evaluation.Id,
            CheckpointSubmissionId = evaluation.CheckpointSubmissionId,
            EvaluatorId = evaluation.EvaluatorId,
            Score = evaluation.Score,
            Feedback = evaluation.Feedback,
            EvaluatedAt = evaluation.EvaluatedAt,
            CreatedAt = evaluation.CreatedAt,
            UpdatedAt = evaluation.UpdatedAt
        };

        return Result<CheckpointEvaluationDto>.Success(evaluationDto, "Checkpoint evaluation updated successfully");
    }

    public async Task<Result> DeleteCheckpointEvaluationAsync(Guid id)
    {
        var evaluation = await _checkpointEvaluationRepository.GetByIdAsync(id);

        if (evaluation == null || evaluation.IsDeleted)
        {
            return Result.Failure("Checkpoint evaluation not found", "NOT_FOUND");
        }

        evaluation.IsDeleted = true;
        evaluation.DeletedAt = DateTime.UtcNow;

        await _checkpointEvaluationRepository.UpdateAsync(evaluation);

        return Result.Success("Checkpoint evaluation deleted successfully");
    }

    #endregion
}
