import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Stack,
  IconButton,
  Tooltip,
  Link,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  AttachFile as AttachmentIcon,
} from '@mui/icons-material';

const LeaveApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [comments, setComments] = useState('');
  const [actionType, setActionType] = useState(null);

  // Fetch leave applications
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5001/api/leave-applications/faculty/applications', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch applications');
        }

        setApplications(result.data);
      } catch (error) {
        console.error('Error fetching applications:', error);
        setError(error.message || 'Failed to load applications');
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const handleViewApplication = (application) => {
    setSelectedApplication(application);
    setViewDialogOpen(true);
  };

  const handleAction = (application, type) => {
    setSelectedApplication(application);
    setActionType(type);
    setActionDialogOpen(true);
  };

  const handleSubmitAction = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/leave-applications/${selectedApplication._id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: actionType === 'approve' ? 'Approved' : 'Rejected',
          comments
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update application');
      }

      // Update applications list
      setApplications(apps => apps.map(app => 
        app._id === result.data._id ? result.data : app
      ));

      setActionDialogOpen(false);
      setComments('');
      setActionType(null);
    } catch (error) {
      console.error('Error updating application:', error);
      setError(error.message || 'Failed to update application');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved':
        return 'success';
      case 'Rejected':
        return 'error';
      default:
        return 'warning';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Leave Applications
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Student</TableCell>
              <TableCell>Subject</TableCell>
              <TableCell>Leave Type</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {applications.map((application) => (
              <TableRow key={application._id}>
                <TableCell>{application.student.name}</TableCell>
                <TableCell>{application.subject}</TableCell>
                <TableCell>{application.leaveType}</TableCell>
                <TableCell>
                  {new Date(application.fromDate).toLocaleDateString()} - 
                  {new Date(application.toDate).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={application.status}
                    color={getStatusColor(application.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => handleViewApplication(application)}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    
                    {application.status === 'Pending' && (
                      <>
                        <Tooltip title="Approve">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleAction(application, 'approve')}
                          >
                            <ApproveIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reject">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleAction(application, 'reject')}
                          >
                            <RejectIcon />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* View Application Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Leave Application Details</DialogTitle>
        <DialogContent>
          {selectedApplication && (
            <Stack spacing={2} sx={{ mt: 2 }}>
              <Typography variant="subtitle2">
                From: {selectedApplication.student.name} ({selectedApplication.student.email})
              </Typography>
              
              <Typography variant="h6">{selectedApplication.subject}</Typography>
              
              <Box>
                <Typography variant="subtitle2" gutterBottom>Duration:</Typography>
                <Typography>
                  {new Date(selectedApplication.fromDate).toLocaleDateString()} to{' '}
                  {new Date(selectedApplication.toDate).toLocaleDateString()}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>Leave Type:</Typography>
                <Typography>{selectedApplication.leaveType}</Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>Content:</Typography>
                <Typography
                  sx={{
                    whiteSpace: 'pre-wrap',
                    bgcolor: 'grey.50',
                    p: 2,
                    borderRadius: 1
                  }}
                >
                  {selectedApplication.content}
                </Typography>
              </Box>

              {selectedApplication.attachments?.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Attachments:
                  </Typography>
                  <Stack spacing={1}>
                    {selectedApplication.attachments.map((file, index) => (
                      <Link
                        key={index}
                        href={`http://localhost:5001/${file.path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          color: 'primary.main',
                          textDecoration: 'none',
                          '&:hover': {
                            textDecoration: 'underline'
                          }
                        }}
                      >
                        <AttachmentIcon fontSize="small" />
                        {file.filename}
                      </Link>
                    ))}
                  </Stack>
                </Box>
              )}

              {selectedApplication.status !== 'Pending' && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Status: 
                    <Chip 
                      label={selectedApplication.status}
                      color={getStatusColor(selectedApplication.status)}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                  {selectedApplication.comments && (
                    <Typography
                      sx={{
                        mt: 1,
                        p: 2,
                        bgcolor: 'grey.50',
                        borderRadius: 1
                      }}
                    >
                      {selectedApplication.comments}
                    </Typography>
                  )}
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Action Dialog */}
      <Dialog
        open={actionDialogOpen}
        onClose={() => setActionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {actionType === 'approve' ? 'Approve' : 'Reject'} Leave Application
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Comments"
            multiline
            rows={4}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            sx={{ mt: 2 }}
            placeholder={`Add your comments for ${actionType === 'approve' ? 'approval' : 'rejection'}...`}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSubmitAction}
            variant="contained"
            color={actionType === 'approve' ? 'success' : 'error'}
          >
            {actionType === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LeaveApplications; 