import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import teamService from "../../services/teamService";
import taskService from "../../services/taskService";
import checkpointService from "../../services/checkpointService";
import Loading from "../../components/ui/Loading";

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ teams: 0, tasks: 0, checkpoints: 0 });
  const [teams, setTeams] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [teamsRes, tasksRes, checkpointsRes] = await Promise.all([
          teamService.getMyTeams(),
          taskService.getMyTasks(),
          checkpointService.getAll(),
        ]);

        setTeams(teamsRes || []);
        setStats({
          teams: teamsRes?.length ?? 0,
          tasks: tasksRes?.length ?? 0,
          checkpoints: checkpointsRes?.length ?? 0,
        });
      } catch (err) {
        setError("Không thể tải dữ liệu. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchData();
  }, [user]);

  if (!user || loading) return <Loading />;

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="mb-4">
        <h2 className="fw-bold">📊 Dashboard</h2>
        <p className="text-muted">Tổng quan hoạt động của bạn trong hệ thống</p>
      </div>

      {error && (
        <div className="alert alert-danger">{error}</div>
      )}

      {/* Stats */}
      <div className="row mb-4 g-3">
        <StatCard
          title="Nhóm"
          value={stats.teams}
          icon="👥"
          onClick={() => navigate("/teams")}
          bg="primary"
        />
        <StatCard
          title="Công việc"
          value={stats.tasks}
          icon="📝"
          onClick={() => navigate("/tasks")}
          bg="success"
        />
        <StatCard
          title="Checkpoint"
          value={stats.checkpoints}
          icon="📍"
          onClick={() => navigate("/checkpoints")}
          bg="warning"
        />
      </div>

      {/* Teams */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="card-title mb-0">Nhóm của bạn</h5>
            {user?.role === "Lecturer" && (
              <button
                onClick={() => navigate("/teams/create")}
                className="btn btn-success"
              >
                + Tạo nhóm mới
              </button>
            )}
          </div>

          <div className="row g-3">
            {teams.length ? (
              teams.map((team) => (
                <div key={team.id} className="col-12 col-md-6 col-lg-4">
                  <div className="card h-100 shadow-sm hover-shadow" style={{ transition: "transform 0.2s" }}>
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="card-title text-truncate">{team.name}</h6>
                        <span className="badge bg-primary">{user?.role}</span>
                      </div>
                      <p className="text-muted text-truncate mb-3">Giảng viên: {team.lecturerName || "Chưa có"}</p>

                      <div className="d-flex flex-wrap gap-2">
                        <ActionButton
                          label="Xem"
                          color="primary"
                          onClick={() => navigate(`/teams/${team.id}`)}
                        />
                        {user?.role === "Lecturer" && (
                          <>
                            <ActionButton
                              label="Cập nhật"
                              color="warning"
                              onClick={() => navigate(`/teams/${team.id}/update`)}
                            />
                            <ActionButton
                              label="Thêm TV"
                              color="secondary"
                              onClick={() => navigate(`/teams/${team.id}/add-member`)}
                            />
                            <ActionButton
                              label="Xóa"
                              color="danger"
                              onClick={() => navigate(`/teams/${team.id}/delete`)}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-12 text-center py-5 text-muted">
                <div style={{ fontSize: "2.5rem" }}>📭</div>
                Chưa có nhóm nào
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ===== Components ===== */

const StatCard = ({ title, value, icon, onClick, bg }) => (
  <div className="col">
    <div
      onClick={onClick}
      className={`card text-white bg-${bg} h-100 shadow-sm`}
      style={{ cursor: "pointer", transition: "transform 0.2s" }}
      onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
      onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      <div className="card-body d-flex align-items-center">
        <div className="fs-2 me-3">{icon}</div>
        <div>
          <p className="mb-1">{title}</p>
          <h5 className="card-title mb-0">{value}</h5>
        </div>
      </div>
    </div>
  </div>
);

const ActionButton = ({ label, color, onClick }) => (
  <button
    onClick={onClick}
    className={`btn btn-${color} btn-sm`}
    style={{ transition: "transform 0.2s" }}
    onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
    onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
  >
    {label}
  </button>
);

export default Dashboard;
