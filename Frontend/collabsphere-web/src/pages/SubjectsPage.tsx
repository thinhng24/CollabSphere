import React from 'react';
import { Container, Typography, Paper } from '@mui/material';

const SubjectsPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" fontWeight={600} gutterBottom>
        Subjects
      </Typography>
      <Paper sx={{ p: 4, textAlign: 'center', mt: 4 }}>
        <Typography variant="h6" color="text.secondary">
          Subjects module coming soon...
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          This section will manage course subjects and syllabi.
        </Typography>
      </Paper>
    </Container>
  );
};

export default SubjectsPage;
