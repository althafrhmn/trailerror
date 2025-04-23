// ... existing imports ...

const AttendanceNew = () => {
  // ... existing state declarations ...

  // Increase timeout and add retry logic for API calls
  const axiosInstance = axios.create({
    timeout: 30000, // Increase timeout to 30 seconds
    retries: 3,
    retryDelay: 1000
  });

  // Modified fetch leaves function with error handling
  const fetchActiveLeaves = async (date, className) => {
    try {
      const response = await axiosInstance.get(
        `http://localhost:5001/api/leaves/active`,
        {
          params: { date, className },
          headers: { 'Content-Type': 'application/json' }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching leaves:', error);
      toast.error('Unable to fetch leave records. Proceeding without leave data.');
      return []; // Return empty array to continue without leaves
    }
  };

  // Modified submit attendance function with better error handling
  const submitAttendance = async (attendanceData) => {
    const retryCount = 3;
    let attempt = 0;

    while (attempt < retryCount) {
      try {
        const response = await axiosInstance.post(
          'http://localhost:5001/api/attendance/submit',
          attendanceData,
          {
            headers: { 'Content-Type': 'application/json' }
          }
        );

        if (response.data.success) {
          toast.success('Attendance submitted successfully!');
          return true;
        }
        throw new Error('Submission failed');
      } catch (error) {
        attempt++;
        if (attempt === retryCount) {
          console.error('Final submission attempt failed:', error);
          toast.error(`Attendance submission failed: ${error.message}`);
          // Store failed submission in localStorage for retry
          const failedSubmissions = JSON.parse(localStorage.getItem('failedAttendanceSubmissions') || '[]');
          failedSubmissions.push({
            data: attendanceData,
            timestamp: new Date().toISOString(),
            error: error.message
          });
          localStorage.setItem('failedAttendanceSubmissions', JSON.stringify(failedSubmissions));
          return false;
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      }
    }
  };

  // Add offline support
  useEffect(() => {
    const handleOffline = () => {
      toast.warning('You are offline. Attendance will be saved locally.');
    };

    const handleOnline = async () => {
      toast.success('Back online. Syncing pending attendance...');
      const failedSubmissions = JSON.parse(localStorage.getItem('failedAttendanceSubmissions') || '[]');
      
      for (const submission of failedSubmissions) {
        const success = await submitAttendance(submission.data);
        if (success) {
          // Remove from failed submissions
          const remaining = failedSubmissions.filter(s => s.timestamp !== submission.timestamp);
          localStorage.setItem('failedAttendanceSubmissions', JSON.stringify(remaining));
        }
      }
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // ... rest of your component code ...
};

export default AttendanceNew;