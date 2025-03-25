import axiosInstance from './axiosConfig';

// Add this fallback login function to handle server errors
const demoLogin = (credentials) => {
  // Demo user accounts for when server is unreachable
  const demoUsers = [
    {
      _id: 'admin-1',
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123',
      name: 'Admin User',
      role: 'admin'
    },
    {
      _id: 'faculty-1',
      username: 'faculty',
      email: 'faculty@example.com',
      password: 'faculty123',
      name: 'John Smith',
      role: 'faculty',
      department: 'Computer Science'
    },
    {
      _id: 'student-1',
      username: 'student',
      email: 'student@example.com',
      password: 'student123',
      name: 'Mary Johnson',
      role: 'student'
    }
  ];

  // Find user by username/email and password
  const user = demoUsers.find(u => 
    (u.username === credentials.username || u.email === credentials.username) && 
    u.password === credentials.password
  );

  if (!user) {
    return {
      success: false,
      error: 'Invalid username or password'
    };
  }

  // Create demo token
  const token = `demo-token-${user.role}-${Date.now()}`;
  
  // Remove password for security
  const { password, ...userWithoutPassword } = user;
  
  // Store auth data
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(userWithoutPassword));
  localStorage.setItem('useDemoMode', 'true');
  
  // Return success with user data
  return {
    success: true,
    token,
    user: userWithoutPassword,
    demoMode: true
  };
};

// Update the login function to use demo fallback
const login = async (credentials) => {
  try {
    const response = await axiosInstance.post('/auth/login', credentials);
    
    if (!response || !response.data) {
      throw new Error('Invalid response from server');
    }
    
    const { token, user } = response.data;
    
    if (!token || !user) {
      throw new Error('Invalid authentication data');
    }
    
    // Store auth data
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.removeItem('useDemoMode');
    
    return {
      success: true,
      token,
      user
    };
  } catch (error) {
    console.warn('API login failed, trying demo mode:', error);
    
    // If server error, try demo login
    if (error.message === 'Network Error' || 
        error.code === 'ECONNABORTED' || 
        error.message.includes('timeout') ||
        error.message === 'Invalid response from server') {
      
      toast('Server connection failed. Using demo mode.', {
        icon: '🔔',
        style: {
          border: '1px solid #3498db',
          padding: '16px',
          color: '#3498db',
        },
        duration: 5000
      });
      
      return demoLogin(credentials);
    }
    
    // If it's a regular auth error (not a server issue), pass it through
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Authentication failed'
    };
  }
};

// Export the functions
export {
  login,
  demoLogin
};