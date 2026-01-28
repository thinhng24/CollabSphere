import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div style={styles.container}>
      <h1>404</h1>
      <h2>Trang không tồn tại</h2>
      <p>Xin lỗi, đường dẫn bạn truy cập không hợp lệ.</p>
      <Link to="/dashboard" style={styles.link}>
        ⬅ Quay về Dashboard
      </Link>
    </div>
  );
};

const styles = {
  container: {
    textAlign: "center",
    marginTop: 100,
  },
  link: {
    marginTop: 20,
    display: "inline-block",
    textDecoration: "none",
    color: "#fff",
    backgroundColor: "#3b82f6",
    padding: "10px 20px",
    borderRadius: 5,
  },
};

export default NotFound;
