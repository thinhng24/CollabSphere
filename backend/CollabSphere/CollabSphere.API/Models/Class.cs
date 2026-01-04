namespace CollabSphere.API.Models
{
    public class Class
    {
        public int Id { get; set; }

        public required string ClassName { get; set; }
        public required string ClassCode { get; set; }

        public int SyllabusId { get; set; }

        public Syllabus? Syllabus { get; set; }
    }
}
