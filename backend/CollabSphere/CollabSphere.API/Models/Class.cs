using System.ComponentModel.DataAnnotations;

namespace CollabSphere.API.Models
{
    public class Class
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string? ClassCode { get; set; }

        [Required]
        public string? ClassName { get; set; }

        public string? LecturerName { get; set; }

        public int StudentCount { get; set; }

        public int SubjectId { get; set; }

        public Subject? Subject { get; set; }   // 👈 BẮT BUỘC PHẢI CÓ
    }
}
