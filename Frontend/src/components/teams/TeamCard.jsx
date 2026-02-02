// src/components/teams/TeamCard.jsx
import { Link } from "react-router-dom";

const TeamCard = ({ team }) => (
  <div className="border p-4 rounded shadow hover:shadow-lg transition">
    <h3 className="font-bold text-lg">{team.name}</h3>
    <p className="text-sm text-gray-600">Lecturer: {team.lecturerName}</p>
    <p className="text-sm">Tasks: {team.taskCount}, Completed: {team.completedTaskCount}</p>
    <p className="text-sm">Checkpoints: {team.checkpointCount}</p>
    <Link
      to={`/teams/${team.id}`}
      className="text-blue-500 hover:underline mt-2 inline-block"
    >
      View Details
    </Link>
  </div>
);

export default TeamCard;
