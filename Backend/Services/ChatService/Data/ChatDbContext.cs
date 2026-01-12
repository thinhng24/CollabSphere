using Microsoft.EntityFrameworkCore;
using ChatService.Models;

namespace ChatService.Data;

/// <summary>
/// Database context for Chat Service
/// Manages conversations, messages, and related entities
/// </summary>
public class ChatDbContext : DbContext
{
    public ChatDbContext(DbContextOptions<ChatDbContext> options) : base(options)
    {
    }

    public DbSet<Conversation> Conversations => Set<Conversation>();
    public DbSet<ConversationParticipant> ConversationParticipants => Set<ConversationParticipant>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<MessageReadReceipt> MessageReadReceipts => Set<MessageReadReceipt>();
    public DbSet<UserCache> UserCaches => Set<UserCache>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ==================== Conversation Configuration ====================
        modelBuilder.Entity<Conversation>(entity =>
        {
            entity.ToTable("Conversations");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Name)
                .HasMaxLength(100);

            entity.Property(e => e.Type)
                .IsRequired()
                .HasMaxLength(20)
                .HasDefaultValue("direct");

            entity.Property(e => e.AvatarUrl)
                .HasMaxLength(500);

            entity.Property(e => e.LastMessagePreview)
                .HasMaxLength(500);

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            entity.Property(e => e.IsActive)
                .HasDefaultValue(true);

            entity.HasIndex(e => e.CreatedById);
            entity.HasIndex(e => e.LastMessageAt);
            entity.HasIndex(e => e.Type);

            // Relationships
            entity.HasMany(e => e.Participants)
                .WithOne(e => e.Conversation)
                .HasForeignKey(e => e.ConversationId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(e => e.Messages)
                .WithOne(e => e.Conversation)
                .HasForeignKey(e => e.ConversationId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ==================== ConversationParticipant Configuration ====================
        modelBuilder.Entity<ConversationParticipant>(entity =>
        {
            entity.ToTable("ConversationParticipants");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Role)
                .HasMaxLength(20)
                .HasDefaultValue("member");

            entity.Property(e => e.JoinedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            entity.Property(e => e.UnreadCount)
                .HasDefaultValue(0);

            entity.Property(e => e.IsMuted)
                .HasDefaultValue(false);

            entity.Property(e => e.IsPinned)
                .HasDefaultValue(false);

            entity.Property(e => e.IsActive)
                .HasDefaultValue(true);

            // Composite unique index for conversation + user
            entity.HasIndex(e => new { e.ConversationId, e.UserId })
                .IsUnique();

            entity.HasIndex(e => e.UserId);
        });

        // ==================== Message Configuration ====================
        modelBuilder.Entity<Message>(entity =>
        {
            entity.ToTable("Messages");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Content)
                .IsRequired();

            entity.Property(e => e.Type)
                .HasMaxLength(20)
                .HasDefaultValue("text");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            entity.Property(e => e.IsDeleted)
                .HasDefaultValue(false);

            entity.Property(e => e.AttachmentFileName)
                .HasMaxLength(255);

            entity.Property(e => e.AttachmentContentType)
                .HasMaxLength(100);

            entity.HasIndex(e => e.ConversationId);
            entity.HasIndex(e => e.SenderId);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => new { e.ConversationId, e.CreatedAt });

            // Self-referencing relationship for replies
            entity.HasOne(e => e.ReplyToMessage)
                .WithMany()
                .HasForeignKey(e => e.ReplyToMessageId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(e => e.ReadReceipts)
                .WithOne(e => e.Message)
                .HasForeignKey(e => e.MessageId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ==================== MessageReadReceipt Configuration ====================
        modelBuilder.Entity<MessageReadReceipt>(entity =>
        {
            entity.ToTable("MessageReadReceipts");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.ReadAt)
                .HasDefaultValueSql("GETUTCDATE()");

            // Composite unique index to prevent duplicate read receipts
            entity.HasIndex(e => new { e.MessageId, e.UserId })
                .IsUnique();

            entity.HasIndex(e => e.UserId);
        });

        // ==================== UserCache Configuration ====================
        modelBuilder.Entity<UserCache>(entity =>
        {
            entity.ToTable("UserCaches");

            entity.HasKey(e => e.UserId);

            entity.Property(e => e.Username)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(e => e.FullName)
                .HasMaxLength(100);

            entity.Property(e => e.AvatarUrl)
                .HasMaxLength(500);

            entity.Property(e => e.IsOnline)
                .HasDefaultValue(false);

            entity.Property(e => e.CachedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            entity.HasIndex(e => e.Username);
            entity.HasIndex(e => e.ExpiresAt);
        });
    }
}
