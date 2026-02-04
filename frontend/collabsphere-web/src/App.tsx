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
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const StaffDashboard = lazy(() => import('./pages/StaffDashboard'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const SubjectsPage = lazy(() => import('./pages/SubjectsPage'));
const SyllabusManagementPage = lazy(() => import('./pages/SyllabusManagementPage'));
const AssignProjectsPage = lazy(() => import('./pages/AssignProjectsPage'));
const AssignUsersPage = lazy(() => import('./pages/AssignUsersPage'));
const ClassesPage = lazy(() => import('./pages/ClassesPage'));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const EnhancedImportPage = lazy(() => import('./pages/EnhancedImportPage'));
const TeamsPage = lazy(() => import('./pages/TeamsPage'));
const TeamManagementPage = lazy(() => import('./pages/TeamManagementPage'));
const CheckpointsPage = lazy(() => import('./pages/CheckpointsPage'));
const WorkspacePage = lazy(() => import('./pages/WorkspacePage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const MeetingsPage = lazy(() => import('./pages/MeetingsPage'));
const ResourcesPage = lazy(() => import('./pages/ResourcesPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'));
const SystemReportsPage = lazy(() => import('./pages/SystemReportsPage'));
const AIChatbotPage = lazy(() => import('./pages/AIChatbotPage'));
const ProgressMonitoringPage = lazy(() => import('./pages/ProgressMonitoringPage'));
const MilestoneQuestionsPage = lazy(() => import('./pages/MilestoneQuestionsPage'));
const AnswerMilestoneQuestionsPage = lazy(() => import('./pages/AnswerMilestoneQuestionsPage'));
const PeerEvaluationPage = lazy(() => import('./pages/PeerEvaluationPage'));
const CheckpointManagementPage = lazy(() => import('./pages/CheckpointManagementPage'));
const EvaluationFeedbackPage = lazy(() => import('./pages/EvaluationFeedbackPage'));
const CollaborativeEditorPage = lazy(() => import('./pages/CollaborativeEditorPage'));
const WhiteboardPage = lazy(() => import('./pages/WhiteboardPage'));

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
      case 'Admin':
        return <AdminDashboard />;
      case 'HeadDepartment':
        return <HeadDeptDashboard />;
      case 'Staff':
        return <StaffDashboard />;
      case 'Lecturer':
        return <LecturerDashboard />;
      case 'Student':
        return <StudentDashboard />;
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

      {/* Academic - Syllabi */}
      <Route
        path="/syllabi"
        element={
          <PrivateRoute>
            <DashboardLayout title="Syllabus Management">
              <SyllabusManagementPage />
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

      {/* Academic - Assign Projects (HeadDept) */}
      <Route
        path="/assign-projects"
        element={
          <PrivateRoute>
            <DashboardLayout title="Assign Projects">
              <AssignProjectsPage />
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
              <EnhancedImportPage />
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

      {/* Teams - Management (Lecturer) */}
      <Route
        path="/teams/manage"
        element={
          <PrivateRoute>
            <DashboardLayout title="Team Management">
              <TeamManagementPage />
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

      {/* Teams - Checkpoint Management (Team Leader) */}
      <Route
        path="/checkpoints/:teamId/manage"
        element={
          <PrivateRoute>
            <DashboardLayout title="Manage Checkpoints">
              <CheckpointManagementPage />
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

      {/* Teams - Progress Monitoring */}
      <Route
        path="/progress"
        element={
          <PrivateRoute>
            <DashboardLayout title="Progress Monitoring">
              <ProgressMonitoringPage />
            </DashboardLayout>
          </PrivateRoute>
        }
      />

      {/* Teams - Milestone Questions */}
      <Route
        path="/milestone-questions"
        element={
          <PrivateRoute>
            <DashboardLayout title="Milestone Questions">
              <MilestoneQuestionsPage />
            </DashboardLayout>
          </PrivateRoute>
        }
      />

      {/* Teams - Answer Milestone Questions */}
      <Route
        path="/milestones/:milestoneId/answer"
        element={
          <PrivateRoute>
            <DashboardLayout title="Answer Questions">
              <AnswerMilestoneQuestionsPage />
            </DashboardLayout>
          </PrivateRoute>
        }
      />

      {/* Teams - Peer Evaluation */}
      <Route
        path="/peer-evaluation"
        element={
          <PrivateRoute>
            <DashboardLayout title="Peer Evaluation">
              <PeerEvaluationPage />
            </DashboardLayout>
          </PrivateRoute>
        }
      />

      {/* Teams - Evaluation & Feedback */}
      <Route
        path="/evaluation"
        element={
          <PrivateRoute>
            <DashboardLayout title="Evaluation & Feedback">
              <EvaluationFeedbackPage />
            </DashboardLayout>
          </PrivateRoute>
        }
      />

      {/* Teams - Collaborative Editor */}
      <Route
        path="/editor/:documentId"
        element={
          <PrivateRoute>
            <DashboardLayout title="Collaborative Editor">
              <CollaborativeEditorPage />
            </DashboardLayout>
          </PrivateRoute>
        }
      />

      {/* Teams - Whiteboard */}
      <Route
        path="/whiteboard/:teamId"
        element={
          <PrivateRoute>
            <DashboardLayout title="Whiteboard">
              <WhiteboardPage />
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

      {/* Communication - AI Chatbot */}
      <Route
        path="/ai-assistant"
        element={
          <PrivateRoute>
            <DashboardLayout title="AI Assistant">
              <AIChatbotPage />
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

      {/* Admin - System Reports */}
      <Route
        path="/admin/reports"
        element={
          <PrivateRoute>
            <DashboardLayout title="System Reports">
              <SystemReportsPage />
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

      {/* Staff - Assign Users */}
      <Route
        path="/staff/assign"
        element={
          <PrivateRoute>
            <DashboardLayout title="Assign Users to Classes">
              <AssignUsersPage />
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
