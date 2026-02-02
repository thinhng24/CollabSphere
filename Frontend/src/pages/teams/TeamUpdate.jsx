// src/pages/teams/TeamEdit.jsx (HOÀN THIỆN – NHẤT QUÁN BOOTSTRAP)
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import teamService from "../../services/teamService";
import Loading from "../../components/ui/Loading";

const TeamEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [team, setTeam] = useState(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        setLoading(true);
        const data = await teamService.getTeamById(id);
        setTeam(data);
        setName(data.name);
        setError("");
      } catch (err) {
        console.error("Load team error:", err);
        setError("Không thể tải thông tin nhóm.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchTeam();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Tên nhóm không được để trống.");
      return;
    }

    try {
      await teamService.updateTeam(id, { name: name.trim() });
      alert("Cập nhật tên nhóm thành công!");
      navigate(`/teams/${id}`);
    } catch (err) {
      console.error("Update team error:", err);
      setError("Không thể cập nhật nhóm. Vui lòng thử lại.");
    }
  };

  // Phân quyền: chỉ Lecturer sở hữu team mới được sửa
  if (!loading && team && (!user || user.role !== "Lecturer" || team.lecturerId !== user.id)) {
    return (
      <div className="container py-4">
        <div className="alert alert-warning">
          Bạn không có quyền chỉnh sửa nhóm này.
        </div>
        <button className="btn btn-secondary" onClick={() => navigate("/teams")}>
          ← Quay lại danh sách nhóm
        </button>
      </div>
    );
  }

  if (loading) return <Loading />;

  if (error && !team) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger">{error}</div>
        <button className="btn btn-secondary" onClick={() => navigate("/teams")}>
          ← Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold">✏️ Chỉnh sửa nhóm</h2>
          <p className="text-muted">Chỉ có thể thay đổi tên nhóm</p>
        </div>
        <button
          className="btn btn-outline-secondary"
          onClick={() => navigate(`/teams/${id}`)}
        >
          ← Quay lại chi tiết
        </button>
      </div>

      {error && <div className="alert alert-danger mb-4">{error}</div>}

      <div className="card shadow-sm">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="form-label fw-medium">Tên nhóm *</label>
              <input
                type="text"
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Nhập tên nhóm mới"
                autoFocus
              />
              <div className="form-text">
                Nhóm hiện tại: <strong>{team?.name}</strong>
              </div>
            </div>

            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-primary">
                💾 Lưu thay đổi
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => navigate(`/teams/${id}`)}
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="mt-4 text-muted small">
        <em>Lưu ý: Để thay đổi thành viên, vui lòng vào trang chi tiết nhóm.</em>
      </div>
    </div>
  );
};

export default TeamEdit;