import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import teamService from "../../services/teamService";
import Loading from "../../components/ui/Loading";

const TeamDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [team, setTeam] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isLecturer = useMemo(
    () => user?.role === "Lecturer" && team?.lecturerId === user.id,
    [user, team]
  );

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const res = await teamService.getTeamById(id);
      setTeam(res);
      setError("");
    } catch (err) {
      console.error("Load team detail error:", err);
      setError("Không thể tải chi tiết nhóm.");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await teamService.getStudents();
      setStudents(res);
    } catch (err) {
      console.error("Load students error:", err);
    }
  };

  useEffect(() => {
    if (!id) return navigate("/teams");
    fetchTeam();
    if (user?.role === "Lecturer") fetchStudents();
  }, [id, user, navigate]);

  const handleRemoveMember = async (userId) => {
    if (!window.confirm("Bạn có chắc muốn xóa thành viên này khỏi nhóm?")) return;
    try {
      await teamService.removeMember(team.id, userId);
      fetchTeam();
    } catch (err) {
      console.error("Remove member error:", err);
      alert("Không thể xóa thành viên. Vui lòng thử lại.");
    }
  };

  const handleAddMember = async () => {
    if (!selectedStudentId) return alert("Vui lòng chọn sinh viên để thêm!");
    const userId = parseInt(selectedStudentId);
    if (isNaN(userId)) return alert("ID sinh viên không hợp lệ!");
    
    try {
      await teamService.addMember(team.id, userId);
      setSelectedStudentId("");
      fetchTeam();
    } catch (err) {
      console.error("Add member error:", err);
      alert("Không thể thêm thành viên (có thể đã tồn tại).");
    }
  };

  if (loading) return <Loading />;
  if (error) return (
    <div className="container py-4">
      <div className="alert alert-danger">{error}</div>
      <button className="btn btn-secondary" onClick={() => navigate("/teams")}>
        ← Quay lại danh sách nhóm
      </button>
    </div>
  );
  if (!team) return (
    <div className="container py-4">
      <div className="alert alert-warning">Nhóm không tồn tại hoặc bạn không có quyền truy cập.</div>
    </div>
  );

  const studentsNotInTeam = students.filter(
    (s) => !team.members.some((m) => m.userId === s.userId)
  );

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start mb-4 gap-3">
        <div>
          <h2 className="fw-bold mb-1">👥 {team.name}</h2>
          <p className="text-muted mb-1">Giảng viên: <strong>{team.lecturerName}</strong></p>
          <p className="text-muted mb-0">Thành viên: <strong>{team.members.length}</strong></p>
        </div>
        <button 
          className="btn btn-outline-secondary align-self-start"
          onClick={() => navigate("/teams")}
        >
          ← Quay lại
        </button>
      </div>

      {/* Dashboard mini */}
      <div className="row row-cols-1 row-cols-md-4 g-3 mb-4">
        <div className="col">
          <div className="card text-center bg-light h-100">
            <div className="card-body">
              <h5 className="card-title">{team.taskCount}</h5>
              <p className="card-text text-muted">Tổng Task</p>
            </div>
          </div>
        </div>
        <div className="col">
          <div className="card text-center bg-success text-white h-100">
            <div className="card-body">
              <h5 className="card-title">{team.completedTaskCount}</h5>
              <p className="card-text">Task Hoàn thành</p>
              <small>({((team.completedTaskCount / team.taskCount) * 100 || 0).toFixed(1)}%)</small>
            </div>
          </div>
        </div>
        <div className="col">
          <div className="card text-center bg-info text-white h-100">
            <div className="card-body">
              <h5 className="card-title">{team.checkpointCount}</h5>
              <p className="card-text">Checkpoint</p>
            </div>
          </div>
        </div>
        <div className="col">
          <div className="card h-100 text-center d-flex flex-column justify-content-center">
            <button
              className="btn btn-outline-dark mb-2 w-100"
              onClick={() => {
                if (team?.id) navigate(`/teams/${team.id}/contribution`);
              }}
            >
              📊 % Đóng góp
            </button>
            <small className="text-muted">Theo task / subtask</small>
          </div>
        </div>
      </div>

      {/* Thành viên */}
      <div className="mb-4">
        <h4 className="fw-semibold mb-3">👥 Thành viên ({team.members.length})</h4>
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead>
              <tr>
                <th>Tên</th>
                <th>Email</th>
                <th>Tham gia</th>
                {isLecturer && <th style={{ width: "100px" }}>Hành động</th>}
              </tr>
            </thead>
            <tbody>
              {team.members.map((m) => (
                <tr key={m.userId}>
                  <td>
                    <strong>{m.name}</strong>
                    <br /><small className="text-muted">{m.role}</small>
                  </td>
                  <td>{m.email}</td>
                  <td>{new Date(m.joinedAt).toLocaleDateString('vi-VN')}</td>
                  {isLecturer && (
                    <td>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleRemoveMember(m.userId)}
                        title="Xóa khỏi nhóm"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Thêm thành viên */}
      {isLecturer && studentsNotInTeam.length > 0 && (
        <div className="card mb-4">
          <div className="card-header fw-semibold">➕ Thêm thành viên mới</div>
          <div className="card-body">
            <div className="row g-2 align-items-center">
              <div className="col-md-8">
                <select
                  className="form-select"
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                >
                  <option value="">-- Chọn sinh viên --</option>
                  {studentsNotInTeam.slice(0, 20).map((s) => (
                    <option key={s.userId} value={s.userId}>
                      {s.name} - {s.email}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <button
                  className="btn btn-success w-100"
                  onClick={handleAddMember}
                  disabled={!selectedStudentId}
                >
                  Thêm vào nhóm
                </button>
              </div>
            </div>
            {studentsNotInTeam.length > 20 && (
              <small className="text-muted d-block mt-2">
                Hiển thị 20/ {studentsNotInTeam.length} sinh viên còn lại
              </small>
            )}
          </div>
        </div>
      )}

      {/* Student view */}
      {!isLecturer && (
        <div className="alert alert-info">
          <i className="bi bi-info-circle me-1"></i> 
          Bạn là thành viên nhóm. Vào <a href={`/teams/${team.id}/workspace`} className="alert-link">Workspace</a> để làm việc!
        </div>
      )}
    </div>
  );
};

export default TeamDetail;
