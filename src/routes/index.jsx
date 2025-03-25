import { Navigate } from 'react-router-dom';
import AdminDashboard from '../components/dashboard/AdminDashboard';
import FacultyDashboard from '../components/dashboard/FacultyDashboard';
import StudentDashboard from '../components/dashboard/StudentDashboard';
import ParentDashboard from '../components/dashboard/ParentDashboard';
import EventsManagement from '../components/admin/EventsManagement';
import TimetableManagement from '../components/admin/TimetableManagement';
import ReportsManagement from '../components/admin/ReportsManagement';
import Login from '../components/auth/Login';
import { authService } from '../services/api';

// Protected Route wrapper component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const user = authService.getCurrentUser();

  if (!user) {
    // Not logged in, redirect to login page
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Role not authorized, redirect to appropriate dashboard
    const dashboardRoutes = {
      admin: '/admin',
      faculty: '/faculty',
      student: '/student',
      parent: '/parent'
    };
    return <Navigate to={dashboardRoutes[user.role]} replace />;
  }

  return children;
};

// Public Route wrapper component
const PublicRoute = ({ children }) => {
  const user = authService.getCurrentUser();

  if (user) {
    // Already logged in, redirect to appropriate dashboard
    const dashboardRoutes = {
      admin: '/admin',
      faculty: '/faculty',
      student: '/student',
      parent: '/parent'
    };
    return <Navigate to={dashboardRoutes[user.role]} replace />;
  }

  return children;
};

// Route configurations
const routes = [
  {
    path: '/',
    element: <Navigate to="/login" replace />
  },
  {
    path: '/login',
    element: (
      <PublicRoute>
        <Login />
      </PublicRoute>
    )
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminDashboard />
      </ProtectedRoute>
    )
  },
  {
    path: '/admin/events',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <EventsManagement />
      </ProtectedRoute>
    )
  },
  {
    path: '/admin/timetable',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <TimetableManagement />
      </ProtectedRoute>
    )
  },
  {
    path: '/admin/reports',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <ReportsManagement />
      </ProtectedRoute>
    )
  },
  {
    path: '/admin/profile',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminProfile />
      </ProtectedRoute>
    )
  },
  {
    path: '/faculty/*',
    element: (
      <ProtectedRoute allowedRoles={['faculty']}>
        <FacultyDashboard />
      </ProtectedRoute>
    ),
    children: [
      // Add nested faculty routes here
    ]
  },
  {
    path: '/student/*',
    element: (
      <ProtectedRoute allowedRoles={['student']}>
        <StudentDashboard />
      </ProtectedRoute>
    ),
    children: [
      // Add nested student routes here
    ]
  },
  {
    path: '/parent/*',
    element: (
      <ProtectedRoute allowedRoles={['parent']}>
        <ParentDashboard />
      </ProtectedRoute>
    ),
    children: [
      // Add nested parent routes here
    ]
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />
  }
];

export default routes;