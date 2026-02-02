import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// Danh sách role phải trùng với backend
const ROLE_OPTIONS = [
  { label: "Student", value: "Student" },
  { label: "Lecturer", value: "Lecturer" },
  { label: "Admin", value: "Admin" },
];

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    department: "",
    position: "",
    role: "Student", // default
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email is invalid";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      await register(formData);
      alert("Đăng ký thành công!");
      navigate("/login");
    } catch (err) {
      console.error(err.response?.data || err);
      const message = err.response?.data?.title || "Đăng ký thất bại. Vui lòng thử lại.";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 450, marginTop: "60px" }}>
      <div className="card shadow p-4">
        <h2 className="text-center mb-4">Đăng ký</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Name</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`form-control ${errors.name ? "is-invalid" : ""}`}
              placeholder="Name"
              disabled={loading}
            />
            {errors.name && <div className="invalid-feedback">{errors.name}</div>}
          </div>

          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`form-control ${errors.email ? "is-invalid" : ""}`}
              placeholder="Email"
              disabled={loading}
            />
            {errors.email && <div className="invalid-feedback">{errors.email}</div>}
          </div>

          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`form-control ${errors.password ? "is-invalid" : ""}`}
              placeholder="Password"
              disabled={loading}
            />
            {errors.password && <div className="invalid-feedback">{errors.password}</div>}
          </div>

          <div className="mb-3">
            <label className="form-label">Phone</label>
            <input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="form-control"
              placeholder="Phone"
              disabled={loading}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Department</label>
            <input
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="form-control"
              placeholder="Department"
              disabled={loading}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Position</label>
            <input
              name="position"
              value={formData.position}
              onChange={handleChange}
              className="form-control"
              placeholder="Position"
              disabled={loading}
            />
          </div>

          <div className="mb-4">
            <label className="form-label">Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="form-select"
              disabled={loading}
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading && <span className="spinner-border spinner-border-sm me-2" role="status"></span>}
            {loading ? "Đang đăng ký..." : "Đăng ký"}
          </button>
        </form>
      </div>
    </div>
  );
}
