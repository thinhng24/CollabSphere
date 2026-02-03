using EvaluationService.Domain.Enums;

namespace EvaluationService.Application.DTOs;

public class MilestoneAnswerEvaluationDto
{
    public Guid Id { get; set; }
    public Guid MilestoneAnswerId { get; set; }
    public Guid EvaluatorId { get; set; }
    public EvaluatorType EvaluatorType { get; set; }
    public decimal Score { get; set; }
    public string Feedback { get; set; } = string.Empty;
    public DateTime EvaluatedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateMilestoneAnswerEvaluationDto
{
    public Guid MilestoneAnswerId { get; set; }
    public EvaluatorType EvaluatorType { get; set; }
    public decimal Score { get; set; }
    public string Feedback { get; set; } = string.Empty;
}

public class UpdateMilestoneAnswerEvaluationDto
{
    public decimal Score { get; set; }
    public string Feedback { get; set; } = string.Empty;
}
