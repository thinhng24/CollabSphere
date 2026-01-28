import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../services/api";

const Contribution = () => {
  const { id } = useParams();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchContribution = async () => {
      if (!id) return;
      try {
        const res = await api.get(`/teams/${id}/contribution`);
        setData(res.data);
      } catch (err) {
        setError("Không tải được dữ liệu đóng góp");
      } finally {
        setLoading(false);
      }
    };
    fetchContribution();
  }, [id]);

  if (loading) return <p>Đang tải...</p>;
  if (error) return <p className="text-danger">{error}</p>;

  const getProgressColor = (percent) => {
    if (percent >= 80) return "bg-success";
    if (percent >= 50) return "bg-info";
    if (percent >= 20) return "bg-warning";
    return "bg-danger";
  };

  return (
    <div className="container mt-4">
      <h3 className="mb-4">📊 % Đóng góp thành viên</h3>

      <table className="table table-bordered align-middle">
        <thead className="table-light">
          <tr>
            <th>Thành viên</th>
            <th>Subtask hoàn thành</th>
            <th>Tổng Subtask</th>
            <th>% Đóng góp</th>
          </tr>
        </thead>
        <tbody>
          {data.map((m) => (
            <tr key={m.userId}>
              <td>{m.userName}</td>
              <td>{m.completedSubtasks}</td>
              <td>{m.totalSubtasks}</td>
              <td style={{ width: "30%" }}>
                <div className="progress">
                  <div
                    className={`progress-bar ${getProgressColor(m.contributionPercent)}`}
                    role="progressbar"
                    style={{ width: `${m.contributionPercent}%` }}
                  >
                    {m.contributionPercent}%
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Contribution;
