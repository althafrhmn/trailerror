import axios from 'axios';
import { toast } from 'react-hot-toast';

// Create a new axios instance with baseURL
const axiosInstance = axios.create({
  baseURL: 'http://localhost:5001/api',
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token and timeout
axiosInstance.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // If token exists, add it to the headers
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Add timeout if not already specified
    if (!config.timeout) {
      config.timeout = 10000; // 10 seconds
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and response standardization
axiosInstance.interceptors.response.use(
  (response) => {
    // Add additional logging for debugging
    if (response.config.url === '/users' && response.config.method === 'post') {
      console.log('axiosConfig: User creation response:', JSON.stringify(response.data, null, 2));
    }
    
    // Standardize successful response format
    if (!response.data.hasOwnProperty('success')) {
      response.data = {
        success: true,
        data: response.data
      };
    }
    return response;
  },
  (error) => {
    // Handle different types of errors
    if (error.response) {
      // Server responded with an error status code
      const { status, data, config } = error.response;
      
      // Enhanced logging for user creation errors
      if (config.url === '/users' && config.method === 'post') {
        console.error('axiosConfig: User creation error response:', JSON.stringify(data, null, 2));
        console.error('axiosConfig: Request that caused error:', JSON.stringify(config.data, null, 2));
      }
      
      // Format error object
      let errorMessage = data?.error || 'An error occurred';
      
      // Handle specific HTTP status codes
      switch (status) {
        case 401:
          // Unauthorized - invalid or expired token
          toast.error('Session expired. Please login again.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          break;
          
        case 403:
          // Forbidden - not enough permissions
          toast.error('You do not have permission to perform this action');
          break;
          
        case 404:
          // Not found
          toast.error('Resource not found');
          break;
          
        case 500:
          // Server error
          toast.error('Server error. Please try again later');
          break;
          
        default:
          // Other error status codes
          toast.error(errorMessage);
      }
      
      // Return standardized error response
      return Promise.reject({
        ...error,
        response: {
          ...error.response,
          data: {
            success: false,
            error: errorMessage
          }
        }
      });
      
    } else if (error.request) {
      // Request was made but no response received (network error)
      const errorMessage = 'Server not responding. Check your connection.';
      
      toast.error(errorMessage);
      
      // If server is unreachable, let user know we're using demo mode
      if (localStorage.getItem('useDemoMode') !== 'true') {
        toast('Switching to demo mode. Limited functionality available.', {
          icon: '🔔',
          style: {
            border: '1px solid #3498db',
            padding: '16px',
            color: '#3498db',
          },
          duration: 5000
        });
      }
      
      // Return standardized error
      return Promise.reject({
        ...error,
        message: errorMessage
      });
      
    } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      // Request timeout
      const errorMessage = 'Request timed out. Please try again.';
      
      toast.error(errorMessage);
      
      // Return standardized error
      return Promise.reject({
        ...error,
        message: errorMessage
      });
      
    } else {
      // Something happened in setting up the request
      const errorMessage = error.message || 'An unknown error occurred';
      
      toast.error(errorMessage);
      
      // Return standardized error
      return Promise.reject({
        ...error,
        message: errorMessage
      });
    }
  }
);

export default axiosInstance; 