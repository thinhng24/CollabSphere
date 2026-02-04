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
  Rating,
  Alert,
  Chip,
  Avatar,
  Divider,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton
} from '@mui/material';
import {
  Group as GroupIcon,
  Star as StarIcon,
  Send as SendIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import StatCard from '../components/StatCard';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Leader' | 'Member';
  avatar?: string;
}

interface Team {
  id: string;
  name: string;
  projectName: string;
  members: TeamMember[];
}

interface EvaluationCriteria {
  id: string;
  name: string;
  description: string;
  maxScore: number;
}

interface Evaluation {
  id: string;
  evaluatorId: string;
  evaluateeId: string;
  evaluateeName: string;
  teamId: string;
  teamName: string;
  criteriaScores: Record<string, number>;
  comments: string;
  submittedAt: string;
  status: 'draft' | 'submitted';
}

const PeerEvaluationPage: React.FC = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const evaluationCriteria: EvaluationCriteria[] = [
    {
      id: 'contribution',
      name: 'Contribution to Team',
      description: 'Overall contribution to team goals and project deliverables',
      maxScore: 5
    },
    {
      id: 'communication',
      name: 'Communication',
      description: 'Effectiveness in team communication and responsiveness',
      maxScore: 5
    },
    {
      id: 'reliability',
      name: 'Reliability',
      description: 'Consistency in meeting deadlines and commitments',
      maxScore: 5
    },
    {
      id: 'collaboration',
      name: 'Collaboration',
      description: 'Ability to work well with others and resolve conflicts',
      maxScore: 5
    },
    {
      id: 'technical',
      name: 'Technical Skills',
      description: 'Technical competence and problem-solving abilities',
      maxScore: 5
    }
  ];

  const [formData, setFormData] = useState({
    criteriaScores: {} as Record<string, number>,
    comments: ''
  });

  useEffect(() => {
    loadTeams();
    loadEvaluations();
  }, []);

  const loadTeams = async () => {
    try {
      // TODO: Implement API call
      const mockTeams: Team[] = [
        {
          id: 't1',
          name: 'Team Alpha',
          projectName: 'E-Commerce Platform',
          members: [
            { id: 'm1', name: 'Alice Johnson', email: 'alice@student.edu', role: 'Leader' },
            { id: 'm2', name: 'Bob Smith', email: 'bob@student.edu', role: 'Member' },
            { id: 'm3', name: 'Charlie Chen', email: 'charlie@student.edu', role: 'Member' }
          ]
        },
        {
          id: 't2',
          name: 'Team Beta',
          projectName: 'Mobile App Development',
          members: [
            { id: 'm4', name: 'Diana Lee', email: 'diana@student.edu', role: 'Leader' },
            { id: 'm5', name: 'Eve Taylor', email: 'eve@student.edu', role: 'Member' }
          ]
        }
      ];
      setTeams(mockTeams);
      if (mockTeams.length > 0) {
        setSelectedTeam(mockTeams[0].id);
      }
    } catch (err) {
      setError('Failed to load teams');
      console.error(err);
    }
  };

  const loadEvaluations = async () => {
    try {
      // TODO: Implement API call
      const mockEvaluations: Evaluation[] = [
        {
          id: 'e1',
          evaluatorId: 'm1',
          evaluateeId: 'm2',
          evaluateeName: 'Bob Smith',
          teamId: 't1',
          teamName: 'Team Alpha',
          criteriaScores: {
            contribution: 4,
            communication: 5,
            reliability: 4,
            collaboration: 5,
            technical: 4
          },
          comments: 'Great team player, very responsive and helpful.',
          submittedAt: '2024-01-15T10:30:00',
          status: 'submitted'
        }
      ];
      setEvaluations(mockEvaluations);
    } catch (err) {
      setError('Failed to load evaluations');
      console.error(err);
    }
  };

  const handleOpenDialog = (member: TeamMember) => {
    setSelectedMember(member);

    // Check if evaluation already exists
    const existingEval = evaluations.find(
      e => e.evaluateeId === member.id && e.teamId === selectedTeam && e.status === 'draft'
    );

    if (existingEval) {
      setFormData({
        criteriaScores: existingEval.criteriaScores,
        comments: existingEval.comments
      });
    } else {
      // Initialize with zeros
      const initialScores: Record<string, number> = {};
      evaluationCriteria.forEach(c => {
        initialScores[c.id] = 0;
      });
      setFormData({
        criteriaScores: initialScores,
        comments: ''
      });
    }

    setDialogOpen(true);
  };

  const handleViewEvaluation = (evaluation: Evaluation) => {
    setSelectedEvaluation(evaluation);
    setViewDialogOpen(true);
  };

  const handleScoreChange = (criteriaId: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      criteriaScores: {
        ...prev.criteriaScores,
        [criteriaId]: value
      }
    }));
  };

  const handleSubmitEvaluation = async () => {
    if (!selectedMember) return;

    // Validate all criteria are scored
    const unscored = evaluationCriteria.filter(
      c => !formData.criteriaScores[c.id] || formData.criteriaScores[c.id] === 0
    );

    if (unscored.length > 0) {
      setError(`Please rate all criteria (${unscored.length} remaining)`);
      return;
    }

    try {
      // TODO: Implement API call
      const newEvaluation: Evaluation = {
        id: `e${evaluations.length + 1}`,
        evaluatorId: 'current-user-id',
        evaluateeId: selectedMember.id,
        evaluateeName: selectedMember.name,
        teamId: selectedTeam,
        teamName: teams.find(t => t.id === selectedTeam)?.name || '',
        criteriaScores: formData.criteriaScores,
        comments: formData.comments,
        submittedAt: new Date().toISOString(),
        status: 'submitted'
      };

      setEvaluations([...evaluations, newEvaluation]);
      setSuccess(`Evaluation for ${selectedMember.name} submitted successfully!`);
      setDialogOpen(false);
      setSelectedMember(null);
    } catch (err) {
      setError('Failed to submit evaluation');
      console.error(err);
    }
  };

  const getAverageScore = (scores: Record<string, number>): number => {
    const values = Object.values(scores);
    if (values.length === 0) return 0;
    return values.reduce((sum, score) => sum + score, 0) / values.length;
  };

  const hasEvaluated = (memberId: string): boolean => {
    return evaluations.some(
      e => e.evaluateeId === memberId && e.teamId === selectedTeam && e.status === 'submitted'
    );
  };

  const getEvaluationForMember = (memberId: string): Evaluation | undefined => {
    return evaluations.find(
      e => e.evaluateeId === memberId && e.teamId === selectedTeam && e.status === 'submitted'
    );
  };

  const selectedTeamData = teams.find(t => t.id === selectedTeam);
  const currentUserId = 'm1'; // TODO: Get from auth context
  const teammatesForEvaluation = selectedTeamData?.members.filter(m => m.id !== currentUserId) || [];

  const stats = {
    totalTeams: teams.length,
    evaluationsSubmitted: evaluations.filter(e => e.status === 'submitted').length,
    evaluationsPending: teammatesForEvaluation.length - teammatesForEvaluation.filter(m => hasEvaluated(m.id)).length,
    completionRate: teammatesForEvaluation.length > 0
      ? Math.round((teammatesForEvaluation.filter(m => hasEvaluated(m.id)).length / teammatesForEvaluation.length) * 100)
      : 0
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Peer Evaluation
        </Typography>
        <IconButton onClick={() => navigate('/teams')}>
          <ArrowBackIcon />
        </IconButton>
      </Box>

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
            title="My Teams"
            value={stats.totalTeams}
            icon={<GroupIcon />}
            color="#3b82f6"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Submitted"
            value={stats.evaluationsSubmitted}
            icon={<CheckCircleIcon />}
            color="#10b981"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending"
            value={stats.evaluationsPending}
            icon={<StarIcon />}
            color="#f59e0b"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completion"
            value={`${stats.completionRate}%`}
            icon={<StarIcon />}
            color="#8b5cf6"
          />
        </Grid>
      </Grid>

      {/* Team Selection */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <FormControl fullWidth>
          <InputLabel>Select Team</InputLabel>
          <Select
            value={selectedTeam}
            label="Select Team"
            onChange={(e) => setSelectedTeam(e.target.value)}
          >
            {teams.map(team => (
              <MenuItem key={team.id} value={team.id}>
                {team.name} - {team.projectName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {/* Team Members to Evaluate */}
      {selectedTeamData && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Evaluate Your Teammates
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Rate each team member based on their contribution and performance
          </Typography>

          <List>
            {teammatesForEvaluation.map((member, index) => {
              const evaluated = hasEvaluated(member.id);
              const evaluation = getEvaluationForMember(member.id);
              const avgScore = evaluation ? getAverageScore(evaluation.criteriaScores) : 0;

              return (
                <React.Fragment key={member.id}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: member.role === 'Leader' ? 'primary.main' : 'grey.500' }}>
                        {member.name.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {member.name}
                          </Typography>
                          {member.role === 'Leader' && (
                            <Chip label="Leader" size="small" color="primary" />
                          )}
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="caption" color="text.secondary">
                            {member.email}
                          </Typography>
                          {evaluated && (
                            <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                              <Rating value={avgScore} readOnly size="small" precision={0.1} />
                              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                {avgScore.toFixed(1)} / 5.0
                              </Typography>
                            </Box>
                          )}
                        </>
                      }
                    />
                    <Box display="flex" gap={1}>
                      {evaluated ? (
                        <>
                          <Chip
                            icon={<CheckCircleIcon />}
                            label="Evaluated"
                            color="success"
                            size="small"
                          />
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<ViewIcon />}
                            onClick={() => evaluation && handleViewEvaluation(evaluation)}
                          >
                            View
                          </Button>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenDialog(member)}
                          >
                            <EditIcon />
                          </IconButton>
                        </>
                      ) : (
                        <Button
                          variant="contained"
                          startIcon={<StarIcon />}
                          onClick={() => handleOpenDialog(member)}
                        >
                          Evaluate
                        </Button>
                      )}
                    </Box>
                  </ListItem>
                  {index < teammatesForEvaluation.length - 1 && <Divider />}
                </React.Fragment>
              );
            })}
          </List>

          {teammatesForEvaluation.length === 0 && (
            <Typography color="text.secondary" align="center" py={4}>
              No teammates to evaluate in this team
            </Typography>
          )}
        </Paper>
      )}

      {/* Evaluation Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Evaluate {selectedMember?.name}
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            Rate your teammate on a scale of 1-5 stars for each criterion. Your feedback will help improve team collaboration.
          </Alert>

          {evaluationCriteria.map((criteria, index) => (
            <Box key={criteria.id} mb={3}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                {criteria.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                {criteria.description}
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <Rating
                  value={formData.criteriaScores[criteria.id] || 0}
                  onChange={(_, value) => handleScoreChange(criteria.id, value || 0)}
                  size="large"
                />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {formData.criteriaScores[criteria.id] || 0} / {criteria.maxScore}
                </Typography>
              </Box>
              {index < evaluationCriteria.length - 1 && <Divider sx={{ mt: 2 }} />}
            </Box>
          ))}

          <TextField
            fullWidth
            multiline
            rows={4}
            label="Additional Comments (Optional)"
            value={formData.comments}
            onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
            placeholder="Share specific examples or suggestions for improvement..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={handleSubmitEvaluation}
          >
            Submit Evaluation
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Evaluation Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Evaluation for {selectedEvaluation?.evaluateeName}
        </DialogTitle>
        <DialogContent>
          {selectedEvaluation && (
            <>
              <Box mb={2}>
                <Typography variant="caption" color="text.secondary">
                  Submitted on {new Date(selectedEvaluation.submittedAt).toLocaleDateString()}
                </Typography>
              </Box>

              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                    Overall Rating
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Rating
                      value={getAverageScore(selectedEvaluation.criteriaScores)}
                      readOnly
                      precision={0.1}
                    />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {getAverageScore(selectedEvaluation.criteriaScores).toFixed(1)} / 5.0
                    </Typography>
                  </Box>
                </CardContent>
              </Card>

              {evaluationCriteria.map((criteria) => (
                <Box key={criteria.id} mb={2}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {criteria.name}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Rating
                      value={selectedEvaluation.criteriaScores[criteria.id] || 0}
                      readOnly
                      size="small"
                    />
                    <Typography variant="caption">
                      {selectedEvaluation.criteriaScores[criteria.id]} / 5
                    </Typography>
                  </Box>
                </Box>
              ))}

              {selectedEvaluation.comments && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                    Comments
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="body2">
                      {selectedEvaluation.comments}
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

export default PeerEvaluationPage;
