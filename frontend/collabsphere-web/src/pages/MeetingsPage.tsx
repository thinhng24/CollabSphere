import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Tooltip,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VideocamIcon from '@mui/icons-material/Videocam';
import ScheduleIcon from '@mui/icons-material/Schedule';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import CancelIcon from '@mui/icons-material/Cancel';
import GroupIcon from '@mui/icons-material/Group';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Meeting, Team, Class } from '../types';
import { meetingsAPI, teamsAPI, classesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const MeetingsPage: React.FC = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [tab, setTab] = useState(0);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    teamId: '',
    classId: '',
    startTime: '',
    duration: 60
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [meetingsRes, teamsRes, classesRes] = await Promise.all([
        meetingsAPI.getAll(),
        teamsAPI.getAll(),
        classesAPI.getAll()
      ]);
      setMeetings(meetingsRes.data.data?.items || []);
      setTeams(teamsRes.data.data?.items || []);
      setClasses(classesRes.data.data?.items || []);
    } catch {
      setError('Failed to load meetings');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!user) return;
    try {
      const team = teams.find(t => t.id === formData.teamId);
      const cls = classes.find(c => c.id === formData.classId);
      await meetingsAPI.create({
        ...formData,
        hostId: user.id,
        teamName: team?.name,
        className: cls?.name
      });
      setSuccess('Meeting scheduled successfully!');
      setCreateDialogOpen(false);
      resetForm();
      loadData();
    } catch {
      setError('Failed to schedule meeting');
    }
  };

  const handleStart = async (meetingId: string) => {
    try {
      await meetingsAPI.start(meetingId);
      setSuccess('Meeting started!');
      loadData();
    } catch {
      setError('Failed to start meeting');
    }
  };

  const handleEnd = async (meetingId: string) => {
    try {
      await meetingsAPI.end(meetingId);
      setSuccess('Meeting ended');
      loadData();
    } catch {
      setError('Failed to end meeting');
    }
  };

  const handleCancel = async (meetingId: string) => {
    if (!window.confirm('Are you sure you want to cancel this meeting?')) return;
    try {
      await meetingsAPI.cancel(meetingId);
      setSuccess('Meeting cancelled');
      loadData();
    } catch {
      setError('Failed to cancel meeting');
    }
  };

  const copyMeetingLink = (meeting: Meeting) => {
    navigator.clipboard.writeText(meeting.meetingUrl || '');
    setSuccess('Meeting link copied to clipboard!');
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      teamId: '',
      classId: '',
      startTime: '',
      duration: 60
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled': return 'info';
      case 'InProgress': return 'success';
      case 'Completed': return 'default';
      case 'Cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Scheduled': return <ScheduleIcon />;
      case 'InProgress': return <VideocamIcon />;
      case 'Completed': return <StopIcon />;
      case 'Cancelled': return <CancelIcon />;
      default: return <ScheduleIcon />;
    }
  };

  const upcomingMeetings = meetings.filter(m => m.status === 'Scheduled');
  const inProgressMeetings = meetings.filter(m => m.status === 'InProgress');
  const pastMeetings = meetings.filter(m => ['Completed', 'Cancelled'].includes(m.status));

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <Box sx={{ p: 3 }}><Typography>Loading meetings...</Typography></Box>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Meetings
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Schedule Meeting
        </Button>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <VideocamIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4">{inProgressMeetings.length}</Typography>
              <Typography variant="body2" color="text.secondary">In Progress</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <ScheduleIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h4">{upcomingMeetings.length}</Typography>
              <Typography variant="body2" color="text.secondary">Upcoming</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <StopIcon sx={{ fontSize: 40, color: 'grey.500', mb: 1 }} />
              <Typography variant="h4">{pastMeetings.filter(m => m.status === 'Completed').length}</Typography>
              <Typography variant="body2" color="text.secondary">Completed</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AccessTimeIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4">{meetings.length}</Typography>
              <Typography variant="body2" color="text.secondary">Total</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Active Meetings */}
      {inProgressMeetings.length > 0 && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'success.light' }}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <VideocamIcon color="success" /> Active Meetings
          </Typography>
          <Grid container spacing={2}>
            {inProgressMeetings.map((meeting) => (
              <Grid item xs={12} md={6} key={meeting.id}>
                <Card sx={{ bgcolor: 'white' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6">{meeting.title}</Typography>
                      <Chip label="Live" color="success" icon={<VideocamIcon />} />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {meeting.teamName || meeting.className}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<VideocamIcon />}
                      onClick={() => window.open(meeting.meetingUrl || '#', '_blank')}
                    >
                      Join Now
                    </Button>
                    {meeting.hostId === user?.id && (
                      <Button
                        color="error"
                        startIcon={<StopIcon />}
                        onClick={() => handleEnd(meeting.id)}
                      >
                        End
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label={`Upcoming (${upcomingMeetings.length})`} />
          <Tab label={`Past (${pastMeetings.length})`} />
        </Tabs>
      </Paper>

      {/* Meetings List */}
      {tab === 0 && (
        upcomingMeetings.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <ScheduleIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">No upcoming meetings</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
              sx={{ mt: 2 }}
            >
              Schedule a Meeting
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={2}>
            {upcomingMeetings.map((meeting) => (
              <Grid item xs={12} md={6} key={meeting.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {meeting.title}
                        </Typography>
                        <Chip
                          icon={<GroupIcon />}
                          label={meeting.teamName || meeting.className}
                          size="small"
                          variant="outlined"
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                      <Chip
                        icon={getStatusIcon(meeting.status)}
                        label={meeting.status}
                        color={getStatusColor(meeting.status) as any}
                        size="small"
                      />
                    </Box>

                    {meeting.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {meeting.description}
                      </Typography>
                    )}

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <CalendarTodayIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {formatDateTime(meeting.startTime)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AccessTimeIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {meeting.duration} minutes
                          </Typography>
                        </Box>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Host</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                            {meeting.hostName.charAt(0)}
                          </Avatar>
                          <Typography variant="body2">{meeting.hostName}</Typography>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>

                  <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                    <Box>
                      <Tooltip title="Copy meeting link">
                        <IconButton size="small" onClick={() => copyMeetingLink(meeting)}>
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {meeting.hostId === user?.id && (
                        <>
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            startIcon={<PlayArrowIcon />}
                            onClick={() => handleStart(meeting.id)}
                          >
                            Start
                          </Button>
                          <Button
                            color="error"
                            size="small"
                            onClick={() => handleCancel(meeting.id)}
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                    </Box>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )
      )}

      {tab === 1 && (
        pastMeetings.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">No past meetings</Typography>
          </Paper>
        ) : (
          <Paper>
            <List>
              {pastMeetings.map((meeting, index) => (
                <React.Fragment key={meeting.id}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: meeting.status === 'Completed' ? 'grey.400' : 'error.main' }}>
                        {getStatusIcon(meeting.status)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={meeting.title}
                      secondary={
                        <Box>
                          <Typography variant="body2" component="span">
                            {meeting.teamName || meeting.className}
                          </Typography>
                          <Typography variant="body2" component="span" sx={{ mx: 1 }}>•</Typography>
                          <Typography variant="body2" component="span">
                            {formatDateTime(meeting.startTime)}
                          </Typography>
                        </Box>
                      }
                    />
                    <Chip
                      label={meeting.status}
                      color={getStatusColor(meeting.status) as any}
                      size="small"
                    />
                  </ListItem>
                  {index < pastMeetings.length - 1 && <Divider component="li" />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        )
      )}

      {/* Create Meeting Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Schedule New Meeting</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Meeting Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Weekly Standup"
            />
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={2}
            />
            <FormControl fullWidth>
              <InputLabel>Team (optional)</InputLabel>
              <Select
                value={formData.teamId}
                label="Team (optional)"
                onChange={(e) => setFormData({ ...formData, teamId: e.target.value, classId: '' })}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {teams.map(team => (
                  <MenuItem key={team.id} value={team.id}>{team.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Class (optional)</InputLabel>
              <Select
                value={formData.classId}
                label="Class (optional)"
                onChange={(e) => setFormData({ ...formData, classId: e.target.value, teamId: '' })}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {classes.map(cls => (
                  <MenuItem key={cls.id} value={cls.id}>{cls.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Start Time"
              type="datetime-local"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <FormControl fullWidth>
              <InputLabel>Duration</InputLabel>
              <Select
                value={formData.duration}
                label="Duration"
                onChange={(e) => setFormData({ ...formData, duration: e.target.value as number })}
              >
                <MenuItem value={30}>30 minutes</MenuItem>
                <MenuItem value={60}>1 hour</MenuItem>
                <MenuItem value={90}>1.5 hours</MenuItem>
                <MenuItem value={120}>2 hours</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={!formData.title || !formData.startTime}
          >
            Schedule
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MeetingsPage;
