// src/pages/checkpoints/CheckpointGrade.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import checkpointService from "../../services/checkpointService";

const CheckpointGrade = () => {
  const { id } = useParams();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const data = await checkpointService.getSubmissions(id);
      setSubmissions(data);
      setLoading(false);
    };
    fetch();
  }, [id]);

  const handleGrade = async (submissionId, score, feedback) => {
    await checkpointService.gradeSubmission(id, submissionId, { score, feedback });
    alert("Chấm điểm thành công!");
    window.location.reload();
  };

  if (loading)
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 h5">Đang tải...</p>
      </div>
    );

  return (
    <div className="container py-4">
      <h1 className="mb-4">Chấm điểm bài nộp</h1>

      {submissions.length === 0 && <p>Chưa có bài nộp nào.</p>}

      <div className="row g-4">
        {submissions.map((sub) => (
          <div key={sub.id} className="col-12">
            <div className="card shadow-sm p-3">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <h5 className="mb-1">{sub.userName}</h5>
                  <small className="text-muted">
                    Nộp lúc: {new Date(sub.submittedAt).toLocaleString("vi-VN")}
                  </small>
                </div>
                <div className="text-end">
                  {sub.score !== null ? (
                    <span className="fs-4 fw-bold text-primary">{sub.score}/10</span>
                  ) : (
                    <span className="text-secondary">Chưa chấm</span>
                  )}
                </div>
              </div>

              <p className="mb-3" style={{ whiteSpace: "pre-wrap" }}>
                {sub.content}
              </p>

              {/* Form chấm điểm */}
              {sub.score === null && (
                <div className="row g-2 align-items-end mb-2">
                  <div className="col-auto">
                    <label htmlFor={`score-${sub.id}`} className="form-label">
                      Điểm
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.5"
                      id={`score-${sub.id}`}
                      className="form-control"
                      placeholder="0-10"
                    />
                  </div>
                  <div className="col">
                    <label htmlFor={`feedback-${sub.id}`} className="form-label">
                      Feedback
                    </label>
                    <input
                      type="text"
                      id={`feedback-${sub.id}`}
                      className="form-control"
                      placeholder="Nhận xét (tùy chọn)"
                    />
                  </div>
                  <div className="col-auto">
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        const score = document.getElementById(`score-${sub.id}`).value;
                        const feedback = document.getElementById(`feedback-${sub.id}`).value;
                        if (!score) return alert("Nhập điểm!");
                        handleGrade(sub.id, parseFloat(score), feedback);
                      }}
                    >
                      Chấm điểm
                    </button>
                  </div>
                </div>
              )}

              {sub.feedback && (
                <p className="fst-italic text-secondary mt-2">Feedback: {sub.feedback}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CheckpointGrade;
