import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Button,
  ButtonGroup,
  Slider,
  Popover,
  Avatar,
  AvatarGroup,
  Chip,
  Menu,
  MenuItem,
  Divider,
  Alert
} from '@mui/material';
import {
  Brush as BrushIcon,
  Circle as CircleIcon,
  CropSquare as SquareIcon,
  Remove as LineIcon,
  TextFields as TextIcon,
  Delete as EraseIcon,
  Clear as ClearIcon,
  Download as DownloadIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  ColorLens as ColorIcon,
  ArrowBack as ArrowBackIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';

interface DrawingTool {
  type: 'pen' | 'eraser' | 'line' | 'circle' | 'rectangle' | 'text';
  color: string;
  lineWidth: number;
}

interface CollaborativeUser {
  id: string;
  name: string;
  color: string;
  isActive: boolean;
  cursorPosition?: { x: number; y: number };
}

interface DrawingHistory {
  imageData: ImageData;
  timestamp: number;
}

const WhiteboardPage: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [currentTool, setCurrentTool] = useState<DrawingTool>({
    type: 'pen',
    color: '#000000',
    lineWidth: 2
  });
  const [colorAnchor, setColorAnchor] = useState<null | HTMLElement>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [activeUsers, setActiveUsers] = useState<CollaborativeUser[]>([]);
  const [history, setHistory] = useState<DrawingHistory[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [success, setSuccess] = useState('');
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);

  // Predefined colors
  const colors = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
    '#FFC0CB', '#A52A2A', '#808080', '#C0C0C0'
  ];

  // Current user
  const currentUser = {
    id: 'user1',
    name: 'Current User',
    color: '#3b82f6'
  };

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        setContext(ctx);

        // Initialize with white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Save initial state
        saveToHistory(ctx);
      }
    }

    // Load active users
    loadActiveUsers();

    // Simulate user activity
    const interval = setInterval(() => {
      simulateUserActivity();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadActiveUsers = async () => {
    try {
      // TODO: Implement WebSocket connection for real-time users
      const mockUsers: CollaborativeUser[] = [
        {
          id: 'user2',
          name: 'Alice Johnson',
          color: '#10b981',
          isActive: true
        },
        {
          id: 'user3',
          name: 'Bob Smith',
          color: '#f59e0b',
          isActive: true
        }
      ];
      setActiveUsers(mockUsers);
    } catch (err) {
      console.error('Failed to load active users', err);
    }
  };

  const simulateUserActivity = () => {
    setActiveUsers(prev =>
      prev.map(user => ({
        ...user,
        isActive: Math.random() > 0.3
      }))
    );
  };

  const saveToHistory = (ctx: CanvasRenderingContext2D) => {
    if (!canvasRef.current) return;

    const imageData = ctx.getImageData(
      0, 0, canvasRef.current.width, canvasRef.current.height
    );

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({
      imageData,
      timestamp: Date.now()
    });

    // Keep only last 50 states
    if (newHistory.length > 50) {
      newHistory.shift();
    }

    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0 && context && canvasRef.current) {
      const newIndex = historyIndex - 1;
      const state = history[newIndex];
      context.putImageData(state.imageData, 0, 0);
      setHistoryIndex(newIndex);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1 && context && canvasRef.current) {
      const newIndex = historyIndex + 1;
      const state = history[newIndex];
      context.putImageData(state.imageData, 0, 0);
      setHistoryIndex(newIndex);
    }
  };

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!context) return;

    const pos = getMousePos(e);
    setIsDrawing(true);
    setStartPos(pos);

    if (currentTool.type === 'pen' || currentTool.type === 'eraser') {
      context.beginPath();
      context.moveTo(pos.x, pos.y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !context || !canvasRef.current) return;

    const pos = getMousePos(e);

    if (currentTool.type === 'pen') {
      context.strokeStyle = currentTool.color;
      context.lineWidth = currentTool.lineWidth;
      context.globalCompositeOperation = 'source-over';
      context.lineTo(pos.x, pos.y);
      context.stroke();
    } else if (currentTool.type === 'eraser') {
      context.globalCompositeOperation = 'destination-out';
      context.lineWidth = currentTool.lineWidth * 3;
      context.lineTo(pos.x, pos.y);
      context.stroke();
    } else if (startPos && ['line', 'circle', 'rectangle'].includes(currentTool.type)) {
      // For shapes, we need to redraw from the last saved state
      const currentState = history[historyIndex];
      if (currentState) {
        context.putImageData(currentState.imageData, 0, 0);
      }

      context.strokeStyle = currentTool.color;
      context.lineWidth = currentTool.lineWidth;
      context.globalCompositeOperation = 'source-over';
      context.beginPath();

      if (currentTool.type === 'line') {
        context.moveTo(startPos.x, startPos.y);
        context.lineTo(pos.x, pos.y);
      } else if (currentTool.type === 'circle') {
        const radius = Math.sqrt(
          Math.pow(pos.x - startPos.x, 2) + Math.pow(pos.y - startPos.y, 2)
        );
        context.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
      } else if (currentTool.type === 'rectangle') {
        const width = pos.x - startPos.x;
        const height = pos.y - startPos.y;
        context.rect(startPos.x, startPos.y, width, height);
      }

      context.stroke();
    }
  };

  const stopDrawing = () => {
    if (isDrawing && context) {
      context.closePath();
      saveToHistory(context);
    }
    setIsDrawing(false);
    setStartPos(null);
  };

  const handleClearCanvas = () => {
    if (context && canvasRef.current) {
      context.fillStyle = '#FFFFFF';
      context.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      saveToHistory(context);
      setSuccess('Canvas cleared!');
    }
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;

    canvasRef.current.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `whiteboard_${new Date().getTime()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setSuccess('Whiteboard exported!');
      }
    });
  };

  const handleToolChange = (type: DrawingTool['type']) => {
    setCurrentTool({ ...currentTool, type });
  };

  const handleColorChange = (color: string) => {
    setCurrentTool({ ...currentTool, color });
    setColorAnchor(null);
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
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Collaborative Whiteboard
            </Typography>
            <Chip
              label={`Team ${teamId || 'Demo'}`}
              color="primary"
              variant="outlined"
              size="small"
            />
          </Box>

          <Box display="flex" alignItems="center" gap={2}>
            {/* Active Users */}
            <AvatarGroup max={4}>
              <Tooltip title={`${currentUser.name} (You)`}>
                <Avatar
                  sx={{
                    bgcolor: currentUser.color,
                    width: 32,
                    height: 32,
                    fontSize: '0.875rem'
                  }}
                >
                  {currentUser.name.charAt(0)}
                </Avatar>
              </Tooltip>
              {activeUsers.map((user) => (
                <Tooltip
                  key={user.id}
                  title={`${user.name} ${user.isActive ? '(active)' : '(idle)'}`}
                >
                  <Avatar
                    sx={{
                      bgcolor: user.color,
                      width: 32,
                      height: 32,
                      fontSize: '0.875rem',
                      opacity: user.isActive ? 1 : 0.5
                    }}
                  >
                    {user.name.charAt(0)}
                  </Avatar>
                </Tooltip>
              ))}
            </AvatarGroup>

            <Chip
              label={`${activeUsers.filter(u => u.isActive).length + 1} active`}
              size="small"
              color="success"
            />

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

      {/* Toolbar */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          {/* Drawing Tools */}
          <ButtonGroup variant="outlined" size="small">
            <Tooltip title="Pen">
              <Button
                onClick={() => handleToolChange('pen')}
                variant={currentTool.type === 'pen' ? 'contained' : 'outlined'}
              >
                <BrushIcon />
              </Button>
            </Tooltip>
            <Tooltip title="Eraser">
              <Button
                onClick={() => handleToolChange('eraser')}
                variant={currentTool.type === 'eraser' ? 'contained' : 'outlined'}
              >
                <EraseIcon />
              </Button>
            </Tooltip>
            <Tooltip title="Line">
              <Button
                onClick={() => handleToolChange('line')}
                variant={currentTool.type === 'line' ? 'contained' : 'outlined'}
              >
                <LineIcon />
              </Button>
            </Tooltip>
            <Tooltip title="Circle">
              <Button
                onClick={() => handleToolChange('circle')}
                variant={currentTool.type === 'circle' ? 'contained' : 'outlined'}
              >
                <CircleIcon />
              </Button>
            </Tooltip>
            <Tooltip title="Rectangle">
              <Button
                onClick={() => handleToolChange('rectangle')}
                variant={currentTool.type === 'rectangle' ? 'contained' : 'outlined'}
              >
                <SquareIcon />
              </Button>
            </Tooltip>
          </ButtonGroup>

          <Divider orientation="vertical" flexItem />

          {/* Color Picker */}
          <Tooltip title="Color">
            <IconButton
              onClick={(e) => setColorAnchor(e.currentTarget)}
              sx={{
                bgcolor: currentTool.color,
                border: '2px solid #ccc',
                '&:hover': { bgcolor: currentTool.color }
              }}
            >
              <ColorIcon sx={{ color: currentTool.color === '#FFFFFF' ? '#000' : '#fff' }} />
            </IconButton>
          </Tooltip>

          {/* Line Width */}
          <Box sx={{ width: 150, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ minWidth: 60 }}>
              Width: {currentTool.lineWidth}px
            </Typography>
            <Slider
              value={currentTool.lineWidth}
              onChange={(_, value) => setCurrentTool({ ...currentTool, lineWidth: value as number })}
              min={1}
              max={20}
              size="small"
            />
          </Box>

          <Divider orientation="vertical" flexItem />

          {/* Undo/Redo */}
          <ButtonGroup variant="outlined" size="small">
            <Tooltip title="Undo">
              <span>
                <Button onClick={handleUndo} disabled={historyIndex <= 0}>
                  <UndoIcon />
                </Button>
              </span>
            </Tooltip>
            <Tooltip title="Redo">
              <span>
                <Button onClick={handleRedo} disabled={historyIndex >= history.length - 1}>
                  <RedoIcon />
                </Button>
              </span>
            </Tooltip>
          </ButtonGroup>

          <Divider orientation="vertical" flexItem />

          {/* Clear Canvas */}
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<ClearIcon />}
            onClick={handleClearCanvas}
          >
            Clear
          </Button>
        </Box>
      </Paper>

      {/* Canvas */}
      <Paper sx={{ flex: 1, p: 2, display: 'flex', overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          style={{
            border: '1px solid #e0e0e0',
            cursor: currentTool.type === 'eraser' ? 'crosshair' : 'default',
            width: '100%',
            height: '100%',
            touchAction: 'none'
          }}
        />
      </Paper>

      {/* Color Picker Popover */}
      <Popover
        open={Boolean(colorAnchor)}
        anchorEl={colorAnchor}
        onClose={() => setColorAnchor(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
      >
        <Box sx={{ p: 2, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
          {colors.map((color) => (
            <IconButton
              key={color}
              onClick={() => handleColorChange(color)}
              sx={{
                bgcolor: color,
                width: 32,
                height: 32,
                border: color === currentTool.color ? '3px solid #1976d2' : '1px solid #ccc',
                '&:hover': { bgcolor: color, transform: 'scale(1.1)' }
              }}
            />
          ))}
        </Box>
      </Popover>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => { handleDownload(); setMenuAnchor(null); }}>
          <DownloadIcon fontSize="small" sx={{ mr: 1 }} />
          Export as PNG
        </MenuItem>
        <MenuItem onClick={() => { handleClearCanvas(); setMenuAnchor(null); }}>
          <ClearIcon fontSize="small" sx={{ mr: 1 }} />
          Clear Canvas
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default WhiteboardPage;
