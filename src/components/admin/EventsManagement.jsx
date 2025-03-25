import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Event as EventIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { getEvents, createEvent, updateEvent, deleteEvent } from '../../services/eventService';

const EventDialog = ({ open, onClose, event }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: null,
    endDate: null,
    location: '',
    type: '',
    organizer: '',
    status: 'upcoming'
  });

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        startDate: event.startDate ? new Date(event.startDate) : null,
        endDate: event.endDate ? new Date(event.endDate) : null,
        location: event.location || '',
        type: event.type || '',
        organizer: event.organizer || '',
        status: event.status || 'upcoming'
      });
    } else {
      setFormData({
        title: '',
        description: '',
        startDate: null,
        endDate: null,
        location: '',
        type: '',
        organizer: '',
        status: 'upcoming'
      });
    }
  }, [event]);

  const handleChange = (field) => (e) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleDateChange = (field) => (date) => {
    setFormData(prev => ({
      ...prev,
      [field]: date
    }));
  };

  const handleSubmit = () => {
    // Validate form data
    if (!formData.title || !formData.startDate || !formData.endDate || !formData.location || !formData.type) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.endDate < formData.startDate) {
      toast.error('End date must be after start date');
      return;
    }

    onClose(formData);
  };

  return (
    <Dialog open={open} onClose={() => onClose(null)} maxWidth="sm" fullWidth>
      <DialogTitle>{event ? 'Edit Event' : 'Add New Event'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Title"
            value={formData.title}
            onChange={handleChange('title')}
            required
          />
          <TextField
            label="Description"
            value={formData.description}
            onChange={handleChange('description')}
            multiline
            rows={3}
          />
          <DateTimePicker
            label="Start Date & Time"
            value={formData.startDate}
            onChange={handleDateChange('startDate')}
            slots={{
              textField: (params) => (
                <TextField
                  {...params}
                  required
                  fullWidth
                  sx={{ zIndex: 0 }}
                />
              )
            }}
            slotProps={{
              popper: {
                sx: {
                  zIndex: 9999
                }
              }
            }}
          />
          <DateTimePicker
            label="End Date & Time"
            value={formData.endDate}
            onChange={handleDateChange('endDate')}
            slots={{
              textField: (params) => (
                <TextField
                  {...params}
                  required
                  fullWidth
                  sx={{ zIndex: 0 }}
                />
              )
            }}
            slotProps={{
              popper: {
                sx: {
                  zIndex: 9999
                }
              }
            }}
          />
          <TextField
            label="Location"
            value={formData.location}
            onChange={handleChange('location')}
            required
          />
          <FormControl required>
            <InputLabel>Type</InputLabel>
            <Select
              value={formData.type}
              onChange={handleChange('type')}
              label="Type"
            >
              <MenuItem value="academic">Academic</MenuItem>
              <MenuItem value="cultural">Cultural</MenuItem>
              <MenuItem value="sports">Sports</MenuItem>
              <MenuItem value="holiday">Holiday</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Organizer"
            value={formData.organizer}
            onChange={handleChange('organizer')}
          />
          {event && (
            <FormControl>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                onChange={handleChange('status')}
                label="Status"
              >
                <MenuItem value="upcoming">Upcoming</MenuItem>
                <MenuItem value="ongoing">Ongoing</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(null)}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          {event ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const EventsManagement = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const filterEvents = (events) => {
    if (!Array.isArray(events)) {
      console.error('Events is not an array:', events);
      return [];
    }

    const now = new Date();
    console.log('Filtering events for tab:', selectedTab);
    console.log('Current events:', events);

    try {
      const filtered = events.filter(event => {
        if (!event || !event.startDate || !event.endDate) {
          console.warn('Event missing required fields:', event);
          return false;
        }

        const start = new Date(event.startDate);
        const end = new Date(event.endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          console.warn('Invalid date format:', { start, end, event });
          return false;
        }

        switch (selectedTab) {
          case 0: // Upcoming
            return start > now;
          case 1: // Ongoing
            return start <= now && end >= now;
          case 2: // Past
            return end < now;
          default:
            return true;
        }
      });

      console.log('Filtered events:', filtered);
      return filtered;
    } catch (error) {
      console.error('Error filtering events:', error);
      return [];
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching events...');
      const response = await getEvents();
      console.log('Events API response:', response);
      
      if (!response) {
        throw new Error('No response from server');
      }

      if (response.success && Array.isArray(response.data)) {
        const validEvents = response.data.filter(event => 
          event && 
          event.title && 
          event.startDate && 
          event.endDate
        );

        if (validEvents.length === 0 && response.data.length > 0) {
          console.warn('No valid events in response:', response.data);
          setError('No valid events found');
        }

        console.log('Setting events state with valid events:', validEvents);
        setEvents(validEvents);
      } else {
        const errorMessage = response.error || 'Failed to fetch events';
        console.error('Failed to fetch events:', errorMessage);
        setError(errorMessage);
        setEvents([]); // Ensure events is always an array
        toast.error(errorMessage);
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to fetch events';
      console.error('Error in fetchEvents:', error);
      setError(errorMessage);
      setEvents([]); // Ensure events is always an array
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleAddEvent = () => {
    setSelectedEvent(null);
    setOpenDialog(true);
  };

  const handleEditEvent = (event) => {
    setSelectedEvent(event);
    setOpenDialog(true);
  };

  const handleDeleteEvent = async (event) => {
    if (window.confirm(`Are you sure you want to delete "${event.title}"?`)) {
      try {
        const response = await deleteEvent(event._id);
        if (response.success) {
          toast.success('Event deleted successfully');
          fetchEvents();
        } else {
          throw new Error(response.error || 'Failed to delete event');
        }
      } catch (error) {
        console.error('Error deleting event:', error);
        toast.error(error.message || 'Failed to delete event');
      }
    }
  };

  const handleDialogClose = async (eventData) => {
    if (eventData) {
      setLoading(true);
      try {
        const processedEventData = {
          ...eventData,
          startDate: new Date(eventData.startDate).toISOString(),
          endDate: new Date(eventData.endDate).toISOString()
        };

        console.log('Submitting event data:', processedEventData);
        const response = selectedEvent
          ? await updateEvent(selectedEvent._id, processedEventData)
          : await createEvent(processedEventData);

        console.log('Save event response:', response);

        if (response.success) {
          toast.success(selectedEvent ? 'Event updated successfully' : 'Event created successfully');
          setOpenDialog(false);
          setSelectedEvent(null);
          
          await fetchEvents();
          setTimeout(fetchEvents, 1000);
        } else {
          throw new Error(response.error || `Failed to ${selectedEvent ? 'update' : 'create'} event`);
        }
      } catch (error) {
        console.error('Error saving event:', error);
        toast.error(error.message || `Failed to ${selectedEvent ? 'update' : 'create'} event`);
      } finally {
        setLoading(false);
      }
    } else {
      setOpenDialog(false);
      setSelectedEvent(null);
    }
  };

  const getStatusChipColor = (status) => {
    switch (status.toLowerCase()) {
      case 'upcoming':
        return 'primary';
      case 'ongoing':
        return 'success';
      case 'completed':
        return 'default';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" color="text.primary">
            Events Management
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddEvent}
          >
            Add Event
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Card sx={{ mb: 4, borderRadius: 2 }}>
          <CardContent>
            <Tabs
              value={selectedTab}
              onChange={(e, newValue) => setSelectedTab(newValue)}
              sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
            >
              <Tab label={`Upcoming Events (${events.filter(e => new Date(e.startDate) > new Date()).length})`} />
              <Tab label={`Ongoing Events (${events.filter(e => {
                const now = new Date();
                const start = new Date(e.startDate);
                const end = new Date(e.endDate);
                return start <= now && end >= now;
              }).length})`} />
              <Tab label={`Past Events (${events.filter(e => new Date(e.endDate) < new Date()).length})`} />
            </Tabs>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer component={Paper} sx={{ maxHeight: 440, overflow: 'auto' }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Event Title</TableCell>
                      <TableCell>Date & Time</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Organizer</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {events.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          No events found. Click "Add Event" to create one.
                        </TableCell>
                      </TableRow>
                    ) : filterEvents(events).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          No {selectedTab === 0 ? 'upcoming' : selectedTab === 1 ? 'ongoing' : 'past'} events found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filterEvents(events).map((event) => (
                        <TableRow key={event._id || event.id} hover>
                          <TableCell>{event.title}</TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CalendarIcon fontSize="small" />
                                Start: {format(new Date(event.startDate), 'PPp')}
                              </Typography>
                              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CalendarIcon fontSize="small" />
                                End: {format(new Date(event.endDate), 'PPp')}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LocationIcon fontSize="small" />
                              {event.location}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={event.type}
                              color="primary"
                              size="small"
                              variant="outlined"
                              icon={<EventIcon />}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={event.status}
                              color={getStatusChipColor(event.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <PersonIcon fontSize="small" />
                              {event.organizer}
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Edit Event">
                              <IconButton
                                size="small"
                                onClick={() => handleEditEvent(event)}
                                color="primary"
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Event">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteEvent(event)}
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

      <EventDialog
        open={openDialog}
        onClose={handleDialogClose}
        event={selectedEvent}
      />
    </Box>
  );
};

export default EventsManagement; 