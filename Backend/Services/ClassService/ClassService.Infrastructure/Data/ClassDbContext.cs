using Microsoft.EntityFrameworkCore;
using ClassService.Domain.Entities;

namespace ClassService.Infrastructure.Data;

public class ClassDbContext : DbContext
{
    public DbSet<Class> Classes { get; set; }
    public DbSet<ClassLecturer> ClassLecturers { get; set; }
    public DbSet<ClassStudent> ClassStudents { get; set; }

    public ClassDbContext(DbContextOptions<ClassDbContext> options) : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Class>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Code).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Semester).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Year).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(2000);

            entity.HasIndex(e => e.Code);

            entity.HasMany(e => e.ClassLecturers)
                .WithOne(cl => cl.Class)
                .HasForeignKey(cl => cl.ClassId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(e => e.ClassStudents)
                .WithOne(cs => cs.Class)
                .HasForeignKey(cs => cs.ClassId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ClassLecturer>(entity =>
        {
            entity.HasKey(e => new { e.ClassId, e.LecturerId });
            entity.Property(e => e.AssignedAt).IsRequired();
            entity.HasIndex(e => e.LecturerId);
        });

        modelBuilder.Entity<ClassStudent>(entity =>
        {
            entity.HasKey(e => new { e.ClassId, e.StudentId });
            entity.Property(e => e.EnrolledAt).IsRequired();
            entity.HasIndex(e => e.StudentId);
        });
    }
}
