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
  Chip,
  Alert,
  Rating,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
  Tabs,
  Tab,
  Avatar,
  AvatarGroup,
  Tooltip
} from '@mui/material';
import {
  RateReview as ReviewIcon,
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Assignment as AssignmentIcon,
  Feedback as FeedbackIcon,
  Grade as GradeIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import StatCard from '../components/StatCard';

interface Team {
  id: string;
  name: string;
  projectName: string;
  members: string[];
  submissionCount: number;
  lastSubmission?: string;
}

interface Submission {
  id: string;
  teamId: string;
  teamName: string;
  projectName: string;
  type: 'Milestone' | 'Checkpoint' | 'Project';
  title: string;
  description: string;
  submittedAt: string;
  status: 'Pending' | 'Reviewed' | 'Approved' | 'Rejected';
  grade?: number;
  feedback?: string;
  files?: string[];
}

interface FeedbackCriteria {
  id: string;
  name: string;
  weight: number;
  score: number;
}

const EvaluationFeedbackPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [teams, setTeams] = useState<Team[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const feedbackCriteria: FeedbackCriteria[] = [
    { id: 'quality', name: 'Code Quality', weight: 25, score: 0 },
    { id: 'functionality', name: 'Functionality', weight: 30, score: 0 },
    { id: 'documentation', name: 'Documentation', weight: 15, score: 0 },
    { id: 'design', name: 'Design & Architecture', weight: 20, score: 0 },
    { id: 'testing', name: 'Testing', weight: 10, score: 0 }
  ];

  const [formData, setFormData] = useState({
    criteria: feedbackCriteria,
    overallGrade: 0,
    feedback: '',
    status: 'Approved' as 'Approved' | 'Rejected'
  });

  useEffect(() => {
    loadTeams();
    loadSubmissions();
  }, []);

  const loadTeams = async () => {
    try {
      // TODO: Implement API call
      const mockTeams: Team[] = [
        {
          id: 't1',
          name: 'Team Alpha',
          projectName: 'E-Commerce Platform',
          members: ['Alice', 'Bob', 'Charlie'],
          submissionCount: 3,
          lastSubmission: '2024-02-15'
        },
        {
          id: 't2',
          name: 'Team Beta',
          projectName: 'Mobile App Development',
          members: ['Diana', 'Eve'],
          submissionCount: 2,
          lastSubmission: '2024-02-14'
        },
        {
          id: 't3',
          name: 'Team Gamma',
          projectName: 'AI Chatbot System',
          members: ['Frank', 'Grace', 'Henry'],
          submissionCount: 4,
          lastSubmission: '2024-02-16'
        }
      ];
      setTeams(mockTeams);
    } catch (err) {
      setError('Failed to load teams');
      console.error(err);
    }
  };

  const loadSubmissions = async () => {
    try {
      // TODO: Implement API call
      const mockSubmissions: Submission[] = [
        {
          id: 's1',
          teamId: 't1',
          teamName: 'Team Alpha',
          projectName: 'E-Commerce Platform',
          type: 'Milestone',
          title: 'Database Schema Design',
          description: 'Complete database schema with ER diagrams and table specifications',
          submittedAt: '2024-02-15T10:30:00',
          status: 'Pending'
        },
        {
          id: 's2',
          teamId: 't2',
          teamName: 'Team Beta',
          projectName: 'Mobile App Development',
          type: 'Checkpoint',
          title: 'UI/UX Prototype',
          description: 'Interactive prototype with all main screens and navigation flows',
          submittedAt: '2024-02-14T14:20:00',
          status: 'Pending'
        },
        {
          id: 's3',
          teamId: 't3',
          teamName: 'Team Gamma',
          projectName: 'AI Chatbot System',
          type: 'Milestone',
          title: 'NLP Model Training',
          description: 'Trained model with test results and performance metrics',
          submittedAt: '2024-02-13T09:15:00',
          status: 'Reviewed',
          grade: 88,
          feedback: 'Good work on the model training. Consider improving the accuracy with more diverse training data.'
        },
        {
          id: 's4',
          teamId: 't1',
          teamName: 'Team Alpha',
          projectName: 'E-Commerce Platform',
          type: 'Project',
          title: 'Final Project Submission',
          description: 'Complete e-commerce platform with all features implemented',
          submittedAt: '2024-02-16T16:45:00',
          status: 'Approved',
          grade: 95,
          feedback: 'Excellent work! The platform is fully functional with clean code and comprehensive documentation.'
        }
      ];
      setSubmissions(mockSubmissions);
    } catch (err) {
      setError('Failed to load submissions');
      console.error(err);
    }
  };

  const handleOpenDialog = (submission: Submission) => {
    setSelectedSubmission(submission);

    if (submission.status === 'Reviewed' || submission.status === 'Approved') {
      // Load existing evaluation
      setFormData({
        criteria: feedbackCriteria,
        overallGrade: submission.grade || 0,
        feedback: submission.feedback || '',
        status: submission.status === 'Approved' ? 'Approved' : 'Rejected'
      });
    } else {
      // Initialize new evaluation
      setFormData({
        criteria: feedbackCriteria,
        overallGrade: 0,
        feedback: '',
        status: 'Approved'
      });
    }

    setDialogOpen(true);
  };

  const handleViewSubmission = (submission: Submission) => {
    setSelectedSubmission(submission);
    setViewDialogOpen(true);
  };

  const handleScoreChange = (criteriaId: string, value: number) => {
    const updatedCriteria = formData.criteria.map(c =>
      c.id === criteriaId ? { ...c, score: value } : c
    );

    // Calculate weighted grade
    const totalGrade = updatedCriteria.reduce(
      (sum, c) => sum + (c.score * c.weight / 100),
      0
    );

    setFormData({
      ...formData,
      criteria: updatedCriteria,
      overallGrade: Math.round(totalGrade)
    });
  };

  const handleSubmitEvaluation = async () => {
    if (!selectedSubmission) return;

    if (formData.overallGrade === 0) {
      setError('Please provide scores for all criteria');
      return;
    }

    if (!formData.feedback.trim()) {
      setError('Please provide feedback');
      return;
    }

    try {
      // TODO: Implement API call
      const updatedSubmissions = submissions.map(s =>
        s.id === selectedSubmission.id
          ? {
              ...s,
              status: formData.status,
              grade: formData.overallGrade,
              feedback: formData.feedback
            }
          : s
      );

      setSubmissions(updatedSubmissions);
      setSuccess(`Evaluation submitted successfully! Grade: ${formData.overallGrade}/100`);
      setDialogOpen(false);
      setSelectedSubmission(null);
    } catch (err) {
      setError('Failed to submit evaluation');
      console.error(err);
    }
  };

  const getStatusColor = (status: string): "warning" | "info" | "success" | "error" => {
    switch (status) {
      case 'Pending': return 'warning';
      case 'Reviewed': return 'info';
      case 'Approved': return 'success';
      case 'Rejected': return 'error';
      default: return 'warning';
    }
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'Milestone': return '#3b82f6';
      case 'Checkpoint': return '#f59e0b';
      case 'Project': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const filteredSubmissions = tabValue === 0
    ? submissions.filter(s => s.status === 'Pending')
    : submissions.filter(s => s.status === 'Reviewed' || s.status === 'Approved' || s.status === 'Rejected');

  const stats = {
    totalSubmissions: submissions.length,
    pending: submissions.filter(s => s.status === 'Pending').length,
    reviewed: submissions.filter(s => s.status === 'Reviewed' || s.status === 'Approved').length,
    avgGrade: Math.round(
      submissions
        .filter(s => s.grade)
        .reduce((sum, s) => sum + (s.grade || 0), 0) /
      submissions.filter(s => s.grade).length
    ) || 0
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        Evaluation & Feedback
      </Typography>

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Submissions"
            value={stats.totalSubmissions}
            icon={<AssignmentIcon />}
            color="#3b82f6"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Review"
            value={stats.pending}
            icon={<ReviewIcon />}
            color="#f59e0b"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Reviewed"
            value={stats.reviewed}
            icon={<CheckCircleIcon />}
            color="#10b981"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Average Grade"
            value={stats.avgGrade > 0 ? `${stats.avgGrade}%` : 'N/A'}
            icon={<GradeIcon />}
            color="#8b5cf6"
          />
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label={`Pending Review (${stats.pending})`} />
          <Tab label={`Reviewed (${stats.reviewed})`} />
        </Tabs>
      </Paper>

      {/* Submissions List */}
      <Grid container spacing={3}>
        {filteredSubmissions.length === 0 ? (
          <Grid item xs={12}>
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <FeedbackIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                {tabValue === 0 ? 'No pending submissions' : 'No reviewed submissions'}
              </Typography>
            </Paper>
          </Grid>
        ) : (
          filteredSubmissions.map((submission) => (
            <Grid item xs={12} md={6} key={submission.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                    <Box flex={1}>
                      <Typography variant="h6" gutterBottom>
                        {submission.title}
                      </Typography>
                      <Box display="flex" gap={1} mb={1}>
                        <Chip
                          label={submission.type}
                          size="small"
                          sx={{ bgcolor: getTypeColor(submission.type), color: 'white' }}
                        />
                        <Chip
                          label={submission.status}
                          color={getStatusColor(submission.status)}
                          size="small"
                        />
                        {submission.grade && (
                          <Chip
                            label={`${submission.grade}%`}
                            color={submission.grade >= 70 ? 'success' : 'error'}
                            size="small"
                          />
                        )}
                      </Box>
                    </Box>
                  </Box>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {submission.teamName} • {submission.projectName}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {submission.description}
                  </Typography>

                  <Typography variant="caption" color="text.secondary">
                    Submitted: {new Date(submission.submittedAt).toLocaleString()}
                  </Typography>

                  {submission.feedback && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        Feedback:
                      </Typography>
                      <Typography variant="caption" display="block">
                        {submission.feedback}
                      </Typography>
                    </Alert>
                  )}

                  <Box display="flex" gap={1} mt={2}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<ViewIcon />}
                      onClick={() => handleViewSubmission(submission)}
                    >
                      View Details
                    </Button>
                    {submission.status === 'Pending' ? (
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<ReviewIcon />}
                        onClick={() => handleOpenDialog(submission)}
                      >
                        Evaluate
                      </Button>
                    ) : (
                      <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        onClick={() => handleOpenDialog(submission)}
                      >
                        Update
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Evaluation Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Evaluate: {selectedSubmission?.title}
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            Rate each criterion on a scale of 0-100. The overall grade will be calculated based on weighted scores.
          </Alert>

          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
            {selectedSubmission?.teamName} • {selectedSubmission?.projectName}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 3 }}>
            Submitted: {selectedSubmission && new Date(selectedSubmission.submittedAt).toLocaleString()}
          </Typography>

          <Divider sx={{ my: 2 }} />

          {/* Criteria Scoring */}
          {formData.criteria.map((criteria) => (
            <Box key={criteria.id} mb={3}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {criteria.name}
                </Typography>
                <Chip label={`${criteria.weight}%`} size="small" variant="outlined" />
              </Box>
              <Box display="flex" alignItems="center" gap={2}>
                <TextField
                  type="number"
                  size="small"
                  value={criteria.score}
                  onChange={(e) => handleScoreChange(criteria.id, Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                  inputProps={{ min: 0, max: 100 }}
                  sx={{ width: 100 }}
                />
                <LinearProgress
                  variant="determinate"
                  value={criteria.score}
                  sx={{ flex: 1, height: 8, borderRadius: 4 }}
                />
                <Typography variant="body2" sx={{ minWidth: 40, textAlign: 'right' }}>
                  {criteria.score}/100
                </Typography>
              </Box>
            </Box>
          ))}

          <Divider sx={{ my: 2 }} />

          {/* Overall Grade */}
          <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'primary.50' }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
              Overall Grade (Weighted)
            </Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
                {formData.overallGrade}%
              </Typography>
              <Rating
                value={formData.overallGrade / 20}
                readOnly
                precision={0.5}
              />
            </Box>
          </Paper>

          {/* Status */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={formData.status}
              label="Status"
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            >
              <MenuItem value="Approved">Approve</MenuItem>
              <MenuItem value="Rejected">Reject</MenuItem>
            </Select>
          </FormControl>

          {/* Feedback */}
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Feedback & Comments"
            value={formData.feedback}
            onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
            placeholder="Provide detailed feedback on the submission..."
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={handleSubmitEvaluation}
            color={formData.status === 'Approved' ? 'success' : 'error'}
          >
            {formData.status === 'Approved' ? 'Approve & Submit' : 'Reject & Submit'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Submission Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Submission Details
        </DialogTitle>
        <DialogContent>
          {selectedSubmission && (
            <>
              <Typography variant="h6" gutterBottom>
                {selectedSubmission.title}
              </Typography>
              <Box display="flex" gap={1} mb={2}>
                <Chip label={selectedSubmission.type} size="small" />
                <Chip label={selectedSubmission.status} color={getStatusColor(selectedSubmission.status)} size="small" />
              </Box>

              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Team:</strong> {selectedSubmission.teamName}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Project:</strong> {selectedSubmission.projectName}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Submitted:</strong> {new Date(selectedSubmission.submittedAt).toLocaleString()}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                Description
              </Typography>
              <Typography variant="body2" paragraph>
                {selectedSubmission.description}
              </Typography>

              {selectedSubmission.grade && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                    Grade
                  </Typography>
                  <Typography variant="h5" color="primary" gutterBottom>
                    {selectedSubmission.grade}%
                  </Typography>
                </>
              )}

              {selectedSubmission.feedback && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                    Feedback
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="body2">
                      {selectedSubmission.feedback}
                    </Typography>
                  </Paper>
                </>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EvaluationFeedbackPage;
