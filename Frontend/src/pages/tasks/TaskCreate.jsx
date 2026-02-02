import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import taskService from "../../services/taskService";
import teamService from "../../services/teamService";

const TaskCreate = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();

  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    teamId: teamId || "",
    title: "",
    description: "",
    assigneeId: "",
    deadline: "",
    estimatedHours: "",
  });

  // Fetch teams if teamId not provided
  const fetchTeams = async () => {
    setLoading(true);
    try {
      const data = await teamService.getMyTeams();
      setTeams(data);
    } catch (err) {
      setError(err.message || "Lỗi khi lấy danh sách nhóm");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!teamId) fetchTeams();
  }, [teamId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...form,
        teamId: parseInt(form.teamId),
        assigneeId: form.assigneeId ? parseInt(form.assigneeId) : null,
        estimatedHours: form.estimatedHours ? parseFloat(form.estimatedHours) : null,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
      };

      await taskService.createTask(payload);
      navigate(teamId ? `/teams/${teamId}/tasks` : "/tasks");
    } catch (err) {
      setError(err.message || "Lỗi khi tạo công việc");
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="container py-4">
      <h2>Tạo công việc mới</h2>

      {error && <div className="alert alert-danger">{error}</div>}
      {loading && <div>Đang xử lý...</div>}

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
          />
        </div>

        <div className="mb-3">
          <label>Mô tả</label>
          <textarea
            name="description"
            className="form-control"
            value={form.description}
            onChange={handleChange}
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
          />
        </div>

        <button className="btn btn-success" type="submit" disabled={loading}>
          Tạo công việc
        </button>
      </form>
    </div>
  );
};

export default TaskCreate;
