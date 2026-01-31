import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, AppBar as MuiAppBar, Toolbar, Typography, Button } from '@mui/material';
import { AuthProvider, useAuth } from './context/AuthContext';

import Login from './pages/Login';
import LecturerDashboard from './pages/LecturerDashboard';
import HeadDeptDashboard from './pages/HeadDeptDashboard';
import ProjectDetail from './pages/ProjectDetail';

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

function NavigationBar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <Box sx={{ flexGrow: 1 }}>
      <MuiAppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            CollabSphere - {user.role === 'HeadDepartment' ? 'Head of Department' : user.role}
          </Typography>
          <Typography variant="body1" sx={{ mr: 2 }}>
            {user.fullName}
          </Typography>
          <Button color="inherit" onClick={logout}>
            Logout
          </Button>
        </Toolbar>
      </MuiAppBar>
    </Box>
  );
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
            {user?.role === 'HeadDepartment' ? (
              <HeadDeptDashboard />
            ) : (
              <LecturerDashboard />
            )}
          </PrivateRoute>
        }
      />
      <Route
        path="/projects/:id"
        element={
          <PrivateRoute>
            <ProjectDetail />
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
          <NavigationBar />
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
