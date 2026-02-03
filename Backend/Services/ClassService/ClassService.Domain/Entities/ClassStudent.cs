namespace ClassService.Domain.Entities;

public class ClassStudent
{
    public Guid ClassId { get; set; }
    public Guid StudentId { get; set; }
    public DateTime EnrolledAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Class Class { get; set; } = null!;
}
