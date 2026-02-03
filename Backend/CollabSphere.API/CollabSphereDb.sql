-- 2.1 User Table
CREATE TABLE User (
    Id VARCHAR(255) PRIMARY KEY,
    Username VARCHAR(255) UNIQUE,
    Password VARCHAR(255),
    Code VARCHAR(255) UNIQUE,
    Cache VARCHAR(255),
    Gender VARCHAR(255),
    Avatar VARCHAR(255),
    FirstName VARCHAR(255),
    LastName VARCHAR(255),
    Email VARCHAR(255) UNIQUE,
    Dob DATE,
    Phone VARCHAR(255),
    Address VARCHAR(255),
    Department VARCHAR(255),
    CreatedDate DATE,
    CreatedBy VARCHAR(255),
    UpdatedDate DATE,
    UpdatedBy VARCHAR(255),
    IsDeleted BIT,
    Note VARCHAR(255)
);

-- 2.2 Role Table
CREATE TABLE Role (
    Id VARCHAR(255) PRIMARY KEY,
    RoleName BIGINT NOT NULL,
    CreatedDate DATE,
    CreatedBy VARCHAR(255),
    UpdatedDate DATE,
    UpdatedBy VARCHAR(255),
    IsDeleted BIT,
    Note VARCHAR(255)
);

-- 2.3 RefreshToken Table
CREATE TABLE RefreshToken (
    Id VARCHAR(255) PRIMARY KEY,
    UserId VARCHAR(255),
    Token VARCHAR(255),
    KeyId VARCHAR(255),
    PublicKey VARCHAR(255),
    UserAgent VARCHAR(255),
    IpAddress VARCHAR(255),
    Expiry DATE,
    CreatedDate DATE,
    CreatedBy VARCHAR(255),
    UpdatedDate DATE,
    UpdatedBy VARCHAR(255),
    IsDeleted BIT,
    Note VARCHAR(255),
    FOREIGN KEY (UserId) REFERENCES User(Id)
);

-- 2.4 Semester Table
CREATE TABLE Semester (
    Id VARCHAR(255) PRIMARY KEY,
    CriteriaFormId VARCHAR(255),
    SemesterCode VARCHAR(255),
    SemesterName VARCHAR(255),
    SemesterPrefixName VARCHAR(255),
    StartDate DATE,
    EndDate DATE,
    PublicTopicDate DATE,
    LimitTopicOnlyMentor INT,
    LimitTopicSubMentor INT,
    CreatedDate DATE,
    CreatedBy VARCHAR(255),
    UpdatedDate DATE,
    UpdatedBy VARCHAR(255),
    IsDeleted BIT,
    Note VARCHAR(255)
);

-- 2.5 UserXRole Table
CREATE TABLE UserXRole (
    Id VARCHAR(255) PRIMARY KEY,
    UserId VARCHAR(255),
    RoleId VARCHAR(255),
    SemesterId VARCHAR(255),
    IsPrimary BIT,
    CreatedDate DATE,
    CreatedBy VARCHAR(255),
    UpdatedDate DATE,
    UpdatedBy VARCHAR(255),
    IsDeleted BIT,
    Note VARCHAR(255),
    FOREIGN KEY (UserId) REFERENCES User(Id),
    FOREIGN KEY (RoleId) REFERENCES Role(Id),
    FOREIGN KEY (SemesterId) REFERENCES Semester(Id)
);

-- 2.6 Timeline Table
CREATE TABLE Timeline (
    Id VARCHAR(255) PRIMARY KEY,
    SemesterId VARCHAR(255),
    Title VARCHAR(255),
    StartDate DATE,
    EndDate DATE,
    CreatedDate DATE,
    CreatedBy VARCHAR(255),
    UpdatedDate DATE,
    UpdatedBy VARCHAR(255),
    IsDeleted BIT,
    Note VARCHAR(255),
    FOREIGN KEY (SemesterId) REFERENCES Semester(Id)
);

-- 2.7 StageIdea Table
CREATE TABLE StageIdea (
    Id VARCHAR(255) PRIMARY KEY,
    SemesterId VARCHAR(255),
    NumberReviewer INT,
    StartDate DATE,
    EndDate DATE,
    ResultDate DATE,
    StageNumber INT,
    CreatedDate DATE,
    CreatedBy VARCHAR(255),
    UpdatedDate DATE,
    UpdatedBy VARCHAR(255),
    IsDeleted BIT,
    Note VARCHAR(255),
    FOREIGN KEY (SemesterId) REFERENCES Semester(Id)
);

-- 2.8 Profession Table
CREATE TABLE Profession (
    Id VARCHAR(255) PRIMARY KEY,
    ProfessionName VARCHAR(225),
    CreatedDate DATE,
    CreatedBy VARCHAR(255),
    UpdatedDate DATE,
    UpdatedBy VARCHAR(255),
    IsDeleted BIT,
    Note VARCHAR(255)
);

-- 2.9 Specialty Table
CREATE TABLE Specialty (
    Id VARCHAR(255) PRIMARY KEY,
    ProfessionId VARCHAR(255),
    SpecialtyName VARCHAR(255),
    CreatedDate DATE,
    CreatedBy VARCHAR(255),
    UpdatedDate DATE,
    UpdatedBy VARCHAR(255),
    IsDeleted BIT,
    Note VARCHAR(255),
    FOREIGN KEY (ProfessionId) REFERENCES Profession(Id)
);

-- 2.10 Criteria Table
CREATE TABLE Criteria (
    Id VARCHAR(255) PRIMARY KEY,
    Question VARCHAR(255),
    ValueType VARCHAR(255),
    CreatedDate DATE,
    CreatedBy VARCHAR(255),
    UpdatedDate DATE,
    UpdatedBy VARCHAR(255),
    IsDeleted BIT,
    Note VARCHAR(255)
);

-- 2.11 CriteriaForm Table
CREATE TABLE CriteriaForm (
    Id VARCHAR(255) PRIMARY KEY,
    Title VARCHAR(255),
    CreatedDate DATE,
    CreatedBy VARCHAR(255),
    UpdatedDate DATE,
    UpdatedBy VARCHAR(255),
    IsDeleted BIT,
    Note VARCHAR(255)
);

-- 2.12 CriteriaXCriteriaForm Table
CREATE TABLE CriteriaXCriteriaForm (
    Id VARCHAR(255) PRIMARY KEY,
    CriteriaId VARCHAR(255) NOT NULL,
    CriteriaFormId VARCHAR(255) NOT NULL,
    CreatedDate DATE,
    CreatedBy VARCHAR(255),
    UpdatedDate DATE,
    UpdatedBy VARCHAR(255),
    IsDeleted BIT,
    Note VARCHAR(255),
    FOREIGN KEY (CriteriaId) REFERENCES Criteria(Id),
    FOREIGN KEY (CriteriaFormId) REFERENCES CriteriaForm(Id)
);

-- 2.13 Idea Table
CREATE TABLE Idea (
    Id VARCHAR(255) PRIMARY KEY,
    OwnerId VARCHAR(255),
    MentorId VARCHAR(255),
    SubMentorId VARCHAR(255),
    SpecialtyId VARCHAR(255),
    Type VARCHAR(255),
    Status VARCHAR(255),
    IsExistedTeam BIT,
    IsEnterpriseTopic BIT,
    CreatedDate DATE,
    CreatedBy VARCHAR(255),
    UpdatedDate DATE,
    UpdatedBy VARCHAR(255),
    IsDeleted BIT,
    Note VARCHAR(255),
    FOREIGN KEY (OwnerId) REFERENCES User(Id),
    FOREIGN KEY (MentorId) REFERENCES User(Id),
    FOREIGN KEY (SubMentorId) REFERENCES User(Id),
    FOREIGN KEY (SpecialtyId) REFERENCES Specialty(Id)
);

-- 2.14 IdeaVersion Table
CREATE TABLE IdeaVersion (
    Id VARCHAR(255) PRIMARY KEY,
    IdeaId VARCHAR(255),
    StageIdeaId VARCHAR(255),
    Version INT,
    Description VARCHAR(255),
    Abbreviations VARCHAR(255),
    VietNamName VARCHAR(255),
    EnglishName VARCHAR(255),
    File VARCHAR(255),
    TeamSize INT,
    CreatedDate DATE,
    CreatedBy VARCHAR(255),
    UpdatedDate DATE,
    UpdatedBy VARCHAR(255),
    IsDeleted BIT,
    Note VARCHAR(255),
    FOREIGN KEY (IdeaId) REFERENCES Idea(Id),
    FOREIGN KEY (StageIdeaId) REFERENCES StageIdea(Id)
);

-- 2.15 IdeaVersionRequest Table
CREATE TABLE IdeaVersionRequest (
    Id VARCHAR(255) PRIMARY KEY,
    IdeaVersionId VARCHAR(255),
    ReviewerId VARCHAR(255),
    CriteriaFormId VARCHAR(255),
    ProcessDate DATE,
    Status VARCHAR(255),
    Role VARCHAR(255),
    CreatedDate DATE,
    CreatedBy VARCHAR(255),
    UpdatedDate DATE,
    UpdatedBy VARCHAR(255),
    IsDeleted BIT,
    Note VARCHAR(255),
    FOREIGN KEY (IdeaVersionId) REFERENCES IdeaVersion(Id),
    FOREIGN KEY (ReviewerId) REFERENCES User(Id),
    FOREIGN KEY (CriteriaFormId) REFERENCES CriteriaForm(Id)
);

-- 2.16 AnswerCriteria Table
CREATE TABLE AnswerCriteria (
    Id VARCHAR(255) PRIMARY KEY,
    IdeaVersionRequestId VARCHAR(255),
    CriteriaId VARCHAR(255),
    Value VARCHAR(255),
    CreatedDate DATE,
    CreatedBy VARCHAR(255),
    UpdatedDate DATE,
    UpdatedBy VARCHAR(255),
    IsDeleted BIT,
    Note VARCHAR(255),
    FOREIGN KEY (IdeaVersionRequestId) REFERENCES IdeaVersionRequest(Id),
    FOREIGN KEY (CriteriaId) REFERENCES Criteria(Id)
);

-- 2.17 Topic Table
CREATE TABLE Topic (
    Id VARCHAR(255) PRIMARY KEY,
    IdeaVersionId VARCHAR(255),
    TopicCode VARCHAR(255),
    CreatedDate DATE,
    CreatedBy VARCHAR(255),
    UpdatedDate DATE,
    UpdatedBy VARCHAR(255),
    IsDeleted BIT,
    Note VARCHAR(255),
    FOREIGN KEY (IdeaVersionId) REFERENCES IdeaVersion(Id)
);

-- 2.18 TopicVersion Table
CREATE TABLE TopicVersion (
    Id VARCHAR(255) PRIMARY KEY,
    TopicId VARCHAR(255) UNIQUE NOT NULL,
    FileUpdate VARCHAR(255),
    ReviewStage INT,
    Status VARCHAR(255),
    Comment VARCHAR(255),
    CreatedDate DATE,
    CreatedBy VARCHAR(255),
    UpdatedDate DATE,
    UpdatedBy VARCHAR(255),
    IsDeleted BIT,
    Note VARCHAR(255),
    FOREIGN KEY (TopicId) REFERENCES Topic(Id)
);

-- 2.19 TopicVersionRequest Table
CREATE TABLE TopicVersionRequest (
    Id VARCHAR(255) PRIMARY KEY,
    TopicVersionId VARCHAR(255),
    ReviewerId VARCHAR(255),
    ProcessDate DATE,
    Status VARCHAR(255),
    Role VARCHAR(255),
    Feedback VARCHAR(255),
    CreatedDate DATE,
    CreatedBy VARCHAR(255),
    UpdatedDate DATE,
    UpdatedBy VARCHAR(255),
    IsDeleted BIT,
    Note VARCHAR(255),
    FOREIGN KEY (TopicVersionId) REFERENCES TopicVersion(Id),
    FOREIGN KEY (ReviewerId) REFERENCES User(Id)
);

-- 2.20 Project Table
CREATE TABLE Project (
    Id VARCHAR(255) PRIMARY KEY,
    LeaderId VARCHAR(255),
    TopicId VARCHAR(255),
    TeamName VARCHAR(255),
    TeamCode VARCHAR(255),
    Status VARCHAR(255),
    TeamSize INT,
    DefenseStage INT,
    CreatedDate DATE,
    CreatedBy VARCHAR(255),
    UpdatedDate DATE,
    UpdatedBy VARCHAR(255),
    IsDeleted BIT,
    Note VARCHAR(255),
    FOREIGN KEY (LeaderId) REFERENCES User(Id),
    FOREIGN KEY (TopicId) REFERENCES Topic(Id)
);

-- 2.21 TeamMember Table
CREATE TABLE TeamMember (
    Id VARCHAR(255) PRIMARY KEY,
    UserId VARCHAR(255),
    ProjectId VARCHAR(255),
    Role VARCHAR(255),
    JoinDate DATE,
    LeaveDate DATE,
    Status VARCHAR(255),
    Astude VARCHAR(255),
    MentorConclusion VARCHAR(255),
    CommentDefense1 VARCHAR(255),
    CommentDefense2 VARCHAR(255),
    CreatedDate DATE,
    CreatedBy VARCHAR(255),
    UpdatedDate DATE,
    UpdatedBy VARCHAR(255),
    IsDeleted BIT,
    Note VARCHAR(255),
    FOREIGN KEY (UserId) REFERENCES User(Id),
    FOREIGN KEY (ProjectId) REFERENCES Project(Id)
);

-- 2.22 Review Table
CREATE TABLE Review (
    Id VARCHAR(255) PRIMARY KEY,
    ProjectId VARCHAR(255),
    Reviewer1Id VARCHAR(255),
    Reviewer2Id VARCHAR(255),
    Number INT,
    ReviewDate DATE,
    Room VARCHAR(255),
    Slot VARCHAR(255),
    Description VARCHAR(255),
    FileUpload VARCHAR(255),
    CreatedDate DATE,
    CreatedBy VARCHAR(255),
    UpdatedDate DATE,
    UpdatedBy VARCHAR(255),
    IsDeleted BIT,
    Note VARCHAR(255),
    FOREIGN KEY (ProjectId) REFERENCES Project(Id),
    FOREIGN KEY (Reviewer1Id) REFERENCES User(Id),
    FOREIGN KEY (Reviewer2Id) REFERENCES User(Id)
);

-- 2.23 Invitation Table
CREATE TABLE Invitation (
    Id VARCHAR(255) PRIMARY KEY,
    ProjectId VARCHAR(255),
    SenderId VARCHAR(255),
    ReceiverId VARCHAR(255),
    Status VARCHAR(255),
    Type VARCHAR(255),
    Content VARCHAR(255),
    CreatedDate DATE,
    CreatedBy VARCHAR(255),
    UpdatedDate DATE,
    UpdatedBy VARCHAR(255),
    IsDeleted BIT,
    Note VARCHAR(255),
    FOREIGN KEY (ProjectId) REFERENCES Project(Id),
    FOREIGN KEY (SenderId) REFERENCES User(Id),
    FOREIGN KEY (ReceiverId) REFERENCES User(Id)
);

-- 2.24 MentorFeedback Table
CREATE TABLE MentorFeedback (
    Id VARCHAR(255) PRIMARY KEY,
    ProjectId VARCHAR(255) UNIQUE NOT NULL,
    ThesisContent VARCHAR(255),
    ThesisForm VARCHAR(255),
    AchievementLevel VARCHAR(255),
    Limitation VARCHAR(255),
    CreatedDate DATE,
    CreatedBy VARCHAR(255),
    UpdatedDate DATE,
    UpdatedBy VARCHAR(255),
    IsDeleted BIT,
    Note VARCHAR(255),
    FOREIGN KEY (ProjectId) REFERENCES Project(Id)
);

-- 2.25 ProfileStudent Table
CREATE TABLE ProfileStudent (
    Id VARCHAR(255) PRIMARY KEY,
    UserId VARCHAR(255) UNIQUE NOT NULL,
    SpecialityId VARCHAR(255) NOT NULL,
    SemesterId VARCHAR(255) NOT NULL,
    Bio VARCHAR(255),
    Achievement VARCHAR(255),
    ExperienceProject VARCHAR(255),
    Interest VARCHAR(255),
    FileCv VARCHAR(255),
    CreatedDate DATE,
    CreatedBy VARCHAR(255),
    UpdatedDate DATE,
    UpdatedBy VARCHAR(255),
    IsDeleted BIT,
    Note VARCHAR(255),
    FOREIGN KEY (UserId) REFERENCES User(Id),
    FOREIGN KEY (SpecialityId) REFERENCES Specialty(Id),
    FOREIGN KEY (SemesterId) REFERENCES Semester(Id)
);

-- 2.26 SkillProfile Table
CREATE TABLE SkillProfile (
    Id VARCHAR(255) PRIMARY KEY,
    ProfileStudentId VARCHAR(255) UNIQUE NOT NULL,
    FullSkill VARCHAR(255),
    Json VARCHAR(255),
    CreatedDate DATE,
    CreatedBy VARCHAR(255),
    UpdatedDate DATE,
    UpdatedBy VARCHAR(255),
    IsDeleted BIT,
    Note VARCHAR(255),
    FOREIGN KEY (ProfileStudentId) REFERENCES ProfileStudent(Id)
);

-- 2.27 Notification Table
CREATE TABLE Notification (
    Id VARCHAR(255) PRIMARY KEY,
    UserId VARCHAR(255),
    ProjectId VARCHAR(255),
    Description VARCHAR(255),
    Type VARCHAR(255),
    Role VARCHAR(255),
    IsRead BIT,
    CreatedDate DATE,
    CreatedBy VARCHAR(255),
    UpdatedDate DATE,
    UpdatedBy VARCHAR(255),
    IsDeleted BIT,
    Note VARCHAR(255),
    FOREIGN KEY (UserId) REFERENCES User(Id),
    FOREIGN KEY (ProjectId) REFERENCES Project(Id)
);

-- 2.28 Conversation Table
CREATE TABLE Conversation (
    Id VARCHAR(255) PRIMARY KEY,
    ConversationName VARCHAR(255)
);

-- 2.29 ConversationMember Table
CREATE TABLE ConversationMember (
    Id VARCHAR(255) PRIMARY KEY,
    UserId VARCHAR(255) NOT NULL,
    ConversationId VARCHAR(255) NOT NULL,
    FOREIGN KEY (UserId) REFERENCES User(Id),
    FOREIGN KEY (ConversationId) REFERENCES Conversation(Id)
);

-- 2.30 Message Table
CREATE TABLE Message (
    Id VARCHAR(255) PRIMARY KEY,
    ConversationId VARCHAR(255) NOT NULL,
    SendById VARCHAR(255) NOT NULL,
    Content VARCHAR(255),
    CreatedDate DATE,
    FOREIGN KEY (ConversationId) REFERENCES Conversation(Id),
    FOREIGN KEY (SendById) REFERENCES User(Id)
);

-- 2.31 Blog Table
CREATE TABLE Blog (
    Id VARCHAR(255) PRIMARY KEY,
    UserId VARCHAR(255),
    ProjectId VARCHAR(255),
    Title VARCHAR(255),
    Content VARCHAR(255),
    SkillRequired VARCHAR(255),
    Type VARCHAR(255),
    Status VARCHAR(255),
    CreatedDate DATE,
    CreatedBy VARCHAR(255),
    UpdatedDate DATE,
    UpdatedBy VARCHAR(255),
    IsDeleted BIT,
    Note VARCHAR(255),
    FOREIGN KEY (UserId) REFERENCES User(Id),
    FOREIGN KEY (ProjectId) REFERENCES Project(Id)
);

-- 2.32 BlogCv Table
CREATE TABLE BlogCv (
    Id VARCHAR(255) PRIMARY KEY,
    BlogId VARCHAR(255),
    UserId VARCHAR(255),
    FileCv VARCHAR(255),
    CreatedDate DATE,
    CreatedBy VARCHAR(255),
    UpdatedDate DATE,
    UpdatedBy VARCHAR(255),
    IsDeleted BIT,
    Note VARCHAR(255),
    FOREIGN KEY (BlogId) REFERENCES Blog(Id),
    FOREIGN KEY (UserId) REFERENCES User(Id)
);

-- 2.33 Like Table
CREATE TABLE Like (
    Id VARCHAR(255) PRIMARY KEY,
    BlogId VARCHAR(255) NOT NULL,
    UserId VARCHAR(255) NOT NULL,
    CreatedDate DATE,
    CreatedBy VARCHAR(255),
    UpdatedDate DATE,
    UpdatedBy VARCHAR(255),
    IsDeleted BIT,
    Note VARCHAR(255),
    FOREIGN KEY (BlogId) REFERENCES Blog(Id),
    FOREIGN KEY (UserId) REFERENCES User(Id)
);

-- 2.34 Comment Table
CREATE TABLE Comment (
    Id VARCHAR(255) PRIMARY KEY,
    BlogId VARCHAR(255),
    UserId VARCHAR(255),
    Content VARCHAR(255),
    CreatedDate DATE,
    CreatedBy VARCHAR(255),
    UpdatedDate DATE,
    UpdatedBy VARCHAR(255),
    IsDeleted BIT,
    Note VARCHAR(255),
    FOREIGN KEY (BlogId) REFERENCES Blog(Id),
    FOREIGN KEY (UserId) REFERENCES User(Id)
);

-- 2.35 Rate Table
CREATE TABLE Rate (
    Id VARCHAR(255) PRIMARY KEY,
    RateForId VARCHAR(255),
    RateById VARCHAR(255),
    PercentContribution DOUBLE,
    Content VARCHAR(255),
    CreatedDate DATE,
    CreatedBy VARCHAR(255),
    UpdatedDate DATE,
    UpdatedBy VARCHAR(255),
    IsDeleted BIT,
    Note VARCHAR(255),
    FOREIGN KEY (RateForId) REFERENCES User(Id),
    FOREIGN KEY (RateById) REFERENCES User(Id)
);

-- 2.36 CapstoneSchedule Table
CREATE TABLE CapstoneSchedule (
    Id VARCHAR(255) PRIMARY KEY,
    ProjectId VARCHAR(255),
    Time VARCHAR(255),
    Date DATE,
    HallName VARCHAR(255),
    Stage INT,
    CreatedDate DATE,
    CreatedBy VARCHAR(255),
    UpdatedDate DATE,
    UpdatedBy VARCHAR(255),
    IsDeleted BIT,
    Note VARCHAR(255),
    FOREIGN KEY (ProjectId) REFERENCES Project(Id)
);

-- 2.37 MentorTopicRequest Table
CREATE TABLE MentorTopicRequest (
    Id VARCHAR(255) PRIMARY KEY,
    ProjectId VARCHAR(255),
    IdeaId VARCHAR(255),
    Status VARCHAR(255),
    CreatedDate DATE,
    CreatedBy VARCHAR(255),
    UpdatedDate DATE,
    UpdatedBy VARCHAR(255),
    IsDeleted BIT,
    Note VARCHAR(255),
    FOREIGN KEY (ProjectId) REFERENCES Project(Id),
    FOREIGN KEY (IdeaId) REFERENCES Idea(Id)
);