using TeamService.Application.DTOs;
using SharedKernel.Common;

namespace TeamService.Application.Interfaces;

public interface ITeamMilestoneService
{
    Task<Result<TeamMilestoneDto>> CreateTeamMilestoneAsync(CreateTeamMilestoneDto dto);
    Task<Result<TeamMilestoneDto>> GetTeamMilestoneByIdAsync(Guid id);
    Task<Result<List<TeamMilestoneDto>>> GetTeamMilestonesByTeamAsync(Guid teamId);
    Task<Result<List<TeamMilestoneDto>>> GetTeamMilestonesByMilestoneAsync(Guid milestoneId);
    Task<Result<TeamMilestoneDto>> UpdateTeamMilestoneAsync(Guid id, UpdateTeamMilestoneDto dto, Guid markedBy);
    Task<Result> DeleteTeamMilestoneAsync(Guid id);

    // Milestone Questions
    Task<Result<MilestoneQuestionDto>> CreateQuestionAsync(CreateMilestoneQuestionDto dto, Guid createdBy);
    Task<Result<List<MilestoneQuestionDto>>> GetQuestionsByMilestoneAsync(Guid milestoneId);
    Task<Result> DeleteQuestionAsync(Guid id);

    // Milestone Answers
    Task<Result<MilestoneAnswerDto>> SubmitAnswerAsync(CreateMilestoneAnswerDto dto, Guid studentId);
    Task<Result<List<MilestoneAnswerDto>>> GetAnswersByTeamAndQuestionAsync(Guid teamId, Guid questionId);
}
