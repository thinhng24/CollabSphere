import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Alert,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  Timeline as TimelineIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  AutoAwesome as AIIcon
} from '@mui/icons-material';
import StatCard from '../components/StatCard';

interface TeamProgress {
  id: string;
  name: string;
  project: string;
  class: string;
  progress: number;
  milestonesCompleted: number;
  totalMilestones: number;
  onTrack: boolean;
  lastUpdate: string;
  members: TeamMember[];
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Leader' | 'Member';
  contribution: number;
  tasksCompleted: number;
  totalTasks: number;
  lastActive: string;
}

interface MilestoneProgress {
  id: string;
  name: string;
  dueDate: string;
  status: 'Completed' | 'In Progress' | 'At Risk' | 'Overdue';
  completionRate: number;
  teamsCompleted: number;
  totalTeams: number;
}

interface AIInsight {
  type: 'success' | 'warning' | 'info';
  title: string;
  description: string;
  recommendation?: string;
}

const ProgressMonitoringPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedClass, setSelectedClass] = useState('all');
  const [teams, setTeams] = useState<TeamProgress[]>([]);
  const [milestones, setMilestones] = useState<MilestoneProgress[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProgressData();
  }, [selectedClass]);

  const loadProgressData = async () => {
    setLoading(true);
    try {
      // TODO: Implement API call
      const mockTeams: TeamProgress[] = [
        {
          id: 't1',
          name: 'Team Alpha',
          project: 'E-Commerce Platform',
          class: 'CS303-01',
          progress: 75,
          milestonesCompleted: 3,
          totalMilestones: 4,
          onTrack: true,
          lastUpdate: '2 hours ago',
          members: [
            {
              id: 'm1',
              name: 'Alice Johnson',
              email: 'alice@student.edu',
              role: 'Leader',
              contribution: 85,
              tasksCompleted: 17,
              totalTasks: 20,
              lastActive: '1 hour ago'
            },
            {
              id: 'm2',
              name: 'Bob Smith',
              email: 'bob@student.edu',
              role: 'Member',
              contribution: 72,
              tasksCompleted: 14,
              totalTasks: 20,
              lastActive: '3 hours ago'
            },
            {
              id: 'm3',
              name: 'Charlie Chen',
              email: 'charlie@student.edu',
              role: 'Member',
              contribution: 68,
              tasksCompleted: 13,
              totalTasks: 20,
              lastActive: '5 hours ago'
            }
          ]
        },
        {
          id: 't2',
          name: 'Team Beta',
          project: 'Mobile App Development',
          class: 'CS303-01',
          progress: 45,
          milestonesCompleted: 2,
          totalMilestones: 5,
          onTrack: false,
          lastUpdate: '1 day ago',
          members: [
            {
              id: 'm4',
              name: 'Diana Lee',
              email: 'diana@student.edu',
              role: 'Leader',
              contribution: 55,
              tasksCompleted: 11,
              totalTasks: 25,
              lastActive: '1 day ago'
            },
            {
              id: 'm5',
              name: 'Eve Taylor',
              email: 'eve@student.edu',
              role: 'Member',
              contribution: 48,
              tasksCompleted: 9,
              totalTasks: 25,
              lastActive: '2 days ago'
            }
          ]
        },
        {
          id: 't3',
          name: 'Team Gamma',
          project: 'AI Chatbot System',
          class: 'CS404-01',
          progress: 90,
          milestonesCompleted: 4,
          totalMilestones: 4,
          onTrack: true,
          lastUpdate: '30 minutes ago',
          members: [
            {
              id: 'm6',
              name: 'Frank Moore',
              email: 'frank@student.edu',
              role: 'Leader',
              contribution: 92,
              tasksCompleted: 18,
              totalTasks: 18,
              lastActive: '30 minutes ago'
            },
            {
              id: 'm7',
              name: 'Grace Wilson',
              email: 'grace@student.edu',
              role: 'Member',
              contribution: 88,
              tasksCompleted: 17,
              totalTasks: 18,
              lastActive: '1 hour ago'
            }
          ]
        }
      ];

      const mockMilestones: MilestoneProgress[] = [
        {
          id: 'ms1',
          name: 'Project Planning & Requirements',
          dueDate: '2024-01-15',
          status: 'Completed',
          completionRate: 100,
          teamsCompleted: 3,
          totalTeams: 3
        },
        {
          id: 'ms2',
          name: 'System Design & Architecture',
          dueDate: '2024-02-01',
          status: 'Completed',
          completionRate: 100,
          teamsCompleted: 3,
          totalTeams: 3
        },
        {
          id: 'ms3',
          name: 'Implementation Phase 1',
          dueDate: '2024-02-20',
          status: 'In Progress',
          completionRate: 67,
          teamsCompleted: 2,
          totalTeams: 3
        },
        {
          id: 'ms4',
          name: 'Testing & QA',
          dueDate: '2024-03-05',
          status: 'At Risk',
          completionRate: 33,
          teamsCompleted: 1,
          totalTeams: 3
        },
        {
          id: 'ms5',
          name: 'Final Deployment',
          dueDate: '2024-03-15',
          status: 'In Progress',
          completionRate: 0,
          teamsCompleted: 0,
          totalTeams: 3
        }
      ];

      const mockInsights: AIInsight[] = [
        {
          type: 'warning',
          title: 'Team Beta Falling Behind',
          description: 'Team Beta has made no progress in the last 24 hours and is currently at 45% completion.',
          recommendation: 'Consider scheduling a check-in meeting to identify blockers and provide support.'
        },
        {
          type: 'success',
          title: 'Team Gamma Exceeding Expectations',
          description: 'Team Gamma has completed all milestones ahead of schedule with 90% overall progress.',
          recommendation: 'Great work! Consider having them mentor struggling teams.'
        },
        {
          type: 'info',
          title: 'Milestone 4 At Risk',
          description: 'Only 33% of teams have started "Testing & QA" milestone with the deadline approaching.',
          recommendation: 'Send reminders and offer additional resources or extend the deadline if needed.'
        },
        {
          type: 'warning',
          title: 'Uneven Contribution in Team Alpha',
          description: 'Contribution variance in Team Alpha ranges from 68% to 85%. Some members may need support.',
          recommendation: 'Review individual task assignments and ensure workload is balanced.'
        }
      ];

      setTeams(mockTeams);
      setMilestones(mockMilestones);
      setInsights(mockInsights);
    } catch (err) {
      console.error('Failed to load progress data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadProgressData();
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    alert('Export progress report (CSV/PDF) - Feature coming soon!');
  };

  const getStatusColor = (status: string): "success" | "warning" | "error" | "info" => {
    switch (status) {
      case 'Completed': return 'success';
      case 'In Progress': return 'info';
      case 'At Risk': return 'warning';
      case 'Overdue': return 'error';
      default: return 'info';
    }
  };

  const getProgressColor = (progress: number): string => {
    if (progress >= 75) return '#10b981';
    if (progress >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const filteredTeams = selectedClass === 'all'
    ? teams
    : teams.filter(t => t.class === selectedClass);

  const stats = {
    totalTeams: filteredTeams.length,
    onTrack: filteredTeams.filter(t => t.onTrack).length,
    avgProgress: Math.round(filteredTeams.reduce((sum, t) => sum + t.progress, 0) / filteredTeams.length) || 0,
    milestonesComplete: milestones.filter(m => m.status === 'Completed').length
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Progress Monitoring Dashboard
        </Typography>
        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Class Filter</InputLabel>
            <Select
              value={selectedClass}
              label="Class Filter"
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <MenuItem value="all">All Classes</MenuItem>
              <MenuItem value="CS303-01">CS303-01</MenuItem>
              <MenuItem value="CS404-01">CS404-01</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Refresh Data">
            <IconButton onClick={handleRefresh} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
          >
            Export Report
          </Button>
        </Box>
      </Box>

      {/* Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Teams"
            value={stats.totalTeams}
            icon={<GroupIcon />}
            color="#3b82f6"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="On Track"
            value={stats.onTrack}
            icon={<CheckCircleIcon />}
            color="#10b981"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Avg Progress"
            value={`${stats.avgProgress}%`}
            icon={<TimelineIcon />}
            color="#8b5cf6"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Milestones Done"
            value={stats.milestonesComplete}
            icon={<AssignmentIcon />}
            color="#f59e0b"
          />
        </Grid>
      </Grid>

      {/* AI-Powered Insights */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <AIIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            AI-Powered Insights
          </Typography>
        </Box>
        <Grid container spacing={2}>
          {insights.map((insight, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Alert
                severity={insight.type}
                sx={{
                  '& .MuiAlert-message': { width: '100%' }
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {insight.title}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {insight.description}
                </Typography>
                {insight.recommendation && (
                  <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
                    💡 Recommendation: {insight.recommendation}
                  </Typography>
                )}
              </Alert>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label="Team Overview" />
          <Tab label="Milestone Progress" />
          <Tab label="Individual Contributions" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          {filteredTeams.map((team) => (
            <Grid item xs={12} key={team.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {team.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {team.project} • {team.class}
                      </Typography>
                    </Box>
                    <Box display="flex" gap={1} alignItems="center">
                      {team.onTrack ? (
                        <Chip
                          icon={<TrendingUpIcon />}
                          label="On Track"
                          color="success"
                          size="small"
                        />
                      ) : (
                        <Chip
                          icon={<TrendingDownIcon />}
                          label="Behind Schedule"
                          color="warning"
                          size="small"
                        />
                      )}
                      <Chip
                        label={`${team.members.length} members`}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box mb={3}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" color="text.secondary">
                        Overall Progress
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {team.progress}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={team.progress}
                      sx={{
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: 'rgba(0,0,0,0.1)',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: getProgressColor(team.progress),
                          borderRadius: 5
                        }
                      }}
                    />
                  </Box>

                  <Grid container spacing={2} mb={2}>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">
                        Milestones
                      </Typography>
                      <Typography variant="h6">
                        {team.milestonesCompleted}/{team.totalMilestones}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">
                        Last Update
                      </Typography>
                      <Typography variant="body2">
                        {team.lastUpdate}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">
                        Team Members
                      </Typography>
                      <Typography variant="body2">
                        {team.members.length} members
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">
                        Avg Contribution
                      </Typography>
                      <Typography variant="body2">
                        {Math.round(team.members.reduce((sum, m) => sum + m.contribution, 0) / team.members.length)}%
                      </Typography>
                    </Grid>
                  </Grid>

                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                    Team Members
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {team.members.map((member) => (
                      <Tooltip
                        key={member.id}
                        title={`${member.name} (${member.role}) - ${member.contribution}% contribution`}
                      >
                        <Chip
                          avatar={<Avatar>{member.name.charAt(0)}</Avatar>}
                          label={`${member.name} ${member.role === 'Leader' ? '⭐' : ''}`}
                          size="small"
                          variant={member.role === 'Leader' ? 'filled' : 'outlined'}
                          color={member.role === 'Leader' ? 'primary' : 'default'}
                        />
                      </Tooltip>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {tabValue === 1 && (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Milestone</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Completion Rate</TableCell>
                  <TableCell>Teams Progress</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {milestones.map((milestone) => (
                  <TableRow key={milestone.id}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {milestone.name}
                      </Typography>
                    </TableCell>
                    <TableCell>{milestone.dueDate}</TableCell>
                    <TableCell>
                      <Chip
                        label={milestone.status}
                        color={getStatusColor(milestone.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <LinearProgress
                          variant="determinate"
                          value={milestone.completionRate}
                          sx={{
                            flex: 1,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: 'rgba(0,0,0,0.1)',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: getProgressColor(milestone.completionRate),
                              borderRadius: 4
                            }
                          }}
                        />
                        <Typography variant="caption" sx={{ minWidth: 40 }}>
                          {milestone.completionRate}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {milestone.teamsCompleted} / {milestone.totalTeams} teams
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {tabValue === 2 && (
        <Grid container spacing={3}>
          {filteredTeams.map((team) => (
            <Grid item xs={12} md={6} key={team.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {team.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {team.project}
                  </Typography>
                  <List>
                    {team.members.map((member) => (
                      <ListItem key={member.id} sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: member.role === 'Leader' ? 'primary.main' : 'grey.500' }}>
                            {member.name.charAt(0)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {member.name}
                              </Typography>
                              {member.role === 'Leader' && (
                                <Chip label="Leader" size="small" color="primary" />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                Tasks: {member.tasksCompleted}/{member.totalTasks} • Last active: {member.lastActive}
                              </Typography>
                              <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                                <LinearProgress
                                  variant="determinate"
                                  value={member.contribution}
                                  sx={{
                                    flex: 1,
                                    height: 6,
                                    borderRadius: 3,
                                    backgroundColor: 'rgba(0,0,0,0.1)',
                                    '& .MuiLinearProgress-bar': {
                                      backgroundColor: getProgressColor(member.contribution),
                                      borderRadius: 3
                                    }
                                  }}
                                />
                                <Typography variant="caption" sx={{ fontWeight: 600, minWidth: 40 }}>
                                  {member.contribution}%
                                </Typography>
                              </Box>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default ProgressMonitoringPage;
