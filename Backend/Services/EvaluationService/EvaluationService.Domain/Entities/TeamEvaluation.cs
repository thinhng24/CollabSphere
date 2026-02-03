using SharedKernel.Entities;
using EvaluationService.Domain.Enums;

namespace EvaluationService.Domain.Entities;

public class TeamEvaluation : BaseEntity
{
    public Guid TeamId { get; set; }
    public Guid EvaluatorId { get; set; }
    public EvaluatorType EvaluatorType { get; set; }
    public decimal Score { get; set; }
    public string Comments { get; set; } = string.Empty;
    public DateTime EvaluatedAt { get; set; } = DateTime.UtcNow;
}
