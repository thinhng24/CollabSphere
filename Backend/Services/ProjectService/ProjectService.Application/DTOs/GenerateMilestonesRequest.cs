namespace ProjectService.Application.DTOs;

public class GenerateMilestonesRequest
{
    public string? SyllabusId { get; set; }
    public int NumberOfMilestones { get; set; } = 5;
}

public class MilestoneGenerationResult
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Order { get; set; }
    public int EstimatedDurationDays { get; set; }
}
