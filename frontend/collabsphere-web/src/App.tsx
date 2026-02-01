import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './context/AuthContext';

// Auth pages
import Login from './pages/Login';

// Dashboard pages
import LecturerDashboard from './pages/LecturerDashboard';
import HeadDeptDashboard from './pages/HeadDeptDashboard';

// Academic pages
import SubjectsPage from './pages/SubjectsPage';
import ClassesPage from './pages/ClassesPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetail from './pages/ProjectDetail';
import ImportExcelPage from './pages/ImportExcelPage';

// Teams pages
import TeamsPage from './pages/TeamsPage';
import CheckpointsPage from './pages/CheckpointsPage';
import WorkspacePage from './pages/WorkspacePage';

// Communication pages
import ChatPage from './pages/ChatPage';
import MeetingsPage from './pages/MeetingsPage';
import ResourcesPage from './pages/ResourcesPage';

// User pages
import ProfilePage from './pages/ProfilePage';
import AdminUsersPage from './pages/AdminUsersPage';

// Layout
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

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
};

const AppRoutes: React.FC = () => {
  const { user } = useAuth();

  const getDashboardComponent = () => {
    switch (user?.role) {
      case 'HeadDepartment':
        return <HeadDeptDashboard />;
      case 'Admin':
      case 'Staff':
        return <LecturerDashboard />;
      case 'Student':
        return <LecturerDashboard />;
      default:
        return <LecturerDashboard />;
    }
  };

  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/login" element={<Login />} />

      {/* Dashboard */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <DashboardLayout title="Dashboard">
              {getDashboardComponent()}
            </DashboardLayout>
          </PrivateRoute>
        }
      />

      {/* Profile */}
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <DashboardLayout title="My Profile">
              <ProfilePage />
            </DashboardLayout>
          </PrivateRoute>
        }
      />

      {/* Academic - Subjects */}
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

      {/* Academic - Classes */}
      <Route
        path="/classes"
        element={
          <PrivateRoute>
            <DashboardLayout title="Classes">
              <ClassesPage />
            </DashboardLayout>
          </PrivateRoute>
        }
      />

      {/* Academic - Projects */}
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

      {/* Academic - Review (HeadDept) */}
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

      {/* Academic - Import */}
      <Route
        path="/import"
        element={
          <PrivateRoute>
            <DashboardLayout title="Import Data">
              <ImportExcelPage />
            </DashboardLayout>
          </PrivateRoute>
        }
      />

      {/* Teams - My Teams */}
      <Route
        path="/teams"
        element={
          <PrivateRoute>
            <DashboardLayout title="My Teams">
              <TeamsPage />
            </DashboardLayout>
          </PrivateRoute>
        }
      />

      {/* Teams - Checkpoints */}
      <Route
        path="/checkpoints"
        element={
          <PrivateRoute>
            <DashboardLayout title="Checkpoints">
              <TeamsPage />
            </DashboardLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/checkpoints/:teamId"
        element={
          <PrivateRoute>
            <DashboardLayout title="Team Checkpoints">
              <CheckpointsPage />
            </DashboardLayout>
          </PrivateRoute>
        }
      />

      {/* Teams - Workspace */}
      <Route
        path="/workspace"
        element={
          <PrivateRoute>
            <DashboardLayout title="Workspace">
              <TeamsPage />
            </DashboardLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/workspace/:teamId"
        element={
          <PrivateRoute>
            <DashboardLayout title="Team Workspace">
              <WorkspacePage />
            </DashboardLayout>
          </PrivateRoute>
        }
      />

      {/* Communication - Chat */}
      <Route
        path="/chat"
        element={
          <PrivateRoute>
            <DashboardLayout title="Chat">
              <ChatPage />
            </DashboardLayout>
          </PrivateRoute>
        }
      />

      {/* Communication - Meetings */}
      <Route
        path="/meetings"
        element={
          <PrivateRoute>
            <DashboardLayout title="Meetings">
              <MeetingsPage />
            </DashboardLayout>
          </PrivateRoute>
        }
      />

      {/* Communication - Resources */}
      <Route
        path="/resources"
        element={
          <PrivateRoute>
            <DashboardLayout title="Resources">
              <ResourcesPage />
            </DashboardLayout>
          </PrivateRoute>
        }
      />

      {/* Admin - User Management */}
      <Route
        path="/admin/users"
        element={
          <PrivateRoute>
            <DashboardLayout title="User Management">
              <AdminUsersPage />
            </DashboardLayout>
          </PrivateRoute>
        }
      />

      {/* Admin - All Classes */}
      <Route
        path="/admin/classes"
        element={
          <PrivateRoute>
            <DashboardLayout title="All Classes">
              <ClassesPage />
            </DashboardLayout>
          </PrivateRoute>
        }
      />

      {/* Admin - All Teams */}
      <Route
        path="/admin/teams"
        element={
          <PrivateRoute>
            <DashboardLayout title="All Teams">
              <TeamsPage />
            </DashboardLayout>
          </PrivateRoute>
        }
      />

      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

const App: React.FC = () => {
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
};

export default App;
