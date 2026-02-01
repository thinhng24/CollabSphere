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
  AvatarGroup,
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
  LinearProgress,
  Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ScheduleIcon from '@mui/icons-material/Schedule';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import GradingIcon from '@mui/icons-material/Grading';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useParams, useNavigate } from 'react-router-dom';
import { Checkpoint, Team, TeamMember } from '../types';
import { checkpointsAPI, teamsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CheckpointsPage: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { isLecturer, isStudent } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<Checkpoint | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    dueDate: '',
    assignedMembers: [] as string[]
  });
  const [submitContent, setSubmitContent] = useState('');
  const [feedback, setFeedback] = useState('');
  const [grade, setGrade] = useState<number>(0);

  useEffect(() => {
    if (teamId) {
      loadData();
    }
  }, [teamId]);

  const loadData = async () => {
    try {
      const [teamRes, membersRes, checkpointsRes] = await Promise.all([
        teamsAPI.getById(teamId),
        teamsAPI.getMembers(teamId),
        checkpointsAPI.getByTeam(teamId)
      ]);
      setTeam(teamRes.data.data);
      setMembers(membersRes.data.data?.items || []);
      setCheckpoints(checkpointsRes.data.data?.items || []);
    } catch {
      setError('Failed to load checkpoints');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!teamId) return;
    try {
      await checkpointsAPI.create({
        teamId,
        ...formData
      });
      setSuccess('Checkpoint created successfully!');
      setCreateDialogOpen(false);
      resetForm();
      loadData();
    } catch {
      setError('Failed to create checkpoint');
    }
  };

  const handleSubmit = async () => {
    if (!selectedCheckpoint) return;
    try {
      await checkpointsAPI.submit(selectedCheckpoint.id, submitContent);
      setSuccess('Checkpoint submitted successfully!');
      setSubmitDialogOpen(false);
      setSubmitContent('');
      loadData();
    } catch {
      setError('Failed to submit checkpoint');
    }
  };

  const handleGrade = async (approved: boolean) => {
    if (!selectedCheckpoint) return;
    try {
      if (approved) {
        await checkpointsAPI.approve(selectedCheckpoint.id, feedback, grade);
        setSuccess('Checkpoint approved!');
      } else {
        await checkpointsAPI.reject(selectedCheckpoint.id, feedback);
        setSuccess('Checkpoint rejected with feedback');
      }
      setGradeDialogOpen(false);
      setFeedback('');
      setGrade(0);
      loadData();
    } catch {
      setError('Failed to grade checkpoint');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      dueDate: '',
      assignedMembers: []
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'warning';
      case 'Submitted': return 'info';
      case 'Approved': return 'success';
      case 'Rejected': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending': return <ScheduleIcon />;
      case 'Submitted': return <AssignmentTurnedInIcon />;
      case 'Approved': return <CheckCircleIcon />;
      case 'Rejected': return <GradingIcon />;
      default: return null;
    }
  };

  const stats = {
    total: checkpoints.length,
    pending: checkpoints.filter(c => c.status === 'Pending').length,
    submitted: checkpoints.filter(c => c.status === 'Submitted').length,
    approved: checkpoints.filter(c => c.status === 'Approved').length,
    rejected: checkpoints.filter(c => c.status === 'Rejected').length
  };

  const progress = stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0;

  if (loading) {
    return <Box sx={{ p: 3 }}><Typography>Loading checkpoints...</Typography></Box>;
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/teams')}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              {team?.name} - Checkpoints
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {team?.projectName || 'No project assigned'}
            </Typography>
          </Box>
        </Box>
        {(isLecturer() || isStudent()) && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Add Checkpoint
          </Button>
        )}
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle2">Overall Progress</Typography>
              <Typography variant="subtitle2" fontWeight={600}>{progress}%</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ height: 10, borderRadius: 5, mb: 2 }}
              color={progress === 100 ? 'success' : 'primary'}
            />
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip label={stats.pending} size="small" color="warning" />
                <Typography variant="body2">Pending</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip label={stats.submitted} size="small" color="info" />
                <Typography variant="body2">Submitted</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip label={stats.approved} size="small" color="success" />
                <Typography variant="body2">Approved</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip label={stats.rejected} size="small" color="error" />
                <Typography variant="body2">Rejected</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <Typography variant="h3" color="primary.main" fontWeight={600}>
              {stats.approved}/{stats.total}
            </Typography>
            <Typography variant="body2" color="text.secondary">Checkpoints Completed</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Checkpoints List */}
      {checkpoints.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <AssignmentTurnedInIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">No checkpoints yet</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
            sx={{ mt: 2 }}
          >
            Create First Checkpoint
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {checkpoints.map((checkpoint) => (
            <Grid item xs={12} md={6} key={checkpoint.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getStatusIcon(checkpoint.status)}
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {checkpoint.name}
                      </Typography>
                    </Box>
                    <Chip
                      label={checkpoint.status}
                      color={getStatusColor(checkpoint.status) as any}
                      size="small"
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {checkpoint.description}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Due Date</Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {new Date(checkpoint.dueDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Assigned</Typography>
                      <AvatarGroup max={3} sx={{ justifyContent: 'flex-end' }}>
                        {checkpoint.assignedMembers.map((memberId) => {
                          const member = members.find(m => m.userId === memberId);
                          return (
                            <Tooltip key={memberId} title={member?.fullName || 'Unknown'}>
                              <Avatar sx={{ width: 28, height: 28, fontSize: '0.8rem' }}>
                                {member?.fullName?.charAt(0) || '?'}
                              </Avatar>
                            </Tooltip>
                          );
                        })}
                      </AvatarGroup>
                    </Box>
                  </Box>

                  {checkpoint.grade !== undefined && (
                    <Box sx={{ mt: 2, p: 1.5, bgcolor: 'grey.100', borderRadius: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle2">Grade</Typography>
                        <Typography variant="h6" color="primary.main">{checkpoint.grade}/100</Typography>
                      </Box>
                      {checkpoint.feedback && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {checkpoint.feedback}
                        </Typography>
                      )}
                    </Box>
                  )}

                  {checkpoint.submittedAt && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      Submitted: {new Date(checkpoint.submittedAt).toLocaleString()}
                    </Typography>
                  )}
                </CardContent>

                <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
                  {checkpoint.status === 'Pending' && isStudent() && (
                    <Button
                      variant="contained"
                      startIcon={<SendIcon />}
                      onClick={() => {
                        setSelectedCheckpoint(checkpoint);
                        setSubmitDialogOpen(true);
                      }}
                    >
                      Submit
                    </Button>
                  )}
                  {checkpoint.status === 'Submitted' && isLecturer() && (
                    <Button
                      variant="contained"
                      startIcon={<GradingIcon />}
                      onClick={() => {
                        setSelectedCheckpoint(checkpoint);
                        setGradeDialogOpen(true);
                      }}
                    >
                      Grade
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Checkpoint Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Checkpoint</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Checkpoint Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Sprint 1 Review"
            />
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
            />
            <TextField
              fullWidth
              label="Due Date"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <FormControl fullWidth>
              <InputLabel>Assign Members</InputLabel>
              <Select
                multiple
                value={formData.assignedMembers}
                label="Assign Members"
                onChange={(e) => setFormData({ ...formData, assignedMembers: e.target.value as string[] })}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((id) => {
                      const member = members.find(m => m.userId === id);
                      return <Chip key={id} label={member?.fullName} size="small" />;
                    })}
                  </Box>
                )}
              >
                {members.map((member) => (
                  <MenuItem key={member.userId} value={member.userId}>
                    {member.fullName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!formData.name || !formData.dueDate}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Submit Dialog */}
      <Dialog open={submitDialogOpen} onClose={() => setSubmitDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Submit Checkpoint: {selectedCheckpoint?.name}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Submission Content"
            value={submitContent}
            onChange={(e) => setSubmitContent(e.target.value)}
            multiline
            rows={5}
            placeholder="Describe your work, provide links, or upload files..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubmitDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={!submitContent}>
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Grade Dialog */}
      <Dialog open={gradeDialogOpen} onClose={() => setGradeDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Grade Checkpoint: {selectedCheckpoint?.name}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Box>
              <Typography variant="subtitle2" gutterBottom>Grade (0-100)</Typography>
              <TextField
                fullWidth
                type="number"
                value={grade}
                onChange={(e) => setGrade(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                inputProps={{ min: 0, max: 100 }}
              />
            </Box>
            <TextField
              fullWidth
              label="Feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              multiline
              rows={4}
              placeholder="Provide constructive feedback..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGradeDialogOpen(false)}>Cancel</Button>
          <Button color="error" onClick={() => handleGrade(false)}>
            Reject
          </Button>
          <Button variant="contained" color="success" onClick={() => handleGrade(true)}>
            Approve
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CheckpointsPage;
