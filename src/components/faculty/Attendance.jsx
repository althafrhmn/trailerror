import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  TextField,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { 
  CheckCircle, 
  Cancel, 
  AccessTime,
  Today as TodayIcon,
  Comment as CommentIcon,
  Event as EventIcon
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import axios from 'axios';
import { attendanceService } from '../../services/api';

// Create axios instance with base URL for consistent API calls
const api = axios.create({
  baseURL: 'http://localhost:5001/api',
  timeout: 10000, 
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Handle 401 and 403 errors
      if (error.response.status === 401) {
        toast.error('Session expired. Please login again.');
        // Redirect to login or handle session expiry
      } else if (error.response.status === 403) {
        toast.error('You do not have permission to perform this action.');
      }
    }
    return Promise.reject(error);
  }
);

// Classes based on the database structure (as strings, not IDs)
const CLASS_OPTIONS = [
  "CSE-A", "CSE-B", "CSE-C", 
  "ECE-A", "ECE-B", 
  "MECH-A", "MECH-B"
];

// Subjects based on the database structure
const SUBJECT_OPTIONS = [
  "Data Structures", "Algorithms", "Database Systems", 
  "Computer Networks", "Operating Systems", "Web Development",
  "Machine Learning", "Artificial Intelligence", "Calculus", 
  "Linear Algebra", "Discrete Mathematics"
];

const Attendance = () => {
  const { user } = useAuth() || { user: null };
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [attendanceData, setAttendanceData] = useState({});
  const [savedAttendance, setSavedAttendance] = useState(null);
  const [openRemarkDialog, setOpenRemarkDialog] = useState(false);
  const [currentStudentId, setCurrentStudentId] = useState(null);
  const [remarkText, setRemarkText] = useState('');
  const [studentLeaves, setStudentLeaves] = useState({});

  useEffect(() => {
    // No need to fetch classes since they're predefined based on your database
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents();
      fetchSavedAttendance();
      fetchStudentLeaves();
    }
  }, [selectedClass, selectedSubject, selectedDate]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      
      // Fetch students by class from server (using class name, not ID)
      const response = await api.get(`/students/byClass`, {
        params: { className: selectedClass }
      });
      const studentsData = response.data.data || [];
      
      setStudents(studentsData);
      
      // Initialize attendance data for each student
      const initialAttendance = {};
      studentsData.forEach(student => {
        initialAttendance[student._id] = {
          status: '',
          date: selectedDate,
          remarks: '',
          class: selectedClass,
          subject: selectedSubject
        };
      });
      setAttendanceData(initialAttendance);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Failed to fetch students. Using demo data instead.');
      
      // Fallback to mock data if API fails
      const mockStudents = [
        { _id: 'student1', name: 'Alex Johnson', rollNumber: '101' },
        { _id: 'student2', name: 'Sarah Williams', rollNumber: '102' },
        { _id: 'student3', name: 'Mike Davis', rollNumber: '103' }
      ];
      
      setStudents(mockStudents);
      
      // Initialize attendance data for each student
      const initialAttendance = {};
      mockStudents.forEach(student => {
        initialAttendance[student._id] = {
          status: '',
          date: selectedDate,
          remarks: '',
          class: selectedClass,
          subject: selectedSubject
        };
      });
      setAttendanceData(initialAttendance);
      setLoading(false);
    }
  };

  const fetchSavedAttendance = async () => {
    if (!selectedClass || !selectedDate || !selectedSubject) return;
    
    try {
      // Fetch saved attendance data from server using the correct endpoint
      const response = await api.get('/attendance/class', {
        params: { 
          class: selectedClass,
          date: selectedDate,
          subject: selectedSubject
        }
      });
      
      const savedData = {};
      const attendanceRecords = response.data || [];
      
      if (attendanceRecords.length > 0) {
        attendanceRecords.forEach(record => {
          savedData[record.student._id] = {
            status: record.status,
            date: selectedDate,
            remarks: record.remarks || '',
            class: selectedClass,
            subject: selectedSubject
          };
        });
        setSavedAttendance(savedData);
      } else {
        setSavedAttendance(null);
      }
    } catch (error) {
      console.error('Error fetching saved attendance:', error);
      // Don't show error toast for this as it's not critical
      setSavedAttendance(null);
    }
  };

  const fetchStudentLeaves = async () => {
    if (!selectedClass || !selectedDate) return;
    
    try {
      // Convert the selected date to a Date object
      const currentDate = new Date(selectedDate);
      
      // Fetch active leaves that include the current date
      const response = await api.get('/leaves/active', {
        params: { 
          date: selectedDate,
          className: selectedClass
        }
      });
      
      const leaves = response.data.data || [];
      const leavesMap = {};
      
      leaves.forEach(leave => {
        if (leave.status === 'approved') {
          leavesMap[leave.student._id] = {
            startDate: new Date(leave.startDate),
            endDate: new Date(leave.endDate),
            reason: leave.reason,
            type: leave.type
          };
        }
      });
      
      setStudentLeaves(leavesMap);
    } catch (error) {
      console.error('Error fetching student leaves:', error);
      // Don't show error toast for this as it's not critical
    }
  };

  const handleAttendanceChange = (studentId, status) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }));
  };

  const handleRemarkClick = (studentId) => {
    const currentRemarks = attendanceData[studentId]?.remarks || '';
    setCurrentStudentId(studentId);
    setRemarkText(currentRemarks);
    setOpenRemarkDialog(true);
  };

  const handleSaveRemark = () => {
    if (currentStudentId) {
      setAttendanceData(prev => ({
        ...prev,
        [currentStudentId]: {
          ...prev[currentStudentId],
          remarks: remarkText
        }
      }));
    }
    setOpenRemarkDialog(false);
  };

  const handleSubmitAttendance = async () => {
    try {
      if (!selectedClass || !selectedSubject) {
        toast.error('Please select both class and subject');
        return;
      }
      
      setLoading(true);
      
      const attendanceRecords = Object.entries(attendanceData)
        .filter(([, data]) => data.status) // Only include records with a status
        .map(([studentId, data]) => ({
          studentId,
          status: data.status,
          remarks: data.remarks || ''
        }));
      
      if (attendanceRecords.length === 0) {
        toast.error('No attendance data to submit');
        setLoading(false);
        return;
      }

      // Submit attendance data to server with the expected format
      await api.post('/attendance', {
        date: selectedDate,
        class: selectedClass,
        subject: selectedSubject,
        attendanceData: attendanceRecords
      });
      
      toast.success('Attendance submitted successfully');
      
      // Update savedAttendance with the new data
      setSavedAttendance({
        ...savedAttendance,
        ...attendanceData
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error submitting attendance:', error);
      toast.error('Failed to submit attendance');
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return <CheckCircle color="success" />;
      case 'absent':
        return <Cancel color="error" />;
      case 'late':
        return <AccessTime color="warning" />;
      default:
        return null;
    }
  };

  const loadSavedAttendance = () => {
    if (savedAttendance) {
      setAttendanceData({
        ...attendanceData,
        ...savedAttendance
      });
      toast.success('Loaded previously saved attendance data');
    } else {
      toast.info('No saved attendance data found for this date and subject');
    }
  };

  const isOnLeave = (studentId) => {
    return studentId in studentLeaves;
  };

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Student Attendance
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Select Class</InputLabel>
              <Select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                label="Select Class"
                disabled={loading}
              >
                {CLASS_OPTIONS.map((cls) => (
                  <MenuItem key={cls} value={cls}>
                    {cls}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Select Subject</InputLabel>
              <Select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                label="Select Subject"
                disabled={loading}
              >
                {SUBJECT_OPTIONS.map((subject) => (
                  <MenuItem key={subject} value={subject}>
                    {subject}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              label="Date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              disabled={loading}
              InputLabelProps={{
                shrink: true,
              }}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={3}>
            {savedAttendance && (
              <Button
                variant="outlined"
                startIcon={<TodayIcon />}
                onClick={loadSavedAttendance}
                disabled={loading}
              >
                Load Saved Attendance
              </Button>
            )}
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : selectedClass && selectedSubject && students.length > 0 ? (
        <Paper sx={{ p: 2 }}>
          <TableContainer sx={{ maxHeight: 440 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Student Name</TableCell>
                  <TableCell>Roll Number</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                  <TableCell>Remarks</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((student) => (
                  <TableRow 
                    key={student._id}
                    sx={{ 
                      backgroundColor: isOnLeave(student._id) ? 'rgba(255, 193, 7, 0.1)' : 'inherit'
                    }}
                  >
                    <TableCell>
                      {student.name}
                      {isOnLeave(student._id) && (
                        <Tooltip title={`On ${studentLeaves[student._id]?.type || 'approved'} leave: ${studentLeaves[student._id]?.reason || 'No reason provided'}`}>
                          <IconButton size="small" color="warning">
                            <EventIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell>{student.rollNumber}</TableCell>
                    <TableCell>
                      {getStatusIcon(attendanceData[student._id]?.status)}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant={attendanceData[student._id]?.status === 'present' ? 'contained' : 'outlined'}
                          color="success"
                          size="small"
                          onClick={() => handleAttendanceChange(student._id, 'present')}
                        >
                          Present
                        </Button>
                        <Button
                          variant={attendanceData[student._id]?.status === 'late' ? 'contained' : 'outlined'}
                          color="warning"
                          size="small"
                          onClick={() => handleAttendanceChange(student._id, 'late')}
                        >
                          Late
                        </Button>
                        <Button
                          variant={attendanceData[student._id]?.status === 'absent' ? 'contained' : 'outlined'}
                          color="error"
                          size="small"
                          onClick={() => handleAttendanceChange(student._id, 'absent')}
                        >
                          Absent
                        </Button>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Add/Edit Remarks">
                        <IconButton
                          size="small"
                          onClick={() => handleRemarkClick(student._id)}
                        >
                          <CommentIcon />
                        </IconButton>
                      </Tooltip>
                      {attendanceData[student._id]?.remarks && (
                        <Typography variant="caption" sx={{ ml: 1 }}>
                          {attendanceData[student._id].remarks.length > 15 
                            ? `${attendanceData[student._id].remarks.substring(0, 15)}...` 
                            : attendanceData[student._id].remarks}
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmitAttendance}
              disabled={loading || !Object.values(attendanceData).some(data => data.status)}
            >
              Submit Attendance
            </Button>
          </Box>
        </Paper>
      ) : selectedClass ? (
        <Alert severity="info">
          {!selectedSubject 
            ? "Please select a subject to view attendance" 
            : "No students found in this class."}
        </Alert>
      ) : (
        <Alert severity="info">Please select a class to view attendance.</Alert>
      )}

      {/* Remarks Dialog */}
      <Dialog open={openRemarkDialog} onClose={() => setOpenRemarkDialog(false)}>
        <DialogTitle>Add Remarks</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Remarks"
            fullWidth
            multiline
            rows={4}
            value={remarkText}
            onChange={(e) => setRemarkText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRemarkDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveRemark} color="primary">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Attendance; 