namespace EvaluationService.Application.DTOs;

public class CheckpointEvaluationDto
{
    public Guid Id { get; set; }
    public Guid CheckpointSubmissionId { get; set; }
    public Guid EvaluatorId { get; set; }
    public decimal Score { get; set; }
    public string Feedback { get; set; } = string.Empty;
    public DateTime EvaluatedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateCheckpointEvaluationDto
{
    public Guid CheckpointSubmissionId { get; set; }
    public decimal Score { get; set; }
    public string Feedback { get; set; } = string.Empty;
}

public class UpdateCheckpointEvaluationDto
{
    public decimal Score { get; set; }
    public string Feedback { get; set; } = string.Empty;
}
