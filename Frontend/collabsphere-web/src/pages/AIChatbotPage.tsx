import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Chip,
  Button,
  Menu,
  MenuItem,
  Divider,
  CircularProgress,
  Alert,
  Card,
  CardContent
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
  MoreVert as MoreIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  AttachFile as AttachFileIcon,
  AutoAwesome as SparkleIcon,
  TipsAndUpdates as IdeaIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type?: 'text' | 'suggestion';
}

interface Suggestion {
  text: string;
  category: string;
}

const AIChatbotPage: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const suggestions: Suggestion[] = [
    { text: 'Help me brainstorm features for an e-commerce app', category: 'Brainstorming' },
    { text: 'Suggest milestones for a mobile app project', category: 'Planning' },
    { text: 'What are best practices for API design?', category: 'Technical' },
    { text: 'How should I structure my project documentation?', category: 'Documentation' }
  ];

  useEffect(() => {
    // Welcome message
    if (messages.length === 0) {
      setMessages([
        {
          id: '1',
          content: `Hello ${user?.fullName || 'there'}! 👋 I'm your AI assistant. I can help you with:

• Brainstorming project ideas
• Planning milestones and tasks
• Suggesting best practices
• Answering technical questions
• Providing guidance on project management

How can I assist you today?`,
          sender: 'ai',
          timestamp: new Date()
        }
      ]);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);
    setError('');

    try {
      // TODO: Implement actual AWS Bedrock API integration
      // Simulate AI response for now
      await new Promise(resolve => setTimeout(resolve, 1500));

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: generateAIResponse(inputMessage),
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (err) {
      setError('Failed to get response from AI. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateAIResponse = (userInput: string): string => {
    // Simple mock responses based on keywords
    const input = userInput.toLowerCase();

    if (input.includes('brainstorm') || input.includes('idea')) {
      return `Great! Let's brainstorm together. Here are some ideas to get started:

1. **Core Features**: What are the essential functionalities your users need?
2. **User Experience**: How can we make the interface intuitive and engaging?
3. **Unique Value**: What makes your project stand out from competitors?

Could you tell me more about your project domain and target audience?`;
    }

    if (input.includes('milestone') || input.includes('plan')) {
      return `For effective milestone planning, I recommend:

1. **Initial Setup** (Week 1-2)
   - Requirements gathering
   - Technology stack selection
   - Project structure setup

2. **Development Phase** (Week 3-8)
   - Core feature implementation
   - API development
   - Frontend integration

3. **Testing & Refinement** (Week 9-10)
   - Unit and integration testing
   - User acceptance testing
   - Bug fixes

4. **Deployment** (Week 11-12)
   - Production setup
   - Documentation
   - Launch

Would you like me to elaborate on any specific phase?`;
    }

    if (input.includes('best practice') || input.includes('api')) {
      return `Here are some API design best practices:

✅ **RESTful Principles**: Use appropriate HTTP methods (GET, POST, PUT, DELETE)
✅ **Versioning**: Include version in URL (e.g., /api/v1/users)
✅ **Error Handling**: Return meaningful error messages with proper status codes
✅ **Authentication**: Implement JWT or OAuth for security
✅ **Documentation**: Use Swagger/OpenAPI for clear API docs
✅ **Pagination**: Implement pagination for list endpoints
✅ **Rate Limiting**: Protect your API from abuse

Would you like details on any of these points?`;
    }

    if (input.includes('documentation') || input.includes('document')) {
      return `For project documentation, I suggest this structure:

📋 **README.md**
- Project overview
- Installation instructions
- Quick start guide

📋 **ARCHITECTURE.md**
- System design
- Technology stack
- Data flow diagrams

📋 **API_DOCS.md**
- Endpoint specifications
- Request/response examples
- Authentication details

📋 **CONTRIBUTING.md**
- Development setup
- Code style guidelines
- Pull request process

Would you like help creating any of these documents?`;
    }

    return `I understand you're asking about "${userInput}".

I can help you with:
• Breaking down this topic into actionable steps
• Providing specific examples and code snippets
• Suggesting tools and resources
• Reviewing your approach

Could you provide more context about what specific aspect you'd like to explore?`;
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, messageId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedMessageId(messageId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedMessageId(null);
  };

  const handleCopyMessage = () => {
    const message = messages.find(m => m.id === selectedMessageId);
    if (message) {
      navigator.clipboard.writeText(message.content);
    }
    handleMenuClose();
  };

  const handleDeleteMessage = () => {
    setMessages(prev => prev.filter(m => m.id !== selectedMessageId));
    handleMenuClose();
  };

  const handleClearChat = () => {
    setMessages([]);
    handleMenuClose();
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // TODO: Implement file upload for context
      console.log('File selected:', file.name);
    }
  };

  return (
    <Box sx={{ height: 'calc(100vh - 180px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <BotIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={600}>
              AI Assistant
            </Typography>
            <Box display="flex" alignItems="center" gap={0.5}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  bgcolor: 'success.main',
                  borderRadius: '50%'
                }}
              />
              <Typography variant="caption" color="text.secondary">
                Online
              </Typography>
            </Box>
          </Box>
        </Box>
        <IconButton onClick={(e) => handleMenuOpen(e, 'menu')}>
          <MoreIcon />
        </IconButton>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Suggestions (show when no messages except welcome) */}
      {messages.length <= 1 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IdeaIcon fontSize="small" />
            Try asking:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {suggestions.map((suggestion, index) => (
              <Chip
                key={index}
                label={suggestion.text}
                onClick={() => handleSuggestionClick(suggestion.text)}
                variant="outlined"
                size="small"
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Messages */}
      <Paper
        sx={{
          flex: 1,
          p: 2,
          overflowY: 'auto',
          bgcolor: 'grey.50',
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}
      >
        {messages.map((message) => (
          <Box
            key={message.id}
            sx={{
              display: 'flex',
              gap: 1.5,
              alignItems: 'flex-start',
              flexDirection: message.sender === 'user' ? 'row-reverse' : 'row'
            }}
          >
            <Avatar
              sx={{
                bgcolor: message.sender === 'ai' ? 'primary.main' : 'secondary.main',
                width: 36,
                height: 36
              }}
            >
              {message.sender === 'ai' ? <BotIcon /> : <PersonIcon />}
            </Avatar>

            <Card
              sx={{
                maxWidth: '70%',
                bgcolor: message.sender === 'ai' ? 'white' : 'primary.light',
                boxShadow: 1
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography
                  variant="body2"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    color: message.sender === 'ai' ? 'text.primary' : 'primary.contrastText'
                  }}
                >
                  {message.content}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    mt: 1,
                    color: message.sender === 'ai' ? 'text.secondary' : 'primary.contrastText',
                    opacity: 0.7
                  }}
                >
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Typography>
              </CardContent>
            </Card>

            <IconButton
              size="small"
              onClick={(e) => handleMenuOpen(e, message.id)}
              sx={{ opacity: 0.5, '&:hover': { opacity: 1 } }}
            >
              <MoreIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}

        {loading && (
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
              <BotIcon />
            </Avatar>
            <Card sx={{ p: 2 }}>
              <Box display="flex" gap={0.5}>
                <CircularProgress size={8} />
                <CircularProgress size={8} />
                <CircularProgress size={8} />
              </Box>
            </Card>
          </Box>
        )}

        <div ref={messagesEndRef} />
      </Paper>

      {/* Input */}
      <Paper sx={{ p: 2, mt: 2 }}>
        <Box display="flex" gap={1} alignItems="flex-end">
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: 'none' }}
            onChange={handleFileChange}
            accept=".txt,.pdf,.doc,.docx"
          />
          <IconButton size="small" onClick={handleFileUpload}>
            <AttachFileIcon />
          </IconButton>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="Ask me anything about your project..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            variant="outlined"
            size="small"
            disabled={loading}
          />
          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || loading}
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              '&:hover': { bgcolor: 'primary.dark' },
              '&:disabled': { bgcolor: 'action.disabledBackground' }
            }}
          >
            <SendIcon />
          </IconButton>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          <SparkleIcon sx={{ fontSize: 12, verticalAlign: 'middle', mr: 0.5 }} />
          AI-powered responses • Press Shift+Enter for new line
        </Typography>
      </Paper>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {selectedMessageId !== 'menu' ? (
          <>
            <MenuItem onClick={handleCopyMessage}>
              <CopyIcon fontSize="small" sx={{ mr: 1 }} />
              Copy
            </MenuItem>
            <MenuItem onClick={handleDeleteMessage}>
              <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
              Delete
            </MenuItem>
          </>
        ) : (
          <MenuItem onClick={handleClearChat}>
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Clear Chat
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default AIChatbotPage;
