// src/pages/teams/TeamList.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import teamService from "../../services/teamService";
import Loading from "../../components/ui/Loading";

const TeamList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        const res = await teamService.getMyTeams();
        setTeams(res || []);
      } catch (err) {
        console.error("Load teams error:", err);
        setError("Không thể tải danh sách nhóm.");
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchTeams();
  }, [user]);

  if (loading) return <Loading />;

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold">👥 Nhóm của bạn</h2>
          <p className="text-muted">Danh sách các nhóm bạn đang tham gia</p>
        </div>

        {user?.role === "Lecturer" && (
          <button
            onClick={() => navigate("/teams/create")}
            className="btn btn-success"
          >
            + Tạo nhóm mới
          </button>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Teams Grid */}
      <div className="row g-4">
        {teams.length ? (
          teams.map((team) => (
            <div key={team.id} className="col-12 col-md-6 col-lg-4">
              <div
                className="card h-100 shadow-sm cursor-pointer"
                onClick={() => navigate(`/teams/${team.id}`)}
              >
                <div className="card-body d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="card-title">{team.name}</h5>
                    <span className="badge bg-primary">{user?.role}</span>
                  </div>

                  <p className="text-muted mb-3">
                    Giảng viên: <span className="fw-medium">{team.lecturerName}</span>
                  </p>

                  <div className="mt-auto d-flex justify-content-between align-items-center">
                    <span className="text-muted">👤 {team.members?.length ?? 0} thành viên</span>
                    <span className="text-primary fw-medium">Xem chi tiết →</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-muted text-center w-100">Chưa có nhóm nào</p>
        )}
      </div>
    </div>
  );
};

export default TeamList;
