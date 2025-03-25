const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const Message = require('../models/Message');
const User = require('../models/User');

const router = express.Router();

// Get all messages for the current user
router.get('/', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user._id },
        { receiver: req.user._id }
      ]
    })
    .populate('sender', 'name role')
    .populate('receiver', 'name role')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch messages',
      data: []
    });
  }
});

// Send a new message
router.post('/', auth, [
  body('receiver').notEmpty().withMessage('Receiver is required'),
  body('content').notEmpty().withMessage('Message content is required'),
  body('subject').notEmpty().withMessage('Subject is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg,
        data: null
      });
    }

    const { receiver, content, subject, type = 'user' } = req.body;

    // Verify receiver exists
    const receiverUser = await User.findById(receiver);
    if (!receiverUser) {
      return res.status(404).json({
        success: false,
        error: 'Receiver not found',
        data: null
      });
    }

    const message = new Message({
      sender: req.user._id,
      receiver,
      content,
      subject,
      type,
    });

    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name role')
      .populate('receiver', 'name role');

    res.status(201).json({
      success: true,
      data: populatedMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message',
      data: null
    });
  }
});

// Mark message as read
router.put('/:messageId/read', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found',
        data: null
      });
    }

    if (message.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to mark this message as read',
        data: null
      });
    }

    message.status = 'read';
    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name role')
      .populate('receiver', 'name role');

    res.json({
      success: true,
      data: populatedMessage
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark message as read',
      data: null
    });
  }
});

// Delete a message
router.delete('/:messageId', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found',
        data: null
      });
    }

    // Only sender or receiver can delete the message
    if (message.sender.toString() !== req.user._id.toString() && 
        message.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this message',
        data: null
      });
    }

    await Message.findByIdAndDelete(req.params.messageId);
    res.json({
      success: true,
      data: { id: req.params.messageId, message: 'Message deleted successfully' }
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete message',
      data: null
    });
  }
});

// Test endpoint for connectivity checks
router.get('/test-connection', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Message API is operational',
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error in test endpoint'
    });
  }
});

module.exports = router; 