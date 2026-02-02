// src/pages/checkpoints/SprintBoard.jsx
const SprintBoard = () => {
  return (
    <div className="p-10">
      <h1 className="text-4xl font-bold mb-8">Sprint Board (Kanban)</h1>
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-gray-100 p-6 rounded-lg min-h-96">
          <h2 className="font-bold text-xl mb-4">To Do</h2>
          <p className="text-gray-500">Chưa có task</p>
        </div>
        <div className="bg-yellow-50 p-6 rounded-lg min-h-96">
          <h2 className="font-bold text-xl mb-4">Doing</h2>
        </div>
        <div className="bg-green-50 p-6 rounded-lg min-h-96">
          <h2 className="font-bold text-xl mb-4">Done</h2>
        </div>
      </div>
      <p className="mt-10 text-center text-gray-600">
        Phần này sẽ được triển khai với React Beautiful DnD + Task/Subtask + % đóng góp
      </p>
    </div>
  );
};

export default SprintBoard;