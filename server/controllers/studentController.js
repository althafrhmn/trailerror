const User = require('../models/User');

// Get students by class name
const getStudentsByClass = async (req, res) => {
  try {
    const { className } = req.query;
    
    if (!className) {
      return res.status(400).json({ 
        success: false,
        message: 'Class name is required' 
      });
    }
    
    // Find all students in this class using the class name (not ID)
    const students = await User.find({
      role: 'student',
      'studentInfo.class': className,
      'studentInfo.isActive': { $ne: false }
    }).select('_id name studentInfo.rollNo');
    
    // Format the response to match the frontend expectations
    const formattedStudents = students.map(student => ({
      _id: student._id,
      name: student.name,
      rollNumber: student.studentInfo?.rollNo || 'N/A'
    }));
    
    res.json({
      success: true,
      data: formattedStudents
    });
  } catch (error) {
    console.error('Error fetching students by class:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all students (for admin)
const getAllStudents = async (req, res) => {
  try {
    const students = await User.find({
      role: 'student',
      'studentInfo.isActive': { $ne: false }
    }).select('_id name studentInfo').sort({ name: 1 });
    
    res.json({
      success: true,
      data: students
    });
  } catch (error) {
    console.error('Error fetching all students:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get student by ID
const getStudentById = async (req, res) => {
  try {
    const studentId = req.params.id;
    const student = await User.findOne({
      _id: studentId,
      role: 'student'
    }).select('-password');
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    console.error('Error fetching student by ID:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getStudentsByClass,
  getAllStudents,
  getStudentById
}; 