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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  UploadFile as UploadFileIcon,
  MenuBook as MenuBookIcon,
  School as SchoolIcon,
  Group as GroupIcon,
  PersonAdd as PersonAddIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import StatCard from '../components/StatCard';

interface DashboardStats {
  totalSubjects: number;
  totalSyllabi: number;
  totalClasses: number;
  totalLecturers: number;
  totalStudents: number;
  recentImports: number;
}

interface RecentActivity {
  id: string;
  action: string;
  timestamp: Date;
  type: 'import' | 'create' | 'update' | 'assign';
}

const StaffDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalSubjects: 0,
    totalSyllabi: 0,
    totalClasses: 0,
    totalLecturers: 0,
    totalStudents: 0,
    recentImports: 0
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // TODO: Implement API calls to fetch real data
      // Mock data for now
      setStats({
        totalSubjects: 45,
        totalSyllabi: 38,
        totalClasses: 62,
        totalLecturers: 28,
        totalStudents: 450,
        recentImports: 5
      });

      const mockActivities: RecentActivity[] = [
        {
          id: '1',
          action: 'Imported 25 student accounts from CSV file',
          timestamp: new Date('2024-01-15T10:30:00'),
          type: 'import'
        },
        {
          id: '2',
          action: 'Created new syllabus "Advanced Web Development"',
          timestamp: new Date('2024-01-15T09:15:00'),
          type: 'create'
        },
        {
          id: '3',
          action: 'Assigned 3 lecturers to SE101 class',
          timestamp: new Date('2024-01-14T16:20:00'),
          type: 'assign'
        },
        {
          id: '4',
          action: 'Updated class information for CS202',
          timestamp: new Date('2024-01-14T14:45:00'),
          type: 'update'
        },
        {
          id: '5',
          action: 'Imported 5 new subjects from Excel file',
          timestamp: new Date('2024-01-14T11:00:00'),
          type: 'import'
        }
      ];
      setRecentActivities(mockActivities);

    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Import Data',
      description: 'Upload CSV/Excel files for bulk operations',
      icon: <UploadFileIcon sx={{ fontSize: 40 }} />,
      path: '/import',
      color: '#3b82f6'
    },
    {
      title: 'Manage Subjects',
      description: 'View and edit subjects',
      icon: <MenuBookIcon sx={{ fontSize: 40 }} />,
      path: '/subjects',
      color: '#8b5cf6'
    },
    {
      title: 'Manage Classes',
      description: 'View and manage all classes',
      icon: <SchoolIcon sx={{ fontSize: 40 }} />,
      path: '/classes',
      color: '#10b981'
    },
    {
      title: 'Assign Users',
      description: 'Assign lecturers and students to classes',
      icon: <AssignmentIcon sx={{ fontSize: 40 }} />,
      path: '/staff/assign',
      color: '#f59e0b'
    },
    {
      title: 'Manage Accounts',
      description: 'View lecturer and student accounts',
      icon: <PersonAddIcon sx={{ fontSize: 40 }} />,
      path: '/admin/users',
      color: '#ec4899'
    },
    {
      title: 'View Reports',
      description: 'System statistics and reports',
      icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
      path: '/staff/reports',
      color: '#06b6d4'
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'import':
        return <UploadFileIcon color="primary" />;
      case 'create':
        return <CheckCircleIcon color="success" />;
      case 'update':
        return <TrendingUpIcon color="info" />;
      case 'assign':
        return <AssignmentIcon color="secondary" />;
      default:
        return <CheckCircleIcon />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - new Date(date).getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else {
      return `${diffInDays} days ago`;
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
        Staff Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Manage academic structures and user accounts
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Key Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Subjects"
            value={stats.totalSubjects}
            icon={<MenuBookIcon />}
            color="#8b5cf6"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Syllabi"
            value={stats.totalSyllabi}
            icon={<MenuBookIcon />}
            color="#3b82f6"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Classes"
            value={stats.totalClasses}
            icon={<SchoolIcon />}
            color="#10b981"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Lecturers"
            value={stats.totalLecturers}
            icon={<GroupIcon />}
            color="#f59e0b"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Students"
            value={stats.totalStudents}
            icon={<GroupIcon />}
            color="#06b6d4"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Recent Imports"
            value={stats.recentImports}
            icon={<UploadFileIcon />}
            color="#ec4899"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid item xs={12} lg={8}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Quick Actions
          </Typography>
          <Grid container spacing={2}>
            {quickActions.map((action) => (
              <Grid item xs={12} sm={6} md={4} key={action.path}>
                <Card sx={{ height: '100%' }}>
                  <CardActionArea onClick={() => navigate(action.path)} sx={{ height: '100%' }}>
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                      <Box sx={{ color: action.color, mb: 2 }}>
                        {action.icon}
                      </Box>
                      <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem' }}>
                        {action.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                        {action.description}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>

        {/* Recent Activities */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Recent Activities
            </Typography>
            <List disablePadding>
              {recentActivities.length === 0 ? (
                <ListItem>
                  <ListItemText
                    primary="No recent activities"
                    primaryTypographyProps={{ color: 'text.secondary', align: 'center' }}
                  />
                </ListItem>
              ) : (
                recentActivities.map((activity, index) => (
                  <React.Fragment key={activity.id}>
                    <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        {getActivityIcon(activity.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={activity.action}
                        secondary={formatTime(activity.timestamp)}
                        primaryTypographyProps={{ variant: 'body2' }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                    {index < recentActivities.length - 1 && <Divider />}
                  </React.Fragment>
                ))
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StaffDashboard;
