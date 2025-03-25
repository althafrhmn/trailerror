import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Check as ApproveIcon,
  Close as RejectIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  CalendarMonth as CalendarIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { toast } from 'react-hot-toast';
import { authService } from '../../services/api';
import axios from 'axios';

// TabPanel component for tab content
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`leave-tabpanel-${index}`}
      aria-labelledby={`leave-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const LeaveRequests = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [responseDialog, setResponseDialog] = useState(false);
  const [responseType, setResponseType] = useState('');
  const [comments, setComments] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    leaveType: ''
  });

  const currentUser = authService.getCurrentUser();

  // Fetch leave requests
  useEffect(() => {
    const fetchLeaveRequests = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

        // Fetch leave requests from API
        const response = await axios.get('http://localhost:5000/api/leaves', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.data.success) {
          setLeaveRequests(response.data.data);
          setFilteredRequests(response.data.data);
        } else {
          throw new Error(response.data.error || 'Failed to fetch leave requests');
        }
      } catch (error) {
        console.error('Error fetching leave requests:', error);
        setError(error.message || 'Failed to load leave requests');
        
        // Use mock data for demo purposes if API fails
        setLeaveRequests(generateMockLeaveRequests());
        setFilteredRequests(generateMockLeaveRequests());
      } finally {
        setLoading(false);
      }
    };

    fetchLeaveRequests();
  }, []);

  // Generate mock leave requests data for demo/fallback
  const generateMockLeaveRequests = () => {
    return [
      {
        _id: 'leave1',
        student: { _id: 'student1', name: 'John Doe', email: 'john@example.com' },
        faculty: { _id: currentUser._id, name: currentUser.name },
        type: 'Medical',
        subject: 'Medical Leave Request',
        description: 'I need a medical leave due to fever and cold.',
        startDate: new Date(2024, 2, 10), // March 10, 2024
        endDate: new Date(2024, 2, 12), // March 12, 2024
        status: 'pending',
        createdAt: new Date(2024, 2, 9) // March 9, 2024
      },
      {
        _id: 'leave2',
        student: { _id: 'student2', name: 'Jane Smith', email: 'jane@example.com' },
        faculty: { _id: currentUser._id, name: currentUser.name },
        type: 'Personal',
        subject: 'Family Function',
        description: 'I need to attend a family function.',
        startDate: new Date(2024, 2, 15), // March 15, 2024
        endDate: new Date(2024, 2, 17), // March 17, 2024
        status: 'approved',
        comments: 'Approved. Have a good time!',
        createdAt: new Date(2024, 2, 8) // March 8, 2024
      },
      {
        _id: 'leave3',
        student: { _id: 'student3', name: 'Alex Johnson', email: 'alex@example.com' },
        faculty: { _id: currentUser._id, name: currentUser.name },
        type: 'Exam',
        subject: 'Competitive Exam Preparation',
        description: 'I need leave to prepare for a competitive exam.',
        startDate: new Date(2024, 2, 20), // March 20, 2024
        endDate: new Date(2024, 2, 23), // March 23, 2024
        status: 'rejected',
        comments: 'Rejected as exam preparation can be done alongside regular classes.',
        createdAt: new Date(2024, 2, 7) // March 7, 2024
      }
    ];
  };

  // Filter leave requests based on tab
  useEffect(() => {
    if (leaveRequests.length > 0) {
      let filtered = [...leaveRequests];
      
      // Filter by tab
      if (tabValue === 0) {
        // All requests - no filtering
      } else if (tabValue === 1) {
        filtered = filtered.filter(leave => leave.status === 'pending');
      } else if (tabValue === 2) {
        filtered = filtered.filter(leave => leave.status === 'approved');
      } else if (tabValue === 3) {
        filtered = filtered.filter(leave => leave.status === 'rejected');
      }
      
      // Apply search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(leave => 
          leave.student.name.toLowerCase().includes(query) ||
          leave.subject.toLowerCase().includes(query) ||
          leave.type.toLowerCase().includes(query) ||
          leave.description.toLowerCase().includes(query)
        );
      }
      
      // Apply filters
      if (filters.leaveType) {
        filtered = filtered.filter(leave => leave.type === filters.leaveType);
      }
      
      if (filters.startDate) {
        filtered = filtered.filter(leave => new Date(leave.startDate) >= new Date(filters.startDate));
      }
      
      if (filters.endDate) {
        filtered = filtered.filter(leave => new Date(leave.endDate) <= new Date(filters.endDate));
      }
      
      setFilteredRequests(filtered);
    }
  }, [leaveRequests, tabValue, searchQuery, filters]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Open response dialog
  const handleResponseClick = (leave, type) => {
    setSelectedLeave(leave);
    setResponseType(type);
    setComments('');
    setResponseDialog(true);
  };

  // Close response dialog
  const handleCloseDialog = () => {
    setResponseDialog(false);
    setSelectedLeave(null);
    setResponseType('');
    setComments('');
  };

  // Handle leave response submit
  const handleResponseSubmit = async () => {
    try {
      if (!selectedLeave) return;
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const status = responseType === 'approve' ? 'approved' : 'rejected';
      
      // API call to update leave status
      const response = await axios.put(`http://localhost:5000/api/leaves/${selectedLeave._id}`, {
        status,
        comments
          }, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

      if (response.data.success) {
        // Update local state
        const updatedLeaves = leaveRequests.map(leave => {
          if (leave._id === selectedLeave._id) {
            return {
              ...leave,
              status,
              comments
            };
          }
          return leave;
        });
        
        setLeaveRequests(updatedLeaves);
        toast.success(`Leave request ${status} successfully`);
      } else {
        throw new Error(response.data.error || `Failed to ${status} leave request`);
      }
    } catch (error) {
      console.error(`Error ${responseType === 'approve' ? 'approving' : 'rejecting'} leave:`, error);
      toast.error(error.message || `Failed to ${responseType} leave request`);
      
      // For demo, update local state even if API fails
      const updatedLeaves = leaveRequests.map(leave => {
        if (leave._id === selectedLeave._id) {
          return {
            ...leave,
            status: responseType === 'approve' ? 'approved' : 'rejected',
            comments
          };
        }
        return leave;
      });
      
      setLeaveRequests(updatedLeaves);
    } finally {
      handleCloseDialog();
    }
  };

  // Format date function
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Get status chip based on leave status
  const getStatusChip = (status) => {
    let color = 'default';
    let label = status;
    
    switch (status) {
      case 'pending':
        color = 'warning';
        label = 'Pending';
        break;
      case 'approved':
        color = 'success';
        label = 'Approved';
        break;
      case 'rejected':
        color = 'error';
        label = 'Rejected';
        break;
      default:
        break;
    }
    
    return <Chip label={label} color={color} size="small" />;
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      startDate: null,
      endDate: null,
      leaveType: ''
    });
    setSearchQuery('');
  };

  // Leave type options
  const leaveTypes = ['Medical', 'Personal', 'Family', 'Exam', 'Event', 'Other'];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
              <CalendarIcon sx={{ mr: 1 }} /> Student Leave Requests
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <TextField
                placeholder="Search leaves..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="small"
                sx={{ width: { xs: '100%', sm: '250px' } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
              />
              <IconButton onClick={() => setShowFilters(!showFilters)} color={showFilters ? 'primary' : 'default'}>
                <FilterIcon />
              </IconButton>
            </Box>
          </Grid>
        </Grid>

        {/* Filter section */}
        {showFilters && (
          <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid #e0e0e0' }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Leave Type</InputLabel>
                  <Select
                    value={filters.leaveType}
                    label="Leave Type"
                    onChange={(e) => setFilters({ ...filters, leaveType: e.target.value })}
                  >
                    <MenuItem value="">All Types</MenuItem>
                    {leaveTypes.map((type) => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4} md={3}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="From Date"
                    value={filters.startDate}
                    onChange={(date) => setFilters({ ...filters, startDate: date })}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true
                      }
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={4} md={3}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="To Date"
                    value={filters.endDate}
                    onChange={(date) => setFilters({ ...filters, endDate: date })}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true
                      }
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} md={3}>
                <Button variant="outlined" onClick={resetFilters} fullWidth>
                  Reset Filters
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="leave request tabs">
            <Tab label={`All (${leaveRequests.length})`} />
            <Tab label={`Pending (${leaveRequests.filter(leave => leave.status === 'pending').length})`} />
            <Tab label={`Approved (${leaveRequests.filter(leave => leave.status === 'approved').length})`} />
            <Tab label={`Rejected (${leaveRequests.filter(leave => leave.status === 'rejected').length})`} />
          </Tabs>
                  </Box>

        <TabPanel value={tabValue} index={0}>
          <LeaveList 
            leaves={filteredRequests} 
            handleResponseClick={handleResponseClick} 
            formatDate={formatDate}
            getStatusChip={getStatusChip}
          />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <LeaveList 
            leaves={filteredRequests} 
            handleResponseClick={handleResponseClick} 
            formatDate={formatDate}
            getStatusChip={getStatusChip}
          />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <LeaveList 
            leaves={filteredRequests} 
            handleResponseClick={handleResponseClick} 
            formatDate={formatDate}
            getStatusChip={getStatusChip}
          />
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          <LeaveList 
            leaves={filteredRequests} 
            handleResponseClick={handleResponseClick} 
            formatDate={formatDate}
            getStatusChip={getStatusChip}
          />
        </TabPanel>
      </Paper>

      {/* Response Dialog */}
      <Dialog open={responseDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {responseType === 'approve' ? 'Approve Leave Request' : 'Reject Leave Request'}
        </DialogTitle>
        <DialogContent>
          {selectedLeave && (
            <>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1">Leave Details:</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Student:</Typography>
                    <Typography variant="body1">{selectedLeave.student.name}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Type:</Typography>
                    <Typography variant="body1">{selectedLeave.type}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Subject:</Typography>
                    <Typography variant="body1">{selectedLeave.subject}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">From:</Typography>
                    <Typography variant="body1">{formatDate(selectedLeave.startDate)}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">To:</Typography>
                    <Typography variant="body1">{formatDate(selectedLeave.endDate)}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Reason:</Typography>
                    <Typography variant="body1">{selectedLeave.description}</Typography>
                  </Grid>
                </Grid>
              </Box>
              <Divider sx={{ my: 2 }} />
          <TextField
                label="Comments"
            multiline
            rows={4}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                fullWidth
                placeholder={`Add your comments for ${responseType === 'approve' ? 'approval' : 'rejection'}...`}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleResponseSubmit} 
            color={responseType === 'approve' ? 'success' : 'error'}
            variant="contained"
            startIcon={responseType === 'approve' ? <ApproveIcon /> : <RejectIcon />}
          >
            {responseType === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Leave list component
const LeaveList = ({ leaves, handleResponseClick, formatDate, getStatusChip }) => {
  if (leaves.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No leave requests found matching your criteria.
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {leaves.map((leave) => (
        <Grid item xs={12} md={6} lg={4} key={leave._id}>
          <Card 
            sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
              }
            }}
          >
            <CardContent sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" noWrap sx={{ maxWidth: '70%' }}>
                  {leave.subject}
                </Typography>
                {getStatusChip(leave.status)}
              </Box>
              
              <Typography variant="body2" color="text.secondary">
                Student:
              </Typography>
              <Typography variant="body1" gutterBottom>
                {leave.student.name}
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    From:
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(leave.startDate)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    To:
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(leave.endDate)}
                  </Typography>
                </Box>
              </Box>
              
              <Chip 
                label={leave.type} 
                size="small" 
                sx={{ mb: 2 }} 
              />
              
              <Typography variant="body2" color="text.secondary">
                Reason:
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  mt: 0.5, 
                  maxHeight: '80px', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical'
                }}
              >
                {leave.description}
              </Typography>
              
              {leave.comments && (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Comments:
                  </Typography>
                  <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                    "{leave.comments}"
                  </Typography>
                </>
              )}
            </CardContent>
            
            <CardActions sx={{ p: 2, pt: 0 }}>
              {leave.status === 'pending' ? (
                <>
                  <Button 
                    size="small" 
                    startIcon={<ApproveIcon />} 
                    color="success" 
                    variant="outlined"
                    onClick={() => handleResponseClick(leave, 'approve')}
                    sx={{ flexGrow: 1 }}
                  >
                    Approve
                  </Button>
                  <Button 
                    size="small" 
                    startIcon={<RejectIcon />} 
                    color="error" 
                    variant="outlined"
                    onClick={() => handleResponseClick(leave, 'reject')}
                    sx={{ flexGrow: 1 }}
                  >
                    Reject
                  </Button>
                </>
              ) : (
                <Button 
                  size="small" 
                  variant="outlined" 
                  color={leave.status === 'approved' ? 'success' : 'error'}
                  fullWidth
                  disabled
                >
                  {leave.status === 'approved' ? 'Approved' : 'Rejected'}
                </Button>
              )}
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default LeaveRequests; 