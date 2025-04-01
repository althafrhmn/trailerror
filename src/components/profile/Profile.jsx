import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Avatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Paper,
  Container,
} from '@mui/material';
import {
  Person as PersonIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  School as SchoolIcon,
  Work as WorkIcon,
  Security as SecurityIcon,
  History as HistoryIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Badge as BadgeIcon,
  AdminPanelSettings as AdminIcon,
  FamilyRestroom as ParentIcon,
  Face as StudentIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { authService, userService } from '../../services/api';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    const currentUser = authService.getCurrentUser();
    return currentUser || null;
  });
  
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    role: '',
    department: '',
    adminLevel: '',
    permissions: [],
    lastLogin: '',
    accountCreated: '',
  });
  
  const [errors, setErrors] = useState({});
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState(false);

    const fetchUserData = async () => {
      try {
      setLoading(true);
      
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }

        const currentUser = authService.getCurrentUser();
      if (!currentUser?._id) {
        throw new Error('No user found in session');
      }

      // Check if user is authorized (admin or faculty)
      if (currentUser.role !== 'admin' && currentUser.role !== 'faculty' && currentUser.role !== 'parent' && currentUser.role !== 'student') {
        navigate('/');
        toast.error('Unauthorized access');
        return;
      }

          const response = await userService.getUserById(currentUser._id);
      if (!response.success || !response.data) {
        console.error('API call failed, using data from localStorage as fallback');
        
        // Use data from localStorage as fallback
        const fallbackData = {
          ...currentUser,
          role: currentUser.role,
          _id: currentUser._id,
        };
        
        setUser(fallbackData);
        
        // Set basic form data from the current user in localStorage
        setFormData({
          name: currentUser.name || '',
          email: currentUser.email || '',
          phoneNumber: currentUser.phoneNumber || '',
          role: currentUser.role || '',
          department: currentUser.department || '',
          adminLevel: currentUser.role === 'admin' ? 'Super Admin' : '',
          permissions: currentUser.permissions || ['view'],
          lastLogin: currentUser.lastLogin || new Date().toISOString(),
          accountCreated: currentUser.createdAt || new Date().toISOString(),
        });
        
        // Continue execution without throwing an error
        setLoading(false);
        return;
      }

          const userData = response.data;
      
      // Update user state and localStorage
      const updatedUser = {
        ...userData,
        role: userData.role || currentUser.role,
        _id: currentUser._id,
      };
      
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Update form data with all fields
      const updatedFormData = {
        name: userData.name || '',
        email: userData.email || '',
        phoneNumber: userData.phoneNumber || '',
        role: userData.role || '',
        department: userData.department || '',
        adminLevel: userData.adminLevel || 'Super Admin',
        permissions: userData.permissions || ['all'],
        lastLogin: userData.lastLogin || new Date().toISOString(),
        accountCreated: userData.createdAt || new Date().toISOString(),
      };
      
      setFormData(updatedFormData);

      try {
        const logsResponse = await userService.getUserActivityLogs(currentUser._id);
        if (logsResponse.success && logsResponse.data) {
          setActivityLogs(logsResponse.data);
        } else {
          console.log('No activity logs returned, using fallback data');
          // Set fallback logs if the API call was successful but returned no data
          const role = currentUser.role || 'user';
          setActivityLogs([
            { action: 'Login', timestamp: new Date().toISOString(), details: `${role.charAt(0).toUpperCase() + role.slice(1)} logged in successfully` },
            { action: 'Profile Update', timestamp: new Date(Date.now() - 86400000).toISOString(), details: `Updated ${role} profile` },
          ]);
        }
      } catch (error) {
        console.error('Error fetching activity logs:', error);
        // Set fallback logs if the API call failed
        const role = currentUser.role || 'user';
        setActivityLogs([
          { action: 'Login', timestamp: new Date().toISOString(), details: `${role.charAt(0).toUpperCase() + role.slice(1)} logged in successfully` },
          { action: 'Profile Update', timestamp: new Date(Date.now() - 86400000).toISOString(), details: `Updated ${role} profile` },
        ]);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error(error.message || 'Failed to fetch user data');
      if (!authService.isAuthenticated()) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [navigate]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    
    if (formData.phoneNumber && !/^\d{10}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Phone number must be 10 digits';
    }
    
    if (!formData.department.trim()) {
      newErrors.department = 'Department is required for admin users';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'phoneNumber') {
      const numberValue = value.replace(/\D/g, '');
      
      if (numberValue.length > 10) {
        setErrors(prev => ({
          ...prev,
          phoneNumber: 'Phone number cannot exceed 10 digits'
        }));
        toast.error('Phone number cannot exceed 10 digits');
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        [name]: numberValue
      }));
      
      setErrors(prev => ({
        ...prev,
        phoneNumber: numberValue.length === 10 ? null : 'Phone number must be 10 digits'
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      
      // Clear error when field is filled
      if (value.trim()) {
        setErrors(prev => ({
          ...prev,
          [name]: null
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }
    
    try {
      setUpdateLoading(true);
      
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }

      const currentUser = authService.getCurrentUser();
      if (!currentUser?._id) {
        throw new Error('Please log in to update your profile');
      }

      // Allow both admin and faculty users to update their profile
      if (currentUser.role !== 'admin' && currentUser.role !== 'faculty' && currentUser.role !== 'parent' && currentUser.role !== 'student') {
        throw new Error('Unauthorized access');
      }

      const updatedData = {
        name: formData.name,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        department: formData.department,
        adminLevel: formData.adminLevel,
        permissions: formData.permissions,
      };

      const response = await userService.updateUser(currentUser._id, updatedData);

      if (!response.success) {
        throw new Error(response.error || 'Failed to update profile');
      }

      // Update local storage with new user data
      const updatedUser = {
        ...currentUser,
        ...updatedData
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      // Update form data directly instead of fetching
      setFormData(prev => ({
        ...prev,
        ...updatedData
      }));

      // Add activity log
      setActivityLogs(prev => [{
        action: 'Profile Update',
        timestamp: new Date().toISOString(),
        details: `Updated ${currentUser.role} profile`
      }, ...prev]);

      toast.success(`${currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)} profile updated successfully`);
      setEditing(false);

    } catch (error) {
      console.error('Update profile error:', error);
      toast.error(error.message || 'Failed to update profile');
      if (error.message.includes('Authentication')) {
        navigate('/login');
      }
    } finally {
      setUpdateLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    try {
      if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        toast.error('All password fields are required');
        return;
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        toast.error('New passwords do not match');
        return;
      }

      if (passwordData.newPassword.length < 8) {
        toast.error('Password must be at least 8 characters long');
        return;
      }

      const response = await userService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to change password');
      }

      toast.success('Password changed successfully');
      setOpenPasswordDialog(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

    } catch (error) {
      console.error('Password change error:', error);
      toast.error(error.message || 'Failed to change password');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <Typography>Please log in to view your profile</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
              <Typography variant="h4" component="h1">
                {user?.role === 'admin' ? 'Admin' : 
                 user?.role === 'faculty' ? 'Faculty' :
                 user?.role === 'parent' ? 'Parent' :
                 user?.role === 'student' ? 'Student' : 'User'} Profile Management
              </Typography>
              <Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={editing ? <SaveIcon /> : <EditIcon />}
            onClick={() => editing ? handleSubmit() : setEditing(true)}
                  disabled={updateLoading}
                >
                  {updateLoading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    editing ? 'Save Changes' : 'Edit Profile'
                  )}
          </Button>
              </Box>
            </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Box display="flex" flexDirection="column" alignItems="center">
                <Avatar
                        sx={{
                          width: 120,
                          height: 120,
                          mb: 2,
                          bgcolor: 'primary.main',
                        }}
                      >
                        {user?.role === 'admin' ? <AdminIcon sx={{ fontSize: 60 }} /> :
                         user?.role === 'faculty' ? <SchoolIcon sx={{ fontSize: 60 }} /> :
                         user?.role === 'parent' ? <ParentIcon sx={{ fontSize: 60 }} /> :
                         user?.role === 'student' ? <StudentIcon sx={{ fontSize: 60 }} /> :
                         <PersonIcon sx={{ fontSize: 60 }} />}
                </Avatar>
                      <Typography variant="h6">{formData.name}</Typography>
                      <Typography color="textSecondary" gutterBottom>
                        {formData.adminLevel}
                </Typography>
                      <Chip
                        icon={<BadgeIcon />}
                        label={formData.role.toUpperCase()}
                        color="primary"
                        sx={{ mt: 1 }}
                      />
                    </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
                <Card>
              <CardContent>
                    <Typography variant="h6" gutterBottom>
                  Personal Information
                </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                          label="Full Name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        disabled={!editing}
                          error={!!errors.name}
                          helperText={errors.name}
                        required
                      />
                    </Grid>
                      <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={!editing}
                          error={!!errors.email}
                          helperText={errors.email}
                        required
                      />
                    </Grid>
                      <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Phone Number"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        disabled={!editing}
                        error={!!errors.phoneNumber}
                          helperText={errors.phoneNumber}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Department"
                          name="department"
                          value={formData.department}
                          onChange={handleChange}
                          disabled={!editing}
                          error={!!errors.department}
                          helperText={errors.department}
                          required
                        />
                      </Grid>
                    </Grid>

                    <Box mt={3}>
                      <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<SecurityIcon />}
                        onClick={() => setOpenPasswordDialog(true)}
                      >
                        Change Password
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
                  </Grid>

              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Recent Activity
                    </Typography>
                    <List>
                      {activityLogs.map((log, index) => (
                        <ListItem key={index} divider={index !== activityLogs.length - 1}>
                          <ListItemIcon>
                            <HistoryIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary={log.action}
                            secondary={new Date(log.timestamp).toLocaleString()}
                          />
                        </ListItem>
                      ))}
                    </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={openPasswordDialog} onClose={() => setOpenPasswordDialog(false)}>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Box pt={2}>
            <TextField
              fullWidth
              type="password"
              label="Current Password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
              margin="normal"
            />
            <TextField
              fullWidth
              type="password"
              label="New Password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
              margin="normal"
            />
            <TextField
              fullWidth
              type="password"
              label="Confirm New Password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPasswordDialog(false)}>Cancel</Button>
          <Button onClick={handlePasswordChange} color="primary" variant="contained">
            Change Password
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile; 