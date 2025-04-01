import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Tab,
  Tabs,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  Class as ClassIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { getTimetable, saveTimetable, deleteTimetable } from '../../services/timetableService';
import { userService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

// Use axios with correct endpoint
const departmentService = {
  getDepartments: async () => {
    try {
      // Use the backend API URL with the correct path
      const response = await axios.get('http://localhost:5001/api/departments', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error in department service:', error);
      return { success: false, error: error.message };
    }
  }
};

// Mock data for departments and courses
const departments = [
  'Computer Science',
  'Electronics',
  'Mechanical',
  'Civil',
  'Electrical',
];

const mockTimeSlots = [
  '9:00 AM - 10:00 AM',
  '10:00 AM - 11:00 AM',
  '11:00 AM - 12:00 PM',
  '12:00 PM - 1:00 PM',
  '2:00 PM - 3:00 PM',
  '3:00 PM - 4:00 PM',
  '4:00 PM - 5:00 PM',
];

const mockDays = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
];

const mockCourses = {
  'Computer Science': ['Data Structures', 'Algorithms', 'Database Management', 'Operating Systems', 'Computer Networks'],
  'Electronics': ['Digital Electronics', 'Analog Circuits', 'Microprocessors', 'Communication Systems'],
  'Mechanical': ['Thermodynamics', 'Machine Design', 'Fluid Mechanics', 'Heat Transfer'],
  'Civil': ['Structural Analysis', 'Geotechnical Engineering', 'Transportation Engineering'],
  'Electrical': ['Power Systems', 'Control Systems', 'Electric Machines', 'Power Electronics'],
};

// Update the initial timetable structure to be organized by department, semester, and course
const initialTimetables = {
  'Computer Science': {
    1: {
      'Data Structures': {
        monday: [
          {
            subject: 'Data Structures',
            faculty: 'Dr. John Doe',
            startTime: '9:00 AM',
            endTime: '10:00 AM',
            room: 'CS-101'
          }
        ],
        wednesday: [
          {
            subject: 'Data Structures',
            faculty: 'Dr. John Doe',
            startTime: '2:00 PM',
            endTime: '3:00 PM',
            room: 'CS-101'
          }
        ],
        friday: [
          {
            subject: 'Data Structures',
    faculty: 'Dr. John Doe',
            startTime: '10:00 AM',
            endTime: '11:00 AM',
            room: 'CS-101'
          }
        ]
      }
    },
    2: {
      'Computer Networks': {
        monday: [
          {
            subject: 'Computer Networks',
            faculty: 'Dr. Jane Smith',
            startTime: '10:00 AM',
            endTime: '11:00 AM',
            room: 'CS-102'
          }
        ],
        wednesday: [
          {
            subject: 'Computer Networks',
    faculty: 'Dr. Jane Smith',
            startTime: '3:00 PM',
            endTime: '4:00 PM',
            room: 'CS-102'
          }
        ]
      }
    },
    3: {
      'Operating Systems': {
        monday: [
          {
            subject: 'Operating Systems',
            faculty: 'Dr. Mike Johnson',
            startTime: '11:00 AM',
            endTime: '12:00 PM',
            room: 'CS-103'
          }
        ],
        thursday: [
          {
            subject: 'Operating Systems',
            faculty: 'Dr. Mike Johnson',
            startTime: '11:00 AM',
            endTime: '12:00 PM',
            room: 'CS-103'
          }
        ]
      }
    }
  }
  // Add other departments similarly
};

// Add helper function to check for schedule conflicts
const checkScheduleConflict = (existingSchedule, newSchedule) => {
  const existingStart = new Date(`2000-01-01 ${newSchedule.startTime}`);
  const existingEnd = new Date(`2000-01-01 ${newSchedule.endTime}`);
  
  for (const period of existingSchedule) {
    const periodStart = new Date(`2000-01-01 ${period.startTime}`);
    const periodEnd = new Date(`2000-01-01 ${period.endTime}`);

    // Check if the new schedule overlaps with existing schedule
    if (
      (existingStart >= periodStart && existingStart < periodEnd) ||
      (existingEnd > periodStart && existingEnd <= periodEnd) ||
      (existingStart <= periodStart && existingEnd >= periodEnd)
    ) {
      return {
        hasConflict: true,
        conflictWith: period
      };
    }
  }
  
  return { hasConflict: false };
};

// Add validation for time slots
const validateTimeSlot = (startTime, endTime) => {
  const start = new Date(`2000-01-01 ${startTime}`);
  const end = new Date(`2000-01-01 ${endTime}`);
  
  // Check if end time is after start time
  if (end <= start) {
    return {
      isValid: false,
      error: 'End time must be after start time'
    };
  }
  
  // Check if the duration is reasonable (e.g., not more than 3 hours)
  const duration = (end - start) / (1000 * 60 * 60); // Convert to hours
  if (duration > 3) {
    return {
      isValid: false,
      error: 'Class duration cannot exceed 3 hours'
    };
  }
  
  return { isValid: true };
};

const TimetableDialog = ({ open, onClose, schedule, onSave, existingSchedule = {} }) => {
  const [formData, setFormData] = useState({
    department: '',
    course: '',
    faculty: '',
    day: '',
    timeSlot: '',
    room: '',
    semester: '',
  });
  const [facultyList, setFacultyList] = useState([]);
  const [loadingFaculty, setLoadingFaculty] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Helper function to check authentication before API calls
  const ensureAuthenticated = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
      setError(true);
      setErrorMessage('Authentication required. Please login.');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      return false;
    }
    return true;
  };

  useEffect(() => {
    fetchFacultyList();
  }, []);

  const fetchFacultyList = async () => {
    // Check authentication first
    if (!ensureAuthenticated()) {
      return false;
    }
    
    setLoadingFaculty(true);
    try {
      // Call the API to get faculty users
      const response = await userService.getUsers('faculty');
      if (response.success) {
        // Strictly filter to only include users with role 'faculty'
        const facultyMembers = response.data.filter(user => 
          user.role === 'faculty' && 
          !user.roles?.includes('student') // Additional check to exclude students
        );
        
        setFacultyList(facultyMembers);
        
        if (facultyMembers.length === 0) {
          console.warn('No faculty members found');
        }
        setLoadingFaculty(false);
        return true; // Return success
      } else {
        console.error('Failed to fetch faculty list:', response.error);
        setError(true);
        setErrorMessage('Failed to fetch faculty list: ' + response.error);
        setLoadingFaculty(false);
        return false; // Return failure
      }
    } catch (error) {
      console.error('Error fetching faculty list:', error);
      setError(true);
      setErrorMessage('Authentication or permission error. Please login with appropriate credentials.');
      setLoadingFaculty(false);
      return false; // Return failure
    }
  };

  useEffect(() => {
    if (schedule) {
      setFormData({
        department: schedule.department || '',
        course: schedule.course || '',
        faculty: schedule.faculty || '',
        day: schedule.day || '',
        timeSlot: schedule.timeSlot || '',
        room: schedule.room || '',
        semester: schedule.semester || '',
      });
    } else {
      setFormData({
        department: '',
        course: '',
        faculty: '',
        day: '',
        timeSlot: '',
        room: '',
        semester: '',
      });
    }
  }, [schedule]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Reset course if department changes
      ...(name === 'department' && { course: '' }),
    }));
  };

  const handleSubmit = () => {
    if (!formData.department || !formData.course || !formData.faculty || !formData.day || !formData.timeSlot || !formData.room || !formData.semester) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate semester
    const semesterNum = parseInt(formData.semester);
    if (isNaN(semesterNum) || semesterNum < 1 || semesterNum > 8) {
      toast.error('Semester must be between 1 and 8');
      return;
    }

    // Extract and validate time slot
    const [startTime, endTime] = formData.timeSlot.split(' - ');
    const timeValidation = validateTimeSlot(startTime.trim(), endTime.trim());
    if (!timeValidation.isValid) {
      toast.error(timeValidation.error);
      return;
    }

    // Check for schedule conflicts
    const daySchedule = existingSchedule[formData.day.toLowerCase()] || [];
    const conflict = checkScheduleConflict(daySchedule, {
      startTime: startTime.trim(),
      endTime: endTime.trim()
    });

    if (conflict.hasConflict) {
      toast.error(`Schedule conflicts with existing class: ${conflict.conflictWith.subject} (${conflict.conflictWith.startTime} - ${conflict.conflictWith.endTime})`);
      return;
    }

    // Check if faculty is already scheduled at this time
    const facultyConflict = Object.entries(existingSchedule).some(([day, periods]) => {
      if (day !== formData.day.toLowerCase()) {
        return periods.some(period => {
          if (period.faculty === formData.faculty) {
            const conflict = checkScheduleConflict([period], {
              startTime: startTime.trim(),
              endTime: endTime.trim()
            });
            return conflict.hasConflict;
          }
          return false;
        });
      }
      return false;
    });

    if (facultyConflict) {
      toast.error('Faculty is already scheduled for another class at this time');
      return;
    }

    onSave(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{schedule ? 'Edit Schedule' : 'Add New Schedule'}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}
        
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select
                name="department"
                value={formData.department}
                onChange={handleChange}
                label="Department"
                required
              >
                {departments.map((dept) => (
                  <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Course</InputLabel>
              <Select
                name="course"
                value={formData.course}
                onChange={handleChange}
                label="Course"
                required
                disabled={!formData.department}
              >
                {formData.department && mockCourses[formData.department]?.map((course) => (
                  <MenuItem key={course} value={course}>{course}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!formData.faculty && formData.department ? true : false}>
              <InputLabel>Faculty</InputLabel>
              <Select
              name="faculty"
              value={formData.faculty}
              onChange={handleChange}
                label="Faculty"
              required
                disabled={loadingFaculty}
              >
                {loadingFaculty ? (
                  <MenuItem disabled>Loading faculty list...</MenuItem>
                ) : facultyList.length === 0 ? (
                  <MenuItem disabled>No faculty members available</MenuItem>
                ) : (
                  facultyList.map((faculty) => (
                    <MenuItem 
                      key={faculty._id} 
                      value={faculty.name}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}
                    >
                      <PersonIcon fontSize="small" />
                      {faculty.name}
                    </MenuItem>
                  ))
                )}
              </Select>
              {loadingFaculty && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                  <CircularProgress size={20} />
                </Box>
              )}
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Room Number"
              name="room"
              value={formData.room}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Day</InputLabel>
              <Select
                name="day"
                value={formData.day}
                onChange={handleChange}
                label="Day"
                required
              >
                {mockDays.map((day) => (
                  <MenuItem key={day} value={day}>{day}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Time Slot</InputLabel>
              <Select
                name="timeSlot"
                value={formData.timeSlot}
                onChange={handleChange}
                label="Time Slot"
                required
              >
                {mockTimeSlots.map((slot) => (
                  <MenuItem key={slot} value={slot}>{slot}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Semester"
              name="semester"
              type="number"
              value={formData.semester}
              onChange={handleChange}
              required
              inputProps={{ min: 1, max: 8 }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          variant="contained" 
          onClick={handleSubmit}
          disabled={loadingFaculty || facultyList.length === 0}
        >
          {schedule ? 'Update' : 'Create'} Schedule
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const TimetableManagement = () => {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [timetable, setTimetable] = useState({});
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [departmentList, setDepartmentList] = useState([]);
  const [loadingDepartment, setLoadingDepartment] = useState(false);
  const [facultyList, setFacultyList] = useState([]);
  const [loadingFaculty, setLoadingFaculty] = useState(false);

  // Check user permissions
  const canModifyTimetable = user && (user.role === 'admin' || user.role === 'faculty');
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        // Redirect to login if not authenticated
        window.location.href = '/login';
        return;
      }
      
      if (!canModifyTimetable) {
        setError(true);  // Set error to boolean true
        setErrorMessage('You do not have permission to modify timetables. Please contact an administrator.');
        return;
      }
    }
  }, [user, authLoading, canModifyTimetable]);

  const fetchTimetable = async () => {
    // Check authentication first
    if (!ensureAuthenticated()) {
      return false;
    }
    
    if (!selectedClass || !selectedSemester || !selectedCourse) {
      // Set empty timetable when no selection is made
      setTimetable({
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: []
      });
      return false; // Return failure due to missing selections
    }

    setLoading(true);
    setError(false);
    setErrorMessage('');
    
    try {
      // Call the API to get timetable
      const response = await getTimetable(selectedClass, selectedSemester, selectedCourse);
      if (response.success) {
        setTimetable(response.data);
        setLoading(false);
        return true; // Return success
      } else {
        console.error('Failed to fetch timetable:', response.error);
        setError(true);
        setErrorMessage('Failed to fetch timetable: ' + response.error);
        setTimetable({
          monday: [],
          tuesday: [],
          wednesday: [],
          thursday: [],
          friday: []
        });
        setLoading(false);
        return false; // Return failure
      }
    } catch (error) {
      console.error('Error in fetchTimetable:', error);
      setError(true);
      setErrorMessage('Authentication or permission error. Please login with appropriate credentials.');
      setTimetable({
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: []
      });
      setLoading(false);
      return false; // Return failure
    }
  };

  useEffect(() => {
    // Only fetch when selections are changed by user, not during initial mount
    if (selectedClass && selectedSemester && selectedCourse) {
      fetchTimetable();
    }
  }, [selectedClass, selectedSemester, selectedCourse]);

  const handleEditSchedule = (schedule) => {
    setSelectedSchedule(schedule);
    setOpenDialog(true);
  };

  const handleSaveSchedule = async (formData) => {
    if (!canModifyTimetable) {
      toast.error('You do not have permission to modify timetables');
      return;
    }

    // Check authentication first
    if (!ensureAuthenticated()) {
      return;
    }

    if (!selectedClass || !selectedSemester || !selectedCourse) {
      toast.error('Please select a class, semester, and course first');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Saving schedule...');

    try {
      // Format the schedule data
      const [startTime, endTime] = formData.timeSlot.split(' - ');
      
      // Additional validation for room conflicts
      const roomConflict = Object.entries(timetable).some(([day, periods]) => {
        return periods.some(period => {
          if (period.room === formData.room) {
            const conflict = checkScheduleConflict([period], {
              startTime: startTime.trim(),
              endTime: endTime.trim()
            });
            return conflict.hasConflict;
          }
          return false;
        });
      });

      if (roomConflict) {
        throw new Error('Room is already occupied during this time slot');
      }

      const scheduleData = {
        class: selectedClass,
        semester: selectedSemester,
        department: selectedClass,
        schedule: {
          day: formData.day.toLowerCase(),
          subject: formData.course,
          faculty: formData.faculty,
          startTime: startTime.trim(),
          endTime: endTime.trim(),
          room: formData.room
        }
      };

      // Call the real API to save the schedule
      const response = await saveTimetable(scheduleData);

      if (!response.success) {
        throw new Error(response.error || 'Failed to save schedule');
      }

      toast.success('Schedule saved successfully', { id: toastId });
      setOpenDialog(false);
      await fetchTimetable(); // Refresh the timetable data
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast.error(error.message || 'Failed to save schedule', { id: toastId });
      
      if (error.message.includes('permission') || error.message.includes('Authentication')) {
        setError(true);
        setErrorMessage('You do not have permission to modify timetables or your session has expired');
        if (error.message.includes('Authentication')) {
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Add sorting function for time slots
  const sortPeriods = (periods) => {
    return periods.sort((a, b) => {
      const timeA = new Date(`2000-01-01 ${a.startTime}`);
      const timeB = new Date(`2000-01-01 ${b.startTime}`);
      return timeA - timeB;
    });
  };

  // Add function to get cell background color based on subject
  const getSubjectColor = (subject) => {
    // Generate a consistent pastel color based on the subject name
    const hash = subject.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    const h = hash % 360;
    return `hsl(${h}, 70%, 95%)`;
  };

  const fetchDepartmentList = async () => {
    // Check authentication first
    if (!ensureAuthenticated()) {
      return false;
    }
    
    setLoadingDepartment(true);
    try {
      const response = await departmentService.getDepartments();
      if (response.success) {
        setDepartmentList(response.data);
        setLoadingDepartment(false);
        return true; // Return success
      } else {
        console.error('Failed to fetch department list:', response.error);
        setError(true);
        setErrorMessage('Failed to fetch department list: ' + response.error);
        setLoadingDepartment(false);
        return false; // Return failure
      }
    } catch (error) {
      console.error('Error fetching department list:', error);
      setError(true);
      setErrorMessage('Error fetching department list: ' + error.message);
      setLoadingDepartment(false);
      return false; // Return failure
    }
  };

  // Helper function to check authentication before API calls
  const ensureAuthenticated = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
      setError(true);
      setErrorMessage('Authentication required. Please login.');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      return false;
    }
    return true;
  };

  // Fetch data when component mounts
  useEffect(() => {
    const initializeComponent = async () => {
      try {
        // Check user authentication first
        if (!user) {
          setError(true);
          setErrorMessage('Authentication required. Please login.');
          return;
        }
        
        // Fetch department data (using mock service)
        const deptResult = await fetchDepartmentList();
        
        // Only continue with other fetches if department fetch succeeded
        if (deptResult !== false) {
          // These might fail with 403 errors, but we've handled that in the individual functions
          await fetchFacultyList();
          await fetchTimetable();
        }
      } catch (error) {
        console.error('Error initializing component:', error);
        setError(true);
        setErrorMessage('Error initializing component: ' + error.message);
      }
    };
    
    // Only run initialization if auth loading is complete
    if (!authLoading) {
      initializeComponent();
    }
  }, [authLoading, user]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Timetable Management
      </Typography>

      {!canModifyTimetable && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You are in view-only mode. Contact an administrator for edit access.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}
      
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <CircularProgress />
        </Box>
      )}

      {!error && !loading && (
        <>
          <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
            <FormControl fullWidth>
                <InputLabel>Department</InputLabel>
              <Select
                value={selectedClass}
                  onChange={(e) => {
                    setSelectedClass(e.target.value);
                    setSelectedCourse(''); // Reset course when department changes
                  }}
                  label="Department"
              >
                {departments.map((dept) => (
                  <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Semester"
                type="number"
                value={selectedSemester}
                onChange={(e) => {
                  setSelectedSemester(e.target.value);
                  setSelectedCourse(''); // Reset course when semester changes
                }}
                InputProps={{ inputProps: { min: 1, max: 8 } }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Course</InputLabel>
                <Select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  label="Course"
                  disabled={!selectedClass || !selectedSemester}
                >
                  {selectedClass && mockCourses[selectedClass]?.map((course) => (
                    <MenuItem key={course} value={course}>{course}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

          <TableContainer component={Paper} sx={{ mt: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', width: '15%' }}>Day</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '15%' }}>Time Slot</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '25%' }}>Course</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '20%' }}>Faculty</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '15%' }}>Room</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '10%' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(timetable || {}).map(([day, periods]) => {
                  const sortedPeriods = sortPeriods(periods);
                  return sortedPeriods.map((period, index) => (
                    <TableRow 
                      key={`${day}-${index}`} 
                      hover
                      sx={{
                        backgroundColor: getSubjectColor(period.subject),
                        '&:hover': {
                          backgroundColor: (theme) => 
                            theme.palette.mode === 'light' 
                              ? theme.palette.grey[100] 
                              : theme.palette.grey[800]
                        }
                      }}
                    >
                      <TableCell sx={{ textTransform: 'capitalize' }}>
                        {day.charAt(0).toUpperCase() + day.slice(1)}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="textSecondary">
                          {period.startTime} - {period.endTime}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {period.subject}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PersonIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {period.faculty}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={period.room}
                          size="small"
                          color="default"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Edit Schedule">
                          <IconButton 
                            onClick={() => handleEditSchedule({
                              ...period,
                              day: day,
                              timeSlot: `${period.startTime} - ${period.endTime}`,
                              course: period.subject,
                              department: selectedClass,
                              semester: selectedSemester
                            })}
                            size="small"
                            color="primary"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ));
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </>
        )}

        <TimetableDialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          schedule={selectedSchedule}
          onSave={handleSaveSchedule}
        existingSchedule={timetable}
        />
      </Box>
  );
};

export default TimetableManagement; 