// Nếu vẫn muốn giữ (không khuyến khích) – SỬA LẠI ĐÚNG HƠN
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import teamService from "../../services/teamService";
import Loading from "../../components/ui/Loading";

const AddMember = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [allStudents, setAllStudents] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [studentsRes, teamRes] = await Promise.all([
          teamService.getStudents(),
          teamService.getTeamById(id)
        ]);
        setAllStudents(studentsRes);
        setTeamMembers(teamRes.members.map(m => m.userId));
      } catch (err) {
        setError("Không thể tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Chỉ sinh viên chưa trong team
  const availableStudents = allStudents.filter(s => !teamMembers.includes(s.userId));

  const toggleSelect = (userId) => {
    setSelected(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleAdd = async () => {
    if (selected.length === 0) return;
    
    const results = [];
    for (const userId of selected) {
      try {
        await teamService.addMember(id, userId);
        results.push({ userId, success: true });
      } catch (err) {
        results.push({ userId, success: false });
      }
    }

    const failed = results.filter(r => !r.success);
    if (failed.length === 0) {
      alert(`Đã thêm thành công ${selected.length} thành viên!`);
      navigate(`/teams/${id}`);
    } else {
      alert(`Thêm thành công ${results.length - failed.length}, thất bại ${failed.length}`);
    }
  };

  // Phân quyền
  if (user?.role !== "Lecturer") {
    return <div className="container py-4"><div className="alert alert-warning">Chỉ giảng viên mới được thêm thành viên</div></div>;
  }

  if (loading) return <Loading />;
  if (error) return <div className="container py-4"><div className="alert alert-danger">{error}</div></div>;

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">➕ Thêm thành viên vào nhóm</h2>
        <button className="btn btn-outline-secondary" onClick={() => navigate(`/teams/${id}`)}>
          ← Quay lại
        </button>
      </div>

      {availableStudents.length === 0 ? (
        <div className="alert alert-info">Tất cả sinh viên đã trong nhóm hoặc không có sinh viên nào.</div>
      ) : (
        <>
          <p className="text-muted mb-3">
            Chọn nhiều sinh viên để thêm cùng lúc ({availableStudents.length} sinh viên khả dụng)
          </p>
          <div className="card">
            <div className="card-body" style={{ maxHeight: "400px", overflowY: "auto" }}>
              <div className="row">
                {availableStudents.map((s) => (
                  <div key={s.userId} className="col-12 col-md-6 col-lg-4 mb-2">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`student-${s.userId}`}
                        checked={selected.includes(s.userId)}
                        onChange={() => toggleSelect(s.userId)}
                      />
                      <label className="form-check-label" htmlFor={`student-${s.userId}`}>
                        <strong>{s.name}</strong> <small className="text-muted">({s.email})</small>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <button
              className="btn btn-success btn-lg"
              onClick={handleAdd}
              disabled={selected.length === 0}
            >
              Thêm {selected.length} thành viên được chọn
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AddMember;