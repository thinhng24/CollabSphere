import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Badge,
  Divider,
  InputAdornment,
  Chip
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SearchIcon from '@mui/icons-material/Search';
import GroupIcon from '@mui/icons-material/Group';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import { ChatRoom, ChatMessage } from '../types';
import { chatAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadRooms();
    }
  }, [user]);

  useEffect(() => {
    if (selectedRoom) {
      loadMessages(selectedRoom.id);
    }
  }, [selectedRoom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadRooms = async () => {
    try {
      const response = await chatAPI.getRooms(user?.id);
      setRooms(response.data.data?.items || []);
    } catch (err) {
      console.error('Failed to load chat rooms', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (roomId: string) => {
    try {
      const response = await chatAPI.getMessages(roomId);
      setMessages(response.data.data?.items || []);
      await chatAPI.markAsRead(roomId);
      // Update unread count
      setRooms(prev => prev.map(r => r.id === roomId ? { ...r, unreadCount: 0 } : r));
    } catch (err) {
      console.error('Failed to load messages', err);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom || !user) return;

    try {
      const response = await chatAPI.sendMessage(selectedRoom.id, user.id, newMessage);
      setMessages(prev => [...prev, response.data.data]);
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getRoomIcon = (type: string) => {
    switch (type) {
      case 'Team': return <GroupIcon />;
      case 'Class': return <SchoolIcon />;
      case 'Direct': return <PersonIcon />;
      default: return <GroupIcon />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 140px)', gap: 2 }}>
      {/* Rooms List */}
      <Paper sx={{ width: 320, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Messages
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        <Divider />
        <List sx={{ flex: 1, overflow: 'auto', p: 0 }}>
          {loading ? (
            <ListItem>
              <ListItemText primary="Loading..." />
            </ListItem>
          ) : filteredRooms.length === 0 ? (
            <ListItem>
              <ListItemText primary="No conversations" secondary="Start chatting with your team!" />
            </ListItem>
          ) : (
            filteredRooms.map((room) => (
              <ListItem
                key={room.id}
                button
                selected={selectedRoom?.id === room.id}
                onClick={() => setSelectedRoom(room)}
                sx={{
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  '&.Mui-selected': {
                    bgcolor: 'primary.light',
                    '&:hover': { bgcolor: 'primary.light' }
                  }
                }}
              >
                <ListItemAvatar>
                  <Badge
                    badgeContent={room.unreadCount}
                    color="error"
                    overlap="circular"
                  >
                    <Avatar sx={{ bgcolor: room.type === 'Team' ? 'primary.main' : 'secondary.main' }}>
                      {getRoomIcon(room.type)}
                    </Avatar>
                  </Badge>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle2" noWrap sx={{ maxWidth: 150 }}>
                        {room.name}
                      </Typography>
                      {room.lastMessage && (
                        <Typography variant="caption" color="text.secondary">
                          {formatTime(room.lastMessage.createdAt)}
                        </Typography>
                      )}
                    </Box>
                  }
                  secondary={
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {room.lastMessage?.content || 'No messages yet'}
                    </Typography>
                  }
                />
              </ListItem>
            ))
          )}
        </List>
      </Paper>

      {/* Chat Area */}
      <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedRoom ? (
          <>
            {/* Chat Header */}
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: selectedRoom.type === 'Team' ? 'primary.main' : 'secondary.main' }}>
                  {getRoomIcon(selectedRoom.type)}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {selectedRoom.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedRoom.participants.length} members
                  </Typography>
                </Box>
                <Chip
                  label={selectedRoom.type}
                  size="small"
                  color={selectedRoom.type === 'Team' ? 'primary' : 'secondary'}
                  sx={{ ml: 'auto' }}
                />
              </Box>
            </Box>

            {/* Messages */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 2, bgcolor: 'grey.50' }}>
              {messages.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary">
                    No messages yet. Start the conversation!
                  </Typography>
                </Box>
              ) : (
                messages.map((message, index) => {
                  const isOwn = message.senderId === user?.id;
                  const showAvatar = index === 0 || messages[index - 1].senderId !== message.senderId;

                  return (
                    <Box
                      key={message.id}
                      sx={{
                        display: 'flex',
                        justifyContent: isOwn ? 'flex-end' : 'flex-start',
                        mb: 1
                      }}
                    >
                      {!isOwn && showAvatar && (
                        <Avatar sx={{ width: 32, height: 32, mr: 1, mt: 0.5 }}>
                          {message.senderName.charAt(0)}
                        </Avatar>
                      )}
                      {!isOwn && !showAvatar && <Box sx={{ width: 40 }} />}
                      <Box sx={{ maxWidth: '70%' }}>
                        {!isOwn && showAvatar && (
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                            {message.senderName}
                          </Typography>
                        )}
                        <Paper
                          sx={{
                            p: 1.5,
                            bgcolor: isOwn ? 'primary.main' : 'white',
                            color: isOwn ? 'white' : 'text.primary',
                            borderRadius: 2,
                            borderTopRightRadius: isOwn ? 0 : 2,
                            borderTopLeftRadius: isOwn ? 2 : 0
                          }}
                        >
                          <Typography variant="body2">{message.content}</Typography>
                        </Paper>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', textAlign: isOwn ? 'right' : 'left', mt: 0.5, mx: 1 }}
                        >
                          {formatTime(message.createdAt)}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </Box>

            {/* Message Input */}
            <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <TextField
                fullWidth
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        color="primary"
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                      >
                        <SendIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </>
        ) : (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box sx={{ textAlign: 'center' }}>
              <GroupIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Select a conversation
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Choose a chat room to start messaging
              </Typography>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default ChatPage;
