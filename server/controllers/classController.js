const User = require('../models/User');
const Class = require('../models/Class');

// Get classes for the logged-in faculty
const getFacultyClasses = async (req, res) => {
  try {
    const facultyId = req.user._id;
    
    // Find the faculty user
    const faculty = await User.findById(facultyId);
    
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }
    
    // Check if faculty has classes assigned in facultyInfo
    if (!faculty.facultyInfo || !faculty.facultyInfo.classes || faculty.facultyInfo.classes.length === 0) {
      // Return empty array if no classes assigned
      return res.json({
        success: true,
        data: []
      });
    }
    
    // Get classes the faculty is assigned to
    const classes = await Class.find({ 
      _id: { $in: faculty.facultyInfo.classes },
      isActive: true
    }).sort({ name: 1 });
    
    res.json({
      success: true,
      data: classes
    });
  } catch (error) {
    console.error('Error fetching faculty classes:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all classes (for admin)
const getAllClasses = async (req, res) => {
  try {
    const classes = await Class.find({ isActive: true }).sort({ name: 1 });
    
    res.json({
      success: true,
      data: classes
    });
  } catch (error) {
    console.error('Error fetching all classes:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get class by ID
const getClassById = async (req, res) => {
  try {
    const classId = req.params.id;
    const classData = await Class.findById(classId);
    
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    res.json({
      success: true,
      data: classData
    });
  } catch (error) {
    console.error('Error fetching class by ID:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getFacultyClasses,
  getAllClasses,
  getClassById
}; 