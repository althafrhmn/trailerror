import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Card,
  CardContent,
  IconButton,
  Chip,
  useTheme,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  People as PeopleIcon,
  School as SchoolIcon,
  Event as EventIcon,
  Assessment as AssessmentIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { userService } from '../../services/api';
import { getEvents } from '../../services/eventService';
import { toast } from 'react-hot-toast';

const StatCard = ({ icon: Icon, title, value, color }) => {
  const theme = useTheme();
  
  return (
    <Card sx={{ height: '100%', bgcolor: 'background.paper', borderRadius: 2 }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box flex={1}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" color="text.primary">
              {value}
            </Typography>
          </Box>
          <Box 
            sx={{ 
              p: 1.5, 
              borderRadius: 2, 
              bgcolor: `${color}.main`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Icon sx={{ color: 'white', fontSize: 24 }} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const AdminDashboard = () => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalFaculty: 0,
    totalParents: 0,
    totalEvents: 0
  });
  const [recentUsers, setRecentUsers] = useState([]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all users
      const userResponse = await userService.getUsers();
      if (!userResponse.success) {
        throw new Error(userResponse.error || 'Failed to fetch users');
      }

      const users = userResponse.data;

      // Fetch all events
      const eventResponse = await getEvents();
      console.log('Event response:', eventResponse);

      // Handle events based on response format
      let events = [];
      if (eventResponse.success && Array.isArray(eventResponse.data)) {
        events = eventResponse.data;
      } else if (!eventResponse.success) {
        console.warn('Failed to fetch events:', eventResponse.error);
        // Don't throw error, just show warning and continue with empty events
        toast.error('Failed to load events: ' + (eventResponse.error || 'Unknown error'));
      }

      // Calculate stats
      const stats = {
        totalStudents: users.filter(user => user.role === 'student').length,
        totalFaculty: users.filter(user => user.role === 'faculty').length,
        totalParents: users.filter(user => user.role === 'parent').length,
        totalEvents: events.length
      };

      // Get recent users (last 10 users, sorted by creation date)
      const sortedUsers = [...users]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 10);

      setStats(stats);
      setRecentUsers(sortedUsers);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to fetch dashboard data');
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Set up polling for real-time updates
    const pollInterval = setInterval(fetchDashboardData, 30000); // Poll every 30 seconds
    return () => clearInterval(pollInterval);
  }, []);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const statsData = [
    { icon: SchoolIcon, title: 'Total Students', value: stats.totalStudents.toString(), color: 'primary' },
    { icon: PeopleIcon, title: 'Total Faculty', value: stats.totalFaculty.toString(), color: 'success' },
    { icon: PeopleIcon, title: 'Total Parents', value: stats.totalParents.toString(), color: 'warning' },
    { icon: EventIcon, title: 'Total Events', value: stats.totalEvents.toString(), color: 'error' },
  ];

  const quickActions = [
    { icon: PeopleIcon, label: 'Manage Users', to: '/admin/users', color: 'primary' },
    { icon: EventIcon, label: 'Manage Events', to: '/admin/events', color: 'success' },
    { icon: SchoolIcon, label: 'Edit Timetable', to: '/admin/timetable', color: 'warning' },
    { icon: AssessmentIcon, label: 'View Reports', to: '/admin/reports', color: 'error' },
  ];

  if (loading && !recentUsers.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom color="text.primary" sx={{ mb: 4 }}>
        Admin Dashboard
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statsData.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>

      {/* Recent Users Section */}
      <Paper sx={{ mb: 4, borderRadius: 2, bgcolor: 'background.paper' }}>
        <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" color="text.primary">
              Recent Users
            </Typography>
            <Button
              component={Link}
              to="/admin/users"
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              sx={{ borderRadius: 2 }}
            >
              Add User
            </Button>
          </Box>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentUsers
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((user) => (
                  <TableRow key={user._id || user.id} hover>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.role}
                        color={
                          user.role === 'admin'
                            ? 'error'
                            : user.role === 'faculty'
                            ? 'success'
                            : user.role === 'student'
                            ? 'primary'
                            : 'warning'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.status || 'active'}
                        color={user.status === 'active' ? 'success' : 'default'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        component={Link}
                        to={`/admin/users/${user._id || user.id}`}
                        color="primary"
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={recentUsers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Quick Actions */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ height: '100%', borderRadius: 2, bgcolor: 'background.paper' }}>
            <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6" color="text.primary">
                Quick Actions
              </Typography>
            </Box>
            <Box sx={{ p: 3 }}>
              <Grid container spacing={2}>
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Grid item xs={12} sm={6} key={index}>
                      <Button
                        component={Link}
                        to={action.to}
                        variant="contained"
                        color={action.color}
                        startIcon={<Icon />}
                        fullWidth
                        sx={{
                          py: 1.5,
                          borderRadius: 2,
                          textTransform: 'none',
                          fontSize: '1rem'
                        }}
                      >
                        {action.label}
                      </Button>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;