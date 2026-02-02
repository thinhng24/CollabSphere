import React, { useState, ChangeEvent } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Alert,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';

const ImportExcelPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string>('');

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setMessage(`Selected: ${file.name}`);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) {
      setMessage('Please select a file first');
      return;
    }
    setMessage(`Uploading ${selectedFile.name}... (Feature coming soon)`);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" fontWeight={600} gutterBottom>
        Import Excel
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Import projects and data from Excel files
      </Typography>

      <Paper sx={{ p: 4, mt: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <input
            accept=".xlsx,.xls,.csv"
            style={{ display: 'none' }}
            id="excel-file-input"
            type="file"
            onChange={handleFileSelect}
          />
          <label htmlFor="excel-file-input">
            <Button
              variant="contained"
              component="span"
              startIcon={<UploadFileIcon />}
              size="large"
            >
              Select Excel File
            </Button>
          </label>
          {selectedFile && (
            <Button
              variant="outlined"
              sx={{ ml: 2 }}
              onClick={handleUpload}
            >
              Upload
            </Button>
          )}
        </Box>

        {message && (
          <Alert severity="info" sx={{ mb: 3 }}>
            {message}
          </Alert>
        )}

        <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
          Supported File Formats
        </Typography>
        <List>
          <ListItem>
            <ListItemText
              primary=".xlsx"
              secondary="Excel 2007 and later"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary=".xls"
              secondary="Excel 97-2003"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary=".csv"
              secondary="Comma-separated values"
            />
          </ListItem>
        </List>

        <Alert severity="warning" sx={{ mt: 3 }}>
          <strong>Note:</strong> Excel import functionality is under development.
          Please ensure your file follows the required template format.
        </Alert>
      </Paper>
    </Container>
  );
};

export default ImportExcelPage;
