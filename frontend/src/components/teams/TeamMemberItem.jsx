// src/components/teams/TeamMemberItem.jsx
const TeamMemberItem = ({ member, onRemove }) => (
  <div className="flex justify-between items-center border-b py-2">
    <div>
      {member.name} ({member.role})
    </div>
    {onRemove && (
      <button
        onClick={() => onRemove(member.userId)}
        className="text-red-500 hover:underline"
      >
        Remove
      </button>
    )}
  </div>
);

export default TeamMemberItem;
