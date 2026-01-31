import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
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
  getAll: (pageNumber = 1, pageSize = 10) =>
    api.get(`/projects?pageNumber=${pageNumber}&pageSize=${pageSize}`),

  getById: (id) =>
    api.get(`/projects/${id}`),

  create: (data) =>
    api.post('/projects', data),

  update: (id, data) =>
    api.put(`/projects/${id}`, data),

  delete: (id) =>
    api.delete(`/projects/${id}`),

  submit: (id) =>
    api.post(`/projects/${id}/submit`),

  approve: (id, comments) =>
    api.post(`/projects/${id}/approve`, { comments }),

  reject: (id, reason) =>
    api.post(`/projects/${id}/reject`, { reason }),

  generateMilestones: (id, syllabusId, numberOfMilestones = 5) =>
    api.post(`/projects/${id}/generate-milestones`, { syllabusId, numberOfMilestones })
};

// Milestones API
export const milestonesAPI = {
  getByProjectId: (projectId) =>
    api.get(`/milestones/project/${projectId}`),

  getById: (id) =>
    api.get(`/milestones/${id}`),

  create: (data) =>
    api.post('/milestones', data),

  update: (id, data) =>
    api.put(`/milestones/${id}`, data),

  delete: (id) =>
    api.delete(`/milestones/${id}`),

  complete: (id) =>
    api.post(`/milestones/${id}/complete`)
};

// Auth API (mock for demo)
export const authAPI = {
  login: (email, password) => {
    // Mock login - in production, this would call real auth service
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockToken = 'mock-jwt-token-' + btoa(email);
        const role = email.includes('head') ? 'HeadDepartment' : 'Lecturer';
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
