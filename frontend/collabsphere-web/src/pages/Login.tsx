import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

type DemoRole = 'admin' | 'lecturer' | 'student';

interface DemoAccount {
  email: string;
  password: string;
  label: string;
}

const Login: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  const demoAccounts: Record<DemoRole, DemoAccount> = {
    admin: {
      email: 'admin@collabsphere.com',
      password: 'admin123',
      label: 'Admin'
    },
    lecturer: {
      email: 'lecturer@collabsphere.com',
      password: 'lecturer123',
      label: 'Teacher (Lecturer)'
    },
    student: {
      email: 'student@collabsphere.com',
      password: 'student123',
      label: 'Student'
    }
  };

  const handleDemoLogin = (role: DemoRole) => {
    const account = demoAccounts[role];
    setEmail(account.email);
    setPassword(account.password);
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          CollabSphere
        </Typography>
        <Typography variant="subtitle1" align="center" color="textSecondary" gutterBottom>
          Project Management System
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            sx={{ mt: 3 }}
          >
            Login
          </Button>

          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Demo Accounts:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
              {Object.entries(demoAccounts).map(([role, account]) => (
                <Button
                  key={role}
                  size="small"
                  variant="outlined"
                  onClick={() => handleDemoLogin(role as DemoRole)}
                  sx={{ flex: '1 1 auto' }}
                >
                  {account.label}
                </Button>
              ))}
            </Box>
            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1.5 }}>
              Click a demo account button to auto-fill credentials
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;
