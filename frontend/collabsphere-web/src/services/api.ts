import {
  Project,
  Milestone,
  CreateProjectRequest,
  CreateMilestoneRequest,
  ApiResponse,
  User,
  Subject,
  Syllabus,
  Class,
  ClassMember,
  Team,
  TeamMember,
  Checkpoint,
  WorkspaceCard,
  Task,
  ChatRoom,
  ChatMessage,
  Notification,
  Resource,
  Meeting,
  Evaluation,
  PeerReview
} from '../types';

// ============= MOCK MODE =============
// Controlled by VITE_USE_MOCK environment variable
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_USE_MOCK === true;
// =====================================

// ============= MOCK API CONSTANTS =============
const MOCK_DELAYS = {
  DEFAULT: 300,
  LOGIN: 500,
  IMPORT: 1000,
} as const;

// ==================== STORAGE HELPERS ====================
const getStorage = <T>(key: string, defaultValue: T[] = []): T[] => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage key "${key}":`, error);
    return defaultValue;
  }
};

const setStorage = <T>(key: string, data: T[]): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error writing to localStorage key "${key}":`, error);
    // Handle quota exceeded or other storage errors gracefully
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded. Consider clearing old data.');
    }
  }
};

// Storage keys
const KEYS = {
  PROJECTS: 'mock_projects',
  MILESTONES: 'mock_milestones',
  SUBJECTS: 'mock_subjects',
  SYLLABUS: 'mock_syllabus',
  CLASSES: 'mock_classes',
  CLASS_MEMBERS: 'mock_class_members',
  USERS: 'mock_users',
  TEAMS: 'mock_teams',
  TEAM_MEMBERS: 'mock_team_members',
  CHECKPOINTS: 'mock_checkpoints',
  CARDS: 'mock_cards',
  TASKS: 'mock_tasks',
  CHAT_ROOMS: 'mock_chat_rooms',
  MESSAGES: 'mock_messages',
  NOTIFICATIONS: 'mock_notifications',
  RESOURCES: 'mock_resources',
  MEETINGS: 'mock_meetings',
  EVALUATIONS: 'mock_evaluations',
  PEER_REVIEWS: 'mock_peer_reviews'
};

// Helper to create mock response with delay
const mockResponse = <T>(data: T, delay = MOCK_DELAYS.DEFAULT): Promise<{ data: ApiResponse<T> }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ data: { isSuccess: true, data } });
    }, delay);
  });
};

const mockError = (message: string): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => reject({ response: { data: { message } } }), MOCK_DELAYS.DEFAULT);
  });
};

// ==================== INITIALIZE MOCK DATA ====================
const initializeMockData = () => {
  // Initialize Users
  if (!localStorage.getItem(KEYS.USERS)) {
    const users: User[] = [
      { id: 'admin-1', email: 'admin@collabsphere.com', fullName: 'System Admin', role: 'Admin', createdAt: new Date().toISOString(), isActive: true },
      { id: 'staff-1', email: 'staff@collabsphere.com', fullName: 'Staff Member', role: 'Staff', department: 'Academic Affairs', createdAt: new Date().toISOString(), isActive: true },
      { id: 'head-1', email: 'head@collabsphere.com', fullName: 'Dr. John Smith', role: 'HeadDepartment', department: 'Computer Science', createdAt: new Date().toISOString(), isActive: true },
      { id: 'lecturer-1', email: 'lecturer@collabsphere.com', fullName: 'Prof. Jane Doe', role: 'Lecturer', department: 'Computer Science', createdAt: new Date().toISOString(), isActive: true },
      { id: 'lecturer-2', email: 'lecturer2@collabsphere.com', fullName: 'Dr. Michael Brown', role: 'Lecturer', department: 'Computer Science', createdAt: new Date().toISOString(), isActive: true },
      { id: 'student-1', email: 'student1@collabsphere.com', fullName: 'Alice Johnson', role: 'Student', createdAt: new Date().toISOString(), isActive: true },
      { id: 'student-2', email: 'student2@collabsphere.com', fullName: 'Bob Williams', role: 'Student', createdAt: new Date().toISOString(), isActive: true },
      { id: 'student-3', email: 'student3@collabsphere.com', fullName: 'Charlie Davis', role: 'Student', createdAt: new Date().toISOString(), isActive: true },
      { id: 'student-4', email: 'student4@collabsphere.com', fullName: 'Diana Miller', role: 'Student', createdAt: new Date().toISOString(), isActive: true },
      { id: 'student-5', email: 'student5@collabsphere.com', fullName: 'Edward Wilson', role: 'Student', createdAt: new Date().toISOString(), isActive: true },
    ];
    setStorage(KEYS.USERS, users);
  }

  // Initialize Subjects
  if (!localStorage.getItem(KEYS.SUBJECTS)) {
    const subjects: Subject[] = [
      { id: 'subj-1', code: 'CS101', name: 'Introduction to Programming', credits: 3, description: 'Basic programming concepts', department: 'Computer Science', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'subj-2', code: 'CS201', name: 'Data Structures & Algorithms', credits: 4, description: 'Advanced data structures', department: 'Computer Science', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'subj-3', code: 'CS301', name: 'Software Engineering', credits: 4, description: 'Software development methodologies', department: 'Computer Science', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'subj-4', code: 'CS401', name: 'Project-Based Learning', credits: 4, description: 'Capstone project course', department: 'Computer Science', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ];
    setStorage(KEYS.SUBJECTS, subjects);
  }

  // Initialize Classes
  if (!localStorage.getItem(KEYS.CLASSES)) {
    const classes: Class[] = [
      { id: 'class-1', code: 'CS101-01', name: 'Intro to Programming - Section 1', subjectId: 'subj-1', subjectName: 'Introduction to Programming', lecturerId: 'lecturer-1', lecturerName: 'Prof. Jane Doe', semester: 'Fall', academicYear: '2024-2025', studentCount: 30, maxStudents: 35, schedule: 'Mon/Wed 9:00-10:30', room: 'Room A101', status: 'Active', createdAt: new Date().toISOString() },
      { id: 'class-2', code: 'CS301-01', name: 'Software Engineering - Section 1', subjectId: 'subj-3', subjectName: 'Software Engineering', lecturerId: 'lecturer-1', lecturerName: 'Prof. Jane Doe', semester: 'Fall', academicYear: '2024-2025', studentCount: 25, maxStudents: 30, schedule: 'Tue/Thu 14:00-15:30', room: 'Room B202', status: 'Active', createdAt: new Date().toISOString() },
      { id: 'class-3', code: 'CS401-01', name: 'Project-Based Learning - Section 1', subjectId: 'subj-4', subjectName: 'Project-Based Learning', lecturerId: 'lecturer-2', lecturerName: 'Dr. Michael Brown', semester: 'Fall', academicYear: '2024-2025', studentCount: 20, maxStudents: 25, schedule: 'Fri 9:00-12:00', room: 'Lab C301', status: 'Active', createdAt: new Date().toISOString() },
    ];
    setStorage(KEYS.CLASSES, classes);
  }

  // Initialize Teams
  if (!localStorage.getItem(KEYS.TEAMS)) {
    const teams: Team[] = [
      { id: 'team-1', name: 'Team Alpha', classId: 'class-2', className: 'Software Engineering - Section 1', projectId: 'proj-1', projectName: 'E-commerce Platform', leaderId: 'student-1', leaderName: 'Alice Johnson', memberCount: 4, maxMembers: 5, progress: 65, status: 'Active', createdAt: new Date().toISOString() },
      { id: 'team-2', name: 'Team Beta', classId: 'class-2', className: 'Software Engineering - Section 1', projectId: 'proj-2', projectName: 'Mobile Banking App', leaderId: 'student-3', leaderName: 'Charlie Davis', memberCount: 3, maxMembers: 5, progress: 45, status: 'Active', createdAt: new Date().toISOString() },
      { id: 'team-3', name: 'Team Gamma', classId: 'class-3', className: 'Project-Based Learning - Section 1', leaderId: 'student-5', leaderName: 'Edward Wilson', memberCount: 5, maxMembers: 5, progress: 30, status: 'Active', createdAt: new Date().toISOString() },
    ];
    setStorage(KEYS.TEAMS, teams);
  }

  // Initialize Team Members
  if (!localStorage.getItem(KEYS.TEAM_MEMBERS)) {
    const members: TeamMember[] = [
      { id: 'tm-1', teamId: 'team-1', userId: 'student-1', fullName: 'Alice Johnson', email: 'student1@collabsphere.com', role: 'Leader', contribution: 30, joinedAt: new Date().toISOString() },
      { id: 'tm-2', teamId: 'team-1', userId: 'student-2', fullName: 'Bob Williams', email: 'student2@collabsphere.com', role: 'Member', contribution: 25, joinedAt: new Date().toISOString() },
      { id: 'tm-3', teamId: 'team-1', userId: 'student-3', fullName: 'Charlie Davis', email: 'student3@collabsphere.com', role: 'Member', contribution: 25, joinedAt: new Date().toISOString() },
      { id: 'tm-4', teamId: 'team-1', userId: 'student-4', fullName: 'Diana Miller', email: 'student4@collabsphere.com', role: 'Member', contribution: 20, joinedAt: new Date().toISOString() },
    ];
    setStorage(KEYS.TEAM_MEMBERS, members);
  }

  // Initialize Checkpoints
  if (!localStorage.getItem(KEYS.CHECKPOINTS)) {
    const checkpoints: Checkpoint[] = [
      { id: 'cp-1', teamId: 'team-1', name: 'Checkpoint 1: Requirements', description: 'Submit project requirements document', dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), status: 'Submitted', assignedMembers: ['student-1', 'student-2'], submittedAt: new Date().toISOString(), createdAt: new Date().toISOString() },
      { id: 'cp-2', teamId: 'team-1', name: 'Checkpoint 2: Design', description: 'Submit system design document', dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), status: 'Pending', assignedMembers: ['student-3', 'student-4'], createdAt: new Date().toISOString() },
    ];
    setStorage(KEYS.CHECKPOINTS, checkpoints);
  }

  // Initialize Workspace Cards
  if (!localStorage.getItem(KEYS.CARDS)) {
    const cards: WorkspaceCard[] = [
      { id: 'card-1', teamId: 'team-1', title: 'Setup project repository', description: 'Create GitHub repo and setup CI/CD', status: 'Done', priority: 'High', assigneeId: 'student-1', assigneeName: 'Alice Johnson', order: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'card-2', teamId: 'team-1', title: 'Design database schema', description: 'Create ERD and define tables', status: 'InProgress', priority: 'High', assigneeId: 'student-2', assigneeName: 'Bob Williams', order: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'card-3', teamId: 'team-1', title: 'Implement user authentication', description: 'JWT auth with refresh tokens', status: 'Todo', priority: 'Medium', assigneeId: 'student-3', assigneeName: 'Charlie Davis', order: 3, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'card-4', teamId: 'team-1', title: 'Create API documentation', description: 'Swagger/OpenAPI docs', status: 'Review', priority: 'Low', assigneeId: 'student-4', assigneeName: 'Diana Miller', order: 4, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ];
    setStorage(KEYS.CARDS, cards);
  }

  // Initialize Chat Rooms
  if (!localStorage.getItem(KEYS.CHAT_ROOMS)) {
    const rooms: ChatRoom[] = [
      { id: 'room-1', name: 'Team Alpha Chat', type: 'Team', teamId: 'team-1', participants: ['student-1', 'student-2', 'student-3', 'student-4', 'lecturer-1'], unreadCount: 2, createdAt: new Date().toISOString() },
      { id: 'room-2', name: 'Team Beta Chat', type: 'Team', teamId: 'team-2', participants: ['student-3', 'student-4', 'student-5', 'lecturer-1'], unreadCount: 0, createdAt: new Date().toISOString() },
      { id: 'room-3', name: 'CS301 Class Discussion', type: 'Class', classId: 'class-2', participants: ['lecturer-1', 'student-1', 'student-2', 'student-3', 'student-4', 'student-5'], unreadCount: 5, createdAt: new Date().toISOString() },
    ];
    setStorage(KEYS.CHAT_ROOMS, rooms);
  }

  // Initialize Messages
  if (!localStorage.getItem(KEYS.MESSAGES)) {
    const messages: ChatMessage[] = [
      { id: 'msg-1', roomId: 'room-1', senderId: 'student-1', senderName: 'Alice Johnson', content: 'Hi team! Ready to start the project?', type: 'Text', createdAt: new Date(Date.now() - 3600000).toISOString(), isRead: true },
      { id: 'msg-2', roomId: 'room-1', senderId: 'student-2', senderName: 'Bob Williams', content: 'Yes! I\'ve already started on the database design.', type: 'Text', createdAt: new Date(Date.now() - 3000000).toISOString(), isRead: true },
      { id: 'msg-3', roomId: 'room-1', senderId: 'lecturer-1', senderName: 'Prof. Jane Doe', content: 'Great progress team! Let me know if you need any guidance.', type: 'Text', createdAt: new Date(Date.now() - 1800000).toISOString(), isRead: false },
    ];
    setStorage(KEYS.MESSAGES, messages);
  }

  // Initialize Notifications
  if (!localStorage.getItem(KEYS.NOTIFICATIONS)) {
    const notifications: Notification[] = [
      { id: 'notif-1', userId: 'student-1', title: 'Checkpoint Due Soon', message: 'Checkpoint 2 is due in 3 days', type: 'Warning', category: 'Checkpoint', isRead: false, link: '/teams/team-1/checkpoints', createdAt: new Date().toISOString() },
      { id: 'notif-2', userId: 'student-1', title: 'New Team Message', message: 'Prof. Jane Doe sent a message', type: 'Info', category: 'Team', isRead: false, link: '/chat/room-1', createdAt: new Date().toISOString() },
      { id: 'notif-3', userId: 'lecturer-1', title: 'Project Submitted', message: 'Team Alpha submitted Checkpoint 1', type: 'Success', category: 'Checkpoint', isRead: true, createdAt: new Date().toISOString() },
    ];
    setStorage(KEYS.NOTIFICATIONS, notifications);
  }

  // Initialize Resources
  if (!localStorage.getItem(KEYS.RESOURCES)) {
    const resources: Resource[] = [
      { id: 'res-1', name: 'Project Guidelines.pdf', description: 'Official project guidelines', type: 'Document', url: '/files/guidelines.pdf', size: 1024000, mimeType: 'application/pdf', uploadedBy: 'lecturer-1', uploadedByName: 'Prof. Jane Doe', classId: 'class-2', createdAt: new Date().toISOString() },
      { id: 'res-2', name: 'Architecture Template.pptx', description: 'System architecture presentation template', type: 'Slide', url: '/files/template.pptx', size: 2048000, mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', uploadedBy: 'lecturer-1', uploadedByName: 'Prof. Jane Doe', classId: 'class-2', createdAt: new Date().toISOString() },
      { id: 'res-3', name: 'Team Alpha - Requirements.docx', type: 'Document', url: '/files/req.docx', uploadedBy: 'student-1', uploadedByName: 'Alice Johnson', teamId: 'team-1', createdAt: new Date().toISOString() },
    ];
    setStorage(KEYS.RESOURCES, resources);
  }

  // Initialize Meetings
  if (!localStorage.getItem(KEYS.MEETINGS)) {
    const meetings: Meeting[] = [
      { id: 'meet-1', title: 'Team Alpha Weekly Standup', description: 'Weekly progress meeting', teamId: 'team-1', teamName: 'Team Alpha', hostId: 'lecturer-1', hostName: 'Prof. Jane Doe', startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), duration: 60, status: 'Scheduled', participants: [{ userId: 'lecturer-1', fullName: 'Prof. Jane Doe', role: 'Host', isOnline: false }], createdAt: new Date().toISOString() },
      { id: 'meet-2', title: 'CS301 Class Review', description: 'Mid-semester review session', classId: 'class-2', className: 'Software Engineering - Section 1', hostId: 'lecturer-1', hostName: 'Prof. Jane Doe', startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), duration: 90, status: 'Scheduled', participants: [], createdAt: new Date().toISOString() },
    ];
    setStorage(KEYS.MEETINGS, meetings);
  }
};

// Initialize on load
initializeMockData();

// ==================== MOCK APIs ====================

// Projects API
const mockProjectsAPI = {
  getAll: () => {
    const projects = getStorage<Project>(KEYS.PROJECTS);
    return mockResponse({ items: projects, pageNumber: 1, pageSize: 10, totalCount: projects.length, totalPages: 1 });
  },
  getById: (id: string) => {
    const project = getStorage<Project>(KEYS.PROJECTS).find(p => p.id === id);
    return mockResponse(project);
  },
  create: (data: CreateProjectRequest) => {
    const projects = getStorage<Project>(KEYS.PROJECTS);
    const newProject: Project = {
      id: 'proj-' + Date.now(),
      ...data,
      status: 'Pending',
      lecturerId: 'lecturer-1',
      lecturerName: 'Prof. Jane Doe',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    projects.push(newProject);
    setStorage(KEYS.PROJECTS, projects);
    return mockResponse(newProject);
  },
  update: (id: string, data: Partial<CreateProjectRequest>) => {
    const projects = getStorage<Project>(KEYS.PROJECTS);
    const index = projects.findIndex(p => p.id === id);
    if (index !== -1) {
      projects[index] = { ...projects[index], ...data, updatedAt: new Date().toISOString() };
      setStorage(KEYS.PROJECTS, projects);
      return mockResponse(projects[index]);
    }
    return mockError('Project not found');
  },
  delete: (id: string) => {
    let projects = getStorage<Project>(KEYS.PROJECTS);
    projects = projects.filter(p => p.id !== id);
    setStorage(KEYS.PROJECTS, projects);
    let milestones = getStorage<Milestone>(KEYS.MILESTONES);
    milestones = milestones.filter(m => m.projectId !== id);
    setStorage(KEYS.MILESTONES, milestones);
    return mockResponse(undefined);
  },
  submit: (id: string) => {
    const projects = getStorage<Project>(KEYS.PROJECTS);
    const index = projects.findIndex(p => p.id === id);
    if (index !== -1) {
      projects[index].submittedAt = new Date().toISOString();
      projects[index].updatedAt = new Date().toISOString();
      setStorage(KEYS.PROJECTS, projects);
      return mockResponse(projects[index]);
    }
    return mockError('Project not found');
  },
  approve: (id: string, _comments?: string) => {
    const projects = getStorage<Project>(KEYS.PROJECTS);
    const index = projects.findIndex(p => p.id === id);
    if (index !== -1) {
      projects[index].status = 'Approved';
      projects[index].approvedAt = new Date().toISOString();
      projects[index].approvedBy = 'head-1';
      projects[index].updatedAt = new Date().toISOString();
      setStorage(KEYS.PROJECTS, projects);
      return mockResponse(projects[index]);
    }
    return mockError('Project not found');
  },
  reject: (id: string, reason: string) => {
    const projects = getStorage<Project>(KEYS.PROJECTS);
    const index = projects.findIndex(p => p.id === id);
    if (index !== -1) {
      projects[index].status = 'Denied';
      projects[index].rejectionReason = reason;
      projects[index].updatedAt = new Date().toISOString();
      setStorage(KEYS.PROJECTS, projects);
      return mockResponse(projects[index]);
    }
    return mockError('Project not found');
  },
  generateMilestones: (id: string) => {
    const project = getStorage<Project>(KEYS.PROJECTS).find(p => p.id === id);
    if (!project) return mockError('Project not found');

    const milestones = getStorage<Milestone>(KEYS.MILESTONES);
    const newMilestones: Milestone[] = [
      { id: 'ms-' + Date.now() + '-1', projectId: id, name: 'Project Planning & Requirements', description: `Define requirements for ${project.name}`, dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), order: 1, isCompleted: false, createdAt: new Date().toISOString() },
      { id: 'ms-' + Date.now() + '-2', projectId: id, name: 'Design & Architecture', description: 'Create system design documentation', dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), order: 2, isCompleted: false, createdAt: new Date().toISOString() },
      { id: 'ms-' + Date.now() + '-3', projectId: id, name: 'Implementation Phase 1', description: 'Develop core features', dueDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(), order: 3, isCompleted: false, createdAt: new Date().toISOString() },
      { id: 'ms-' + Date.now() + '-4', projectId: id, name: 'Testing & QA', description: 'Comprehensive testing', dueDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(), order: 4, isCompleted: false, createdAt: new Date().toISOString() },
      { id: 'ms-' + Date.now() + '-5', projectId: id, name: 'Final Delivery', description: 'Project completion and presentation', dueDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000).toISOString(), order: 5, isCompleted: false, createdAt: new Date().toISOString() },
    ];
    milestones.push(...newMilestones);
    setStorage(KEYS.MILESTONES, milestones);
    return mockResponse(newMilestones);
  },
  getMilestones: (projectId: string) => {
    const milestones = getStorage<Milestone>(KEYS.MILESTONES).filter(m => m.projectId === projectId);
    return mockResponse(milestones);
  },
  addMilestone: (projectId: string, data: Omit<CreateMilestoneRequest, 'projectId'>) => {
    const milestones = getStorage<Milestone>(KEYS.MILESTONES);
    const newMilestone: Milestone = {
      id: 'ms-' + Date.now(),
      projectId,
      ...data,
      order: milestones.filter(m => m.projectId === projectId).length + 1,
      isCompleted: false,
      createdAt: new Date().toISOString()
    };
    milestones.push(newMilestone);
    setStorage(KEYS.MILESTONES, milestones);
    return mockResponse(newMilestone);
  },
  deleteMilestone: (_projectId: string, milestoneId: string) => {
    let milestones = getStorage<Milestone>(KEYS.MILESTONES);
    milestones = milestones.filter(m => m.id !== milestoneId);
    setStorage(KEYS.MILESTONES, milestones);
    return mockResponse(undefined);
  }
};

// Milestones API
const mockMilestonesAPI = {
  getByProjectId: (projectId: string) => mockResponse(getStorage<Milestone>(KEYS.MILESTONES).filter(m => m.projectId === projectId)),
  getById: (id: string) => mockResponse(getStorage<Milestone>(KEYS.MILESTONES).find(m => m.id === id)),
  create: (data: CreateMilestoneRequest) => {
    const milestones = getStorage<Milestone>(KEYS.MILESTONES);
    const newMilestone: Milestone = { id: 'ms-' + Date.now(), ...data, order: milestones.length + 1, isCompleted: false, createdAt: new Date().toISOString() };
    milestones.push(newMilestone);
    setStorage(KEYS.MILESTONES, milestones);
    return mockResponse(newMilestone);
  },
  update: (id: string, data: Partial<CreateMilestoneRequest>) => {
    const milestones = getStorage<Milestone>(KEYS.MILESTONES);
    const index = milestones.findIndex(m => m.id === id);
    if (index !== -1) {
      milestones[index] = { ...milestones[index], ...data };
      setStorage(KEYS.MILESTONES, milestones);
      return mockResponse(milestones[index]);
    }
    return mockError('Milestone not found');
  },
  delete: (id: string) => {
    setStorage(KEYS.MILESTONES, getStorage<Milestone>(KEYS.MILESTONES).filter(m => m.id !== id));
    return mockResponse(undefined);
  },
  complete: (id: string) => {
    const milestones = getStorage<Milestone>(KEYS.MILESTONES);
    const index = milestones.findIndex(m => m.id === id);
    if (index !== -1) {
      milestones[index].isCompleted = true;
      milestones[index].completedAt = new Date().toISOString();
      setStorage(KEYS.MILESTONES, milestones);
      return mockResponse(milestones[index]);
    }
    return mockError('Milestone not found');
  }
};

// Users API
const mockUsersAPI = {
  getAll: (role?: string) => {
    let users = getStorage<User>(KEYS.USERS);
    if (role) users = users.filter(u => u.role === role);
    return mockResponse({ items: users, totalCount: users.length });
  },
  getById: (id: string) => mockResponse(getStorage<User>(KEYS.USERS).find(u => u.id === id)),
  create: (data: Partial<User>) => {
    const users = getStorage<User>(KEYS.USERS);
    const newUser: User = {
      id: 'user-' + Date.now(),
      email: data.email || '',
      fullName: data.fullName || '',
      role: data.role || 'Student',
      department: data.department,
      createdAt: new Date().toISOString(),
      isActive: true
    };
    users.push(newUser);
    setStorage(KEYS.USERS, users);
    return mockResponse(newUser);
  },
  update: (id: string, data: Partial<User>) => {
    const users = getStorage<User>(KEYS.USERS);
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
      users[index] = { ...users[index], ...data };
      setStorage(KEYS.USERS, users);
      return mockResponse(users[index]);
    }
    return mockError('User not found');
  },
  deactivate: (id: string) => {
    const users = getStorage<User>(KEYS.USERS);
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
      users[index].isActive = false;
      setStorage(KEYS.USERS, users);
      return mockResponse(users[index]);
    }
    return mockError('User not found');
  },
  activate: (id: string) => {
    const users = getStorage<User>(KEYS.USERS);
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
      users[index].isActive = true;
      setStorage(KEYS.USERS, users);
      return mockResponse(users[index]);
    }
    return mockError('User not found');
  }
};

// Subjects API
const mockSubjectsAPI = {
  getAll: () => mockResponse({ items: getStorage<Subject>(KEYS.SUBJECTS) }),
  getById: (id: string) => mockResponse(getStorage<Subject>(KEYS.SUBJECTS).find(s => s.id === id)),
  create: (data: Partial<Subject>) => {
    const subjects = getStorage<Subject>(KEYS.SUBJECTS);
    const newSubject: Subject = {
      id: 'subj-' + Date.now(),
      code: data.code || '',
      name: data.name || '',
      credits: data.credits || 3,
      description: data.description || '',
      department: data.department || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    subjects.push(newSubject);
    setStorage(KEYS.SUBJECTS, subjects);
    return mockResponse(newSubject);
  },
  update: (id: string, data: Partial<Subject>) => {
    const subjects = getStorage<Subject>(KEYS.SUBJECTS);
    const index = subjects.findIndex(s => s.id === id);
    if (index !== -1) {
      subjects[index] = { ...subjects[index], ...data, updatedAt: new Date().toISOString() };
      setStorage(KEYS.SUBJECTS, subjects);
      return mockResponse(subjects[index]);
    }
    return mockError('Subject not found');
  },
  delete: (id: string) => {
    setStorage(KEYS.SUBJECTS, getStorage<Subject>(KEYS.SUBJECTS).filter(s => s.id !== id));
    return mockResponse(undefined);
  },
  import: (_file: File) => {
    // Simulate Excel import
    const subjects = getStorage<Subject>(KEYS.SUBJECTS);
    const imported: Subject[] = [
      { id: 'subj-imp-' + Date.now(), code: 'CS501', name: 'Machine Learning', credits: 4, description: 'Introduction to ML', department: 'Computer Science', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'subj-imp-' + (Date.now() + 1), code: 'CS502', name: 'Deep Learning', credits: 4, description: 'Neural Networks', department: 'Computer Science', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ];
    subjects.push(...imported);
    setStorage(KEYS.SUBJECTS, subjects);
    return mockResponse({ success: true, totalRows: 2, successCount: 2, errorCount: 0, errors: [] }, MOCK_DELAYS.IMPORT);
  }
};

// Syllabus API
const mockSyllabusAPI = {
  getAll: () => mockResponse({ items: getStorage<Syllabus>(KEYS.SYLLABUS) }),
  getById: (id: string) => mockResponse(getStorage<Syllabus>(KEYS.SYLLABUS).find(s => s.id === id)),
  getBySubjectId: (subjectId: string) => mockResponse(getStorage<Syllabus>(KEYS.SYLLABUS).filter(s => s.subjectId === subjectId)),
  create: (data: Partial<Syllabus>) => {
    const syllabus = getStorage<Syllabus>(KEYS.SYLLABUS);
    const newSyllabus: Syllabus = {
      id: 'syl-' + Date.now(),
      subjectId: data.subjectId || '',
      title: data.title || '',
      description: data.description || '',
      objectives: data.objectives || [],
      weeks: data.weeks || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    syllabus.push(newSyllabus);
    setStorage(KEYS.SYLLABUS, syllabus);
    return mockResponse(newSyllabus);
  },
  import: (_file: File) => {
    return mockResponse({ success: true, totalRows: 1, successCount: 1, errorCount: 0, errors: [] }, MOCK_DELAYS.IMPORT);
  }
};

// Classes API
const mockClassesAPI = {
  getAll: () => mockResponse({ items: getStorage<Class>(KEYS.CLASSES) }),
  getById: (id: string) => mockResponse(getStorage<Class>(KEYS.CLASSES).find(c => c.id === id)),
  getByLecturer: (lecturerId: string) => mockResponse({ items: getStorage<Class>(KEYS.CLASSES).filter(c => c.lecturerId === lecturerId) }),
  create: (data: Partial<Class>) => {
    const classes = getStorage<Class>(KEYS.CLASSES);
    const newClass: Class = {
      id: 'class-' + Date.now(),
      code: data.code || '',
      name: data.name || '',
      subjectId: data.subjectId || '',
      lecturerId: data.lecturerId,
      semester: data.semester || 'Fall',
      academicYear: data.academicYear || '2024-2025',
      studentCount: 0,
      maxStudents: data.maxStudents || 30,
      schedule: data.schedule || '',
      room: data.room || '',
      status: 'Active',
      createdAt: new Date().toISOString()
    };
    classes.push(newClass);
    setStorage(KEYS.CLASSES, classes);
    return mockResponse(newClass);
  },
  update: (id: string, data: Partial<Class>) => {
    const classes = getStorage<Class>(KEYS.CLASSES);
    const index = classes.findIndex(c => c.id === id);
    if (index !== -1) {
      classes[index] = { ...classes[index], ...data };
      setStorage(KEYS.CLASSES, classes);
      return mockResponse(classes[index]);
    }
    return mockError('Class not found');
  },
  assignLecturer: (classId: string, lecturerId: string) => {
    const classes = getStorage<Class>(KEYS.CLASSES);
    const users = getStorage<User>(KEYS.USERS);
    const lecturer = users.find(u => u.id === lecturerId);
    const index = classes.findIndex(c => c.id === classId);
    if (index !== -1) {
      classes[index].lecturerId = lecturerId;
      classes[index].lecturerName = lecturer?.fullName;
      setStorage(KEYS.CLASSES, classes);
      return mockResponse(classes[index]);
    }
    return mockError('Class not found');
  },
  getMembers: (classId: string) => mockResponse({ items: getStorage<ClassMember>(KEYS.CLASS_MEMBERS).filter(m => m.classId === classId) }),
  addMember: (classId: string, userId: string, role: 'Lecturer' | 'Student') => {
    const members = getStorage<ClassMember>(KEYS.CLASS_MEMBERS);
    const users = getStorage<User>(KEYS.USERS);
    const user = users.find(u => u.id === userId);
    const newMember: ClassMember = {
      id: 'cm-' + Date.now(),
      classId,
      userId,
      userFullName: user?.fullName || '',
      userEmail: user?.email || '',
      role,
      joinedAt: new Date().toISOString()
    };
    members.push(newMember);
    setStorage(KEYS.CLASS_MEMBERS, members);
    return mockResponse(newMember);
  },
  import: (_file: File) => {
    return mockResponse({ success: true, totalRows: 3, successCount: 3, errorCount: 0, errors: [] }, MOCK_DELAYS.IMPORT);
  }
};

// Teams API
const mockTeamsAPI = {
  getAll: () => mockResponse({ items: getStorage<Team>(KEYS.TEAMS) }),
  getById: (id: string) => mockResponse(getStorage<Team>(KEYS.TEAMS).find(t => t.id === id)),
  getByClass: (classId: string) => mockResponse({ items: getStorage<Team>(KEYS.TEAMS).filter(t => t.classId === classId) }),
  getByStudent: (studentId: string) => {
    const members = getStorage<TeamMember>(KEYS.TEAM_MEMBERS).filter(m => m.userId === studentId);
    const teamIds = members.map(m => m.teamId);
    const teams = getStorage<Team>(KEYS.TEAMS).filter(t => teamIds.includes(t.id));
    return mockResponse({ items: teams });
  },
  create: (data: Partial<Team>) => {
    const teams = getStorage<Team>(KEYS.TEAMS);
    const classes = getStorage<Class>(KEYS.CLASSES);
    const cls = classes.find(c => c.id === data.classId);
    const newTeam: Team = {
      id: 'team-' + Date.now(),
      name: data.name || '',
      classId: data.classId || '',
      className: cls?.name,
      projectId: data.projectId,
      maxMembers: data.maxMembers || 5,
      memberCount: 0,
      progress: 0,
      status: 'Active',
      createdAt: new Date().toISOString()
    };
    teams.push(newTeam);
    setStorage(KEYS.TEAMS, teams);
    return mockResponse(newTeam);
  },
  update: (id: string, data: Partial<Team>) => {
    const teams = getStorage<Team>(KEYS.TEAMS);
    const index = teams.findIndex(t => t.id === id);
    if (index !== -1) {
      teams[index] = { ...teams[index], ...data };
      setStorage(KEYS.TEAMS, teams);
      return mockResponse(teams[index]);
    }
    return mockError('Team not found');
  },
  delete: (id: string) => {
    setStorage(KEYS.TEAMS, getStorage<Team>(KEYS.TEAMS).filter(t => t.id !== id));
    setStorage(KEYS.TEAM_MEMBERS, getStorage<TeamMember>(KEYS.TEAM_MEMBERS).filter(m => m.teamId !== id));
    return mockResponse(undefined);
  },
  getMembers: (teamId: string) => mockResponse({ items: getStorage<TeamMember>(KEYS.TEAM_MEMBERS).filter(m => m.teamId === teamId) }),
  addMember: (teamId: string, userId: string, role: 'Leader' | 'Member' = 'Member') => {
    const members = getStorage<TeamMember>(KEYS.TEAM_MEMBERS);
    const users = getStorage<User>(KEYS.USERS);
    const teams = getStorage<Team>(KEYS.TEAMS);
    const user = users.find(u => u.id === userId);
    const newMember: TeamMember = {
      id: 'tm-' + Date.now(),
      teamId,
      userId,
      fullName: user?.fullName || '',
      email: user?.email || '',
      role,
      contribution: 0,
      joinedAt: new Date().toISOString()
    };
    members.push(newMember);
    setStorage(KEYS.TEAM_MEMBERS, members);
    // Update team member count
    const teamIndex = teams.findIndex(t => t.id === teamId);
    if (teamIndex !== -1) {
      teams[teamIndex].memberCount++;
      if (role === 'Leader') {
        teams[teamIndex].leaderId = userId;
        teams[teamIndex].leaderName = user?.fullName;
      }
      setStorage(KEYS.TEAMS, teams);
    }
    return mockResponse(newMember);
  },
  removeMember: (teamId: string, memberId: string) => {
    setStorage(KEYS.TEAM_MEMBERS, getStorage<TeamMember>(KEYS.TEAM_MEMBERS).filter(m => m.id !== memberId));
    const teams = getStorage<Team>(KEYS.TEAMS);
    const teamIndex = teams.findIndex(t => t.id === teamId);
    if (teamIndex !== -1) {
      teams[teamIndex].memberCount--;
      setStorage(KEYS.TEAMS, teams);
    }
    return mockResponse(undefined);
  },
  assignProject: (teamId: string, projectId: string) => {
    const teams = getStorage<Team>(KEYS.TEAMS);
    const projects = getStorage<Project>(KEYS.PROJECTS);
    const project = projects.find(p => p.id === projectId);
    const index = teams.findIndex(t => t.id === teamId);
    if (index !== -1) {
      teams[index].projectId = projectId;
      teams[index].projectName = project?.name;
      setStorage(KEYS.TEAMS, teams);
      return mockResponse(teams[index]);
    }
    return mockError('Team not found');
  }
};

// Checkpoints API
const mockCheckpointsAPI = {
  getByTeam: (teamId: string) => mockResponse({ items: getStorage<Checkpoint>(KEYS.CHECKPOINTS).filter(c => c.teamId === teamId) }),
  getById: (id: string) => mockResponse(getStorage<Checkpoint>(KEYS.CHECKPOINTS).find(c => c.id === id)),
  create: (data: Partial<Checkpoint>) => {
    const checkpoints = getStorage<Checkpoint>(KEYS.CHECKPOINTS);
    const newCheckpoint: Checkpoint = {
      id: 'cp-' + Date.now(),
      teamId: data.teamId || '',
      name: data.name || '',
      description: data.description || '',
      dueDate: data.dueDate || new Date().toISOString(),
      status: 'Pending',
      assignedMembers: data.assignedMembers || [],
      createdAt: new Date().toISOString()
    };
    checkpoints.push(newCheckpoint);
    setStorage(KEYS.CHECKPOINTS, checkpoints);
    return mockResponse(newCheckpoint);
  },
  update: (id: string, data: Partial<Checkpoint>) => {
    const checkpoints = getStorage<Checkpoint>(KEYS.CHECKPOINTS);
    const index = checkpoints.findIndex(c => c.id === id);
    if (index !== -1) {
      checkpoints[index] = { ...checkpoints[index], ...data };
      setStorage(KEYS.CHECKPOINTS, checkpoints);
      return mockResponse(checkpoints[index]);
    }
    return mockError('Checkpoint not found');
  },
  submit: (id: string, _content: string) => {
    const checkpoints = getStorage<Checkpoint>(KEYS.CHECKPOINTS);
    const index = checkpoints.findIndex(c => c.id === id);
    if (index !== -1) {
      checkpoints[index].status = 'Submitted';
      checkpoints[index].submittedAt = new Date().toISOString();
      setStorage(KEYS.CHECKPOINTS, checkpoints);
      return mockResponse(checkpoints[index]);
    }
    return mockError('Checkpoint not found');
  },
  approve: (id: string, feedback: string, grade: number) => {
    const checkpoints = getStorage<Checkpoint>(KEYS.CHECKPOINTS);
    const index = checkpoints.findIndex(c => c.id === id);
    if (index !== -1) {
      checkpoints[index].status = 'Approved';
      checkpoints[index].feedback = feedback;
      checkpoints[index].grade = grade;
      setStorage(KEYS.CHECKPOINTS, checkpoints);
      return mockResponse(checkpoints[index]);
    }
    return mockError('Checkpoint not found');
  },
  reject: (id: string, feedback: string) => {
    const checkpoints = getStorage<Checkpoint>(KEYS.CHECKPOINTS);
    const index = checkpoints.findIndex(c => c.id === id);
    if (index !== -1) {
      checkpoints[index].status = 'Rejected';
      checkpoints[index].feedback = feedback;
      setStorage(KEYS.CHECKPOINTS, checkpoints);
      return mockResponse(checkpoints[index]);
    }
    return mockError('Checkpoint not found');
  }
};

// Workspace Cards API
const mockCardsAPI = {
  getByTeam: (teamId: string) => mockResponse({ items: getStorage<WorkspaceCard>(KEYS.CARDS).filter(c => c.teamId === teamId) }),
  create: (data: Partial<WorkspaceCard>) => {
    const cards = getStorage<WorkspaceCard>(KEYS.CARDS);
    const newCard: WorkspaceCard = {
      id: 'card-' + Date.now(),
      teamId: data.teamId || '',
      title: data.title || '',
      description: data.description || '',
      status: data.status || 'Todo',
      priority: data.priority || 'Medium',
      assigneeId: data.assigneeId,
      assigneeName: data.assigneeName,
      dueDate: data.dueDate,
      order: cards.filter(c => c.teamId === data.teamId).length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    cards.push(newCard);
    setStorage(KEYS.CARDS, cards);
    return mockResponse(newCard);
  },
  update: (id: string, data: Partial<WorkspaceCard>) => {
    const cards = getStorage<WorkspaceCard>(KEYS.CARDS);
    const index = cards.findIndex(c => c.id === id);
    if (index !== -1) {
      cards[index] = { ...cards[index], ...data, updatedAt: new Date().toISOString() };
      setStorage(KEYS.CARDS, cards);
      return mockResponse(cards[index]);
    }
    return mockError('Card not found');
  },
  delete: (id: string) => {
    setStorage(KEYS.CARDS, getStorage<WorkspaceCard>(KEYS.CARDS).filter(c => c.id !== id));
    setStorage(KEYS.TASKS, getStorage<Task>(KEYS.TASKS).filter(t => t.cardId !== id));
    return mockResponse(undefined);
  },
  moveCard: (id: string, status: WorkspaceCard['status'], order: number) => {
    const cards = getStorage<WorkspaceCard>(KEYS.CARDS);
    const index = cards.findIndex(c => c.id === id);
    if (index !== -1) {
      cards[index].status = status;
      cards[index].order = order;
      cards[index].updatedAt = new Date().toISOString();
      setStorage(KEYS.CARDS, cards);
      return mockResponse(cards[index]);
    }
    return mockError('Card not found');
  }
};

// Tasks API
const mockTasksAPI = {
  getByCard: (cardId: string) => mockResponse({ items: getStorage<Task>(KEYS.TASKS).filter(t => t.cardId === cardId) }),
  create: (data: Partial<Task>) => {
    const tasks = getStorage<Task>(KEYS.TASKS);
    const newTask: Task = {
      id: 'task-' + Date.now(),
      cardId: data.cardId || '',
      title: data.title || '',
      isCompleted: false,
      assigneeId: data.assigneeId,
      dueDate: data.dueDate,
      createdAt: new Date().toISOString()
    };
    tasks.push(newTask);
    setStorage(KEYS.TASKS, tasks);
    return mockResponse(newTask);
  },
  toggle: (id: string) => {
    const tasks = getStorage<Task>(KEYS.TASKS);
    const index = tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      tasks[index].isCompleted = !tasks[index].isCompleted;
      setStorage(KEYS.TASKS, tasks);
      return mockResponse(tasks[index]);
    }
    return mockError('Task not found');
  },
  delete: (id: string) => {
    setStorage(KEYS.TASKS, getStorage<Task>(KEYS.TASKS).filter(t => t.id !== id));
    return mockResponse(undefined);
  }
};

// Chat API
const mockChatAPI = {
  getRooms: (userId: string) => {
    const rooms = getStorage<ChatRoom>(KEYS.CHAT_ROOMS).filter(r => r.participants.includes(userId));
    return mockResponse({ items: rooms });
  },
  getMessages: (roomId: string, limit = 50) => {
    const messages = getStorage<ChatMessage>(KEYS.MESSAGES).filter(m => m.roomId === roomId).slice(-limit);
    return mockResponse({ items: messages });
  },
  sendMessage: (roomId: string, senderId: string, content: string) => {
    const messages = getStorage<ChatMessage>(KEYS.MESSAGES);
    const users = getStorage<User>(KEYS.USERS);
    const sender = users.find(u => u.id === senderId);
    const newMessage: ChatMessage = {
      id: 'msg-' + Date.now(),
      roomId,
      senderId,
      senderName: sender?.fullName || 'Unknown',
      content,
      type: 'Text',
      createdAt: new Date().toISOString(),
      isRead: false
    };
    messages.push(newMessage);
    setStorage(KEYS.MESSAGES, messages);
    // Update room's last message
    const rooms = getStorage<ChatRoom>(KEYS.CHAT_ROOMS);
    const roomIndex = rooms.findIndex(r => r.id === roomId);
    if (roomIndex !== -1) {
      rooms[roomIndex].lastMessage = newMessage;
      setStorage(KEYS.CHAT_ROOMS, rooms);
    }
    return mockResponse(newMessage);
  },
  markAsRead: (roomId: string) => {
    const rooms = getStorage<ChatRoom>(KEYS.CHAT_ROOMS);
    const index = rooms.findIndex(r => r.id === roomId);
    if (index !== -1) {
      rooms[index].unreadCount = 0;
      setStorage(KEYS.CHAT_ROOMS, rooms);
    }
    return mockResponse(undefined);
  }
};

// Notifications API
const mockNotificationsAPI = {
  getByUser: (userId: string) => mockResponse({ items: getStorage<Notification>(KEYS.NOTIFICATIONS).filter(n => n.userId === userId) }),
  markAsRead: (id: string) => {
    const notifications = getStorage<Notification>(KEYS.NOTIFICATIONS);
    const index = notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      notifications[index].isRead = true;
      setStorage(KEYS.NOTIFICATIONS, notifications);
      return mockResponse(notifications[index]);
    }
    return mockError('Notification not found');
  },
  markAllAsRead: (userId: string) => {
    const notifications = getStorage<Notification>(KEYS.NOTIFICATIONS);
    notifications.forEach(n => { if (n.userId === userId) n.isRead = true; });
    setStorage(KEYS.NOTIFICATIONS, notifications);
    return mockResponse(undefined);
  }
};

// Resources API
const mockResourcesAPI = {
  getByClass: (classId: string) => mockResponse({ items: getStorage<Resource>(KEYS.RESOURCES).filter(r => r.classId === classId) }),
  getByTeam: (teamId: string) => mockResponse({ items: getStorage<Resource>(KEYS.RESOURCES).filter(r => r.teamId === teamId) }),
  upload: (data: Partial<Resource>) => {
    const resources = getStorage<Resource>(KEYS.RESOURCES);
    const newResource: Resource = {
      id: 'res-' + Date.now(),
      name: data.name || 'Untitled',
      description: data.description,
      type: data.type || 'File',
      url: data.url || '/files/' + Date.now(),
      size: data.size,
      mimeType: data.mimeType,
      uploadedBy: data.uploadedBy || '',
      uploadedByName: data.uploadedByName,
      classId: data.classId,
      teamId: data.teamId,
      createdAt: new Date().toISOString()
    };
    resources.push(newResource);
    setStorage(KEYS.RESOURCES, resources);
    return mockResponse(newResource);
  },
  delete: (id: string) => {
    setStorage(KEYS.RESOURCES, getStorage<Resource>(KEYS.RESOURCES).filter(r => r.id !== id));
    return mockResponse(undefined);
  }
};

// Meetings API
const mockMeetingsAPI = {
  getAll: () => mockResponse({ items: getStorage<Meeting>(KEYS.MEETINGS) }),
  getByTeam: (teamId: string) => mockResponse({ items: getStorage<Meeting>(KEYS.MEETINGS).filter(m => m.teamId === teamId) }),
  getByClass: (classId: string) => mockResponse({ items: getStorage<Meeting>(KEYS.MEETINGS).filter(m => m.classId === classId) }),
  getUpcoming: (userId: string) => {
    const meetings = getStorage<Meeting>(KEYS.MEETINGS).filter(m =>
      m.status === 'Scheduled' &&
      (m.hostId === userId || m.participants.some(p => p.userId === userId))
    );
    return mockResponse({ items: meetings });
  },
  create: (data: Partial<Meeting>) => {
    const meetings = getStorage<Meeting>(KEYS.MEETINGS);
    const users = getStorage<User>(KEYS.USERS);
    const host = users.find(u => u.id === data.hostId);
    const newMeeting: Meeting = {
      id: 'meet-' + Date.now(),
      title: data.title || '',
      description: data.description,
      teamId: data.teamId,
      classId: data.classId,
      hostId: data.hostId || '',
      hostName: host?.fullName || '',
      startTime: data.startTime || new Date().toISOString(),
      duration: data.duration || 60,
      status: 'Scheduled',
      meetingUrl: 'https://meet.collabsphere.com/' + Date.now(),
      participants: [{ userId: data.hostId || '', fullName: host?.fullName || '', role: 'Host', isOnline: false }],
      createdAt: new Date().toISOString()
    };
    meetings.push(newMeeting);
    setStorage(KEYS.MEETINGS, meetings);
    return mockResponse(newMeeting);
  },
  start: (id: string) => {
    const meetings = getStorage<Meeting>(KEYS.MEETINGS);
    const index = meetings.findIndex(m => m.id === id);
    if (index !== -1) {
      meetings[index].status = 'InProgress';
      setStorage(KEYS.MEETINGS, meetings);
      return mockResponse(meetings[index]);
    }
    return mockError('Meeting not found');
  },
  end: (id: string) => {
    const meetings = getStorage<Meeting>(KEYS.MEETINGS);
    const index = meetings.findIndex(m => m.id === id);
    if (index !== -1) {
      meetings[index].status = 'Completed';
      meetings[index].endTime = new Date().toISOString();
      setStorage(KEYS.MEETINGS, meetings);
      return mockResponse(meetings[index]);
    }
    return mockError('Meeting not found');
  },
  cancel: (id: string) => {
    const meetings = getStorage<Meeting>(KEYS.MEETINGS);
    const index = meetings.findIndex(m => m.id === id);
    if (index !== -1) {
      meetings[index].status = 'Cancelled';
      setStorage(KEYS.MEETINGS, meetings);
      return mockResponse(meetings[index]);
    }
    return mockError('Meeting not found');
  }
};

// Evaluations API
const mockEvaluationsAPI = {
  getByTeam: (teamId: string) => mockResponse({ items: getStorage<Evaluation>(KEYS.EVALUATIONS).filter(e => e.teamId === teamId) }),
  create: (data: Partial<Evaluation>) => {
    const evaluations = getStorage<Evaluation>(KEYS.EVALUATIONS);
    const users = getStorage<User>(KEYS.USERS);
    const evaluator = users.find(u => u.id === data.evaluatorId);
    const newEvaluation: Evaluation = {
      id: 'eval-' + Date.now(),
      teamId: data.teamId || '',
      evaluatorId: data.evaluatorId || '',
      evaluatorName: evaluator?.fullName || '',
      evaluatorRole: data.evaluatorRole || 'Lecturer',
      targetType: data.targetType || 'Team',
      targetId: data.targetId || '',
      targetName: data.targetName,
      score: data.score || 0,
      maxScore: data.maxScore || 100,
      feedback: data.feedback || '',
      criteria: data.criteria || [],
      createdAt: new Date().toISOString()
    };
    evaluations.push(newEvaluation);
    setStorage(KEYS.EVALUATIONS, evaluations);
    return mockResponse(newEvaluation);
  },
  getPeerReviews: (teamId: string) => mockResponse({ items: getStorage<PeerReview>(KEYS.PEER_REVIEWS).filter(p => p.teamId === teamId) }),
  createPeerReview: (data: Partial<PeerReview>) => {
    const reviews = getStorage<PeerReview>(KEYS.PEER_REVIEWS);
    const users = getStorage<User>(KEYS.USERS);
    const reviewer = users.find(u => u.id === data.reviewerId);
    const target = users.find(u => u.id === data.targetMemberId);
    const newReview: PeerReview = {
      id: 'pr-' + Date.now(),
      teamId: data.teamId || '',
      reviewerId: data.reviewerId || '',
      reviewerName: reviewer?.fullName || '',
      targetMemberId: data.targetMemberId || '',
      targetMemberName: target?.fullName || '',
      contribution: data.contribution || 0,
      teamwork: data.teamwork || 0,
      communication: data.communication || 0,
      quality: data.quality || 0,
      feedback: data.feedback || '',
      createdAt: new Date().toISOString()
    };
    reviews.push(newReview);
    setStorage(KEYS.PEER_REVIEWS, reviews);
    return mockResponse(newReview);
  }
};

// ==================== REAL API (axios) ====================
import axios, { InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH API ====================
interface LoginResponse {
  token: string;
  user: User;
}

export const authAPI = {
  login: (email: string, _password: string): Promise<{ data: LoginResponse }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const users = getStorage<User>(KEYS.USERS);
        let user = users.find(u => u.email === email);
        if (!user) {
          // Create user based on email pattern
          let role: User['role'] = 'Student';
          if (email.includes('admin')) role = 'Admin';
          else if (email.includes('staff')) role = 'Staff';
          else if (email.includes('head')) role = 'HeadDepartment';
          else if (email.includes('lecturer')) role = 'Lecturer';

          user = {
            id: 'user-' + Date.now(),
            email,
            fullName: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            role,
            createdAt: new Date().toISOString(),
            isActive: true
          };
        }
        resolve({
          data: {
            token: 'mock-jwt-' + btoa(email),
            user
          }
        });
      }, MOCK_DELAYS.LOGIN);
    });
  },
  register: (data: { email: string; password: string; fullName: string; role: User['role'] }): Promise<{ data: User }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const users = getStorage<User>(KEYS.USERS);
        const newUser: User = {
          id: 'user-' + Date.now(),
          email: data.email,
          fullName: data.fullName,
          role: data.role,
          createdAt: new Date().toISOString(),
          isActive: true
        };
        users.push(newUser);
        setStorage(KEYS.USERS, users);
        resolve({ data: newUser });
      }, MOCK_DELAYS.LOGIN);
    });
  },
  updateProfile: (userId: string, data: Partial<User>): Promise<{ data: User }> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = getStorage<User>(KEYS.USERS);
        const index = users.findIndex(u => u.id === userId);
        if (index !== -1) {
          users[index] = { ...users[index], ...data };
          setStorage(KEYS.USERS, users);
          resolve({ data: users[index] });
        } else {
          reject({ response: { data: { message: 'User not found' } } });
        }
      }, MOCK_DELAYS.DEFAULT);
    });
  }
};

// ==================== API TYPE DEFINITIONS ====================
type MockApiResponse<T> = Promise<{ data: ApiResponse<T> }>;

interface ProjectsAPI {
  getAll: () => MockApiResponse<PagedResult<Project>>;
  getById: (id: string) => MockApiResponse<Project | undefined>;
  create: (data: CreateProjectRequest) => MockApiResponse<Project>;
  update: (id: string, data: Partial<CreateProjectRequest>) => MockApiResponse<Project> | Promise<never>;
  delete: (id: string) => MockApiResponse<undefined>;
  submit: (id: string) => MockApiResponse<Project> | Promise<never>;
  approve: (id: string, comments?: string) => MockApiResponse<Project> | Promise<never>;
  reject: (id: string, reason: string) => MockApiResponse<Project> | Promise<never>;
  generateMilestones: (id: string) => MockApiResponse<Milestone[]> | Promise<never>;
  getMilestones: (projectId: string) => MockApiResponse<Milestone[]>;
  addMilestone: (projectId: string, data: Omit<CreateMilestoneRequest, 'projectId'>) => MockApiResponse<Milestone>;
  deleteMilestone: (projectId: string, milestoneId: string) => MockApiResponse<undefined>;
}

interface MilestonesAPI {
  getByProjectId: (projectId: string) => MockApiResponse<Milestone[]>;
  getById: (id: string) => MockApiResponse<Milestone | undefined>;
  create: (data: CreateMilestoneRequest) => MockApiResponse<Milestone>;
  update: (id: string, data: Partial<CreateMilestoneRequest>) => MockApiResponse<Milestone> | Promise<never>;
  delete: (id: string) => MockApiResponse<undefined>;
  complete: (id: string) => MockApiResponse<Milestone> | Promise<never>;
}

interface UsersAPI {
  getAll: (role?: string) => MockApiResponse<{ items: User[]; totalCount: number }>;
  getById: (id: string) => MockApiResponse<User | undefined>;
  create: (data: Partial<User>) => MockApiResponse<User>;
  update: (id: string, data: Partial<User>) => MockApiResponse<User> | Promise<never>;
  deactivate: (id: string) => MockApiResponse<User> | Promise<never>;
  activate: (id: string) => MockApiResponse<User> | Promise<never>;
}

interface SubjectsAPI {
  getAll: () => MockApiResponse<{ items: Subject[] }>;
  getById: (id: string) => MockApiResponse<Subject | undefined>;
  create: (data: Partial<Subject>) => MockApiResponse<Subject>;
  update: (id: string, data: Partial<Subject>) => MockApiResponse<Subject> | Promise<never>;
  delete: (id: string) => MockApiResponse<undefined>;
  import: (file: File) => MockApiResponse<ImportResult>;
}

interface SyllabusAPI {
  getAll: () => MockApiResponse<{ items: Syllabus[] }>;
  getById: (id: string) => MockApiResponse<Syllabus | undefined>;
  getBySubjectId: (subjectId: string) => MockApiResponse<Syllabus[]>;
  create: (data: Partial<Syllabus>) => MockApiResponse<Syllabus>;
  import: (file: File) => MockApiResponse<ImportResult>;
}

interface ClassesAPI {
  getAll: () => MockApiResponse<{ items: Class[] }>;
  getById: (id: string) => MockApiResponse<Class | undefined>;
  getByLecturer: (lecturerId: string) => MockApiResponse<{ items: Class[] }>;
  create: (data: Partial<Class>) => MockApiResponse<Class>;
  update: (id: string, data: Partial<Class>) => MockApiResponse<Class> | Promise<never>;
  assignLecturer: (classId: string, lecturerId: string) => MockApiResponse<Class> | Promise<never>;
  getMembers: (classId: string) => MockApiResponse<{ items: ClassMember[] }>;
  addMember: (classId: string, userId: string, role: 'Lecturer' | 'Student') => MockApiResponse<ClassMember>;
  import: (file: File) => MockApiResponse<ImportResult>;
}

interface TeamsAPI {
  getAll: () => MockApiResponse<{ items: Team[] }>;
  getById: (id: string) => MockApiResponse<Team | undefined>;
  getByClass: (classId: string) => MockApiResponse<{ items: Team[] }>;
  getByStudent: (studentId: string) => MockApiResponse<{ items: Team[] }>;
  create: (data: Partial<Team>) => MockApiResponse<Team>;
  update: (id: string, data: Partial<Team>) => MockApiResponse<Team> | Promise<never>;
  delete: (id: string) => MockApiResponse<undefined>;
  getMembers: (teamId: string) => MockApiResponse<{ items: TeamMember[] }>;
  addMember: (teamId: string, userId: string, role?: 'Leader' | 'Member') => MockApiResponse<TeamMember>;
  removeMember: (teamId: string, memberId: string) => MockApiResponse<undefined>;
  assignProject: (teamId: string, projectId: string) => MockApiResponse<Team> | Promise<never>;
}

interface CheckpointsAPI {
  getByTeam: (teamId: string) => MockApiResponse<{ items: Checkpoint[] }>;
  getById: (id: string) => MockApiResponse<Checkpoint | undefined>;
  create: (data: Partial<Checkpoint>) => MockApiResponse<Checkpoint>;
  update: (id: string, data: Partial<Checkpoint>) => MockApiResponse<Checkpoint> | Promise<never>;
  submit: (id: string, content: string) => MockApiResponse<Checkpoint> | Promise<never>;
  approve: (id: string, feedback: string, grade: number) => MockApiResponse<Checkpoint> | Promise<never>;
  reject: (id: string, feedback: string) => MockApiResponse<Checkpoint> | Promise<never>;
}

interface CardsAPI {
  getByTeam: (teamId: string) => MockApiResponse<{ items: WorkspaceCard[] }>;
  create: (data: Partial<WorkspaceCard>) => MockApiResponse<WorkspaceCard>;
  update: (id: string, data: Partial<WorkspaceCard>) => MockApiResponse<WorkspaceCard> | Promise<never>;
  delete: (id: string) => MockApiResponse<undefined>;
  moveCard: (id: string, status: WorkspaceCard['status'], order: number) => MockApiResponse<WorkspaceCard> | Promise<never>;
}

interface TasksAPI {
  getByCard: (cardId: string) => MockApiResponse<{ items: Task[] }>;
  create: (data: Partial<Task>) => MockApiResponse<Task>;
  toggle: (id: string) => MockApiResponse<Task> | Promise<never>;
  delete: (id: string) => MockApiResponse<undefined>;
}

interface ChatAPI {
  getRooms: (userId: string) => MockApiResponse<{ items: ChatRoom[] }>;
  getMessages: (roomId: string, limit?: number) => MockApiResponse<{ items: ChatMessage[] }>;
  sendMessage: (roomId: string, senderId: string, content: string) => MockApiResponse<ChatMessage>;
  markAsRead: (roomId: string) => MockApiResponse<undefined>;
}

interface NotificationsAPI {
  getByUser: (userId: string) => MockApiResponse<{ items: Notification[] }>;
  markAsRead: (id: string) => MockApiResponse<Notification> | Promise<never>;
  markAllAsRead: (userId: string) => MockApiResponse<undefined>;
}

interface ResourcesAPI {
  getByClass: (classId: string) => MockApiResponse<{ items: Resource[] }>;
  getByTeam: (teamId: string) => MockApiResponse<{ items: Resource[] }>;
  upload: (data: Partial<Resource>) => MockApiResponse<Resource>;
  delete: (id: string) => MockApiResponse<undefined>;
}

interface MeetingsAPI {
  getAll: () => MockApiResponse<{ items: Meeting[] }>;
  getByTeam: (teamId: string) => MockApiResponse<{ items: Meeting[] }>;
  getByClass: (classId: string) => MockApiResponse<{ items: Meeting[] }>;
  getUpcoming: (userId: string) => MockApiResponse<{ items: Meeting[] }>;
  create: (data: Partial<Meeting>) => MockApiResponse<Meeting>;
  start: (id: string) => MockApiResponse<Meeting> | Promise<never>;
  end: (id: string) => MockApiResponse<Meeting> | Promise<never>;
  cancel: (id: string) => MockApiResponse<Meeting> | Promise<never>;
}

interface EvaluationsAPI {
  getByTeam: (teamId: string) => MockApiResponse<{ items: Evaluation[] }>;
  create: (data: Partial<Evaluation>) => MockApiResponse<Evaluation>;
  getPeerReviews: (teamId: string) => MockApiResponse<{ items: PeerReview[] }>;
  createPeerReview: (data: Partial<PeerReview>) => MockApiResponse<PeerReview>;
}

// ==================== EXPORTS ====================
export const projectsAPI: ProjectsAPI = USE_MOCK ? mockProjectsAPI : {} as ProjectsAPI;
export const milestonesAPI: MilestonesAPI = USE_MOCK ? mockMilestonesAPI : {} as MilestonesAPI;
export const usersAPI: UsersAPI = USE_MOCK ? mockUsersAPI : {} as UsersAPI;
export const subjectsAPI: SubjectsAPI = USE_MOCK ? mockSubjectsAPI : {} as SubjectsAPI;
export const syllabusAPI: SyllabusAPI = USE_MOCK ? mockSyllabusAPI : {} as SyllabusAPI;
export const classesAPI: ClassesAPI = USE_MOCK ? mockClassesAPI : {} as ClassesAPI;
export const teamsAPI: TeamsAPI = USE_MOCK ? mockTeamsAPI : {} as TeamsAPI;
export const checkpointsAPI: CheckpointsAPI = USE_MOCK ? mockCheckpointsAPI : {} as CheckpointsAPI;
export const cardsAPI: CardsAPI = USE_MOCK ? mockCardsAPI : {} as CardsAPI;
export const tasksAPI: TasksAPI = USE_MOCK ? mockTasksAPI : {} as TasksAPI;
export const chatAPI: ChatAPI = USE_MOCK ? mockChatAPI : {} as ChatAPI;
export const notificationsAPI: NotificationsAPI = USE_MOCK ? mockNotificationsAPI : {} as NotificationsAPI;
export const resourcesAPI: ResourcesAPI = USE_MOCK ? mockResourcesAPI : {} as ResourcesAPI;
export const meetingsAPI: MeetingsAPI = USE_MOCK ? mockMeetingsAPI : {} as MeetingsAPI;
export const evaluationsAPI: EvaluationsAPI = USE_MOCK ? mockEvaluationsAPI : {} as EvaluationsAPI;

export default api;
