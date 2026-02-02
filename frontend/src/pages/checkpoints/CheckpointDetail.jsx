// src/pages/checkpoints/CheckpointDetail.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import checkpointService from "../../services/checkpointService";
import { useAuth } from "../../context/AuthContext";

const CheckpointDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const isLecturer = user?.role === "Lecturer";

  const [checkpoint, setCheckpoint] = useState(null);
  const [content, setContent] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchCheckpoint = async () => {
    try {
      const data = await checkpointService.getById(id);
      setCheckpoint(data);

      if (data.mySubmission) {
        setContent(data.mySubmission.content || "");
        setFileUrl(data.mySubmission.fileUrl || "");
        setFileName(data.mySubmission.fileName || "");
      }
    } catch {
      alert("Bạn không có quyền xem checkpoint này");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckpoint();
  }, [id]);

  const handleSubmit = async () => {
    if (!content.trim()) {
      alert("Vui lòng nhập nội dung bài nộp");
      return;
    }

    setSubmitting(true);
    try {
      await checkpointService.submit({
        checkpointId: Number(id),
        content: content.trim(),
        fileUrl: fileUrl || null,
        fileName: fileName || null,
      });

      await fetchCheckpoint();
      alert("Nộp bài thành công!");
    } catch {
      alert("Nộp bài thất bại!");
    } finally {
      setSubmitting(false);
    }
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

  if (!checkpoint)
    return (
      <p className="text-center py-5 text-danger h5">
        Không tìm thấy checkpoint
      </p>
    );

  const isLate = new Date() > new Date(checkpoint.dueDate);
  const isGraded = checkpoint.mySubmission?.score !== null;

  return (
    <div className="container py-4">
      <h1 className="mb-4">{checkpoint.title}</h1>

      {checkpoint.description && (
        <div className="bg-light p-4 rounded mb-4">{checkpoint.description}</div>
      )}

      {/* Thông tin checkpoint */}
      <div className="row bg-white p-4 rounded shadow mb-4">
        <div className="col-md-4 mb-2">
          <strong>Hạn nộp:</strong>{" "}
          {new Date(checkpoint.dueDate).toLocaleString("vi-VN")}
        </div>
        <div className="col-md-4 mb-2">
          <strong>Tiến độ:</strong>{" "}
          {checkpoint.totalSubmissions}/{checkpoint.totalMembers} đã nộp
        </div>
        <div className="col-md-4 mb-2">
          <strong>Bài của bạn:</strong>{" "}
          <span
            className={
              checkpoint.hasSubmitted
                ? "text-success fw-bold"
                : "text-danger fw-bold"
            }
          >
            {checkpoint.hasSubmitted ? "Đã nộp" : "Chưa nộp"}
          </span>
        </div>
      </div>

      {/* Lecturer */}
      {isLecturer && (
        <div className="text-center mb-4">
          <Link
            to={`/checkpoints/${id}/grade`}
            className="btn btn-purple"
            style={{ backgroundColor: "#7c3aed", color: "white" }}
          >
            Chấm điểm bài nộp
          </Link>
        </div>
      )}

      {/* Student submission */}
      {!isLecturer && (
        <div className="card shadow mb-4">
          <div className="card-body">
            <h2 className="h5 mb-3">Bài nộp của bạn</h2>

            {/* Bài đã nộp */}
            {checkpoint.mySubmission && (
              <div className="mb-3 p-3 bg-primary bg-opacity-10 rounded border">
                <p className="text-primary mb-2 small">
                  Nộp lúc:{" "}
                  {new Date(
                    checkpoint.mySubmission.submittedAt
                  ).toLocaleString("vi-VN")}
                </p>

                <pre>{checkpoint.mySubmission.content}</pre>

                {checkpoint.mySubmission.fileUrl && (
                  <a
                    href={checkpoint.mySubmission.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary btn-sm mt-2"
                  >
                    {checkpoint.mySubmission.fileName}
                  </a>
                )}

                {isGraded && (
                  <div className="mt-2 fw-bold text-primary">
                    Điểm: {checkpoint.mySubmission.score}/10
                    {checkpoint.mySubmission.feedback && (
                      <p className="fst-italic text-secondary mt-1">
                        Nhận xét: {checkpoint.mySubmission.feedback}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Form nộp */}
            {!isGraded && !isLate && (
              <>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows="6"
                  className="form-control mb-2"
                  placeholder="Nhập nội dung bài làm..."
                />
                <input
                  className="form-control mb-2"
                  placeholder="Link file (Google Drive...)"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                />
                <input
                  className="form-control mb-3"
                  placeholder="Tên file"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                />
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="btn btn-success w-100"
                >
                  {submitting
                    ? "Đang nộp..."
                    : checkpoint.hasSubmitted
                    ? "Cập nhật bài nộp"
                    : "Nộp bài"}
                </button>
              </>
            )}

            {isLate && !isGraded && (
              <p className="text-danger fw-bold mt-2">⛔ Đã quá hạn nộp bài</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckpointDetail;
