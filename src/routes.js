import { Navigate } from 'react-router-dom';
import FacultyLayout from './components/layouts/FacultyLayout';
import StudentLayout from './components/layouts/StudentLayout';
import AuthLayout from './components/layouts/AuthLayout';

// Auth pages
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';

// Faculty pages
import FacultyDashboard from './pages/faculty/Dashboard';
import Attendance from './components/faculty/Attendance';
import FacultyMessages from './pages/faculty/Messages';

// Student pages
import StudentDashboard from './pages/student/Dashboard';
import StudentMessages from './pages/student/Messages';

// Common pages
import NotFound from './pages/NotFound';
import ProfilePage from './pages/Profile';

const routes = [
  {
    path: '/',
    element: <Navigate to="/login" replace />
  },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        element: <Login />
      },
      {
        path: 'register',
        element: <Register />
      },
      {
        path: 'forgot-password',
        element: <ForgotPassword />
      }
    ]
  },
  {
    path: '/faculty',
    element: <FacultyLayout />,
    children: [
      {
        path: 'dashboard',
        element: <FacultyDashboard />
      },
      {
        path: 'attendance',
        element: <Attendance />
      },
      {
        path: 'messages',
        element: <FacultyMessages />
      },
      {
        path: 'profile',
        element: <ProfilePage />
      }
    ]
  },
  {
    path: '/student',
    element: <StudentLayout />,
    children: [
      {
        path: 'dashboard',
        element: <StudentDashboard />
      },
      {
        path: 'messages',
        element: <StudentMessages />
      },
      {
        path: 'profile',
        element: <ProfilePage />
      }
    ]
  },
  {
    path: '*',
    element: <NotFound />
  }
];

export default routes; 