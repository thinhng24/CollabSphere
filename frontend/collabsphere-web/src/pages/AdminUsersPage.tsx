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
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Avatar,
  Tooltip,
  TablePagination
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FilterListIcon from '@mui/icons-material/FilterList';
import { User } from '../types';
import { usersAPI } from '../services/api';

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'activate' | 'deactivate'>('deactivate');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, search, roleFilter, statusFilter]);

  const loadUsers = async () => {
    try {
      const response = await usersAPI.getAll();
      setUsers(response.data.data?.items || []);
    } catch {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        u => u.fullName.toLowerCase().includes(searchLower) ||
             u.email.toLowerCase().includes(searchLower)
      );
    }

    if (roleFilter !== 'All') {
      filtered = filtered.filter(u => u.role === roleFilter);
    }

    if (statusFilter !== 'All') {
      filtered = filtered.filter(u =>
        statusFilter === 'Active' ? u.isActive : !u.isActive
      );
    }

    setFilteredUsers(filtered);
  };

  const handleToggleStatus = async () => {
    if (!selectedUser) return;
    try {
      if (actionType === 'deactivate') {
        await usersAPI.deactivate(selectedUser.id);
        setSuccess(`User ${selectedUser.fullName} has been deactivated`);
      } else {
        await usersAPI.activate(selectedUser.id);
        setSuccess(`User ${selectedUser.fullName} has been activated`);
      }
      loadUsers();
    } catch {
      setError('Failed to update user status');
    } finally {
      setConfirmDialogOpen(false);
      setSelectedUser(null);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'error';
      case 'Staff': return 'warning';
      case 'HeadDepartment': return 'secondary';
      case 'Lecturer': return 'primary';
      case 'Student': return 'success';
      default: return 'default';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'HeadDepartment': return 'Head Dept';
      default: return role;
    }
  };

  const stats = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    admins: users.filter(u => u.role === 'Admin').length,
    staff: users.filter(u => u.role === 'Staff').length,
    headDept: users.filter(u => u.role === 'HeadDepartment').length,
    lecturers: users.filter(u => u.role === 'Lecturer').length,
    students: users.filter(u => u.role === 'Student').length,
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        User Management
      </Typography>

      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Stats */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Paper sx={{ p: 2, minWidth: 120, textAlign: 'center' }}>
          <Typography variant="h4" color="primary">{stats.total}</Typography>
          <Typography variant="body2" color="text.secondary">Total Users</Typography>
        </Paper>
        <Paper sx={{ p: 2, minWidth: 120, textAlign: 'center' }}>
          <Typography variant="h4" color="success.main">{stats.active}</Typography>
          <Typography variant="body2" color="text.secondary">Active</Typography>
        </Paper>
        <Paper sx={{ p: 2, minWidth: 100, textAlign: 'center' }}>
          <Typography variant="h5" color="error.main">{stats.admins}</Typography>
          <Typography variant="body2" color="text.secondary">Admins</Typography>
        </Paper>
        <Paper sx={{ p: 2, minWidth: 100, textAlign: 'center' }}>
          <Typography variant="h5" color="warning.main">{stats.staff}</Typography>
          <Typography variant="body2" color="text.secondary">Staff</Typography>
        </Paper>
        <Paper sx={{ p: 2, minWidth: 100, textAlign: 'center' }}>
          <Typography variant="h5" color="secondary.main">{stats.headDept}</Typography>
          <Typography variant="body2" color="text.secondary">Head Dept</Typography>
        </Paper>
        <Paper sx={{ p: 2, minWidth: 100, textAlign: 'center' }}>
          <Typography variant="h5" color="primary.main">{stats.lecturers}</Typography>
          <Typography variant="body2" color="text.secondary">Lecturers</Typography>
        </Paper>
        <Paper sx={{ p: 2, minWidth: 100, textAlign: 'center' }}>
          <Typography variant="h5" color="success.main">{stats.students}</Typography>
          <Typography variant="body2" color="text.secondary">Students</Typography>
        </Paper>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <FilterListIcon color="action" />
          <TextField
            size="small"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 250 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Role</InputLabel>
            <Select
              value={roleFilter}
              label="Role"
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <MenuItem value="All">All Roles</MenuItem>
              <MenuItem value="Admin">Admin</MenuItem>
              <MenuItem value="Staff">Staff</MenuItem>
              <MenuItem value="HeadDepartment">Head Dept</MenuItem>
              <MenuItem value="Lecturer">Lecturer</MenuItem>
              <MenuItem value="Student">Student</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="All">All</MenuItem>
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Users Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell>User</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">Loading...</TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">No users found</TableCell>
              </TableRow>
            ) : (
              filteredUsers
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
                          {user.fullName.charAt(0)}
                        </Avatar>
                        <Typography variant="body2" fontWeight={500}>
                          {user.fullName}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={getRoleLabel(user.role)}
                        color={getRoleColor(user.role) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{user.department || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.isActive ? 'Active' : 'Inactive'}
                        color={user.isActive ? 'success' : 'default'}
                        size="small"
                        variant={user.isActive ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedUser(user);
                            setViewDialogOpen(true);
                          }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {user.role !== 'Admin' && (
                        <Tooltip title={user.isActive ? 'Deactivate' : 'Activate'}>
                          <IconButton
                            size="small"
                            color={user.isActive ? 'error' : 'success'}
                            onClick={() => {
                              setSelectedUser(user);
                              setActionType(user.isActive ? 'deactivate' : 'activate');
                              setConfirmDialogOpen(true);
                            }}
                          >
                            {user.isActive ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredUsers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>

      {/* View User Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>User Details</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ pt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: '1.5rem' }}>
                  {selectedUser.fullName.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h6">{selectedUser.fullName}</Typography>
                  <Chip
                    label={getRoleLabel(selectedUser.role)}
                    color={getRoleColor(selectedUser.role) as any}
                    size="small"
                  />
                </Box>
              </Box>
              <Box sx={{ display: 'grid', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Email</Typography>
                  <Typography>{selectedUser.email}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Department</Typography>
                  <Typography>{selectedUser.department || 'Not specified'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                  <Typography>
                    <Chip
                      label={selectedUser.isActive ? 'Active' : 'Inactive'}
                      color={selectedUser.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Created At</Typography>
                  <Typography>{new Date(selectedUser.createdAt).toLocaleString()}</Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>
          {actionType === 'deactivate' ? 'Deactivate User' : 'Activate User'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to {actionType} user "{selectedUser?.fullName}"?
          </Typography>
          {actionType === 'deactivate' && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              The user will not be able to access the system until reactivated.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color={actionType === 'deactivate' ? 'error' : 'success'}
            onClick={handleToggleStatus}
          >
            {actionType === 'deactivate' ? 'Deactivate' : 'Activate'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminUsersPage;
