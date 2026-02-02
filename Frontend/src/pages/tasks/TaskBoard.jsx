// src/pages/tasks/TaskBoard.jsx
import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import taskService from "../../services/taskService";
import "./TaskBoard.css";

const TaskBoard = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const statuses = ["To Do", "In Progress", "Done"];

  // Lấy tasks từ API
  const fetchTasks = async () => {
    setLoading(true);
    try {
      const data = teamId
        ? await taskService.getTeamTasks(teamId)
        : await taskService.getMyTasks();

      // Sắp xếp tasks trong từng cột theo order
      const sortedTasks = statuses.flatMap((status) =>
        (data.filter((t) => t.status === status) || []).sort(
          (a, b) => a.order - b.order
        )
      );
      setTasks(sortedTasks);
    } catch (err) {
      console.error(err);
      setError("Không thể tải danh sách công việc");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [teamId]);

  // Drag & Drop
  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return; // thả ra ngoài → bỏ qua
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    const taskId = parseInt(draggableId);
    const newStatus = destination.droppableId;
    const newOrder = destination.index;

    // Lấy task đang di chuyển
    const taskToMove = tasks.find((t) => t.id === taskId);
    if (!taskToMove) return;

    // Optimistic update UI
    setTasks((prev) => {
      const updated = prev.map((t) =>
        t.id === taskId ? { ...t, status: newStatus } : t
      );

      // Tasks trong cột mới, bỏ task đang di chuyển
      const filtered = updated.filter((t) => t.status === newStatus && t.id !== taskId);
      const other = updated.filter((t) => t.status !== newStatus);

      // Thêm task vào vị trí mới
      filtered.splice(newOrder, 0, { ...taskToMove, status: newStatus });

      // Cập nhật lại order
      filtered.forEach((t, idx) => (t.order = idx));

      return [...other, ...filtered];
    });

    // Gọi API lưu thay đổi
    try {
      await taskService.updateTaskStatus(taskId, {
        status: newStatus,
        order: newOrder,
      });
    } catch (err) {
      console.error(err);
      alert("Cập nhật vị trí thất bại, đang tải lại...");
      fetchTasks(); // rollback
    }
  };

  const handleCreateTask = () => {
    navigate(teamId ? `/tasks/create?teamId=${teamId}` : "/tasks/create");
  };

  if (loading) return <div className="text-center py-5">Đang tải...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  // Tạo map tasks theo status để tránh filter nhiều lần
  const tasksByStatus = statuses.reduce((acc, status) => {
    acc[status] = tasks.filter((t) => t.status === status);
    return acc;
  }, {});

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Kanban Board</h2>
        <button className="btn btn-primary" onClick={handleCreateTask}>
          + Tạo Task Mới
        </button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="row g-4">
          {statuses.map((status) => (
            <div key={status} className="col-12 col-md-4">
              <Droppable droppableId={status}>
                {(provided, snapshot) => (
                  <div
                    className={`kanban-column ${
                      snapshot.isDraggingOver ? "dragging-over" : ""
                    }`}
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    <div className="column-header">
                      <h5 className="mb-0">
                        {status} ({tasksByStatus[status].length})
                      </h5>
                    </div>

                    <div className="task-list">
                      {tasksByStatus[status].map((task, index) => (
                        <Draggable
                          key={task.id}
                          draggableId={task.id.toString()}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`task-card ${
                                snapshot.isDragging ? "dragging" : ""
                              }`}
                            >
                              <Link
                                to={`/tasks/${task.id}`}
                                className="task-title"
                              >
                                {task.title}
                              </Link>

                              {task.assigneeName && (
                                <small className="text-muted">
                                  👤 {task.assigneeName}
                                </small>
                              )}

                              <div className="progress mt-2">
                                <div
                                  className={`progress-bar ${
                                    task.progress === 100
                                      ? "bg-success"
                                      : task.progress < 50
                                      ? "bg-warning"
                                      : "bg-info"
                                  }`}
                                  style={{ width: `${task.progress}%` }}
                                />
                              </div>
                              <small className="text-muted">
                                {task.progress.toFixed(0)}%
                              </small>

                              <div className="task-actions mt-2">
                                <button
                                  className="btn btn-sm btn-outline-secondary me-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    navigate(`/tasks/${task.id}/update`);
                                  }}
                                >
                                  Sửa
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    if (window.confirm("Xóa task này?")) {
                                      taskService
                                        .deleteTask(task.id)
                                        .then(fetchTasks)
                                        .catch(() => alert("Xóa thất bại"));
                                    }
                                  }}
                                >
                                  Xóa
                                </button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default TaskBoard;
