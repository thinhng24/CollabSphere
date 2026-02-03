import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Grid,
  Divider,
  Alert,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import BadgeIcon from '@mui/icons-material/Badge';
import BusinessIcon from '@mui/icons-material/Business';
import SaveIcon from '@mui/icons-material/Save';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      await authAPI.updateProfile(user.id, { fullName, phone, department });
      setSuccess('Profile updated successfully!');
      setEditing(false);
      // Update localStorage
      const updatedUser = { ...user, fullName, phone, department };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch {
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'error';
      case 'Staff': return 'warning';
      case 'HeadDepartment': return 'secondary';
      case 'Lecturer': return 'primary';
      case 'Student': return 'success';
      default: return 'default';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'HeadDepartment': return 'Head of Department';
      default: return role;
    }
  };

  if (!user) return null;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        My Profile
      </Typography>

      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* Profile Card */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Avatar
              sx={{
                width: 120,
                height: 120,
                mx: 'auto',
                mb: 2,
                bgcolor: 'primary.main',
                fontSize: '3rem'
              }}
            >
              {user.fullName?.charAt(0).toUpperCase() || 'U'}
            </Avatar>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {user.fullName}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              {user.email}
            </Typography>
            <Chip
              label={getRoleLabel(user.role)}
              color={getRoleColor(user.role) as any}
              sx={{ fontWeight: 500 }}
            />
          </Paper>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Account Information
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <BadgeIcon fontSize="small" color="action" />
                <Typography variant="body2">ID: {user.id}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <EmailIcon fontSize="small" color="action" />
                <Typography variant="body2">{user.email}</Typography>
              </Box>
              {user.department && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BusinessIcon fontSize="small" color="action" />
                  <Typography variant="body2">{user.department}</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Edit Profile */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon /> Edit Profile
              </Typography>
              {!editing && (
                <Button variant="outlined" onClick={() => setEditing(true)}>
                  Edit
                </Button>
              )}
            </Box>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={!editing}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  value={user.email}
                  disabled
                  helperText="Email cannot be changed"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={!editing}
                  placeholder="+84 xxx xxx xxx"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  disabled={!editing}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Role"
                  value={getRoleLabel(user.role)}
                  disabled
                  helperText="Contact admin to change role"
                />
              </Grid>
            </Grid>

            {editing && (
              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setEditing(false);
                    setFullName(user.fullName || '');
                    setPhone(user.phone || '');
                    setDepartment(user.department || '');
                  }}
                >
                  Cancel
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProfilePage;
