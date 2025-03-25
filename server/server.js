require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dns = require('dns');

// Import routes
const authRoutes = require('./routes/auth');
const attendanceRoutes = require('./routes/attendance');
const userRoutes = require('./routes/users');
const eventRoutes = require('./routes/events');
const timetableRoutes = require('./routes/timetable');
const messageRoutes = require('./routes/messages');
const classRoutes = require('./routes/classes');
const studentRoutes = require('./routes/students');
const leaveRoutes = require('./routes/leaves');
const facultyRoutes = require('./routes/faculty');

const app = express();

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/faculty', facultyRoutes);

// MongoDB Connection with improved retry logic
const connectDB = async (retries = 5) => {
  try {
    // Set DNS lookup options
    dns.setDefaultResultOrder('ipv4first');

    // Extract the hostname from MONGODB_URI
    const uri = process.env.MONGODB_URI;
    
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 60000,
      family: 4,
      retryWrites: true,
      connectTimeoutMS: 30000,
    });

    console.log('MongoDB Connected Successfully');

    mongoose.connection.on('connected', () => {
      console.log('Mongoose connection established');
    });

    mongoose.connection.on('error', (err) => {
      console.error('Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('Mongoose connection disconnected');
      if (retries > 0) {
        console.log(`Attempting to reconnect... (${retries} attempts remaining)`);
        setTimeout(() => connectDB(retries - 1), 5000);
      }
    });

  } catch (err) {
    console.error('MongoDB Connection Error:', err);
    if (retries > 0) {
      console.log(`Retrying connection... (${retries} attempts remaining)`);
      setTimeout(() => connectDB(retries - 1), 5000);
    } else {
      console.error('Failed to connect to MongoDB after all retries');
      process.exit(1);
    }
  }
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Server is running',
    mongoConnection: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  // Detailed error for development, simplified for production
  const errorDetails = process.env.NODE_ENV === 'development' 
    ? { error: err, stack: err.stack }
    : undefined;
    
  // Format MongoDB errors
  let message = err.message || 'Something went wrong!';
  let statusCode = err.statusCode || 500;
  
  // Handle mongoose validation errors
  if (err.name === 'ValidationError') {
    message = Object.values(err.errors).map(val => val.message).join(', ');
    statusCode = 400;
  }
  
  // Handle duplicate key errors
  if (err.code === 11000) {
    message = 'Duplicate key error: ' + JSON.stringify(err.keyValue);
    statusCode = 409;
  }
  
  res.status(statusCode).json({ 
    success: false,
    message,
    details: errorDetails
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Initialize database connection
connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});