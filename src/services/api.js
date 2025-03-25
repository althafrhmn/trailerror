import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable credentials for CORS
});

// Add token to requests if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // If no token is found and the request is to a protected route, reject it
      if (config.url.includes('/users') || 
          config.url.includes('/events') || 
          config.url.includes('/messages') || 
          config.url.includes('/attendance')) {
        // Redirect to login for auth issues on protected routes
        console.warn('Protected route access attempted without auth token');
        setTimeout(() => {
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }, 500);
        return Promise.reject({ message: 'Authentication required' });
      }
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => {
    // Check if the response has the expected format
    if (response.data && (response.data.success !== undefined || Array.isArray(response.data))) {
      return response.data;
    }
    // If not, wrap it in a success format
    return {
      success: true,
      data: response.data
    };
  },
  (error) => {
    console.error('Response error:', error);
    
    if (!error.response) {
      return Promise.reject({ 
        success: false,
        message: 'Network error. Please check your connection.',
        error: 'NETWORK_ERROR'
      });
    }

    // Handle specific error cases
    switch (error.response.status) {
      case 401:
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject({
          success: false,
          message: 'Authentication required. Please log in again.',
          error: 'AUTH_REQUIRED'
        });
      
      case 403:
        return Promise.reject({
          success: false,
          message: 'Access denied: insufficient permissions',
          error: 'FORBIDDEN'
        });
      
      case 404:
        return Promise.reject({
          success: false,
          message: 'Resource not found',
          error: 'NOT_FOUND'
        });
      
      default:
        return Promise.reject({
          success: false,
          message: error.response.data?.message || 'An unexpected error occurred',
          error: error.response.data?.error || 'UNKNOWN_ERROR'
        });
    }
  }
);

// Auth services
export const authService = {
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      
      // Validate response format
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response format from server');
      }

      // Validate required fields
      if (!response.token || !response.user || !response.user.role) {
        throw new Error('Invalid response from server: Missing required data');
      }

      // Store auth data
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('userRole', response.user.role);
      
      return {
        success: true,
        data: response
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.message || 'Login failed',
        message: error.response?.data?.message || 'Failed to authenticate user'
      };
    }
  },

  logout: () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userRole');
      window.location.href = '/login';
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        error: error.message || 'Logout failed'
      };
    }
  },

  getCurrentUser: () => {
    try {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      if (!token || !user) {
        return null;
      }

      const userData = JSON.parse(user);
      if (!userData || !userData.role) {
        // Invalid user data, clear storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');
        return null;
      }

      return userData;
    } catch (error) {
      console.error('Error getting current user:', error);
      // Clear invalid data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userRole');
      return null;
    }
  },

  isAuthenticated: () => {
    try {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      if (!token || !user) {
        return false;
      }

      // Validate user data format
      const userData = JSON.parse(user);
      return !!(userData && userData.role);
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  },

  // Helper method to check role-based access
  hasPermission: (requiredRole) => {
    try {
      const user = authService.getCurrentUser();
      if (!user || !user.role) {
        return false;
      }

      // Define role hierarchy
      const roleHierarchy = {
        admin: ['admin'],
        faculty: ['admin', 'faculty'],
        student: ['admin', 'faculty', 'student'],
        parent: ['admin', 'parent']
      };

      return roleHierarchy[requiredRole]?.includes(user.role) || false;
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  }
};

// Attendance services
export const attendanceService = {
  getAttendance: async (filters) => {
    return await api.get('/attendance', { params: filters });
  },
  markAttendance: async (data) => {
    return await api.post('/attendance', data);
  },
};

// User services
export const userService = {
  getUsers: async () => {
    try {
      // Get current user and validate permissions
      const currentUser = authService.getCurrentUser();
      if (!currentUser || !currentUser.role) {
        throw new Error('Authentication required');
      }

      // Make a single request without role parameters
      // Let the backend determine which users the current user can access
      const response = await api.get('/users');
      
      // Handle both array and object response formats
      if (response?.success && Array.isArray(response?.data)) {
        return {
          success: true,
          data: response.data
        };
      }
      
      if (Array.isArray(response)) {
        return {
          success: true,
          data: response
        };
      }

      console.error('Invalid response format from getUsers:', response);
      return {
        success: false,
        data: [],
        error: 'Invalid response format'
      };
    } catch (error) {
      console.error('Error in getUsers:', error);
      return {
        success: false,
        data: [],
        error: error.message || 'Failed to fetch users'
      };
    }
  },

  getUserById: async (id) => {
    try {
      if (!id) {
        throw new Error('User ID is required');
      }
      const response = await api.get(`/users/${id}`);
      
      if (!response) {
        throw new Error('User not found');
      }

      return {
        success: true,
        data: response
      };
    } catch (error) {
      console.error('Error in getUserById:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to fetch user'
      };
    }
  },

  updateUser: async (id, data) => {
    try {
      if (!id || !data) {
        throw new Error('User ID and data are required');
      }
      const response = await api.put(`/users/${id}`, data);
      return {
        success: true,
        data: response
      };
    } catch (error) {
      console.error('Error in updateUser:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to update user'
      };
    }
  },

  createUser: async (userData) => {
    try {
      if (!userData) {
        throw new Error('User data is required');
      }
      const response = await api.post('/auth/users', userData);
      return {
        success: true,
        data: response
      };
    } catch (error) {
      console.error('Error in createUser:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to create user'
      };
    }
  },

  deleteUser: async (id) => {
    try {
      if (!id) {
        throw new Error('User ID is required');
      }
      const response = await api.delete(`/users/${id}`);
      return {
        success: true,
        data: response
      };
    } catch (error) {
      console.error('Error in deleteUser:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete user'
      };
    }
  }
};

// Events services
export const eventsService = {
  getEvents: async (filters) => {
    try {
      const response = await api.get('/events', { params: filters });
      if (!response || !Array.isArray(response)) {
        console.error('Invalid response format from getEvents:', response);
        return [];
      }
      return response;
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  },
  
  createEvent: async (eventData) => {
    try {
      if (!eventData) {
        throw new Error('Event data is required');
      }
      const response = await api.post('/events', eventData);
      return response;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  },
  
  updateEvent: async (eventId, eventData) => {
    try {
      if (!eventId || !eventData) {
        throw new Error('Event ID and data are required');
      }
      const response = await api.put(`/events/${eventId}`, eventData);
      return response;
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  },
  
  deleteEvent: async (eventId) => {
    try {
      if (!eventId) {
        throw new Error('Event ID is required');
      }
      const response = await api.delete(`/events/${eventId}`);
      return response;
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }
};

// Message services
export const messageService = {
  getMessages: async () => {
    try {
      const response = await api.get('/messages');
      
      // Handle both array and object response formats
      if (response?.success && Array.isArray(response?.data)) {
        return {
          success: true,
          data: response.data
        };
      }
      
      if (Array.isArray(response)) {
        return {
          success: true,
          data: response
        };
      }

      console.error('Invalid response format from getMessages:', response);
      return {
        success: false,
        data: [],
        error: 'Invalid response format'
      };
    } catch (error) {
      console.error('Error in getMessages:', error);
      return {
        success: false,
        data: [],
        error: error.message || 'Failed to fetch messages'
      };
    }
  },

  sendMessage: async (messageData) => {
    try {
      if (!messageData?.receiver || !messageData?.content) {
        throw new Error('Receiver and content are required');
      }

      const response = await api.post('/messages', messageData);
      
      // Handle both success response formats
      if (response?.success && response?.data) {
        return {
          success: true,
          data: response.data
        };
      }

      if (response && !response.error) {
        return {
          success: true,
          data: response
        };
      }

      throw new Error(response?.error || 'Failed to send message');
    } catch (error) {
      console.error('Error in sendMessage:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to send message'
      };
    }
  },

  markAsRead: async (messageId) => {
    try {
      if (!messageId) {
        throw new Error('Message ID is required');
      }

      const response = await api.put(`/messages/${messageId}/read`);
      
      if (response?.success) {
        return {
          success: true,
          data: response.data
        };
      }

      return {
        success: true,
        data: response
      };
    } catch (error) {
      console.error('Error in markAsRead:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to mark message as read'
      };
    }
  },

  deleteMessage: async (messageId) => {
    try {
      if (!messageId) {
        throw new Error('Message ID is required');
      }

      const response = await api.delete(`/messages/${messageId}`);
      
      return {
        success: true,
        data: response
      };
    } catch (error) {
      console.error('Error in deleteMessage:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to delete message'
      };
    }
  },

  // System messages
  sendSystemMessage: async (receivers, subject, content, relatedTo, metadata) => {
    try {
      if (!receivers || !content) {
        throw new Error('Receivers and content are required');
      }

      const response = await api.post('/messages/system', {
        receivers,
        subject: subject || 'System Message',
        content,
        type: 'system',
        relatedTo,
        metadata
      });

      if (response?.data?.success) {
        return response.data.data;
      }

      throw new Error(response?.data?.error || 'Failed to send system message');
    } catch (error) {
      console.error('Error in sendSystemMessage:', error);
      throw error;
    }
  }
};

export default api;