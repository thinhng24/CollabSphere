// src/services/checkpointService.js
import api from "./api";

const checkpointService = {
  // ==================== CHECKPOINT CRUD ====================
  /** Lấy tất cả checkpoint của user hiện tại */
  getAll: async () => {
    const res = await api.get("/checkpoints");
    return res.data;
  },

  /** Lấy checkpoint của một team cụ thể */
  getByTeam: async (teamId) => {
    const res = await api.get(`/checkpoints/team/${teamId}`);
    return res.data;
  },

  /** Lấy chi tiết một checkpoint */
  getById: async (id) => {
    const res = await api.get(`/checkpoints/${id}`);
    return res.data;
  },

  /** Lecturer: Tạo checkpoint mới */
  create: async (data) => {
    const res = await api.post("/checkpoints", data);
    return res.data;
  },

  /** Lecturer: Cập nhật checkpoint */
  update: async (id, data) => {
    await api.put(`/checkpoints/${id}`, data);
  },

  /** Lecturer: Xóa checkpoint */
  delete: async (id) => {
    await api.delete(`/checkpoints/${id}`);
  },

  // ==================== SUBMISSION (NỘP BÀI) ====================
  /** Student: Nộp hoặc cập nhật bài checkpoint */
  submit: async (data) => {
    // data = { checkpointId, content, fileUrl?, fileName? }
    const res = await api.post("/checkpoints/submit", data);
    return res.data;
  },

  /** Lecturer: Lấy danh sách tất cả bài nộp của một checkpoint */
  getSubmissions: async (checkpointId) => {
    const res = await api.get(`/checkpoints/${checkpointId}/submissions`);
    return res.data; // List<SubmissionResponse> hoặc TeamSubmissionsResponse nếu bạn thêm DTO
  },

  /** Lecturer: Chấm điểm + feedback cho một bài nộp */
  gradeSubmission: async (checkpointId, submissionId, data) => {
    // data = { score: number, feedback?: string }
    const res = await api.post(
      `/checkpoints/${checkpointId}/submissions/${submissionId}/grade`,
      data
    );
    return res.data;
  },
};

export default checkpointService;