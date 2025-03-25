const express = require('express');
const router = express.Router();
const Event = require('../../models/Event');
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

// @route   GET /api/events
// @desc    Get all events
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const events = await Event.find().sort({ startDate: 1 });
    res.json(events);
  } catch (error) {
    console.error('Error in GET /api/events:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/events/:id
// @desc    Get event by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    console.error('Error in GET /api/events/:id:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/events
// @desc    Create a new event
// @access  Private (Admin only)
router.post('/', [
  auth,
  [
    check('title', 'Title is required').not().isEmpty(),
    check('description', 'Description is required').not().isEmpty(),
    check('startDate', 'Start date is required').not().isEmpty(),
    check('endDate', 'End date is required').not().isEmpty(),
    check('location', 'Location is required').not().isEmpty(),
    check('type', 'Type is required').not().isEmpty(),
    check('organizer', 'Organizer is required').not().isEmpty(),
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to create events' });
    }

    const {
      title,
      description,
      startDate,
      endDate,
      location,
      type,
      organizer,
      status = 'upcoming'
    } = req.body;

    const newEvent = new Event({
      title,
      description,
      startDate,
      endDate,
      location,
      type,
      organizer,
      status,
      createdBy: req.user.id
    });

    const event = await newEvent.save();
    res.json(event);
  } catch (error) {
    console.error('Error in POST /api/events:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/events/:id
// @desc    Update an event
// @access  Private (Admin only)
router.put('/:id', [
  auth,
  [
    check('title', 'Title is required').not().isEmpty(),
    check('description', 'Description is required').not().isEmpty(),
    check('startDate', 'Start date is required').not().isEmpty(),
    check('endDate', 'End date is required').not().isEmpty(),
    check('location', 'Location is required').not().isEmpty(),
    check('type', 'Type is required').not().isEmpty(),
    check('organizer', 'Organizer is required').not().isEmpty(),
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update events' });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const {
      title,
      description,
      startDate,
      endDate,
      location,
      type,
      organizer,
      status
    } = req.body;

    event.title = title;
    event.description = description;
    event.startDate = startDate;
    event.endDate = endDate;
    event.location = location;
    event.type = type;
    event.organizer = organizer;
    event.status = status;

    await event.save();
    res.json(event);
  } catch (error) {
    console.error('Error in PUT /api/events/:id:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/events/:id
// @desc    Delete an event
// @access  Private (Admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete events' });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    await event.remove();
    res.json({ message: 'Event removed' });
  } catch (error) {
    console.error('Error in DELETE /api/events/:id:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/events/:id/register
// @desc    Register for an event
// @access  Private
router.post('/:id/register', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is already registered
    if (event.attendees.includes(req.user.id)) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }

    event.attendees.push(req.user.id);
    await event.save();

    res.json(event);
  } catch (error) {
    console.error('Error in POST /api/events/:id/register:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/events/:id/unregister
// @desc    Unregister from an event
// @access  Private
router.post('/:id/unregister', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is registered
    const attendeeIndex = event.attendees.indexOf(req.user.id);
    if (attendeeIndex === -1) {
      return res.status(400).json({ message: 'Not registered for this event' });
    }

    event.attendees.splice(attendeeIndex, 1);
    await event.save();

    res.json(event);
  } catch (error) {
    console.error('Error in POST /api/events/:id/unregister:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 