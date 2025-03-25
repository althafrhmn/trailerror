import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  CardActions
} from '@mui/material';
import {
  People as StudentsIcon,
  Class as ClassIcon,
  Book as SubjectIcon,
  CalendarToday as TodayIcon,
  CheckCircle as PresentIcon,
  Cancel as AbsentIcon,
  Schedule as LateIcon,
  Refresh as RefreshIcon,
  ListAlt as ListAltIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { userService, attendanceService, authService } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const FacultyDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalClasses: 0,
    totalSubjects: 0,
    pendingLeaveRequests: 0,
    todayAttendance: {
      present: 0,
      absent: 0,
      late: 0,
      total: 0
    }
  });
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const currentUser = useMemo(() => authService.getCurrentUser(), []);
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get faculty's assigned classes and subjects
      const classesResponse = await userService.getFacultyClasses(currentUser._id);
      const classes = classesResponse.data || [];
      
      // Get all students in faculty's classes
      const studentsPromises = classes.map(cls => 
        userService.getUsers({ role: 'student', class: cls.name })
      );
      const studentsResponses = await Promise.all(studentsPromises);
      const allStudents = studentsResponses.flatMap(response => response.data || []);
      
      // Get today's attendance
      const today = new Date().toISOString().split('T')[0];
      const attendancePromises = classes.map(cls =>
        attendanceService.getAttendance({ class: cls.name, date: today })
      );
      
      const attendanceResponses = await Promise.all(attendancePromises);
      const allAttendance = attendanceResponses.flatMap(response => response.data || []);
      
      // Fetch pending leave requests count
      let pendingLeaveRequests = 0;
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const leaveResponse = await axios.get('http://localhost:5000/api/leaves?status=pending', {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (leaveResponse.data.success) {
            pendingLeaveRequests = leaveResponse.data.data.length;
          }
        }
      } catch (leaveError) {
        console.warn('Could not fetch pending leave requests:', leaveError);
        // Continue with dashboard data - leave requests is not critical
      }
      
      // Calculate attendance stats
      const present = allAttendance.filter(a => a.status.toLowerCase() === 'present').length;
      const absent = allAttendance.filter(a => a.status.toLowerCase() === 'absent').length;
      const late = allAttendance.filter(a => a.status.toLowerCase() === 'late').length;
      const total = allAttendance.length;
      
      // Set dashboard stats
      setStats({
        totalStudents: allStudents.length,
        totalClasses: classes.length,
        totalSubjects: [...new Set(classes.map(cls => cls.subject))].length,
        pendingLeaveRequests,
        todayAttendance: {
          present,
          absent,
          late,
          total
        }
      });

      // Get recent attendance records
      const recentAttendanceResponse = await attendanceService.getAttendance(
        null,
        new Date(today.setDate(today.getDate() - 7)), // Last 7 days
        new Date()
      );

      // Set all statistics
      setRecentAttendance(recentAttendanceResponse.data || []);
      setUpcomingClasses(classes.filter(cls => {
        const classTime = new Date(cls.startTime);
        return classTime > new Date();
      }).slice(0, 5));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [currentUser._id]);

  const getAttendanceColor = (status) => {
    switch (status.toLowerCase()) {
      case 'present':
        return 'success.main';
      case 'absent':
        return 'error.main';
      case 'late':
        return 'warning.main';
      default:
        return 'text.secondary';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert 
        severity="error" 
        action={
          <IconButton
            color="inherit"
            size="small"
            onClick={fetchDashboardData}
          >
            <RefreshIcon />
          </IconButton>
        }
      >
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome, {currentUser.name}
        </Typography>
        <Tooltip title="Refresh Dashboard">
          <IconButton onClick={fetchDashboardData}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <StudentsIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography color="textSecondary">Total Students</Typography>
              </Box>
              <Typography variant="h4">{stats.totalStudents}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ClassIcon sx={{ mr: 1, color: 'secondary.main' }} />
                <Typography color="textSecondary">Total Classes</Typography>
              </Box>
              <Typography variant="h4">{stats.totalClasses}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SubjectIcon sx={{ mr: 1, color: 'success.main' }} />
                <Typography color="textSecondary">Total Subjects</Typography>
              </Box>
              <Typography variant="h4">{stats.totalSubjects}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ListAltIcon sx={{ mr: 1, color: 'warning.main' }} />
                <Typography color="textSecondary">Pending Leave Requests</Typography>
              </Box>
              <Typography variant="h4">{stats.pendingLeaveRequests}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TodayIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography color="textSecondary">Today's Attendance</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Tooltip title="Present">
                  <Box sx={{ textAlign: 'center' }}>
                    <PresentIcon sx={{ color: 'success.main' }} />
                    <Typography>{stats.todayAttendance.present}</Typography>
                  </Box>
                </Tooltip>
                <Tooltip title="Absent">
                  <Box sx={{ textAlign: 'center' }}>
                    <AbsentIcon sx={{ color: 'error.main' }} />
                    <Typography>{stats.todayAttendance.absent}</Typography>
                  </Box>
                </Tooltip>
                <Tooltip title="Late">
                  <Box sx={{ textAlign: 'center' }}>
                    <LateIcon sx={{ color: 'warning.main' }} />
                    <Typography>{stats.todayAttendance.late}</Typography>
                  </Box>
                </Tooltip>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Attendance and Upcoming Classes */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Attendance
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <List>
              {recentAttendance.slice(0, 5).map((record, index) => (
                <ListItem key={record._id || index} divider={index !== 4}>
                  <ListItemIcon>
                    {record.status === 'present' ? (
                      <PresentIcon sx={{ color: 'success.main' }} />
                    ) : record.status === 'absent' ? (
                      <AbsentIcon sx={{ color: 'error.main' }} />
                    ) : (
                      <LateIcon sx={{ color: 'warning.main' }} />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={`${record.student.name} - ${record.class}`}
                    secondary={format(new Date(record.date), 'PPp')}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Upcoming Classes
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <List>
              {upcomingClasses.map((cls, index) => (
                <ListItem key={cls._id || index} divider={index !== upcomingClasses.length - 1}>
                  <ListItemIcon>
                    <ClassIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${cls.subject} - ${cls.name}`}
                    secondary={format(new Date(cls.startTime), 'PPp')}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Quick Access Cards */}
      <Typography variant="h6" sx={{ mb: 2, mt: 4 }}>Quick Access</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                Leave Requests
              </Typography>
              <Typography variant="body2" color="text.secondary">
                View and manage student leave applications that require your approval.
              </Typography>
            </CardContent>
            <CardActions>
              <Button 
                color="primary" 
                size="small" 
                onClick={() => navigate('/faculty/leave-requests')}
              >
                View Leave Requests
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        {/* Add other quick access cards here */}
      </Grid>
    </Box>
  );
};

export default FacultyDashboard; 