using TeamService.Domain.Enums;

namespace TeamService.Application.DTOs;

public class TeamMilestoneDto
{
    public Guid Id { get; set; }
    public Guid TeamId { get; set; }
    public Guid MilestoneId { get; set; }
    public TeamMilestoneStatus Status { get; set; }
    public DateTime? CompletedAt { get; set; }
    public Guid? MarkedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateTeamMilestoneDto
{
    public Guid TeamId { get; set; }
    public Guid MilestoneId { get; set; }
}

public class UpdateTeamMilestoneDto
{
    public TeamMilestoneStatus Status { get; set; }
}

public class MilestoneQuestionDto
{
    public Guid Id { get; set; }
    public Guid MilestoneId { get; set; }
    public string Question { get; set; } = string.Empty;
    public int Order { get; set; }
    public Guid CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateMilestoneQuestionDto
{
    public Guid MilestoneId { get; set; }
    public string Question { get; set; } = string.Empty;
    public int Order { get; set; }
}

public class MilestoneAnswerDto
{
    public Guid Id { get; set; }
    public Guid QuestionId { get; set; }
    public Guid TeamId { get; set; }
    public Guid StudentId { get; set; }
    public string Answer { get; set; } = string.Empty;
    public DateTime SubmittedAt { get; set; }
}

public class CreateMilestoneAnswerDto
{
    public Guid QuestionId { get; set; }
    public Guid TeamId { get; set; }
    public string Answer { get; set; } = string.Empty;
}
