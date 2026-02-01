using Microsoft.EntityFrameworkCore;
using DocumentService.Models;

namespace DocumentService.Data;

/// <summary>
/// Database context for Document Service
/// Manages documents, file storage metadata, and access control
/// </summary>
public class DocumentDbContext : DbContext
{
    public DocumentDbContext(DbContextOptions<DocumentDbContext> options) : base(options)
    {
    }

    public DbSet<Document> Documents => Set<Document>();
    public DbSet<DocumentAccess> DocumentAccesses => Set<DocumentAccess>();
    public DbSet<DocumentVersion> DocumentVersions => Set<DocumentVersion>();
    public DbSet<UploadSession> UploadSessions => Set<UploadSession>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ==================== Document Configuration ====================
        modelBuilder.Entity<Document>(entity =>
        {
            entity.ToTable("Documents", "document");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.FileName)
                .IsRequired()
                .HasMaxLength(255);

            entity.Property(e => e.OriginalFileName)
                .IsRequired()
                .HasMaxLength(255);

            entity.Property(e => e.ContentType)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(e => e.FileExtension)
                .HasMaxLength(20);

            entity.Property(e => e.StoragePath)
                .IsRequired()
                .HasMaxLength(500);

            entity.Property(e => e.ThumbnailPath)
                .HasMaxLength(500);

            entity.Property(e => e.FileHash)
                .HasMaxLength(64);

            entity.Property(e => e.Description)
                .HasMaxLength(500);

            entity.Property(e => e.Metadata)
                .HasMaxLength(2000);

            entity.Property(e => e.UploadedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            entity.Property(e => e.Status)
                .HasConversion<int>()
                .HasDefaultValue(DocumentStatus.Active)
                .HasSentinel((DocumentStatus)0);

            entity.Property(e => e.IsPublic)
                .HasDefaultValue(false);

            entity.Property(e => e.DownloadCount)
                .HasDefaultValue(0);

            // Indexes
            entity.HasIndex(e => e.UploadedById);
            entity.HasIndex(e => e.ConversationId);
            entity.HasIndex(e => e.MessageId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.ContentType);
            entity.HasIndex(e => e.UploadedAt);
            entity.HasIndex(e => e.FileHash);
            entity.HasIndex(e => new { e.UploadedById, e.Status });
        });

        // ==================== DocumentAccess Configuration ====================
        modelBuilder.Entity<DocumentAccess>(entity =>
        {
            entity.ToTable("DocumentAccesses", "document");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.AccessLevel)
                .HasConversion<int>()
                .HasDefaultValue(DocumentAccessLevel.Read)
                .HasSentinel((DocumentAccessLevel)0);

            entity.Property(e => e.GrantedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            entity.Property(e => e.IsActive)
                .HasDefaultValue(true);

            // Composite unique index for document + user
            entity.HasIndex(e => new { e.DocumentId, e.UserId })
                .IsUnique();

            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.ExpiresAt);

            // Relationships
            entity.HasOne(e => e.Document)
                .WithMany()
                .HasForeignKey(e => e.DocumentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ==================== DocumentVersion Configuration ====================
        modelBuilder.Entity<DocumentVersion>(entity =>
        {
            entity.ToTable("DocumentVersions", "document");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.StoragePath)
                .IsRequired()
                .HasMaxLength(500);

            entity.Property(e => e.FileHash)
                .HasMaxLength(64);

            entity.Property(e => e.ChangeDescription)
                .HasMaxLength(500);

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            // Composite unique index for document + version number
            entity.HasIndex(e => new { e.DocumentId, e.VersionNumber })
                .IsUnique();

            entity.HasIndex(e => e.CreatedById);

            // Relationships
            entity.HasOne(e => e.Document)
                .WithMany()
                .HasForeignKey(e => e.DocumentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ==================== UploadSession Configuration ====================
        modelBuilder.Entity<UploadSession>(entity =>
        {
            entity.ToTable("UploadSessions", "document");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.FileName)
                .IsRequired()
                .HasMaxLength(255);

            entity.Property(e => e.ContentType)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(e => e.TempPath)
                .HasMaxLength(500);

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            entity.Property(e => e.Status)
                .HasConversion<int>()
                .HasDefaultValue(UploadSessionStatus.InProgress);

            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.ExpiresAt);
            entity.HasIndex(e => e.CreatedAt);
        });
    }
}
