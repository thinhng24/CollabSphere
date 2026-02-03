using Microsoft.EntityFrameworkCore;
using TeamService.Domain.Entities;
using TeamService.Domain.Enums;

namespace TeamService.Infrastructure.Data;

public class TeamDbContext : DbContext
{
    public DbSet<Team> Teams { get; set; }
    public DbSet<TeamMember> TeamMembers { get; set; }
    public DbSet<TeamMilestone> TeamMilestones { get; set; }
    public DbSet<MilestoneQuestion> MilestoneQuestions { get; set; }
    public DbSet<MilestoneAnswer> MilestoneAnswers { get; set; }
    public DbSet<Checkpoint> Checkpoints { get; set; }
    public DbSet<CheckpointAssignment> CheckpointAssignments { get; set; }
    public DbSet<CheckpointSubmission> CheckpointSubmissions { get; set; }
    public DbSet<Workspace> Workspaces { get; set; }

    public TeamDbContext(DbContextOptions<TeamDbContext> options) : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Team configuration
        modelBuilder.Entity<Team>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
            entity.Property(e => e.ClassId).IsRequired();
            entity.Property(e => e.LeaderId).IsRequired();

            entity.HasIndex(e => e.ClassId);
            entity.HasIndex(e => e.ProjectId);
            entity.HasIndex(e => e.LeaderId);

            entity.HasMany(e => e.TeamMembers)
                .WithOne(tm => tm.Team)
                .HasForeignKey(tm => tm.TeamId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(e => e.TeamMilestones)
                .WithOne(tm => tm.Team)
                .HasForeignKey(tm => tm.TeamId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(e => e.Checkpoints)
                .WithOne(c => c.Team)
                .HasForeignKey(c => c.TeamId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(e => e.MilestoneAnswers)
                .WithOne(ma => ma.Team)
                .HasForeignKey(ma => ma.TeamId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(e => e.CheckpointSubmissions)
                .WithOne(cs => cs.Team)
                .HasForeignKey(cs => cs.TeamId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Workspace)
                .WithOne(w => w.Team)
                .HasForeignKey<Workspace>(w => w.TeamId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // TeamMember configuration (join table with composite key)
        modelBuilder.Entity<TeamMember>(entity =>
        {
            entity.HasKey(e => new { e.TeamId, e.StudentId });
            entity.Property(e => e.JoinedAt).IsRequired();
            entity.Property(e => e.ContributionPercentage).HasPrecision(5, 2);

            entity.HasIndex(e => e.StudentId);
        });

        // TeamMilestone configuration
        modelBuilder.Entity<TeamMilestone>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TeamId).IsRequired();
            entity.Property(e => e.MilestoneId).IsRequired();
            entity.Property(e => e.Status).IsRequired()
                .HasConversion<int>();

            entity.HasIndex(e => e.TeamId);
            entity.HasIndex(e => e.MilestoneId);
            entity.HasIndex(e => new { e.TeamId, e.MilestoneId }).IsUnique();
        });

        // MilestoneQuestion configuration
        modelBuilder.Entity<MilestoneQuestion>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.MilestoneId).IsRequired();
            entity.Property(e => e.Question).IsRequired().HasMaxLength(2000);
            entity.Property(e => e.Order).IsRequired();
            entity.Property(e => e.CreatedBy).IsRequired();

            entity.HasIndex(e => e.MilestoneId);

            entity.HasMany(e => e.MilestoneAnswers)
                .WithOne(ma => ma.Question)
                .HasForeignKey(ma => ma.QuestionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // MilestoneAnswer configuration
        modelBuilder.Entity<MilestoneAnswer>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.QuestionId).IsRequired();
            entity.Property(e => e.TeamId).IsRequired();
            entity.Property(e => e.StudentId).IsRequired();
            entity.Property(e => e.Answer).IsRequired();
            entity.Property(e => e.SubmittedAt).IsRequired();

            entity.HasIndex(e => e.QuestionId);
            entity.HasIndex(e => e.TeamId);
            entity.HasIndex(e => e.StudentId);
        });

        // Checkpoint configuration
        modelBuilder.Entity<Checkpoint>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TeamId).IsRequired();
            entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Description).HasMaxLength(2000);
            entity.Property(e => e.DueDate).IsRequired();
            entity.Property(e => e.Status).IsRequired()
                .HasConversion<int>();
            entity.Property(e => e.CreatedBy).IsRequired();

            entity.HasIndex(e => e.TeamId);

            entity.HasMany(e => e.CheckpointAssignments)
                .WithOne(ca => ca.Checkpoint)
                .HasForeignKey(ca => ca.CheckpointId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(e => e.CheckpointSubmissions)
                .WithOne(cs => cs.Checkpoint)
                .HasForeignKey(cs => cs.CheckpointId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // CheckpointAssignment configuration (join table with composite key)
        modelBuilder.Entity<CheckpointAssignment>(entity =>
        {
            entity.HasKey(e => new { e.CheckpointId, e.StudentId });
            entity.HasIndex(e => e.StudentId);
        });

        // CheckpointSubmission configuration
        modelBuilder.Entity<CheckpointSubmission>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.CheckpointId).IsRequired();
            entity.Property(e => e.TeamId).IsRequired();
            entity.Property(e => e.FileUrl).IsRequired().HasMaxLength(1000);
            entity.Property(e => e.Description).HasMaxLength(2000);
            entity.Property(e => e.SubmittedAt).IsRequired();
            entity.Property(e => e.SubmittedBy).IsRequired();

            entity.HasIndex(e => e.CheckpointId);
            entity.HasIndex(e => e.TeamId);
        });

        // Workspace configuration
        modelBuilder.Entity<Workspace>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TeamId).IsRequired();
            entity.Property(e => e.Cards).IsRequired();

            entity.HasIndex(e => e.TeamId).IsUnique();
        });
    }
}
