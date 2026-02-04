import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Checkbox,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Assignment as AssignIcon,
  School as SchoolIcon,
  Folder as ProjectIcon,
  Search as SearchIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import StatCard from '../components/StatCard';

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  createdBy: string;
}

interface Class {
  id: string;
  code: string;
  name: string;
  semester: string;
  assignedProjects: string[];
}

const AssignProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [searchProject, setSearchProject] = useState('');
  const [searchClass, setSearchClass] = useState('');

  useEffect(() => {
    loadProjects();
    loadClasses();
  }, []);

  const loadProjects = async () => {
    try {
      // TODO: Implement API call
      const mockProjects: Project[] = [
        {
          id: '1',
          name: 'E-Commerce Platform',
          description: 'Build a full-stack e-commerce application',
          status: 'Approved',
          createdBy: 'Prof. Johnson'
        },
        {
          id: '2',
          name: 'Mobile App Development',
          description: 'Create a cross-platform mobile application',
          status: 'Approved',
          createdBy: 'Prof. Smith'
        },
        {
          id: '3',
          name: 'AI Chatbot System',
          description: 'Develop an intelligent chatbot using NLP',
          status: 'Approved',
          createdBy: 'Prof. Wilson'
        },
        {
          id: '4',
          name: 'Data Analytics Dashboard',
          description: 'Build a real-time analytics dashboard',
          status: 'Approved',
          createdBy: 'Prof. Brown'
        }
      ];
      setProjects(mockProjects);
    } catch (err) {
      setError('Failed to load projects');
      console.error(err);
    }
  };

  const loadClasses = async () => {
    try {
      // TODO: Implement API call
      const mockClasses: Class[] = [
        {
          id: '1',
          code: 'CS101-01',
          name: 'Introduction to Programming',
          semester: 'Fall 2024',
          assignedProjects: ['1']
        },
        {
          id: '2',
          code: 'CS101-02',
          name: 'Introduction to Programming',
          semester: 'Fall 2024',
          assignedProjects: []
        },
        {
          id: '3',
          code: 'CS202-01',
          name: 'Data Structures',
          semester: 'Fall 2024',
          assignedProjects: ['2']
        },
        {
          id: '4',
          code: 'CS303-01',
          name: 'Software Engineering',
          semester: 'Fall 2024',
          assignedProjects: []
        },
        {
          id: '5',
          code: 'CS404-01',
          name: 'Artificial Intelligence',
          semester: 'Fall 2024',
          assignedProjects: ['3']
        }
      ];
      setClasses(mockClasses);
    } catch (err) {
      setError('Failed to load classes');
      console.error(err);
    }
  };

  const handleOpenDialog = (project: Project) => {
    setSelectedProject(project);
    const assignedClasses = classes
      .filter(c => c.assignedProjects.includes(project.id))
      .map(c => c.id);
    setSelectedClasses(assignedClasses);
    setDialogOpen(true);
  };

  const handleToggleClass = (classId: string) => {
    setSelectedClasses(prev =>
      prev.includes(classId)
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  const handleAssign = async () => {
    if (!selectedProject) return;

    try {
      // TODO: Implement API call
      const updatedClasses = classes.map(cls => {
        if (selectedClasses.includes(cls.id)) {
          // Add project if not already assigned
          if (!cls.assignedProjects.includes(selectedProject.id)) {
            return {
              ...cls,
              assignedProjects: [...cls.assignedProjects, selectedProject.id]
            };
          }
        } else {
          // Remove project if it was assigned
          return {
            ...cls,
            assignedProjects: cls.assignedProjects.filter(id => id !== selectedProject.id)
          };
        }
        return cls;
      });

      setClasses(updatedClasses);
      setSuccess(`Project "${selectedProject.name}" assigned to ${selectedClasses.length} class(es)`);
      setDialogOpen(false);
      setSelectedProject(null);
      setSelectedClasses([]);
    } catch (err) {
      setError('Failed to assign project');
      console.error(err);
    }
  };

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchProject.toLowerCase()) ||
    p.description.toLowerCase().includes(searchProject.toLowerCase())
  );

  const filteredClasses = classes.filter(c =>
    c.code.toLowerCase().includes(searchClass.toLowerCase()) ||
    c.name.toLowerCase().includes(searchClass.toLowerCase())
  );

  const stats = {
    totalProjects: projects.length,
    totalClasses: classes.length,
    assignedCount: classes.reduce((sum, c) => sum + c.assignedProjects.length, 0),
    unassignedClasses: classes.filter(c => c.assignedProjects.length === 0).length
  };

  const getProjectName = (projectId: string) => {
    return projects.find(p => p.id === projectId)?.name || 'Unknown';
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        Assign Projects to Classes
      </Typography>

      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Approved Projects"
            value={stats.totalProjects}
            icon={<ProjectIcon />}
            color="#3b82f6"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Classes"
            value={stats.totalClasses}
            icon={<SchoolIcon />}
            color="#10b981"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Assignments Made"
            value={stats.assignedCount}
            icon={<AssignIcon />}
            color="#8b5cf6"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Unassigned Classes"
            value={stats.unassignedClasses}
            icon={<SchoolIcon />}
            color="#f59e0b"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Projects Column */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Approved Projects
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="Search projects..."
              value={searchProject}
              onChange={(e) => setSearchProject(e.target.value)}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />

            <Box sx={{ maxHeight: 600, overflowY: 'auto' }}>
              {filteredProjects.length === 0 ? (
                <Typography color="text.secondary" align="center" py={4}>
                  No approved projects found
                </Typography>
              ) : (
                filteredProjects.map((project) => {
                  const assignedCount = classes.filter(c =>
                    c.assignedProjects.includes(project.id)
                  ).length;

                  return (
                    <Card key={project.id} sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {project.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {project.description}
                        </Typography>
                        <Box display="flex" gap={1} mb={1}>
                          <Chip
                            label={project.status}
                            color="success"
                            size="small"
                          />
                          <Chip
                            label={`${assignedCount} classes`}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          Created by: {project.createdBy}
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button
                          size="small"
                          startIcon={<AssignIcon />}
                          onClick={() => handleOpenDialog(project)}
                        >
                          Assign to Classes
                        </Button>
                      </CardActions>
                    </Card>
                  );
                })
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Classes Column */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Classes Overview
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="Search classes..."
              value={searchClass}
              onChange={(e) => setSearchClass(e.target.value)}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />

            <Box sx={{ maxHeight: 600, overflowY: 'auto' }}>
              {filteredClasses.length === 0 ? (
                <Typography color="text.secondary" align="center" py={4}>
                  No classes found
                </Typography>
              ) : (
                filteredClasses.map((cls) => (
                  <Card key={cls.id} sx={{ mb: 2 }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                        <Box>
                          <Typography variant="h6">
                            {cls.code}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {cls.name}
                          </Typography>
                        </Box>
                        <Chip
                          label={cls.semester}
                          size="small"
                          variant="outlined"
                        />
                      </Box>

                      {cls.assignedProjects.length > 0 ? (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="caption" color="text.secondary" gutterBottom>
                            Assigned Projects:
                          </Typography>
                          {cls.assignedProjects.map(projectId => (
                            <Chip
                              key={projectId}
                              label={getProjectName(projectId)}
                              size="small"
                              color="primary"
                              sx={{ mr: 0.5, mt: 0.5 }}
                            />
                          ))}
                        </Box>
                      ) : (
                        <Alert severity="warning" sx={{ mt: 1 }}>
                          No project assigned yet
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Assignment Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Assign Project: {selectedProject?.name}
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Select the classes you want to assign this project to. You can assign to multiple classes.
          </Alert>

          <Typography variant="subtitle2" gutterBottom>
            Select Classes ({selectedClasses.length} selected)
          </Typography>

          <List>
            {classes.map((cls) => (
              <React.Fragment key={cls.id}>
                <ListItem
                  dense
                  button
                  onClick={() => handleToggleClass(cls.id)}
                >
                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      checked={selectedClasses.includes(cls.id)}
                      tabIndex={-1}
                      disableRipple
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${cls.code} - ${cls.name}`}
                    secondary={
                      <>
                        {cls.semester}
                        {cls.assignedProjects.length > 0 && (
                          <Chip
                            label={`${cls.assignedProjects.length} project(s)`}
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </>
                    }
                  />
                  {cls.assignedProjects.includes(selectedProject?.id || '') && (
                    <CheckIcon color="success" />
                  )}
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAssign}
            disabled={selectedClasses.length === 0}
            startIcon={<AssignIcon />}
          >
            Assign to {selectedClasses.length} Class(es)
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AssignProjectsPage;
