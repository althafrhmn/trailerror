import React from 'react';
import { AppBar, Toolbar, IconButton, Typography, Box } from '@mui/material';
import { MenuIcon, AccountCircle } from '@mui/icons-material';

const Header = ({ onMenuToggle, user, handleAccountMenuOpen }) => {
  return (
    <AppBar position="static" sx={{ boxShadow: 2 }}>
      <Toolbar>
        {/* Menu toggle button (for mobile) */}
        <IconButton
          color="inherit"
          edge="start"
          onClick={onMenuToggle}
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
        
        {/* User info and actions */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography sx={{ mr: 1 }}>{user?.name || ''}</Typography>
          <IconButton
            color="inherit"
            onClick={handleAccountMenuOpen}
          >
            <AccountCircle />
          </IconButton>
        </Box>
        
        {/* Account menu */}
        {/* ... existing account menu ... */}
      </Toolbar>
    </AppBar>
  );
};

export default Header; 