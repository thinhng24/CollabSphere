import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Collapse,
  Divider,
  Avatar
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FolderIcon from '@mui/icons-material/Folder';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ApprovalIcon from '@mui/icons-material/Approval';
import GroupIcon from '@mui/icons-material/Group';
import SchoolIcon from '@mui/icons-material/School';
import AssignmentIcon from '@mui/icons-material/Assignment';
import WorkspacesIcon from '@mui/icons-material/Workspaces';
import ChatIcon from '@mui/icons-material/Chat';
import VideocamIcon from '@mui/icons-material/Videocam';
import FolderSharedIcon from '@mui/icons-material/FolderShared';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { useAuth } from '../context/AuthContext';

interface MenuItem {
  text: string;
  icon: React.ReactNode;
  path?: string;
  show: boolean;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, isStaff, isLecturer, isHeadDept, isStudent } = useAuth();
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    'Overview': true,
    'Academic': true,
    'Teams': true,
    'Communication': true,
    'Administration': true
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const menuSections: MenuSection[] = [
    {
      title: 'Overview',
      items: [
        {
          text: 'Dashboard',
          icon: <DashboardIcon />,
          path: '/',
          show: true
        },
        {
          text: 'Profile',
          icon: <PersonIcon />,
          path: '/profile',
          show: true
        }
      ]
    },
    {
      title: 'Academic',
      items: [
        {
          text: 'Subjects',
          icon: <MenuBookIcon />,
          path: '/subjects',
          show: isLecturer() || isHeadDept() || isAdmin() || isStaff()
        },
        {
          text: 'Classes',
          icon: <SchoolIcon />,
          path: '/classes',
          show: isLecturer() || isHeadDept() || isStudent() || isAdmin() || isStaff()
        },
        {
          text: 'Projects',
          icon: <FolderIcon />,
          path: '/projects',
          show: isLecturer() || isHeadDept() || isStudent()
        },
        {
          text: 'Review Projects',
          icon: <ApprovalIcon />,
          path: '/review',
          show: isHeadDept()
        },
        {
          text: 'Import Data',
          icon: <UploadFileIcon />,
          path: '/import',
          show: isLecturer() || isAdmin() || isStaff()
        }
      ]
    },
    {
      title: 'Teams',
      items: [
        {
          text: 'My Teams',
          icon: <GroupIcon />,
          path: '/teams',
          show: isLecturer() || isStudent()
        },
        {
          text: 'Checkpoints',
          icon: <AssignmentIcon />,
          path: '/checkpoints',
          show: isLecturer() || isStudent()
        },
        {
          text: 'Workspace',
          icon: <WorkspacesIcon />,
          path: '/workspace',
          show: isStudent()
        }
      ]
    },
    {
      title: 'Communication',
      items: [
        {
          text: 'Chat',
          icon: <ChatIcon />,
          path: '/chat',
          show: true
        },
        {
          text: 'Meetings',
          icon: <VideocamIcon />,
          path: '/meetings',
          show: isLecturer() || isStudent()
        },
        {
          text: 'Resources',
          icon: <FolderSharedIcon />,
          path: '/resources',
          show: isLecturer() || isStudent()
        }
      ]
    },
    {
      title: 'Administration',
      items: [
        {
          text: 'User Management',
          icon: <AdminPanelSettingsIcon />,
          path: '/admin/users',
          show: isAdmin() || isStaff()
        },
        {
          text: 'All Classes',
          icon: <SchoolIcon />,
          path: '/admin/classes',
          show: isAdmin() || isStaff()
        },
        {
          text: 'All Teams',
          icon: <GroupIcon />,
          path: '/admin/teams',
          show: isAdmin() || isStaff()
        }
      ]
    }
  ];

  const isActive = (path: string): boolean => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const visibleSections = menuSections.filter(section =>
    section.items.some(item => item.show)
  );

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
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Logo */}
      <Box sx={{ p: 3, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <Typography variant="h5" sx={{ fontWeight: 600, letterSpacing: 0.5 }}>
          CollabSphere
        </Typography>
      </Box>

      {/* User Info */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
          {user?.fullName?.charAt(0) || 'U'}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600 }}>
            {user?.fullName || 'User'}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            {user?.role || 'Guest'}
          </Typography>
        </Box>
      </Box>

      {/* Navigation Menu */}
      <Box sx={{ flex: 1, overflow: 'auto', py: 1 }}>
        {visibleSections.map((section, sectionIndex) => {
          const visibleItems = section.items.filter(item => item.show);
          if (visibleItems.length === 0) return null;

          return (
            <Box key={section.title}>
              {sectionIndex > 0 && <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', my: 1 }} />}

              {/* Section Header */}
              <ListItem
                component="div"
                onClick={() => toggleSection(section.title)}
                sx={{
                  py: 1,
                  px: 2,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: 'rgba(255,255,255,0.5)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    flex: 1
                  }}
                >
                  {section.title}
                </Typography>
                {openSections[section.title] ? (
                  <ExpandLess sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 18 }} />
                ) : (
                  <ExpandMore sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 18 }} />
                )}
              </ListItem>

              {/* Section Items */}
              <Collapse in={openSections[section.title]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding sx={{ px: 1 }}>
                  {visibleItems.map((item) => (
                    <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                      <ListItemButton
                        onClick={() => item.path && navigate(item.path)}
                        sx={{
                          borderRadius: 2,
                          bgcolor: isActive(item.path || '') ? 'rgba(25, 118, 210, 0.3)' : 'transparent',
                          '&:hover': {
                            bgcolor: isActive(item.path || '')
                              ? 'rgba(25, 118, 210, 0.3)'
                              : 'rgba(255,255,255,0.08)'
                          },
                          py: 1.2,
                          px: 2
                        }}
                      >
                        <Box
                          sx={{
                            mr: 2,
                            display: 'flex',
                            alignItems: 'center',
                            color: isActive(item.path || '') ? '#90caf9' : 'rgba(255,255,255,0.7)'
                          }}
                        >
                          {item.icon}
                        </Box>
                        <ListItemText
                          primary={item.text}
                          primaryTypographyProps={{
                            fontSize: '0.9rem',
                            fontWeight: isActive(item.path || '') ? 600 : 400,
                            color: isActive(item.path || '') ? '#fff' : 'rgba(255,255,255,0.85)'
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            </Box>
          );
        })}
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
          CollabSphere v1.0.0
        </Typography>
      </Box>
    </Box>
  );
};

export default Sidebar;
