using SharedKernel.Entities;

namespace SubjectService.Domain.Entities;

public class Syllabus : BaseEntity
{
    public Guid SubjectId { get; set; }
    public string Version { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string LearningOutcomes { get; set; } = "[]"; // JSON array
    public string Content { get; set; } = "[]"; // JSON array
    public string AssessmentCriteria { get; set; } = "[]"; // JSON array

    // Navigation properties
    public Subject Subject { get; set; } = null!;
}
