using SharedKernel.Entities;

namespace ClassService.Domain.Entities;

public class Class : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Semester { get; set; } = string.Empty;
    public int Year { get; set; }
    public string Description { get; set; } = string.Empty;

    // Navigation properties
    public ICollection<ClassLecturer> ClassLecturers { get; set; } = new List<ClassLecturer>();
    public ICollection<ClassStudent> ClassStudents { get; set; } = new List<ClassStudent>();
}
