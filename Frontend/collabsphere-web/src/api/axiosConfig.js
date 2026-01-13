import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: 10000,
});

// Interceptor để thêm token vào header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor để xử lý lỗi
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token hết hạn
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// API functions cho meeting
export const meetingApi = {
  createMeeting: (data) => api.post('/api/meetings', data),
  getMeetings: (teamId) => api.get(`/api/meetings/team/${teamId}`),
  updateMeeting: (id, data) => api.put(`/api/meetings/${id}`, data),
  deleteMeeting: (id) => api.delete(`/api/meetings/${id}`),
  joinMeeting: (meetingId) => api.post(`/api/meetings/${meetingId}/join`),
  leaveMeeting: (meetingId) => api.post(`/api/meetings/${meetingId}/leave`),
};

// API functions cho whiteboard
export const whiteboardApi = {
  createBoard: (data) => api.post('/api/whiteboards', data),
  getBoard: (id) => api.get(`/api/whiteboards/${id}`),
  saveBoard: (id, data) => api.put(`/api/whiteboards/${id}`, data),
};

// API functions cho team
export const teamApi = {
  getTeamMembers: (teamId) => api.get(`/api/teams/${teamId}/members`),
};