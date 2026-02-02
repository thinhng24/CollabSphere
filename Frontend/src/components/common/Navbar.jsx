import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav style={styles.nav}>
      <h3 style={styles.logo}>📚 Project Management</h3>

      <div style={styles.userSection}>
        {user && (
          <>
            <span style={styles.userInfo}>
              {user.name} ({user.role})
            </span>
          </>
        )}
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    padding: "12px 24px",
    background: "#f9fafb", // nền sáng như layout hình
    color: "#111827", // text màu đen đậm
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  logo: {
    margin: 0,
    fontSize: "1.5rem",
    fontWeight: "bold",
    color: "#1f2937", // màu logo tối hơn text
  },
  userSection: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  userInfo: {
    fontWeight: 500,
    color: "#374151", // màu xám đậm dễ nhìn
  },
  btn: {
    background: "#10b981", // xanh lá nổi bật
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    padding: "6px 14px",
    cursor: "pointer",
    fontWeight: 500,
    transition: "all 0.2s",
  },
};

export default Navbar;
