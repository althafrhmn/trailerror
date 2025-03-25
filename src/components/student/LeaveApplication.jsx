import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Stack,
  Divider,
  Container,
  Snackbar,
} from '@mui/material';
import {
  Email as EmailIcon,
  AttachFile as AttachFileIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { userService } from '../../services/api/userService';
import axiosInstance from '../../services/api/axiosConfig';

const LeaveApplication = () => {
  const [loading, setLoading] = useState(false);
  const [faculty, setFaculty] = useState([]);
  const [formData, setFormData] = useState({
    subject: '',
    facultyId: '',
    fromDate: '',
    toDate: '',
    leaveType: '',
    content: '',
    attachments: [],
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Fetch faculty list when component mounts
  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        console.log('=== Faculty Fetch Debug ===');
        console.log('1. Starting faculty fetch...');
        
        const token = localStorage.getItem('token');
        console.log('2. Token from localStorage:', token ? 'Present' : 'Missing');
        
        if (!token) {
          throw new Error('No authentication token found. Please log in again.');
        }

        console.log('3. Making request to faculty endpoint...');
        // Use the proper endpoint from the userService
        const response = await axiosInstance.get('/users/faculty');
        
        console.log('4. Response data:', response.data);
        
        if (!response.data.success) {
          throw new Error(response.data.error || 'Failed to fetch faculty list');
        }
        
        const facultyList = response.data.data;
        
        if (!Array.isArray(facultyList)) {
          console.error('5. Invalid data structure:', facultyList);
          throw new Error('Invalid faculty data received');
        }
        
        console.log('6. Setting faculty data:', facultyList);
        setFaculty(facultyList);
        
        if (facultyList.length === 0) {
          setSnackbar({
            open: true,
            message: 'No faculty members found in the system.',
            severity: 'warning',
          });
        }
      } catch (error) {
        console.error('7. Error in faculty fetch:', error);
        setSnackbar({
          open: true,
          message: `Failed to load faculty list: ${error.message}`,
          severity: 'error',
        });
      }
    };

    fetchFaculty();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }));
  };

  const handleRemoveAttachment = (index) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (loading) return;
    
    // Simple validation
    if (!formData.subject || !formData.facultyId || !formData.fromDate || 
        !formData.toDate || !formData.leaveType || !formData.content) {
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields',
        severity: 'error',
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Prepare data for submission
      const leaveData = {
        subject: formData.subject,
        faculty: formData.facultyId,
        type: formData.leaveType,
        description: formData.content,
        startDate: formData.fromDate,
        endDate: formData.toDate,
        sendEmail: true // Explicitly enable email notification
      };
      
      console.log('Submitting leave application with JSON data:', leaveData);
      
      // Get the token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      // First approach: Try with JSON data instead of FormData
      // Most REST APIs handle JSON better than multipart/form-data for text data
      const response = await fetch('http://localhost:5001/api/leaves', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(leaveData)
      });
      
      const responseText = await response.text();
      console.log('Raw server response:', responseText);
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse server response as JSON:', e);
        responseData = { success: false, error: 'Invalid server response format' };
      }
      
      if (!response.ok || !responseData.success) {
        throw new Error(responseData.error || `Server responded with status: ${response.status}`);
      }

      // If we got here, the submission was successful
      console.log('Leave application submitted successfully:', responseData, 'check if the correspondin faculty is receiveing the mail about the leave request');
      
      // Enhanced success message based on email status
      let successMessage = 'Leave application submitted successfully!';
      if (responseData.email && responseData.email.sent) {
        successMessage += ' Email notification has been sent to the faculty.';
      } else if (responseData.email && responseData.email.error) {
        successMessage += ` Note: Email notification failed: ${responseData.email.error}`;
      }
      
      setSnackbar({
        open: true,
        message: successMessage,
        severity: 'success',
      });

      // Reset form
      setFormData({
        subject: '',
        facultyId: '',
        fromDate: '',
        toDate: '',
        leaveType: '',
        content: '',
        attachments: [],
      });

    } catch (error) {
      console.error('Error submitting leave application:', error);
      
      // Get the most descriptive error message possible
      let errorMessage = 'Failed to submit leave application. Please try again.';
      
      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" component="h1" gutterBottom fontWeight={600}>
            Leave Application
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Fill out the form below to submit your leave application
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <TextField
              fullWidth
              label="Subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              variant="outlined"
              placeholder="Enter the subject of your leave application"
              InputProps={{
                startAdornment: (
                  <EmailIcon color="action" sx={{ mr: 1 }} />
                ),
              }}
            />

            <FormControl fullWidth required>
              <InputLabel>Select Faculty</InputLabel>
              <Select
                name="facultyId"
                value={formData.facultyId}
                onChange={handleChange}
                label="Select Faculty"
              >
                {faculty.map((f) => (
                  <MenuItem key={f._id} value={f._id}>
                    {f.name} ({f.department || 'No Department'})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="From Date"
                name="fromDate"
                type="date"
                value={formData.fromDate}
                onChange={handleChange}
                required
                variant="outlined"
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                fullWidth
                label="To Date"
                name="toDate"
                type="date"
                value={formData.toDate}
                onChange={handleChange}
                required
                variant="outlined"
                InputLabelProps={{ shrink: true }}
              />
            </Box>

            <FormControl fullWidth required>
              <InputLabel>Leave Type</InputLabel>
              <Select
                name="leaveType"
                value={formData.leaveType}
                onChange={handleChange}
                label="Leave Type"
              >
                <MenuItem value="Medical">Medical Leave</MenuItem>
                <MenuItem value="Personal">Personal Leave</MenuItem>
                <MenuItem value="Family">Family Emergency</MenuItem>
                <MenuItem value="Exam">Examination Preparation</MenuItem>
                <MenuItem value="Event">Event Participation</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              required
              multiline
              rows={6}
              variant="outlined"
              placeholder="Write your leave application content here..."
            />

            <Box>
              <Button
                component="label"
                variant="outlined"
                startIcon={<AttachFileIcon />}
                sx={{ mr: 2 }}
              >
                Attach Files
                <input
                  type="file"
                  hidden
                  multiple
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
              </Button>

              {formData.attachments.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Attachments:
                  </Typography>
                  <Stack spacing={1}>
                    {formData.attachments.map((file, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 1,
                          bgcolor: 'background.default',
                          borderRadius: 1,
                        }}
                      >
                        <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                          {file.name}
                        </Typography>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => handleRemoveAttachment(index)}
                          startIcon={<DeleteIcon />}
                        >
                          Remove
                        </Button>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                type="button"
                variant="outlined"
                color="inherit"
                onClick={() => {
                  setFormData({
                    subject: '',
                    facultyId: '',
                    fromDate: '',
                    toDate: '',
                    leaveType: '',
                    content: '',
                    attachments: [],
                  });
                }}
              >
                Clear
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </Button>
            </Box>
          </Stack>
        </form>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default LeaveApplication; 