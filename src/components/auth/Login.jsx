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
  Divider,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Google as GoogleIcon,
  Facebook as FacebookIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from "../../contexts/AuthContext";
import { login as loginService } from "../../services/api/authService";
import logo from "/Main.png";

// Common styles for text fields
const textFieldStyles = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    '& fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#ffffff',
    },
    '& input': {
      color: '#ffffff',
    },
    '& label': {
      color: 'rgba(255, 255, 255, 0.7)',
    },
    '&.Mui-focused label': {
      color: '#ffffff',
    },
  },
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
  const [showPassword, setShowPassword] = useState(false);

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
        position: 'relative',
        overflow: 'hidden',
        background: '#000000',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("/background-pattern.png")',
          opacity: 0.05,
          animation: 'moveBackground 20s linear infinite',
        },
        '@keyframes moveBackground': {
          '0%': { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '100% 100%' },
        },
      }}
    >
      <Container maxWidth="sm">
        <Card 
          sx={{ 
            p: 4, 
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
            backdropFilter: 'blur(4px)',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            transform: 'translateY(0)',
            transition: 'transform 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-5px)',
            },
          }}
        >
          <CardContent>
            <Box display="flex" flexDirection="column" alignItems="center" mb={4}>
              <Box
                component="img"
                src={logo}
                alt="Logo"
                sx={{
                  width: 80,
                  height: 80,
                  mb: 2,
                  objectFit: 'contain',
                }}
              />
              <Typography 
                variant="h4" 
                component="h1" 
                gutterBottom
                sx={{ 
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 700,
                  color: '#ffffff',
                  letterSpacing: 3,
                  fontSize: '2.2rem',
                  textTransform: 'uppercase',
                  textShadow: '0 0 10px rgba(255,255,255,0.3)',
                  background: 'linear-gradient(90deg, #ffffff 0%, #e0e0e0 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                ATTENDEASE
              </Typography>
              <Typography 
                variant="h6" 
                component="h2" 
                gutterBottom
                sx={{ 
                  fontWeight: 500,
                  color: 'rgba(255, 255, 255, 0.7)',
                }}
              >
                Welcome Back
              </Typography>
              <Typography color="rgba(255, 255, 255, 0.7)" align="center">
                Please sign in to continue
              </Typography>
            </Box>

            {errorMsg && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {errorMsg}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <FormControl 
                fullWidth 
                margin="normal"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#ffffff',
                    },
                    '& input': {
                      color: '#ffffff',
                    },
                    '& label': {
                      color: 'rgba(255, 255, 255, 0.7)',
                    },
                    '&.Mui-focused label': {
                      color: '#ffffff',
                    },
                  },
                }}
              >
                <InputLabel id="role-label">Role</InputLabel>
                <Select
                  labelId="role-label"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  error={!!fieldErrors.role}
                  label="Role"
                  sx={{
                    color: '#ffffff',
                    '& .MuiSelect-icon': {
                      color: 'rgba(255, 255, 255, 0.7)',
                    },
                  }}
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
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#ffffff',
                    },
                    '& input': {
                      color: '#ffffff',
                    },
                    '& label': {
                      color: 'rgba(255, 255, 255, 0.7)',
                    },
                    '&.Mui-focused label': {
                      color: '#ffffff',
                    },
                  },
                }}
              />

              <TextField
                fullWidth
                margin="normal"
                type={showPassword ? 'text' : 'password'}
                label="Password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                error={!!fieldErrors.password}
                helperText={fieldErrors.password}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#ffffff',
                    },
                    '& input': {
                      color: '#ffffff',
                    },
                    '& label': {
                      color: 'rgba(255, 255, 255, 0.7)',
                    },
                    '&.Mui-focused label': {
                      color: '#ffffff',
                    },
                  },
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ 
                  mt: 3,
                  mb: 2,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  background: '#ffffff',
                  color: '#000000',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.9)',
                  },
                }}
              >
                {loading ? <CircularProgress size={24} /> : 'Sign In'}
              </Button>

              <Divider sx={{ my: 3, color: 'rgba(255, 255, 255, 0.3)' }}>or continue with</Divider>

              <Box display="flex" justifyContent="center" gap={2} mb={3}>
                <IconButton 
                  onClick={() => window.location.href = 'https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_GOOGLE_CLIENT_ID&redirect_uri=http://localhost:3000/auth/google/callback&response_type=code&scope=email profile'}
                  sx={{ 
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    boxShadow: 1,
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' }
                  }}
                >
                  <GoogleIcon sx={{ color: '#DB4437' }} />
                </IconButton>
                <IconButton 
                  onClick={() => window.location.href = 'https://www.facebook.com/v12.0/dialog/oauth?client_id=YOUR_FACEBOOK_APP_ID&redirect_uri=http://localhost:3000/auth/facebook/callback&scope=email public_profile'}
                  sx={{ 
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    boxShadow: 1,
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' }
                  }}
                >
                  <FacebookIcon sx={{ color: '#4267B2' }} />
                </IconButton>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default Login;