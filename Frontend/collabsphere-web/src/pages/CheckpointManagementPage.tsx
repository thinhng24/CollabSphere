import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  AvatarGroup,
  Tooltip,
  Menu
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Flag as FlagIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import StatCard from '../components/StatCard';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Leader' | 'Member';
}

interface Checkpoint {
  id: string;
  name: string;
  description: string;
  dueDate: string;
  assignedMembers: string[];
  status: 'Pending' | 'Submitted' | 'Approved' | 'Rejected';
  submittedAt?: string;
  submissionContent?: string;
  feedback?: string;
  createdAt: string;
  priority: 'Low' | 'Medium' | 'High';
}

interface Team {
  id: string;
  name: string;
  projectName: string;
}

const CheckpointManagementPage: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCheckpoint, setEditingCheckpoint] = useState<Checkpoint | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [checkpointToDelete, setCheckpointToDelete] = useState<Checkpoint | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<Checkpoint | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    dueDate: '',
    assignedMembers: [] as string[],
    priority: 'Medium' as 'Low' | 'Medium' | 'High'
  });

  useEffect(() => {
    if (teamId) {
      loadData();
    }
  }, [teamId]);

  const loadData = async () => {
    try {
      // TODO: Implement API calls
      const mockTeam: Team = {
        id: teamId || 't1',
        name: 'Team Alpha',
        projectName: 'E-Commerce Platform'
      };

      const mockMembers: TeamMember[] = [
        { id: 'm1', name: 'Alice Johnson', email: 'alice@student.edu', role: 'Leader' },
        { id: 'm2', name: 'Bob Smith', email: 'bob@student.edu', role: 'Member' },
        { id: 'm3', name: 'Charlie Chen', email: 'charlie@student.edu', role: 'Member' }
      ];

      const mockCheckpoints: Checkpoint[] = [
        {
          id: 'c1',
          name: 'Complete Database Schema',
          description: 'Design and implement the database schema for the e-commerce platform',
          dueDate: '2024-02-10',
          assignedMembers: ['m2', 'm3'],
          status: 'Pending',
          createdAt: '2024-01-15',
          priority: 'High'
        },
        {
          id: 'c2',
          name: 'API Development',
          description: 'Develop REST API endpoints for user authentication and product management',
          dueDate: '2024-02-15',
          assignedMembers: ['m2'],
          status: 'Submitted',
          submittedAt: '2024-02-14',
          submissionContent: 'Completed all API endpoints with full documentation',
          createdAt: '2024-01-20',
          priority: 'High'
        },
        {
          id: 'c3',
          name: 'Frontend UI Components',
          description: 'Build reusable UI components for the application',
          dueDate: '2024-02-20',
          assignedMembers: ['m3'],
          status: 'Approved',
          submittedAt: '2024-02-18',
          submissionContent: 'Created component library with 15+ reusable components',
          feedback: 'Excellent work! Components are well-documented and follow best practices.',
          createdAt: '2024-01-25',
          priority: 'Medium'
        }
      ];

      setTeam(mockTeam);
      setMembers(mockMembers);
      setCheckpoints(mockCheckpoints);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    }
  };

  const handleOpenDialog = (checkpoint?: Checkpoint) => {
    if (checkpoint) {
      setEditingCheckpoint(checkpoint);
      setFormData({
        name: checkpoint.name,
        description: checkpoint.description,
        dueDate: checkpoint.dueDate,
        assignedMembers: checkpoint.assignedMembers,
        priority: checkpoint.priority
      });
    } else {
      setEditingCheckpoint(null);
      setFormData({
        name: '',
        description: '',
        dueDate: '',
        assignedMembers: [],
        priority: 'Medium'
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCheckpoint(null);
  };

  const handleSaveCheckpoint = async () => {
    if (!formData.name || !formData.dueDate || formData.assignedMembers.length === 0) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      // TODO: Implement API call
      if (editingCheckpoint) {
        // Update existing checkpoint
        setCheckpoints(prev =>
          prev.map(c =>
            c.id === editingCheckpoint.id
              ? { ...c, ...formData }
              : c
          )
        );
        setSuccess('Checkpoint updated successfully!');
      } else {
        // Create new checkpoint
        const newCheckpoint: Checkpoint = {
          id: `c${checkpoints.length + 1}`,
          ...formData,
          status: 'Pending',
          createdAt: new Date().toISOString().split('T')[0]
        };
        setCheckpoints([...checkpoints, newCheckpoint]);
        setSuccess('Checkpoint created successfully!');
      }

      handleCloseDialog();
    } catch (err) {
      setError('Failed to save checkpoint');
      console.error(err);
    }
  };

  const handleDeleteCheckpoint = async () => {
    if (!checkpointToDelete) return;

    try {
      // TODO: Implement API call
      setCheckpoints(prev => prev.filter(c => c.id !== checkpointToDelete.id));
      setSuccess('Checkpoint deleted successfully!');
      setDeleteDialogOpen(false);
      setCheckpointToDelete(null);
    } catch (err) {
      setError('Failed to delete checkpoint');
      console.error(err);
    }
  };

  const handleOpenDeleteDialog = (checkpoint: Checkpoint) => {
    setCheckpointToDelete(checkpoint);
    setDeleteDialogOpen(true);
    setMenuAnchor(null);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, checkpoint: Checkpoint) => {
    setMenuAnchor(event.currentTarget);
    setSelectedCheckpoint(checkpoint);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedCheckpoint(null);
  };

  const getStatusColor = (status: string): "warning" | "info" | "success" | "error" => {
    switch (status) {
      case 'Pending': return 'warning';
      case 'Submitted': return 'info';
      case 'Approved': return 'success';
      case 'Rejected': return 'error';
      default: return 'warning';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'High': return '#ef4444';
      case 'Medium': return '#f59e0b';
      case 'Low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getMemberName = (memberId: string): string => {
    return members.find(m => m.id === memberId)?.name || 'Unknown';
  };

  const getDaysUntilDue = (dueDate: string): string => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `${diffDays} days remaining`;
  };

  const stats = {
    total: checkpoints.length,
    pending: checkpoints.filter(c => c.status === 'Pending').length,
    submitted: checkpoints.filter(c => c.status === 'Submitted').length,
    approved: checkpoints.filter(c => c.status === 'Approved').length
  };

  const completionRate = stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0;

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate('/teams')}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              {team?.name} - Checkpoints
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {team?.projectName}
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Create Checkpoint
        </Button>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Checkpoints"
            value={stats.total}
            icon={<AssignmentIcon />}
            color="#3b82f6"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending"
            value={stats.pending}
            icon={<ScheduleIcon />}
            color="#f59e0b"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Submitted"
            value={stats.submitted}
            icon={<AssignmentIcon />}
            color="#3b82f6"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Approved"
            value={stats.approved}
            icon={<CheckCircleIcon />}
            color="#10b981"
          />
        </Grid>
      </Grid>

      {/* Completion Progress */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Overall Progress
          </Typography>
          <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
            {completionRate}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={completionRate}
          sx={{ height: 10, borderRadius: 5 }}
        />
      </Paper>

      {/* Checkpoints List */}
      <Grid container spacing={3}>
        {checkpoints.length === 0 ? (
          <Grid item xs={12}>
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <AssignmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No checkpoints yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Create your first checkpoint to track team progress
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Create Checkpoint
              </Button>
            </Paper>
          </Grid>
        ) : (
          checkpoints.map((checkpoint) => (
            <Grid item xs={12} md={6} key={checkpoint.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                    <Box flex={1}>
                      <Typography variant="h6" gutterBottom>
                        {checkpoint.name}
                      </Typography>
                      <Box display="flex" gap={1} mb={1}>
                        <Chip
                          label={checkpoint.status}
                          color={getStatusColor(checkpoint.status)}
                          size="small"
                        />
                        <Chip
                          icon={<FlagIcon />}
                          label={checkpoint.priority}
                          size="small"
                          sx={{ color: getPriorityColor(checkpoint.priority), borderColor: getPriorityColor(checkpoint.priority) }}
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, checkpoint)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {checkpoint.description}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <CalendarIcon fontSize="small" color="action" />
                    <Typography variant="caption" color="text.secondary">
                      Due: {new Date(checkpoint.dueDate).toLocaleDateString()}
                    </Typography>
                    <Chip
                      label={getDaysUntilDue(checkpoint.dueDate)}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Box>

                  <Box display="flex" alignItems="center" gap={1}>
                    <PersonIcon fontSize="small" color="action" />
                    <Typography variant="caption" color="text.secondary">
                      Assigned to:
                    </Typography>
                    <AvatarGroup max={3} sx={{ ml: 1 }}>
                      {checkpoint.assignedMembers.map((memberId) => (
                        <Tooltip key={memberId} title={getMemberName(memberId)}>
                          <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                            {getMemberName(memberId).charAt(0)}
                          </Avatar>
                        </Tooltip>
                      ))}
                    </AvatarGroup>
                  </Box>

                  {checkpoint.status === 'Submitted' && checkpoint.submissionContent && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        Submission:
                      </Typography>
                      <Typography variant="caption" display="block">
                        {checkpoint.submissionContent}
                      </Typography>
                    </Alert>
                  )}

                  {checkpoint.status === 'Approved' && checkpoint.feedback && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        Feedback:
                      </Typography>
                      <Typography variant="caption" display="block">
                        {checkpoint.feedback}
                      </Typography>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            if (selectedCheckpoint) handleOpenDialog(selectedCheckpoint);
            handleMenuClose();
          }}
        >
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedCheckpoint) handleOpenDeleteDialog(selectedCheckpoint);
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingCheckpoint ? 'Edit Checkpoint' : 'Create New Checkpoint'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Checkpoint Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
            />

            <TextField
              label="Description"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              fullWidth
            />

            <TextField
              label="Due Date"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <FormControl fullWidth required>
              <InputLabel>Priority</InputLabel>
              <Select
                value={formData.priority}
                label="Priority"
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
              >
                <MenuItem value="Low">Low</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="High">High</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>Assign To</InputLabel>
              <Select
                multiple
                value={formData.assignedMembers}
                label="Assign To"
                onChange={(e) => setFormData({ ...formData, assignedMembers: e.target.value as string[] })}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((value) => (
                      <Chip key={value} label={getMemberName(value)} size="small" />
                    ))}
                  </Box>
                )}
              >
                {members.filter(m => m.role === 'Member').map((member) => (
                  <MenuItem key={member.id} value={member.id}>
                    {member.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveCheckpoint}>
            {editingCheckpoint ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Checkpoint</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{checkpointToDelete?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDeleteCheckpoint}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CheckpointManagementPage;
