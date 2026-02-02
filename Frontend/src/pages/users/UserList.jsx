import { useEffect, useState } from "react";
import { userService } from "../../services/userService";
import Loading from "../../components/ui/Loading";
import EmptyState from "../../components/ui/EmptyState";

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await userService.getAll();
        setUsers(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Loading />;
  if (!users.length) return <EmptyState message="Không có người dùng" />;

  return (
    <div className="page">
      <h2>👥 Danh sách người dùng</h2>

      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Họ tên</th>
            <th>Email</th>
            <th>Vai trò</th>
            <th>Ngày tạo</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>{new Date(u.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserList;
