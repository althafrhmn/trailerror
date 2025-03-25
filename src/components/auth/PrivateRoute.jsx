import { Navigate } from 'react-router-dom';
import { authService } from '../../services/api';

const PrivateRoute = ({ children, allowedRoles }) => {
  const user = authService.getCurrentUser();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // If user's role is not in the allowed roles, redirect to their appropriate dashboard
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const dashboardRoutes = {
      admin: '/admin/dashboard',
      faculty: '/faculty/dashboard',
      student: '/student/dashboard',
      parent: '/parent/dashboard',
    };
    return <Navigate to={dashboardRoutes[user.role]} replace />;
  }

  // If children is a function, call it with the user
  if (typeof children === 'function') {
    return children({ user });
  }

  return children;
};

export default PrivateRoute; 