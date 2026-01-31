import React, { useState } from 'react';
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

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const result = await login(email, password);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
  };

  const handleDemoLogin = (role) => {
    const demoAccounts = {
      lecturer: { email: 'lecturer@collabsphere.com', password: 'demo123' },
      head: { email: 'head@collabsphere.com', password: 'demo123' }
    };

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
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => handleDemoLogin('lecturer')}
              >
                Lecturer Demo
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => handleDemoLogin('head')}
              >
                Head Dept Demo
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}
