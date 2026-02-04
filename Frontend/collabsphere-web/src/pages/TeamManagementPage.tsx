import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  Avatar,
  AvatarGroup,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Checkbox,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  TrendingUp as ProgressIcon,
  Star as StarIcon
} from '@mui/icons-material';
import StatCard from '../components/StatCard';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Leader' | 'Member';
  contribution: number;
}

interface Team {
  id: string;
  name: string;
  projectName: string;
  projectId: string;
  classId: string;
  className: string;
  members: TeamMember[];
  progress: number;
  createdAt: Date;
}

interface Student {
  id: string;
  name: string;
  email: string;
  studentId: string;
}

const TeamManagementPage: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [teamLeaderId, setTeamLeaderId] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '',
    projectId: '',
    classId: ''
  });

  useEffect(() => {
    loadTeams();
    loadStudents();
  }, []);

  const loadTeams = async () => {
    try {
      // TODO: Implement API call
      const mockTeams: Team[] = [
        {
          id: '1',
          name: 'Team Alpha',
          projectName: 'E-Commerce Platform',
          projectId: 'proj-1',
          classId: 'class-1',
          className: 'CS101-01',
          members: [
            { id: '1', name: 'Alice Johnson', email: 'alice@example.com', role: 'Leader', contribution: 95 },
            { id: '2', name: 'Bob Smith', email: 'bob@example.com', role: 'Member', contribution: 85 },
            { id: '3', name: 'Charlie Brown', email: 'charlie@example.com', role: 'Member', contribution: 90 },
            { id: '4', name: 'Diana Prince', email: 'diana@example.com', role: 'Member', contribution: 88 }
          ],
          progress: 65,
          createdAt: new Date('2024-01-10')
        },
        {
          id: '2',
          name: 'Team Beta',
          projectName: 'Mobile App Development',
          projectId: 'proj-2',
          classId: 'class-1',
          className: 'CS101-01',
          members: [
            { id: '5', name: 'Eve Wilson', email: 'eve@example.com', role: 'Leader', contribution: 92 },
            { id: '6', name: 'Frank Miller', email: 'frank@example.com', role: 'Member', contribution: 78 },
            { id: '7', name: 'Grace Lee', email: 'grace@example.com', role: 'Member', contribution: 85 }
          ],
          progress: 45,
          createdAt: new Date('2024-01-12')
        }
      ];
      setTeams(mockTeams);
    } catch (err) {
      setError('Failed to load teams');
      console.error(err);
    }
  };

  const loadStudents = async () => {
    try {
      // TODO: Implement API call
      const mockStudents: Student[] = [
        { id: '8', name: 'Henry Ford', email: 'henry@example.com', studentId: 'ST008' },
        { id: '9', name: 'Iris Chen', email: 'iris@example.com', studentId: 'ST009' },
        { id: '10', name: 'Jack Ryan', email: 'jack@example.com', studentId: 'ST010' }
      ];
      setStudents(mockStudents);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenDialog = (team?: Team) => {
    if (team) {
      setIsEditing(true);
      setSelectedTeam(team);
      setFormData({
        name: team.name,
        projectId: team.projectId,
        classId: team.classId
      });
    } else {
      setIsEditing(false);
      setSelectedTeam(null);
      setFormData({
        name: '',
        projectId: '',
        classId: ''
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedTeam(null);
  };

  const handleSave = async () => {
    try {
      if (isEditing && selectedTeam) {
        const updated = teams.map(t =>
          t.id === selectedTeam.id
            ? { ...t, name: formData.name, projectId: formData.projectId, classId: formData.classId }
            : t
        );
        setTeams(updated);
        setSuccess('Team updated successfully');
      } else {
        const newTeam: Team = {
          id: Date.now().toString(),
          name: formData.name,
          projectName: 'New Project',
          projectId: formData.projectId,
          classId: formData.classId,
          className: 'CS101-01',
          members: [],
          progress: 0,
          createdAt: new Date()
        };
        setTeams([...teams, newTeam]);
        setSuccess('Team created successfully');
      }
      handleCloseDialog();
    } catch (err) {
      setError('Failed to save team');
      console.error(err);
    }
  };

  const handleDelete = async () => {
    try {
      setTeams(teams.filter(t => t.id !== selectedTeam?.id));
      setSuccess('Team deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedTeam(null);
    } catch (err) {
      setError('Failed to delete team');
      console.error(err);
    }
  };

  const handleOpenMemberDialog = (team: Team) => {
    setSelectedTeam(team);
    setSelectedMembers(team.members.map(m => m.id));
    setTeamLeaderId(team.members.find(m => m.role === 'Leader')?.id || '');
    setMemberDialogOpen(true);
  };

  const handleToggleMember = (studentId: string) => {
    setSelectedMembers(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSaveMembers = async () => {
    if (!selectedTeam) return;

    if (!teamLeaderId) {
      setError('Please select a team leader');
      return;
    }

    try {
      const updatedTeams = teams.map(t => {
        if (t.id === selectedTeam.id) {
          const newMembers: TeamMember[] = selectedMembers.map(memberId => {
            const student = students.find(s => s.id === memberId);
            const existingMember = t.members.find(m => m.id === memberId);
            return {
              id: memberId,
              name: student?.name || existingMember?.name || 'Unknown',
              email: student?.email || existingMember?.email || '',
              role: memberId === teamLeaderId ? 'Leader' : 'Member',
              contribution: existingMember?.contribution || 0
            };
          });
          return { ...t, members: newMembers };
        }
        return t;
      });

      setTeams(updatedTeams);
      setSuccess('Team members updated successfully');
      setMemberDialogOpen(false);
      setSelectedMembers([]);
      setTeamLeaderId('');
    } catch (err) {
      setError('Failed to update members');
      console.error(err);
    }
  };

  const stats = {
    totalTeams: teams.length,
    totalMembers: teams.reduce((sum, t) => sum + t.members.length, 0),
    averageProgress: Math.round(teams.reduce((sum, t) => sum + t.progress, 0) / (teams.length || 1))
  };

  const availableStudents = students.filter(s =>
    !teams.some(t => t.members.some(m => m.id === s.id))
  );

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        Team Management
      </Typography>

      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <StatCard
            title="Total Teams"
            value={stats.totalTeams}
            icon={<GroupIcon />}
            color="#3b82f6"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard
            title="Total Members"
            value={stats.totalMembers}
            icon={<PersonIcon />}
            color="#10b981"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard
            title="Average Progress"
            value={`${stats.averageProgress}%`}
            icon={<ProgressIcon />}
            color="#8b5cf6"
          />
        </Grid>
      </Grid>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">All Teams</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Create Team
        </Button>
      </Box>

      {/* Teams Grid */}
      <Grid container spacing={3}>
        {teams.map((team) => (
          <Grid item xs={12} md={6} lg={4} key={team.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {team.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {team.projectName} • {team.className}
                    </Typography>
                  </Box>
                  <Box>
                    <Tooltip title="Edit Team">
                      <IconButton size="small" onClick={() => handleOpenDialog(team)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Team">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          setSelectedTeam(team);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <Box mb={2}>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2">Progress</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {team.progress}%
                    </Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={team.progress} />
                </Box>

                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="body2">
                    {team.members.length} members
                  </Typography>
                  <AvatarGroup max={4}>
                    {team.members.map((member) => (
                      <Tooltip key={member.id} title={`${member.name} (${member.role})`}>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {member.name.charAt(0)}
                          {member.role === 'Leader' && (
                            <StarIcon sx={{ position: 'absolute', fontSize: 12, top: -2, right: -2, color: 'warning.main' }} />
                          )}
                        </Avatar>
                      </Tooltip>
                    ))}
                  </AvatarGroup>
                </Box>

                <Button
                  fullWidth
                  variant="outlined"
                  size="small"
                  onClick={() => handleOpenMemberDialog(team)}
                >
                  Manage Members
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {teams.length === 0 && (
        <Paper sx={{ p: 8, textAlign: 'center' }}>
          <GroupIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No teams yet
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Create your first team to get started
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
            Create Team
          </Button>
        </Paper>
      )}

      {/* Create/Edit Team Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{isEditing ? 'Edit Team' : 'Create New Team'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Team Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            required
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Project</InputLabel>
            <Select
              value={formData.projectId}
              label="Project"
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
            >
              <MenuItem value="proj-1">E-Commerce Platform</MenuItem>
              <MenuItem value="proj-2">Mobile App Development</MenuItem>
              <MenuItem value="proj-3">AI Chatbot System</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Class</InputLabel>
            <Select
              value={formData.classId}
              label="Class"
              onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
            >
              <MenuItem value="class-1">CS101-01</MenuItem>
              <MenuItem value="class-2">CS101-02</MenuItem>
              <MenuItem value="class-3">CS202-01</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!formData.name || !formData.projectId || !formData.classId}
          >
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manage Members Dialog */}
      <Dialog open={memberDialogOpen} onClose={() => setMemberDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Manage Team Members - {selectedTeam?.name}</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Select members and assign a team leader. The leader will have additional permissions.
          </Alert>

          <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
            Current Members ({selectedMembers.length})
          </Typography>
          <List>
            {[...selectedTeam?.members || [], ...availableStudents].map((person) => {
              const isMember = 'role' in person;
              const student = isMember ? null : person as Student;
              const member = isMember ? person as TeamMember : null;
              const id = member?.id || student?.id || '';
              const name = member?.name || student?.name || '';
              const email = member?.email || student?.email || '';
              const isSelected = selectedMembers.includes(id);

              return (
                <ListItem
                  key={id}
                  secondaryAction={
                    <Checkbox
                      edge="end"
                      checked={isSelected}
                      onChange={() => handleToggleMember(id)}
                    />
                  }
                >
                  <ListItemAvatar>
                    <Avatar>{name.charAt(0)}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={name}
                    secondary={email}
                  />
                </ListItem>
              );
            })}
          </List>

          <Divider sx={{ my: 2 }} />

          <FormControl fullWidth>
            <InputLabel>Team Leader</InputLabel>
            <Select
              value={teamLeaderId}
              label="Team Leader"
              onChange={(e) => setTeamLeaderId(e.target.value)}
              disabled={selectedMembers.length === 0}
            >
              {selectedMembers.map(memberId => {
                const member = selectedTeam?.members.find(m => m.id === memberId);
                const student = students.find(s => s.id === memberId);
                const name = member?.name || student?.name || 'Unknown';
                return (
                  <MenuItem key={memberId} value={memberId}>
                    {name}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMemberDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveMembers}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Team</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete team "{selectedTeam?.name}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeamManagementPage;
