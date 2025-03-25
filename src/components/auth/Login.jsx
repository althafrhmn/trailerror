import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  useTheme,
  Container,
  Alert,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { login as loginService } from '../../services/api/authService';

const demoLogin = (username, password) => {
  // Mock user accounts for testing when server is down
  const mockUsers = [
    {
      _id: 'admin-1',
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123',
      name: 'Admin User',
      role: 'admin'
    },
    {
      _id: 'faculty-1',
      username: 'faculty',
      email: 'faculty@example.com',
      password: 'faculty123',
      name: 'John Smith',
      role: 'faculty',
      department: 'Computer Science'
    },
    {
      _id: 'student-1',
      username: 'student',
      email: 'student@example.com',
      password: 'student123',
      name: 'Mary Johnson',
      role: 'student'
    }
  ];

  // Find matching user by username or email
  const user = mockUsers.find(u => 
    (u.username === username || u.email === username) && 
    u.password === password
  );
  
  if (!user) {
    return {
      success: false,
      message: 'Invalid username/email or password'
    };
  }

  // Create a demo token
  const token = `mock-token-${user.role}-${Date.now()}`;
  
  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;
  
  return {
    success: true,
    user: userWithoutPassword,
    token,
    message: 'Logged in with demo account'
  };
};

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { login: authLogin } = useAuth();
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({
    username: '',
    password: '',
    role: ''
  });

  const roles = [
    { value: 'admin', label: 'Admin' },
    { value: 'faculty', label: 'Faculty' },
    { value: 'student', label: 'Student' },
    { value: 'parent', label: 'Parent' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when user types
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
      setErrorMsg('');
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.role) {
      newErrors.role = 'Please select your role';
    }
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    }
    
    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setFieldErrors({
      username: '',
      password: '',
      role: ''
    });

    try {
      // Validate form inputs
      if (!validateForm()) {
        setLoading(false);
        return;
      }

      // Call the login service with proper error handling
      const result = await loginService(formData);
      
      if (!result.success) {
        // Handle error response
        const errorMessage = result.error || 'Login failed';
        setErrorMsg(errorMessage);
        toast.error(errorMessage);
        setLoading(false);
        return;
      }
      
      // Login successful - update auth context
      const { user, token } = result;
      
      // Set auth state using the context
      await authLogin(user, token);
      
      // Show success message
      toast.success(`Welcome back, ${user.name || user.username}!`);
      
      // Get redirect path from location state or use default based on role
      const from = location.state?.from?.pathname;
      
      // Redirect based on user role or return URL
      if (from) {
        navigate(from);
      } else {
        switch (user.role) {
          case 'admin':
            navigate('/admin/dashboard');
            break;
          case 'faculty':
            navigate('/faculty/dashboard');
            break;
          case 'student':
            navigate('/student/dashboard');
            break;
          case 'parent':
            navigate('/parent/dashboard');
            break;
          default:
            navigate('/');
        }
      }

    } catch (err) {
      console.error('Login error:', err);
      setErrorMsg('An unexpected error occurred. Please try again.');
      toast.error('Login failed: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.palette.background.default,
      }}
    >
      <Container maxWidth="sm">
        <Card sx={{ p: 4, boxShadow: theme.shadows[3] }}>
          <CardContent>
            <Typography variant="h4" component="h1" align="center" gutterBottom>
              Login
            </Typography>

            {errorMsg && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errorMsg}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="role-label">Role</InputLabel>
                <Select
                  labelId="role-label"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  error={!!fieldErrors.role}
                  label="Role"
                >
                  {roles.map((role) => (
                    <MenuItem key={role.value} value={role.value}>
                      {role.label}
                    </MenuItem>
                  ))}
                </Select>
                {fieldErrors.role && (
                  <Typography color="error" variant="caption">
                    {fieldErrors.role}
                  </Typography>
                )}
              </FormControl>

              <TextField
                fullWidth
                margin="normal"
                label="Username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                error={!!fieldErrors.username}
                helperText={fieldErrors.username}
              />

              <TextField
                fullWidth
                margin="normal"
                type="password"
                label="Password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                error={!!fieldErrors.password}
                helperText={fieldErrors.password}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 3 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Login'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default Login; 