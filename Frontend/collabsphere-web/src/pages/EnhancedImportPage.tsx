import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Tabs,
  Tab,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  LinearProgress
} from '@mui/material';
import {
  UploadFile as UploadFileIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
  Download as DownloadIcon
} from '@mui/icons-material';

interface ImportType {
  label: string;
  value: string;
  templateFields: string[];
  sampleData: Record<string, string>[];
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface PreviewData {
  row: number;
  data: Record<string, any>;
  status: 'valid' | 'error' | 'warning';
  errors?: ValidationError[];
}

const EnhancedImportPage: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  const importTypes: ImportType[] = [
    {
      label: 'Subjects',
      value: 'subjects',
      templateFields: ['Code', 'Name', 'Description', 'Credits'],
      sampleData: [
        { Code: 'CS101', Name: 'Introduction to Programming', Description: 'Basic programming concepts', Credits: '3' },
        { Code: 'CS102', Name: 'Data Structures', Description: 'Algorithms and data structures', Credits: '4' }
      ]
    },
    {
      label: 'Syllabi',
      value: 'syllabi',
      templateFields: ['SubjectCode', 'Version', 'Objectives', 'OutcomeStandards'],
      sampleData: [
        { SubjectCode: 'CS101', Version: '1.0', Objectives: 'Learn programming basics', OutcomeStandards: 'Can write simple programs' },
        { SubjectCode: 'CS102', Version: '2.0', Objectives: 'Master data structures', OutcomeStandards: 'Can implement complex algorithms' }
      ]
    },
    {
      label: 'Classes',
      value: 'classes',
      templateFields: ['Code', 'Name', 'Semester', 'Year', 'SubjectCode'],
      sampleData: [
        { Code: 'CS101-01', Name: 'Programming Class A', Semester: 'Fall', Year: '2024', SubjectCode: 'CS101' },
        { Code: 'CS101-02', Name: 'Programming Class B', Semester: 'Spring', Year: '2024', SubjectCode: 'CS101' }
      ]
    },
    {
      label: 'Lecturers',
      value: 'lecturers',
      templateFields: ['Email', 'FullName', 'Department', 'PhoneNumber'],
      sampleData: [
        { Email: 'john.doe@university.edu', FullName: 'John Doe', Department: 'Computer Science', PhoneNumber: '+1234567890' },
        { Email: 'jane.smith@university.edu', FullName: 'Jane Smith', Department: 'Software Engineering', PhoneNumber: '+1234567891' }
      ]
    },
    {
      label: 'Students',
      value: 'students',
      templateFields: ['StudentId', 'Email', 'FullName', 'DateOfBirth', 'Major'],
      sampleData: [
        { StudentId: 'ST001', Email: 'student1@university.edu', FullName: 'Alice Johnson', DateOfBirth: '2003-05-15', Major: 'Computer Science' },
        { StudentId: 'ST002', Email: 'student2@university.edu', FullName: 'Bob Williams', DateOfBirth: '2003-08-22', Major: 'Software Engineering' }
      ]
    }
  ];

  const currentImportType = importTypes[currentTab];

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelection(files[0]);
    }
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileSelection = async (selectedFile: File) => {
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();

    if (!validExtensions.includes(fileExtension)) {
      setError('Invalid file type. Please upload CSV or Excel files only.');
      return;
    }

    setFile(selectedFile);
    setError('');
    await parseAndValidateFile(selectedFile);
  };

  const parseAndValidateFile = async (file: File) => {
    setLoading(true);
    try {
      // TODO: Implement actual CSV/Excel parsing
      // For now, generate mock preview data
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockPreview: PreviewData[] = currentImportType.sampleData.map((data, index) => ({
        row: index + 1,
        data,
        status: index === 0 ? 'valid' : (index === 1 ? 'warning' : 'valid'),
        errors: index === 1 ? [
          { row: index + 1, field: currentImportType.templateFields[0], message: 'Duplicate entry' }
        ] : undefined
      }));

      setPreviewData(mockPreview);
    } catch (err) {
      setError('Failed to parse file. Please check the file format.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    setConfirmDialogOpen(false);
    setImporting(true);
    setImportProgress(0);

    try {
      // Simulate import progress
      for (let i = 0; i <= 100; i += 10) {
        setImportProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // TODO: Implement actual API call to import data
      setSuccess(`Successfully imported ${previewData.length} ${currentImportType.label.toLowerCase()}`);
      setFile(null);
      setPreviewData([]);
    } catch (err) {
      setError('Failed to import data. Please try again.');
      console.error(err);
    } finally {
      setImporting(false);
      setImportProgress(0);
    }
  };

  const handleDownloadTemplate = () => {
    // Create CSV content
    const headers = currentImportType.templateFields.join(',');
    const rows = currentImportType.sampleData.map(row =>
      currentImportType.templateFields.map(field => row[field] || '').join(',')
    );
    const csvContent = [headers, ...rows].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentImportType.value}_template.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const validCount = previewData.filter(d => d.status === 'valid').length;
  const warningCount = previewData.filter(d => d.status === 'warning').length;
  const errorCount = previewData.filter(d => d.status === 'error').length;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        Import Data
      </Typography>

      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={(_, newValue) => {
            setCurrentTab(newValue);
            setFile(null);
            setPreviewData([]);
          }}
          variant="scrollable"
          scrollButtons="auto"
        >
          {importTypes.map((type, index) => (
            <Tab key={index} label={type.label} />
          ))}
        </Tabs>
      </Paper>

      {/* Download Template */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="body2" color="text.secondary">
          Import {currentImportType.label.toLowerCase()} from CSV or Excel file
        </Typography>
        <Button
          startIcon={<DownloadIcon />}
          variant="outlined"
          size="small"
          onClick={handleDownloadTemplate}
        >
          Download Template
        </Button>
      </Box>

      {/* Upload Area */}
      <Paper
        sx={{
          p: 4,
          mb: 3,
          textAlign: 'center',
          border: dragging ? '2px dashed' : '2px dashed',
          borderColor: dragging ? 'primary.main' : 'divider',
          bgcolor: dragging ? 'action.hover' : 'background.paper',
          cursor: 'pointer',
          transition: 'all 0.3s'
        }}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          accept=".csv,.xlsx,.xls"
          style={{ display: 'none' }}
          onChange={handleFileInputChange}
        />
        <label htmlFor="file-upload">
          <Box sx={{ cursor: 'pointer' }}>
            <CloudUploadIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {file ? file.name : 'Drag & drop file here, or click to select'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Supported formats: CSV, XLSX, XLS (Max 10MB)
            </Typography>
            {!file && (
              <Button
                variant="contained"
                startIcon={<UploadFileIcon />}
                sx={{ mt: 2 }}
                component="span"
              >
                Select File
              </Button>
            )}
            {file && (
              <Box display="flex" justifyContent="center" gap={1} mt={2}>
                <Button
                  variant="outlined"
                  startIcon={<DeleteIcon />}
                  onClick={(e) => {
                    e.preventDefault();
                    setFile(null);
                    setPreviewData([]);
                  }}
                >
                  Remove
                </Button>
              </Box>
            )}
          </Box>
        </label>
      </Paper>

      {/* Loading Indicator */}
      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" py={4}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Processing file...</Typography>
        </Box>
      )}

      {/* Preview Table */}
      {!loading && previewData.length > 0 && (
        <>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Preview ({previewData.length} rows)
              </Typography>
              <Box display="flex" gap={1}>
                {validCount > 0 && (
                  <Chip
                    label={`${validCount} Valid`}
                    color="success"
                    size="small"
                    icon={<CheckCircleIcon />}
                  />
                )}
                {warningCount > 0 && (
                  <Chip
                    label={`${warningCount} Warnings`}
                    color="warning"
                    size="small"
                  />
                )}
                {errorCount > 0 && (
                  <Chip
                    label={`${errorCount} Errors`}
                    color="error"
                    size="small"
                    icon={<ErrorIcon />}
                  />
                )}
              </Box>
            </Box>
          </Paper>

          <TableContainer component={Paper} sx={{ mb: 3, maxHeight: 400 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Row</TableCell>
                  <TableCell>Status</TableCell>
                  {currentImportType.templateFields.map((field) => (
                    <TableCell key={field}>{field}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {previewData.map((preview) => (
                  <TableRow key={preview.row} hover>
                    <TableCell>{preview.row}</TableCell>
                    <TableCell>
                      <Chip
                        label={preview.status}
                        color={getStatusColor(preview.status) as any}
                        size="small"
                      />
                    </TableCell>
                    {currentImportType.templateFields.map((field) => (
                      <TableCell key={field}>
                        {preview.data[field]}
                        {preview.errors?.find(e => e.field === field) && (
                          <Typography variant="caption" color="error" display="block">
                            {preview.errors.find(e => e.field === field)?.message}
                          </Typography>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box display="flex" justifyContent="flex-end" gap={2}>
            <Button
              variant="outlined"
              onClick={() => {
                setFile(null);
                setPreviewData([]);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={<UploadFileIcon />}
              onClick={() => setConfirmDialogOpen(true)}
              disabled={errorCount > 0}
            >
              Import {validCount} Records
            </Button>
          </Box>
        </>
      )}

      {/* Import Progress */}
      {importing && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Importing...
          </Typography>
          <LinearProgress variant="determinate" value={importProgress} sx={{ mb: 1 }} />
          <Typography variant="body2" color="text.secondary" align="center">
            {importProgress}% Complete
          </Typography>
        </Paper>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>Confirm Import</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to import {validCount} {currentImportType.label.toLowerCase()}?
          </Typography>
          {warningCount > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              {warningCount} record(s) have warnings but can still be imported.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleImport}>
            Import
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EnhancedImportPage;
