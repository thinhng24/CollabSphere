// src/pages/teams/TeamCreate.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import teamService from "../../services/teamService";
import Loading from "../../components/ui/Loading";

const TeamCreate = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [students, setStudents] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await teamService.getStudents();
        setStudents(res);
      } catch (err) {
        console.error("Load students error:", err);
        setError("Không thể tải danh sách sinh viên.");
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return alert("Nhập tên nhóm");
    try {
      await teamService.createTeam({ name, memberIds: selectedIds });
      navigate("/teams");
    } catch (err) {
      console.error("Create team error:", err);
      alert("Không thể tạo nhóm. Thử lại.");
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="container py-4">
      <h2 className="mb-4">Tạo nhóm mới</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        {/* Tên nhóm */}
        <div className="mb-3">
          <label className="form-label">Tên nhóm</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="form-control"
            placeholder="Nhập tên nhóm"
          />
        </div>

        {/* Chọn thành viên */}
        <div className="mb-3">
          <label className="form-label">Chọn thành viên</label>
          <div className="border p-2 rounded" style={{ maxHeight: "300px", overflowY: "auto" }}>
            {students.map((s) => (
              <div key={s.userId} className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  value={s.userId}
                  checked={selectedIds.includes(s.userId)}
                  onChange={() => toggleSelect(s.userId)}
                  id={`student-${s.userId}`}
                />
                <label className="form-check-label" htmlFor={`student-${s.userId}`}>
                  {s.name} ({s.email})
                </label>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" className="btn btn-success">
          Tạo nhóm
        </button>
      </form>
    </div>
  );
};

export default TeamCreate;
