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
  CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { projectsAPI } from '../services/api';
import StatCard from '../components/StatCard';
import { Project, ProjectStatus, CreateProjectRequest } from '../types';

type ChipColor = 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';

const statusColors: Record<ProjectStatus, ChipColor> = {
  Pending: 'warning',
  Approved: 'success',
  Denied: 'error',
  InProgress: 'info',
  Completed: 'default'
};

const LecturerDashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const navigate = useNavigate();

  const [formData, setFormData] = useState<CreateProjectRequest>({
    name: '',
    description: '',
    objectives: '',
    syllabusId: '',
    classId: ''
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
      setFormData({
        name: '',
        description: '',
        objectives: '',
        syllabusId: '',
        classId: ''
      });
      loadProjects();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to create project');
    }
  };

  const handleSubmit = async (projectId: string) => {
    try {
      setError('');
      await projectsAPI.submit(projectId);
      setSuccess('Project submitted for approval!');
      loadProjects();
    } catch {
      setError('Failed to submit project');
    }
  };

  const handleDelete = async (projectId: string) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;

    try {
      await projectsAPI.delete(projectId);
      setSuccess('Project deleted successfully!');
      loadProjects();
    } catch {
      setError('Failed to delete project');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  // Calculate statistics
  const stats = {
    total: projects.length,
    approved: projects.filter(p => p.status === 'Approved').length,
    pending: projects.filter(p => p.status === 'Pending').length,
    inProgress: projects.filter(p => p.status === 'InProgress').length
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 0, mb: 4 }}>
      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Projects"
            value={stats.total}
            color="#3b82f6"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Approved"
            value={stats.approved}
            color="#10b981"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending"
            value={stats.pending}
            color="#f59e0b"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="In Progress"
            value={stats.inProgress}
            color="#8b5cf6"
          />
        </Grid>
      </Grid>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={600}>My Projects</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Create Project
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Grid container spacing={3}>
        {projects.map((project) => (
          <Grid item xs={12} md={6} lg={4} key={project.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                  <Typography variant="h6" component="div">
                    {project.name}
                  </Typography>
                  <Chip
                    label={project.status}
                    color={statusColors[project.status]}
                    size="small"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {project.description}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Objectives: {project.objectives}
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" onClick={() => navigate(`/projects/${project.id}`)}>
                  View Details
                </Button>
                {project.status === 'Pending' && !project.submittedAt && (
                  <Button size="small" color="primary" onClick={() => handleSubmit(project.id)}>
                    Submit
                  </Button>
                )}
                {project.status === 'Pending' && (
                  <Button size="small" color="error" onClick={() => handleDelete(project.id)}>
                    Delete
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {projects.length === 0 && (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary">
            No projects yet. Create your first project!
          </Typography>
        </Box>
      )}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Project</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Project Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="normal"
            multiline
            rows={3}
            required
          />
          <TextField
            fullWidth
            label="Objectives"
            value={formData.objectives}
            onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
            margin="normal"
            multiline
            rows={2}
            required
          />
          <TextField
            fullWidth
            label="Syllabus ID (Optional)"
            value={formData.syllabusId}
            onChange={(e) => setFormData({ ...formData, syllabusId: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Class ID (Optional)"
            value={formData.classId}
            onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default LecturerDashboard;
