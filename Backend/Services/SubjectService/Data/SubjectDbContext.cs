using Microsoft.EntityFrameworkCore;
using SubjectService.Models; // Sửa dòng này cho đúng với namespace ở Bước 1

namespace SubjectService.Data
{
    public class SubjectDbContext : DbContext
    {
        public SubjectDbContext(DbContextOptions<SubjectDbContext> options) : base(options) { }

        public DbSet<Subject> Subjects { get; set; } // Lỗi đỏ ở đây sẽ biến mất
    }
}