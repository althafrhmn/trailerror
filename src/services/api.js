import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

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

// Cache variables
const failedUserIdsCache = new Set();
const activeUserRequests = new Map();

// User services
export const userService = {
  // Reset cache method (mainly for testing/debugging)
  resetCache: () => {
    failedUserIdsCache.clear();
    activeUserRequests.clear();
  },

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
        console.error('No user ID provided to getUserById');
        return {
          success: false,
          data: null,
          error: 'User ID is required'
        };
      }
      
      // Check if this ID has previously failed with 404
      if (failedUserIdsCache.has(id)) {
        console.log(`User ID ${id} was previously not found - using cached result`);
        return {
          success: false,
          data: null,
          error: 'User not found',
          code: 'NOT_FOUND',
          fromCache: true
        };
      }
      
      // Check if there's already an active request for this ID
      if (activeUserRequests.has(id)) {
        console.log(`Reusing existing request for user ID: ${id}`);
        return activeUserRequests.get(id);
      }
      
      // Check if token exists
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found in localStorage');
        return {
          success: false,
          data: null,
          error: 'Authentication required'
        };
      }
      
      console.log(`Fetching user data for ID: ${id}`);
      
      // Create the promise for this request
      const fetchPromise = (async () => {
        try {
          const response = await api.get(`/users/${id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (!response) {
            console.warn(`No response data for user ID: ${id}`);
            return {
              success: false,
              data: null,
              error: 'User not found'
            };
          }

          console.log('User data fetched successfully:', response);
          return {
            success: true,
            data: response
          };
        } catch (apiError) {
          // Return a clear error response without throwing
          console.error('Error in getUserById API call:', apiError);
          
          // Check if it's a 404 error - user not found
          if (apiError.error === 'NOT_FOUND') {
            console.log(`User with ID ${id} not found in the database`);
            // Add to failed cache to avoid future requests
            failedUserIdsCache.add(id);
            return {
              success: false,
              data: null,
              error: 'User not found',
              code: 'NOT_FOUND'
            };
          }
          
          return {
            success: false,
            data: null,
            error: apiError.message || 'Failed to fetch user'
          };
        } finally {
          // Remove from active requests when done
          activeUserRequests.delete(id);
        }
      })();
      
      // Store the promise in the active requests map
      activeUserRequests.set(id, fetchPromise);
      
      // Return the promise
      return fetchPromise;
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
  },
  
  getUserActivityLogs: async (userId) => {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      // Check if token exists
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found in localStorage');
        return {
          success: false,
          data: null,
          error: 'Authentication required'
        };
      }
      
      // In a real app, this would call an API endpoint
      // Since the endpoint might not exist, we'll return mock data
      console.log(`Fetching activity logs for user: ${userId}`);
      
      // Get user role for better mock data
      const user = JSON.parse(localStorage.getItem('user')) || {};
      const role = user.role || 'user';
      
      // Create mock activity logs
      const mockLogs = [
        { 
          action: 'Login', 
          timestamp: new Date().toISOString(), 
          details: `${role.charAt(0).toUpperCase() + role.slice(1)} logged in successfully` 
        },
        { 
          action: 'Profile View', 
          timestamp: new Date(Date.now() - 3600000).toISOString(), 
          details: 'Viewed profile information' 
        },
        { 
          action: 'Profile Update', 
          timestamp: new Date(Date.now() - 86400000).toISOString(), 
          details: `Updated ${role} profile` 
        },
        { 
          action: 'Dashboard Access', 
          timestamp: new Date(Date.now() - 172800000).toISOString(), 
          details: 'Accessed system dashboard' 
        }
      ];
      
      return {
        success: true,
        data: mockLogs
      };
    } catch (error) {
      console.error('Error in getUserActivityLogs:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to fetch user activity logs'
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
      
      // Properly handle response data formats
      if (response?.data?.success && Array.isArray(response.data.data)) {
        return {
          success: true,
          data: response.data.data,
          pagination: response.data.pagination
        };
      }
      
      // In case the API returns just an array directly (old format)
      if (Array.isArray(response.data)) {
        return {
          success: true,
          data: response.data
        };
      }

      // If we got a response but in unexpected format
      console.error('Invalid response format from getMessages:', response);
      return {
        success: false,
        data: [],
        error: 'Invalid response format'
      };
    } catch (error) {
      console.error('Error in getMessages:', error);
      
      // Check for specific network errors
      if (!navigator.onLine) {
        return {
          success: false,
          data: [],
          error: 'You are offline. Please check your internet connection.'
        };
      }
      
      return {
        success: false,
        data: [],
        error: error.message || 'Failed to fetch messages'
      };
    }
  },

  sendMessage: async (messageData) => {
    try {
      // Validate required fields
      if (!messageData?.receiver) {
        throw new Error('Receiver is required');
      }
      
      if (!messageData?.content) {
        throw new Error('Message content is required');
      }
      
      if (!messageData?.subject) {
        // Set a default subject if not provided
        messageData.subject = 'Message';
      }

      const response = await api.post('/messages', messageData);
      
      // Handle response formats consistently
      if (response?.data?.success && response.data.data) {
        return {
          success: true,
          data: response.data.data
        };
      }

      // Fallback for other successful response formats
      if (response?.data && !response.data.error) {
        return {
          success: true,
          data: response.data
        };
      }

      throw new Error(response?.data?.error || 'Failed to send message');
    } catch (error) {
      console.error('Error in sendMessage:', error);
      
      // Check for network connectivity
      if (!navigator.onLine) {
        return {
          success: false,
          data: null,
          error: 'You are offline. Please check your internet connection.'
        };
      }
      
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
      
      if (response?.data?.success) {
        return {
          success: true,
          data: response.data.data
        };
      }

      // Fallback for other response formats
      return {
        success: true,
        data: response.data
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

  markAllAsRead: async () => {
    try {
      const response = await api.put('/messages/all/read');
      
      if (response?.data?.success) {
        return {
          success: true,
          data: response.data.data
        };
      }

      return {
        success: false,
        error: response?.data?.error || 'Failed to mark all messages as read'
      };
    } catch (error) {
      console.error('Error in markAllAsRead:', error);
      return {
        success: false,
        error: error.message || 'Failed to mark all messages as read'
      };
    }
  },

  getUnreadCount: async () => {
    try {
      const response = await api.get('/messages/unread/count');
      
      if (response?.data?.success) {
        return {
          success: true,
          count: response.data.data.count
        };
      }

      return {
        success: false,
        count: 0,
        error: response?.data?.error || 'Failed to get unread count'
      };
    } catch (error) {
      console.error('Error in getUnreadCount:', error);
      return {
        success: false,
        count: 0,
        error: error.message || 'Failed to get unread count'
      };
    }
  },

  deleteMessage: async (messageId) => {
    try {
      if (!messageId) {
        throw new Error('Message ID is required');
      }

      const response = await api.delete(`/messages/${messageId}`);
      
      if (response?.data?.success) {
        return {
          success: true,
          data: response.data.data
        };
      }

      // Fallback for other response formats
      return {
        success: true,
        data: response.data
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
      if (!receivers || !Array.isArray(receivers) || receivers.length === 0) {
        throw new Error('At least one receiver is required');
      }
      
      if (!content) {
        throw new Error('Content is required');
      }

      const response = await api.post('/messages/system', {
        receivers,
        subject: subject || 'System Message',
        content,
        type: 'system',
        relatedTo: relatedTo || 'general',
        metadata: metadata || {}
      });

      if (response?.data?.success) {
        return {
          success: true,
          data: response.data.data
        };
      }

      throw new Error(response?.data?.error || 'Failed to send system message');
    } catch (error) {
      console.error('Error in sendSystemMessage:', error);
      return {
        success: false,
        error: error.message || 'Failed to send system message'
      };
    }
  },
  
  // Test connection to messaging API
  testConnection: async () => {
    try {
      const startTime = Date.now();
      const response = await api.get('/messages/test-connection', { timeout: 5000 });
      const endTime = Date.now();
      
      return {
        success: true,
        online: true,
        responseTime: endTime - startTime,
        serverTime: response?.data?.timestamp,
        message: response?.data?.message || 'Connection successful'
      };
    } catch (error) {
      console.error('Error testing message API connection:', error);
      return {
        success: false,
        online: false,
        error: error.message || 'Failed to connect to messaging API'
      };
    }
  }
};

export default api;