import axiosInstance from './axiosConfig';

const API_URL = '/users';  // Remove /api since it's in baseURL

export const userService = {
  // Get all users
  getUsers: async (filters = {}) => {
    try {
      const response = await axiosInstance.get('/api/users', { params: filters });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get faculty members (for students to use in leave applications)
  getFacultyMembers: async () => {
    try {
      const response = await axiosInstance.get('/api/users/faculty');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get user by ID
  getUserById: async (id) => {
    try {
      const response = await axiosInstance.get(`/api/users/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create new user
  createUser: async (userData) => {
    try {
      const response = await axiosInstance.post('/api/users', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update user
  updateUser: async (id, userData) => {
    try {
      const response = await axiosInstance.put(`/api/users/${id}`, userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete user
  deleteUser: async (id) => {
    try {
      const response = await axiosInstance.delete(`/api/users/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Change user status
  changeUserStatus: async (id, status) => {
    try {
      const response = await axiosInstance.patch(`${API_URL}/${id}/status`, { status });
      return response;
    } catch (error) {
      console.error('Error changing user status:', error);
      return error;
    }
  },

  // Change user role
  changeUserRole: async (id, role) => {
    try {
      const response = await axiosInstance.patch(`${API_URL}/${id}/role`, { role });
      return response;
    } catch (error) {
      console.error('Error changing user role:', error);
      return error;
    }
  },

  // Get faculty classes
  getFacultyClasses: async (facultyId) => {
    try {
      const response = await axiosInstance.get(`/api/faculty/${facultyId}/classes`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get user profile
  getProfile: async () => {
    try {
      const response = await axiosInstance.get('/api/users/profile');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (profileData) => {
    try {
      const response = await axiosInstance.put('/api/users/profile', profileData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Change password
  changePassword: async (passwordData) => {
    try {
      const response = await axiosInstance.put('/api/users/change-password', passwordData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}; 