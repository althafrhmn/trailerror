const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const Event = require('../models/Event');

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Get all events
router.get('/', async (req, res) => {
  try {
    const events = await Event.find()
      .populate('createdBy', 'name')
      .sort({ startDate: 1 });
    
    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Create event (admin only)
router.post('/', authorize('admin'), [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('startDate').isISO8601().withMessage('Invalid start date'),
  body('endDate').isISO8601().withMessage('Invalid end date'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('type').isIn(['academic', 'cultural', 'sports', 'holiday', 'other']).withMessage('Invalid event type'),
  body('status').isIn(['upcoming', 'ongoing', 'completed', 'cancelled']).withMessage('Invalid status'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Validate dates
    const startDate = new Date(req.body.startDate);
    const endDate = new Date(req.body.endDate);
    if (endDate < startDate) {
      return res.status(400).json({
        success: false,
        error: 'End date must be after start date'
      });
    }

    const event = new Event({
      ...req.body,
      createdBy: req.user._id
    });

    await event.save();
    
    const populatedEvent = await Event.findById(event._id)
      .populate('createdBy', 'name');

    res.status(201).json({
      success: true,
      data: populatedEvent
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
});

// Update event (admin only)
router.put('/:id', authorize('admin'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Validate dates if they're being updated
    if (req.body.startDate && req.body.endDate) {
      const startDate = new Date(req.body.startDate);
      const endDate = new Date(req.body.endDate);
      if (endDate < startDate) {
        return res.status(400).json({
          success: false,
          error: 'End date must be after start date'
        });
      }
    }

    Object.assign(event, req.body);
    await event.save();

    const updatedEvent = await Event.findById(event._id)
      .populate('createdBy', 'name');

    res.json({
      success: true,
      data: updatedEvent
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
});

// Delete event (admin only)
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    await event.remove();
    
    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
});

// Register for event
router.post('/:id/register', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Check if user is already registered
    if (event.participants.includes(req.user._id)) {
      return res.status(400).json({
        success: false,
        error: 'Already registered for this event'
      });
    }

    event.participants.push(req.user._id);
    await event.save();

    res.json({
      success: true,
      message: 'Successfully registered for event'
    });
  } catch (error) {
    console.error('Event registration error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
});

// Unregister from event
router.post('/:id/unregister', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Check if user is registered
    if (!event.participants.includes(req.user._id)) {
      return res.status(400).json({
        success: false,
        error: 'Not registered for this event'
      });
    }

    event.participants = event.participants.filter(id => id.toString() !== req.user._id.toString());
    await event.save();

    res.json({
      success: true,
      message: 'Successfully unregistered from event'
    });
  } catch (error) {
    console.error('Event unregistration error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
});

module.exports = router; 