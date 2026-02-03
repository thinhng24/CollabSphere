using SharedKernel.Entities;
using EvaluationService.Domain.Enums;

namespace EvaluationService.Domain.Entities;

public class MilestoneAnswerEvaluation : BaseEntity
{
    public Guid MilestoneAnswerId { get; set; }
    public Guid EvaluatorId { get; set; }
    public EvaluatorType EvaluatorType { get; set; }
    public decimal Score { get; set; }
    public string Feedback { get; set; } = string.Empty;
    public DateTime EvaluatedAt { get; set; } = DateTime.UtcNow;
}
