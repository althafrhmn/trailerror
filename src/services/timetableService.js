import axiosInstance from './api/axiosConfig';

export const getTimetable = async (classId, semester) => {
  try {
    if (!classId || !semester) {
      throw new Error('Class and semester are required');
    }

    const response = await axiosInstance.get(`/timetable/${classId}/${semester}`);
    
    if (response.success && response.data) {
      const schedule = {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: []
      };

      if (response.data.schedule) {
        Object.keys(schedule).forEach(day => {
          schedule[day] = Array.isArray(response.data.schedule[day]) 
            ? response.data.schedule[day] 
            : [];
        });
      }

      return {
        success: true,
        data: {
          ...response.data,
          schedule
        }
      };
    }

    return {
      success: true,
      data: {
        class: classId,
        semester: semester,
        schedule: {
          monday: [],
          tuesday: [],
          wednesday: [],
          thursday: [],
          friday: []
        }
      }
    };
  } catch (error) {
    console.error('Error fetching timetable:', error);
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new Error('You do not have permission to view this timetable');
    }
    
    if (error.response?.status === 404) {
      return {
        success: true,
        data: {
          class: classId,
          semester: semester,
          schedule: {
            monday: [],
            tuesday: [],
            wednesday: [],
            thursday: [],
            friday: []
          }
        }
      };
    }

    throw error;
  }
};

export const saveTimetable = async (timetableData) => {
  try {
    if (!timetableData) {
      throw new Error('Timetable data is required');
    }

    const { class: className, semester, schedule } = timetableData;
    if (!className || !semester || !schedule) {
      throw new Error('Class, semester and schedule are required');
    }

    if (!schedule.day || !schedule.subject || !schedule.faculty || !schedule.startTime || !schedule.endTime || !schedule.room) {
      throw new Error('Invalid schedule data. All fields are required');
    }

    const formattedData = {
      class: className,
      semester: parseInt(semester),
      department: timetableData.department || className,
      schedule: {
        [schedule.day.toLowerCase()]: [{
          subject: schedule.subject,
          faculty: schedule.faculty,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          room: schedule.room
        }]
      }
    };

    let response;
    try {
      const existingTimetable = await getTimetable(className, semester);
      if (existingTimetable.success && existingTimetable.data) {
        const day = schedule.day.toLowerCase();
        const updatedSchedule = {
          ...existingTimetable.data.schedule,
          [day]: [
            ...(existingTimetable.data.schedule[day] || []),
            {
              subject: schedule.subject,
              faculty: schedule.faculty,
              startTime: schedule.startTime,
              endTime: schedule.endTime,
              room: schedule.room
            }
          ]
        };

        response = await axiosInstance.put(`/timetable/${className}/${semester}`, {
          ...formattedData,
          schedule: updatedSchedule
        });
      }
    } catch (error) {
      response = await axiosInstance.post('/timetable', formattedData);
    }

    if (!response || !response.success) {
      throw new Error(response?.error || 'Failed to save timetable');
    }

    return response;
  } catch (error) {
    console.error('Error saving timetable:', error);
    
    if (error.response?.status === 401) {
      throw new Error('Your session has expired. Please log in again');
    }
    
    if (error.response?.status === 403) {
      throw new Error('You do not have permission to modify timetables');
    }

    throw error;
  }
};

export const deleteTimetable = async (className, semester, day, index) => {
  try {
    if (!className || !semester || !day || index === undefined) {
      throw new Error('Class, semester, day and index are required');
    }

    const response = await axiosInstance.delete(`/timetable/${className}/${semester}/${day}/${index}`);
    
    if (!response || !response.success) {
      throw new Error(response?.error || 'Failed to delete timetable');
    }

    return response;
  } catch (error) {
    console.error('Error deleting timetable:', error);
    
    if (error.response?.status === 401) {
      throw new Error('Your session has expired. Please log in again');
    }
    
    if (error.response?.status === 403) {
      throw new Error('You do not have permission to delete timetables');
    }

    throw error;
  }
}; 