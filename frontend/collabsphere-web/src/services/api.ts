import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import {
  Project,
  Milestone,
  CreateProjectRequest,
  UpdateProjectRequest,
  CreateMilestoneRequest,
  ApiResponse,
  PagedResult,
  User
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Projects API
export const projectsAPI = {
  getAll: (pageNumber = 1, pageSize = 10): Promise<AxiosResponse<ApiResponse<PagedResult<Project>>>> =>
    api.get(`/projects?pageNumber=${pageNumber}&pageSize=${pageSize}`),

  getById: (id: string): Promise<AxiosResponse<ApiResponse<Project>>> =>
    api.get(`/projects/${id}`),

  create: (data: CreateProjectRequest): Promise<AxiosResponse<ApiResponse<Project>>> =>
    api.post('/projects', data),

  update: (id: string, data: UpdateProjectRequest): Promise<AxiosResponse<ApiResponse<Project>>> =>
    api.put(`/projects/${id}`, data),

  delete: (id: string): Promise<AxiosResponse<ApiResponse<void>>> =>
    api.delete(`/projects/${id}`),

  submit: (id: string): Promise<AxiosResponse<ApiResponse<Project>>> =>
    api.post(`/projects/${id}/submit`),

  approve: (id: string, comments?: string): Promise<AxiosResponse<ApiResponse<Project>>> =>
    api.post(`/projects/${id}/approve`, { comments }),

  reject: (id: string, reason: string): Promise<AxiosResponse<ApiResponse<Project>>> =>
    api.post(`/projects/${id}/reject`, { reason }),

  generateMilestones: (id: string, syllabusId?: string, numberOfMilestones = 5): Promise<AxiosResponse<ApiResponse<Milestone[]>>> =>
    api.post(`/projects/${id}/generate-milestones`, { syllabusId, numberOfMilestones }),

  getMilestones: (projectId: string): Promise<AxiosResponse<ApiResponse<Milestone[]>>> =>
    api.get(`/projects/${projectId}/milestones`),

  addMilestone: (projectId: string, data: Omit<CreateMilestoneRequest, 'projectId'>): Promise<AxiosResponse<ApiResponse<Milestone>>> =>
    api.post(`/projects/${projectId}/milestones`, data),

  deleteMilestone: (projectId: string, milestoneId: string): Promise<AxiosResponse<ApiResponse<void>>> =>
    api.delete(`/projects/${projectId}/milestones/${milestoneId}`)
};

// Milestones API
export const milestonesAPI = {
  getByProjectId: (projectId: string): Promise<AxiosResponse<ApiResponse<Milestone[]>>> =>
    api.get(`/milestones/project/${projectId}`),

  getById: (id: string): Promise<AxiosResponse<ApiResponse<Milestone>>> =>
    api.get(`/milestones/${id}`),

  create: (data: CreateMilestoneRequest): Promise<AxiosResponse<ApiResponse<Milestone>>> =>
    api.post('/milestones', data),

  update: (id: string, data: Partial<CreateMilestoneRequest>): Promise<AxiosResponse<ApiResponse<Milestone>>> =>
    api.put(`/milestones/${id}`, data),

  delete: (id: string): Promise<AxiosResponse<ApiResponse<void>>> =>
    api.delete(`/milestones/${id}`),

  complete: (id: string): Promise<AxiosResponse<ApiResponse<Milestone>>> =>
    api.post(`/milestones/${id}/complete`)
};

// Auth API types
interface LoginResponse {
  token: string;
  user: User;
}

// Auth API (mock for demo)
export const authAPI = {
  login: (email: string, password: string): Promise<{ data: LoginResponse }> => {
    // Mock login - in production, this would call real auth service
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockToken = 'mock-jwt-token-' + btoa(email);
        const role: User['role'] = email.includes('head') ? 'HeadDepartment' : 'Lecturer';
        resolve({
          data: {
            token: mockToken,
            user: {
              id: '123',
              email,
              role,
              fullName: email.split('@')[0]
            }
          }
        });
      }, 500);
    });
  }
};

export default api;
