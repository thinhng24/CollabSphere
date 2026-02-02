import { useState } from "react";
import SubtaskList from "./SubtaskList";

const TaskCard = ({ task }) => {
  const [showSubtasks, setShowSubtasks] = useState(false);

  return (
    <div className="border rounded p-4 shadow bg-white">
      <h3 className="font-bold">{task.title}</h3>
      <p className="text-gray-600">{task.description}</p>
      <p className="text-sm mt-1">Progress: {task.progress.toFixed(0)}%</p>
      <p className="text-sm">Assignee: {task.assigneeName || "Unassigned"}</p>
      <p className="text-sm">Deadline: {task.deadline?.slice(0, 10)}</p>
      <button
        className="mt-2 text-blue-500"
        onClick={() => setShowSubtasks(!showSubtasks)}
      >
        {showSubtasks ? "Hide Subtasks" : "Show Subtasks"}
      </button>

      {showSubtasks && <SubtaskList subtasks={task.subtasks} />}
    </div>
  );
};

export default TaskCard;
