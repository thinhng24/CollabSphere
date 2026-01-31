import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, List, ListItem, ListItemButton, ListItemText, Typography } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FolderIcon from '@mui/icons-material/Folder';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ApprovalIcon from '@mui/icons-material/Approval';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLecturer, isHeadDept } = useAuth();

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/',
      show: true
    },
    {
      text: 'Subjects',
      icon: <MenuBookIcon />,
      path: '/subjects',
      show: isLecturer()
    },
    {
      text: 'Projects',
      icon: <FolderIcon />,
      path: '/projects',
      show: isLecturer()
    },
    {
      text: 'Import Excel',
      icon: <UploadFileIcon />,
      path: '/import',
      show: isLecturer()
    },
    {
      text: 'Review Projects',
      icon: <ApprovalIcon />,
      path: '/review',
      show: isHeadDept()
    }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <Box
      sx={{
        width: 280,
        height: '100vh',
        bgcolor: '#1a2332',
        color: 'white',
        position: 'fixed',
        left: 0,
        top: 0,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Logo */}
      <Box sx={{ p: 3, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <Typography variant="h5" sx={{ fontWeight: 600, letterSpacing: 0.5 }}>
          CollabSphere
        </Typography>
      </Box>

      {/* Navigation Menu */}
      <List sx={{ p: 2, flex: 1 }}>
        {menuItems
          .filter(item => item.show)
          .map((item) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 2,
                  bgcolor: isActive(item.path) ? 'rgba(255,255,255,0.15)' : 'transparent',
                  '&:hover': {
                    bgcolor: isActive(item.path)
                      ? 'rgba(255,255,255,0.15)'
                      : 'rgba(255,255,255,0.08)'
                  },
                  py: 1.5,
                  px: 2
                }}
              >
                <Box sx={{ mr: 2, display: 'flex', alignItems: 'center', opacity: 0.9 }}>
                  {item.icon}
                </Box>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.95rem',
                    fontWeight: isActive(item.path) ? 600 : 400
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
      </List>
    </Box>
  );
}
