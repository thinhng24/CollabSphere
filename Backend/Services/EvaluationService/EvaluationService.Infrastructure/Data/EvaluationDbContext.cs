using Microsoft.EntityFrameworkCore;
using EvaluationService.Domain.Entities;

namespace EvaluationService.Infrastructure.Data;

public class EvaluationDbContext : DbContext
{
    public DbSet<TeamEvaluation> TeamEvaluations { get; set; }
    public DbSet<MemberEvaluation> MemberEvaluations { get; set; }
    public DbSet<MilestoneAnswerEvaluation> MilestoneAnswerEvaluations { get; set; }
    public DbSet<CheckpointEvaluation> CheckpointEvaluations { get; set; }

    public EvaluationDbContext(DbContextOptions<EvaluationDbContext> options) : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<TeamEvaluation>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TeamId).IsRequired();
            entity.Property(e => e.EvaluatorId).IsRequired();
            entity.Property(e => e.EvaluatorType).IsRequired();
            entity.Property(e => e.Score).IsRequired().HasPrecision(5, 2);
            entity.Property(e => e.Comments).HasMaxLength(2000);
            entity.Property(e => e.EvaluatedAt).IsRequired();

            entity.HasIndex(e => e.TeamId);
            entity.HasIndex(e => e.EvaluatorId);
        });

        modelBuilder.Entity<MemberEvaluation>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TeamId).IsRequired();
            entity.Property(e => e.EvaluatedStudentId).IsRequired();
            entity.Property(e => e.EvaluatorId).IsRequired();
            entity.Property(e => e.EvaluatorType).IsRequired();
            entity.Property(e => e.Score).IsRequired().HasPrecision(5, 2);
            entity.Property(e => e.Comments).HasMaxLength(2000);
            entity.Property(e => e.EvaluatedAt).IsRequired();

            entity.HasIndex(e => e.TeamId);
            entity.HasIndex(e => e.EvaluatedStudentId);
            entity.HasIndex(e => e.EvaluatorId);
        });

        modelBuilder.Entity<MilestoneAnswerEvaluation>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.MilestoneAnswerId).IsRequired();
            entity.Property(e => e.EvaluatorId).IsRequired();
            entity.Property(e => e.EvaluatorType).IsRequired();
            entity.Property(e => e.Score).IsRequired().HasPrecision(5, 2);
            entity.Property(e => e.Feedback).HasMaxLength(2000);
            entity.Property(e => e.EvaluatedAt).IsRequired();

            entity.HasIndex(e => e.MilestoneAnswerId);
            entity.HasIndex(e => e.EvaluatorId);
        });

        modelBuilder.Entity<CheckpointEvaluation>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.CheckpointSubmissionId).IsRequired();
            entity.Property(e => e.EvaluatorId).IsRequired();
            entity.Property(e => e.Score).IsRequired().HasPrecision(5, 2);
            entity.Property(e => e.Feedback).HasMaxLength(2000);
            entity.Property(e => e.EvaluatedAt).IsRequired();

            entity.HasIndex(e => e.CheckpointSubmissionId);
            entity.HasIndex(e => e.EvaluatorId);
        });
    }
}
