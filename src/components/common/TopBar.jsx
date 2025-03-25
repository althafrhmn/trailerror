import React from 'react';
import { AppBar, Toolbar, IconButton, Typography, Box } from '@mui/material';
import { MenuIcon, AccountCircle } from '@mui/icons-material';

const TopBar = ({ onDrawerToggle, user, avatar, onProfileClick }) => {
  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onDrawerToggle}
          sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
        
        {/* ATTENDEASE branding */}
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
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* User name */}
          <Typography variant="body1" sx={{ mr: 2 }}>
            {user?.name || ''}
          </Typography>
          
          {/* User avatar/icon */}
          {avatar || (
            <IconButton color="inherit" onClick={onProfileClick}>
              <AccountCircle />
            </IconButton>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default TopBar; 