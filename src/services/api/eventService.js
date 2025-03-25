import axiosInstance from './axiosConfig';

const API_URL = '/events';  // Remove /api since it's in baseURL

export const eventService = {
  // Get all events
  getEvents: async (filter = '') => {
    try {
      const response = await axiosInstance.get(`${API_URL}${filter ? `?filter=${filter}` : ''}`);
      return response;
    } catch (error) {
      console.error('Error fetching events:', error);
      return error;
    }
  },

  // Get single event
  getEvent: async (id) => {
    try {
      const response = await axiosInstance.get(`${API_URL}/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetching event:', error);
      return error;
    }
  },

  // Create new event
  createEvent: async (eventData) => {
    try {
      const response = await axiosInstance.post(API_URL, eventData);
      return response;
    } catch (error) {
      console.error('Error creating event:', error);
      return error;
    }
  },

  // Update event
  updateEvent: async (id, eventData) => {
    try {
      const response = await axiosInstance.put(`${API_URL}/${id}`, eventData);
      return response;
    } catch (error) {
      console.error('Error updating event:', error);
      return error;
    }
  },

  // Delete event
  deleteEvent: async (id) => {
    try {
      const response = await axiosInstance.delete(`${API_URL}/${id}`);
      return response;
    } catch (error) {
      console.error('Error deleting event:', error);
      return error;
    }
  },

  // Register for event
  registerForEvent: async (eventId) => {
    try {
      const response = await axiosInstance.post(`${API_URL}/${eventId}/register`);
      return response;
    } catch (error) {
      console.error('Error registering for event:', error);
      return error;
    }
  },

  // Unregister from event
  unregisterFromEvent: async (eventId) => {
    try {
      const response = await axiosInstance.post(`${API_URL}/${eventId}/unregister`);
      return response;
    } catch (error) {
      console.error('Error unregistering from event:', error);
      return error;
    }
  }
}; 