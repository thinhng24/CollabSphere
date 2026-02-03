using EvaluationService.Application.DTOs;
using SharedKernel.Common;

namespace EvaluationService.Application.Interfaces;

public interface IEvaluationService
{
    // Team Evaluations
    Task<Result<TeamEvaluationDto>> CreateTeamEvaluationAsync(CreateTeamEvaluationDto dto, Guid evaluatorId);
    Task<Result<TeamEvaluationDto>> GetTeamEvaluationByIdAsync(Guid id);
    Task<Result<List<TeamEvaluationDto>>> GetTeamEvaluationsByTeamIdAsync(Guid teamId);
    Task<Result<List<TeamEvaluationDto>>> GetTeamEvaluationsByEvaluatorIdAsync(Guid evaluatorId);
    Task<Result<TeamEvaluationDto>> UpdateTeamEvaluationAsync(Guid id, UpdateTeamEvaluationDto dto);
    Task<Result> DeleteTeamEvaluationAsync(Guid id);

    // Member Evaluations
    Task<Result<MemberEvaluationDto>> CreateMemberEvaluationAsync(CreateMemberEvaluationDto dto, Guid evaluatorId);
    Task<Result<MemberEvaluationDto>> GetMemberEvaluationByIdAsync(Guid id);
    Task<Result<List<MemberEvaluationDto>>> GetMemberEvaluationsByTeamIdAsync(Guid teamId);
    Task<Result<List<MemberEvaluationDto>>> GetMemberEvaluationsByStudentIdAsync(Guid studentId);
    Task<Result<List<MemberEvaluationDto>>> GetMemberEvaluationsByEvaluatorIdAsync(Guid evaluatorId);
    Task<Result<MemberEvaluationDto>> UpdateMemberEvaluationAsync(Guid id, UpdateMemberEvaluationDto dto);
    Task<Result> DeleteMemberEvaluationAsync(Guid id);

    // Milestone Answer Evaluations
    Task<Result<MilestoneAnswerEvaluationDto>> CreateMilestoneAnswerEvaluationAsync(CreateMilestoneAnswerEvaluationDto dto, Guid evaluatorId);
    Task<Result<MilestoneAnswerEvaluationDto>> GetMilestoneAnswerEvaluationByIdAsync(Guid id);
    Task<Result<List<MilestoneAnswerEvaluationDto>>> GetMilestoneAnswerEvaluationsByAnswerIdAsync(Guid milestoneAnswerId);
    Task<Result<List<MilestoneAnswerEvaluationDto>>> GetMilestoneAnswerEvaluationsByEvaluatorIdAsync(Guid evaluatorId);
    Task<Result<MilestoneAnswerEvaluationDto>> UpdateMilestoneAnswerEvaluationAsync(Guid id, UpdateMilestoneAnswerEvaluationDto dto);
    Task<Result> DeleteMilestoneAnswerEvaluationAsync(Guid id);

    // Checkpoint Evaluations
    Task<Result<CheckpointEvaluationDto>> CreateCheckpointEvaluationAsync(CreateCheckpointEvaluationDto dto, Guid evaluatorId);
    Task<Result<CheckpointEvaluationDto>> GetCheckpointEvaluationByIdAsync(Guid id);
    Task<Result<List<CheckpointEvaluationDto>>> GetCheckpointEvaluationsBySubmissionIdAsync(Guid checkpointSubmissionId);
    Task<Result<List<CheckpointEvaluationDto>>> GetCheckpointEvaluationsByEvaluatorIdAsync(Guid evaluatorId);
    Task<Result<CheckpointEvaluationDto>> UpdateCheckpointEvaluationAsync(Guid id, UpdateCheckpointEvaluationDto dto);
    Task<Result> DeleteCheckpointEvaluationAsync(Guid id);
}
