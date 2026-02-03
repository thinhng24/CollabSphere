namespace ClassService.Domain.Entities;

public class ClassLecturer
{
    public Guid ClassId { get; set; }
    public Guid LecturerId { get; set; }
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Class Class { get; set; } = null!;
}
