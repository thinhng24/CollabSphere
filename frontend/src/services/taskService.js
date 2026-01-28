// src/services/taskService.js
import api from "./api";

const taskService = {
  // Lấy tất cả task của user hiện tại
  getMyTasks: async () => {
    const res = await api.get("/tasks"); // GET /api/tasks
    return res.data;
  },

  // Lấy tất cả task theo team
  getTeamTasks: async (teamId) => {
    const res = await api.get(`/tasks/team/${teamId}`); // GET /api/tasks/team/{teamId}
    return res.data;
  },

  // Lấy task theo id
  getTask: async (id) => {
    if (!id) throw new Error("Task id is required");
    const res = await api.get(`/tasks/${id}`);
    return res.data;
  },

  // Tạo task mới
  createTask: async (data) => {
    const res = await api.post("/tasks", data);
    return res.data;
  },

  updateTask: async (id, data) => {
    await api.put(`/tasks/${id}`, data);
  },

  updateTaskStatus: async (id, data) => {
    await api.put(`/tasks/${id}/status`, data);
  },

  deleteTask: async (id) => {
    await api.delete(`/tasks/${id}`);
  },

  // Subtask
  createSubtask: async (data) => {
    const res = await api.post("/tasks/subtasks", data);
    return res.data;
  },

  updateSubtask: async (id, data) => {
    await api.put(`/tasks/subtasks/${id}`, data);
  },

  toggleSubtask: async (id) => {
    const res = await api.put(`/tasks/subtasks/${id}/toggle`);
    return res.data;
  },

  deleteSubtask: async (id) => {
    await api.delete(`/tasks/subtasks/${id}`);
  },
};

export default taskService;
