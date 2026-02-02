import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { CircularProgress, Box } from '@mui/material';
import { AuthProvider, useAuth } from './context/AuthContext';

// Eagerly load critical components
import Login from './pages/Login';
import DashboardLayout from './components/DashboardLayout';

// Lazy load all other pages for code splitting
const LecturerDashboard = lazy(() => import('./pages/LecturerDashboard'));
const HeadDeptDashboard = lazy(() => import('./pages/HeadDeptDashboard'));
const SubjectsPage = lazy(() => import('./pages/SubjectsPage'));
const ClassesPage = lazy(() => import('./pages/ClassesPage'));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const ImportExcelPage = lazy(() => import('./pages/ImportExcelPage'));
const TeamsPage = lazy(() => import('./pages/TeamsPage'));
const CheckpointsPage = lazy(() => import('./pages/CheckpointsPage'));
const WorkspacePage = lazy(() => import('./pages/WorkspacePage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const MeetingsPage = lazy(() => import('./pages/MeetingsPage'));
const ResourcesPage = lazy(() => import('./pages/ResourcesPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'));

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

// Loading fallback component
const LoadingFallback: React.FC = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="100vh"
  >
    <CircularProgress />
  </Box>
);

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
    <Suspense fallback={<LoadingFallback />}>
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
    </Suspense>
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
