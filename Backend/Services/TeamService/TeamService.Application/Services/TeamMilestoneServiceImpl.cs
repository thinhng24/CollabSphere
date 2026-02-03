using Microsoft.EntityFrameworkCore;
using TeamService.Application.DTOs;
using TeamService.Application.Interfaces;
using TeamService.Domain.Entities;
using SharedKernel.Common;
using SharedKernel.Interfaces;

namespace TeamService.Application.Services;

public class TeamMilestoneServiceImpl : ITeamMilestoneService
{
    private readonly IRepository<TeamMilestone> _teamMilestoneRepository;
    private readonly IRepository<MilestoneQuestion> _questionRepository;
    private readonly IRepository<MilestoneAnswer> _answerRepository;

    public TeamMilestoneServiceImpl(
        IRepository<TeamMilestone> teamMilestoneRepository,
        IRepository<MilestoneQuestion> questionRepository,
        IRepository<MilestoneAnswer> answerRepository)
    {
        _teamMilestoneRepository = teamMilestoneRepository;
        _questionRepository = questionRepository;
        _answerRepository = answerRepository;
    }

    public async Task<Result<TeamMilestoneDto>> CreateTeamMilestoneAsync(CreateTeamMilestoneDto dto)
    {
        var existing = await _teamMilestoneRepository.GetAll()
            .FirstOrDefaultAsync(tm => tm.TeamId == dto.TeamId && tm.MilestoneId == dto.MilestoneId && !tm.IsDeleted);

        if (existing != null)
        {
            return Result<TeamMilestoneDto>.Failure("Team milestone already exists", "DUPLICATE");
        }

        var teamMilestone = new TeamMilestone
        {
            TeamId = dto.TeamId,
            MilestoneId = dto.MilestoneId
        };

        await _teamMilestoneRepository.AddAsync(teamMilestone);

        return await GetTeamMilestoneByIdAsync(teamMilestone.Id);
    }

    public async Task<Result<TeamMilestoneDto>> GetTeamMilestoneByIdAsync(Guid id)
    {
        var teamMilestone = await _teamMilestoneRepository.GetByIdAsync(id);

        if (teamMilestone == null || teamMilestone.IsDeleted)
        {
            return Result<TeamMilestoneDto>.Failure("Team milestone not found", "NOT_FOUND");
        }

        var dto = new TeamMilestoneDto
        {
            Id = teamMilestone.Id,
            TeamId = teamMilestone.TeamId,
            MilestoneId = teamMilestone.MilestoneId,
            Status = teamMilestone.Status,
            CompletedAt = teamMilestone.CompletedAt,
            MarkedBy = teamMilestone.MarkedBy,
            CreatedAt = teamMilestone.CreatedAt,
            UpdatedAt = teamMilestone.UpdatedAt
        };

        return Result<TeamMilestoneDto>.Success(dto);
    }

    public async Task<Result<List<TeamMilestoneDto>>> GetTeamMilestonesByTeamAsync(Guid teamId)
    {
        var teamMilestones = await _teamMilestoneRepository.GetAll()
            .Where(tm => tm.TeamId == teamId && !tm.IsDeleted)
            .Select(tm => new TeamMilestoneDto
            {
                Id = tm.Id,
                TeamId = tm.TeamId,
                MilestoneId = tm.MilestoneId,
                Status = tm.Status,
                CompletedAt = tm.CompletedAt,
                MarkedBy = tm.MarkedBy,
                CreatedAt = tm.CreatedAt,
                UpdatedAt = tm.UpdatedAt
            })
            .ToListAsync();

        return Result<List<TeamMilestoneDto>>.Success(teamMilestones);
    }

    public async Task<Result<List<TeamMilestoneDto>>> GetTeamMilestonesByMilestoneAsync(Guid milestoneId)
    {
        var teamMilestones = await _teamMilestoneRepository.GetAll()
            .Where(tm => tm.MilestoneId == milestoneId && !tm.IsDeleted)
            .Select(tm => new TeamMilestoneDto
            {
                Id = tm.Id,
                TeamId = tm.TeamId,
                MilestoneId = tm.MilestoneId,
                Status = tm.Status,
                CompletedAt = tm.CompletedAt,
                MarkedBy = tm.MarkedBy,
                CreatedAt = tm.CreatedAt,
                UpdatedAt = tm.UpdatedAt
            })
            .ToListAsync();

        return Result<List<TeamMilestoneDto>>.Success(teamMilestones);
    }

    public async Task<Result<TeamMilestoneDto>> UpdateTeamMilestoneAsync(Guid id, UpdateTeamMilestoneDto dto, Guid markedBy)
    {
        var teamMilestone = await _teamMilestoneRepository.GetByIdAsync(id);

        if (teamMilestone == null || teamMilestone.IsDeleted)
        {
            return Result<TeamMilestoneDto>.Failure("Team milestone not found", "NOT_FOUND");
        }

        teamMilestone.Status = dto.Status;
        teamMilestone.UpdatedAt = DateTime.UtcNow;

        if (dto.Status == Domain.Enums.TeamMilestoneStatus.Completed)
        {
            teamMilestone.CompletedAt = DateTime.UtcNow;
            teamMilestone.MarkedBy = markedBy;
        }

        await _teamMilestoneRepository.UpdateAsync(teamMilestone);

        return await GetTeamMilestoneByIdAsync(teamMilestone.Id);
    }

    public async Task<Result> DeleteTeamMilestoneAsync(Guid id)
    {
        var teamMilestone = await _teamMilestoneRepository.GetByIdAsync(id);

        if (teamMilestone == null || teamMilestone.IsDeleted)
        {
            return Result.Failure("Team milestone not found", "NOT_FOUND");
        }

        teamMilestone.IsDeleted = true;
        teamMilestone.DeletedAt = DateTime.UtcNow;

        await _teamMilestoneRepository.UpdateAsync(teamMilestone);

        return Result.Success("Team milestone deleted successfully");
    }

    public async Task<Result<MilestoneQuestionDto>> CreateQuestionAsync(CreateMilestoneQuestionDto dto, Guid createdBy)
    {
        var question = new MilestoneQuestion
        {
            MilestoneId = dto.MilestoneId,
            Question = dto.Question,
            Order = dto.Order,
            CreatedBy = createdBy
        };

        await _questionRepository.AddAsync(question);

        var questionDto = new MilestoneQuestionDto
        {
            Id = question.Id,
            MilestoneId = question.MilestoneId,
            Question = question.Question,
            Order = question.Order,
            CreatedBy = question.CreatedBy,
            CreatedAt = question.CreatedAt
        };

        return Result<MilestoneQuestionDto>.Success(questionDto);
    }

    public async Task<Result<List<MilestoneQuestionDto>>> GetQuestionsByMilestoneAsync(Guid milestoneId)
    {
        var questions = await _questionRepository.GetAll()
            .Where(q => q.MilestoneId == milestoneId && !q.IsDeleted)
            .OrderBy(q => q.Order)
            .Select(q => new MilestoneQuestionDto
            {
                Id = q.Id,
                MilestoneId = q.MilestoneId,
                Question = q.Question,
                Order = q.Order,
                CreatedBy = q.CreatedBy,
                CreatedAt = q.CreatedAt
            })
            .ToListAsync();

        return Result<List<MilestoneQuestionDto>>.Success(questions);
    }

    public async Task<Result> DeleteQuestionAsync(Guid id)
    {
        var question = await _questionRepository.GetByIdAsync(id);

        if (question == null || question.IsDeleted)
        {
            return Result.Failure("Question not found", "NOT_FOUND");
        }

        question.IsDeleted = true;
        question.DeletedAt = DateTime.UtcNow;

        await _questionRepository.UpdateAsync(question);

        return Result.Success("Question deleted successfully");
    }

    public async Task<Result<MilestoneAnswerDto>> SubmitAnswerAsync(CreateMilestoneAnswerDto dto, Guid studentId)
    {
        var question = await _questionRepository.GetByIdAsync(dto.QuestionId);

        if (question == null || question.IsDeleted)
        {
            return Result<MilestoneAnswerDto>.Failure("Question not found", "NOT_FOUND");
        }

        // Check if answer already exists
        var existingAnswer = await _answerRepository.GetAll()
            .FirstOrDefaultAsync(a => a.QuestionId == dto.QuestionId && a.TeamId == dto.TeamId && a.StudentId == studentId && !a.IsDeleted);

        if (existingAnswer != null)
        {
            // Update existing answer
            existingAnswer.Answer = dto.Answer;
            existingAnswer.SubmittedAt = DateTime.UtcNow;
            existingAnswer.UpdatedAt = DateTime.UtcNow;

            await _answerRepository.UpdateAsync(existingAnswer);

            var updatedDto = new MilestoneAnswerDto
            {
                Id = existingAnswer.Id,
                QuestionId = existingAnswer.QuestionId,
                TeamId = existingAnswer.TeamId,
                StudentId = existingAnswer.StudentId,
                Answer = existingAnswer.Answer,
                SubmittedAt = existingAnswer.SubmittedAt
            };

            return Result<MilestoneAnswerDto>.Success(updatedDto);
        }

        // Create new answer
        var answer = new MilestoneAnswer
        {
            QuestionId = dto.QuestionId,
            TeamId = dto.TeamId,
            StudentId = studentId,
            Answer = dto.Answer,
            SubmittedAt = DateTime.UtcNow
        };

        await _answerRepository.AddAsync(answer);

        var answerDto = new MilestoneAnswerDto
        {
            Id = answer.Id,
            QuestionId = answer.QuestionId,
            TeamId = answer.TeamId,
            StudentId = answer.StudentId,
            Answer = answer.Answer,
            SubmittedAt = answer.SubmittedAt
        };

        return Result<MilestoneAnswerDto>.Success(answerDto);
    }

    public async Task<Result<List<MilestoneAnswerDto>>> GetAnswersByTeamAndQuestionAsync(Guid teamId, Guid questionId)
    {
        var answers = await _answerRepository.GetAll()
            .Where(a => a.TeamId == teamId && a.QuestionId == questionId && !a.IsDeleted)
            .Select(a => new MilestoneAnswerDto
            {
                Id = a.Id,
                QuestionId = a.QuestionId,
                TeamId = a.TeamId,
                StudentId = a.StudentId,
                Answer = a.Answer,
                SubmittedAt = a.SubmittedAt
            })
            .ToListAsync();

        return Result<List<MilestoneAnswerDto>>.Success(answers);
    }
}
