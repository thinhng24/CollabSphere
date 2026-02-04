import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonChecked as RadioIcon,
  CheckBox as CheckBoxIcon,
  TextFields as TextIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import StatCard from '../components/StatCard';

interface Question {
  id: string;
  milestoneId: string;
  milestoneName: string;
  questionText: string;
  questionType: 'text' | 'multiple_choice' | 'checkbox' | 'rating';
  required: boolean;
  options?: string[];
  order: number;
  createdAt: string;
}

interface Milestone {
  id: string;
  name: string;
  description: string;
  questionCount: number;
}

const MilestoneQuestionsPage: React.FC = () => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedMilestone, setSelectedMilestone] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    milestoneId: '',
    questionText: '',
    questionType: 'text' as 'text' | 'multiple_choice' | 'checkbox' | 'rating',
    required: true,
    options: ['']
  });

  useEffect(() => {
    loadMilestones();
    loadQuestions();
  }, []);

  const loadMilestones = async () => {
    try {
      // TODO: Implement API call
      const mockMilestones: Milestone[] = [
        {
          id: 'm1',
          name: 'Project Planning & Requirements',
          description: 'Initial planning phase',
          questionCount: 3
        },
        {
          id: 'm2',
          name: 'System Design & Architecture',
          description: 'Design and architecture documentation',
          questionCount: 5
        },
        {
          id: 'm3',
          name: 'Implementation Phase 1',
          description: 'First development sprint',
          questionCount: 2
        },
        {
          id: 'm4',
          name: 'Testing & QA',
          description: 'Quality assurance and testing',
          questionCount: 4
        }
      ];
      setMilestones(mockMilestones);
    } catch (err) {
      setError('Failed to load milestones');
      console.error(err);
    }
  };

  const loadQuestions = async () => {
    try {
      // TODO: Implement API call
      const mockQuestions: Question[] = [
        {
          id: 'q1',
          milestoneId: 'm1',
          milestoneName: 'Project Planning & Requirements',
          questionText: 'What is the main objective of your project?',
          questionType: 'text',
          required: true,
          order: 1,
          createdAt: '2024-01-15'
        },
        {
          id: 'q2',
          milestoneId: 'm1',
          milestoneName: 'Project Planning & Requirements',
          questionText: 'Who are the target users?',
          questionType: 'multiple_choice',
          required: true,
          options: ['Students', 'Teachers', 'General Public', 'Businesses'],
          order: 2,
          createdAt: '2024-01-15'
        },
        {
          id: 'q3',
          milestoneId: 'm1',
          milestoneName: 'Project Planning & Requirements',
          questionText: 'Which technologies will you use?',
          questionType: 'checkbox',
          required: false,
          options: ['React', 'Node.js', 'Python', 'Java', 'C#', 'Other'],
          order: 3,
          createdAt: '2024-01-15'
        },
        {
          id: 'q4',
          milestoneId: 'm2',
          milestoneName: 'System Design & Architecture',
          questionText: 'Describe your system architecture',
          questionType: 'text',
          required: true,
          order: 1,
          createdAt: '2024-01-20'
        },
        {
          id: 'q5',
          milestoneId: 'm2',
          milestoneName: 'System Design & Architecture',
          questionText: 'What database will you use?',
          questionType: 'multiple_choice',
          required: true,
          options: ['PostgreSQL', 'MySQL', 'MongoDB', 'SQLite', 'Other'],
          order: 2,
          createdAt: '2024-01-20'
        },
        {
          id: 'q6',
          milestoneId: 'm2',
          milestoneName: 'System Design & Architecture',
          questionText: 'Rate the complexity of your architecture (1-5)',
          questionType: 'rating',
          required: true,
          order: 3,
          createdAt: '2024-01-20'
        },
        {
          id: 'q7',
          milestoneId: 'm3',
          milestoneName: 'Implementation Phase 1',
          questionText: 'What features have been implemented?',
          questionType: 'checkbox',
          required: true,
          options: ['User Authentication', 'Dashboard', 'Data Management', 'Reporting', 'API Integration'],
          order: 1,
          createdAt: '2024-02-01'
        },
        {
          id: 'q8',
          milestoneId: 'm4',
          milestoneName: 'Testing & QA',
          questionText: 'What types of testing have you conducted?',
          questionType: 'checkbox',
          required: true,
          options: ['Unit Testing', 'Integration Testing', 'E2E Testing', 'Performance Testing', 'Security Testing'],
          order: 1,
          createdAt: '2024-02-15'
        }
      ];
      setQuestions(mockQuestions);
    } catch (err) {
      setError('Failed to load questions');
      console.error(err);
    }
  };

  const handleOpenDialog = (question?: Question) => {
    if (question) {
      setEditingQuestion(question);
      setFormData({
        milestoneId: question.milestoneId,
        questionText: question.questionText,
        questionType: question.questionType,
        required: question.required,
        options: question.options || ['']
      });
    } else {
      setEditingQuestion(null);
      setFormData({
        milestoneId: '',
        questionText: '',
        questionType: 'text',
        required: true,
        options: ['']
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingQuestion(null);
  };

  const handleSaveQuestion = async () => {
    if (!formData.milestoneId || !formData.questionText) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      // TODO: Implement API call
      const milestone = milestones.find(m => m.id === formData.milestoneId);

      if (editingQuestion) {
        // Update existing question
        const updatedQuestions = questions.map(q =>
          q.id === editingQuestion.id
            ? {
                ...q,
                ...formData,
                milestoneName: milestone?.name || '',
                options: ['multiple_choice', 'checkbox'].includes(formData.questionType)
                  ? formData.options.filter(opt => opt.trim() !== '')
                  : undefined
              }
            : q
        );
        setQuestions(updatedQuestions);
        setSuccess('Question updated successfully');
      } else {
        // Create new question
        const newQuestion: Question = {
          id: `q${questions.length + 1}`,
          milestoneId: formData.milestoneId,
          milestoneName: milestone?.name || '',
          questionText: formData.questionText,
          questionType: formData.questionType,
          required: formData.required,
          options: ['multiple_choice', 'checkbox'].includes(formData.questionType)
            ? formData.options.filter(opt => opt.trim() !== '')
            : undefined,
          order: questions.filter(q => q.milestoneId === formData.milestoneId).length + 1,
          createdAt: new Date().toISOString().split('T')[0]
        };
        setQuestions([...questions, newQuestion]);
        setSuccess('Question created successfully');
      }

      handleCloseDialog();
    } catch (err) {
      setError('Failed to save question');
      console.error(err);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!window.confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      // TODO: Implement API call
      setQuestions(questions.filter(q => q.id !== questionId));
      setSuccess('Question deleted successfully');
    } catch (err) {
      setError('Failed to delete question');
      console.error(err);
    }
  };

  const handleAddOption = () => {
    setFormData({
      ...formData,
      options: [...formData.options, '']
    });
  };

  const handleRemoveOption = (index: number) => {
    const newOptions = formData.options.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      options: newOptions
    });
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({
      ...formData,
      options: newOptions
    });
  };

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <TextIcon />;
      case 'multiple_choice':
        return <RadioIcon />;
      case 'checkbox':
        return <CheckBoxIcon />;
      case 'rating':
        return <CheckCircleIcon />;
      default:
        return <HelpIcon />;
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'text':
        return 'Text Answer';
      case 'multiple_choice':
        return 'Multiple Choice';
      case 'checkbox':
        return 'Checkbox';
      case 'rating':
        return 'Rating (1-5)';
      default:
        return type;
    }
  };

  const filteredQuestions = selectedMilestone === 'all'
    ? questions
    : questions.filter(q => q.milestoneId === selectedMilestone);

  const groupedQuestions = filteredQuestions.reduce((acc, question) => {
    if (!acc[question.milestoneId]) {
      acc[question.milestoneId] = [];
    }
    acc[question.milestoneId].push(question);
    return acc;
  }, {} as Record<string, Question[]>);

  const stats = {
    totalMilestones: milestones.length,
    totalQuestions: questions.length,
    requiredQuestions: questions.filter(q => q.required).length,
    avgQuestionsPerMilestone: Math.round(questions.length / milestones.length) || 0
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Milestone Questions Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Question
        </Button>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Milestones"
            value={stats.totalMilestones}
            icon={<CheckCircleIcon />}
            color="#3b82f6"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Questions"
            value={stats.totalQuestions}
            icon={<HelpIcon />}
            color="#10b981"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Required Questions"
            value={stats.requiredQuestions}
            icon={<CheckCircleIcon />}
            color="#8b5cf6"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Avg Per Milestone"
            value={stats.avgQuestionsPerMilestone}
            icon={<HelpIcon />}
            color="#f59e0b"
          />
        </Grid>
      </Grid>

      {/* Filter */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Filter by Milestone</InputLabel>
          <Select
            value={selectedMilestone}
            label="Filter by Milestone"
            onChange={(e) => setSelectedMilestone(e.target.value)}
          >
            <MenuItem value="all">All Milestones</MenuItem>
            {milestones.map(milestone => (
              <MenuItem key={milestone.id} value={milestone.id}>
                {milestone.name} ({milestone.questionCount} questions)
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {/* Questions by Milestone */}
      <Box>
        {Object.entries(groupedQuestions).map(([milestoneId, milestoneQuestions]) => {
          const milestone = milestones.find(m => m.id === milestoneId);
          return (
            <Accordion key={milestoneId} defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" gap={2} width="100%">
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {milestone?.name}
                  </Typography>
                  <Chip
                    label={`${milestoneQuestions.length} questions`}
                    size="small"
                    color="primary"
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <List>
                  {milestoneQuestions.sort((a, b) => a.order - b.order).map((question, index) => (
                    <React.Fragment key={question.id}>
                      <ListItem
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'stretch',
                          py: 2
                        }}
                      >
                        <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                          <Box display="flex" gap={1} alignItems="center" flex={1}>
                            <Typography variant="body2" color="text.secondary">
                              Q{index + 1}
                            </Typography>
                            <Box display="flex" gap={1}>
                              <Chip
                                icon={getQuestionTypeIcon(question.questionType)}
                                label={getQuestionTypeLabel(question.questionType)}
                                size="small"
                                variant="outlined"
                              />
                              {question.required && (
                                <Chip label="Required" size="small" color="error" />
                              )}
                            </Box>
                          </Box>
                          <Box display="flex" gap={1}>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleOpenDialog(question)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteQuestion(question.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>

                        <ListItemText
                          primary={question.questionText}
                          primaryTypographyProps={{
                            variant: 'body1',
                            sx: { fontWeight: 500, mb: 1 }
                          }}
                        />

                        {question.options && question.options.length > 0 && (
                          <Box sx={{ pl: 3, mt: 1 }}>
                            <Typography variant="caption" color="text.secondary" gutterBottom>
                              Options:
                            </Typography>
                            <List dense>
                              {question.options.map((option, idx) => (
                                <ListItem key={idx} sx={{ py: 0.5 }}>
                                  <Typography variant="body2">
                                    {question.questionType === 'checkbox' ? '☐' : '○'} {option}
                                  </Typography>
                                </ListItem>
                              ))}
                            </List>
                          </Box>
                        )}
                      </ListItem>
                      {index < milestoneQuestions.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          );
        })}

        {filteredQuestions.length === 0 && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No questions found. Click "Add Question" to create one.
            </Typography>
          </Paper>
        )}
      </Box>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingQuestion ? 'Edit Question' : 'Add New Question'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth required>
              <InputLabel>Milestone</InputLabel>
              <Select
                value={formData.milestoneId}
                label="Milestone"
                onChange={(e) => setFormData({ ...formData, milestoneId: e.target.value })}
              >
                {milestones.map(milestone => (
                  <MenuItem key={milestone.id} value={milestone.id}>
                    {milestone.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Question Text"
              multiline
              rows={3}
              value={formData.questionText}
              onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
              required
              fullWidth
            />

            <FormControl fullWidth required>
              <InputLabel>Question Type</InputLabel>
              <Select
                value={formData.questionType}
                label="Question Type"
                onChange={(e) => setFormData({ ...formData, questionType: e.target.value as any })}
              >
                <MenuItem value="text">Text Answer</MenuItem>
                <MenuItem value="multiple_choice">Multiple Choice</MenuItem>
                <MenuItem value="checkbox">Checkbox (Multiple Select)</MenuItem>
                <MenuItem value="rating">Rating (1-5)</MenuItem>
              </Select>
            </FormControl>

            {(formData.questionType === 'multiple_choice' || formData.questionType === 'checkbox') && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Options
                </Typography>
                {formData.options.map((option, index) => (
                  <Box key={index} display="flex" gap={1} mb={1}>
                    <TextField
                      size="small"
                      fullWidth
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                    />
                    {formData.options.length > 1 && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveOption(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>
                ))}
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleAddOption}
                >
                  Add Option
                </Button>
              </Box>
            )}

            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.required}
                  onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                />
              }
              label="Required Question"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveQuestion}>
            {editingQuestion ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MilestoneQuestionsPage;
