import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Radio,
  RadioGroup,
  FormControl,
  FormControlLabel,
  FormLabel,
  Checkbox,
  FormGroup,
  Alert,
  Card,
  CardContent,
  Divider,
  Chip,
  LinearProgress,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Rating
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Send as SendIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';

interface Question {
  id: string;
  questionText: string;
  questionType: 'text' | 'multiple_choice' | 'checkbox' | 'rating';
  required: boolean;
  options?: string[];
}

interface Milestone {
  id: string;
  name: string;
  description: string;
  questions: Question[];
}

interface Answer {
  questionId: string;
  answerText?: string;
  selectedOption?: string;
  selectedOptions?: string[];
  rating?: number;
}

const AnswerMilestoneQuestionsPage: React.FC = () => {
  const { milestoneId } = useParams<{ milestoneId: string }>();
  const navigate = useNavigate();
  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadMilestoneQuestions();
  }, [milestoneId]);

  const loadMilestoneQuestions = async () => {
    try {
      // TODO: Implement API call
      const mockMilestone: Milestone = {
        id: milestoneId || '1',
        name: 'Project Planning & Requirements',
        description: 'Complete the initial planning phase questions',
        questions: [
          {
            id: 'q1',
            questionText: 'What is the main objective of your project?',
            questionType: 'text',
            required: true
          },
          {
            id: 'q2',
            questionText: 'Who are the target users?',
            questionType: 'multiple_choice',
            required: true,
            options: ['Students', 'Teachers', 'General Public', 'Businesses']
          },
          {
            id: 'q3',
            questionText: 'Which technologies will you use?',
            questionType: 'checkbox',
            required: false,
            options: ['React', 'Node.js', 'Python', 'Java', 'C#', 'Other']
          },
          {
            id: 'q4',
            questionText: 'Describe your project timeline (in weeks)',
            questionType: 'text',
            required: true
          },
          {
            id: 'q5',
            questionText: 'Rate your team\'s confidence level in completing this project (1-5)',
            questionType: 'rating',
            required: true
          }
        ]
      };

      setMilestone(mockMilestone);

      // Initialize answers array
      const initialAnswers: Answer[] = mockMilestone.questions.map(q => ({
        questionId: q.id,
        answerText: '',
        selectedOption: '',
        selectedOptions: [],
        rating: 0
      }));
      setAnswers(initialAnswers);
    } catch (err) {
      setError('Failed to load milestone questions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, value: any, type: 'text' | 'multiple_choice' | 'checkbox' | 'rating') => {
    setAnswers(prev =>
      prev.map(answer =>
        answer.questionId === questionId
          ? {
              ...answer,
              answerText: type === 'text' ? value : answer.answerText,
              selectedOption: type === 'multiple_choice' ? value : answer.selectedOption,
              selectedOptions: type === 'checkbox' ? value : answer.selectedOptions,
              rating: type === 'rating' ? value : answer.rating
            }
          : answer
      )
    );
  };

  const handleCheckboxChange = (questionId: string, option: string, checked: boolean) => {
    const currentAnswer = answers.find(a => a.questionId === questionId);
    const currentOptions = currentAnswer?.selectedOptions || [];

    const newOptions = checked
      ? [...currentOptions, option]
      : currentOptions.filter(o => o !== option);

    handleAnswerChange(questionId, newOptions, 'checkbox');
  };

  const isQuestionAnswered = (question: Question): boolean => {
    const answer = answers.find(a => a.questionId === question.id);
    if (!answer) return false;

    switch (question.questionType) {
      case 'text':
        return !!answer.answerText && answer.answerText.trim() !== '';
      case 'multiple_choice':
        return !!answer.selectedOption;
      case 'checkbox':
        return (answer.selectedOptions?.length || 0) > 0;
      case 'rating':
        return (answer.rating || 0) > 0;
      default:
        return false;
    }
  };

  const canProceedToNext = (): boolean => {
    if (!milestone) return false;
    const currentQuestion = milestone.questions[currentQuestionIndex];
    return !currentQuestion.required || isQuestionAnswered(currentQuestion);
  };

  const handleNext = () => {
    if (milestone && currentQuestionIndex < milestone.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!milestone) return;

    // Validate all required questions are answered
    const unansweredRequired = milestone.questions.filter(
      q => q.required && !isQuestionAnswered(q)
    );

    if (unansweredRequired.length > 0) {
      setError(`Please answer all required questions (${unansweredRequired.length} remaining)`);
      return;
    }

    setSubmitting(true);
    try {
      // TODO: Implement API call
      // await milestonesAPI.submitAnswers(milestoneId, answers);

      setSuccess('Your answers have been submitted successfully!');
      setTimeout(() => {
        navigate('/teams'); // Navigate back to teams page
      }, 2000);
    } catch (err) {
      setError('Failed to submit answers');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const getProgress = (): number => {
    if (!milestone) return 0;
    const answeredCount = milestone.questions.filter(q => isQuestionAnswered(q)).length;
    return Math.round((answeredCount / milestone.questions.length) * 100);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading questions...</Typography>
      </Box>
    );
  }

  if (!milestone) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Milestone not found</Alert>
      </Box>
    );
  }

  const currentQuestion = milestone.questions[currentQuestionIndex];
  const currentAnswer = answers.find(a => a.questionId === currentQuestion.id);
  const progress = getProgress();
  const isLastQuestion = currentQuestionIndex === milestone.questions.length - 1;

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate('/teams')}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              {milestone.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {milestone.description}
            </Typography>
          </Box>
        </Box>
        <Chip
          icon={<CheckCircleIcon />}
          label={`${progress}% Complete`}
          color={progress === 100 ? 'success' : 'primary'}
        />
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Progress */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="body2" color="text.secondary">
            Question {currentQuestionIndex + 1} of {milestone.questions.length}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {progress}%
          </Typography>
        </Box>
        <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} />
      </Paper>

      {/* Stepper */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={currentQuestionIndex} alternativeLabel>
          {milestone.questions.map((q, index) => (
            <Step key={q.id} completed={isQuestionAnswered(q)}>
              <StepLabel
                error={q.required && !isQuestionAnswered(q) && index < currentQuestionIndex}
              >
                Q{index + 1}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Question Card */}
      <Card>
        <CardContent sx={{ p: 4 }}>
          <Box display="flex" alignItems="start" gap={2} mb={3}>
            <Typography variant="h6" sx={{ flex: 1 }}>
              {currentQuestion.questionText}
            </Typography>
            {currentQuestion.required && (
              <Chip label="Required" size="small" color="error" />
            )}
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Text Answer */}
          {currentQuestion.questionType === 'text' && (
            <TextField
              fullWidth
              multiline
              rows={4}
              value={currentAnswer?.answerText || ''}
              onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value, 'text')}
              placeholder="Type your answer here..."
              variant="outlined"
            />
          )}

          {/* Multiple Choice */}
          {currentQuestion.questionType === 'multiple_choice' && currentQuestion.options && (
            <FormControl component="fieldset" fullWidth>
              <FormLabel component="legend">Select one option</FormLabel>
              <RadioGroup
                value={currentAnswer?.selectedOption || ''}
                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value, 'multiple_choice')}
              >
                {currentQuestion.options.map((option) => (
                  <FormControlLabel
                    key={option}
                    value={option}
                    control={<Radio />}
                    label={option}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          )}

          {/* Checkbox */}
          {currentQuestion.questionType === 'checkbox' && currentQuestion.options && (
            <FormControl component="fieldset" fullWidth>
              <FormLabel component="legend">Select all that apply</FormLabel>
              <FormGroup>
                {currentQuestion.options.map((option) => (
                  <FormControlLabel
                    key={option}
                    control={
                      <Checkbox
                        checked={currentAnswer?.selectedOptions?.includes(option) || false}
                        onChange={(e) => handleCheckboxChange(currentQuestion.id, option, e.target.checked)}
                      />
                    }
                    label={option}
                  />
                ))}
              </FormGroup>
            </FormControl>
          )}

          {/* Rating */}
          {currentQuestion.questionType === 'rating' && (
            <Box>
              <FormLabel component="legend">Rate from 1 to 5</FormLabel>
              <Box sx={{ mt: 2 }}>
                <Rating
                  size="large"
                  value={currentAnswer?.rating || 0}
                  onChange={(_, value) => handleAnswerChange(currentQuestion.id, value, 'rating')}
                />
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <Box display="flex" justifyContent="space-between" mt={3}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          disabled={currentQuestionIndex === 0}
        >
          Previous
        </Button>

        {!isLastQuestion ? (
          <Button
            variant="contained"
            endIcon={<ArrowForwardIcon />}
            onClick={handleNext}
            disabled={!canProceedToNext()}
          >
            Next Question
          </Button>
        ) : (
          <Button
            variant="contained"
            color="success"
            endIcon={<SendIcon />}
            onClick={handleSubmit}
            disabled={submitting || progress < 100}
          >
            {submitting ? 'Submitting...' : 'Submit Answers'}
          </Button>
        )}
      </Box>

      {/* Answers Summary */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          Your Progress
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1}>
          {milestone.questions.map((q, index) => {
            const answered = isQuestionAnswered(q);
            return (
              <Chip
                key={q.id}
                label={`Q${index + 1}`}
                color={answered ? 'success' : q.required ? 'error' : 'default'}
                variant={index === currentQuestionIndex ? 'filled' : 'outlined'}
                onClick={() => setCurrentQuestionIndex(index)}
                icon={answered ? <CheckCircleIcon /> : undefined}
              />
            );
          })}
        </Box>
      </Paper>
    </Box>
  );
};

export default AnswerMilestoneQuestionsPage;
