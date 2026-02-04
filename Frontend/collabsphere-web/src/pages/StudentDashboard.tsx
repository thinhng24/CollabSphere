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
  LinearProgress,
  Chip,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Avatar,
  Badge,
  Button,
  CardActions
} from '@mui/material';
import {
  Group as GroupIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Workspaces as WorkspacesIcon,
  EmojiEvents as TrophyIcon,
  Feedback as FeedbackIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';

interface StudentStats {
  totalTeams: number;
  activeMilestones: number;
  completedMilestones: number;
  pendingCheckpoints: number;
  overallProgress: number;
  recentFeedbackCount: number;
}

interface Milestone {
  id: string;
  title: string;
  projectName: string;
  teamName: string;
  dueDate: Date;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  progress: number;
}

interface TeamInfo {
  id: string;
  name: string;
  projectName: string;
  memberCount: number;
  isLeader: boolean;
  progress: number;
}

const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<StudentStats>({
    totalTeams: 0,
    activeMilestones: 0,
    completedMilestones: 0,
    pendingCheckpoints: 0,
    overallProgress: 0,
    recentFeedbackCount: 0
  });
  const [teams, setTeams] = useState<TeamInfo[]>([]);
  const [upcomingMilestones, setUpcomingMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Check if user is a team leader in any team
  const isTeamLeader = teams.some(team => team.isLeader);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // TODO: Implement API calls to fetch real data
      // Mock data for now
      const mockTeams: TeamInfo[] = [
        {
          id: '1',
          name: 'Team Alpha',
          projectName: 'E-Commerce Platform',
          memberCount: 5,
          isLeader: true,
          progress: 65
        },
        {
          id: '2',
          name: 'Team Beta',
          projectName: 'Mobile App Development',
          memberCount: 4,
          isLeader: false,
          progress: 45
        }
      ];

      const mockMilestones: Milestone[] = [
        {
          id: '1',
          title: 'Complete Database Design',
          projectName: 'E-Commerce Platform',
          teamName: 'Team Alpha',
          dueDate: new Date('2024-01-20'),
          status: 'in-progress',
          progress: 70
        },
        {
          id: '2',
          title: 'UI/UX Prototype',
          projectName: 'Mobile App Development',
          teamName: 'Team Beta',
          dueDate: new Date('2024-01-25'),
          status: 'pending',
          progress: 30
        },
        {
          id: '3',
          title: 'API Integration',
          projectName: 'E-Commerce Platform',
          teamName: 'Team Alpha',
          dueDate: new Date('2024-01-18'),
          status: 'overdue',
          progress: 50
        }
      ];

      setTeams(mockTeams);
      setUpcomingMilestones(mockMilestones);

      setStats({
        totalTeams: mockTeams.length,
        activeMilestones: mockMilestones.filter(m => m.status === 'in-progress').length,
        completedMilestones: 8,
        pendingCheckpoints: 3,
        overallProgress: 58,
        recentFeedbackCount: 2
      });

    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsDone = async (milestoneId: string) => {
    try {
      // TODO: Implement API call to mark milestone as complete
      // await milestonesAPI.markAsComplete(milestoneId);

      // Update local state
      setUpcomingMilestones(prev =>
        prev.map(m =>
          m.id === milestoneId
            ? { ...m, status: 'completed', progress: 100 }
            : m
        )
      );

      // Update stats
      setStats(prev => ({
        ...prev,
        activeMilestones: prev.activeMilestones - 1,
        completedMilestones: prev.completedMilestones + 1
      }));

      setSuccess('Milestone marked as complete!');
    } catch (err) {
      setError('Failed to mark milestone as complete');
      console.error(err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in-progress': return 'info';
      case 'pending': return 'warning';
      case 'overdue': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'in-progress': return 'In Progress';
      case 'pending': return 'Pending';
      case 'overdue': return 'Overdue';
      default: return status;
    }
  };

  const getDaysUntilDue = (dueDate: Date) => {
    const now = new Date();
    const diff = new Date(dueDate).getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return 'Overdue';
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    return `${days} days left`;
  };

  const quickActions = [
    {
      title: 'My Teams',
      description: `View ${stats.totalTeams} team${stats.totalTeams !== 1 ? 's' : ''}`,
      icon: <GroupIcon sx={{ fontSize: 36 }} />,
      path: '/teams',
      color: '#3b82f6',
      show: true
    },
    {
      title: 'Workspace',
      description: 'Collaborate on tasks',
      icon: <WorkspacesIcon sx={{ fontSize: 36 }} />,
      path: '/workspace',
      color: '#8b5cf6',
      show: true
    },
    {
      title: 'Checkpoints',
      description: `${stats.pendingCheckpoints} pending`,
      icon: <AssignmentIcon sx={{ fontSize: 36 }} />,
      path: '/checkpoints',
      color: '#f59e0b',
      show: true
    },
    {
      title: 'Feedback',
      description: `${stats.recentFeedbackCount} new items`,
      icon: <FeedbackIcon sx={{ fontSize: 36 }} />,
      path: '/student/feedback',
      color: '#10b981',
      show: true
    }
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header with Role Badge */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Student Dashboard
        </Typography>
        {isTeamLeader && (
          <Chip
            icon={<TrophyIcon />}
            label="Team Leader"
            color="warning"
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
        )}
      </Box>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Welcome back, {user?.fullName}!
      </Typography>

      {success && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Key Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="My Teams"
            value={stats.totalTeams}
            icon={<GroupIcon />}
            color="#3b82f6"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Milestones"
            value={stats.activeMilestones}
            icon={<TrendingUpIcon />}
            color="#f59e0b"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completed"
            value={stats.completedMilestones}
            icon={<CheckCircleIcon />}
            color="#10b981"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Overall Progress"
            value={`${stats.overallProgress}%`}
            icon={<TrendingUpIcon />}
            color="#8b5cf6"
          />
        </Grid>
      </Grid>

      {/* Overall Progress Bar */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Overall Progress
          </Typography>
          <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
            {stats.overallProgress}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={stats.overallProgress}
          sx={{ height: 10, borderRadius: 5 }}
        />
      </Paper>

      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Quick Actions
          </Typography>
          <Grid container spacing={2}>
            {quickActions.filter(a => a.show).map((action) => (
              <Grid item xs={6} key={action.path}>
                <Card>
                  <CardActionArea onClick={() => navigate(action.path)}>
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                      <Box sx={{ color: action.color, mb: 1 }}>
                        {action.icon}
                      </Box>
                      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                        {action.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {action.description}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>

        {/* My Teams */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              My Teams
            </Typography>
            <List disablePadding>
              {teams.length === 0 ? (
                <ListItem>
                  <ListItemText
                    primary="No teams yet"
                    primaryTypographyProps={{ color: 'text.secondary', align: 'center' }}
                  />
                </ListItem>
              ) : (
                teams.map((team, index) => (
                  <React.Fragment key={team.id}>
                    <ListItem
                      sx={{
                        px: 0,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                      onClick={() => navigate(`/workspace/${team.id}`)}
                    >
                      <ListItemIcon>
                        <Badge
                          badgeContent={team.isLeader ? 'L' : ''}
                          color="warning"
                          invisible={!team.isLeader}
                        >
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <GroupIcon />
                          </Avatar>
                        </Badge>
                      </ListItemIcon>
                      <ListItemText
                        primary={team.name}
                        secondary={
                          <>
                            <Typography variant="caption" display="block">
                              {team.projectName}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              <Typography variant="caption">
                                {team.memberCount} members
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={team.progress}
                                sx={{ flex: 1, height: 4, borderRadius: 2 }}
                              />
                              <Typography variant="caption" fontWeight={600}>
                                {team.progress}%
                              </Typography>
                            </Box>
                          </>
                        }
                      />
                    </ListItem>
                    {index < teams.length - 1 && <Divider />}
                  </React.Fragment>
                ))
              )}
            </List>
          </Paper>
        </Grid>

        {/* Upcoming Milestones */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Upcoming Milestones
            </Typography>
            {upcomingMilestones.length === 0 ? (
              <Typography color="text.secondary" align="center" py={4}>
                No upcoming milestones
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {upcomingMilestones.map((milestone) => (
                  <Grid item xs={12} md={4} key={milestone.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {milestone.title}
                          </Typography>
                          <Chip
                            label={getStatusLabel(milestone.status)}
                            color={getStatusColor(milestone.status) as any}
                            size="small"
                          />
                        </Box>

                        <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                          {milestone.projectName} • {milestone.teamName}
                        </Typography>

                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                          {milestone.status === 'overdue' ? (
                            <WarningIcon color="error" fontSize="small" />
                          ) : (
                            <ScheduleIcon color="action" fontSize="small" />
                          )}
                          <Typography variant="caption" color={milestone.status === 'overdue' ? 'error' : 'text.secondary'}>
                            {getDaysUntilDue(milestone.dueDate)}
                          </Typography>
                        </Box>

                        <Box>
                          <Box display="flex" justifyContent="space-between" mb={0.5}>
                            <Typography variant="caption">Progress</Typography>
                            <Typography variant="caption" fontWeight={600}>
                              {milestone.progress}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={milestone.progress}
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                        </Box>
                      </CardContent>
                      {(milestone.status === 'in-progress' || milestone.status === 'pending') && (
                        <CardActions>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<CheckCircleIcon />}
                            onClick={() => handleMarkAsDone(milestone.id)}
                            fullWidth
                          >
                            Mark as Done
                          </Button>
                        </CardActions>
                      )}
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StudentDashboard;
