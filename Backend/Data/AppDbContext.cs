using Microsoft.EntityFrameworkCore;
using ProjectManagementApp.Models;
using System.Threading.Tasks; // Thêm using này để phân biệt

namespace ProjectManagementApp.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
        
        public DbSet<User> Users => Set<User>();
        public DbSet<Team> Teams => Set<Team>();
        public DbSet<TeamMember> TeamMembers => Set<TeamMember>();
        public DbSet<Checkpoint> Checkpoints => Set<Checkpoint>();
        public DbSet<Submission> Submissions => Set<Submission>();
        public DbSet<Models.Task> Tasks => Set<Models.Task>(); // Sửa thành Models.Task
        public DbSet<Subtask> Subtasks => Set<Subtask>();
        
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            
            // Đổi tên bảng Task thành Tasks để tránh conflict
            modelBuilder.Entity<Models.Task>().ToTable("Tasks"); // Sử dụng Models.Task
            
            // User configuration
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();
                
            modelBuilder.Entity<User>()
                .Property(u => u.Role)
                .HasConversion<string>()
                .HasMaxLength(20);
                
            // TeamMember composite key
            modelBuilder.Entity<TeamMember>()
                .HasKey(tm => new { tm.TeamId, tm.UserId });
                
            // Relationships
            modelBuilder.Entity<TeamMember>()
                .HasOne(tm => tm.Team)
                .WithMany(t => t.Members)
                .HasForeignKey(tm => tm.TeamId)
                .OnDelete(DeleteBehavior.Cascade);
                
            modelBuilder.Entity<TeamMember>()
                .HasOne(tm => tm.User)
                .WithMany(u => u.TeamMemberships)
                .HasForeignKey(tm => tm.UserId)
                .OnDelete(DeleteBehavior.Cascade);
                
            // Team - Lecturer
            modelBuilder.Entity<Team>()
                .HasOne(t => t.Lecturer)
                .WithMany(u => u.TeamsAsLecturer)
                .HasForeignKey(t => t.LecturerId)
                .OnDelete(DeleteBehavior.Restrict);
                
            // Checkpoint - Team
            modelBuilder.Entity<Checkpoint>()
                .HasOne(c => c.Team)
                .WithMany(t => t.Checkpoints)
                .HasForeignKey(c => c.TeamId)
                .OnDelete(DeleteBehavior.Cascade);
                
            // Submission - Checkpoint
            modelBuilder.Entity<Submission>()
                .HasOne(s => s.Checkpoint)
                .WithMany(c => c.Submissions)
                .HasForeignKey(s => s.CheckpointId)
                .OnDelete(DeleteBehavior.Cascade);
                
            // Submission - User
            modelBuilder.Entity<Submission>()
                .HasOne(s => s.User)
                .WithMany(u => u.Submissions)
                .HasForeignKey(s => s.UserId)
                .OnDelete(DeleteBehavior.Restrict);
                
            // Task - Team (sử dụng Models.Task)
            modelBuilder.Entity<Models.Task>()
                .HasOne(t => t.Team)
                .WithMany(team => team.Tasks)
                .HasForeignKey(t => t.TeamId)
                .OnDelete(DeleteBehavior.Cascade);
                
            // Task - Assignee (sử dụng Models.Task)
            modelBuilder.Entity<Models.Task>()
                .HasOne(t => t.Assignee)
                .WithMany(u => u.AssignedTasks)
                .HasForeignKey(t => t.AssigneeId)
                .OnDelete(DeleteBehavior.SetNull);
                
            // Subtask - Task (sử dụng Models.Task)
            modelBuilder.Entity<Subtask>()
                .HasOne(st => st.Task)
                .WithMany(t => t.Subtasks)
                .HasForeignKey(st => st.TaskId)
                .OnDelete(DeleteBehavior.Cascade);
                
            // Indexes for performance (sử dụng Models.Task)
            modelBuilder.Entity<Models.Task>()
                .HasIndex(t => new { t.TeamId, t.Status });
                
            modelBuilder.Entity<Checkpoint>()
                .HasIndex(c => c.DueDate);
                
            modelBuilder.Entity<Submission>()
                .HasIndex(s => new { s.CheckpointId, s.UserId })
                .IsUnique();
            modelBuilder.Entity<Submission>()
              .Property(s => s.Score)
                 .HasPrecision(5, 2);

            modelBuilder.Entity<Models.Task>()
            .Property(t => t.EstimatedHours)
             .HasPrecision(10, 2);

            modelBuilder.Entity<Models.Task>()
            .Property(t => t.ActualHours)
            .HasPrecision(10, 2);
        }
    }
    
}

