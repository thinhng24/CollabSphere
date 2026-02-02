// src/pages/tasks/TaskDetail.jsx
import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import taskService from "../../services/taskService";
import Loading from "../../components/ui/Loading";
import "./TaskDetail.css"; // Tạo file CSS riêng để dễ style

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toggling, setToggling] = useState(null); // id subtask đang toggle

  const fetchTask = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await taskService.getTask(id);
      setTask(data);
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.status === 403
          ? "Bạn không có quyền xem task này"
          : "Không thể tải task";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTask();
  }, [id]);

  const handleToggleSubtask = async (subtaskId) => {
    setToggling(subtaskId);
    try {
      const res = await taskService.toggleSubtask(subtaskId);
      setTask((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          subtasks: prev.subtasks.map((st) =>
            st.id === subtaskId ? { ...st, isDone: res.isDone } : st
          ),
          // Cập nhật progress tự động
          progress:
            prev.subtasks.length > 0
              ? (prev.subtasks.filter((st) => (st.id === subtaskId ? res.isDone : st.isDone)).length /
                  prev.subtasks.length) *
                100
              : 0,
        };
      });
    } catch (err) {
      alert("Cập nhật subtask thất bại");
      fetchTask(); // rollback
    } finally {
      setToggling(null);
    }
  };

  const handleDeleteTask = async () => {
    if (!window.confirm("Xóa task này? Hành động không thể hoàn tác.")) return;
    try {
      await taskService.deleteTask(id);
      navigate(task.teamId ? `/teams/${task.teamId}/workspace` : "/tasks");
    } catch (err) {
      alert("Xóa task thất bại");
    }
  };

  // Kiểm tra quyền: Lecturer hoặc Assignee mới được edit/delete
  const canEdit = user?.role === "Lecturer" || task?.assigneeId === user?.id;

  if (loading) return <Loading />;
  if (error) return <div className="container py-4"><div className="alert alert-danger">{error}</div></div>;
  if (!task) return <div className="container py-4"><p>Task không tồn tại</p></div>;

  const formatDate = (dateStr) => {
    if (!dateStr) return "Không đặt";
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h2 className="fw-bold mb-1">{task.title}</h2>
          <p className="text-muted">
            Nhóm: <Link to={`/teams/${task.teamId}/workspace`} className="text-primary">Team {task.teamId}</Link>
          </p>
        </div>

        <div className="d-flex gap-2">
          {canEdit && (
            <>
              <Link
                to={`/tasks/${task.id}/update`}
                className="btn btn-outline-primary"
              >
                Sửa Task
              </Link>
              <button
                onClick={handleDeleteTask}
                className="btn btn-outline-danger"
              >
                Xóa Task
              </button>
            </>
          )}
          <button
            onClick={() => navigate(-1)}
            className="btn btn-secondary"
          >
            ← Quay lại
          </button>
        </div>
      </div>

      <div className="row g-4">
        {/* Thông tin chính */}
        <div className="col-lg-8">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title text-primary mb-3">Thông tin Task</h5>

              <div className="row mb-3">
                <div className="col-sm-4 fw-medium">Trạng thái</div>
                <div className="col-sm-8">
                  <span className={`badge ${
                    task.status === "Done" ? "bg-success" :
                    task.status === "In Progress" ? "bg-warning" : "bg-secondary"
                  }`}>
                    {task.status === "To Do" ? "📌 To Do" :
                     task.status === "In Progress" ? "🔄 In Progress" : "✅ Done"}
                  </span>
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-sm-4 fw-medium">Người thực hiện</div>
                <div className="col-sm-8">
                  {task.assigneeName ? `👤 ${task.assigneeName}` : "Chưa giao"}
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-sm-4 fw-medium">Hạn hoàn thành</div>
                <div className="col-sm-8">{formatDate(task.deadline)}</div>
              </div>

              <div className="row mb-3">
                <div className="col-sm-4 fw-medium">Giờ ước lượng</div>
                <div className="col-sm-8">
                  {task.estimatedHours ? `${task.estimatedHours} giờ` : "Chưa ước lượng"}
                </div>
              </div>

              <div className="row mb-4">
                <div className="col-sm-4 fw-medium">Tiến độ</div>
                <div className="col-sm-8">
                  <div className="progress" style={{ height: "10px" }}>
                    <div
                      className={`progress-bar ${
                        task.progress === 100 ? "bg-success" : "bg-info"
                      }`}
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                  <small className="text-muted d-block mt-1">
                    {task.progress.toFixed(0)}% hoàn thành
                  </small>
                </div>
              </div>

              {task.description && (
                <div className="mb-3">
                  <h6 className="fw-medium">Mô tả</h6>
                  <p className="preserve-lines">{task.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Subtasks */}
        <div className="col-lg-4">
          <div className="card shadow-sm">
            <div className="card-header bg-light">
              <h5 className="mb-0">Subtasks ({task.subtasks?.length || 0})</h5>
            </div>
            <div className="card-body">
              {task.subtasks?.length > 0 ? (
                <ul className="list-group list-group-flush">
                  {task.subtasks.map((st) => (
                    <li
                      key={st.id}
                      className="list-group-item d-flex align-items-center py-3"
                    >
                      <input
                        type="checkbox"
                        className="form-check-input me-3"
                        checked={st.isDone}
                        onChange={() => handleToggleSubtask(st.id)}
                        disabled={toggling === st.id}
                        style={{ width: "20px", height: "20px" }}
                      />
                      <span
                        className={st.isDone ? "text-decoration-line-through text-muted" : ""}
                      >
                        {st.title}
                      </span>
                      {toggling === st.id && (
                        <span className="spinner-border spinner-border-sm ms-auto" />
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted text-center py-3">Chưa có subtask</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;