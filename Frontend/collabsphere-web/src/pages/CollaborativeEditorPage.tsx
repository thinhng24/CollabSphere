import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Chip,
  Avatar,
  AvatarGroup,
  Tooltip,
  TextField,
  Button,
  Menu,
  MenuItem,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText
} from '@mui/material';
import {
  Save as SaveIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  History as HistoryIcon,
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  FormatUnderlined as UnderlineIcon,
  Code as CodeIcon,
  FormatListBulleted as ListIcon,
  FormatListNumbered as NumberedListIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  MoreVert as MoreVertIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';

interface CollaborativeUser {
  id: string;
  name: string;
  color: string;
  cursorPosition: number;
  isTyping: boolean;
  lastActivity: string;
}

interface DocumentVersion {
  id: string;
  content: string;
  savedBy: string;
  savedAt: string;
  comment?: string;
}

const CollaborativeEditorPage: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const [documentTitle, setDocumentTitle] = useState('Untitled Document');
  const [content, setContent] = useState('');
  const [activeUsers, setActiveUsers] = useState<CollaborativeUser[]>([]);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [versionDialogOpen, setVersionDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [success, setSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Simulated current user
  const currentUser = {
    id: 'user1',
    name: 'Current User',
    color: '#3b82f6'
  };

  useEffect(() => {
    loadDocument();
    loadActiveUsers();
    loadVersions();

    // Simulate real-time updates
    const interval = setInterval(() => {
      simulateUserActivity();
    }, 5000);

    return () => clearInterval(interval);
  }, [documentId]);

  const loadDocument = async () => {
    try {
      // TODO: Implement API call to load document
      const mockDocument = {
        id: documentId || 'doc1',
        title: 'Project Requirements Document',
        content: `# Project Requirements Document

## Overview
This document outlines the requirements for our team project.

## Objectives
- Build a fully functional e-commerce platform
- Implement user authentication and authorization
- Create a responsive UI with modern design

## Technical Stack
- Frontend: React with TypeScript
- Backend: Node.js with Express
- Database: PostgreSQL
- Deployment: Docker containers

## Timeline
- Week 1-2: Requirements and design
- Week 3-4: Implementation
- Week 5-6: Testing and deployment

## Team Responsibilities
- Alice: Frontend development
- Bob: Backend API
- Charlie: Database design and integration

---
*Last updated: ${new Date().toLocaleString()}*`
      };

      setDocumentTitle(mockDocument.title);
      setContent(mockDocument.content);
    } catch (err) {
      console.error('Failed to load document', err);
    }
  };

  const loadActiveUsers = async () => {
    try {
      // TODO: Implement WebSocket connection for real-time users
      const mockUsers: CollaborativeUser[] = [
        {
          id: 'user2',
          name: 'Alice Johnson',
          color: '#10b981',
          cursorPosition: 250,
          isTyping: false,
          lastActivity: '1 min ago'
        },
        {
          id: 'user3',
          name: 'Bob Smith',
          color: '#f59e0b',
          cursorPosition: 580,
          isTyping: true,
          lastActivity: 'Just now'
        }
      ];
      setActiveUsers(mockUsers);
    } catch (err) {
      console.error('Failed to load active users', err);
    }
  };

  const loadVersions = async () => {
    try {
      // TODO: Implement API call
      const mockVersions: DocumentVersion[] = [
        {
          id: 'v3',
          content: 'Current version...',
          savedBy: 'Current User',
          savedAt: '2024-02-16T15:30:00',
          comment: 'Updated technical stack section'
        },
        {
          id: 'v2',
          content: 'Previous version...',
          savedBy: 'Alice Johnson',
          savedAt: '2024-02-16T14:20:00',
          comment: 'Added timeline details'
        },
        {
          id: 'v1',
          content: 'Initial version...',
          savedBy: 'Bob Smith',
          savedAt: '2024-02-16T10:00:00',
          comment: 'Initial draft'
        }
      ];
      setVersions(mockVersions);
    } catch (err) {
      console.error('Failed to load versions', err);
    }
  };

  const simulateUserActivity = () => {
    // Simulate typing activity
    setActiveUsers(prev =>
      prev.map(user => ({
        ...user,
        isTyping: Math.random() > 0.7
      }))
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: Implement API call to save document
      await new Promise(resolve => setTimeout(resolve, 500));

      const newVersion: DocumentVersion = {
        id: `v${versions.length + 1}`,
        content: content,
        savedBy: currentUser.name,
        savedAt: new Date().toISOString(),
        comment: 'Manual save'
      };

      setVersions([newVersion, ...versions]);
      setLastSaved(new Date());
      setSuccess('Document saved successfully!');
    } catch (err) {
      console.error('Failed to save document', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documentTitle.replace(/\s+/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setSuccess('Document downloaded!');
  };

  const handleRestoreVersion = (version: DocumentVersion) => {
    setContent(version.content);
    setVersionDialogOpen(false);
    setSuccess(`Restored version from ${new Date(version.savedAt).toLocaleString()}`);
  };

  const handleInsertFormat = (formatType: string) => {
    if (!editorRef.current) return;

    const start = editorRef.current.selectionStart;
    const end = editorRef.current.selectionEnd;
    const selectedText = content.substring(start, end);
    let newText = '';

    switch (formatType) {
      case 'bold':
        newText = `**${selectedText || 'bold text'}**`;
        break;
      case 'italic':
        newText = `*${selectedText || 'italic text'}*`;
        break;
      case 'underline':
        newText = `__${selectedText || 'underlined text'}__`;
        break;
      case 'code':
        newText = `\`${selectedText || 'code'}\``;
        break;
      case 'bullet':
        newText = `- ${selectedText || 'List item'}`;
        break;
      case 'numbered':
        newText = `1. ${selectedText || 'List item'}`;
        break;
      default:
        return;
    }

    const newContent = content.substring(0, start) + newText + content.substring(end);
    setContent(newContent);

    // Set cursor position after inserted text
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.focus();
        editorRef.current.setSelectionRange(start + newText.length, start + newText.length);
      }
    }, 0);
  };

  const getTimeSinceLastSave = (): string => {
    if (!lastSaved) return 'Not saved';

    const seconds = Math.floor((new Date().getTime() - lastSaved.getTime()) / 1000);
    if (seconds < 60) return 'Saved just now';
    if (seconds < 3600) return `Saved ${Math.floor(seconds / 60)} min ago`;
    return `Saved ${Math.floor(seconds / 3600)} hours ago`;
  };

  return (
    <Box sx={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton onClick={() => navigate('/workspace')}>
              <ArrowBackIcon />
            </IconButton>
            <TextField
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              variant="standard"
              sx={{ minWidth: 300 }}
              InputProps={{
                sx: { fontSize: '1.25rem', fontWeight: 600 }
              }}
            />
          </Box>

          <Box display="flex" alignItems="center" gap={2}>
            {/* Active Users */}
            <AvatarGroup max={4}>
              {activeUsers.map((user) => (
                <Tooltip
                  key={user.id}
                  title={`${user.name} ${user.isTyping ? '(typing...)' : ''}`}
                >
                  <Avatar
                    sx={{
                      bgcolor: user.color,
                      width: 32,
                      height: 32,
                      fontSize: '0.875rem',
                      border: user.isTyping ? '2px solid #10b981' : 'none'
                    }}
                  >
                    {user.name.charAt(0)}
                  </Avatar>
                </Tooltip>
              ))}
            </AvatarGroup>

            <Chip
              label={getTimeSinceLastSave()}
              size="small"
              color={lastSaved ? 'success' : 'default'}
            />

            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>

            <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)}>
              <MoreVertIcon />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Formatting Toolbar */}
      <Paper sx={{ p: 1, mb: 2 }}>
        <Box display="flex" gap={0.5} alignItems="center">
          <Tooltip title="Bold">
            <IconButton size="small" onClick={() => handleInsertFormat('bold')}>
              <BoldIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Italic">
            <IconButton size="small" onClick={() => handleInsertFormat('italic')}>
              <ItalicIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Underline">
            <IconButton size="small" onClick={() => handleInsertFormat('underline')}>
              <UnderlineIcon />
            </IconButton>
          </Tooltip>

          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

          <Tooltip title="Code">
            <IconButton size="small" onClick={() => handleInsertFormat('code')}>
              <CodeIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Bullet List">
            <IconButton size="small" onClick={() => handleInsertFormat('bullet')}>
              <ListIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Numbered List">
            <IconButton size="small" onClick={() => handleInsertFormat('numbered')}>
              <NumberedListIcon />
            </IconButton>
          </Tooltip>

          <Box flex={1} />

          <Chip
            label={`${activeUsers.length + 1} active`}
            size="small"
            color="primary"
            variant="outlined"
          />
        </Box>
      </Paper>

      {/* Editor */}
      <Paper sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <TextField
          ref={editorRef}
          fullWidth
          multiline
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start typing... (Markdown supported)"
          variant="outlined"
          InputProps={{
            sx: {
              height: '100%',
              alignItems: 'flex-start',
              '& textarea': {
                fontFamily: 'monospace',
                fontSize: '0.95rem',
                lineHeight: 1.6
              }
            }
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              height: '100%'
            }
          }}
        />
      </Paper>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => { handleDownload(); setMenuAnchor(null); }}>
          <DownloadIcon fontSize="small" sx={{ mr: 1 }} />
          Download
        </MenuItem>
        <MenuItem onClick={() => { setVersionDialogOpen(true); setMenuAnchor(null); }}>
          <HistoryIcon fontSize="small" sx={{ mr: 1 }} />
          Version History
        </MenuItem>
        <MenuItem onClick={() => { setShareDialogOpen(true); setMenuAnchor(null); }}>
          <ShareIcon fontSize="small" sx={{ mr: 1 }} />
          Share
        </MenuItem>
      </Menu>

      {/* Version History Dialog */}
      <Dialog open={versionDialogOpen} onClose={() => setVersionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Version History</DialogTitle>
        <DialogContent>
          <List>
            {versions.map((version, index) => (
              <React.Fragment key={version.id}>
                <ListItem
                  sx={{ px: 0 }}
                  secondaryAction={
                    <Button
                      size="small"
                      onClick={() => handleRestoreVersion(version)}
                    >
                      Restore
                    </Button>
                  }
                >
                  <ListItemAvatar>
                    <Avatar>{version.savedBy.charAt(0)}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={version.comment || 'No comment'}
                    secondary={
                      <>
                        <Typography variant="caption" display="block">
                          {version.savedBy}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(version.savedAt).toLocaleString()}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                {index < versions.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVersionDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Share Document</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            All team members have access to this document automatically.
          </Alert>
          <Typography variant="subtitle2" gutterBottom>
            Current Collaborators
          </Typography>
          <List>
            <ListItem>
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: currentUser.color }}>
                  {currentUser.name.charAt(0)}
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary={`${currentUser.name} (You)`} secondary="Owner" />
            </ListItem>
            {activeUsers.map((user) => (
              <ListItem key={user.id}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: user.color }}>
                    {user.name.charAt(0)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={user.name}
                  secondary={user.isTyping ? 'Currently editing' : user.lastActivity}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CollaborativeEditorPage;
