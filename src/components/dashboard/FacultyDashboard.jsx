import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress,
  useTheme,
  Alert,
} from '@mui/material';
import {
  Person as PersonIcon,
  Class as ClassIcon,
  Event as EventIcon,
  Message as MessageIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';

// Create axios instance with base URL for consistent API calls
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
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

// Stat Card Component
const StatCard = ({ icon: Icon, title, value, color }) => {
  const theme = useTheme();
  
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              backgroundColor: `${color}.lighter`,
              borderRadius: '12px',
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon sx={{ color: `${color}.main`, fontSize: 24 }} />
          </Box>
          <Typography variant="h6" sx={{ ml: 2, color: 'text.primary' }}>
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" sx={{ color: `${color}.main`, fontWeight: 'bold' }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
};

const FacultyDashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalClasses: 0,
    todayClasses: 0,
    pendingAssignments: 0,
    totalStudents: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [upcomingClasses, setUpcomingClasses] = useState([]);

  useEffect(() => {
    // Fetch real data from the backend
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch class stats
        const classesResponse = await api.get('/faculty/classes', {
          params: { facultyId: user?._id }
        });
        
        // Fetch today's classes
        const today = new Date().toISOString().split('T')[0];
        const todayClassesResponse = await api.get('/faculty/classes/today', {
          params: { facultyId: user?._id, date: today }
        });
        
        // Fetch pending assignments/tasks
        const tasksResponse = await api.get('/faculty/tasks/pending', {
          params: { facultyId: user?._id }
        });
        
        // Fetch total students in assigned classes
        const studentsResponse = await api.get('/faculty/students', {
          params: { facultyId: user?._id }
        });
        
        // Fetch recent activities
        const activitiesResponse = await api.get('/faculty/activities', {
          params: { facultyId: user?._id, limit: 5 }
        });
        
        // Fetch upcoming classes for today
        const upcomingResponse = await api.get('/faculty/classes/upcoming', {
          params: { facultyId: user?._id, date: today }
        });

        // Update state with real data
        setStats({
          totalClasses: classesResponse.data?.data?.count || 0,
          todayClasses: todayClassesResponse.data?.data?.count || 0,
          pendingAssignments: tasksResponse.data?.data?.count || 0,
          totalStudents: studentsResponse.data?.data?.count || 0,
        });
        
        setRecentActivities(activitiesResponse.data?.data || []);
        setUpcomingClasses(upcomingResponse.data?.data || []);
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data. Please try again later.');
        
        // Fallback to empty data
        setStats({
          totalClasses: user?.facultyInfo?.assignedClasses?.length || 0,
          todayClasses: 0,
          pendingAssignments: 0,
          totalStudents: 0,
        });
        
        // Show error toast
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const quickActions = [
    { 
      title: 'Mark Attendance',
      icon: <CheckCircleIcon />,
      path: '/faculty/attendance',
      color: theme.palette.success.main
    },
    { 
      title: 'View Timetable',
      icon: <ScheduleIcon />,
      path: '/faculty/timetable',
      color: theme.palette.primary.main
    },
    { 
      title: 'Check Messages',
      icon: <MessageIcon />,
      path: '/faculty/messages',
      color: theme.palette.info.main
    },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Welcome Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          Welcome back, {user?.name || 'Faculty'}!
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Here's what's happening with your classes today
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={ClassIcon}
            title="Assigned Classes"
            value={stats.totalClasses}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={EventIcon}
            title="Today's Classes"
            value={stats.todayClasses}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={AssignmentIcon}
            title="Pending Tasks"
            value={stats.pendingAssignments}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={PersonIcon}
            title="Total Students"
            value={stats.totalStudents}
            color="info"
          />
        </Grid>
      </Grid>

      {/* Quick Actions and Recent Activities */}
      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Quick Actions
            </Typography>
            <List>
              {quickActions.map((action, index) => (
                <div key={action.title}>
                  <ListItem
                    button
                    onClick={() => navigate(action.path)}
                    sx={{
                      borderRadius: 1,
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ color: action.color }}>
                      {action.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={action.title}
                      primaryTypographyProps={{ fontWeight: 'medium' }}
                    />
                    <ArrowForwardIcon sx={{ color: 'text.secondary' }} />
                  </ListItem>
                  {index < quickActions.length - 1 && <Divider sx={{ my: 1 }} />}
                </div>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Recent Activities */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Recent Activities
            </Typography>
            {recentActivities.length > 0 ? (
              <List>
                {recentActivities.map((activity, index) => (
                  <div key={index}>
                    <ListItem>
                      <ListItemIcon>
                        {activity.type === 'attendance' && <CheckCircleIcon color="success" />}
                        {activity.type === 'assignment' && <AssignmentIcon color="warning" />}
                        {activity.type === 'message' && <MessageIcon color="info" />}
                      </ListItemIcon>
                      <ListItemText
                        primary={activity.message}
                        secondary={new Date(activity.createdAt).toLocaleString()}
                        primaryTypographyProps={{ fontWeight: 'medium' }}
                      />
                    </ListItem>
                    {index < recentActivities.length - 1 && <Divider sx={{ my: 1 }} />}
                  </div>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No recent activities found.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Upcoming Classes */}
      <Grid container sx={{ mt: 3 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Upcoming Classes Today
            </Typography>
            {upcomingClasses.length > 0 ? (
              <List>
                {upcomingClasses.map((cls, index) => (
                  <div key={index}>
                    <ListItem>
                      <ListItemIcon>
                        <ClassIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={`${cls.subject} - ${cls.className}`}
                        secondary={`${cls.startTime} - ${cls.endTime}`}
                        primaryTypographyProps={{ fontWeight: 'medium' }}
                      />
                    </ListItem>
                    {index < upcomingClasses.length - 1 && <Divider sx={{ my: 1 }} />}
                  </div>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No upcoming classes for today.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FacultyDashboard; 