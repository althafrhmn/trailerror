import { useState, useMemo, useCallback, memo } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Fade,
  Badge,
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
  People as PeopleIcon,
  CalendarToday as CalendarTodayIcon,
  Assignment as AssignmentIcon,
  Notifications as NotificationsIcon,
  AccountCircle,
  EventNote as EventNoteIcon,
} from '@mui/icons-material';
import { Outlet, useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';
import logo from '../../assets/logoo.png';

const drawerWidth = 240;

// Memoize ListItem to prevent unnecessary re-renders
const MenuItem = memo(({ item, onClick }) => (
  <Fade in timeout={500}>
    <ListItem
      onClick={onClick}
      sx={{ 
        cursor: 'pointer',
        borderRadius: 1,
        m: 0.5,
        transition: 'all 0.3s ease',
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          transform: 'translateX(8px)',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        },
        '&.Mui-selected': {
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
        },
        '&:active': {
          transform: 'translateX(4px)',
        },
      }}
    >
      <ListItemIcon 
        sx={{ 
          color: 'inherit', 
          minWidth: 40,
          transition: 'transform 0.2s ease',
          '& svg': {
            transition: 'transform 0.2s ease',
          },
          '.MuiListItem-root:hover &': {
            transform: 'scale(1.1)',
          }
        }}
      >
        {item.icon}
      </ListItemIcon>
      <ListItemText 
        primary={item.text} 
        sx={{ 
          '& .MuiListItemText-primary': { 
            fontWeight: 500,
            fontSize: '0.95rem',
            transition: 'color 0.2s ease',
          },
          '.MuiListItem-root:hover &': {
            color: 'rgba(255, 255, 255, 0.95)',
          }
        }} 
      />
    </ListItem>
  </Fade>
));

const Layout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const theme = useTheme();
  const navigate = useNavigate();
  const user = useMemo(() => authService.getCurrentUser(), []);

  const handleDrawerToggle = useCallback(() => {
    setMobileOpen(prev => !prev);
  }, []);

  const handleAdminMenuToggle = useCallback(() => {
    setAdminMenuOpen(prev => !prev);
  }, []);

  const handleLogout = useCallback(() => {
    setLogoutDialogOpen(true);
  }, []);

  const handleLogoutConfirm = useCallback(() => {
    authService.logout();
    setLogoutDialogOpen(false);
    navigate('/');
  }, [navigate]);

  const handleLogoutCancel = useCallback(() => {
    setLogoutDialogOpen(false);
  }, []);

  const menuItems = useMemo(() => {
    const items = {
      admin: [
        { text: 'Dashboard', path: '/admin/dashboard', icon: <DashboardIcon /> },
        { text: 'Users', path: '/admin/users', icon: <PeopleIcon /> },
        { text: 'Reports', path: '/admin/reports', icon: <AssessmentIcon /> },
      ],
      faculty: [
        { text: 'Dashboard', path: '/faculty/dashboard', icon: <DashboardIcon /> },
        { text: 'Attendance', path: '/faculty/attendance', icon: <AssignmentIcon /> },
        { text: 'Timetable', path: '/faculty/timetable', icon: <CalendarTodayIcon /> },
        { text: 'Reports', path: '/faculty/reports', icon: <AssessmentIcon /> },
      ],
      student: [
        { text: 'Dashboard', path: '/student/dashboard', icon: <DashboardIcon /> },
        { text: 'Timetable', path: '/student/timetable', icon: <CalendarTodayIcon /> },
        { text: 'Attendance', path: '/student/attendance', icon: <AssignmentIcon /> },
        { text: 'Leave Application', path: '/student/leave-application', icon: <EventNoteIcon /> },
      ],
      parent: [
        { text: 'Dashboard', path: '/parent/dashboard', icon: <DashboardIcon /> },
        { text: 'Attendance', path: '/parent/attendance', icon: <AssignmentIcon /> },
        { text: 'Reports', path: '/parent/reports', icon: <AssessmentIcon /> },
      ],
    };

    return items[user?.role] || [];
  }, [user?.role]);

  const handleNavigate = useCallback((path) => () => {
    navigate(path);
    setMobileOpen(false);
  }, [navigate]);

  const drawer = useMemo(() => (
    <Box>
      <Toolbar 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
          transition: 'background-color 0.3s ease',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
          }
        }}
      >
        <Typography 
          variant="h6" 
          sx={{ 
            color: '#006400', // Dark green color
            fontWeight: 'bold',
            letterSpacing: 1.2,
            fontSize: '1.5rem',
            transition: 'transform 0.3s ease',
            '&:hover': {
              transform: 'scale(1.02)',
            }
          }}
        >
          ATTENDEASE
        </Typography>
      </Toolbar>
      <List sx={{ pt: 2 }}>
        {menuItems.map((item, index) => (
          <MenuItem
            key={item.text}
            item={item}
            onClick={handleNavigate(item.path)}
          />
        ))}
        <Box sx={{ mt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.12)', pt: 2 }}>
          <MenuItem
            item={{ text: 'Logout', icon: <LogoutIcon /> }}
            onClick={handleLogout}
          />
        </Box>
      </List>
    </Box>
  ), [menuItems, handleNavigate, handleLogout]);

  const adminMenuItems = useMemo(() => [
    { text: 'Dashboard', path: '/admin/dashboard', icon: <DashboardIcon /> },
    { text: 'Manage Users', path: '/admin/users', icon: <PeopleIcon /> },
    { text: 'Events', path: '/admin/events', icon: <EventIcon /> },
    { text: 'Reports', path: '/admin/reports', icon: <AssessmentIcon /> },
    { text: 'Messages', path: '/admin/messages', icon: <MessageIcon /> },
    { text: 'Profile', path: '/admin/profile', icon: <PersonIcon /> },
  ], []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          ...(mobileOpen && {
            marginLeft: drawerWidth,
            width: `calc(100% - ${drawerWidth}px)`,
            transition: theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }),
          backgroundColor: theme.palette.primary.main,
          boxShadow: 3,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerToggle}
            edge="start"
            sx={{
              marginRight: 2,
              ...(mobileOpen && { display: 'none' }),
              display: { sm: 'none' }
            }}
          >
            <MenuIcon />
          </IconButton>

          {user?.role === 'admin' && (
            <IconButton
              color="inherit"
              aria-label="open admin menu"
              onClick={handleAdminMenuToggle}
              sx={{
                marginRight: 2,
                display: 'flex',
              }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Box 
            component="img" 
            src={logo} 
            alt="Logo"
            sx={{ 
              height: 40,
              mr: 2,
              display: { xs: 'none', sm: 'block' }
            }}
          />
          <Typography 
            variant="h6" 
            noWrap 
            component="div" 
            sx={{ 
              flexGrow: 1, 
              color: '#006400', // Dark green color
              fontWeight: 'bold',
              letterSpacing: 1.2,
              fontSize: '1.5rem'
            }}
          >
            ATTENDEASE
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
            <IconButton size="large" color="inherit">
              <Badge badgeContent={4} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            <IconButton
              size="large"
              edge="end"
              aria-label="account of current user"
              onClick={handleLogout}
              color="inherit"
            >
              <AccountCircle />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              backgroundColor: theme.palette.primary.main,
              color: 'white',
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
              boxSizing: 'border-box',
              width: drawerWidth,
              backgroundColor: theme.palette.primary.main,
              color: 'white',
              borderRight: '1px solid rgba(255, 255, 255, 0.12)',
            },
          }}
          open
        >
          {drawer}
        </Drawer>

        {user?.role === 'admin' && (
          <Drawer
            variant="temporary"
            anchor="left"
            open={adminMenuOpen}
            onClose={handleAdminMenuToggle}
            ModalProps={{
              keepMounted: true,
            }}
            sx={{
              '& .MuiDrawer-paper': {
                width: 280,
                backgroundColor: theme.palette.primary.main,
                color: 'white',
                boxShadow: '4px 0 10px rgba(0,0,0,0.2)',
                zIndex: theme.zIndex.drawer + 2,
              },
            }}
          >
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ 
                p: 2, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255, 255, 255, 0.12)'
              }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: '#006400',
                    fontWeight: 'bold',
                    letterSpacing: 1.2,
                  }}
                >
                  Admin Menu
                </Typography>
                <IconButton color="inherit" onClick={handleAdminMenuToggle}>
                  <MenuIcon />
                </IconButton>
              </Box>
              
              <List sx={{ pt: 2, px: 1, flex: 1 }}>
                {adminMenuItems.map((item) => (
                  <MenuItem
                    key={item.text}
                    item={item}
                    onClick={() => {
                      navigate(item.path);
                      handleAdminMenuToggle();
                    }}
                  />
                ))}
              </List>
              
              <Box sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.12)' }}>
                <MenuItem
                  item={{ text: 'Logout', icon: <LogoutIcon /> }}
                  onClick={() => {
                    handleAdminMenuToggle();
                    handleLogout();
                  }}
                />
              </Box>
            </Box>
          </Drawer>
        )}
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          mt: '64px',
          backgroundColor: theme.palette.background.default,
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        <Outlet />
      </Box>

      <Dialog
        open={logoutDialogOpen}
        onClose={handleLogoutCancel}
        maxWidth="xs"
        TransitionComponent={Fade}
      >
        <DialogTitle>Confirm Logout</DialogTitle>
        <DialogContent>
          Are you sure you want to log out?
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLogoutCancel}>Cancel</Button>
          <Button onClick={handleLogoutConfirm} color="primary" variant="contained">
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default memo(Layout);