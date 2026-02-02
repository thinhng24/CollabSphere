import { useAuth } from "../../hooks/useAuth";

const Profile = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="page">
      <h2>👤 Hồ sơ cá nhân</h2>

      <div className="card">
        <p><strong>ID:</strong> {user.id}</p>
        <p><strong>Họ tên:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Vai trò:</strong> {user.role}</p>
        <p>
          <strong>Ngày tạo:</strong>{" "}
          {new Date(user.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};

export default Profile;
