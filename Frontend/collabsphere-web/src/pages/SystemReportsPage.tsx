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
  Chip,
  IconButton,
  Button,
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
  TablePagination,
  InputAdornment
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  Report as ReportIcon
} from '@mui/icons-material';

interface SystemReport {
  id: string;
  title: string;
  description: string;
  reportedBy: string;
  reportedByEmail: string;
  category: 'Bug' | 'Feature Request' | 'User Issue' | 'Technical' | 'Other';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Pending' | 'In Progress' | 'Resolved' | 'Closed';
  createdAt: Date;
  resolvedAt?: Date;
  resolution?: string;
}

const SystemReportsPage: React.FC = () => {
  const [reports, setReports] = useState<SystemReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<SystemReport[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [selectedReport, setSelectedReport] = useState<SystemReport | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolution, setResolution] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    filterReports();
  }, [reports, search, statusFilter, categoryFilter]);

  const loadReports = async () => {
    // TODO: Implement API call to fetch reports
    // Mock data for now
    const mockReports: SystemReport[] = [
      {
        id: '1',
        title: 'Cannot upload large files',
        description: 'When trying to upload files larger than 10MB, the system times out.',
        reportedBy: 'John Doe',
        reportedByEmail: 'john@example.com',
        category: 'Technical',
        priority: 'High',
        status: 'Pending',
        createdAt: new Date('2024-01-15')
      },
      {
        id: '2',
        title: 'Add export to Excel feature',
        description: 'It would be helpful to export project reports to Excel format.',
        reportedBy: 'Jane Smith',
        reportedByEmail: 'jane@example.com',
        category: 'Feature Request',
        priority: 'Medium',
        status: 'In Progress',
        createdAt: new Date('2024-01-14')
      },
      {
        id: '3',
        title: 'Login page not responsive on mobile',
        description: 'The login page layout breaks on mobile devices.',
        reportedBy: 'Mike Johnson',
        reportedByEmail: 'mike@example.com',
        category: 'Bug',
        priority: 'High',
        status: 'Resolved',
        createdAt: new Date('2024-01-10'),
        resolvedAt: new Date('2024-01-12'),
        resolution: 'Fixed CSS media queries for mobile devices.'
      }
    ];
    setReports(mockReports);
  };

  const filterReports = () => {
    let filtered = [...reports];

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        r => r.title.toLowerCase().includes(searchLower) ||
             r.description.toLowerCase().includes(searchLower) ||
             r.reportedBy.toLowerCase().includes(searchLower)
      );
    }

    if (statusFilter !== 'All') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    if (categoryFilter !== 'All') {
      filtered = filtered.filter(r => r.category === categoryFilter);
    }

    setFilteredReports(filtered);
  };

  const handleResolve = async () => {
    if (!selectedReport || !resolution.trim()) {
      setError('Please provide a resolution note');
      return;
    }

    try {
      // TODO: Implement API call to resolve report
      const updatedReports = reports.map(r =>
        r.id === selectedReport.id
          ? { ...r, status: 'Resolved' as const, resolvedAt: new Date(), resolution }
          : r
      );
      setReports(updatedReports);
      setSuccess(`Report "${selectedReport.title}" has been marked as resolved`);
      setResolveDialogOpen(false);
      setResolution('');
      setSelectedReport(null);
    } catch {
      setError('Failed to resolve report');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'warning';
      case 'In Progress': return 'info';
      case 'Resolved': return 'success';
      case 'Closed': return 'default';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'error';
      case 'High': return 'warning';
      case 'Medium': return 'info';
      case 'Low': return 'success';
      default: return 'default';
    }
  };

  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === 'Pending').length,
    inProgress: reports.filter(r => r.status === 'In Progress').length,
    resolved: reports.filter(r => r.status === 'Resolved').length
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        System Reports
      </Typography>

      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Stats */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Paper sx={{ p: 2, minWidth: 140, textAlign: 'center' }}>
          <Typography variant="h4" color="primary">{stats.total}</Typography>
          <Typography variant="body2" color="text.secondary">Total Reports</Typography>
        </Paper>
        <Paper sx={{ p: 2, minWidth: 140, textAlign: 'center' }}>
          <Typography variant="h4" color="warning.main">{stats.pending}</Typography>
          <Typography variant="body2" color="text.secondary">Pending</Typography>
        </Paper>
        <Paper sx={{ p: 2, minWidth: 140, textAlign: 'center' }}>
          <Typography variant="h4" color="info.main">{stats.inProgress}</Typography>
          <Typography variant="body2" color="text.secondary">In Progress</Typography>
        </Paper>
        <Paper sx={{ p: 2, minWidth: 140, textAlign: 'center' }}>
          <Typography variant="h4" color="success.main">{stats.resolved}</Typography>
          <Typography variant="body2" color="text.secondary">Resolved</Typography>
        </Paper>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <FilterListIcon color="action" />
          <TextField
            size="small"
            placeholder="Search reports..."
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
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="All">All Status</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="In Progress">In Progress</MenuItem>
              <MenuItem value="Resolved">Resolved</MenuItem>
              <MenuItem value="Closed">Closed</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={categoryFilter}
              label="Category"
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <MenuItem value="All">All Categories</MenuItem>
              <MenuItem value="Bug">Bug</MenuItem>
              <MenuItem value="Feature Request">Feature Request</MenuItem>
              <MenuItem value="User Issue">User Issue</MenuItem>
              <MenuItem value="Technical">Technical</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Reports Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell>Title</TableCell>
              <TableCell>Reported By</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredReports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Box py={4}>
                    <ReportIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography color="text.secondary">No reports found</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredReports
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((report) => (
                  <TableRow key={report.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {report.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {report.description.substring(0, 60)}...
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{report.reportedBy}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {report.reportedByEmail}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={report.category} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={report.priority}
                        color={getPriorityColor(report.priority) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={report.status}
                        color={getStatusColor(report.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(report.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedReport(report);
                            setViewDialogOpen(true);
                          }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {report.status !== 'Resolved' && report.status !== 'Closed' && (
                        <Tooltip title="Mark as Resolved">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => {
                              setSelectedReport(report);
                              setResolveDialogOpen(true);
                            }}
                          >
                            <CheckCircleIcon fontSize="small" />
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
          count={filteredReports.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>

      {/* View Report Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Report Details</DialogTitle>
        <DialogContent>
          {selectedReport && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="h6" gutterBottom>{selectedReport.title}</Typography>

              <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                <Chip label={selectedReport.category} size="small" variant="outlined" />
                <Chip
                  label={selectedReport.priority}
                  color={getPriorityColor(selectedReport.priority) as any}
                  size="small"
                />
                <Chip
                  label={selectedReport.status}
                  color={getStatusColor(selectedReport.status) as any}
                  size="small"
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                <Typography variant="body1">{selectedReport.description}</Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Reported By</Typography>
                <Typography variant="body1">{selectedReport.reportedBy}</Typography>
                <Typography variant="body2" color="text.secondary">{selectedReport.reportedByEmail}</Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Reported At</Typography>
                <Typography variant="body1">{new Date(selectedReport.createdAt).toLocaleString()}</Typography>
              </Box>

              {selectedReport.resolvedAt && (
                <>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">Resolved At</Typography>
                    <Typography variant="body1">{new Date(selectedReport.resolvedAt).toLocaleString()}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Resolution</Typography>
                    <Typography variant="body1">{selectedReport.resolution}</Typography>
                  </Box>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Resolve Report Dialog */}
      <Dialog open={resolveDialogOpen} onClose={() => setResolveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Resolve Report</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 1 }}>
            Report: {selectedReport?.title}
          </Typography>
          <TextField
            fullWidth
            label="Resolution Notes"
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            margin="normal"
            multiline
            rows={4}
            required
            placeholder="Describe how the issue was resolved..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResolveDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleResolve}
            disabled={!resolution.trim()}
          >
            Mark as Resolved
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SystemReportsPage;
