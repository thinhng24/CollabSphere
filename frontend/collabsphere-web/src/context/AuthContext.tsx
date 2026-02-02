import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';
import { User, AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    const response = await authAPI.login(email, password);
    const { token, user: userData } = response.data;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const isAdmin = (): boolean => user?.role === 'Admin';
  const isStaff = (): boolean => user?.role === 'Staff';
  const isHeadDept = (): boolean => user?.role === 'HeadDepartment';
  const isLecturer = (): boolean => user?.role === 'Lecturer';
  const isStudent = (): boolean => user?.role === 'Student';

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAdmin,
    isStaff,
    isHeadDept,
    isLecturer,
    isStudent,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
