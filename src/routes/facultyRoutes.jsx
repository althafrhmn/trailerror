import React from 'react';
import { Route } from 'react-router-dom';
import Attendance from '../components/faculty/Attendance';
import FacultyDashboard from '../components/faculty/FacultyDashboard';
import Messages from '../components/messages/Messages';
import Profile from '../components/Profile';
import TimetableManagement from '../components/admin/TimetableManagement';

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
  {
    path: '/faculty/timetable',
    element: <TimetableManagement />,
  },
];

export default facultyRoutes; 