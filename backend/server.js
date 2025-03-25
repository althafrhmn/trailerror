chromeconst express = require('express');
const cors = require('cors');
// ... existing imports ...

const app = express();

// Update CORS configuration
app.use(cors({
    origin: 'http://localhost:5174',  // Changed to single origin
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Content-Type', 'Authorization']
}));

// ... rest of your server code ...