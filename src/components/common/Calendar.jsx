import React, { useState, useCallback, useMemo } from 'react';
import './Calendar.css';
import { Card, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, IconButton, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

const Calendar = ({ events = [], onEventAdd, onEventEdit, onEventDelete, isEditable = false }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    date: new Date(),
    type: 'event',
  });

  const handleDateChange = useCallback((newDate) => {
    setSelectedDate(newDate);
  }, []);

  const handleOpenDialog = useCallback((event = null) => {
    if (event) {
      setSelectedEvent(event);
      setEventForm({
        title: event.title || '',
        description: event.description || '',
        date: new Date(event.date),
        type: event.type || 'event',
      });
    } else {
      setSelectedEvent(null);
      setEventForm({
        title: '',
        description: '',
        date: selectedDate,
        type: 'event',
      });
    }
    setOpenDialog(true);
  }, [selectedDate]);

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
    setSelectedEvent(null);
    setEventForm({
      title: '',
      description: '',
      date: new Date(),
      type: 'event',
    });
  }, []);

  const handleSubmit = async () => {
    if (!eventForm.title.trim()) return;

    try {
      const eventData = {
        ...eventForm,
        date: format(eventForm.date, 'yyyy-MM-dd'),
      };

      if (selectedEvent && onEventEdit) {
        await onEventEdit({ ...selectedEvent, ...eventData });
      } else if (onEventAdd) {
        await onEventAdd(eventData);
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error submitting event:', error);
      toast.error('Failed to save event');
    }
  };

  const handleDelete = useCallback((event) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      onEventDelete?.(event);
    }
  }, [onEventDelete]);

  const handleFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setEventForm(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const eventsForDate = useMemo(() => {
    if (!Array.isArray(events)) return [];
    
    return events.filter(event => {
      try {
        const eventDate = new Date(event.date);
        const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
        const eventDateStr = format(eventDate, 'yyyy-MM-dd');
        return eventDateStr === selectedDateStr;
      } catch (error) {
        console.error('Invalid date format for event:', event);
        return false;
      }
    });
  }, [events, selectedDate]);

  return (
    <Card className="p-4 shadow-lg rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-slate-800">Calendar</h2>
        {isEditable && (
          <IconButton 
            color="primary" 
            onClick={() => handleOpenDialog()}
            className="hover:bg-primary-light/10"
          >
            <AddIcon />
          </IconButton>
        )}
      </div>
      
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-1/2">
          <DateCalendar
            value={selectedDate}
            onChange={handleDateChange}
            className="w-full max-w-full"
          />
        </div>

        <div className="w-full md:w-1/2">
          <h3 className="text-lg font-medium text-slate-700 mb-2">
            Events for {format(selectedDate, 'MMMM d, yyyy')}
          </h3>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {eventsForDate.map((event) => (
              <div 
                key={event._id || event.id} 
                className="p-3 bg-secondary rounded-lg flex justify-between items-start hover:bg-secondary-light transition-colors duration-200"
              >
                <div>
                  <h4 className="font-medium text-slate-800">{event.title}</h4>
                  <p className="text-sm text-slate-600">{event.description}</p>
                  <span className="text-xs text-slate-500 mt-1 inline-block">
                    Type: {event.type}
                  </span>
                </div>
                {isEditable && (
                  <div className="flex space-x-1">
                    <IconButton 
                      size="small" 
                      onClick={() => handleOpenDialog(event)}
                      className="hover:bg-primary-light/10"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="error" 
                      onClick={() => handleDelete(event)}
                      className="hover:bg-red-50"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </div>
                )}
              </div>
            ))}
            {eventsForDate.length === 0 && (
              <p className="text-slate-500 text-center py-4 bg-secondary/50 rounded-lg">
                No events for this date
              </p>
            )}
          </div>
        </div>
      </div>

      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        className="rounded-lg"
      >
        <DialogTitle className="bg-primary text-white">
          {selectedEvent ? 'Edit Event' : 'Add New Event'}
        </DialogTitle>
        <DialogContent className="mt-4">
          <div className="space-y-4">
            <TextField
              fullWidth
              label="Title"
              name="title"
              value={eventForm.title}
              onChange={handleFormChange}
              required
              className="bg-white"
            />
            <TextField
              fullWidth
              label="Description"
              name="description"
              multiline
              rows={3}
              value={eventForm.description}
              onChange={handleFormChange}
              className="bg-white"
            />
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                name="type"
                value={eventForm.type}
                onChange={handleFormChange}
                label="Type"
                className="bg-white"
              >
                <MenuItem value="event">Event</MenuItem>
                <MenuItem value="exam">Exam</MenuItem>
                <MenuItem value="holiday">Holiday</MenuItem>
              </Select>
            </FormControl>
          </div>
        </DialogContent>
        <DialogActions className="p-4">
          <Button 
            onClick={handleCloseDialog}
            className="hover:bg-secondary"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={!eventForm.title.trim()}
            className="hover:bg-primary-dark"
          >
            {selectedEvent ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default Calendar;