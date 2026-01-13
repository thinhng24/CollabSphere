using Microsoft.EntityFrameworkCore;
using CollabSphere.API.Models;

namespace CollabSphere.API.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        // DbSets
        public DbSet<User> Users { get; set; }
        public DbSet<Student> Students { get; set; }
        public DbSet<Lecturer> Lecturers { get; set; }
        public DbSet<Admin> Admins { get; set; }
        public DbSet<Staff> Staffs { get; set; }
        public DbSet<HeadDepartment> HeadDepartments { get; set; }
        public DbSet<Class> Classes { get; set; }
        public DbSet<Team> Teams { get; set; }
        public DbSet<Project> Projects { get; set; }
        public DbSet<Meeting> Meetings { get; set; }
        public DbSet<MeetingParticipant> MeetingParticipants { get; set; }
        public DbSet<Whiteboard> Whiteboards { get; set; }
        public DbSet<WhiteboardElement> WhiteboardElements { get; set; }
        public DbSet<Task> Tasks { get; set; }
        public DbSet<Evaluation> Evaluations { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<Subject> Subjects { get; set; }
        public DbSet<Syllabus> Syllabi { get; set; }
        public DbSet<Resource> Resources { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure relationships
            modelBuilder.Entity<User>()
                .HasDiscriminator<string>("UserType")
                .HasValue<Student>("Student")
                .HasValue<Lecturer>("Lecturer")
                .HasValue<Admin>("Admin")
                .HasValue<Staff>("Staff")
                .HasValue<HeadDepartment>("HeadDepartment");

            modelBuilder.Entity<Meeting>()
                .HasOne(m => m.Team)
                .WithMany(t => t.Meetings)
                .HasForeignKey(m => m.TeamId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<MeetingParticipant>()
                .HasOne(mp => mp.Meeting)
                .WithMany(m => m.Participants)
                .HasForeignKey(mp => mp.MeetingId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<WhiteboardElement>()
                .HasOne(we => we.Whiteboard)
                .WithMany(w => w.Elements)
                .HasForeignKey(we => we.WhiteboardId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure indexes
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<Meeting>()
                .HasIndex(m => m.MeetingLink)
                .IsUnique();

            // Configure decimal precision
            modelBuilder.Entity<Evaluation>()
                .Property(e => e.Score)
                .HasPrecision(5, 2);

            // Seed data
            SeedData(modelBuilder);
        }

        private void SeedData(ModelBuilder modelBuilder)
        {
            // Seed admin user
            modelBuilder.Entity<Admin>().HasData(
                new Admin
                {
                    Id = Guid.NewGuid(),
                    Email = "admin@collabsphere.edu.vn",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                    FullName = "System Administrator",
                    CreatedAt = DateTime.UtcNow,
                    IsActive = true
                }
            );
        }
    }
}