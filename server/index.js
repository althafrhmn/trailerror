const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const leaveRoutes = require('./routes/leaveRoutes');

const app = express();

// Connect to MongoDB
mongoose.connect('mongodb+srv://althafrahman960:DbxH0QzJPUMxvkjD@cluster0.w1lzr.mongodb.net/attendancedatabase_db?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((error) => {
  console.error('MongoDB connection error:', error);
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/leave-applications', leaveRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Something went wrong!'
  });
});

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 