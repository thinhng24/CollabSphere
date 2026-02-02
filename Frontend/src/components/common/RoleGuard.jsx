import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // ✅ mới

const RoleGuard = ({ allow, children }) => {
  const { user } = useAuth();

  if (!user || !allow.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default RoleGuard;
