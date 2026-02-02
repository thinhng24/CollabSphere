import { Link } from "react-router-dom";

const Unauthorized = () => {
  return (
    <div style={{ textAlign: "center", marginTop: 80 }}>
      <h1>🚫 403</h1>
      <h2>Không có quyền truy cập</h2>
      <p>Bạn không được phép truy cập vào trang này</p>

      <Link to="/dashboard">
        <button>⬅ Quay về Dashboard</button>
      </Link>
    </div>
  );
};

export default Unauthorized;
