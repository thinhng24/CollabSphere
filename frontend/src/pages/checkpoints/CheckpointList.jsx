// src/pages/checkpoints/CheckpointList.jsx
import { useEffect, useState } from "react";
import checkpointService from "../../services/checkpointService";
import { Link } from "react-router-dom";

const CheckpointList = () => {
  const [checkpoints, setCheckpoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCheckpoints = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await checkpointService.getAll();
        setCheckpoints(data);
      } catch (err) {
        console.error("Lỗi khi tải checkpoints:", err);
        setError("Không tải được danh sách checkpoint. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };
    fetchCheckpoints();
  }, []);

  if (loading) {
    return (
      <div className="container text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 h5">Đang tải danh sách checkpoint...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container text-center py-5">
        <p className="text-danger h5">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="btn btn-primary mt-3"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h2">Danh sách Checkpoint</h1>
        {localStorage.getItem("role") === "Lecturer" && (
          <Link to="/checkpoints/create" className="btn btn-primary">
            Tạo Checkpoint mới
          </Link>
        )}
      </div>

      {checkpoints.length === 0 ? (
        <div className="text-center py-5 bg-light rounded-3">
          <p className="h4 text-secondary">
            Chưa có checkpoint nào trong các team của bạn.
          </p>
          <p className="text-muted mt-2">
            {localStorage.getItem("role") === "Lecturer"
              ? "Hãy tạo checkpoint mới cho team của bạn."
              : "Hãy chờ giảng viên tạo checkpoint."}
          </p>
        </div>
      ) : (
        <div className="row g-4">
          {checkpoints.map((cp) => (
            <div key={cp.id} className="col-md-6 col-lg-4">
              <Link
                to={`/checkpoints/${cp.id}`}
                className="card h-100 text-decoration-none text-dark shadow-sm border-0"
              >
                <div className="card-body d-flex flex-column justify-content-between">
                  <div>
                    <h5 className="card-title">{cp.title}</h5>
                    {cp.description && <p className="card-text">{cp.description}</p>}
                    <p className="mb-1">
                      <strong>Hạn nộp:</strong>{" "}
                      {new Date(cp.dueDate).toLocaleString("vi-VN")}
                    </p>
                    {cp.isOverdue && <span className="text-danger fw-bold">QUÁ HẠN!</span>}
                  </div>
                  <div className="mt-3 text-end">
                    <p className="mb-1">
                      {cp.totalSubmissions}/{cp.totalMembers} đã nộp
                    </p>
                    <p className={`fw-bold fs-5 ${cp.hasSubmitted ? "text-success" : "text-danger"}`}>
                      {cp.hasSubmitted ? "ĐÃ NỘP" : "CHƯA NỘP"}
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CheckpointList;
