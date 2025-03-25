const Activity = require('../models/Activity');

/**
 * Track user activity and store it in the database
 * 
 * @param {Object} params - Parameters for tracking activity
 * @param {String} params.userId - User ID who performed the action
 * @param {String} params.facultyId - Faculty ID related to the activity (optional)
 * @param {String} params.type - Type of activity ('attendance', 'message', etc.)
 * @param {String} params.message - Description of the activity
 * @param {Object} params.metadata - Additional data related to the activity (optional)
 * @returns {Promise<Object>} - Created activity object
 */
const trackActivity = async (params) => {
  try {
    const { userId, facultyId, type, message, metadata = {} } = params;
    
    if (!userId || !type || !message) {
      console.error('Missing required parameters for activity tracking');
      return null;
    }
    
    const activity = new Activity({
      user: userId,
      faculty: facultyId || userId, // If facultyId not provided, use userId (for when faculty is taking action)
      type,
      message,
      metadata,
      createdAt: new Date()
    });
    
    await activity.save();
    return activity;
  } catch (error) {
    console.error('Error tracking activity:', error);
    return null;
  }
};

module.exports = {
  trackActivity
}; 