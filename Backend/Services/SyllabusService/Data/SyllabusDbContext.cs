using Microsoft.EntityFrameworkCore;
using SyllabusService.Models;

namespace SyllabusService.Data
{
    public class SyllabusDbContext : DbContext
    {
        public SyllabusDbContext(DbContextOptions<SyllabusDbContext> options)
            : base(options)
        {
        }

        public DbSet<Syllabus> Syllabuses { get; set; }
    }
}
