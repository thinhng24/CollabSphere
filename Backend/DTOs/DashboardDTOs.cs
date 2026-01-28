namespace ProjectManagementApp.DTOs
{
    public class DashboardResponse
    {
        public UserStats UserStats { get; set; } = new();
        public List<TeamOverview> Teams { get; set; } = new();
        public List<CheckpointProgress> CheckpointProgress { get; set; } = new();
        public List<ContributionStats> ContributionStats { get; set; } = new();
        public TaskSummary TaskSummary { get; set; } = new();
        public List<RecentActivity> RecentActivities { get; set; } = new();
    }
    
    public class UserStats
    {
        public int TotalTeams { get; set; }
        public int TotalTasks { get; set; }
        public int CompletedTasks { get; set; }
        public int TotalCheckpoints { get; set; }
        public int SubmittedCheckpoints { get; set; }
        public double OverallContribution { get; set; }
    }
    
    public class TeamOverview
    {
        public int TeamId { get; set; }
        public string TeamName { get; set; } = string.Empty;
        public int MemberCount { get; set; }
        public int TaskCount { get; set; }
        public int CompletedTaskCount { get; set; }
        public double CompletionRate { get; set; }
        public int CheckpointCount { get; set; }
        public int CompletedCheckpointCount { get; set; }
    }
    
    public class CheckpointProgress
    {
        public int CheckpointId { get; set; }
        public string Title { get; set; } = string.Empty;
        public DateTime DueDate { get; set; }
        public int SubmittedCount { get; set; }
        public int TotalMembers { get; set; }
        public double SubmissionRate { get; set; }
        public bool IsOverdue { get; set; }
    }
    
    public class ContributionStats
    {
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public int AssignedTasks { get; set; }
        public int CompletedTasks { get; set; }
        public int CompletedSubtasks { get; set; }
        public int TotalSubtasks { get; set; }
        public double ContributionPercentage { get; set; }
    }
    
    public class TaskSummary
    {
        public int Total { get; set; }
        public int ToDo { get; set; }
        public int Doing { get; set; }
        public int Done { get; set; }
        public int Overdue { get; set; }
        public double CompletionRate { get; set; }
    }
    
    public class RecentActivity
    {
        public int Id { get; set; }
        public string Type { get; set; } = string.Empty; // "TaskCreated", "TaskUpdated", "CheckpointSubmitted", "CommentAdded"
        public string Description { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public int? TeamId { get; set; }
        public string? TeamName { get; set; }
    }
}