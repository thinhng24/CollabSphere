// ==================== USER & AUTH TYPES ====================
export type UserRole = 'Admin' | 'Staff' | 'HeadDepartment' | 'Lecturer' | 'Student';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  department?: string;
  createdAt: string;
  isActive: boolean;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: () => boolean;
  isStaff: () => boolean;
  isHeadDept: () => boolean;
  isLecturer: () => boolean;
  isStudent: () => boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
}

// ==================== SUBJECT & SYLLABUS TYPES ====================
export interface Subject {
  id: string;
  code: string;
  name: string;
  credits: number;
  description: string;
  department: string;
  createdAt: string;
  updatedAt: string;
}

export interface Syllabus {
  id: string;
  subjectId: string;
  subjectName?: string;
  title: string;
  description: string;
  objectives: string[];
  weeks: SyllabusWeek[];
  createdAt: string;
  updatedAt: string;
}

export interface SyllabusWeek {
  week: number;
  topic: string;
  content: string;
  activities: string[];
}

// ==================== CLASS TYPES ====================
export interface Class {
  id: string;
  code: string;
  name: string;
  subjectId: string;
  subjectName?: string;
  lecturerId?: string;
  lecturerName?: string;
  semester: string;
  academicYear: string;
  studentCount: number;
  maxStudents: number;
  schedule: string;
  room: string;
  status: 'Active' | 'Completed' | 'Cancelled';
  createdAt: string;
}

export interface ClassMember {
  id: string;
  classId: string;
  userId: string;
  userFullName: string;
  userEmail: string;
  role: 'Lecturer' | 'Student';
  joinedAt: string;
}

// ==================== PROJECT TYPES ====================
export type ProjectStatus = 'Pending' | 'Approved' | 'Denied' | 'InProgress' | 'Completed';

export interface Project {
  id: string;
  name: string;
  description: string;
  objectives: string;
  status: ProjectStatus;
  syllabusId?: string;
  classId?: string;
  className?: string;
  lecturerId: string;
  lecturerName?: string;
  submittedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  name: string;
  description: string;
  objectives: string;
  syllabusId?: string;
  classId?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  objectives?: string;
}

// ==================== MILESTONE TYPES ====================
export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  description: string;
  dueDate: string;
  order: number;
  isCompleted: boolean;
  completedAt?: string;
  createdAt: string;
}

export interface CreateMilestoneRequest {
  projectId: string;
  name: string;
  description: string;
  dueDate: string;
}

// ==================== TEAM TYPES ====================
export interface Team {
  id: string;
  name: string;
  classId: string;
  className?: string;
  projectId?: string;
  projectName?: string;
  leaderId?: string;
  leaderName?: string;
  memberCount: number;
  maxMembers: number;
  progress: number;
  status: 'Active' | 'Completed' | 'Inactive';
  createdAt: string;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  fullName: string;
  email: string;
  role: 'Leader' | 'Member';
  contribution: number;
  joinedAt: string;
}

export interface CreateTeamRequest {
  name: string;
  classId: string;
  projectId?: string;
  maxMembers: number;
}

// ==================== CHECKPOINT TYPES ====================
export interface Checkpoint {
  id: string;
  teamId: string;
  name: string;
  description: string;
  dueDate: string;
  status: 'Pending' | 'Submitted' | 'Approved' | 'Rejected';
  assignedMembers: string[];
  submittedAt?: string;
  submittedBy?: string;
  feedback?: string;
  grade?: number;
  createdAt: string;
}

export interface CheckpointSubmission {
  id: string;
  checkpointId: string;
  content: string;
  attachments: string[];
  submittedBy: string;
  submittedAt: string;
}

// ==================== WORKSPACE TYPES ====================
export interface WorkspaceCard {
  id: string;
  teamId: string;
  title: string;
  description: string;
  status: 'Todo' | 'InProgress' | 'Review' | 'Done';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  assigneeId?: string;
  assigneeName?: string;
  dueDate?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  cardId: string;
  title: string;
  isCompleted: boolean;
  assigneeId?: string;
  dueDate?: string;
  createdAt: string;
}

export interface Sprint {
  id: string;
  teamId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'Planning' | 'Active' | 'Completed';
  goal: string;
  cards: WorkspaceCard[];
}

// ==================== COMMUNICATION TYPES ====================
export interface ChatRoom {
  id: string;
  name: string;
  type: 'Team' | 'Class' | 'Direct';
  teamId?: string;
  classId?: string;
  participants: string[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  type: 'Text' | 'File' | 'Image' | 'System';
  attachments?: MessageAttachment[];
  createdAt: string;
  isRead: boolean;
}

export interface MessageAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

// ==================== NOTIFICATION TYPES ====================
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'Info' | 'Warning' | 'Success' | 'Error';
  category: 'Project' | 'Team' | 'Meeting' | 'Checkpoint' | 'System';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

// ==================== RESOURCE TYPES ====================
export interface Resource {
  id: string;
  name: string;
  description?: string;
  type: 'File' | 'Document' | 'Link' | 'Slide' | 'Video';
  url: string;
  size?: number;
  mimeType?: string;
  uploadedBy: string;
  uploadedByName?: string;
  classId?: string;
  teamId?: string;
  milestoneId?: string;
  createdAt: string;
}

// ==================== MEETING TYPES ====================
export interface Meeting {
  id: string;
  title: string;
  description?: string;
  teamId?: string;
  teamName?: string;
  classId?: string;
  className?: string;
  hostId: string;
  hostName: string;
  startTime: string;
  endTime?: string;
  duration: number;
  status: 'Scheduled' | 'InProgress' | 'Completed' | 'Cancelled';
  meetingUrl?: string;
  participants: MeetingParticipant[];
  createdAt: string;
}

export interface MeetingParticipant {
  userId: string;
  fullName: string;
  role: 'Host' | 'CoHost' | 'Participant';
  joinedAt?: string;
  leftAt?: string;
  isOnline: boolean;
}

export interface ScheduleMeetingRequest {
  title: string;
  description?: string;
  teamId?: string;
  classId?: string;
  startTime: string;
  duration: number;
  participantIds: string[];
}

// ==================== EVALUATION TYPES ====================
export interface Evaluation {
  id: string;
  teamId: string;
  evaluatorId: string;
  evaluatorName: string;
  evaluatorRole: 'Lecturer' | 'Student';
  targetType: 'Team' | 'Member' | 'Checkpoint' | 'MilestoneAnswer';
  targetId: string;
  targetName?: string;
  score: number;
  maxScore: number;
  feedback: string;
  criteria: EvaluationCriteria[];
  createdAt: string;
}

export interface EvaluationCriteria {
  name: string;
  score: number;
  maxScore: number;
  comment?: string;
}

export interface PeerReview {
  id: string;
  teamId: string;
  reviewerId: string;
  reviewerName: string;
  targetMemberId: string;
  targetMemberName: string;
  contribution: number;
  teamwork: number;
  communication: number;
  quality: number;
  feedback: string;
  createdAt: string;
}

// ==================== WHITEBOARD TYPES ====================
export interface Whiteboard {
  id: string;
  teamId: string;
  name: string;
  data: WhiteboardElement[];
  createdAt: string;
  updatedAt: string;
}

export interface WhiteboardElement {
  id: string;
  type: 'Rectangle' | 'Circle' | 'Line' | 'Text' | 'Image' | 'Freehand' | 'Arrow' | 'StickyNote';
  x: number;
  y: number;
  width?: number;
  height?: number;
  points?: number[];
  text?: string;
  color: string;
  strokeWidth: number;
  fill?: string;
  createdBy: string;
}

// ==================== API RESPONSE TYPES ====================
export interface ApiResponse<T> {
  isSuccess: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface PagedResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

// ==================== COMPONENT PROPS TYPES ====================
export interface StatCardProps {
  title: string;
  value: number | string;
  color?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export interface HeaderProps {
  title: string;
  showNotifications?: boolean;
}

// ==================== IMPORT TYPES ====================
export interface ImportResult {
  success: boolean;
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: ImportError[];
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
}
