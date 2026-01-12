using Microsoft.EntityFrameworkCore;
using AuthService.Models;

namespace AuthService.Data;

/// <summary>
/// Database context for Auth Service
/// </summary>
public class AuthDbContext : DbContext
{
    public AuthDbContext(DbContextOptions<AuthDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; } = null!;
    public DbSet<RefreshToken> RefreshTokens { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("Users", "auth");

            entity.HasKey(e => e.Id);

            entity.HasIndex(e => e.Email)
                .IsUnique()
                .HasDatabaseName("IX_Users_Email");

            entity.HasIndex(e => e.Username)
                .IsUnique()
                .HasDatabaseName("IX_Users_Username");

            entity.Property(e => e.Username)
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(e => e.Email)
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(e => e.PasswordHash)
                .IsRequired();

            entity.Property(e => e.FullName)
                .HasMaxLength(100);

            entity.Property(e => e.AvatarUrl)
                .HasMaxLength(500);

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            // Relationship with RefreshTokens
            entity.HasMany(e => e.RefreshTokens)
                .WithOne(e => e.User)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // RefreshToken configuration
        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.ToTable("RefreshTokens", "auth");

            entity.HasKey(e => e.Id);

            entity.HasIndex(e => e.Token)
                .HasDatabaseName("IX_RefreshTokens_Token");

            entity.HasIndex(e => e.UserId)
                .HasDatabaseName("IX_RefreshTokens_UserId");

            entity.Property(e => e.Token)
                .HasMaxLength(500)
                .IsRequired();

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            entity.Property(e => e.ReplacedByToken)
                .HasMaxLength(500);

            entity.Property(e => e.ReasonRevoked)
                .HasMaxLength(200);
        });

        // Seed demo user for development
        SeedDemoData(modelBuilder);
    }

    private void SeedDemoData(ModelBuilder modelBuilder)
    {
        var demoUserId = Guid.Parse("8a85e556-370d-4622-b508-f000c2100f54");

        modelBuilder.Entity<User>().HasData(new User
        {
            Id = demoUserId,
            Username = "demo_user",
            Email = "demo@commhub.local",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Demo@123"),
            FullName = "Demo User",
            AvatarUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=demo",
            IsOnline = false,
            IsActive = true,
            EmailConfirmed = true,
            CreatedAt = DateTime.UtcNow
        });
    }
}
