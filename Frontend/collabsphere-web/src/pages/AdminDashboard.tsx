import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
  AdminPanelSettings as AdminIcon,
  Work as WorkIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { usersAPI } from '../services/api';
import { User } from '../types';
import StatCard from '../components/StatCard';

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  adminCount: number;
  staffCount: number;
  headDeptCount: number;
  lecturerCount: number;
  studentCount: number;
  recentReportsCount: number;
}

interface ActivityLog {
  id: string;
  action: string;
  user: string;
  timestamp: Date;
  type: 'user' | 'report' | 'system';
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    adminCount: 0,
    staffCount: 0,
    headDeptCount: 0,
    lecturerCount: 0,
    studentCount: 0,
    recentReportsCount: 0
  });
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getAll();
      const users: User[] = response.data.data?.items || [];

      // Calculate statistics
      setStats({
        totalUsers: users.length,
        activeUsers: users.filter(u => u.isActive).length,
        inactiveUsers: users.filter(u => !u.isActive).length,
        adminCount: users.filter(u => u.role === 'Admin').length,
        staffCount: users.filter(u => u.role === 'Staff').length,
        headDeptCount: users.filter(u => u.role === 'HeadDepartment').length,
        lecturerCount: users.filter(u => u.role === 'Lecturer').length,
        studentCount: users.filter(u => u.role === 'Student').length,
        recentReportsCount: 0 // TODO: Implement reports API
      });

      // Get 5 most recent users
      const sorted = [...users].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setRecentUsers(sorted.slice(0, 5));

    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'User Management',
      description: 'View and manage all user accounts',
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      path: '/admin/users',
      color: '#3b82f6'
    },
    {
      title: 'System Reports',
      description: 'Review user-submitted reports',
      icon: <AssignmentIcon sx={{ fontSize: 40 }} />,
      path: '/admin/reports',
      color: '#f59e0b'
    },
    {
      title: 'All Classes',
      description: 'Manage all classes in the system',
      icon: <SchoolIcon sx={{ fontSize: 40 }} />,
      path: '/admin/classes',
      color: '#10b981'
    },
    {
      title: 'All Teams',
      description: 'Monitor all project teams',
      icon: <GroupIcon sx={{ fontSize: 40 }} />,
      path: '/admin/teams',
      color: '#8b5cf6'
    }
  ];

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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        Admin Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        System overview and management
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Key Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={<PeopleIcon />}
            color="#3b82f6"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Users"
            value={stats.activeUsers}
            icon={<CheckCircleIcon />}
            color="#10b981"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Inactive Users"
            value={stats.inactiveUsers}
            icon={<BlockIcon />}
            color="#ef4444"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Reports"
            value={stats.recentReportsCount}
            icon={<AssignmentIcon />}
            color="#f59e0b"
          />
        </Grid>
      </Grid>

      {/* Users by Role */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
          Users by Role
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={4} md={2.4}>
            <Box textAlign="center" sx={{ p: 2, borderRadius: 2, bgcolor: 'error.50' }}>
              <AdminIcon sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
              <Typography variant="h4" color="error.main">{stats.adminCount}</Typography>
              <Typography variant="body2" color="text.secondary">Admins</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={4} md={2.4}>
            <Box textAlign="center" sx={{ p: 2, borderRadius: 2, bgcolor: 'warning.50' }}>
              <WorkIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" color="warning.main">{stats.staffCount}</Typography>
              <Typography variant="body2" color="text.secondary">Staff</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={4} md={2.4}>
            <Box textAlign="center" sx={{ p: 2, borderRadius: 2, bgcolor: 'secondary.50' }}>
              <PersonIcon sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
              <Typography variant="h4" color="secondary.main">{stats.headDeptCount}</Typography>
              <Typography variant="body2" color="text.secondary">Head Dept</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={4} md={2.4}>
            <Box textAlign="center" sx={{ p: 2, borderRadius: 2, bgcolor: 'primary.50' }}>
              <SchoolIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" color="primary.main">{stats.lecturerCount}</Typography>
              <Typography variant="body2" color="text.secondary">Lecturers</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={4} md={2.4}>
            <Box textAlign="center" sx={{ p: 2, borderRadius: 2, bgcolor: 'success.50' }}>
              <GroupIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" color="success.main">{stats.studentCount}</Typography>
              <Typography variant="body2" color="text.secondary">Students</Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Quick Actions */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Quick Actions
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {quickActions.map((action) => (
          <Grid item xs={12} sm={6} md={3} key={action.path}>
            <Card>
              <CardActionArea onClick={() => navigate(action.path)}>
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <Box sx={{ color: action.color, mb: 2 }}>
                    {action.icon}
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    {action.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {action.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Recent Users */}
      <Paper sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Recently Added Users
          </Typography>
          <Tooltip title="View All Users">
            <IconButton size="small" onClick={() => navigate('/admin/users')}>
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created At</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No recent users
                  </TableCell>
                </TableRow>
              ) : (
                recentUsers.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>{user.fullName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.role}
                        color={getRoleColor(user.role) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.isActive ? 'Active' : 'Inactive'}
                        color={user.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default AdminDashboard;
