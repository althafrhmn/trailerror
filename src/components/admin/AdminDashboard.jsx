import React from 'react';
import { Typography } from '@mui/material';

const AdminDashboard = () => {
  return (
    <div>
      {/* If there's a header section, add the ATTENDEASE branding: */}
      <Typography
        variant="h6" 
        component="div" 
        sx={{ 
          fontWeight: 'bold',
          color: '#006400', // dark green
          letterSpacing: 1.2,
          fontSize: '1.5rem',
          marginBottom: 2
        }}
      >
        ATTENDEASE
      </Typography>
    </div>
  );
};

export default AdminDashboard; 