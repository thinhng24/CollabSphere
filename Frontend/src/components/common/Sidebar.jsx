// src/components/common/Sidebar.jsx
import { NavLink } from "react-router-dom";
import useRole from "../../hooks/useRole";
import { useAuth } from "../../context/AuthContext";

const Sidebar = () => {
  const { isLecturer, isStudent } = useRole() || {};
  const { logout } = useAuth();

  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: "🏠" },
    ...(isLecturer
      ? [
          { name: "Teams", path: "/teams", icon: "👥" },
          { name: "Checkpoints", path: "/checkpoints", icon: "📌" },
        ]
      : []),
    ...(isStudent
      ? [
          { name: "Tasks", path: "/tasks", icon: "📝" },
        ]
      : []),
  ];

  return (
    <aside style={styles.sidebar}>
      <div>
        <h2 style={styles.logo}>📚 Project</h2>

        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) =>
              isActive ? styles.activeLink : styles.link
            }
          >
            {item.icon} {item.name}
          </NavLink>
        ))}
      </div>

      <button
        style={styles.logoutBtn}
        onClick={logout}
        onMouseEnter={(e) => (e.target.style.background = "#059669")}
        onMouseLeave={(e) => (e.target.style.background = "#10b981")}
      >
        🚪 Đăng xuất
      </button>
    </aside>
  );
};

const styles = {
  sidebar: {
    width: 220,
    minHeight: "100vh",
    padding: 20,
    background: "#3b2d8f", // sidebar tím đậm
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  logo: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  link: {
    textDecoration: "none",
    color: "#fff",
    padding: "10px 12px",
    borderRadius: 6,
    display: "block",
    marginBottom: 8,
    transition: "background 0.2s",
  },
  activeLink: {
    textDecoration: "none",
    color: "#fff",
    backgroundColor: "#10b981", // active xanh lá
    padding: "10px 12px",
    borderRadius: 6,
    display: "block",
    marginBottom: 8,
  },
  logoutBtn: {
    backgroundColor: "#10b981", // xanh lá nổi bật
    color: "#fff",
    border: "none",
    borderRadius: 6,
    padding: "10px 12px",
    cursor: "pointer",
    fontWeight: 500,
    transition: "all 0.2s",
  },
};

export default Sidebar;
