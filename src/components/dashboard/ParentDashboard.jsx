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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);

        // Fetch events from the API
        const response = await fetch('http://localhost:5001/api/events');
        const eventsData = await response.json();
        setEvents(eventsData);

        // Fetch children data
        const childrenPromises = currentUser.parentInfo.studentIds.map(id =>
          userService.getUserById(id)
        );
        const childrenResponses = await Promise.all(childrenPromises);
        const children = childrenResponses.map(response => response.data);

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
    <Box sx={{ p: 3 }}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <Typography variant="h4" className="text-primary font-bold">
            Welcome, {user?.name}
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
                  {stats.children.map((child, index) => (
                    <ListItem
                      key={index}
                      className="hover:bg-gray-50 rounded-lg transition-colors duration-200"
                    >
                      <Avatar className="mr-4 bg-primary">
                        {child.name.charAt(0)}
                      </Avatar>
                      <ListItemText
                        primary={child.name}
                        secondary={`Class: ${child.studentInfo.class} | Roll No: ${child.studentInfo.rollNo}`}
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
                  ))}
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
  );
};

export default ParentDashboard; 