namespace ProjectManagementApp.DTOs
{
    public class CreateCheckpointRequest
    {
        public int TeamId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime DueDate { get; set; }
    }
    
    public class UpdateCheckpointRequest
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime DueDate { get; set; }
    }
    
    public class CheckpointResponse
    {
        public double Score { get; set; }
    public string Feedback { get; set; }
        public int Id { get; set; }
        public int TeamId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime DueDate { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsOverdue => DueDate < DateTime.UtcNow;
        public int TotalSubmissions { get; set; }
        public int TotalMembers { get; set; }
        public bool HasSubmitted { get; set; }
        public SubmissionResponse? MySubmission { get; set; }
    }
    
    public class SubmitCheckpointRequest
    {
        public int CheckpointId { get; set; }
        public string Content { get; set; } = string.Empty;
        public string? FileUrl { get; set; }
        public string? FileName { get; set; }
    }
    
    public class SubmissionResponse
    {
        public int Id { get; set; }
        public int CheckpointId { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string? FileUrl { get; set; }
        public string? FileName { get; set; }
        public decimal? Score { get; set; }
        public string? Feedback { get; set; }
        public DateTime SubmittedAt { get; set; }
        public DateTime? GradedAt { get; set; }
    }
    
    public class GradeSubmissionRequest
    {
        public decimal Score { get; set; }
        public string? Feedback { get; set; }
    }
}