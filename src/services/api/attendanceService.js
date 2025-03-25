import axiosInstance from './axiosConfig';

export const attendanceService = {
  // Save attendance for multiple students
  saveAttendance: async (attendanceData) => {
    try {
      const response = await axiosInstance.post('/api/attendance', attendanceData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get attendance by class and date range
  getAttendance: async (classId, startDate, endDate) => {
    try {
      const response = await axiosInstance.get('/api/attendance', {
        params: { class: classId, startDate, endDate }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get attendance for a specific student
  getStudentAttendance: async (studentId, startDate, endDate) => {
    try {
      const response = await axiosInstance.get(`/api/attendance/student/${studentId}`, {
        params: { startDate, endDate }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update attendance record
  updateAttendance: async (attendanceId, data) => {
    try {
      const response = await axiosInstance.put(`/api/attendance/${attendanceId}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get attendance statistics
  getStatistics: async (classId, startDate, endDate) => {
    try {
      const response = await axiosInstance.get('/api/attendance/statistics', {
        params: { class: classId, startDate, endDate }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default attendanceService; 