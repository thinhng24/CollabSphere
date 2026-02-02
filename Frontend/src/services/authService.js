import axios from "axios";

const API_URL = "http://localhost:5000/api/auth";

const register = async (data) => {
  return await axios.post(`${API_URL}/register`, data);
};

const login = async (email, password) => {
  return await axios.post(`${API_URL}/login`, { email, password });
};

const getProfile = async () => {
  const token = localStorage.getItem("token");
  return await axios.get(`${API_URL}/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export default { register, login, getProfile };
