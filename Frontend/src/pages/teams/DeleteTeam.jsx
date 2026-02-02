import { useNavigate, useParams } from "react-router-dom";
import teamService from "../../services/teamService";

const DeleteTeam = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const handleDelete = async () => {
    if (!window.confirm("Bạn có chắc muốn xóa nhóm này?")) return;
    try {
      await teamService.deleteTeam(id);
      alert("Xóa nhóm thành công");
      navigate("/teams");
    } catch (err) {
      console.error(err);
      alert("Xóa nhóm thất bại");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Xóa nhóm</h2>
      <button
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        onClick={handleDelete}
      >
        Xóa nhóm
      </button>
    </div>
  );
};

export default DeleteTeam;
