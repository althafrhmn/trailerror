import React from 'react';
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';

const DashboardCard = ({ title, value, description }) => (
  <Card className="h-full">
    <CardContent>
      <Typography variant="h6" component="div" className="mb-2">
        {title}
      </Typography>
      <Typography variant="h4" component="div" className="mb-2 text-primary font-bold">
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  // This will be replaced with actual data from the backend
  const dashboardData = {
    totalAttendance: '85%',
    totalClasses: '120',
    pendingLeaves: '2',
    upcomingEvents: '3',
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" className="mb-6">
        Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title="Overall Attendance"
            value={dashboardData.totalAttendance}
            description="Your current attendance percentage"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title="Total Classes"
            value={dashboardData.totalClasses}
            description="Number of classes this semester"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title="Pending Leaves"
            value={dashboardData.pendingLeaves}
            description="Leave requests awaiting approval"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title="Upcoming Events"
            value={dashboardData.upcomingEvents}
            description="Events in the next 7 days"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 