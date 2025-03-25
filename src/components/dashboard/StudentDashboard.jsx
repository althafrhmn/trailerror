import { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  School as SchoolIcon,
  EventNote as EventNoteIcon,
  Assignment as AssignmentIcon,
  Timeline as TimelineIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import Layout from '../common/Layout';
import Calendar from '../common/Calendar';
import { authService } from '../../services/api';

const StudentDashboard = () => {
  const navigate = useNavigate();
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
        const response = await fetch('http://localhost:5000/api/events', {
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

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-full">
          <CircularProgress />
        </div>
      </Layout>
    );
  }

  return (
    <Container maxWidth="lg" className="py-8">
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper className="p-4">
            <h1 className="text-2xl font-semibold text-slate-800 mb-6">Student Dashboard</h1>
            <Calendar
              events={events}
              isEditable={false}
            />
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <Typography variant="h5" gutterBottom className="animate-fade-in">
                Welcome back, {user?.name || 'Student'}
              </Typography>
            </div>

            {/* Prominent Leave Application Card */}
            <Card 
              sx={{ 
                marginTop: 3, 
                marginBottom: 3, 
                background: 'linear-gradient(to right, #4776E6, #8E54E9)',
                transition: 'transform 0.3s',
                '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }
              }}
              onClick={() => navigate('/student/leave-application')}
              className="cursor-pointer"
            >
              <CardContent sx={{ padding: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
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

            <Grid container spacing={3} className="animate-slide-up">
              <Grid item xs={12} md={3}>
                <StatCard
                  icon={TimelineIcon}
                  title="Overall Attendance"
                  value={`${stats.attendance.overall}%`}
                  color="blue"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <StatCard
                  icon={SchoolIcon}
                  title="Total Subjects"
                  value={stats.attendance.subjects.length}
                  color="green"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <StatCard
                  icon={AssignmentIcon}
                  title="Pending Leaves"
                  value={stats.pendingLeaves}
                  color="orange"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <StatCard
                  icon={EventNoteIcon}
                  title="Today's Classes"
                  value={stats.timetable.length}
                  color="purple"
                />
              </Grid>
            </Grid>

            <Grid container spacing={3} className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Grid item xs={12} md={6}>
                <Card className="hover-card h-full">
                  <CardContent>
                    <Typography variant="h6" className="font-semibold mb-4">
                      Subject-wise Attendance
                    </Typography>
                    <List>
                      {stats.attendance.subjects.map((subject, index) => (
                        <ListItem
                          key={index}
                          className="hover:bg-gray-50 rounded-lg transition-colors duration-200"
                        >
                          <ListItemText
                            primary={subject.name}
                            secondary={`Attendance: ${subject.percentage}%`}
                          />
                          <div className="w-24 bg-gray-200 rounded-full h-2.5">
                            <div
                              className="bg-primary h-2.5 rounded-full"
                              style={{ width: `${subject.percentage}%` }}
                            ></div>
                          </div>
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </div>
        </Grid>
      </Grid>
    </Container>
  );
};

export default StudentDashboard; 