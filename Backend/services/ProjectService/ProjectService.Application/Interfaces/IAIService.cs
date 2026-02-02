using ProjectService.Application.DTOs;
using SharedKernel.Common;

namespace ProjectService.Application.Interfaces;

public interface IAIService
{
    Task<Result<List<MilestoneGenerationResult>>> GenerateMilestonesAsync(
        string projectName,
        string projectDescription,
        string projectObjectives,
        string? syllabusContent,
        int numberOfMilestones);
}
