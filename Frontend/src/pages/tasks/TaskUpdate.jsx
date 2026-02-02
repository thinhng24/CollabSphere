import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import taskService from "../../services/taskService";
import teamService from "../../services/teamService";

const TaskUpdate = () => {
  const { taskId, teamId } = useParams();
  const navigate = useNavigate();

  const [teams, setTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [loadingTask, setLoadingTask] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    teamId: teamId || "",
    title: "",
    description: "",
    assigneeId: "",
    deadline: "",
    estimatedHours: "",
  });

  const today = new Date().toISOString().split("T")[0];

  // Fetch teams nếu teamId không được truyền
  const fetchTeams = async () => {
    setLoadingTeams(true);
    try {
      const data = await teamService.getMyTeams();
      setTeams(data);
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Lỗi khi lấy danh sách nhóm";
      setError(message);
    } finally {
      setLoadingTeams(false);
    }
  };

  // Fetch task chi tiết
  const fetchTask = async () => {
    setLoadingTask(true);
    try {
      const task = await taskService.getTask(taskId); // đúng với taskService
      setForm({
        teamId: task.teamId?.toString() || "",
        title: task.title || "",
        description: task.description || "",
        assigneeId: task.assigneeId?.toString() || "",
        deadline: task.deadline ? task.deadline.split("T")[0] : "",
        estimatedHours: task.estimatedHours?.toString() || "",
      });
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Lỗi khi lấy dữ liệu công việc";
      setError(message);
    } finally {
      setLoadingTask(false);
    }
  };

  useEffect(() => {
    if (!teamId) fetchTeams();
    if (taskId) fetchTask();
  }, [taskId, teamId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "estimatedHours" && value < 0) return;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        ...form,
        teamId: parseInt(form.teamId),
        assigneeId: form.assigneeId ? parseInt(form.assigneeId) : null,
        estimatedHours: form.estimatedHours ? parseFloat(form.estimatedHours) : null,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
      };

      await taskService.updateTask(taskId, payload);
      navigate(teamId ? `/teams/${teamId}/tasks` : "/tasks");
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Lỗi khi cập nhật công việc";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingTask || (loadingTeams && !teamId)) {
    return <div className="container py-4">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="container py-4">
      <h2>Cập nhật công việc</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        {!teamId && (
          <div className="mb-3">
            <label>Chọn nhóm</label>
            <select
              name="teamId"
              className="form-select"
              value={form.teamId}
              onChange={handleChange}
              required
              disabled={submitting}
            >
              <option value="">-- Chọn nhóm --</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mb-3">
          <label>Tiêu đề</label>
          <input
            type="text"
            name="title"
            className="form-control"
            value={form.title}
            onChange={handleChange}
            required
            disabled={submitting}
          />
        </div>

        <div className="mb-3">
          <label>Mô tả</label>
          <textarea
            name="description"
            className="form-control"
            value={form.description}
            onChange={handleChange}
            disabled={submitting}
          />
        </div>

        <div className="mb-3">
          <label>Hạn chót</label>
          <input
            type="date"
            name="deadline"
            className="form-control"
            value={form.deadline}
            onChange={handleChange}
            min={today}
            disabled={submitting}
          />
        </div>

        <div className="mb-3">
          <label>Giờ ước lượng</label>
          <input
            type="number"
            name="estimatedHours"
            className="form-control"
            value={form.estimatedHours}
            onChange={handleChange}
            min="0"
            disabled={submitting}
          />
        </div>

        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Đang cập nhật..." : "Cập nhật công việc"}
        </button>
      </form>
    </div>
  );
};

export default TaskUpdate;
