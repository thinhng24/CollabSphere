import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Alert,
  Card,
  CardContent,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Tabs,
  Tab
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import GroupIcon from '@mui/icons-material/Group';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SchoolIcon from '@mui/icons-material/School';
import { Class, Subject, User, ClassMember } from '../types';
import { classesAPI, subjectsAPI, usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ClassesPage: React.FC = () => {
  const { isStaff, isLecturer, user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [lecturers, setLecturers] = useState<User[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [classMembers, setClassMembers] = useState<ClassMember[]>([]);
  const [membersTab, setMembersTab] = useState(0);

  // Form states
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    subjectId: '',
    semester: 'Fall',
    academicYear: '2024-2025',
    maxStudents: 30,
    schedule: '',
    room: ''
  });
  const [selectedLecturer, setSelectedLecturer] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [classesRes, subjectsRes, usersRes] = await Promise.all([
        isLecturer() ? classesAPI.getByLecturer(user?.id) : classesAPI.getAll(),
        subjectsAPI.getAll(),
        usersAPI.getAll()
      ]);
      setClasses(classesRes.data.data?.items || []);
      setSubjects(subjectsRes.data.data?.items || []);
      const allUsers = usersRes.data.data?.items || [];
      setLecturers(allUsers.filter((u: User) => u.role === 'Lecturer'));
      setStudents(allUsers.filter((u: User) => u.role === 'Student'));
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const subject = subjects.find(s => s.id === formData.subjectId);
      await classesAPI.create({
        ...formData,
        subjectName: subject?.name
      });
      setSuccess('Class created successfully!');
      setCreateDialogOpen(false);
      resetForm();
      loadData();
    } catch {
      setError('Failed to create class');
    }
  };

  const handleAssignLecturer = async () => {
    if (!selectedClass || !selectedLecturer) return;
    try {
      await classesAPI.assignLecturer(selectedClass.id, selectedLecturer);
      setSuccess('Lecturer assigned successfully!');
      setAssignDialogOpen(false);
      loadData();
    } catch {
      setError('Failed to assign lecturer');
    }
  };

  const handleAddStudents = async () => {
    if (!selectedClass || selectedStudents.length === 0) return;
    try {
      for (const studentId of selectedStudents) {
        await classesAPI.addMember(selectedClass.id, studentId, 'Student');
      }
      setSuccess(`${selectedStudents.length} students added successfully!`);
      setSelectedStudents([]);
      loadClassMembers(selectedClass.id);
    } catch {
      setError('Failed to add students');
    }
  };

  const loadClassMembers = async (classId: string) => {
    try {
      const response = await classesAPI.getMembers(classId);
      setClassMembers(response.data.data?.items || []);
    } catch {
      setError('Failed to load class members');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      subjectId: '',
      semester: 'Fall',
      academicYear: '2024-2025',
      maxStudents: 30,
      schedule: '',
      room: ''
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Completed': return 'default';
      case 'Cancelled': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Classes Management
        </Typography>
        {isStaff() && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Class
          </Button>
        )}
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">{classes.length}</Typography>
              <Typography variant="body2" color="text.secondary">Total Classes</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                {classes.filter(c => c.status === 'Active').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">Active</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main">
                {classes.reduce((acc, c) => acc + c.studentCount, 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">Total Students</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="secondary.main">
                {new Set(classes.map(c => c.lecturerId).filter(Boolean)).size}
              </Typography>
              <Typography variant="body2" color="text.secondary">Lecturers</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Classes Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell>Class Code</TableCell>
              <TableCell>Class Name</TableCell>
              <TableCell>Subject</TableCell>
              <TableCell>Lecturer</TableCell>
              <TableCell>Students</TableCell>
              <TableCell>Schedule</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">Loading...</TableCell>
              </TableRow>
            ) : classes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">No classes found</TableCell>
              </TableRow>
            ) : (
              classes.map((cls) => (
                <TableRow key={cls.id} hover>
                  <TableCell>
                    <Typography fontWeight={500}>{cls.code}</Typography>
                  </TableCell>
                  <TableCell>{cls.name}</TableCell>
                  <TableCell>{cls.subjectName || '-'}</TableCell>
                  <TableCell>
                    {cls.lecturerName ? (
                      <Chip
                        avatar={<Avatar>{cls.lecturerName.charAt(0)}</Avatar>}
                        label={cls.lecturerName}
                        size="small"
                        variant="outlined"
                      />
                    ) : (
                      <Chip label="Not assigned" size="small" color="warning" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {cls.studentCount} / {cls.maxStudents}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{cls.schedule}</Typography>
                    <Typography variant="caption" color="text.secondary">{cls.room}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={cls.status}
                      color={getStatusColor(cls.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Members">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedClass(cls);
                          loadClassMembers(cls.id);
                          setMembersDialogOpen(true);
                        }}
                      >
                        <GroupIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {isStaff() && (
                      <>
                        <Tooltip title="Assign Lecturer">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => {
                              setSelectedClass(cls);
                              setSelectedLecturer(cls.lecturerId || '');
                              setAssignDialogOpen(true);
                            }}
                          >
                            <SchoolIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small">
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Class Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Class</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Class Code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="CS101-01"
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Subject</InputLabel>
                <Select
                  value={formData.subjectId}
                  label="Subject"
                  onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                >
                  {subjects.map(s => (
                    <MenuItem key={s.id} value={s.id}>{s.code} - {s.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Class Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Semester</InputLabel>
                <Select
                  value={formData.semester}
                  label="Semester"
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                >
                  <MenuItem value="Fall">Fall</MenuItem>
                  <MenuItem value="Spring">Spring</MenuItem>
                  <MenuItem value="Summer">Summer</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Academic Year"
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Max Students"
                type="number"
                value={formData.maxStudents}
                onChange={(e) => setFormData({ ...formData, maxStudents: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Room"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Schedule"
                value={formData.schedule}
                onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                placeholder="Mon/Wed 9:00-10:30"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* Class Members Dialog */}
      <Dialog open={membersDialogOpen} onClose={() => setMembersDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedClass?.name} - Members
        </DialogTitle>
        <DialogContent>
          <Tabs value={membersTab} onChange={(_, v) => setMembersTab(v)} sx={{ mb: 2 }}>
            <Tab label={`Students (${classMembers.filter(m => m.role === 'Student').length})`} />
            <Tab label="Add Students" />
          </Tabs>

          {membersTab === 0 && (
            <List>
              {classMembers.filter(m => m.role === 'Student').length === 0 ? (
                <ListItem>
                  <ListItemText primary="No students in this class" />
                </ListItem>
              ) : (
                classMembers.filter(m => m.role === 'Student').map((member) => (
                  <ListItem key={member.id}>
                    <ListItemAvatar>
                      <Avatar>{member.userFullName.charAt(0)}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={member.userFullName}
                      secondary={member.userEmail}
                    />
                  </ListItem>
                ))
              )}
            </List>
          )}

          {membersTab === 1 && isStaff() && (
            <Box>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Select Students</InputLabel>
                <Select
                  multiple
                  value={selectedStudents}
                  label="Select Students"
                  onChange={(e) => setSelectedStudents(e.target.value as string[])}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((id) => {
                        const student = students.find(s => s.id === id);
                        return <Chip key={id} label={student?.fullName} size="small" />;
                      })}
                    </Box>
                  )}
                >
                  {students
                    .filter(s => !classMembers.some(m => m.userId === s.id))
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
                onClick={handleAddStudents}
                disabled={selectedStudents.length === 0}
              >
                Add Selected Students
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMembersDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Assign Lecturer Dialog */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Lecturer to {selectedClass?.name}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Select Lecturer</InputLabel>
            <Select
              value={selectedLecturer}
              label="Select Lecturer"
              onChange={(e) => setSelectedLecturer(e.target.value)}
            >
              {lecturers.map(lecturer => (
                <MenuItem key={lecturer.id} value={lecturer.id}>
                  {lecturer.fullName} ({lecturer.email})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAssignLecturer}>Assign</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClassesPage;
