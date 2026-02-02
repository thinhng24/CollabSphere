using Microsoft.EntityFrameworkCore;
using NotificationService.Models;

namespace NotificationService.Data;

/// <summary>
/// Database context for Notification Service
/// Manages notifications, preferences, subscriptions, and related entities
/// </summary>
public class NotificationDbContext : DbContext
{
    public NotificationDbContext(DbContextOptions<NotificationDbContext> options) : base(options)
    {
    }

    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<NotificationPreference> NotificationPreferences => Set<NotificationPreference>();
    public DbSet<PushSubscription> PushSubscriptions => Set<PushSubscription>();
    public DbSet<NotificationTemplate> NotificationTemplates => Set<NotificationTemplate>();
    public DbSet<MutedConversation> MutedConversations => Set<MutedConversation>();
    public DbSet<NotificationBatch> NotificationBatches => Set<NotificationBatch>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ==================== Notification Configuration ====================
        modelBuilder.Entity<Notification>(entity =>
        {
            entity.ToTable("Notifications", "notification");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Type)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(e => e.Title)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(e => e.Body)
                .IsRequired()
                .HasMaxLength(1000);

            entity.Property(e => e.IconUrl)
                .HasMaxLength(500);

            entity.Property(e => e.ActionUrl)
                .HasMaxLength(500);

            entity.Property(e => e.Data)
                .HasMaxLength(2000);

            entity.Property(e => e.Priority)
                .HasConversion<int>()
                .HasDefaultValue(NotificationPriority.Normal);

            entity.Property(e => e.Status)
                .HasConversion<int>()
                .HasDefaultValue(NotificationStatus.Unread);

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            entity.Property(e => e.IsDelivered)
                .HasDefaultValue(false);

            entity.Property(e => e.IsPushSent)
                .HasDefaultValue(false);

            entity.Property(e => e.IsEmailSent)
                .HasDefaultValue(false);

            // Indexes
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.Type);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => e.ExpiresAt);
            entity.HasIndex(e => new { e.UserId, e.Status });
            entity.HasIndex(e => new { e.UserId, e.CreatedAt });
            entity.HasIndex(e => e.SourceConversationId);
            entity.HasIndex(e => e.SourceMessageId);
        });

        // ==================== NotificationPreference Configuration ====================
        modelBuilder.Entity<NotificationPreference>(entity =>
        {
            entity.ToTable("NotificationPreferences", "notification");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Timezone)
                .HasMaxLength(50);

            entity.Property(e => e.EmailDigestFrequency)
                .HasConversion<int>()
                .HasDefaultValue(EmailDigestFrequency.Instant);

            entity.Property(e => e.EnableNotifications)
                .HasDefaultValue(true);

            entity.Property(e => e.EnablePushNotifications)
                .HasDefaultValue(true);

            entity.Property(e => e.EnableEmailNotifications)
                .HasDefaultValue(true);

            entity.Property(e => e.EnableSoundNotifications)
                .HasDefaultValue(true);

            entity.Property(e => e.NotifyOnNewMessage)
                .HasDefaultValue(true);

            entity.Property(e => e.NotifyOnMention)
                .HasDefaultValue(true);

            entity.Property(e => e.NotifyOnDocumentShare)
                .HasDefaultValue(true);

            entity.Property(e => e.NotifyOnConversationInvite)
                .HasDefaultValue(true);

            entity.Property(e => e.NotifyOnSystemUpdate)
                .HasDefaultValue(true);

            entity.Property(e => e.EnableQuietHours)
                .HasDefaultValue(false);

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            // Unique constraint on UserId
            entity.HasIndex(e => e.UserId)
                .IsUnique();
        });

        // ==================== PushSubscription Configuration ====================
        modelBuilder.Entity<PushSubscription>(entity =>
        {
            entity.ToTable("PushSubscriptions", "notification");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Endpoint)
                .IsRequired()
                .HasMaxLength(500);

            entity.Property(e => e.P256dhKey)
                .IsRequired()
                .HasMaxLength(500);

            entity.Property(e => e.AuthKey)
                .IsRequired()
                .HasMaxLength(500);

            entity.Property(e => e.UserAgent)
                .HasMaxLength(100);

            entity.Property(e => e.DeviceType)
                .HasMaxLength(50);

            entity.Property(e => e.DeviceName)
                .HasMaxLength(100);

            entity.Property(e => e.IsActive)
                .HasDefaultValue(true);

            entity.Property(e => e.FailureCount)
                .HasDefaultValue(0);

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.Endpoint);
            entity.HasIndex(e => e.IsActive);
            entity.HasIndex(e => new { e.UserId, e.IsActive });
        });

        // ==================== NotificationTemplate Configuration ====================
        modelBuilder.Entity<NotificationTemplate>(entity =>
        {
            entity.ToTable("NotificationTemplates", "notification");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Type)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(e => e.Language)
                .IsRequired()
                .HasMaxLength(50)
                .HasDefaultValue("en");

            entity.Property(e => e.TitleTemplate)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(e => e.BodyTemplate)
                .IsRequired()
                .HasMaxLength(1000);

            entity.Property(e => e.IconUrl)
                .HasMaxLength(500);

            entity.Property(e => e.ActionUrlTemplate)
                .HasMaxLength(500);

            entity.Property(e => e.IsActive)
                .HasDefaultValue(true);

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            // Composite unique index for type + language
            entity.HasIndex(e => new { e.Type, e.Language })
                .IsUnique();

            entity.HasIndex(e => e.IsActive);
        });

        // ==================== MutedConversation Configuration ====================
        modelBuilder.Entity<MutedConversation>(entity =>
        {
            entity.ToTable("MutedConversations", "notification");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.MutedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            entity.Property(e => e.IsMuted)
                .HasDefaultValue(true);

            // Composite unique index for user + conversation
            entity.HasIndex(e => new { e.UserId, e.ConversationId })
                .IsUnique();

            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.ConversationId);
            entity.HasIndex(e => e.MutedUntil);
        });

        // ==================== NotificationBatch Configuration ====================
        modelBuilder.Entity<NotificationBatch>(entity =>
        {
            entity.ToTable("NotificationBatches", "notification");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Type)
                .HasConversion<int>()
                .HasDefaultValue(BatchType.EmailDigest);

            entity.Property(e => e.Status)
                .HasConversion<int>()
                .HasDefaultValue(BatchStatus.Pending);

            entity.Property(e => e.NotificationCount)
                .HasDefaultValue(0);

            entity.Property(e => e.ErrorMessage)
                .HasMaxLength(500);

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.ScheduledAt);
            entity.HasIndex(e => new { e.UserId, e.Status });
        });
    }
}
