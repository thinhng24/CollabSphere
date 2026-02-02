// src/pages/checkpoints/CheckpointCreate.jsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import checkpointService from "../../services/checkpointService";
import teamService from "../../services/teamService";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const schema = z.object({
  teamId: z.number().min(1, { message: "Vui lòng chọn một team" }),
  title: z.string().min(3, { message: "Tiêu đề phải có ít nhất 3 ký tự" }).max(200),
  description: z.string().optional(),
  dueDate: z.string().min(1, { message: "Vui lòng chọn ngày giờ hết hạn" }),
});

const CheckpointCreate = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [errorTeams, setErrorTeams] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoadingTeams(true);
        setErrorTeams(null);
        const data = await teamService.getMyTeams();
        setTeams(data);
      } catch (err) {
        console.error("Không tải được danh sách team:", err);
        setErrorTeams("Không thể tải danh sách team. Vui lòng thử lại sau.");
      } finally {
        setLoadingTeams(false);
      }
    };
    fetchTeams();
  }, []);

  const onSubmit = async (data) => {
    setLoadingSubmit(true);
    try {
      const payload = {
        teamId: data.teamId,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        dueDate: new Date(data.dueDate).toISOString(),
      };
      const response = await checkpointService.create(payload);
      const newId = response.id || response.data?.id;
      alert("Tạo checkpoint thành công!");
      navigate(`/checkpoints/${newId}`);
    } catch (err) {
      console.error("Tạo checkpoint thất bại:", err);
      alert("Tạo checkpoint thất bại. Vui lòng thử lại.");
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="text-center mb-5">
        <h1 className="display-5 mb-3">Tạo Checkpoint Mới</h1>
        <p className="lead">Thiết lập mốc kiểm tra tiến độ cho team của bạn</p>
      </div>

      <div className="card shadow-lg p-4 p-md-5">
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Chọn Team */}
          <div className="mb-4">
            <label className="form-label fw-semibold">
              Chọn Team <span className="text-danger">*</span>
            </label>

            {loadingTeams && (
              <div className="text-center py-3">
                <div className="spinner-border text-primary mb-2" role="status"></div>
                <p>Đang tải danh sách team...</p>
              </div>
            )}

            {errorTeams && (
              <div className="alert alert-danger">{errorTeams}</div>
            )}

            {!loadingTeams && !errorTeams && teams.length === 0 && (
              <div className="alert alert-warning">
                Bạn chưa có team nào. Hãy tạo team trước khi tạo checkpoint.
              </div>
            )}

            {!loadingTeams && !errorTeams && teams.length > 0 && (
              <select
                {...register("teamId", { valueAsNumber: true })}
                className="form-select"
                disabled={loadingSubmit}
              >
                <option value="">-- Chọn một team --</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name} ({team.memberCount || 0} thành viên)
                  </option>
                ))}
              </select>
            )}

            {errors.teamId && (
              <div className="form-text text-danger">{errors.teamId.message}</div>
            )}
          </div>

          {/* Tiêu đề */}
          <div className="mb-4">
            <label className="form-label fw-semibold">
              Tiêu đề Checkpoint <span className="text-danger">*</span>
            </label>
            <input
              {...register("title")}
              type="text"
              placeholder="Ví dụ: Checkpoint 1 - Báo cáo tiến độ tuần 4"
              className="form-control"
              disabled={loadingSubmit}
            />
            {errors.title && (
              <div className="form-text text-danger">{errors.title.message}</div>
            )}
          </div>

          {/* Mô tả */}
          <div className="mb-4">
            <label className="form-label fw-semibold">Mô tả (tùy chọn)</label>
            <textarea
              {...register("description")}
              rows="5"
              placeholder="Mô tả chi tiết yêu cầu, tiêu chí đánh giá..."
              className="form-control"
              disabled={loadingSubmit}
            />
          </div>

          {/* Hạn nộp */}
          <div className="mb-4">
            <label className="form-label fw-semibold">
              Hạn nộp <span className="text-danger">*</span>
            </label>
            <input
              {...register("dueDate")}
              type="datetime-local"
              className="form-control"
              disabled={loadingSubmit}
            />
            {errors.dueDate && (
              <div className="form-text text-danger">{errors.dueDate.message}</div>
            )}
          </div>

          {/* Nút hành động */}
          <div className="d-flex flex-column flex-md-row gap-3 mt-4">
            <button
              type="submit"
              className="btn btn-primary flex-grow-1"
              disabled={loadingSubmit || loadingTeams || teams.length === 0}
            >
              {loadingSubmit && (
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
              )}
              {loadingSubmit ? "Đang tạo checkpoint..." : "Tạo Checkpoint"}
            </button>
            <button
              type="button"
              className="btn btn-secondary flex-grow-1"
              onClick={() => navigate(-1)}
              disabled={loadingSubmit}
            >
              Hủy bỏ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckpointCreate;
