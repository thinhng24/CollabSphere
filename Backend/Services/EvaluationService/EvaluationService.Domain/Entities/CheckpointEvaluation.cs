using SharedKernel.Entities;

namespace EvaluationService.Domain.Entities;

public class CheckpointEvaluation : BaseEntity
{
    public Guid CheckpointSubmissionId { get; set; }
    public Guid EvaluatorId { get; set; }
    public decimal Score { get; set; }
    public string Feedback { get; set; } = string.Empty;
    public DateTime EvaluatedAt { get; set; } = DateTime.UtcNow;
}
