import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import { projectsAPI } from '../services/api';
import StatCard from '../components/StatCard';
import { Project, Milestone, ProjectStatus, CreateProjectRequest } from '../types';

type ChipColor = 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
type ViewMode = 'cards' | 'table';

interface MilestoneFormData {
  name: string;
  description: string;
  dueDate: string;
}

const statusColors: Record<ProjectStatus, ChipColor> = {
  Pending: 'warning',
  Approved: 'success',
  Denied: 'error',
  InProgress: 'info',
  Completed: 'default'
};

const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [openMilestonesDialog, setOpenMilestonesDialog] = useState<boolean>(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const navigate = useNavigate();

  const [formData, setFormData] = useState<CreateProjectRequest>({
    name: '',
    description: '',
    objectives: '',
    syllabusId: '',
    classId: ''
  });

  const [milestoneForm, setMilestoneForm] = useState<MilestoneFormData>({
    name: '',
    description: '',
    dueDate: ''
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await projectsAPI.getAll();
      const data = response.data.data;
      const projects = Array.isArray(data) ? data : (data?.items || []);
      setProjects(projects);
    } catch (err) {
      setError('Failed to load projects');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      setError('');
      await projectsAPI.create(formData);
      setSuccess('Project created successfully!');
      setOpenDialog(false);
      setFormData({ name: '', description: '', objectives: '', syllabusId: '', classId: '' });
      loadProjects();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to create project');
    }
  };

  const handleSubmit = async (projectId: string, projectName: string) => {
    if (!window.confirm(`Submit "${projectName}" for approval?`)) return;
    try {
      setError('');
      await projectsAPI.submit(projectId);
      setSuccess('Project submitted for approval!');
      loadProjects();
    } catch {
      setError('Failed to submit project');
    }
  };

  const handleDelete = async (projectId: string, projectName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${projectName}"?`)) return;
    try {
      await projectsAPI.delete(projectId);
      setSuccess('Project deleted successfully!');
      loadProjects();
    } catch {
      setError('Failed to delete project');
    }
  };

  const handleGenerateMilestones = async (project: Project) => {
    if (!window.confirm(`Generate AI milestones for "${project.name}"?`)) return;
    try {
      setError('');
      setSuccess('Generating milestones with AI...');
      await projectsAPI.generateMilestones(project.id);
      setSuccess('Milestones generated successfully! Opening milestones...');
      loadProjects();
      // Auto open milestones dialog to show generated milestones
      setTimeout(() => {
        handleOpenMilestones(project);
      }, 500);
    } catch {
      setError('Failed to generate milestones');
    }
  };

  const handleOpenMilestones = async (project: Project) => {
    setSelectedProject(project);
    try {
      const response = await projectsAPI.getMilestones(project.id);
      const data = response.data.data;
      setMilestones(data || []);
      setOpenMilestonesDialog(true);
    } catch {
      setError('Failed to load milestones');
    }
  };

  const handleAddMilestone = async () => {
    if (!selectedProject) return;
    try {
      await projectsAPI.addMilestone(selectedProject.id, milestoneForm);
      setSuccess('Milestone added successfully!');
      setMilestoneForm({ name: '', description: '', dueDate: '' });
      const response = await projectsAPI.getMilestones(selectedProject.id);
      setMilestones(response.data.data || []);
    } catch {
      setError('Failed to add milestone');
    }
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    if (!selectedProject || !window.confirm('Delete this milestone?')) return;
    try {
      await projectsAPI.deleteMilestone(selectedProject.id, milestoneId);
      setSuccess('Milestone deleted!');
      const response = await projectsAPI.getMilestones(selectedProject.id);
      setMilestones(response.data.data || []);
    } catch {
      setError('Failed to delete milestone');
    }
  };

  const stats = {
    total: projects.length,
    approved: projects.filter(p => p.status === 'Approved').length,
    pending: projects.filter(p => p.status === 'Pending').length,
    inProgress: projects.filter(p => p.status === 'InProgress').length
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={600}>Projects Management</Typography>
        <Box display="flex" gap={1}>
          <Tooltip title={viewMode === 'cards' ? 'Table View' : 'Card View'}>
            <IconButton onClick={() => setViewMode(viewMode === 'cards' ? 'table' : 'cards')}>
              {viewMode === 'cards' ? <ViewListIcon /> : <ViewModuleIcon />}
            </IconButton>
          </Tooltip>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenDialog(true)}>
            Create Project
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Total Projects" value={stats.total} color="#3b82f6" /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Approved" value={stats.approved} color="#10b981" /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Pending" value={stats.pending} color="#f59e0b" /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="In Progress" value={stats.inProgress} color="#8b5cf6" /></Grid>
      </Grid>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {viewMode === 'cards' ? (
        <Grid container spacing={3}>
          {projects.map((project) => (
            <Grid item xs={12} md={6} lg={4} key={project.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                    <Typography variant="h6">{project.name}</Typography>
                    <Chip label={project.status} color={statusColors[project.status]} size="small" />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{project.description}</Typography>
                  <Typography variant="caption" color="text.secondary" display="block"><strong>Objectives:</strong> {project.objectives}</Typography>
                  {project.submittedAt && <Typography variant="caption" color="primary" display="block">Submitted: {new Date(project.submittedAt).toLocaleDateString()}</Typography>}
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => navigate(`/projects/${project.id}`)}>Details</Button>
                  <Button size="small" onClick={() => handleOpenMilestones(project)}>Milestones</Button>
                  {project.status === 'Pending' && !project.submittedAt && (
                    <>
                      <Tooltip title="Generate AI Milestones"><IconButton size="small" onClick={() => handleGenerateMilestones(project)}><AutoAwesomeIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Submit"><IconButton size="small" color="primary" onClick={() => handleSubmit(project.id, project.name)}><SendIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDelete(project.id, project.name)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                    </>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Description</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Submitted</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id} hover>
                  <TableCell>{project.name}</TableCell>
                  <TableCell>{project.description}</TableCell>
                  <TableCell><Chip label={project.status} color={statusColors[project.status]} size="small" /></TableCell>
                  <TableCell>{project.submittedAt ? new Date(project.submittedAt).toLocaleDateString() : '-'}</TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => navigate(`/projects/${project.id}`)}>Details</Button>
                    <Button size="small" onClick={() => handleOpenMilestones(project)}>Milestones</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {projects.length === 0 && <Box textAlign="center" py={8}><Typography variant="h6" color="text.secondary">No projects yet.</Typography></Box>}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Project</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Project Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} margin="normal" required />
          <TextField fullWidth label="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} margin="normal" multiline rows={3} required />
          <TextField fullWidth label="Objectives" value={formData.objectives} onChange={(e) => setFormData({ ...formData, objectives: e.target.value })} margin="normal" multiline rows={2} required />
          <TextField fullWidth label="Syllabus ID (Optional)" value={formData.syllabusId} onChange={(e) => setFormData({ ...formData, syllabusId: e.target.value })} margin="normal" />
          <TextField fullWidth label="Class ID (Optional)" value={formData.classId} onChange={(e) => setFormData({ ...formData, classId: e.target.value })} margin="normal" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openMilestonesDialog} onClose={() => setOpenMilestonesDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Milestones - {selectedProject?.name}</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Add New Milestone</Typography>
            <TextField fullWidth size="small" label="Name" value={milestoneForm.name} onChange={(e) => setMilestoneForm({ ...milestoneForm, name: e.target.value })} margin="dense" />
            <TextField fullWidth size="small" label="Description" value={milestoneForm.description} onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })} margin="dense" multiline rows={2} />
            <TextField fullWidth size="small" label="Due Date" type="date" value={milestoneForm.dueDate} onChange={(e) => setMilestoneForm({ ...milestoneForm, dueDate: e.target.value })} margin="dense" InputLabelProps={{ shrink: true }} />
            <Button variant="contained" size="small" sx={{ mt: 1 }} onClick={handleAddMilestone} disabled={!milestoneForm.name || !milestoneForm.dueDate}>Add</Button>
          </Box>
          {milestones.length > 0 ? milestones.map((m) => (
            <Card key={m.id} sx={{ mb: 2 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="start">
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>{m.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{m.description}</Typography>
                    <Typography variant="caption" color="text.secondary">Due: {new Date(m.dueDate).toLocaleDateString()}</Typography>
                  </Box>
                  <IconButton size="small" color="error" onClick={() => handleDeleteMilestone(m.id)}><DeleteIcon fontSize="small" /></IconButton>
                </Box>
              </CardContent>
            </Card>
          )) : <Alert severity="info">No milestones yet.</Alert>}
        </DialogContent>
        <DialogActions><Button onClick={() => setOpenMilestonesDialog(false)}>Close</Button></DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProjectsPage;
