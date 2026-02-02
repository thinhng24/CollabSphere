namespace ProjectManagementApp.DTOs
{
    public class CreateTeamRequest
    {
        public string Name { get; set; } = string.Empty;
        public IEnumerable<int> MemberIds { get; set; } = Enumerable.Empty<int>();
    }

    public class UpdateTeamRequest
    {
        public string Name { get; set; } = string.Empty;
    }

    public class TeamResponse
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int LecturerId { get; set; }
        public string LecturerName { get; set; } = string.Empty;
        public List<TeamMemberResponse> Members { get; set; } = new();
        public int TaskCount { get; set; }
        public int CompletedTaskCount { get; set; }
        public int CheckpointCount { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class TeamMemberResponse
    {
        public int UserId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public DateTime JoinedAt { get; set; }
    }

    public class AddMemberRequest
    {
        public int UserId { get; set; }
    }
    public class ContributionResponse
{
    public int UserId { get; set; }
    public string UserName { get; set; } = "";
    public int CompletedSubtasks { get; set; }
    public int TotalSubtasks { get; set; }
    public double ContributionPercent { get; set; }
}

}
