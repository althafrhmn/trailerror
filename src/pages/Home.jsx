import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from '../components/Calendar';

const Home = () => {
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  useEffect(() => {
    // Check authentication and redirect based on role
    if (isAuthenticated) {
      if (userRole === 'admin') {
        navigate('/admin/dashboard');
      } else if (userRole === 'user') {
        navigate('/user/dashboard');
      }
    } else {
      navigate('/login');
    }
  }, [isAuthenticated, userRole, navigate]);

  // Only show calendar if authenticated
  return (
    <div className="home-container">
      {isAuthenticated ? (
        <>
          <h1>Welcome to Attendease</h1>
          <Calendar />
        </>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
};

export default Home;