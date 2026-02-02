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
  LinearProgress,
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
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import GroupIcon from '@mui/icons-material/Group';
import FolderIcon from '@mui/icons-material/Folder';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import AssignmentIcon from '@mui/icons-material/Assignment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import { useNavigate } from 'react-router-dom';
import { Team, TeamMember, Class, Project, User } from '../types';
import { teamsAPI, classesAPI, projectsAPI, usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const TeamsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLecturer, isStudent } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [assignProjectDialogOpen, setAssignProjectDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [membersTab, setMembersTab] = useState(0);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    classId: '',
    maxMembers: 5
  });
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [teamsRes, classesRes, projectsRes, usersRes] = await Promise.all([
        isStudent() ? teamsAPI.getByStudent(user?.id) : teamsAPI.getAll(),
        isLecturer() ? classesAPI.getByLecturer(user?.id) : classesAPI.getAll(),
        projectsAPI.getAll(),
        usersAPI.getAll('Student')
      ]);
      setTeams(teamsRes.data.data?.items || []);
      setClasses(classesRes.data.data?.items || []);
      const allProjects = projectsRes.data.data?.items || [];
      setProjects(allProjects.filter((p: Project) => p.status === 'Approved'));
      setStudents(usersRes.data.data?.items || []);
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await teamsAPI.create(formData);
      setSuccess('Team created successfully!');
      setCreateDialogOpen(false);
      setFormData({ name: '', classId: '', maxMembers: 5 });
      loadData();
    } catch {
      setError('Failed to create team');
    }
  };

  const handleDelete = async (teamId: string) => {
    if (!window.confirm('Are you sure you want to delete this team?')) return;
    try {
      await teamsAPI.delete(teamId);
      setSuccess('Team deleted successfully!');
      loadData();
    } catch {
      setError('Failed to delete team');
    }
  };

  const handleAssignProject = async () => {
    if (!selectedTeam || !selectedProject) return;
    try {
      await teamsAPI.assignProject(selectedTeam.id, selectedProject);
      setSuccess('Project assigned successfully!');
      setAssignProjectDialogOpen(false);
      loadData();
    } catch {
      setError('Failed to assign project');
    }
  };

  const handleAddMember = async () => {
    if (!selectedTeam || !selectedStudent) return;
    try {
      const isLeader = teamMembers.length === 0;
      await teamsAPI.addMember(selectedTeam.id, selectedStudent, isLeader ? 'Leader' : 'Member');
      setSuccess('Member added successfully!');
      setSelectedStudent('');
      loadTeamMembers(selectedTeam.id);
      loadData();
    } catch {
      setError('Failed to add member');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedTeam) return;
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    try {
      await teamsAPI.removeMember(selectedTeam.id, memberId);
      setSuccess('Member removed successfully!');
      loadTeamMembers(selectedTeam.id);
      loadData();
    } catch {
      setError('Failed to remove member');
    }
  };

  const loadTeamMembers = async (teamId: string) => {
    try {
      const response = await teamsAPI.getMembers(teamId);
      setTeamMembers(response.data.data?.items || []);
    } catch {
      setError('Failed to load team members');
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'success';
    if (progress >= 50) return 'primary';
    if (progress >= 25) return 'warning';
    return 'error';
  };

  if (loading) {
    return <Box sx={{ p: 3 }}><Typography>Loading...</Typography></Box>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Teams
        </Typography>
        {isLecturer() && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Team
          </Button>
        )}
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <GroupIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4">{teams.length}</Typography>
              <Typography variant="body2" color="text.secondary">Total Teams</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4">
                {teams.filter(t => t.progress >= 50).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">On Track</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <FolderIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h4">
                {teams.filter(t => t.projectId).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">With Projects</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AssignmentIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4">
                {Math.round(teams.reduce((acc, t) => acc + t.progress, 0) / (teams.length || 1))}%
              </Typography>
              <Typography variant="body2" color="text.secondary">Avg Progress</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Teams Grid */}
      {teams.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <GroupIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">No teams found</Typography>
          {isLecturer() && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
              sx={{ mt: 2 }}
            >
              Create Your First Team
            </Button>
          )}
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {teams.map((team) => (
            <Grid item xs={12} sm={6} md={4} key={team.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {team.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {team.className}
                      </Typography>
                    </Box>
                    <Chip
                      label={team.status}
                      color={team.status === 'Active' ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>

                  {team.projectName ? (
                    <Chip
                      icon={<FolderIcon />}
                      label={team.projectName}
                      variant="outlined"
                      size="small"
                      sx={{ mb: 2 }}
                    />
                  ) : (
                    <Chip
                      label="No project assigned"
                      variant="outlined"
                      color="warning"
                      size="small"
                      sx={{ mb: 2 }}
                    />
                  )}

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">Progress</Typography>
                      <Typography variant="body2" fontWeight={600}>{team.progress}%</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={team.progress}
                      color={getProgressColor(team.progress) as any}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 28, height: 28, fontSize: '0.8rem' } }}>
                        {Array.from({ length: team.memberCount }).map((_, i) => (
                          <Avatar key={i}>{String.fromCharCode(65 + i)}</Avatar>
                        ))}
                      </AvatarGroup>
                      <Typography variant="body2" color="text.secondary">
                        {team.memberCount}/{team.maxMembers}
                      </Typography>
                    </Box>
                    {team.leaderName && (
                      <Tooltip title={`Leader: ${team.leaderName}`}>
                        <Chip
                          icon={<StarIcon sx={{ fontSize: 16 }} />}
                          label={team.leaderName.split(' ')[0]}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </Tooltip>
                    )}
                  </Box>
                </CardContent>

                <Divider />

                <CardActions sx={{ justifyContent: 'space-between', px: 2 }}>
                  <Box>
                    <Tooltip title="View Members">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedTeam(team);
                          loadTeamMembers(team.id);
                          setMembersDialogOpen(true);
                        }}
                      >
                        <GroupIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {isLecturer() && (
                      <>
                        <Tooltip title="Assign Project">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedTeam(team);
                              setSelectedProject(team.projectId || '');
                              setAssignProjectDialogOpen(true);
                            }}
                          >
                            <FolderIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Team">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(team.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </Box>
                  <Button
                    size="small"
                    onClick={() => navigate(`/workspace/${team.id}`)}
                  >
                    Workspace
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Team Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Team</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Team Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Team Alpha"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Class</InputLabel>
                <Select
                  value={formData.classId}
                  label="Class"
                  onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                >
                  {classes.map(cls => (
                    <MenuItem key={cls.id} value={cls.id}>{cls.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Max Members"
                type="number"
                value={formData.maxMembers}
                onChange={(e) => setFormData({ ...formData, maxMembers: parseInt(e.target.value) })}
                inputProps={{ min: 2, max: 10 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!formData.name || !formData.classId}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Team Members Dialog */}
      <Dialog open={membersDialogOpen} onClose={() => setMembersDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedTeam?.name} - Members ({teamMembers.length}/{selectedTeam?.maxMembers})
        </DialogTitle>
        <DialogContent>
          <Tabs value={membersTab} onChange={(_, v) => setMembersTab(v)} sx={{ mb: 2 }}>
            <Tab label="Current Members" />
            {isLecturer() && <Tab label="Add Member" />}
          </Tabs>

          {membersTab === 0 && (
            <List>
              {teamMembers.length === 0 ? (
                <ListItem>
                  <ListItemText primary="No members yet" secondary="Add members to get started" />
                </ListItem>
              ) : (
                teamMembers.map((member) => (
                  <ListItem key={member.id}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: member.role === 'Leader' ? 'primary.main' : 'grey.400' }}>
                        {member.fullName.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {member.fullName}
                          {member.role === 'Leader' && (
                            <Chip label="Leader" size="small" color="primary" icon={<StarIcon />} />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">{member.email}</Typography>
                          <LinearProgress
                            variant="determinate"
                            value={member.contribution}
                            sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
                          />
                          <Typography variant="caption">Contribution: {member.contribution}%</Typography>
                        </Box>
                      }
                    />
                    {isLecturer() && member.role !== 'Leader' && (
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          color="error"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          <PersonRemoveIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    )}
                  </ListItem>
                ))
              )}
            </List>
          )}

          {membersTab === 1 && isLecturer() && (
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <FormControl fullWidth>
                <InputLabel>Select Student</InputLabel>
                <Select
                  value={selectedStudent}
                  label="Select Student"
                  onChange={(e) => setSelectedStudent(e.target.value)}
                >
                  {students
                    .filter(s => !teamMembers.some(m => m.userId === s.id))
                    .map(student => (
                      <MenuItem key={student.id} value={student.id}>
                        {student.fullName} ({student.email})
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
              <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={handleAddMember}
                disabled={!selectedStudent || teamMembers.length >= (selectedTeam?.maxMembers || 5)}
                sx={{ minWidth: 120 }}
              >
                Add
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMembersDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Assign Project Dialog */}
      <Dialog open={assignProjectDialogOpen} onClose={() => setAssignProjectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Project to {selectedTeam?.name}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Select Project</InputLabel>
            <Select
              value={selectedProject}
              label="Select Project"
              onChange={(e) => setSelectedProject(e.target.value)}
            >
              <MenuItem value="">
                <em>No Project</em>
              </MenuItem>
              {projects.map(project => (
                <MenuItem key={project.id} value={project.id}>
                  {project.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {selectedProject && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="subtitle2">
                {projects.find(p => p.id === selectedProject)?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {projects.find(p => p.id === selectedProject)?.description}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignProjectDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAssignProject}>
            Assign
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeamsPage;
