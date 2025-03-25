import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaBars, FaTimes } from 'react-icons/fa';
import { AppBar, Toolbar, IconButton, Typography, Box, Avatar } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const getNavLinks = () => {
    if (!user) return [];

    const commonLinks = [
      { to: '/profile', text: 'Profile' },
      { to: '/messages', text: 'Messages' },
    ];

    switch (user.role) {
      case 'admin':
        return [
          { to: '/admin/dashboard', text: 'Dashboard' },
          { to: '/admin/users', text: 'User Management' },
          { to: '/admin/timetable', text: 'Time Table' },
          { to: '/admin/reports', text: 'Reports' },
          ...commonLinks,
        ];
      case 'faculty':
        return [
          { to: '/faculty/dashboard', text: 'Dashboard' },
          { to: '/faculty/timetable', text: 'Time Table' },
          { to: '/faculty/reports', text: 'Reports' },
          ...commonLinks,
        ];
      case 'student':
        return [
          { to: '/student/dashboard', text: 'Dashboard' },
          { to: '/student/timetable', text: 'Time Table' },
          { to: '/student/reports', text: 'Reports' },
          ...commonLinks,
        ];
      case 'parent':
        return [
          { to: '/parent/dashboard', text: 'Dashboard' },
          { to: '/parent/reports', text: 'Reports' },
          ...commonLinks,
        ];
      default:
        return [];
    }
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        {/* Menu Icon */}
        <IconButton
          color="inherit"
          edge="start"
          onClick={() => setIsOpen(!isOpen)}
          sx={{ mr: 2, display: { xs: 'block', sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
        
        {/* ATTENDEASE Logo */}
        <Typography
          variant="h6"
          component="div"
          sx={{
            flexGrow: 1,
            fontWeight: 'bold',
            color: '#006400', // dark green
            letterSpacing: 1.2,
            fontSize: '1.5rem'
          }}
        >
          ATTENDEASE
        </Typography>
        
        {/* User section */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body1" sx={{ mr: 1 }}>
            {user?.name || ''}
          </Typography>
          <Avatar 
            sx={{ 
              bgcolor: user?.role === 'admin' ? 'secondary.main' : 'primary.main'
            }}
          >
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </Avatar>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 