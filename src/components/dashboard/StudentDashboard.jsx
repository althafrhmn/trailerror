import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Container,
  Paper,
  Box,
  Badge,
  Divider,
  Avatar,
  useTheme,
  LinearProgress,
  Chip,
  IconButton,
} from '@mui/material';
import {
  School as SchoolIcon,
  EventNote as EventNoteIcon,
  Assignment as AssignmentIcon,
  Timeline as TimelineIcon,
  Send as SendIcon,
  CalendarToday as CalendarIcon,
  Refresh as RefreshIcon,
  NavigateNext as NavigateNextIcon,
  AccessTime as AccessTimeIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import Calendar from '../common/Calendar';
import { authService } from '../../services/api';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [stats, setStats] = useState({
    attendance: {
      overall: 0,
      subjects: [],
    },
    pendingLeaves: 0,
    upcomingEvents: [],
    timetable: [],
  });

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);

  // Sample events data
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);

        // Get auth token
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No authentication token found');
          setLoading(false);
          return;
        }

        // Fetch events from the API with authentication
        const response = await fetch('http://localhost:5001/api/events', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Events fetch failed: ${response.status}`);
        }
        
        const eventsData = await response.json();
        setEvents(eventsData);

        // TODO: Fetch actual data from API
        setStats({
          attendance: {
            overall: 85,
            subjects: [
              { name: 'Mathematics', percentage: 90 },
              { name: 'Physics', percentage: 85 },
              { name: 'Chemistry', percentage: 80 },
            ],
          },
          pendingLeaves: 1,
          upcomingEvents: [
            { title: 'Mid-term Exam', date: '2024-03-15' },
            { title: 'Project Submission', date: '2024-03-20' },
          ],
          timetable: [
            { time: '9:00 AM', subject: 'Mathematics' },
            { time: '10:00 AM', subject: 'Physics' },
            { time: '11:00 AM', subject: 'Chemistry' },
          ],
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        // Still show dashboard with mock data if events API fails
        setEvents(sampleEvents);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get attendance color based on percentage
  const getAttendanceColor = (percentage) => {
    if (percentage >= 90) return theme.palette.success.main;
    if (percentage >= 75) return theme.palette.info.main;
    if (percentage >= 60) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: 'calc(100vh - 100px)'
      }}>
          <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header Section */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 2, sm: 0 },
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar 
            sx={{ 
              width: 60, 
              height: 60, 
              bgcolor: theme.palette.primary.main 
            }}
          >
            {user?.name?.charAt(0) || 'S'}
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Welcome back, {user?.name || 'Student'}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <IconButton 
            color="primary" 
            aria-label="refresh" 
            sx={{ bgcolor: 'background.light', boxShadow: 1 }}
          >
            <RefreshIcon />
          </IconButton>
          <IconButton 
            color="primary" 
            aria-label="notifications" 
            sx={{ bgcolor: 'background.light', boxShadow: 1 }}
          >
            <Badge badgeContent={3} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left column */}
        <Grid item xs={12} md={8}>
          {/* Stats row */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                height: '100%', 
                boxShadow: 2, 
                borderRadius: 2,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': { 
                  transform: 'translateY(-4px)', 
                  boxShadow: 4 
                }
              }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Avatar sx={{ bgcolor: 'primary.light', mr: 1, width: 32, height: 32 }}>
                      <TimelineIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="body2" color="text.secondary">
                      Attendance
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.attendance.overall}%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={stats.attendance.overall} 
                    sx={{ 
                      mt: 1, 
                      borderRadius: 1,
                      height: 8,
                      backgroundColor: '#e0e0e0',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getAttendanceColor(stats.attendance.overall)
                      }
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                height: '100%', 
                boxShadow: 2, 
                borderRadius: 2,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': { 
                  transform: 'translateY(-4px)', 
                  boxShadow: 4 
                }
              }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Avatar sx={{ bgcolor: 'success.light', mr: 1, width: 32, height: 32 }}>
                      <SchoolIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="body2" color="text.secondary">
                      Subjects
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.attendance.subjects.length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                height: '100%', 
                boxShadow: 2, 
                borderRadius: 2,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': { 
                  transform: 'translateY(-4px)', 
                  boxShadow: 4 
                }
              }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Avatar sx={{ bgcolor: 'warning.light', mr: 1, width: 32, height: 32 }}>
                      <AssignmentIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="body2" color="text.secondary">
                      Pending Leaves
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.pendingLeaves}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                height: '100%', 
                boxShadow: 2, 
                borderRadius: 2,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': { 
                  transform: 'translateY(-4px)', 
                  boxShadow: 4 
                }
              }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Avatar sx={{ bgcolor: 'info.light', mr: 1, width: 32, height: 32 }}>
                      <EventNoteIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="body2" color="text.secondary">
                      Today's Classes
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.timetable.length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Calendar section */}
          <Card sx={{ 
            mb: 3, 
            boxShadow: 2, 
            borderRadius: 2,
            overflow: 'hidden'
          }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ 
                p: 2, 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                borderBottom: `1px solid ${theme.palette.divider}`
              }}>
                <Typography variant="h6" fontWeight="bold">
                  Academic Calendar
                </Typography>
                <Chip 
                  icon={<CalendarIcon />} 
                  label="View Full Calendar" 
                  onClick={() => navigate('/student/timetable')} 
                  clickable
                  color="primary"
                  variant="outlined"
                />
              </Box>
              <Box sx={{ 
                p: 2,
                height: { xs: '350px', md: '400px' },
                '.calendar-container': {
                  height: '100%',
                },
                '.MuiPickersLayout-root': {
                  overflow: 'hidden',
                },
                '.MuiDateCalendar-root': { 
                  maxHeight: { xs: '320px', md: '380px' },
                  '.MuiDayCalendar-header': {
                    justifyContent: 'space-around',
                  },
                  '.MuiPickersCalendarHeader-root': {
                    paddingLeft: 2,
                    paddingRight: 2,
                  },
                },
              }} className="calendar-in-dashboard">
                {events && events.length > 0 ? (
            <Calendar
                    events={events.map(event => ({
                      ...event,
                      id: event.id || `event-${Math.random().toString(36).substr(2, 9)}`,
                      start: event.date || event.start,
                      end: event.date || event.end,
                      title: event.title,
                      allDay: true
                    }))}
              isEditable={false}
                    height="100%"
                  />
                ) : (
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    height: '100%',
                    flexDirection: 'column',
                    gap: 2,
                    p: 3
                  }}>
                    <CalendarIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5 }} />
                    <Typography variant="body1" color="text.secondary">
                      No events scheduled
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Today's timetable */}
          <Card sx={{ 
            boxShadow: 2, 
            borderRadius: 2,
            overflow: 'hidden'
          }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ 
                p: 2, 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                borderBottom: `1px solid ${theme.palette.divider}`
              }}>
                <Typography variant="h6" fontWeight="bold">
                  Today's Timetable
                </Typography>
                <Button 
                  variant="text" 
                  endIcon={<NavigateNextIcon />}
                  onClick={() => navigate('/student/timetable')}
                >
                  View Full Timetable
                </Button>
              </Box>
              <List sx={{ p: 0 }}>
                {stats.timetable.map((period, index) => (
                  <ListItem 
                    key={index}
                    divider={index < stats.timetable.length - 1}
                    sx={{ 
                      py: 2,
                      px: 3,
                      transition: 'background-color 0.2s',
                      '&:hover': { bgcolor: 'background.light' }
                    }}
                  >
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      width: '100%' 
                    }}>
                      <Avatar 
                        sx={{ 
                          bgcolor: theme.palette.primary.main,
                          color: 'white',
                          mr: 2
                        }}
                      >
                        {period.subject.charAt(0)}
                      </Avatar>
                      <ListItemText 
                        primary={period.subject}
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <AccessTimeIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary', fontSize: '1rem' }} />
                            <Typography variant="body2" color="text.secondary">
                              {period.time}
                            </Typography>
                          </Box>
                        }
                      />
                      <Chip 
                        label="Upcoming" 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                    </Box>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Right column */}
        <Grid item xs={12} md={4}>
          {/* Leave application card */}
            <Card 
              sx={{ 
              mb: 3, 
              background: 'linear-gradient(135deg, #4776E6 0%, #8E54E9 100%)',
              borderRadius: 2,
              boxShadow: 3,
                transition: 'transform 0.3s',
              '&:hover': { 
                transform: 'translateY(-8px)', 
                boxShadow: 6
              }
              }}
              onClick={() => navigate('/student/leave-application')}
            >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h5" component="h2" sx={{ color: 'white', fontWeight: 'bold' }}>
                    Need time off?
                  </Typography>
                  <Badge badgeContent="New" color="error" sx={{ '& .MuiBadge-badge': { fontSize: '0.8rem' } }}>
                    <EventNoteIcon sx={{ color: 'white', fontSize: 40 }} />
                  </Badge>
                </Box>
                <Divider sx={{ my: 2, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                <Typography variant="body1" sx={{ color: 'white', mb: 2 }}>
                  Submit your leave application with just a few clicks
                </Typography>
                <Button 
                  variant="contained" 
                  color="warning" 
                  endIcon={<SendIcon />}
                  fullWidth
                  sx={{ 
                    mt: 2, 
                    color: '#333', 
                    fontWeight: 'bold',
                    '&:hover': { 
                      transform: 'scale(1.03)', 
                      transition: 'all 0.2s' 
                    }
                  }}
                >
                  Apply Now
                </Button>
              </CardContent>
            </Card>

          {/* Subject attendance card */}
          <Card sx={{ 
            boxShadow: 2, 
            borderRadius: 2,
            overflow: 'hidden',
            mb: 3
          }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ 
                p: 2, 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                borderBottom: `1px solid ${theme.palette.divider}`
              }}>
                <Typography variant="h6" fontWeight="bold">
                      Subject-wise Attendance
                    </Typography>
              </Box>
              <List sx={{ p: 0 }}>
                      {stats.attendance.subjects.map((subject, index) => (
                        <ListItem
                          key={index}
                    divider={index < stats.attendance.subjects.length - 1}
                    sx={{ 
                      py: 2,
                      px: 3,
                      transition: 'background-color 0.2s',
                      '&:hover': { bgcolor: 'background.light' }
                    }}
                  >
                    <ListItemText 
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body1" fontWeight="medium">{subject.name}</Typography>
                          <Typography variant="body1" fontWeight="bold" color={getAttendanceColor(subject.percentage)}>
                            {subject.percentage}%
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <LinearProgress 
                          variant="determinate" 
                          value={subject.percentage} 
                          sx={{ 
                            borderRadius: 1,
                            height: 6,
                            backgroundColor: '#e0e0e0',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: getAttendanceColor(subject.percentage)
                            }
                          }}
                        />
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>

          {/* Upcoming events */}
          <Card sx={{ 
            boxShadow: 2, 
            borderRadius: 2,
            overflow: 'hidden'
          }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ 
                p: 2, 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                borderBottom: `1px solid ${theme.palette.divider}`
              }}>
                <Typography variant="h6" fontWeight="bold">
                  Upcoming Events
                </Typography>
              </Box>
              <List sx={{ p: 0 }}>
                {stats.upcomingEvents.map((event, index) => (
                  <ListItem 
                    key={index}
                    divider={index < stats.upcomingEvents.length - 1}
                    sx={{ 
                      py: 2,
                      px: 3,
                      transition: 'background-color 0.2s',
                      '&:hover': { bgcolor: 'background.light' }
                    }}
                        >
                          <ListItemText
                      primary={event.title}
                      secondary={event.date}
                    />
                    <Chip 
                      label="Upcoming" 
                      size="small" 
                      color="warning" 
                      variant="outlined"
                    />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
    </Box>
  );
};

export default StudentDashboard; 