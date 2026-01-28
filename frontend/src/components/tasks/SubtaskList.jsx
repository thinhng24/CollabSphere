import { useState } from "react";
import { toggleSubtask } from "../../api/taskService";

const SubtaskList = ({ subtasks }) => {
  const [localSubtasks, setLocalSubtasks] = useState(subtasks);

  const handleToggle = async (id) => {
    try {
      const res = await toggleSubtask(id);
      setLocalSubtasks((prev) =>
        prev.map((st) => (st.id === id ? { ...st, isDone: res.isDone } : st))
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <ul className="mt-2">
      {localSubtasks.map((st) => (
        <li key={st.id} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={st.isDone}
            onChange={() => handleToggle(st.id)}
          />
          <span className={st.isDone ? "line-through text-gray-400" : ""}>
            {st.title}
          </span>
        </li>
      ))}
    </ul>
  );
};

export default SubtaskList;
