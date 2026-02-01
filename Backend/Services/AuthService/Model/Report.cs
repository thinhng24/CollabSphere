public class Report
{
    public int Id { get; set; }
    public int? UserId { get; set; }

    public string Email { get; set; } = null!;
    public string Subject { get; set; } = null!;
    public string Message { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.Now;
}
