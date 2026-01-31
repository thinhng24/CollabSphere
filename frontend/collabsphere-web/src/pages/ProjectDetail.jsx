import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Grid,
  Paper
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { projectsAPI, milestonesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLecturer } = useAuth();

  const [project, setProject] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openAIDialog, setOpenAIDialog] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [aiLoading, setAILoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    order: 0
  });

  const [aiFormData, setAIFormData] = useState({
    syllabusId: '',
    numberOfMilestones: 5
  });

  useEffect(() => {
    loadProjectAndMilestones();
  }, [id]);

  const loadProjectAndMilestones = async () => {
    try {
      setLoading(true);
      const [projectRes, milestonesRes] = await Promise.all([
        projectsAPI.getById(id),
        milestonesAPI.getByProjectId(id)
      ]);

      setProject(projectRes.data.data || projectRes.data);
      setMilestones(milestonesRes.data.data || milestonesRes.data);
    } catch (error) {
      setError('Failed to load project details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (milestone = null) => {
    if (milestone) {
      setEditingMilestone(milestone);
      setFormData({
        title: milestone.title,
        description: milestone.description,
        dueDate: milestone.dueDate?.split('T')[0] || '',
        order: milestone.order
      });
    } else {
      setEditingMilestone(null);
      setFormData({
        title: '',
        description: '',
        dueDate: '',
        order: milestones.length + 1
      });
    }
    setOpenDialog(true);
  };

  const handleSaveMilestone = async () => {
    try {
      setError('');
      const data = {
        ...formData,
        projectId: id
      };

      if (editingMilestone) {
        await milestonesAPI.update(editingMilestone.id, data);
        setSuccess('Milestone updated successfully!');
      } else {
        await milestonesAPI.create(data);
        setSuccess('Milestone created successfully!');
      }

      setOpenDialog(false);
      loadProjectAndMilestones();
    } catch (error) {
      setError('Failed to save milestone');
    }
  };

  const handleDeleteMilestone = async (milestoneId) => {
    if (!window.confirm('Are you sure you want to delete this milestone?')) return;

    try {
      await milestonesAPI.delete(milestoneId);
      setSuccess('Milestone deleted successfully!');
      loadProjectAndMilestones();
    } catch (error) {
      setError('Failed to delete milestone');
    }
  };

  const handleCompleteMilestone = async (milestoneId) => {
    try {
      await milestonesAPI.complete(milestoneId);
      setSuccess('Milestone marked as completed!');
      loadProjectAndMilestones();
    } catch (error) {
      setError('Failed to complete milestone');
    }
  };

  const handleGenerateMilestones = async () => {
    try {
      setAILoading(true);
      setError('');

      await projectsAPI.generateMilestones(
        id,
        aiFormData.syllabusId,
        aiFormData.numberOfMilestones
      );

      setSuccess('AI-powered milestones generated successfully!');
      setOpenAIDialog(false);
      loadProjectAndMilestones();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to generate milestones. AI service may not be configured.');
    } finally {
      setAILoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!project) {
    return (
      <Container>
        <Alert severity="error">Project not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)}
        sx={{ mb: 2 }}
      >
        Back
      </Button>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h4">{project.name}</Typography>
              <Chip
                label={project.status}
                color={project.status === 'Approved' ? 'success' : 'warning'}
              />
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>Description</Typography>
            <Typography variant="body1" paragraph>{project.description}</Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>Objectives</Typography>
            <Typography variant="body1">{project.objectives}</Typography>
          </Grid>

          {project.submittedAt && (
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">
                <strong>Submitted:</strong> {new Date(project.submittedAt).toLocaleString()}
              </Typography>
            </Grid>
          )}

          {project.approvedAt && (
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="success.main">
                <strong>Approved:</strong> {new Date(project.approvedAt).toLocaleString()}
              </Typography>
            </Grid>
          )}
        </Grid>
      </Paper>

      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h5">Milestones</Typography>
            {isLecturer() && (
              <Box>
                <Button
                  variant="outlined"
                  startIcon={<AutoAwesomeIcon />}
                  onClick={() => setOpenAIDialog(true)}
                  sx={{ mr: 1 }}
                >
                  AI Generate
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog()}
                >
                  Add Milestone
                </Button>
              </Box>
            )}
          </Box>

          <Divider sx={{ mb: 2 }} />

          {milestones.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="text.secondary">
                No milestones yet. Add your first milestone or use AI to generate suggestions!
              </Typography>
            </Box>
          ) : (
            <List>
              {milestones
                .sort((a, b) => a.order - b.order)
                .map((milestone) => (
                  <ListItem
                    key={milestone.id}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                      bgcolor: milestone.isCompleted ? 'success.light' : 'background.paper'
                    }}
                    secondaryAction={
                      isLecturer() && (
                        <Box>
                          {!milestone.isCompleted && (
                            <IconButton
                              edge="end"
                              onClick={() => handleCompleteMilestone(milestone.id)}
                              color="success"
                            >
                              <CheckCircleIcon />
                            </IconButton>
                          )}
                          <IconButton
                            edge="end"
                            onClick={() => handleOpenDialog(milestone)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            edge="end"
                            onClick={() => handleDeleteMilestone(milestone.id)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      )
                    }
                  >
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Chip label={`#${milestone.order}`} size="small" />
                          <Typography variant="subtitle1">
                            {milestone.title}
                          </Typography>
                          {milestone.isCompleted && (
                            <Chip label="Completed" color="success" size="small" />
                          )}
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" component="span" display="block">
                            {milestone.description}
                          </Typography>
                          <Typography variant="caption" component="span" color="text.secondary">
                            Due: {new Date(milestone.dueDate).toLocaleDateString()}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Milestone Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingMilestone ? 'Edit Milestone' : 'Add New Milestone'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
            label="Due Date"
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
            required
          />
          <TextField
            fullWidth
            label="Order"
            type="number"
            value={formData.order}
            onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
            margin="normal"
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveMilestone} variant="contained">
            {editingMilestone ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* AI Generate Milestones Dialog */}
      <Dialog open={openAIDialog} onClose={() => setOpenAIDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <AutoAwesomeIcon color="primary" />
            AI-Powered Milestone Generation
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Use AI to automatically generate milestone suggestions based on your syllabus.
          </Alert>
          <TextField
            fullWidth
            label="Syllabus ID"
            value={aiFormData.syllabusId}
            onChange={(e) => setAIFormData({ ...aiFormData, syllabusId: e.target.value })}
            margin="normal"
            helperText="Enter the syllabus ID to generate contextual milestones"
          />
          <TextField
            fullWidth
            label="Number of Milestones"
            type="number"
            value={aiFormData.numberOfMilestones}
            onChange={(e) => setAIFormData({ ...aiFormData, numberOfMilestones: parseInt(e.target.value) })}
            margin="normal"
            inputProps={{ min: 1, max: 10 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAIDialog(false)} disabled={aiLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerateMilestones}
            variant="contained"
            disabled={aiLoading}
            startIcon={aiLoading ? <CircularProgress size={20} /> : <AutoAwesomeIcon />}
          >
            {aiLoading ? 'Generating...' : 'Generate with AI'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
