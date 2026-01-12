-- ==================== CommHub Database Initialization Script ====================
-- This script runs when the SQL Server container starts for the first time
-- It creates the database and initial schema if they don't exist

USE master;
GO

-- Create the database if it doesn't exist
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'CommHub')
BEGIN
    CREATE DATABASE CommHub;
    PRINT 'Database CommHub created successfully.';
END
GO

USE CommHub;
GO

-- ==================== Users Table ====================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    CREATE TABLE Users (
        Id NVARCHAR(450) NOT NULL PRIMARY KEY,
        Username NVARCHAR(100) NOT NULL,
        Email NVARCHAR(256) NOT NULL,
        FullName NVARCHAR(200) NOT NULL,
        AvatarUrl NVARCHAR(500) NULL,
        PasswordHash NVARCHAR(255) NULL,
        RefreshToken NVARCHAR(500) NULL,
        RefreshTokenExpiryTime DATETIME2 NULL,
        IsOnline BIT NOT NULL DEFAULT 0,
        LastSeen DATETIME2 NULL,
        ConnectionId NVARCHAR(450) NULL,
        EmailVerified BIT NOT NULL DEFAULT 0,
        FailedLoginAttempts INT NOT NULL DEFAULT 0,
        LockoutEnd DATETIME2 NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NULL,
        IsDeleted BIT NOT NULL DEFAULT 0
    );

    CREATE UNIQUE INDEX IX_Users_Email ON Users(Email) WHERE IsDeleted = 0;
    CREATE UNIQUE INDEX IX_Users_Username ON Users(Username) WHERE IsDeleted = 0;
    CREATE INDEX IX_Users_IsOnline ON Users(IsOnline);
    CREATE INDEX IX_Users_RefreshToken ON Users(RefreshToken);
    CREATE INDEX IX_Users_LockoutEnd ON Users(LockoutEnd);

    PRINT 'Table Users created successfully.';
END
GO

-- ==================== Migration: Add auth columns if they don't exist ====================
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'PasswordHash')
    BEGIN
        ALTER TABLE Users ADD PasswordHash NVARCHAR(255) NULL;
        PRINT 'Column PasswordHash added to Users table.';
    END

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'RefreshToken')
    BEGIN
        ALTER TABLE Users ADD RefreshToken NVARCHAR(500) NULL;
        CREATE INDEX IX_Users_RefreshToken ON Users(RefreshToken);
        PRINT 'Column RefreshToken added to Users table.';
    END

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'RefreshTokenExpiryTime')
    BEGIN
        ALTER TABLE Users ADD RefreshTokenExpiryTime DATETIME2 NULL;
        PRINT 'Column RefreshTokenExpiryTime added to Users table.';
    END

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'ConnectionId')
    BEGIN
        ALTER TABLE Users ADD ConnectionId NVARCHAR(450) NULL;
        PRINT 'Column ConnectionId added to Users table.';
    END

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'EmailVerified')
    BEGIN
        ALTER TABLE Users ADD EmailVerified BIT NOT NULL DEFAULT 0;
        PRINT 'Column EmailVerified added to Users table.';
    END

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'FailedLoginAttempts')
    BEGIN
        ALTER TABLE Users ADD FailedLoginAttempts INT NOT NULL DEFAULT 0;
        PRINT 'Column FailedLoginAttempts added to Users table.';
    END

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'LockoutEnd')
    BEGIN
        ALTER TABLE Users ADD LockoutEnd DATETIME2 NULL;
        CREATE INDEX IX_Users_LockoutEnd ON Users(LockoutEnd);
        PRINT 'Column LockoutEnd added to Users table.';
    END
END
GO

-- ==================== Conversations Table ====================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Conversations')
BEGIN
    CREATE TABLE Conversations (
        Id NVARCHAR(450) NOT NULL PRIMARY KEY,
        Name NVARCHAR(200) NOT NULL,
        Type NVARCHAR(50) NOT NULL DEFAULT 'private', -- 'private' or 'group'
        AvatarUrl NVARCHAR(500) NULL,
        CreatedById NVARCHAR(450) NULL,
        LastMessagePreview NVARCHAR(500) NULL,
        LastMessageAt DATETIME2 NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NULL,
        IsDeleted BIT NOT NULL DEFAULT 0,

        CONSTRAINT FK_Conversations_CreatedBy FOREIGN KEY (CreatedById) REFERENCES Users(Id)
    );

    CREATE INDEX IX_Conversations_LastMessageAt ON Conversations(LastMessageAt DESC);
    CREATE INDEX IX_Conversations_Type ON Conversations(Type);

    PRINT 'Table Conversations created successfully.';
END
GO

-- ==================== ConversationParticipants Table ====================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ConversationParticipants')
BEGIN
    CREATE TABLE ConversationParticipants (
        Id NVARCHAR(450) NOT NULL PRIMARY KEY,
        ConversationId NVARCHAR(450) NOT NULL,
        UserId NVARCHAR(450) NOT NULL,
        Role NVARCHAR(50) NOT NULL DEFAULT 'member', -- 'admin' or 'member'
        IsPinned BIT NOT NULL DEFAULT 0,
        IsMuted BIT NOT NULL DEFAULT 0,
        UnreadCount INT NOT NULL DEFAULT 0,
        LastReadAt DATETIME2 NULL,
        JoinedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        LeftAt DATETIME2 NULL,

        CONSTRAINT FK_ConversationParticipants_Conversation FOREIGN KEY (ConversationId) REFERENCES Conversations(Id) ON DELETE CASCADE,
        CONSTRAINT FK_ConversationParticipants_User FOREIGN KEY (UserId) REFERENCES Users(Id)
    );

    CREATE UNIQUE INDEX IX_ConversationParticipants_Unique ON ConversationParticipants(ConversationId, UserId) WHERE LeftAt IS NULL;
    CREATE INDEX IX_ConversationParticipants_UserId ON ConversationParticipants(UserId);

    PRINT 'Table ConversationParticipants created successfully.';
END
GO

-- ==================== Messages Table ====================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Messages')
BEGIN
    CREATE TABLE Messages (
        Id NVARCHAR(450) NOT NULL PRIMARY KEY,
        ConversationId NVARCHAR(450) NOT NULL,
        SenderId NVARCHAR(450) NOT NULL,
        Content NVARCHAR(MAX) NOT NULL,
        Type INT NOT NULL DEFAULT 0, -- 0: Text, 1: Image, 2: File, 3: System
        AttachmentId NVARCHAR(450) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        EditedAt DATETIME2 NULL,
        IsDeleted BIT NOT NULL DEFAULT 0,
        DeletedAt DATETIME2 NULL,

        CONSTRAINT FK_Messages_Conversation FOREIGN KEY (ConversationId) REFERENCES Conversations(Id) ON DELETE CASCADE,
        CONSTRAINT FK_Messages_Sender FOREIGN KEY (SenderId) REFERENCES Users(Id)
    );

    CREATE INDEX IX_Messages_ConversationId ON Messages(ConversationId, CreatedAt DESC);
    CREATE INDEX IX_Messages_SenderId ON Messages(SenderId);
    CREATE INDEX IX_Messages_CreatedAt ON Messages(CreatedAt DESC);

    PRINT 'Table Messages created successfully.';
END
GO

-- ==================== MessageReadStatus Table ====================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MessageReadStatus')
BEGIN
    CREATE TABLE MessageReadStatus (
        Id NVARCHAR(450) NOT NULL PRIMARY KEY,
        MessageId NVARCHAR(450) NOT NULL,
        UserId NVARCHAR(450) NOT NULL,
        ReadAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

        CONSTRAINT FK_MessageReadStatus_Message FOREIGN KEY (MessageId) REFERENCES Messages(Id) ON DELETE CASCADE,
        CONSTRAINT FK_MessageReadStatus_User FOREIGN KEY (UserId) REFERENCES Users(Id)
    );

    CREATE UNIQUE INDEX IX_MessageReadStatus_Unique ON MessageReadStatus(MessageId, UserId);
    CREATE INDEX IX_MessageReadStatus_UserId ON MessageReadStatus(UserId);

    PRINT 'Table MessageReadStatus created successfully.';
END
GO

-- ==================== Notifications Table ====================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Notifications')
BEGIN
    CREATE TABLE Notifications (
        Id NVARCHAR(450) NOT NULL PRIMARY KEY,
        UserId NVARCHAR(450) NOT NULL,
        Title NVARCHAR(200) NOT NULL,
        Content NVARCHAR(500) NOT NULL,
        Type NVARCHAR(50) NOT NULL DEFAULT 'System', -- System, Message, DocumentShared, etc.
        ReferenceId NVARCHAR(450) NULL,
        ActionUrl NVARCHAR(500) NULL,
        IsRead BIT NOT NULL DEFAULT 0,
        ReadAt DATETIME2 NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        IsDeleted BIT NOT NULL DEFAULT 0,

        CONSTRAINT FK_Notifications_User FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
    );

    CREATE INDEX IX_Notifications_UserId ON Notifications(UserId, CreatedAt DESC);
    CREATE INDEX IX_Notifications_IsRead ON Notifications(UserId, IsRead);
    CREATE INDEX IX_Notifications_Type ON Notifications(Type);

    PRINT 'Table Notifications created successfully.';
END
GO

-- ==================== Documents Table ====================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Documents')
BEGIN
    CREATE TABLE Documents (
        Id NVARCHAR(450) NOT NULL PRIMARY KEY,
        FileName NVARCHAR(256) NOT NULL,
        FilePath NVARCHAR(1000) NOT NULL,
        ContentType NVARCHAR(100) NOT NULL,
        FileSize BIGINT NOT NULL,
        FileExtension NVARCHAR(20) NOT NULL,
        Description NVARCHAR(500) NULL,
        UploadedByUserId NVARCHAR(450) NOT NULL,
        ConversationId NVARCHAR(450) NULL,
        GroupId NVARCHAR(450) NULL,
        DownloadCount INT NOT NULL DEFAULT 0,
        LastDownloadedAt DATETIME2 NULL,
        Status NVARCHAR(50) NOT NULL DEFAULT 'Active', -- Active, Archived, Deleted, Processing
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NULL,
        IsDeleted BIT NOT NULL DEFAULT 0,

        CONSTRAINT FK_Documents_UploadedBy FOREIGN KEY (UploadedByUserId) REFERENCES Users(Id),
        CONSTRAINT FK_Documents_Conversation FOREIGN KEY (ConversationId) REFERENCES Conversations(Id)
    );

    CREATE INDEX IX_Documents_UploadedBy ON Documents(UploadedByUserId);
    CREATE INDEX IX_Documents_ConversationId ON Documents(ConversationId);
    CREATE INDEX IX_Documents_CreatedAt ON Documents(CreatedAt DESC);
    CREATE INDEX IX_Documents_Status ON Documents(Status);
    CREATE INDEX IX_Documents_FileExtension ON Documents(FileExtension);

    PRINT 'Table Documents created successfully.';
END
GO

-- ==================== UserConnections Table (for SignalR tracking) ====================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserConnections')
BEGIN
    CREATE TABLE UserConnections (
        Id NVARCHAR(450) NOT NULL PRIMARY KEY,
        UserId NVARCHAR(450) NOT NULL,
        ConnectionId NVARCHAR(450) NOT NULL,
        HubName NVARCHAR(100) NOT NULL, -- 'ChatHub' or 'NotificationHub'
        UserAgent NVARCHAR(500) NULL,
        IpAddress NVARCHAR(50) NULL,
        ConnectedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        DisconnectedAt DATETIME2 NULL,

        CONSTRAINT FK_UserConnections_User FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
    );

    CREATE INDEX IX_UserConnections_UserId ON UserConnections(UserId);
    CREATE INDEX IX_UserConnections_ConnectionId ON UserConnections(ConnectionId);
    CREATE INDEX IX_UserConnections_HubName ON UserConnections(HubName);

    PRINT 'Table UserConnections created successfully.';
END
GO

-- ==================== Insert Demo Users ====================
-- Demo password hash for 'password123' using BCrypt
-- In production, passwords should be hashed by the application, not stored in SQL scripts
-- This is only for demo/testing purposes
IF NOT EXISTS (SELECT * FROM Users WHERE Email = 'john@example.com')
BEGIN
    INSERT INTO Users (Id, Username, Email, FullName, AvatarUrl, PasswordHash, IsOnline, EmailVerified, CreatedAt)
    VALUES
        (NEWID(), 'johndoe', 'john@example.com', 'John Doe', 'https://api.dicebear.com/7.x/avataaars/svg?seed=johndoe', NULL, 0, 1, GETUTCDATE()),
        (NEWID(), 'janesmith', 'jane@example.com', 'Jane Smith', 'https://api.dicebear.com/7.x/avataaars/svg?seed=janesmith', NULL, 0, 1, GETUTCDATE()),
        (NEWID(), 'bobwilson', 'bob@example.com', 'Bob Wilson', 'https://api.dicebear.com/7.x/avataaars/svg?seed=bobwilson', NULL, 0, 1, GETUTCDATE()),
        (NEWID(), 'alicejones', 'alice@example.com', 'Alice Jones', 'https://api.dicebear.com/7.x/avataaars/svg?seed=alicejones', NULL, 0, 1, GETUTCDATE());

    PRINT 'Demo users inserted successfully (no password - demo mode allows any password).';
END
GO

-- ==================== Insert Demo Conversation ====================
DECLARE @JohnId NVARCHAR(450);
DECLARE @JaneId NVARCHAR(450);
DECLARE @ConvId NVARCHAR(450);

SELECT @JohnId = Id FROM Users WHERE Email = 'john@example.com';
SELECT @JaneId = Id FROM Users WHERE Email = 'jane@example.com';

IF @JohnId IS NOT NULL AND @JaneId IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT * FROM Conversations WHERE Name = 'John & Jane')
    BEGIN
        SET @ConvId = NEWID();

        INSERT INTO Conversations (Id, Name, Type, CreatedById, CreatedAt)
        VALUES (@ConvId, 'John & Jane', 'private', @JohnId, GETUTCDATE());

        INSERT INTO ConversationParticipants (Id, ConversationId, UserId, Role, JoinedAt)
        VALUES
            (NEWID(), @ConvId, @JohnId, 'member', GETUTCDATE()),
            (NEWID(), @ConvId, @JaneId, 'member', GETUTCDATE());

        -- Insert demo messages
        INSERT INTO Messages (Id, ConversationId, SenderId, Content, Type, CreatedAt)
        VALUES
            (NEWID(), @ConvId, @JohnId, 'Hi Jane! Welcome to CommHub!', 0, DATEADD(MINUTE, -30, GETUTCDATE())),
            (NEWID(), @ConvId, @JaneId, 'Hey John! Thanks, this looks great!', 0, DATEADD(MINUTE, -25, GETUTCDATE())),
            (NEWID(), @ConvId, @JohnId, 'Let me know if you need any help.', 0, DATEADD(MINUTE, -20, GETUTCDATE()));

        -- Update last message preview
        UPDATE Conversations
        SET LastMessagePreview = 'Let me know if you need any help.',
            LastMessageAt = DATEADD(MINUTE, -20, GETUTCDATE())
        WHERE Id = @ConvId;

        PRINT 'Demo conversation and messages created successfully.';
    END
END
GO

-- ==================== Insert Demo Notifications ====================
DECLARE @UserId NVARCHAR(450);
SELECT @UserId = Id FROM Users WHERE Email = 'john@example.com';

IF @UserId IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT * FROM Notifications WHERE UserId = @UserId)
    BEGIN
        INSERT INTO Notifications (Id, UserId, Title, Content, Type, IsRead, CreatedAt)
        VALUES
            (NEWID(), @UserId, 'Welcome to CommHub!', 'Thanks for joining. Start chatting with your team now.', 'System', 0, DATEADD(HOUR, -1, GETUTCDATE())),
            (NEWID(), @UserId, 'New message from Jane', 'Hey John! Thanks, this looks great!', 'Message', 0, DATEADD(MINUTE, -25, GETUTCDATE())),
            (NEWID(), @UserId, 'Profile tip', 'Complete your profile to help others find you.', 'System', 1, DATEADD(DAY, -1, GETUTCDATE()));

        PRINT 'Demo notifications created successfully.';
    END
END
GO

PRINT 'CommHub database initialization completed successfully!';
GO
