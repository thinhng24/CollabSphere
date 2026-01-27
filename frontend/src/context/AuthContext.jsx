// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import authService from "../services/authService";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await authService.getProfile();
      const profileData = res.data;

      setUser(profileData);
      setIsAuthenticated(true);

      // ← THÊM DÒNG NÀY ĐỂ LƯU ROLE VÀO LOCALSTORAGE
      localStorage.setItem("role", profileData.role);
    } catch (err) {
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await authService.login(email, password);
    const data = res.data;

    localStorage.setItem("token", data.token);

    // ← THÊM DÒNG NÀY ĐỂ LƯU ROLE NGAY SAU LOGIN
    localStorage.setItem("role", data.role);

    await fetchProfile(); // vẫn giữ để cập nhật user state
  };

  const register = async (data) => {
    const res = await authService.register(data);
    // Nếu register trả token thì lưu tương tự login
    if (res.data.token) {
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      await fetchProfile();
    }
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setIsAuthenticated(false);
  };

  const hasRole = (role) => user?.role === role;

  return (
    <AuthContext.Provider
      value={{ user, loading, isAuthenticated, login, register, logout, hasRole }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);