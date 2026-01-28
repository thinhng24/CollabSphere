import { useAuth } from "../context/AuthContext"; // ✅ mới

const useRole = () => {
  const { user } = useAuth();

  const isLecturer = user?.role === "Lecturer";
  const isStudent = user?.role === "Student";

  const hasRole = (role) => user?.role === role;

  return {
    role: user?.role,
    isLecturer,
    isStudent,
    hasRole,
  };
};

export default useRole;
