import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CircularProgress, Box, Alert, Button } from '@mui/material';
import { ErrorBoundary } from 'react-error-boundary';
import AttendanceNew from './components/faculty/AttendanceNew';

// Lazy load components
const Login = lazy(() => import('./components/auth/Login'));
const MainLayout = lazy(() => import('./components/common/MainLayout'));
const AdminDashboard = lazy(() => import('./components/dashboard/AdminDashboard'));
const FacultyDashboard = lazy(() => import('./components/dashboard/FacultyDashboard'));
const StudentDashboard = lazy(() => import('./components/dashboard/StudentDashboard'));
const ParentDashboard = lazy(() => import('./components/dashboard/ParentDashboard'));
const TimetableManagement = lazy(() => import('./components/admin/TimetableManagement'));
const Report = lazy(() => import('./components/reports/Report'));
const Profile = lazy(() => import('./components/profile/Profile'));
const UserManagement = lazy(() => import('./components/admin/UserManagement'));
const EventsManagement = lazy(() => import('./components/admin/EventsManagement'));
const Messages = lazy(() => import('./components/messages/Messages'));
const Attendance = lazy(() => import('./components/faculty/Attendance'));
const LeaveApplication = lazy(() => import('./components/student/LeaveApplication'));
const LeaveRequests = lazy(() => import('./components/faculty/LeaveRequests'));

// Loading component
const LoadingScreen = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
    }}
  >
    <CircularProgress />
  </Box>
);

// Error fallback component
const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      p: 3,
    }}
  >
    <Alert severity="error" sx={{ mb: 2 }}>
      Something went wrong: {error.message}
    </Alert>
    <Button variant="contained" onClick={resetErrorBoundary}>
      Try again
    </Button>
  </Box>
);

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    const dashboardRoutes = {
      admin: '/admin/dashboard',
      faculty: '/faculty/dashboard',
      student: '/student/dashboard',
      parent: '/parent/dashboard'
    };
    
    // Redirect to appropriate dashboard based on role
    return <Navigate to={dashboardRoutes[user.role]} replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (user) {
    const dashboardRoutes = {
      admin: '/admin/dashboard',
      faculty: '/faculty/dashboard',
      student: '/student/dashboard',
      parent: '/parent/dashboard'
    };
    
    const redirectPath = dashboardRoutes[user.role] || '/login';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

const App = () => {
  const handleError = (error, info) => {
    console.error('Application Error:', error);
    console.error('Error Info:', info);
  };

  return (
    <ErrorBoundary 
      FallbackComponent={ErrorFallback}
      onError={handleError}
      onReset={() => {
        window.location.reload();
      }}
    >
      <ThemeProvider>
        <AuthProvider>
          <Router future={{ 
            v7_relativeSplatPath: true,
            v7_startTransition: true 
          }}>
            <Toaster 
              position="top-right" 
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#333',
                  color: '#fff',
                },
              }}
            />
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                {/* Public route */}
                <Route
                  path="/login"
                  element={
                    <PublicRoute>
                      <Login />
                    </PublicRoute>
                  }
                />
                
                {/* Protected routes with MainLayout */}
                <Route element={
                  <PrivateRoute>
                    <MainLayout />
                  </PrivateRoute>
                }>
                  {/* Admin routes */}
                  <Route path="/admin">
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="users" element={<UserManagement />} />
                    <Route path="events" element={<EventsManagement />} />
                    <Route path="reports" element={<Report />} />
                    <Route path="messages" element={<Messages />} />
                    <Route path="profile" element={<Profile />} />
                  </Route>

                  {/* Faculty routes */}
                  <Route path="/faculty">
                    <Route path="dashboard" element={<FacultyDashboard />} />
                    <Route path="attendance" element={<AttendanceNew />} />
                    <Route path="timetable" element={<TimetableManagement />} />
                    <Route path="reports" element={<Report />} />
                    <Route path="messages" element={<Messages />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="leave-requests" element={<LeaveRequests />} />
                  </Route>

                  {/* Student routes */}
                  <Route path="/student">
                    <Route path="dashboard" element={<StudentDashboard />} />
                    <Route path="timetable" element={<TimetableManagement />} />
                    <Route path="reports" element={<Report />} />
                    <Route path="messages" element={<Messages />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="leave-application" element={<LeaveApplication />} />
                  </Route>

                  {/* Parent routes */}
                  <Route path="/parent">
                    <Route path="dashboard" element={<ParentDashboard />} />
                    <Route path="reports" element={<Report />} />
                    <Route path="messages" element={<Messages />} />
                    <Route path="profile" element={<Profile />} />
                  </Route>

                  {/* Default redirect */}
                  <Route path="/" element={<Navigate to="/login" replace />} />
                </Route>
              </Routes>
            </Suspense>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
