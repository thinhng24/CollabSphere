using Microsoft.EntityFrameworkCore;
using CollabSphere.API.Models;
using System.Collections.Generic;

namespace CollabSphere.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options) { }

        public DbSet<Subject> Subjects { get; set; }
    }
}
