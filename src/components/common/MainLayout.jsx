import { useState, useMemo, Suspense, useCallback } from 'react';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
  Divider,
  CircularProgress,
  Alert,
  Button,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  ExitToApp as LogoutIcon,
  EventNote as AttendanceIcon,
  Email as MessageIcon,
  Group as GroupIcon,
  Event as EventIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../../services/api';
import logo from '../../assets/logoo.png';
import { ErrorBoundary } from 'react-error-boundary';

const drawerWidth = 240;

// Loading fallback component
const LoadingFallback = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
    }}
  >
    <CircularProgress />
  </Box>
);

// Error fallback component
const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      p: 3,
    }}
  >
    <Alert severity="error" sx={{ mb: 2 }}>
      Something went wrong: {error.message}
    </Alert>
    <Button variant="contained" onClick={resetErrorBoundary}>
      Try again
    </Button>
  </Box>
);

const MainLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [error, setError] = useState(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useMemo(() => {
    try {
      return authService.getCurrentUser();
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  const handleDrawerToggle = useCallback(() => {
    setMobileOpen(prev => !prev);
  }, []);

  const handleLogoutClick = useCallback(() => {
    setLogoutDialogOpen(true);
  }, []);

  const handleLogoutCancel = useCallback(() => {
    setLogoutDialogOpen(false);
  }, []);

  const handleLogoutConfirm = useCallback(async () => {
    try {
      await authService.logout();
      navigate('/login');
    } catch (err) {
      setError('Failed to logout. Please try again.');
    } finally {
      setLogoutDialogOpen(false);
    }
  }, [navigate]);

  const getMenuItems = useCallback(() => {
    if (!user?.role) return [];

    const baseItems = [
      { text: 'Dashboard', icon: <DashboardIcon />, path: `/${user.role}/dashboard` },
    ];

    const roleSpecificItems = {
      admin: [
        { text: 'Manage Users', icon: <GroupIcon />, path: '/admin/users' },
        { text: 'Events', icon: <EventIcon />, path: '/admin/events' },
        { text: 'Reports', icon: <AssessmentIcon />, path: '/admin/reports' },
        { text: 'Messages', icon: <MessageIcon />, path: '/admin/messages' },
      ],
      faculty: [
        { text: 'Reports', icon: <AssessmentIcon />, path: '/faculty/reports' },
        { text: 'Messages', icon: <MessageIcon />, path: '/faculty/messages' },
      ],
      student: [
        { text: 'Timetable', icon: <EventIcon />, path: '/student/timetable' },
        { text: 'Reports', icon: <AssessmentIcon />, path: '/student/reports' },
        { text: 'Messages', icon: <MessageIcon />, path: '/student/messages' },
      ],
      parent: [
        { text: 'Reports', icon: <AssessmentIcon />, path: '/parent/reports' },
        { text: 'Messages', icon: <MessageIcon />, path: '/parent/messages' },
      ],
    };

    const commonItems = [
      { text: 'Profile', icon: <PersonIcon />, path: `/${user.role}/profile` },
    ];

    return [
      ...baseItems,
      ...(roleSpecificItems[user.role] || []),
      ...commonItems,
    ];
  }, [user?.role]);

  const menuItems = useMemo(() => getMenuItems(), [getMenuItems]);

  const handleNavigation = useCallback((path) => {
    navigate(path);
    setMobileOpen(false);
  }, [navigate]);

  const drawer = useMemo(() => (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: '#ffffff',
    }}>
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center', 
        height: { xs: '64px', sm: '70px' },
        borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
      }}>
        <Box 
          component="img" 
          src={logo} 
          alt="Logo"
          sx={{ 
            height: 40,
            cursor: 'pointer',
            transition: 'transform 0.2s',
            '&:hover': {
              transform: 'scale(1.05)',
            },
          }}
          onClick={() => handleNavigation(`/${user?.role}/dashboard`)}
        />
      </Box>

      <List sx={{ 
        flex: 1, 
        py: 3,
        px: 2,
        '& .MuiListItem-root': {
          mb: 1,
          borderRadius: 1,
        }
      }}>
        {menuItems.map((item) => (
          <ListItem
            key={item.text}
            button
            onClick={() => handleNavigation(item.path)}
            selected={location.pathname === item.path}
            sx={{
              py: 1,
              '&.Mui-selected': {
                bgcolor: 'primary.main',
                color: 'white',
                '& .MuiListItemIcon-root': {
                  color: 'white',
                },
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
              },
              '&:hover': {
                bgcolor: 'action.hover',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            <ListItemIcon sx={{ 
              minWidth: 40,
              color: location.pathname === item.path ? 'white' : 'primary.main',
            }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text}
              primaryTypographyProps={{
                fontSize: '0.95rem',
                fontWeight: location.pathname === item.path ? 600 : 500,
              }}
            />
          </ListItem>
        ))}
      </List>

      <Box sx={{ 
        p: 2, 
        borderTop: '1px solid rgba(0, 0, 0, 0.06)'
      }}>
        <ListItem 
          button 
          onClick={handleLogoutClick}
          sx={{
            borderRadius: 1,
            py: 1,
            '&:hover': {
              bgcolor: 'error.light',
              color: 'white',
              '& .MuiListItemIcon-root': {
                color: 'white',
              },
            },
            transition: 'all 0.2s ease-in-out',
          }}
        >
          <ListItemIcon sx={{ 
            minWidth: 40,
            color: 'error.main',
          }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Logout"
            primaryTypographyProps={{
              fontSize: '0.95rem',
              fontWeight: 500,
            }}
          />
        </ListItem>
      </Box>
    </Box>
  ), [menuItems, location.pathname, handleNavigation, handleLogoutClick, user?.role]);

  if (error) {
    return <ErrorFallback error={{ message: error }} resetErrorBoundary={() => setError(null)} />;
  }

  const handleError = (error, info) => {
    console.error('Layout Error:', error);
    console.error('Error Info:', info);
    setError(error.message);
  };

  const getCurrentPageTitle = () => {
    const currentItem = menuItems.find(item => item.path === location.pathname);
    return currentItem?.text || 'Welcome';
  };

  return (
    <ErrorBoundary 
      FallbackComponent={ErrorFallback}
      onError={handleError}
      onReset={() => setError(null)}
    >
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
        <CssBaseline />
        <AppBar
          position="fixed"
          sx={{
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            ml: { sm: `${drawerWidth}px` },
            bgcolor: '#ffffff',
            color: 'text.primary',
            boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.05)',
            zIndex: (theme) => theme.zIndex.drawer + 1,
          }}
        >
          <Toolbar sx={{ justifyContent: 'space-between', minHeight: { xs: '64px', sm: '70px' } }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2, display: { sm: 'none' } }}
              >
                <MenuIcon />
              </IconButton>
              <Typography
                variant="h6"
                component="div"
                sx={{
                  flexGrow: 1,
                  fontWeight: 'bold',
                  color: '#006400',
                  letterSpacing: 1.2,
                  fontSize: '1.5rem'
                }}
              >
                ATTENDEASE
              </Typography>
            </Box>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2
            }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                {user?.name}
              </Typography>
              <Avatar
                sx={{ 
                  bgcolor: 'primary.main',
                  cursor: 'pointer',
                  width: 40,
                  height: 40,
                  '&:hover': {
                    bgcolor: 'primary.dark',
                    transform: 'scale(1.05)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
                onClick={() => handleNavigation(`/${user?.role}/profile`)}
              >
                {user?.name?.charAt(0) || <PersonIcon />}
              </Avatar>
            </Box>
          </Toolbar>
        </AppBar>

        <Box
          component="nav"
          sx={{ 
            width: { sm: drawerWidth }, 
            flexShrink: { sm: 0 },
          }}
        >
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': { 
                width: drawerWidth,
                bgcolor: '#ffffff',
                boxSizing: 'border-box',
                boxShadow: '2px 0 8px rgba(0,0,0,0.05)',
              },
            }}
          >
            {drawer}
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', sm: 'block' },
              '& .MuiDrawer-paper': { 
                width: drawerWidth,
                bgcolor: '#ffffff',
                boxSizing: 'border-box',
                boxShadow: '2px 0 8px rgba(0,0,0,0.05)',
                border: 'none',
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            minHeight: '100vh',
            pt: { xs: '64px', sm: '90px' },
            px: { xs: 2, sm: 4, md: 5 },
            pb: { xs: 3, sm: 5 },
            bgcolor: '#f5f5f5',
            overflow: 'auto',
          }}
        >
          <Box sx={{ 
            maxWidth: '1400px', 
            mx: 'auto',
            width: '100%',
          }}>
            <Suspense fallback={<LoadingFallback />}>
              <Outlet />
            </Suspense>
          </Box>
        </Box>

        {/* Logout Confirmation Dialog */}
        <Dialog
          open={logoutDialogOpen}
          onClose={handleLogoutCancel}
          maxWidth="xs"
          fullWidth
          PaperProps={{
            elevation: 2,
            sx: { borderRadius: 2 }
          }}
        >
          <DialogTitle sx={{ 
            pb: 2,
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}>
            Confirm Logout
          </DialogTitle>
          <DialogContent sx={{ py: 3 }}>
            <Typography>
              Are you sure you want to logout?
            </Typography>
          </DialogContent>
          <DialogActions sx={{ 
            p: 2,
            borderTop: '1px solid',
            borderColor: 'divider'
          }}>
            <Button
              onClick={handleLogoutCancel}
              variant="outlined"
              color="inherit"
            >
              Cancel
            </Button>
            <Button
              onClick={handleLogoutConfirm}
              variant="contained"
              color="error"
              startIcon={<LogoutIcon />}
            >
              Logout
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ErrorBoundary>
  );
};

export default MainLayout; 