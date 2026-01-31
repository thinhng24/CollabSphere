import React from 'react';
import { Box } from '@mui/material';
import Sidebar from './Sidebar';
import Header from './Header';

export default function DashboardLayout({ children, title = 'Dashboard' }) {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f7fa' }}>
      <Sidebar />

      <Box sx={{ flex: 1, marginLeft: '280px' }}>
        <Header title={title} />

        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
