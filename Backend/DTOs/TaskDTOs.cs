namespace ProjectManagementApp.DTOs
{
    public class CreateTaskRequest
    {
        public int TeamId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int? AssigneeId { get; set; }
        public DateTime? Deadline { get; set; }
        public decimal? EstimatedHours { get; set; }
    }
    
    public class UpdateTaskRequest
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int? AssigneeId { get; set; }
        public DateTime? Deadline { get; set; }
        public decimal? EstimatedHours { get; set; }
        public decimal? ActualHours { get; set; }
    }
    
    public class UpdateTaskStatusRequest
    {
        public string Status { get; set; } = string.Empty;
        public int Order { get; set; }
    }
    
    public class TaskResponse
    {
        public int Id { get; set; }
        public int TeamId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Status { get; set; } = string.Empty;
        public int? AssigneeId { get; set; }
        public string? AssigneeName { get; set; }
        public int Order { get; set; }
        public DateTime? Deadline { get; set; }
        public decimal? EstimatedHours { get; set; }
        public decimal? ActualHours { get; set; }
        public double Progress { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public List<SubtaskResponse> Subtasks { get; set; } = new();
    }
    
    public class CreateSubtaskRequest
    {
        public int TaskId { get; set; }
        public string Title { get; set; } = string.Empty;
    }
    
    public class UpdateSubtaskRequest
    {
        public string Title { get; set; } = string.Empty;
        public bool IsDone { get; set; }
        public int Order { get; set; }
    }
    
    public class SubtaskResponse
    {
        public int Id { get; set; }
        public int TaskId { get; set; }
        public string Title { get; set; } = string.Empty;
        public bool IsDone { get; set; }
        public int Order { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}