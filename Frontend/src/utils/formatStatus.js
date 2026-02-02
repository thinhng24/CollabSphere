// src/utils/formatStatus.js

import { TASK_STATUS } from "./constants";

// ================= TASK STATUS =================
export const formatTaskStatus = (status) => {
  switch (status) {
    case TASK_STATUS.TODO:
      return {
        label: "Chưa làm",
        color: "gray",
      };

    case TASK_STATUS.DOING:
      return {
        label: "Đang làm",
        color: "blue",
      };

    case TASK_STATUS.DONE:
      return {
        label: "Hoàn thành",
        color: "green",
      };

    default:
      return {
        label: status,
        color: "black",
      };
  }
};

// ================= SUBMISSION =================
export const formatSubmissionStatus = (submission) => {
  if (!submission) return null;

  if (submission.score !== null && submission.score !== undefined) {
    return {
      label: "Đã chấm",
      color: "green",
    };
  }

  return {
    label: "Đã nộp",
    color: "orange",
  };
};
