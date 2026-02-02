// src/pages/tasks/TaskList.jsx
import { useEffect, useState, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import taskService from "../../services/taskService";

const TaskList = () => {
  const { teamId } = useParams();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("All"); // All, To Do, In Progress, Done

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const data = teamId
          ? await taskService.getTeamTasks(teamId)
          : await taskService.getMyTasks(); // Sửa đúng tên method
        setTasks(data || []);
      } catch (err) {
        console.error("Load tasks error:", err);
        alert("Không thể tải danh sách task");
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [teamId]);

  // Filter tasks theo status
  const filteredTasks = useMemo(() => {
    let filtered = tasks;
    if (filterStatus !== "All") {
      filtered = tasks.filter((t) => t.status === filterStatus);
    }

    // Sort: ưu tiên To Do → In Progress → Done, rồi theo order trong cột
    return filtered.sort((a, b) => {
      const statusOrder = { "To Do": 0, "In Progress": 1, "Done": 2 };
      if (a.status !== b.status) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return a.order - b.order;
    });
  }, [tasks, filterStatus]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "Không hạn";
    const date = new Date(dateStr);
    const today = new Date();
    const diffDays = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return <span className="text-danger">Quá hạn {Math.abs(diffDays)} ngày</span>;
    if (diffDays === 0) return <span className="text-warning">Hôm nay</span>;
    if (diffDays <= 3) return <span className="text-warning">Còn {diffDays} ngày</span>;
    return date.toLocaleDateString("vi-VN");
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "To Do":
        return <span className="badge bg-secondary">To Do</span>;
      case "In Progress":
        return <span className="badge bg-warning text-dark">In Progress</span>;
      case "Done":
        return <span className="badge bg-success">Done</span>;
      default:
        return <span className="badge bg-light text-dark">{status}</span>;
    }
  };

  if (loading) {
    return <div className="text-center py-5">Đang tải task...</div>;
  }

  if (!tasks.length) {
    return (
      <div className="text-center py-5 text-muted">
        <div style={{ fontSize: "4rem", opacity: 0.5 }}>Empty</div>
        <h4>Chưa có task nào</h4>
        <p>Hãy tạo task đầu tiên để bắt đầu làm việc!</p>
        <Link
          to={teamId ? `/teams/${teamId}/tasks/create` : "/tasks/create"}
          className="btn btn-success btn-lg mt-3"
        >
          + Tạo Task Mới
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Danh Sách Task</h2>
          <p className="text-muted mb-0">
            {teamId ? `Nhóm ${teamId}` : "Task của bạn"} • Tổng cộng: {tasks.length} task
          </p>
        </div>

        <div className="d-flex gap-2 align-items-center">
          <select
            className="form-select w-auto"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">Tất cả</option>
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="Done">Done</option>
          </select>

          <Link
            to={teamId ? `/teams/${teamId}/tasks/create` : "/tasks/create"}
            className="btn btn-success"
          >
            + Tạo Task
          </Link>
        </div>
      </div>

      <div className="row g-4">
        {filteredTasks.map((task) => (
          <div key={task.id} className="col-12 col-md-6 col-lg-4">
            <div
              className="card h-100 shadow-sm border-0 hover-lift"
              style={{ transition: "all 0.3s ease" }}
            >
              <div className="card-body d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <h5 className="card-title mb-0 text-truncate flex-grow-1 me-2">
                    <Link
                      to={`/tasks/${task.id}`}
                      className="text-decoration-none text-dark"
                    >
                      {task.title}
                    </Link>
                  </h5>
                  {getStatusBadge(task.status)}
                </div>

                {task.assigneeName && (
                  <p className="text-muted small mb-2">
                    Assigned to: <strong>{task.assigneeName}</strong>
                  </p>
                )}

                <p className="text-muted small mb-3">
                  Deadline: {formatDate(task.deadline)}
                </p>

                {task.estimatedHours && (
                  <p className="text-muted small mb-3">
                    Estimated: <strong>{task.estimatedHours} giờ</strong>
                  </p>
                )}

                <div className="mt-auto">
                  <div className="progress mb-2" style={{ height: "8px" }}>
                    <div
                      className={`progress-bar ${
                        task.progress === 100 ? "bg-success" : "bg-info"
                      }`}
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">
                      {task.progress.toFixed(0)}% hoàn thành
                    </small>
                    <Link
                      to={`/tasks/${task.id}`}
                      className="btn btn-outline-primary btn-sm"
                    >
                      Chi tiết
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTasks.length === 0 && filterStatus !== "All" && (
        <div className="text-center py-5 text-muted">
          <p>Không có task nào ở trạng thái "{filterStatus}"</p>
          <button
            className="btn btn-outline-secondary"
            onClick={() => setFilterStatus("All")}
          >
            Xem tất cả task
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskList;