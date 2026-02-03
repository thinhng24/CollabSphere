import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { projectsAPI } from '../services/api';
import StatCard from '../components/StatCard';
import { Project, ProjectStatus } from '../types';

type DialogType = 'approve' | 'reject';
type ChipColor = 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';

const HeadDeptDashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [dialogType, setDialogType] = useState<DialogType>('approve');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [comments, setComments] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await projectsAPI.getAll();
      const data = response.data.data;
      const allProjects: Project[] = Array.isArray(data) ? data : (data?.items || []);

      // Filter to show submitted projects first
      const sorted = [...allProjects].sort((a, b) => {
        if (a.submittedAt && !b.submittedAt) return -1;
        if (!a.submittedAt && b.submittedAt) return 1;
        return 0;
      });

      setProjects(sorted);
    } catch (err) {
      setError('Failed to load projects');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (project: Project, type: DialogType) => {
    setSelectedProject(project);
    setDialogType(type);
    setComments('');
    setOpenDialog(true);
  };

  const handleApprove = async () => {
    if (!selectedProject) return;

    try {
      setError('');
      await projectsAPI.approve(selectedProject.id, comments);
      setSuccess(`Project "${selectedProject.name}" approved successfully!`);
      setOpenDialog(false);
      loadProjects();
    } catch {
      setError('Failed to approve project');
    }
  };

  const handleReject = async () => {
    if (!selectedProject) return;

    try {
      setError('');
      await projectsAPI.reject(selectedProject.id, comments);
      setSuccess(`Project "${selectedProject.name}" rejected.`);
      setOpenDialog(false);
      loadProjects();
    } catch {
      setError('Failed to reject project');
    }
  };

  const getStatusColor = (status: ProjectStatus): ChipColor => {
    const colors: Record<ProjectStatus, ChipColor> = {
      Pending: 'warning',
      Approved: 'success',
      Denied: 'error',
      InProgress: 'info',
      Completed: 'default'
    };
    return colors[status] || 'default';
  };

  const needsReview = (project: Project): boolean => {
    return !!project.submittedAt && project.status === 'Pending';
  };

  // Calculate statistics
  const stats = {
    total: projects.length,
    submitted: projects.filter(p => p.submittedAt && p.status === 'Pending').length,
    approved: projects.filter(p => p.status === 'Approved').length,
    rejected: projects.filter(p => p.status === 'Denied').length
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

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
            title="Awaiting Review"
            value={stats.submitted}
            color="#f59e0b"
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
            title="Rejected"
            value={stats.rejected}
            color="#ef4444"
          />
        </Grid>
      </Grid>

      <Typography variant="h5" fontWeight={600} gutterBottom>
        Project Review Dashboard
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Review and approve project submissions
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2, mt: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2, mt: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {projects.map((project) => (
          <Grid item xs={12} md={6} lg={4} key={project.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                  <Typography variant="h6" component="div">
                    {project.name}
                  </Typography>
                  <Box>
                    <Chip
                      label={project.status}
                      color={getStatusColor(project.status)}
                      size="small"
                    />
                    {needsReview(project) && (
                      <Chip
                        label="REVIEW"
                        color="error"
                        size="small"
                        sx={{ ml: 0.5 }}
                      />
                    )}
                  </Box>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {project.description}
                </Typography>

                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                  <strong>Objectives:</strong> {project.objectives}
                </Typography>

                {project.submittedAt && (
                  <Typography variant="caption" color="primary" display="block">
                    Submitted: {new Date(project.submittedAt).toLocaleDateString()}
                  </Typography>
                )}

                {project.rejectionReason && (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    {project.rejectionReason}
                  </Alert>
                )}
              </CardContent>

              <CardActions>
                <Button size="small" onClick={() => navigate(`/projects/${project.id}`)}>
                  View Details
                </Button>
                {needsReview(project) && (
                  <>
                    <Button
                      size="small"
                      color="success"
                      startIcon={<CheckCircleIcon />}
                      onClick={() => handleOpenDialog(project, 'approve')}
                    >
                      Approve
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<CancelIcon />}
                      onClick={() => handleOpenDialog(project, 'reject')}
                    >
                      Reject
                    </Button>
                  </>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {projects.length === 0 && (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary">
            No projects to review
          </Typography>
        </Box>
      )}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogType === 'approve' ? 'Approve Project' : 'Reject Project'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" gutterBottom>
            Project: {selectedProject?.name}
          </Typography>
          <TextField
            fullWidth
            label={dialogType === 'approve' ? 'Comments (Optional)' : 'Rejection Reason'}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            margin="normal"
            multiline
            rows={4}
            required={dialogType === 'reject'}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={dialogType === 'approve' ? handleApprove : handleReject}
            variant="contained"
            color={dialogType === 'approve' ? 'success' : 'error'}
          >
            {dialogType === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default HeadDeptDashboard;
