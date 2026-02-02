import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  IconButton,
  Chip,
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
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DescriptionIcon from '@mui/icons-material/Description';
import SlideshowIcon from '@mui/icons-material/Slideshow';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import LinkIcon from '@mui/icons-material/Link';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import FolderIcon from '@mui/icons-material/Folder';
import { Resource, Class, Team } from '../types';
import { resourcesAPI, classesAPI, teamsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ResourcesPage: React.FC = () => {
  const { user, isLecturer, isStudent } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [tab, setTab] = useState(0);

  // Dialog states
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'Document' as Resource['type'],
    url: '',
    classId: '',
    teamId: ''
  });

  // Filter states
  const [filterClassId, setFilterClassId] = useState<string>('');
  const [filterTeamId, setFilterTeamId] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [classesRes, teamsRes] = await Promise.all([
        classesAPI.getAll(),
        isStudent() ? teamsAPI.getByStudent(user?.id) : teamsAPI.getAll()
      ]);
      setClasses(classesRes.data.data?.items || []);
      setTeams(teamsRes.data.data?.items || []);

      // Load resources based on context
      const allResources: Resource[] = [];
      const classItems = classesRes.data.data?.items || [];
      const teamItems = teamsRes.data.data?.items || [];

      for (const cls of classItems.slice(0, 3)) {
        const res = await resourcesAPI.getByClass(cls.id);
        allResources.push(...(res.data.data?.items || []));
      }
      for (const team of teamItems.slice(0, 3)) {
        const res = await resourcesAPI.getByTeam(team.id);
        allResources.push(...(res.data.data?.items || []));
      }
      setResources(allResources);
    } catch {
      setError('Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!user) return;
    try {
      await resourcesAPI.upload({
        ...formData,
        uploadedBy: user.id,
        uploadedByName: user.fullName
      });
      setSuccess('Resource uploaded successfully!');
      setUploadDialogOpen(false);
      resetForm();
      loadData();
    } catch {
      setError('Failed to upload resource');
    }
  };

  const handleDelete = async (resourceId: string) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return;
    try {
      await resourcesAPI.delete(resourceId);
      setSuccess('Resource deleted successfully!');
      loadData();
    } catch {
      setError('Failed to delete resource');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'Document',
      url: '',
      classId: '',
      teamId: ''
    });
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'Document': return <DescriptionIcon color="primary" />;
      case 'Slide': return <SlideshowIcon color="warning" />;
      case 'Video': return <VideoLibraryIcon color="error" />;
      case 'Link': return <LinkIcon color="info" />;
      default: return <InsertDriveFileIcon />;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const classResources = resources.filter(r => r.classId);
  const teamResources = resources.filter(r => r.teamId);

  const filteredClassResources = filterClassId
    ? classResources.filter(r => r.classId === filterClassId)
    : classResources;

  const filteredTeamResources = filterTeamId
    ? teamResources.filter(r => r.teamId === filterTeamId)
    : teamResources;

  if (loading) {
    return <Box sx={{ p: 3 }}><Typography>Loading resources...</Typography></Box>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Resources
        </Typography>
        <Button
          variant="contained"
          startIcon={<CloudUploadIcon />}
          onClick={() => setUploadDialogOpen(true)}
        >
          Upload Resource
        </Button>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <FolderIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4">{resources.length}</Typography>
              <Typography variant="body2" color="text.secondary">Total Resources</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <DescriptionIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h4">{resources.filter(r => r.type === 'Document').length}</Typography>
              <Typography variant="body2" color="text.secondary">Documents</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <SlideshowIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4">{resources.filter(r => r.type === 'Slide').length}</Typography>
              <Typography variant="body2" color="text.secondary">Presentations</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <VideoLibraryIcon sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
              <Typography variant="h4">{resources.filter(r => r.type === 'Video').length}</Typography>
              <Typography variant="body2" color="text.secondary">Videos</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label={`Class Resources (${classResources.length})`} />
          <Tab label={`Team Resources (${teamResources.length})`} />
        </Tabs>
      </Paper>

      {/* Class Resources */}
      {tab === 0 && (
        <Box>
          <Box sx={{ mb: 2 }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Filter by Class</InputLabel>
              <Select
                value={filterClassId}
                label="Filter by Class"
                onChange={(e) => setFilterClassId(e.target.value)}
              >
                <MenuItem value="">All Classes</MenuItem>
                {classes.map(cls => (
                  <MenuItem key={cls.id} value={cls.id}>{cls.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {filteredClassResources.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <FolderIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">No class resources</Typography>
            </Paper>
          ) : (
            <Paper>
              <List>
                {filteredClassResources.map((resource, index) => (
                  <React.Fragment key={resource.id}>
                    <ListItem>
                      <ListItemIcon>
                        {getFileIcon(resource.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={resource.name}
                        secondary={
                          <Box>
                            <Typography variant="body2" component="span" color="text.secondary">
                              {resource.description || 'No description'}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                              <Chip label={resource.type} size="small" variant="outlined" />
                              <Typography variant="caption" color="text.secondary">
                                {formatFileSize(resource.size)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Uploaded by {resource.uploadedByName}
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Tooltip title="Download">
                          <IconButton edge="end" href={resource.url} target="_blank">
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                        {(isLecturer() || resource.uploadedBy === user?.id) && (
                          <Tooltip title="Delete">
                            <IconButton edge="end" color="error" onClick={() => handleDelete(resource.id)}>
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < filteredClassResources.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          )}
        </Box>
      )}

      {/* Team Resources */}
      {tab === 1 && (
        <Box>
          <Box sx={{ mb: 2 }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Filter by Team</InputLabel>
              <Select
                value={filterTeamId}
                label="Filter by Team"
                onChange={(e) => setFilterTeamId(e.target.value)}
              >
                <MenuItem value="">All Teams</MenuItem>
                {teams.map(team => (
                  <MenuItem key={team.id} value={team.id}>{team.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {filteredTeamResources.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <FolderIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">No team resources</Typography>
            </Paper>
          ) : (
            <Paper>
              <List>
                {filteredTeamResources.map((resource, index) => (
                  <React.Fragment key={resource.id}>
                    <ListItem>
                      <ListItemIcon>
                        {getFileIcon(resource.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={resource.name}
                        secondary={
                          <Box>
                            <Typography variant="body2" component="span" color="text.secondary">
                              {resource.description || 'No description'}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                              <Chip label={resource.type} size="small" variant="outlined" />
                              <Typography variant="caption" color="text.secondary">
                                {formatFileSize(resource.size)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Uploaded by {resource.uploadedByName}
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Tooltip title="Download">
                          <IconButton edge="end" href={resource.url} target="_blank">
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                        {resource.uploadedBy === user?.id && (
                          <Tooltip title="Delete">
                            <IconButton edge="end" color="error" onClick={() => handleDelete(resource.id)}>
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < filteredTeamResources.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          )}
        </Box>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Resource</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Resource Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={2}
            />
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={formData.type}
                label="Type"
                onChange={(e) => setFormData({ ...formData, type: e.target.value as Resource['type'] })}
              >
                <MenuItem value="Document">Document</MenuItem>
                <MenuItem value="Slide">Presentation</MenuItem>
                <MenuItem value="Video">Video</MenuItem>
                <MenuItem value="Link">Link</MenuItem>
                <MenuItem value="File">Other File</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="URL / File Path"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://... or file path"
            />
            <FormControl fullWidth>
              <InputLabel>Upload to Class</InputLabel>
              <Select
                value={formData.classId}
                label="Upload to Class"
                onChange={(e) => setFormData({ ...formData, classId: e.target.value, teamId: '' })}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {classes.map(cls => (
                  <MenuItem key={cls.id} value={cls.id}>{cls.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Upload to Team</InputLabel>
              <Select
                value={formData.teamId}
                label="Upload to Team"
                onChange={(e) => setFormData({ ...formData, teamId: e.target.value, classId: '' })}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {teams.map(team => (
                  <MenuItem key={team.id} value={team.id}>{team.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!formData.name || (!formData.classId && !formData.teamId)}
          >
            Upload
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ResourcesPage;
