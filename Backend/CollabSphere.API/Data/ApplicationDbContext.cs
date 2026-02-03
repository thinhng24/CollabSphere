using Microsoft.EntityFrameworkCore;
using CollabSphere.API.Models;

namespace CollabSphere.API.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) 
            : base(options) { }

        public DbSet<Meeting> Meetings { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            
            // Seed test data
            modelBuilder.Entity<Meeting>().HasData(
                new Meeting 
                { 
                    Id = 1, 
                    Title = "Team Standup", 
                    Description = "Daily standup meeting",
                    StartTime = DateTime.Now.AddHours(1),
                    EndTime = DateTime.Now.AddHours(2),
                    IsActive = true,
                    Status = "Scheduled",
                    TeamName = "Development Team"
                },
                new Meeting 
                { 
                    Id = 2, 
                    Title = "Project Review", 
                    Description = "Weekly project review",
                    StartTime = DateTime.Now.AddHours(3),
                    EndTime = DateTime.Now.AddHours(4),
                    IsActive = true,
                    Status = "Scheduled",
                    TeamName = "Project Management"
                }
            );
        }
    }
}