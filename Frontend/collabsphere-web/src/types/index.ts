// User types
export interface User {
  id: string;
  email: string;
  fullName?: string;
  role: 'Lecturer' | 'HeadDepartment' | 'Admin';
}

// Project types
export type ProjectStatus = 'Pending' | 'Approved' | 'Denied' | 'InProgress' | 'Completed';

export interface Project {
  id: string;
  name: string;
  description: string;
  objectives: string;
  status: ProjectStatus;
  syllabusId?: string;
  classId?: string;
  lecturerId: string;
  submittedAt?: string;
  approvedAt?: string;
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

// Milestone types
export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  description: string;
  dueDate: string;
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

// Auth types
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLecturer: () => boolean;
  isHeadDept: () => boolean;
}

// API Response types
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

// Component Props types
export interface StatCardProps {
  title: string;
  value: number | string;
  color?: string;
  icon?: React.ReactNode;
}

export interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export interface SidebarProps {
  // Add any props if needed
}

export interface HeaderProps {
  title: string;
}
