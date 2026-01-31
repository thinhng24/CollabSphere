import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './context/AuthContext';

import Login from './pages/Login';
import LecturerDashboard from './pages/LecturerDashboard';
import HeadDeptDashboard from './pages/HeadDeptDashboard';
import ProjectDetail from './pages/ProjectDetail';
import ProjectsPage from './pages/ProjectsPage';
import SubjectsPage from './pages/SubjectsPage';
import ImportExcelPage from './pages/ImportExcelPage';
import DashboardLayout from './components/DashboardLayout';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return user ? children : <Navigate to="/login" />;
}


function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <DashboardLayout title="Dashboard">
              {user?.role === 'HeadDepartment' ? (
                <HeadDeptDashboard />
              ) : (
                <LecturerDashboard />
              )}
            </DashboardLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/projects"
        element={
          <PrivateRoute>
            <DashboardLayout title="Projects">
              <ProjectsPage />
            </DashboardLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/projects/:id"
        element={
          <PrivateRoute>
            <DashboardLayout title="Project Details">
              <ProjectDetail />
            </DashboardLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/subjects"
        element={
          <PrivateRoute>
            <DashboardLayout title="Subjects">
              <SubjectsPage />
            </DashboardLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/import"
        element={
          <PrivateRoute>
            <DashboardLayout title="Import Excel">
              <ImportExcelPage />
            </DashboardLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/review"
        element={
          <PrivateRoute>
            <DashboardLayout title="Review Projects">
              <HeadDeptDashboard />
            </DashboardLayout>
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
