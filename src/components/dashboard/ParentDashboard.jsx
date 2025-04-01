import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Avatar,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import {
  Person as PersonIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import Calendar from '../common/Calendar';
import { authService, userService } from '../../services/api';

const ParentDashboard = () => {
  const [stats, setStats] = useState({
    children: [],
    pendingLeaves: 0,
    notifications: [],
  });

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  
  // Add student dialog state
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [addingStudent, setAddingStudent] = useState(false);
  
  // Function to handle opening/closing the add student dialog
  const handleOpenAddDialog = () => {
    setOpenAddDialog(true);
    setStudentId('');
    setAddError('');
    setAddSuccess('');
  };
  
  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
  };
  
  // Function to handle adding a student to parent account
  const handleAddStudent = async () => {
    if (!studentId.trim()) {
      setAddError('Please enter a valid student ID');
      return;
    }
    
    setAddingStudent(true);
    setAddError('');
    
    try {
      // Get current user data
      const currentUser = authService.getCurrentUser();
      if (!currentUser || !currentUser._id) {
        setAddError('User session error. Please log in again.');
        setAddingStudent(false);
        return;
      }
      
      // Check if student exists
      const studentResponse = await userService.getUserById(studentId.trim());
      
      if (!studentResponse.success || !studentResponse.data) {
        setAddError('Student not found. Please check the ID and try again.');
        setAddingStudent(false);
        return;
      }
      
      // Check if student is actually a student
      if (studentResponse.data.role !== 'student') {
        setAddError('The provided ID does not belong to a student account.');
        setAddingStudent(false);
        return;
      }
      
      // Check if student is already in parent's list
      if (currentUser.parentInfo.studentIds.includes(studentId.trim())) {
        setAddError('This student is already associated with your account.');
        setAddingStudent(false);
        return;
      }
      
      // Add student to parent's list
      currentUser.parentInfo.studentIds.push(studentId.trim());
      
      // Save to localStorage
      localStorage.setItem('user', JSON.stringify(currentUser));
      
      // In a real app, you would also update the server
      // For demo, we'll just update the local state
      setUser(currentUser);
      setAddSuccess('Student successfully added to your account!');
      
      // Refresh dashboard data after a short delay
      setTimeout(() => {
        setOpenAddDialog(false);
        // Refresh the dashboard data
        fetchData();
      }, 1500);
    } catch (error) {
      console.error('Error adding student:', error);
      setAddError('Failed to add student. Please try again later.');
    } finally {
      setAddingStudent(false);
    }
  };
  
  // Function to remove invalid student IDs from parent data
  const cleanupInvalidStudentIds = async (currentUser, invalidIds) => {
    if (!currentUser || !currentUser._id || !currentUser.parentInfo || !invalidIds.length) {
      return;
    }
    
    try {
      console.log(`Attempting to clean up ${invalidIds.length} invalid student IDs from parent data`);
      
      // Create a copy of the current user data
      const updatedUser = {
        ...currentUser,
        parentInfo: {
          ...currentUser.parentInfo,
          studentIds: currentUser.parentInfo.studentIds.filter(id => !invalidIds.includes(id))
        }
      };
      
      // Update the user data in localStorage to prevent future failed requests
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Optionally, you can also update the user data on the server
      // This is commented out to avoid further API issues in case of permission problems
      /*
      const updateResult = await userService.updateUser(currentUser._id, updatedUser);
      if (!updateResult.success) {
        console.error('Failed to update parent data on server:', updateResult.error);
      } else {
        console.log('Successfully updated parent data on server');
      }
      */
    } catch (error) {
      console.error('Error cleaning up invalid student IDs:', error);
    }
  };

  // Function to fetch all dashboard data
  const fetchData = async () => {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        console.error('No current user found');
        setLoading(false);
        return;
      }
      
      // Initialize parent info if it doesn't exist
      if (!currentUser.parentInfo) {
        console.log('Initializing missing parentInfo structure');
        currentUser.parentInfo = { studentIds: [] };
        // Save the updated user to localStorage
        localStorage.setItem('user', JSON.stringify(currentUser));
      }
      
      // Ensure studentIds array exists
      if (!currentUser.parentInfo.studentIds) {
        console.log('Initializing missing studentIds array');
        currentUser.parentInfo.studentIds = [];
        // Save the updated user to localStorage
        localStorage.setItem('user', JSON.stringify(currentUser));
      }
      
      setUser(currentUser);

      // Create mock student data function
      const createMockStudentData = (id = null) => {
        if (id) {
          // Return a single mock student with the provided ID
          return {
            _id: id,
            name: 'Sample Student',
            studentInfo: {
              class: 'Sample Class',
              rollNo: Math.floor(Math.random() * 100).toString()
            }
          };
        }
        // Return an array of mock students
        return [
          {
            _id: 'mock-student-1',
            name: 'John Student',
            studentInfo: {
              class: '10A',
              rollNo: '101'
            }
          },
          {
            _id: 'mock-student-2',
            name: 'Jane Student',
            studentInfo: {
              class: '8B',
              rollNo: '203'
            }
          }
        ];
      };

      // Fetch events from the API
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5001/api/events', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Events API returned ${response.status}`);
        }
        
        const eventsData = await response.json();
        setEvents(eventsData);
      } catch (error) {
        console.error('Error fetching events:', error);
        console.log('Using sample events as fallback');
        setEvents(sampleEvents);
      }

      // Check if parentInfo and studentIds exist
      if (!currentUser.parentInfo || !currentUser.parentInfo.studentIds || !Array.isArray(currentUser.parentInfo.studentIds) || currentUser.parentInfo.studentIds.length === 0) {
        console.error('Parent info or student IDs missing or invalid in user data');
        // Use mock data if no valid student IDs
        setStats({
          children: [],
          pendingLeaves: 0,
          notifications: [
            { title: 'System Notice', message: 'No students associated with your account', date: new Date().toISOString() },
          ],
        });
        setLoading(false);
        return;
      }

      // Validate and deduplicate student IDs
      const validStudentIds = [...new Set(currentUser.parentInfo.studentIds.filter(id => id && typeof id === 'string'))];
      
      // Fetch children data - with error handling for each child
      let fetchSuccessCount = 0;
      const childrenResponses = [];
      const failedIdCache = new Set();
      
      for (const id of validStudentIds) {
        // Skip IDs that have already failed with 404
        if (failedIdCache.has(id)) {
          console.log(`Skipping previously failed ID: ${id}`);
          childrenResponses.push({
            success: false,
            data: createMockStudentData(id)
          });
          continue;
        }
        
        try {
          const response = await userService.getUserById(id);
          if (response && response.success && response.data) {
            fetchSuccessCount++;
            childrenResponses.push(response);
          } else {
            console.error(`Failed to fetch child with ID ${id}:`, response.error || 'Unknown error');
            
            // Add to failed cache if it's a 404/NOT_FOUND error
            if (response.code === 'NOT_FOUND' || response.error === 'User not found') {
              failedIdCache.add(id);
            }
            
            childrenResponses.push({
              success: false,
              data: createMockStudentData(id)
            });
          }
        } catch (error) {
          console.error(`Error fetching child with ID ${id}:`, error);
          childrenResponses.push({
            success: false,
            data: createMockStudentData(id)
          });
        }
      }
      
      // If all fetches failed, use complete mock data
      if (fetchSuccessCount === 0 && validStudentIds.length > 0) {
        console.warn('All student data fetches failed, using all mock data');
        
        // Clean up invalid student IDs from parent data to prevent future errors
        const invalidIds = Array.from(failedIdCache);
        if (invalidIds.length > 0) {
          cleanupInvalidStudentIds(currentUser, invalidIds);
        }
        
        setStats({
          children: createMockStudentData(),
          pendingLeaves: 2,
          notifications: [
            { title: 'System Notice', message: 'Using sample student data', date: new Date().toISOString() },
            { title: 'Attendance Alert', message: 'Your child was marked late today', date: '2024-03-10' },
          ],
        });
        setLoading(false);
        return;
      }

      // Extract children data safely
      const children = childrenResponses.map(response => {
        if (!response.success || !response.data) {
          return {
            name: 'Student Data Unavailable',
            studentInfo: {
              class: 'N/A',
              rollNo: 'N/A'
            }
          };
        }
        return response.data;
      });

      setStats({
        children,
        pendingLeaves: 2, // TODO: Implement actual leave counting
        notifications: [
          { title: 'Attendance Alert', message: 'Your child was marked late today', date: '2024-03-10' },
          { title: 'Leave Approval', message: 'Leave request has been approved', date: '2024-03-09' },
        ],
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const StatCard = ({ icon: Icon, title, value, color }) => (
    <Card className="hover-card">
      <CardContent className="flex items-center space-x-4">
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`text-${color}-500`} fontSize="large" />
        </div>
        <div>
          <Typography variant="h6" className="font-semibold">
            {title}
          </Typography>
          <Typography variant="h4" className="text-primary">
            {value}
          </Typography>
        </div>
      </CardContent>
    </Card>
  );

  // Sample events data - same as student dashboard for consistency
  const sampleEvents = [
    {
      title: 'Mid-term Examination',
      date: '2024-03-15',
      description: 'Mathematics and Physics exams',
      type: 'exam'
    },
    {
      title: 'Project Submission',
      date: '2024-03-20',
      description: 'Final project submission deadline',
      type: 'deadline'
    },
    {
      title: 'Sports Day',
      date: '2024-03-25',
      description: 'Annual sports day celebration',
      type: 'event'
    },
    {
      title: 'Parent Teacher Meeting',
      date: '2024-03-28',
      description: 'Semester progress discussion',
      type: 'meeting'
    }
  ];

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <div className="flex justify-center items-center h-full">
          <CircularProgress />
        </div>
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ p: 3 }}>
        <div className="space-y-6 animate-fade-in">
          <div className="flex justify-between items-center">
            <Typography variant="h4" className="text-primary font-bold">
              Welcome, {user?.name || 'Parent'}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<NotificationsIcon />}
              className="hover:shadow-lg"
            >
              View All Notifications
            </Button>
          </div>

          <Grid container spacing={3} className="animate-slide-up">
            <Grid item xs={12} md={4}>
              <StatCard
                icon={PersonIcon}
                title="Children"
                value={stats.children.length}
                color="blue"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <StatCard
                icon={AssignmentIcon}
                title="Pending Leaves"
                value={stats.pendingLeaves}
                color="orange"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <StatCard
                icon={NotificationsIcon}
                title="New Notifications"
                value={stats.notifications.length}
                color="purple"
              />
            </Grid>
          </Grid>

          <Grid container spacing={3} className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Grid item xs={12} md={6}>
              <Card className="hover-card h-full">
                <CardContent>
                  <Typography variant="h6" className="font-semibold mb-4">
                    Children's Overview
                  </Typography>
                  <List>
                    {stats.children.length > 0 ? (
                      stats.children.map((child, index) => (
                        <ListItem
                          key={index}
                          className="hover:bg-gray-50 rounded-lg transition-colors duration-200"
                        >
                          <Avatar className="mr-4 bg-primary">
                            {child?.name ? child.name.charAt(0) : '?'}
                          </Avatar>
                          <ListItemText
                            primary={child?.name || 'Unknown Student'}
                            secondary={`Class: ${child?.studentInfo?.class || 'N/A'} | Roll No: ${child?.studentInfo?.rollNo || 'N/A'}`}
                          />
                          <Button
                            variant="outlined"
                            color="primary"
                            size="small"
                            className="ml-4"
                          >
                            View Details
                          </Button>
                        </ListItem>
                      ))
                    ) : (
                      <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="body1" color="text.secondary" gutterBottom>
                          No students associated with your account
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          You can add your children to your account by using their student ID
                        </Typography>
                        <Button
                          variant="contained"
                          color="primary"
                          sx={{ mt: 2 }}
                          onClick={handleOpenAddDialog}
                        >
                          Add Student
                        </Button>
                      </Box>
                    )}
                  </List>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Calendar events={events} />
            </Grid>
          </Grid>
        </div>
      </Box>

      {/* Add student dialog */}
      <Dialog open={openAddDialog} onClose={handleCloseAddDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add Student to Your Account</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Enter the student ID of your child to link them to your parent account
            </Typography>
            {addSuccess && (
              <Alert severity="success" sx={{ my: 2 }}>
                {addSuccess}
              </Alert>
            )}
            {addError && (
              <Alert severity="error" sx={{ my: 2 }}>
                {addError}
              </Alert>
            )}
            <TextField
              label="Student ID"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              fullWidth
              margin="normal"
              variant="outlined"
              disabled={addingStudent}
              placeholder="e.g. 67df7b874f7b3922415a574f"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDialog} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleAddStudent} 
            color="primary" 
            variant="contained"
            disabled={addingStudent || !studentId.trim()}
          >
            {addingStudent ? (
              <>
                <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                Adding...
              </>
            ) : 'Add Student'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ParentDashboard; 