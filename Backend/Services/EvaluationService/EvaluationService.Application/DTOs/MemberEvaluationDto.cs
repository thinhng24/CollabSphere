using EvaluationService.Domain.Enums;

namespace EvaluationService.Application.DTOs;

public class MemberEvaluationDto
{
    public Guid Id { get; set; }
    public Guid TeamId { get; set; }
    public Guid EvaluatedStudentId { get; set; }
    public Guid EvaluatorId { get; set; }
    public EvaluatorType EvaluatorType { get; set; }
    public decimal Score { get; set; }
    public string Comments { get; set; } = string.Empty;
    public DateTime EvaluatedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateMemberEvaluationDto
{
    public Guid TeamId { get; set; }
    public Guid EvaluatedStudentId { get; set; }
    public EvaluatorType EvaluatorType { get; set; }
    public decimal Score { get; set; }
    public string Comments { get; set; } = string.Empty;
}

public class UpdateMemberEvaluationDto
{
    public decimal Score { get; set; }
    public string Comments { get; set; } = string.Empty;
}
