import React from 'react';
import { Route } from 'react-router-dom';
import Attendance from '../components/faculty/Attendance';
import FacultyDashboard from '../components/faculty/FacultyDashboard';
import Messages from '../components/messages/Messages';
import Profile from '../components/Profile';

const facultyRoutes = [
  {
    path: '/faculty/dashboard',
    element: <FacultyDashboard />,
  },
  {
    path: '/faculty/attendance',
    element: <Attendance />,
  },
  {
    path: '/faculty/messages',
    element: <Messages />,
  },
  {
    path: '/faculty/profile',
    element: <Profile />,
  },
];

export default facultyRoutes; 