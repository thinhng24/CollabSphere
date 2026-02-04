import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
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
  ListItemAvatar,
  Avatar,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Assignment as AssignIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import StatCard from '../components/StatCard';

interface User {
  id: string;
  name: string;
  email: string;
  studentId?: string;
  department?: string;
  role: 'Lecturer' | 'Student';
}

interface Class {
  id: string;
  code: string;
  name: string;
  semester: string;
  lecturers: string[];
  students: string[];
}

const AssignUsersPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [lecturers, setLecturers] = useState<User[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const [searchClass, setSearchClass] = useState('');

  useEffect(() => {
    loadLecturers();
    loadStudents();
    loadClasses();
  }, []);

  const loadLecturers = async () => {
    try {
      // TODO: Implement API call
      const mockLecturers: User[] = [
        { id: 'l1', name: 'Prof. John Smith', email: 'john@university.edu', department: 'CS', role: 'Lecturer' },
        { id: 'l2', name: 'Dr. Jane Doe', email: 'jane@university.edu', department: 'SE', role: 'Lecturer' },
        { id: 'l3', name: 'Prof. Bob Wilson', email: 'bob@university.edu', department: 'CS', role: 'Lecturer' },
        { id: 'l4', name: 'Dr. Alice Brown', email: 'alice@university.edu', department: 'IT', role: 'Lecturer' }
      ];
      setLecturers(mockLecturers);
    } catch (err) {
      setError('Failed to load lecturers');
      console.error(err);
    }
  };

  const loadStudents = async () => {
    try {
      // TODO: Implement API call
      const mockStudents: User[] = [
        { id: 's1', name: 'Alice Johnson', email: 'alice.j@student.edu', studentId: 'ST001', role: 'Student' },
        { id: 's2', name: 'Bob Martinez', email: 'bob.m@student.edu', studentId: 'ST002', role: 'Student' },
        { id: 's3', name: 'Charlie Chen', email: 'charlie.c@student.edu', studentId: 'ST003', role: 'Student' },
        { id: 's4', name: 'Diana Lee', email: 'diana.l@student.edu', studentId: 'ST004', role: 'Student' },
        { id: 's5', name: 'Eve Taylor', email: 'eve.t@student.edu', studentId: 'ST005', role: 'Student' },
        { id: 's6', name: 'Frank Moore', email: 'frank.m@student.edu', studentId: 'ST006', role: 'Student' }
      ];
      setStudents(mockStudents);
    } catch (err) {
      setError('Failed to load students');
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
          lecturers: ['l1'],
          students: ['s1', 's2']
        },
        {
          id: '2',
          code: 'CS101-02',
          name: 'Introduction to Programming',
          semester: 'Fall 2024',
          lecturers: ['l2'],
          students: []
        },
        {
          id: '3',
          code: 'CS202-01',
          name: 'Data Structures',
          semester: 'Fall 2024',
          lecturers: [],
          students: ['s3', 's4']
        },
        {
          id: '4',
          code: 'CS303-01',
          name: 'Software Engineering',
          semester: 'Fall 2024',
          lecturers: ['l3', 'l4'],
          students: []
        }
      ];
      setClasses(mockClasses);
    } catch (err) {
      setError('Failed to load classes');
      console.error(err);
    }
  };

  const handleOpenDialog = (cls: Class) => {
    setSelectedClass(cls);
    if (tabValue === 0) {
      setSelectedUsers(cls.lecturers);
    } else {
      setSelectedUsers(cls.students);
    }
    setDialogOpen(true);
  };

  const handleToggleUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleAssign = async () => {
    if (!selectedClass) return;

    try {
      // TODO: Implement API call
      const updatedClasses = classes.map(cls => {
        if (cls.id === selectedClass.id) {
          if (tabValue === 0) {
            return { ...cls, lecturers: selectedUsers };
          } else {
            return { ...cls, students: selectedUsers };
          }
        }
        return cls;
      });

      setClasses(updatedClasses);
      const userType = tabValue === 0 ? 'lecturer(s)' : 'student(s)';
      setSuccess(`Successfully assigned ${selectedUsers.length} ${userType} to ${selectedClass.code}`);
      setDialogOpen(false);
      setSelectedClass(null);
      setSelectedUsers([]);
    } catch (err) {
      setError('Failed to assign users');
      console.error(err);
    }
  };

  const handleRemoveUser = async (classId: string, userId: string, userType: 'lecturer' | 'student') => {
    try {
      // TODO: Implement API call
      const updatedClasses = classes.map(cls => {
        if (cls.id === classId) {
          if (userType === 'lecturer') {
            return { ...cls, lecturers: cls.lecturers.filter(id => id !== userId) };
          } else {
            return { ...cls, students: cls.students.filter(id => id !== userId) };
          }
        }
        return cls;
      });

      setClasses(updatedClasses);
      setSuccess('User removed successfully');
    } catch (err) {
      setError('Failed to remove user');
      console.error(err);
    }
  };

  const currentUsers = tabValue === 0 ? lecturers : students;
  const filteredUsers = currentUsers.filter(u =>
    u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.email.toLowerCase().includes(searchUser.toLowerCase()) ||
    (u.studentId && u.studentId.toLowerCase().includes(searchUser.toLowerCase()))
  );

  const filteredClasses = classes.filter(c =>
    c.code.toLowerCase().includes(searchClass.toLowerCase()) ||
    c.name.toLowerCase().includes(searchClass.toLowerCase())
  );

  const availableUsers = filteredUsers.filter(u =>
    !classes.some(c =>
      tabValue === 0 ? c.lecturers.includes(u.id) : c.students.includes(u.id)
    )
  );

  const getUserName = (userId: string) => {
    const user = [...lecturers, ...students].find(u => u.id === userId);
    return user?.name || 'Unknown';
  };

  const stats = {
    totalLecturers: lecturers.length,
    totalStudents: students.length,
    totalClasses: classes.length,
    unassignedUsers: availableUsers.length
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        Assign Users to Classes
      </Typography>

      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Lecturers"
            value={stats.totalLecturers}
            icon={<PersonIcon />}
            color="#3b82f6"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Students"
            value={stats.totalStudents}
            icon={<PersonIcon />}
            color="#10b981"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Classes"
            value={stats.totalClasses}
            icon={<SchoolIcon />}
            color="#8b5cf6"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Unassigned"
            value={stats.unassignedUsers}
            icon={<PersonIcon />}
            color="#f59e0b"
          />
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label="Assign Lecturers" />
          <Tab label="Assign Students" />
        </Tabs>
      </Paper>

      <Grid container spacing={3}>
        {/* Users Column */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              {tabValue === 0 ? 'Lecturers' : 'Students'}
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder={`Search ${tabValue === 0 ? 'lecturers' : 'students'}...`}
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />

            <Alert severity="info" sx={{ mb: 2 }}>
              Showing {filteredUsers.length} {tabValue === 0 ? 'lecturers' : 'students'}.
              Click on a class to assign users.
            </Alert>

            <Box sx={{ maxHeight: 500, overflowY: 'auto' }}>
              <List>
                {filteredUsers.map((user) => {
                  const isAssigned = classes.some(c =>
                    tabValue === 0 ? c.lecturers.includes(user.id) : c.students.includes(user.id)
                  );

                  return (
                    <ListItem key={user.id} sx={{ bgcolor: isAssigned ? 'action.hover' : 'transparent' }}>
                      <ListItemAvatar>
                        <Avatar>{user.name.charAt(0)}</Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={user.name}
                        secondary={
                          <>
                            {user.email}
                            {user.studentId && ` • ID: ${user.studentId}`}
                            {user.department && ` • ${user.department}`}
                          </>
                        }
                      />
                      {isAssigned && (
                        <CheckIcon color="success" />
                      )}
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          </Paper>
        </Grid>

        {/* Classes Column */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Classes
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

            <Box sx={{ maxHeight: 500, overflowY: 'auto' }}>
              {filteredClasses.map((cls) => {
                const assignedUsers = tabValue === 0 ? cls.lecturers : cls.students;
                const userType = tabValue === 0 ? 'lecturer' : 'student';

                return (
                  <Card key={cls.id} sx={{ mb: 2 }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                        <Box>
                          <Typography variant="h6">{cls.code}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {cls.name}
                          </Typography>
                        </Box>
                        <Chip label={cls.semester} size="small" />
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      <Box mb={2}>
                        <Typography variant="subtitle2" gutterBottom>
                          Assigned {tabValue === 0 ? 'Lecturers' : 'Students'} ({assignedUsers.length})
                        </Typography>
                        {assignedUsers.length === 0 ? (
                          <Alert severity="warning">
                            No {tabValue === 0 ? 'lecturers' : 'students'} assigned yet
                          </Alert>
                        ) : (
                          <Box display="flex" flexWrap="wrap" gap={1}>
                            {assignedUsers.map(userId => (
                              <Chip
                                key={userId}
                                label={getUserName(userId)}
                                size="small"
                                onDelete={() => handleRemoveUser(cls.id, userId, userType as 'lecturer' | 'student')}
                                deleteIcon={<CloseIcon />}
                              />
                            ))}
                          </Box>
                        )}
                      </Box>

                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<AssignIcon />}
                        onClick={() => handleOpenDialog(cls)}
                      >
                        Manage {tabValue === 0 ? 'Lecturers' : 'Students'}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Assignment Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Assign {tabValue === 0 ? 'Lecturers' : 'Students'} to {selectedClass?.code}
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Select {tabValue === 0 ? 'lecturers' : 'students'} to assign to this class.
            You can assign multiple users at once.
          </Alert>

          <Typography variant="subtitle2" gutterBottom>
            Select Users ({selectedUsers.length} selected)
          </Typography>

          <List sx={{ maxHeight: 400, overflowY: 'auto' }}>
            {currentUsers.map((user) => (
              <ListItem
                key={user.id}
                dense
                button
                onClick={() => handleToggleUser(user.id)}
              >
                <Checkbox
                  edge="start"
                  checked={selectedUsers.includes(user.id)}
                  tabIndex={-1}
                  disableRipple
                />
                <ListItemAvatar>
                  <Avatar>{user.name.charAt(0)}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={user.name}
                  secondary={
                    <>
                      {user.email}
                      {user.studentId && ` • ${user.studentId}`}
                      {user.department && ` • ${user.department}`}
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAssign}
            startIcon={<AssignIcon />}
          >
            Assign {selectedUsers.length} User(s)
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AssignUsersPage;
