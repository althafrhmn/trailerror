import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Box,
  Divider,
} from '@mui/material';
import { toast } from 'react-hot-toast';
import axiosInstance from '../../services/api/axiosConfig';

const UserDialog = ({ open, onClose, user, onSave }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    // Basic Info
    name: '',
    email: '',
    username: '',
    password: '',
    role: 'student',
    phoneNumber: '',

    // Student Info
    studentInfo: {
      rollNo: '',
      admissionNo: '',
      class: '',
      department: '',
      semester: '',
      dob: '',
      gender: '',
      academicYear: '',
      parentId: '',
    },

    // Faculty Info
    facultyInfo: {
      department: '',
      subjects: [],
      assignedClasses: [],
      qualification: '',
      joiningDate: '',
      employeeId: '',
    },

    // Parent Info
    parentInfo: {
      occupation: '',
      alternatePhone: '',
      address: '',
      relation: '',
    },
  });

  const [errors, setErrors] = useState({});
  const [parents, setParents] = useState([]);

  useEffect(() => {
    if (user) {
      setFormData({
        ...formData,
        ...user,
      });
    }
  }, [user]);

  // Fetch parents for student form
  useEffect(() => {
    if (formData.role === 'student' && open) {
      fetchParents();
    }
  }, [formData.role, open]);

  const fetchParents = async () => {
    try {
      const response = await axiosInstance.get('/users?role=parent');
      if (response.data.success && Array.isArray(response.data.data)) {
        setParents(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching parents:', error);
    }
  };

  const steps = ['Basic Information', 'Role-specific Details', 'Review'];

  const departments = [
    'Computer Science',
    'Information Technology',
    'Electronics',
    'Mechanical',
    'Civil',
    'Electrical',
  ];

  // Replace the simple classes array with the predefined class options
  // that match what's used in the faculty portal
  const CLASS_OPTIONS = [
    "CSE-A", "CSE-B", "CSE-C", 
    "ECE-A", "ECE-B", 
    "MECH-A", "MECH-B"
  ];
  
  // Use the same subjects as defined in the faculty portal
  const SUBJECT_OPTIONS = [
    "Data Structures", "Algorithms", "Database Systems", 
    "Computer Networks", "Operating Systems", "Web Development",
    "Machine Learning", "Artificial Intelligence", "Calculus", 
    "Linear Algebra", "Discrete Mathematics"
  ];
  
  const semesters = [1, 2, 3, 4, 5, 6, 7, 8];
  const academicYears = ['2023-24', '2024-25', '2025-26', '2026-27'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const validateBasicInfo = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Name is required';
    
    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = 'Invalid email address format';
    }
    
    if (!formData.username) newErrors.username = 'Username is required';
    if (!user && !formData.password) newErrors.password = 'Password is required';
    if (!formData.role) newErrors.role = 'Role is required';
    if (formData.phoneNumber && !/^\d{10}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Phone number must be 10 digits';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateRoleSpecificInfo = () => {
    const newErrors = {};
    if (formData.role === 'student') {
      if (!formData.studentInfo.rollNo) newErrors['studentInfo.rollNo'] = 'Roll number is required';
      if (!formData.studentInfo.admissionNo) newErrors['studentInfo.admissionNo'] = 'Admission number is required';
      if (!formData.studentInfo.class) newErrors['studentInfo.class'] = 'Class is required';
      if (!formData.studentInfo.department) newErrors['studentInfo.department'] = 'Department is required';
      if (!formData.studentInfo.semester) newErrors['studentInfo.semester'] = 'Semester is required';
    } else if (formData.role === 'faculty') {
      if (!formData.facultyInfo.department) newErrors['facultyInfo.department'] = 'Department is required';
      if (!formData.facultyInfo.employeeId) newErrors['facultyInfo.employeeId'] = 'Employee ID is required';
      if (!formData.facultyInfo.subjects || formData.facultyInfo.subjects.length === 0) {
        newErrors['facultyInfo.subjects'] = 'At least one subject is required';
      }
    } else if (formData.role === 'parent') {
      // Parent role doesn't require additional validation as studentIds will be linked later
      return true;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (activeStep === 0 && !validateBasicInfo()) return;
    if (activeStep === 1 && !validateRoleSpecificInfo()) return;
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = () => {
    if (validateBasicInfo() && validateRoleSpecificInfo()) {
      // Clean up the form data before submitting
      const cleanedData = {
        ...formData,
        phoneNumber: formData.phoneNumber || undefined,
      };

      // Remove empty strings and undefined values from nested objects
      if (formData.role === 'student') {
        cleanedData.studentInfo = Object.fromEntries(
          Object.entries(formData.studentInfo).filter(([_, v]) => v !== '' && v !== undefined)
        );
        delete cleanedData.facultyInfo;
        delete cleanedData.parentInfo;
        
        // Add console logging for debugging student creation
        console.log('Creating student with data:', JSON.stringify(cleanedData, null, 2));
        console.log('Student info fields:', Object.keys(cleanedData.studentInfo));
        console.log('Student class value:', cleanedData.studentInfo.class);
      } else if (formData.role === 'faculty') {
        cleanedData.facultyInfo = Object.fromEntries(
          Object.entries(formData.facultyInfo).filter(([_, v]) => v !== '' && v !== undefined)
        );
        delete cleanedData.studentInfo;
        delete cleanedData.parentInfo;
        
        // Add console logging for debugging faculty creation
        console.log('Creating faculty with data:', JSON.stringify(cleanedData, null, 2));
        console.log('Faculty info fields:', Object.keys(cleanedData.facultyInfo));
        console.log('Faculty assigned classes:', cleanedData.facultyInfo.assignedClasses);
      } else if (formData.role === 'parent') {
        cleanedData.parentInfo = Object.fromEntries(
          Object.entries(formData.parentInfo).filter(([_, v]) => v !== '' && v !== undefined)
        );
        delete cleanedData.studentInfo;
        delete cleanedData.facultyInfo;
      }

      onSave(cleanedData);
      onClose();
      toast.success(`User ${user ? 'updated' : 'created'} successfully`);
    }
  };

  const renderBasicInfo = () => (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Basic Information
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          error={!!errors.name}
          helperText={errors.name}
          required
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={(e) => {
            handleChange(e);
            // Real-time email validation
            if (e.target.value && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(e.target.value)) {
              setErrors(prev => ({...prev, email: 'Invalid email address format'}));
            } else if (e.target.value) {
              setErrors(prev => ({...prev, email: ''}));
            }
          }}
          error={!!errors.email}
          helperText={errors.email}
          required
          placeholder="example@domain.com"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          error={!!errors.username}
          helperText={errors.username}
          required
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          error={!!errors.password}
          helperText={errors.password}
          required={!user}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required error={!!errors.role}>
          <InputLabel>Role</InputLabel>
          <Select
            name="role"
            value={formData.role}
            onChange={handleChange}
            label="Role"
          >
            <MenuItem value="student">Student</MenuItem>
            <MenuItem value="faculty">Faculty</MenuItem>
            <MenuItem value="parent">Parent</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Phone Number"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleChange}
          error={!!errors.phoneNumber}
          helperText={errors.phoneNumber || 'Enter 10 digit number'}
          inputProps={{ maxLength: 10 }}
        />
      </Grid>
    </Grid>
  );

  const renderStudentInfo = () => (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Student Information
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Roll Number"
          name="studentInfo.rollNo"
          value={formData.studentInfo.rollNo}
          onChange={handleChange}
          error={!!errors['studentInfo.rollNo']}
          helperText={errors['studentInfo.rollNo']}
          required
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Admission Number"
          name="studentInfo.admissionNo"
          value={formData.studentInfo.admissionNo}
          onChange={handleChange}
          error={!!errors['studentInfo.admissionNo']}
          helperText={errors['studentInfo.admissionNo']}
          required
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required>
          <InputLabel>Department</InputLabel>
          <Select
            name="studentInfo.department"
            value={formData.studentInfo.department}
            onChange={handleChange}
            label="Department"
          >
            {departments.map((dept) => (
              <MenuItem key={dept} value={dept}>
                {dept}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required>
          <InputLabel>Semester</InputLabel>
          <Select
            name="studentInfo.semester"
            value={formData.studentInfo.semester}
            onChange={handleChange}
            label="Semester"
          >
            {semesters.map((sem) => (
              <MenuItem key={sem} value={sem}>
                Semester {sem}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Class</InputLabel>
          <Select
            name="studentInfo.class"
            value={formData.studentInfo.class}
            onChange={handleChange}
            label="Class"
          >
            {CLASS_OPTIONS.map((cls) => (
              <MenuItem key={cls} value={cls}>
                {cls}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required>
          <InputLabel>Academic Year</InputLabel>
          <Select
            name="studentInfo.academicYear"
            value={formData.studentInfo.academicYear}
            onChange={handleChange}
            label="Academic Year"
          >
            {academicYears.map((year) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Date of Birth"
          name="studentInfo.dob"
          type="date"
          value={formData.studentInfo.dob}
          onChange={handleChange}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Gender</InputLabel>
          <Select
            name="studentInfo.gender"
            value={formData.studentInfo.gender}
            onChange={handleChange}
            label="Gender"
          >
            <MenuItem value="male">Male</MenuItem>
            <MenuItem value="female">Female</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Parent</InputLabel>
          <Select
            name="studentInfo.parentId"
            value={formData.studentInfo.parentId}
            onChange={handleChange}
            label="Parent"
          >
            <MenuItem value="">None</MenuItem>
            {parents.map((parent) => (
              <MenuItem key={parent._id} value={parent._id}>
                {parent.name} ({parent.email})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );

  const renderFacultyInfo = () => (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Faculty Information
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Employee ID"
          name="facultyInfo.employeeId"
          value={formData.facultyInfo.employeeId}
          onChange={handleChange}
          error={!!errors['facultyInfo.employeeId']}
          helperText={errors['facultyInfo.employeeId']}
          required
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required>
          <InputLabel>Department</InputLabel>
          <Select
            name="facultyInfo.department"
            value={formData.facultyInfo.department}
            onChange={handleChange}
            label="Department"
          >
            {departments.map((dept) => (
              <MenuItem key={dept} value={dept}>
                {dept}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Subjects</InputLabel>
          <Select
            multiple
            name="facultyInfo.subjects"
            value={formData.facultyInfo.subjects}
            onChange={handleChange}
            label="Subjects"
          >
            {SUBJECT_OPTIONS.map((subject) => (
              <MenuItem key={subject} value={subject}>
                {subject}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Assigned Classes</InputLabel>
          <Select
            multiple
            name="facultyInfo.assignedClasses"
            value={formData.facultyInfo.assignedClasses}
            onChange={handleChange}
            label="Assigned Classes"
          >
            {CLASS_OPTIONS.map((cls) => (
              <MenuItem key={cls} value={cls}>
                {cls}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Qualification"
          name="facultyInfo.qualification"
          value={formData.facultyInfo.qualification}
          onChange={handleChange}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Joining Date"
          name="facultyInfo.joiningDate"
          type="date"
          value={formData.facultyInfo.joiningDate}
          onChange={handleChange}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
    </Grid>
  );

  const renderParentInfo = () => (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Parent Information
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Occupation"
          name="parentInfo.occupation"
          value={formData.parentInfo.occupation}
          onChange={handleChange}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Alternate Phone"
          name="parentInfo.alternatePhone"
          value={formData.parentInfo.alternatePhone}
          onChange={handleChange}
          inputProps={{ maxLength: 10 }}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Address"
          name="parentInfo.address"
          value={formData.parentInfo.address}
          onChange={handleChange}
          multiline
          rows={3}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Relation</InputLabel>
          <Select
            name="parentInfo.relation"
            value={formData.parentInfo.relation}
            onChange={handleChange}
            label="Relation"
          >
            <MenuItem value="father">Father</MenuItem>
            <MenuItem value="mother">Mother</MenuItem>
            <MenuItem value="guardian">Guardian</MenuItem>
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );

  const renderReview = () => (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Review Information
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <Typography variant="subtitle1" gutterBottom>
          Basic Information
        </Typography>
        <Typography>Name: {formData.name}</Typography>
        <Typography>Email: {formData.email}</Typography>
        <Typography>Username: {formData.username}</Typography>
        <Typography>Role: {formData.role}</Typography>
        <Typography>Phone: {formData.phoneNumber}</Typography>
      </Grid>
      <Grid item xs={12}>
        <Divider sx={{ my: 2 }} />
      </Grid>
      {formData.role === 'student' && (
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            Student Information
          </Typography>
          <Typography>Roll No: {formData.studentInfo.rollNo}</Typography>
          <Typography>Admission No: {formData.studentInfo.admissionNo}</Typography>
          <Typography>Department: {formData.studentInfo.department}</Typography>
          <Typography>Semester: {formData.studentInfo.semester}</Typography>
          <Typography>Class: {formData.studentInfo.class}</Typography>
        </Grid>
      )}
      {formData.role === 'faculty' && (
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            Faculty Information
          </Typography>
          <Typography>Employee ID: {formData.facultyInfo.employeeId}</Typography>
          <Typography>Department: {formData.facultyInfo.department}</Typography>
          <Typography>Subjects: {formData.facultyInfo.subjects.join(', ')}</Typography>
          <Typography>Classes: {formData.facultyInfo.assignedClasses.join(', ')}</Typography>
        </Grid>
      )}
    </Grid>
  );

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return renderBasicInfo();
      case 1:
        switch (formData.role) {
          case 'student':
            return renderStudentInfo();
          case 'faculty':
            return renderFacultyInfo();
          case 'parent':
            return renderParentInfo();
          default:
            return null;
        }
      case 2:
        return renderReview();
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {user ? 'Edit User' : 'Add New User'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          <Box sx={{ mt: 4 }}>
            {getStepContent(activeStep)}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {activeStep > 0 && (
          <Button onClick={handleBack}>Back</Button>
        )}
        {activeStep < steps.length - 1 ? (
          <Button variant="contained" onClick={handleNext}>
            Next
          </Button>
        ) : (
          <Button variant="contained" onClick={handleSubmit}>
            {user ? 'Update' : 'Create'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default UserDialog; 