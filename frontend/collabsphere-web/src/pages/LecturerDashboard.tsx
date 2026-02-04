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
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
  Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DeleteIcon from '@mui/icons-material/Delete';
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

interface Milestone {
  title: string;
  description: string;
  order: number;
}

const LecturerDashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [generatingMilestones, setGeneratingMilestones] = useState<boolean>(false);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
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

  const handleGenerateMilestones = async () => {
    if (!formData.objectives) {
      setError('Please enter project objectives first');
      return;
    }

    setGeneratingMilestones(true);
    setError('');

    try {
      // TODO: Implement actual AWS Bedrock API integration
      // Simulate AI generation for now
      await new Promise(resolve => setTimeout(resolve, 2000));

      const generatedMilestones: Milestone[] = [
        {
          order: 1,
          title: 'Project Planning & Requirements',
          description: 'Define project scope, gather requirements, create project charter and timeline'
        },
        {
          order: 2,
          title: 'Design Phase',
          description: 'Create system architecture, database design, UI/UX mockups and technical specifications'
        },
        {
          order: 3,
          title: 'Development Sprint 1',
          description: 'Implement core features and basic functionality'
        },
        {
          order: 4,
          title: 'Development Sprint 2',
          description: 'Complete advanced features and integrations'
        },
        {
          order: 5,
          title: 'Testing & Quality Assurance',
          description: 'Conduct unit testing, integration testing, and user acceptance testing'
        },
        {
          order: 6,
          title: 'Deployment & Documentation',
          description: 'Deploy to production, create user documentation and conduct training'
        }
      ];

      setMilestones(generatedMilestones);
      setSuccess('AI has generated ' + generatedMilestones.length + ' milestones based on your objectives!');
    } catch (err) {
      setError('Failed to generate milestones. Please try again.');
      console.error(err);
    } finally {
      setGeneratingMilestones(false);
    }
  };

  const handleRemoveMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setMilestones([]);
    setFormData({
      name: '',
      description: '',
      objectives: '',
      syllabusId: '',
      classId: ''
    });
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

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
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
          <Box sx={{ position: 'relative' }}>
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
            <Tooltip title="Generate milestones with AI based on objectives">
              <Button
                variant="outlined"
                startIcon={generatingMilestones ? <CircularProgress size={20} /> : <AutoAwesomeIcon />}
                onClick={handleGenerateMilestones}
                disabled={!formData.objectives || generatingMilestones}
                sx={{ mt: 1 }}
                fullWidth
              >
                {generatingMilestones ? 'Generating...' : 'Generate Milestones with AI'}
              </Button>
            </Tooltip>
          </Box>

          {milestones.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle1" fontWeight={600}>
                  AI-Generated Milestones ({milestones.length})
                </Typography>
                <Chip
                  icon={<AutoAwesomeIcon />}
                  label="AI Powered"
                  color="primary"
                  size="small"
                />
              </Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                Review and edit the generated milestones. You can remove any that don't fit your project.
              </Alert>
              <List sx={{ bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                {milestones.map((milestone, index) => (
                  <React.Fragment key={index}>
                    <ListItem
                      secondaryAction={
                        <IconButton edge="end" onClick={() => handleRemoveMilestone(index)}>
                          <DeleteIcon />
                        </IconButton>
                      }
                    >
                      <ListItemText
                        primary={`${milestone.order}. ${milestone.title}`}
                        secondary={milestone.description}
                      />
                    </ListItem>
                    {index < milestones.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Box>
          )}

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
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained">
            Create Project
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default LecturerDashboard;
