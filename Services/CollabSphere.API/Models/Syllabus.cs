namespace CollabSphere.API.Models
{
    public class Syllabus
    {
        public int Id { get; set; }

        public required string Name { get; set; }
        public required string Code { get; set; }
        public string? Description { get; set; }
    }
}
