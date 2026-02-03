using Microsoft.EntityFrameworkCore;
using SubjectService.Domain.Entities;

namespace SubjectService.Infrastructure.Data;

public class SubjectDbContext : DbContext
{
    public DbSet<Subject> Subjects { get; set; }
    public DbSet<Syllabus> Syllabi { get; set; }

    public SubjectDbContext(DbContextOptions<SubjectDbContext> options) : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Subject>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Code).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Description).HasMaxLength(2000);
            entity.Property(e => e.CreditHours).IsRequired();

            entity.HasIndex(e => e.Code);

            entity.HasMany(e => e.Syllabi)
                .WithOne(s => s.Subject)
                .HasForeignKey(s => s.SubjectId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Syllabus>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Version).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Description).HasMaxLength(2000);
            entity.Property(e => e.LearningOutcomes).IsRequired().HasColumnType("text");
            entity.Property(e => e.Content).IsRequired().HasColumnType("text");
            entity.Property(e => e.AssessmentCriteria).IsRequired().HasColumnType("text");

            entity.HasIndex(e => e.SubjectId);
        });
    }
}
