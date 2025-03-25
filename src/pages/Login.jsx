import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const Login = () => {
  const [formData, setFormData] = useState({ 
    username: '', 
    password: '',
    role: 'student' // Default role
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Validate form inputs
      if (!formData.username || !formData.password || !formData.role) {
        throw new Error('Username, password, and role are required');
      }
      
      try {
        // Try real API login first
        const response = await axios.post('http://localhost:5001/api/auth/login', formData, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 8000
        });
        
        if (!response || !response.data) {
          throw new Error('Invalid response from server');
        }
        
        if (response.data.success === false) {
          throw new Error(response.data.message || 'Login failed');
        }
        
        const { token, user } = response.data;
        
        if (!token || !user) {
          throw new Error('Invalid authentication data received');
        }
        
        // Store user data and token
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.removeItem('useDemoMode');
        
        // Redirect based on user role
        const redirectPath = userRoleRedirect[user.role] || '/';
        navigate(redirectPath);
        
        toast.success('Login successful!');
      } catch (apiError) {
        console.warn('API login failed, trying demo login:', apiError);
        
        // If server login fails, try demo login
        const demoResult = demoLogin(formData.username, formData.password);
        
        if (demoResult.success) {
          toast.success('Logged in with demo account. Some features limited.', {
            icon: '🔔',
            style: {
              border: '1px solid #3498db',
              padding: '16px',
              color: '#3498db',
            },
            duration: 5000
          });
          
          // Redirect based on user role
          const redirectPath = userRoleRedirect[demoResult.user.role] || '/';
          navigate(redirectPath);
        } else {
          throw new Error(demoResult.message || 'Invalid username or password');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Add this mock login function near the top of the file after the imports
  const demoLogin = (username, password) => {
    // Mock user accounts for demonstration
    const mockUsers = [
      {
        _id: 'admin-1',
        username: 'admin',
        email: 'admin@example.com',
        password: 'password',
        name: 'Admin User',
        role: 'admin'
      },
      {
        _id: 'faculty-1',
        username: 'faculty',
        email: 'faculty@example.com',
        password: 'password',
        name: 'John Smith',
        role: 'faculty',
        department: 'Computer Science'
      },
      {
        _id: 'student-1',
        username: 'student',
        email: 'student@example.com',
        password: 'password',
        name: 'Mary Johnson',
        role: 'student'
      }
    ];

    // Find matching user by username or email
    const user = mockUsers.find(u => 
      (u.username === username || u.email === username) && 
      u.password === password
    );
    
    if (!user) {
      return {
        success: false,
        message: 'Invalid username or password'
      };
    }

    // Create a demo token (don't do this in production!)
    const token = `mock-token-${user.role}-${Date.now()}`;
    
    // Clone user object without password for security
    const { password: _, ...userWithoutPassword } = user;
    
    // Set localStorage items
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userWithoutPassword));
    localStorage.setItem('useDemoMode', 'true');
    
    return {
      success: true,
      user: userWithoutPassword,
      token,
      message: 'Logged in with demo account'
    };
  };

  return (
    <div>
      {/* Render your form here */}
    </div>
  );
};

export default Login; 