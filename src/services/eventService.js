import axiosInstance from './api/axiosConfig';

const getEvents = async () => {
  try {
    console.log('Fetching events from API...');
    const response = await axiosInstance.get('/events');
    console.log('Raw API response:', response);

    // Check if the response is a full axios response object
    if (response && response.status === 200) {
      // Extract the data from the axios response
      const responseData = response.data;
      
      // If it's already in our expected format with success flag
      if (responseData && responseData.success === true && Array.isArray(responseData.data)) {
        // The data is already properly formatted
        const processedEvents = responseData.data.map(event => ({
          ...event,
          startDate: new Date(event.startDate).toISOString(),
          endDate: new Date(event.endDate).toISOString(),
          organizer: event.organizer || (event.createdBy?.name || 'Unknown'),
          status: event.status || 'upcoming',
          type: event.type || 'other'
        }));

        return { success: true, data: processedEvents };
      }
      
      // If responseData itself is an array (direct data from server)
      if (Array.isArray(responseData)) {
        const processedEvents = responseData.map(event => ({
          ...event,
          startDate: new Date(event.startDate).toISOString(),
          endDate: new Date(event.endDate).toISOString(),
          organizer: event.organizer || (event.createdBy?.name || 'Unknown'),
          status: event.status || 'upcoming',
          type: event.type || 'other'
        }));

        return { success: true, data: processedEvents };
      }
      
      // If responseData has a data property which is an array
      if (responseData && responseData.data && Array.isArray(responseData.data)) {
        const processedEvents = responseData.data.map(event => ({
          ...event,
          startDate: new Date(event.startDate).toISOString(),
          endDate: new Date(event.endDate).toISOString(),
          organizer: event.organizer || (event.createdBy?.name || 'Unknown'),
          status: event.status || 'upcoming',
          type: event.type || 'other'
        }));

        return { success: true, data: processedEvents };
      }
    }

    console.error('Unexpected response format:', response);
    return {
      success: false,
      error: 'Unexpected response format from server',
      data: []
    };
  } catch (error) {
    console.error('Error fetching events:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch events',
      data: []
    };
  }
};

const getEventById = async (id) => {
  try {
    const response = await axiosInstance.get(`/events/${id}`);
    
    // Check if we have a valid response
    if (response && response.status === 200) {
      const responseData = response.data;
      
      // If data is already in our format
      if (responseData && responseData.success === true) {
        return responseData;
      }
      
      // If the data is directly the event object
      if (responseData && responseData._id) {
        return {
          success: true,
          data: {
            ...responseData,
            startDate: new Date(responseData.startDate).toISOString(),
            endDate: new Date(responseData.endDate).toISOString(),
            organizer: responseData.organizer || (responseData.createdBy?.name || 'Unknown'),
            status: responseData.status || 'upcoming',
            type: responseData.type || 'other'
          }
        };
      }
    }
    
    return {
      success: false,
      error: 'Failed to fetch event or invalid response format'
    };
  } catch (error) {
    console.error('Error fetching event:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to fetch event'
    };
  }
};

const createEvent = async (eventData) => {
  try {
    console.log('Creating event with data:', eventData);
    
    // Validate required fields
    if (!eventData.title || !eventData.startDate || !eventData.endDate) {
      throw new Error('Missing required fields');
    }

    const response = await axiosInstance.post('/events', eventData);
    console.log('Create event response:', response);

    // Check if we have a valid response
    if (response && response.status >= 200 && response.status < 300) {
      const responseData = response.data;
      
      // If data is already in our format
      if (responseData && responseData.success === true) {
        return responseData;
      }
      
      // If the data is directly the created event
      if (responseData && responseData.title) {
        return {
          success: true,
          data: responseData
        };
      }
    }
    
    return {
      success: false,
      error: 'Failed to create event or invalid response format'
    };
  } catch (error) {
    console.error('Error creating event:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to create event'
    };
  }
};

const updateEvent = async (id, eventData) => {
  try {
    const response = await axiosInstance.put(`/events/${id}`, eventData);
    
    // Check if we have a valid response
    if (response && response.status >= 200 && response.status < 300) {
      const responseData = response.data;
      
      // If data is already in our format
      if (responseData && responseData.success === true) {
        return responseData;
      }
      
      // If the data is directly the updated event
      if (responseData && responseData._id) {
        return {
          success: true,
          data: responseData
        };
      }
    }
    
    return {
      success: false,
      error: 'Failed to update event or invalid response format'
    };
  } catch (error) {
    console.error('Error updating event:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to update event'
    };
  }
};

const deleteEvent = async (id) => {
  try {
    const response = await axiosInstance.delete(`/events/${id}`);
    
    // Check if we have a valid response
    if (response && response.status >= 200 && response.status < 300) {
      const responseData = response.data;
      
      // If data is already in our format
      if (responseData && responseData.success === true) {
        return responseData;
      }
      
      // Successfully deleted
      return {
        success: true,
        message: 'Event deleted successfully'
      };
    }
    
    return {
      success: false,
      error: 'Failed to delete event or invalid response format'
    };
  } catch (error) {
    console.error('Error deleting event:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to delete event'
    };
  }
};

const registerForEvent = async (eventId) => {
  try {
    const response = await axiosInstance.post(`/events/${eventId}/register`);
    
    // Check if we have a valid response
    if (response && response.status >= 200 && response.status < 300) {
      const responseData = response.data;
      
      // If data is already in our format
      if (responseData && responseData.success === true) {
        return responseData;
      }
      
      // Successfully registered
      return {
        success: true,
        message: 'Successfully registered for event'
      };
    }
    
    return {
      success: false,
      error: 'Failed to register for event or invalid response format'
    };
  } catch (error) {
    console.error('Error registering for event:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to register for event'
    };
  }
};

const unregisterFromEvent = async (eventId) => {
  try {
    const response = await axiosInstance.post(`/events/${eventId}/unregister`);
    
    // Check if we have a valid response
    if (response && response.status >= 200 && response.status < 300) {
      const responseData = response.data;
      
      // If data is already in our format
      if (responseData && responseData.success === true) {
        return responseData;
      }
      
      // Successfully unregistered
      return {
        success: true,
        message: 'Successfully unregistered from event'
      };
    }
    
    return {
      success: false,
      error: 'Failed to unregister from event or invalid response format'
    };
  } catch (error) {
    console.error('Error unregistering from event:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to unregister from event'
    };
  }
};

export {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  unregisterFromEvent
}; 