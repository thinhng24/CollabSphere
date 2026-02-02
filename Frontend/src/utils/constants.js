// src/utils/constants.js

// ================= AUTH =================
export const TOKEN_KEY = "access_token";
export const USER_KEY = "user";

// ================= ROLES =================
export const ROLES = {
  LECTURER: "Lecturer",
  STUDENT: "Student",
};

// ================= TASK STATUS =================
export const TASK_STATUS = {
  TODO: "To Do",
  DOING: "Doing",
  DONE: "Done",
};

// ================= API =================
export const API_BASE_URL = "http://localhost:5000/api"; 
// đổi port nếu backend bạn khác

// ================= DATE FORMAT =================
export const DATE_FORMAT = "dd/MM/yyyy";

// ================= SUBMISSION =================
export const SUBMISSION_STATUS = {
  SUBMITTED: "Submitted",
  GRADED: "Graded",
};
