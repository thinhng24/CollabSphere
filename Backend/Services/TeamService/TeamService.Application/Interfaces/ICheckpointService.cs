using TeamService.Application.DTOs;
using SharedKernel.Common;

namespace TeamService.Application.Interfaces;

public interface ICheckpointService
{
    Task<Result<CheckpointDto>> CreateCheckpointAsync(CreateCheckpointDto dto, Guid createdBy);
    Task<Result<CheckpointDto>> GetCheckpointByIdAsync(Guid id);
    Task<Result<List<CheckpointDto>>> GetCheckpointsByTeamAsync(Guid teamId);
    Task<Result<CheckpointDto>> UpdateCheckpointAsync(Guid id, UpdateCheckpointDto dto);
    Task<Result> DeleteCheckpointAsync(Guid id);
    Task<Result<CheckpointSubmissionDto>> SubmitCheckpointAsync(CreateCheckpointSubmissionDto dto, Guid teamId, Guid submittedBy);
    Task<Result<List<CheckpointSubmissionDto>>> GetCheckpointSubmissionsAsync(Guid checkpointId);
}
