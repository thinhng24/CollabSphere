import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Card,
  CardContent,
  Chip,
  Avatar,
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
  Menu,
  LinearProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FlagIcon from '@mui/icons-material/Flag';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useParams, useNavigate } from 'react-router-dom';
import { WorkspaceCard, Team, TeamMember } from '../types';
import { cardsAPI, teamsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

type CardStatus = 'Todo' | 'InProgress' | 'Review' | 'Done';

const columns: { id: CardStatus; title: string; color: string }[] = [
  { id: 'Todo', title: 'To Do', color: '#e3f2fd' },
  { id: 'InProgress', title: 'In Progress', color: '#fff3e0' },
  { id: 'Review', title: 'Review', color: '#f3e5f5' },
  { id: 'Done', title: 'Done', color: '#e8f5e9' }
];

const priorityColors: Record<string, string> = {
  Low: '#4caf50',
  Medium: '#2196f3',
  High: '#ff9800',
  Urgent: '#f44336'
};

const WorkspacePage: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  useAuth(); // Ensure user is authenticated
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [cards, setCards] = useState<WorkspaceCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<WorkspaceCard | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Medium' as WorkspaceCard['priority'],
    assigneeId: '',
    dueDate: ''
  });

  // Drag state
  const [draggedCard, setDraggedCard] = useState<WorkspaceCard | null>(null);

  useEffect(() => {
    if (teamId) {
      loadData();
    }
  }, [teamId]);

  const loadData = async () => {
    if (!teamId) return;
    try {
      const [teamRes, membersRes, cardsRes] = await Promise.all([
        teamsAPI.getById(teamId),
        teamsAPI.getMembers(teamId),
        cardsAPI.getByTeam(teamId)
      ]);
      if (teamRes.data.data) {
        setTeam(teamRes.data.data);
      }
      setMembers(membersRes.data.data?.items || []);
      setCards(cardsRes.data.data?.items || []);
    } catch {
      setError('Failed to load workspace');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!teamId) return;
    try {
      const assignee = members.find(m => m.userId === formData.assigneeId);
      await cardsAPI.create({
        teamId,
        ...formData,
        assigneeName: assignee?.fullName,
        status: 'Todo'
      });
      setSuccess('Card created successfully!');
      setCreateDialogOpen(false);
      resetForm();
      loadData();
    } catch {
      setError('Failed to create card');
    }
  };

  const handleUpdate = async () => {
    if (!selectedCard) return;
    try {
      const assignee = members.find(m => m.userId === formData.assigneeId);
      await cardsAPI.update(selectedCard.id, {
        ...formData,
        assigneeName: assignee?.fullName
      });
      setSuccess('Card updated successfully!');
      setEditDialogOpen(false);
      setSelectedCard(null);
      loadData();
    } catch {
      setError('Failed to update card');
    }
  };

  const handleDelete = async (cardId: string) => {
    if (!window.confirm('Are you sure you want to delete this card?')) return;
    try {
      await cardsAPI.delete(cardId);
      setSuccess('Card deleted successfully!');
      setMenuAnchor(null);
      loadData();
    } catch {
      setError('Failed to delete card');
    }
  };

  const handleDragStart = (card: WorkspaceCard) => {
    setDraggedCard(card);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (status: CardStatus) => {
    if (!draggedCard || draggedCard.status === status) {
      setDraggedCard(null);
      return;
    }
    try {
      await cardsAPI.moveCard(draggedCard.id, status, 0);
      setCards(prev =>
        prev.map(c =>
          c.id === draggedCard.id ? { ...c, status } : c
        )
      );
    } catch {
      setError('Failed to move card');
    }
    setDraggedCard(null);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'Medium',
      assigneeId: '',
      dueDate: ''
    });
  };

  const openEditDialog = (card: WorkspaceCard) => {
    setSelectedCard(card);
    setFormData({
      title: card.title,
      description: card.description,
      priority: card.priority,
      assigneeId: card.assigneeId || '',
      dueDate: card.dueDate?.split('T')[0] || ''
    });
    setEditDialogOpen(true);
    setMenuAnchor(null);
  };

  const getColumnCards = (status: CardStatus) =>
    cards.filter(c => c.status === status).sort((a, b) => a.order - b.order);

  const stats = {
    total: cards.length,
    todo: cards.filter(c => c.status === 'Todo').length,
    inProgress: cards.filter(c => c.status === 'InProgress').length,
    review: cards.filter(c => c.status === 'Review').length,
    done: cards.filter(c => c.status === 'Done').length
  };

  const progress = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  if (loading) {
    return <Box sx={{ p: 3 }}><Typography>Loading workspace...</Typography></Box>;
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/teams')}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              {team?.name} - Workspace
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {team?.projectName || 'No project assigned'}
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Add Card
        </Button>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Progress Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle2">Sprint Progress</Typography>
          <Typography variant="subtitle2" fontWeight={600}>{progress}%</Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{ height: 10, borderRadius: 5 }}
          color={progress === 100 ? 'success' : 'primary'}
        />
        <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
          <Typography variant="body2">
            <strong>{stats.total}</strong> Total
          </Typography>
          <Typography variant="body2" sx={{ color: '#1976d2' }}>
            <strong>{stats.todo}</strong> To Do
          </Typography>
          <Typography variant="body2" sx={{ color: '#ed6c02' }}>
            <strong>{stats.inProgress}</strong> In Progress
          </Typography>
          <Typography variant="body2" sx={{ color: '#9c27b0' }}>
            <strong>{stats.review}</strong> Review
          </Typography>
          <Typography variant="body2" sx={{ color: '#2e7d32' }}>
            <strong>{stats.done}</strong> Done
          </Typography>
        </Box>
      </Paper>

      {/* Kanban Board */}
      <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2 }}>
        {columns.map((column) => (
          <Paper
            key={column.id}
            sx={{
              minWidth: 300,
              maxWidth: 300,
              bgcolor: column.color,
              p: 2,
              borderRadius: 2
            }}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(column.id)}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                {column.title}
              </Typography>
              <Chip label={getColumnCards(column.id).length} size="small" />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, minHeight: 200 }}>
              {getColumnCards(column.id).map((card) => (
                <Card
                  key={card.id}
                  draggable
                  onDragStart={() => handleDragStart(card)}
                  sx={{
                    cursor: 'grab',
                    '&:hover': { boxShadow: 3 },
                    opacity: draggedCard?.id === card.id ? 0.5 : 1,
                    transition: 'all 0.2s'
                  }}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, flex: 1 }}>
                        {card.title}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          setSelectedCard(card);
                          setMenuAnchor(e.currentTarget);
                        }}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </Box>

                    {card.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 1.5 }}>
                        {card.description.length > 80
                          ? card.description.substring(0, 80) + '...'
                          : card.description}
                      </Typography>
                    )}

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                      <Tooltip title={`Priority: ${card.priority}`}>
                        <Chip
                          icon={<FlagIcon sx={{ fontSize: 14 }} />}
                          label={card.priority}
                          size="small"
                          sx={{
                            bgcolor: priorityColors[card.priority],
                            color: 'white',
                            '& .MuiChip-icon': { color: 'white' }
                          }}
                        />
                      </Tooltip>

                      {card.dueDate && (
                        <Tooltip title="Due Date">
                          <Chip
                            icon={<CalendarTodayIcon sx={{ fontSize: 14 }} />}
                            label={new Date(card.dueDate).toLocaleDateString()}
                            size="small"
                            variant="outlined"
                          />
                        </Tooltip>
                      )}

                      {card.assigneeName && (
                        <Tooltip title={card.assigneeName}>
                          <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                            {card.assigneeName.charAt(0)}
                          </Avatar>
                        </Tooltip>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              ))}

              {getColumnCards(column.id).length === 0 && (
                <Box
                  sx={{
                    border: '2px dashed',
                    borderColor: 'grey.300',
                    borderRadius: 2,
                    p: 3,
                    textAlign: 'center',
                    color: 'text.secondary'
                  }}
                >
                  <Typography variant="body2">Drop cards here</Typography>
                </Box>
              )}
            </Box>
          </Paper>
        ))}
      </Box>

      {/* Card Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => selectedCard && openEditDialog(selectedCard)}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem
          onClick={() => selectedCard && handleDelete(selectedCard.id)}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>

      {/* Create Card Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Card</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
            />
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={formData.priority}
                label="Priority"
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
              >
                <MenuItem value="Low">Low</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="High">High</MenuItem>
                <MenuItem value="Urgent">Urgent</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Assignee</InputLabel>
              <Select
                value={formData.assigneeId}
                label="Assignee"
                onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
              >
                <MenuItem value="">
                  <em>Unassigned</em>
                </MenuItem>
                {members.map(member => (
                  <MenuItem key={member.userId} value={member.userId}>
                    {member.fullName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Due Date"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!formData.title}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Card Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Card</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
            />
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={formData.priority}
                label="Priority"
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
              >
                <MenuItem value="Low">Low</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="High">High</MenuItem>
                <MenuItem value="Urgent">Urgent</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Assignee</InputLabel>
              <Select
                value={formData.assigneeId}
                label="Assignee"
                onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
              >
                <MenuItem value="">
                  <em>Unassigned</em>
                </MenuItem>
                {members.map(member => (
                  <MenuItem key={member.userId} value={member.userId}>
                    {member.fullName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Due Date"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdate} disabled={!formData.title}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkspacePage;
