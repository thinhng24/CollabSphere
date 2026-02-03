using TeamService.Domain.Enums;

namespace TeamService.Application.DTOs;

public class CheckpointDto
{
    public Guid Id { get; set; }
    public Guid TeamId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime DueDate { get; set; }
    public CheckpointStatus Status { get; set; }
    public Guid CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public List<Guid> AssignedStudents { get; set; } = new();
    public List<CheckpointSubmissionDto> Submissions { get; set; } = new();
}

public class CreateCheckpointDto
{
    public Guid TeamId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime DueDate { get; set; }
    public List<Guid> AssignedStudents { get; set; } = new();
}

public class UpdateCheckpointDto
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime DueDate { get; set; }
    public CheckpointStatus Status { get; set; }
}

public class CheckpointSubmissionDto
{
    public Guid Id { get; set; }
    public Guid CheckpointId { get; set; }
    public Guid TeamId { get; set; }
    public string FileUrl { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime SubmittedAt { get; set; }
    public Guid SubmittedBy { get; set; }
}

public class CreateCheckpointSubmissionDto
{
    public Guid CheckpointId { get; set; }
    public string FileUrl { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}
