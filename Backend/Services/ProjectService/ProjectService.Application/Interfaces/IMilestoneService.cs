using ProjectService.Application.DTOs;
using SharedKernel.Common;

namespace ProjectService.Application.Interfaces;

public interface IMilestoneService
{
    Task<Result<List<MilestoneDto>>> GetMilestonesByProjectIdAsync(Guid projectId);
    Task<Result<MilestoneDto>> GetMilestoneByIdAsync(Guid id);
    Task<Result<MilestoneDto>> CreateMilestoneAsync(CreateMilestoneRequest request);
    Task<Result<MilestoneDto>> UpdateMilestoneAsync(Guid id, UpdateMilestoneRequest request);
    Task<Result> DeleteMilestoneAsync(Guid id);
    Task<Result> CompleteMilestoneAsync(Guid id);
}
