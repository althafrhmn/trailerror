import axiosInstance from './api/axiosConfig';

const getUsers = async (filter = '') => {
  try {
    console.log('Fetching users from API...');
    const response = await axiosInstance.get(`/users${filter ? `?filter=${filter}` : ''}`);
    console.log('Raw users response:', response);

    // Check if the response is a full axios response object
    if (response && response.status === 200) {
      // Extract the data from the axios response
      const responseData = response.data;
      
      // If it's already in our expected format with success flag
      if (responseData && responseData.success === true && Array.isArray(responseData.data)) {
        return { success: true, data: responseData.data };
      }
      
      // If responseData itself is an array (direct data from server)
      if (Array.isArray(responseData)) {
        return { success: true, data: responseData };
      }
      
      // If responseData has a data property which is an array
      if (responseData && responseData.data && Array.isArray(responseData.data)) {
        return { success: true, data: responseData.data };
      }
    }

    console.error('Unexpected response format:', response);
    return {
      success: false,
      error: 'Unexpected response format from server',
      data: []
    };
  } catch (error) {
    console.error('Error fetching users:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch users',
      data: []
    };
  }
};

const getUserById = async (id) => {
  try {
    const response = await axiosInstance.get(`/users/${id}`);
    
    // Check if we have a valid response
    if (response && response.status === 200) {
      const responseData = response.data;
      
      // If data is already in our format
      if (responseData && responseData.success === true) {
        return responseData;
      }
      
      // If the data is directly the user object
      if (responseData && responseData._id) {
        return {
          success: true,
          data: responseData
        };
      }
    }
    
    return {
      success: false,
      error: 'Failed to fetch user or invalid response format'
    };
  } catch (error) {
    console.error('Error fetching user:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to fetch user'
    };
  }
};

const createUser = async (userData) => {
  try {
    console.log('userService: Creating user with data:', JSON.stringify(userData, null, 2));
    
    const response = await axiosInstance.post('/users', userData);
    
    console.log('userService: Server response:', JSON.stringify(response.data, null, 2));
    
    // Check if we have a valid response
    if (response && response.status >= 200 && response.status < 300) {
      const responseData = response.data;
      
      // If data is already in our format
      if (responseData && responseData.success === true) {
        return responseData;
      }
      
      // If the data is directly the created user
      if (responseData && responseData._id) {
        return {
          success: true,
          data: responseData
        };
      }
    }
    
    return {
      success: false,
      error: 'Failed to create user or invalid response format'
    };
  } catch (error) {
    console.error('Error creating user:', error);
    console.error('Error response:', error.response?.data);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to create user'
    };
  }
};

const updateUser = async (id, userData) => {
  try {
    const response = await axiosInstance.put(`/users/${id}`, userData);
    
    // Check if we have a valid response
    if (response && response.status >= 200 && response.status < 300) {
      const responseData = response.data;
      
      // If data is already in our format
      if (responseData && responseData.success === true) {
        return responseData;
      }
      
      // If the data is directly the updated user
      if (responseData && responseData._id) {
        return {
          success: true,
          data: responseData
        };
      }
    }
    
    return {
      success: false,
      error: 'Failed to update user or invalid response format'
    };
  } catch (error) {
    console.error('Error updating user:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to update user'
    };
  }
};

const deleteUser = async (id) => {
  try {
    const response = await axiosInstance.delete(`/users/${id}`);
    
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
        message: 'User deleted successfully'
      };
    }
    
    return {
      success: false,
      error: 'Failed to delete user or invalid response format'
    };
  } catch (error) {
    console.error('Error deleting user:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to delete user'
    };
  }
};

export {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
}; 