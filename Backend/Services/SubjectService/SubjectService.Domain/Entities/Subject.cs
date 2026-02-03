using SharedKernel.Entities;

namespace SubjectService.Domain.Entities;

public class Subject : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int CreditHours { get; set; }

    // Navigation properties
    public ICollection<Syllabus> Syllabi { get; set; } = new List<Syllabus>();
}
