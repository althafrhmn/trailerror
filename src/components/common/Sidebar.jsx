import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Box,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Event as EventIcon,
  Message as MessageIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  CalendarToday as CalendarIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  DateRange as LeaveIcon,
  EventNote as EventNoteIcon,
  Class as ClassIcon,
  Assessment as AssessmentIcon,
  ListAlt as ListAltIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme as useCustomTheme } from '../../contexts/ThemeContext';
import { toast } from 'react-hot-toast';

const drawerWidth = 240;

const Sidebar = () => {
  const theme = useTheme();
  const { isDarkMode, toggleTheme } = useCustomTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(false);

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Error logging out');
    }
  };

  const getMenuItems = () => {
    switch (user.role) {
      case 'faculty':
        return [
          {
            text: 'Dashboard',
            icon: <DashboardIcon />,
            path: '/faculty/dashboard'
          },
          {
            text: 'Attendance',
            icon: <AssignmentIcon />,
            path: '/faculty/attendance'
          },
          {
            text: 'Leave Requests',
            icon: <ListAltIcon />,
            path: '/faculty/leave-requests'
          },
          {
            text: 'Messages',
            icon: <MessageIcon />,
            path: '/faculty/messages'
          },
          {
            text: 'Profile',
            icon: <PersonIcon />,
            path: '/faculty/profile'
          }
        ];
      case 'student':
        return [
          {
            text: 'Dashboard',
            icon: <DashboardIcon />,
            path: '/student/dashboard'
          },
          {
            text: 'Messages',
            icon: <MessageIcon />,
            path: '/student/messages'
          },
          {
            text: 'Profile',
            icon: <PersonIcon />,
            path: '/student/profile'
          }
        ];
      default:
        return [
          {
            text: 'Login',
            icon: <LogoutIcon />,
            path: '/login'
          }
        ];
    }
  };

  const menuItems = getMenuItems();

  const drawer = (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        p: 2,
        bgcolor: 'primary.main',
        color: 'white'
      }}>
        <Typography variant="h6" noWrap component="div">
          ATT Portal
        </Typography>
        {isMobile && (
          <IconButton onClick={handleDrawerToggle} sx={{ color: 'white' }}>
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Box>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem 
            button 
            key={item.text} 
            onClick={() => {
              navigate(item.path);
              if (isMobile) setOpen(false);
            }}
            selected={location.pathname === item.path}
            sx={{
              '&.Mui-selected': {
                bgcolor: 'action.selected',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              },
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
      <Divider />
      {user && (
        <List>
          <ListItem button onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItem>
        </List>
      )}
    </Box>
  );

  return (
    <>
      {isMobile && (
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ mr: 2, display: { md: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
      )}
      
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={open}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile
            }}
            sx={{
              display: { xs: 'block', md: 'none' },
              '& .MuiDrawer-paper': { 
                boxSizing: 'border-box', 
                width: drawerWidth 
              },
            }}
          >
            {drawer}
          </Drawer>
        ) : (
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', md: 'block' },
              '& .MuiDrawer-paper': { 
                boxSizing: 'border-box', 
                width: drawerWidth 
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        )}
      </Box>
    </>
  );
};

export default Sidebar; 