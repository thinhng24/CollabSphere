import { useEffect, useState } from "react";
import { taskService } from "../../services/taskService";
import { submissionService } from "../../services/submissionService";
import Loading from "../../components/ui/Loading";

const Statistics = () => {
  const [loading, setLoading] = useState(true);
  const [taskStats, setTaskStats] = useState({
    todo: 0,
    doing: 0,
    done: 0
  });
  const [submissionCount, setSubmissionCount] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const tasks = await taskService.getMyTasks();
        const submissions = await submissionService.getMySubmissions();

        setTaskStats({
          todo: tasks.filter(t => t.status === "To Do").length,
          doing: tasks.filter(t => t.status === "In Progress").length,
          done: tasks.filter(t => t.status === "Done").length
        });

        setSubmissionCount(submissions.length);
      } catch (err) {
        console.error("Statistics error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="page">
      <h2>📈 Statistics</h2>

      <div className="stats-grid">
        <div className="card">
          <h3>🟡 To Do</h3>
          <p className="number">{taskStats.todo}</p>
        </div>

        <div className="card">
          <h3>🔵 In Progress</h3>
          <p className="number">{taskStats.doing}</p>
        </div>

        <div className="card">
          <h3>🟢 Done</h3>
          <p className="number">{taskStats.done}</p>
        </div>

        <div className="card">
          <h3>📤 Submissions</h3>
          <p className="number">{submissionCount}</p>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
