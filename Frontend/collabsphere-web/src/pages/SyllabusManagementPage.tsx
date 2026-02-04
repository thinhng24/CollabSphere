import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  Tooltip,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  MenuBook as BookIcon
} from '@mui/icons-material';
import StatCard from '../components/StatCard';

interface Milestone {
  order: number;
  title: string;
  description: string;
  duration: string;
}

interface Syllabus {
  id: string;
  subjectCode: string;
  subjectName: string;
  version: string;
  objectives: string;
  outcomeStandards: string;
  milestones: Milestone[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

const SyllabusManagementPage: React.FC = () => {
  const [syllabi, setSyllabi] = useState<Syllabus[]>([]);
  const [selectedSyllabus, setSelectedSyllabus] = useState<Syllabus | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<Partial<Syllabus>>({
    subjectCode: '',
    subjectName: '',
    version: '1.0',
    objectives: '',
    outcomeStandards: '',
    milestones: []
  });

  const [newMilestone, setNewMilestone] = useState<Milestone>({
    order: 1,
    title: '',
    description: '',
    duration: ''
  });

  useEffect(() => {
    loadSyllabi();
  }, []);

  const loadSyllabi = async () => {
    try {
      // TODO: Implement API call
      // Mock data for now
      const mockSyllabi: Syllabus[] = [
        {
          id: '1',
          subjectCode: 'CS101',
          subjectName: 'Introduction to Programming',
          version: '2.0',
          objectives: 'Learn fundamental programming concepts, data structures, and algorithms',
          outcomeStandards: 'Students can write, debug, and test basic programs',
          milestones: [
            { order: 1, title: 'Setup Development Environment', description: 'Install IDE and learn basics', duration: '1 week' },
            { order: 2, title: 'Basic Syntax & Variables', description: 'Learn variables, data types, operators', duration: '2 weeks' },
            { order: 3, title: 'Control Flow', description: 'If statements, loops, functions', duration: '2 weeks' },
            { order: 4, title: 'Final Project', description: 'Build a complete program', duration: '2 weeks' }
          ],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-15'),
          isActive: true
        },
        {
          id: '2',
          subjectCode: 'CS202',
          subjectName: 'Data Structures',
          version: '1.5',
          objectives: 'Master advanced data structures and algorithm design',
          outcomeStandards: 'Students can implement and analyze complex data structures',
          milestones: [
            { order: 1, title: 'Arrays & Linked Lists', description: 'Linear data structures', duration: '2 weeks' },
            { order: 2, title: 'Trees & Graphs', description: 'Hierarchical structures', duration: '3 weeks' },
            { order: 3, title: 'Algorithm Analysis', description: 'Big O notation and optimization', duration: '2 weeks' }
          ],
          createdAt: new Date('2023-12-15'),
          updatedAt: new Date('2024-01-10'),
          isActive: true
        }
      ];
      setSyllabi(mockSyllabi);
    } catch (err) {
      setError('Failed to load syllabi');
      console.error(err);
    }
  };

  const handleOpenDialog = (syllabus?: Syllabus) => {
    if (syllabus) {
      setIsEditing(true);
      setSelectedSyllabus(syllabus);
      setFormData(syllabus);
    } else {
      setIsEditing(false);
      setSelectedSyllabus(null);
      setFormData({
        subjectCode: '',
        subjectName: '',
        version: '1.0',
        objectives: '',
        outcomeStandards: '',
        milestones: []
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedSyllabus(null);
    setNewMilestone({ order: 1, title: '', description: '', duration: '' });
  };

  const handleSave = async () => {
    try {
      // TODO: Implement API call
      if (isEditing) {
        const updated = syllabi.map(s =>
          s.id === selectedSyllabus?.id ? { ...formData, id: s.id, createdAt: s.createdAt, updatedAt: new Date(), isActive: true } as Syllabus : s
        );
        setSyllabi(updated);
        setSuccess('Syllabus updated successfully');
      } else {
        const newSyllabus: Syllabus = {
          ...formData as Syllabus,
          id: Date.now().toString(),
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true
        };
        setSyllabi([...syllabi, newSyllabus]);
        setSuccess('Syllabus created successfully');
      }
      handleCloseDialog();
    } catch (err) {
      setError('Failed to save syllabus');
      console.error(err);
    }
  };

  const handleDelete = async () => {
    try {
      // TODO: Implement API call
      setSyllabi(syllabi.filter(s => s.id !== selectedSyllabus?.id));
      setSuccess('Syllabus deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedSyllabus(null);
    } catch (err) {
      setError('Failed to delete syllabus');
      console.error(err);
    }
  };

  const handleAddMilestone = () => {
    if (!newMilestone.title || !newMilestone.description) {
      setError('Please fill in milestone title and description');
      return;
    }

    const milestones = formData.milestones || [];
    const updatedMilestones = [
      ...milestones,
      { ...newMilestone, order: milestones.length + 1 }
    ];

    setFormData({ ...formData, milestones: updatedMilestones });
    setNewMilestone({ order: updatedMilestones.length + 1, title: '', description: '', duration: '' });
    setError('');
  };

  const handleRemoveMilestone = (index: number) => {
    const milestones = formData.milestones || [];
    const updated = milestones.filter((_, i) => i !== index).map((m, i) => ({ ...m, order: i + 1 }));
    setFormData({ ...formData, milestones: updated });
  };

  const stats = {
    total: syllabi.length,
    active: syllabi.filter(s => s.isActive).length,
    totalMilestones: syllabi.reduce((sum, s) => sum + s.milestones.length, 0)
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        Syllabus Management
      </Typography>

      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <StatCard
            title="Total Syllabi"
            value={stats.total}
            icon={<BookIcon />}
            color="#3b82f6"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard
            title="Active"
            value={stats.active}
            icon={<BookIcon />}
            color="#10b981"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard
            title="Total Milestones"
            value={stats.totalMilestones}
            icon={<BookIcon />}
            color="#8b5cf6"
          />
        </Grid>
      </Grid>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">All Syllabi</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Create Syllabus
        </Button>
      </Box>

      {/* Syllabi Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell>Subject Code</TableCell>
              <TableCell>Subject Name</TableCell>
              <TableCell>Version</TableCell>
              <TableCell>Milestones</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Updated</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {syllabi.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No syllabi found. Create your first syllabus!
                </TableCell>
              </TableRow>
            ) : (
              syllabi.map((syllabus) => (
                <TableRow key={syllabus.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {syllabus.subjectCode}
                    </Typography>
                  </TableCell>
                  <TableCell>{syllabus.subjectName}</TableCell>
                  <TableCell>
                    <Chip label={`v${syllabus.version}`} size="small" />
                  </TableCell>
                  <TableCell>{syllabus.milestones.length} milestones</TableCell>
                  <TableCell>
                    <Chip
                      label={syllabus.isActive ? 'Active' : 'Inactive'}
                      color={syllabus.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(syllabus.updatedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedSyllabus(syllabus);
                          setViewDialogOpen(true);
                        }}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenDialog(syllabus)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          setSelectedSyllabus(syllabus);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{isEditing ? 'Edit Syllabus' : 'Create New Syllabus'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Subject Code"
                value={formData.subjectCode}
                onChange={(e) => setFormData({ ...formData, subjectCode: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Version"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Subject Name"
                value={formData.subjectName}
                onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Objectives"
                value={formData.objectives}
                onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
                multiline
                rows={3}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Outcome Standards"
                value={formData.outcomeStandards}
                onChange={(e) => setFormData({ ...formData, outcomeStandards: e.target.value })}
                multiline
                rows={2}
                required
              />
            </Grid>

            {/* Milestones Section */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Milestones ({formData.milestones?.length || 0})
              </Typography>
            </Grid>

            {formData.milestones && formData.milestones.length > 0 && (
              <Grid item xs={12}>
                <List>
                  {formData.milestones.map((milestone, index) => (
                    <ListItem
                      key={index}
                      secondaryAction={
                        <IconButton edge="end" onClick={() => handleRemoveMilestone(index)}>
                          <DeleteIcon />
                        </IconButton>
                      }
                    >
                      <ListItemText
                        primary={`${milestone.order}. ${milestone.title}`}
                        secondary={`${milestone.description} • Duration: ${milestone.duration}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Grid>
            )}

            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Add New Milestone
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Milestone Title"
                value={newMilestone.title}
                onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                size="small"
              />
            </Grid>
            <Grid item xs={8}>
              <TextField
                fullWidth
                label="Description"
                value={newMilestone.description}
                onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                size="small"
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Duration"
                value={newMilestone.duration}
                onChange={(e) => setNewMilestone({ ...newMilestone, duration: e.target.value })}
                placeholder="e.g., 2 weeks"
                size="small"
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddMilestone}
                fullWidth
              >
                Add Milestone
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!formData.subjectCode || !formData.subjectName || !formData.objectives}
          >
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Syllabus Details</DialogTitle>
        <DialogContent>
          {selectedSyllabus && (
            <Box sx={{ pt: 2 }}>
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {selectedSyllabus.subjectCode} - {selectedSyllabus.subjectName}
                  </Typography>
                  <Chip label={`Version ${selectedSyllabus.version}`} size="small" sx={{ mb: 2 }} />

                  <Typography variant="subtitle2" color="text.secondary">Objectives</Typography>
                  <Typography variant="body2" paragraph>
                    {selectedSyllabus.objectives}
                  </Typography>

                  <Typography variant="subtitle2" color="text.secondary">Outcome Standards</Typography>
                  <Typography variant="body2">
                    {selectedSyllabus.outcomeStandards}
                  </Typography>
                </CardContent>
              </Card>

              <Typography variant="h6" gutterBottom>
                Milestones ({selectedSyllabus.milestones.length})
              </Typography>
              <List>
                {selectedSyllabus.milestones.map((milestone, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemText
                        primary={`${milestone.order}. ${milestone.title}`}
                        secondary={
                          <>
                            <Typography variant="body2" component="span" display="block">
                              {milestone.description}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Duration: {milestone.duration}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                    {index < selectedSyllabus.milestones.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Syllabus</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the syllabus for "{selectedSyllabus?.subjectName}"?
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

export default SyllabusManagementPage;
