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
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { toast } from 'react-hot-toast';

const EventDialog = ({ open, onClose, event }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: null,
    endDate: null,
    location: '',
    type: 'other',
    organizer: '',
    status: 'upcoming',
  });

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        startDate: event.startDate ? new Date(event.startDate) : null,
        endDate: event.endDate ? new Date(event.endDate) : null,
        location: event.location || '',
        type: event.type || 'other',
        organizer: event.organizer || '',
        status: event.status || 'upcoming',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        startDate: null,
        endDate: null,
        location: '',
        type: 'other',
        organizer: '',
        status: 'upcoming',
      });
    }
  }, [event]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = () => {
    // Validate required fields
    if (!formData.title || !formData.startDate || !formData.endDate || !formData.location) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate dates
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      toast.error('End date must be after start date');
      return;
    }

    onClose(formData);
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="md" fullWidth>
      <DialogTitle>{event ? 'Edit Event' : 'Add New Event'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Event Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              error={!formData.title}
              helperText={!formData.title ? 'Title is required' : ''}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              multiline
              rows={4}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <DateTimePicker
              label="Start Date & Time"
              value={formData.startDate}
              onChange={(newValue) => setFormData(prev => ({ ...prev, startDate: newValue }))}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  fullWidth 
                  required 
                  error={!formData.startDate}
                  helperText={!formData.startDate ? 'Start date is required' : ''}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <DateTimePicker
              label="End Date & Time"
              value={formData.endDate}
              onChange={(newValue) => setFormData(prev => ({ ...prev, endDate: newValue }))}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  fullWidth 
                  required
                  error={!formData.endDate}
                  helperText={!formData.endDate ? 'End date is required' : ''}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              error={!formData.location}
              helperText={!formData.location ? 'Location is required' : ''}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Organizer"
              name="organizer"
              value={formData.organizer}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Event Type</InputLabel>
              <Select
                name="type"
                value={formData.type}
                onChange={handleChange}
                label="Event Type"
              >
                <MenuItem value="academic">Academic</MenuItem>
                <MenuItem value="cultural">Cultural</MenuItem>
                <MenuItem value="sports">Sports</MenuItem>
                <MenuItem value="holiday">Holiday</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={formData.status}
                onChange={handleChange}
                label="Status"
              >
                <MenuItem value="upcoming">Upcoming</MenuItem>
                <MenuItem value="ongoing">Ongoing</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}>
          {event ? 'Update' : 'Create'} Event
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EventDialog; 