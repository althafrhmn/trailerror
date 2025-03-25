import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Validate form inputs
      if (!formData.email || !formData.password) {
        throw new Error('Email and password are required');
      }
      
      try {
        // Try real API login first
        const response = await axios.post('http://localhost:5000/api/auth/login', formData, {
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
        const demoResult = demoLogin(formData.email, formData.password);
        
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
          throw new Error(demoResult.message || 'Invalid email or password');
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
  const demoLogin = (email, password) => {
    // Mock user accounts for demonstration
    const mockUsers = [
      {
        _id: 'admin-1',
        email: 'admin@example.com',
        password: 'password',
        name: 'Admin User',
        role: 'admin'
      },
      {
        _id: 'faculty-1',
        email: 'faculty@example.com',
        password: 'password',
        name: 'John Smith',
        role: 'faculty',
        department: 'Computer Science'
      },
      {
        _id: 'student-1',
        email: 'student@example.com',
        password: 'password',
        name: 'Mary Johnson',
        role: 'student'
      }
    ];

    // Find matching user
    const user = mockUsers.find(u => u.email === email && u.password === password);
    
    if (!user) {
      return {
        success: false,
        message: 'Invalid email or password'
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