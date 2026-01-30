using Microsoft.EntityFrameworkCore;
using CollabSphere.API.Models;

namespace CollabSphere.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }

        public DbSet<Subject> Subjects { get; set; }
        public DbSet<Class> Classes { get; set; }
    }
}