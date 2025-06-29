// backend/server.js

// This line loads your .env file and is critical for JWT_SECRET and other variables
require('dotenv').config();

const express = require('express');
const connectDB = require('./config/database');
const cors = require('cors');

const app = express();

// Connect to Database
connectDB();

// Init Middleware
// Enable CORS for all routes, allowing your frontend (on port 3000) to talk to your backend (on port 5000)
app.use(cors()); 
// Enable the express body parser to read JSON from request bodies
app.use(express.json({ extended: false }));


// =================================================================
// Define and Connect All Application Routes
// This section tells Express which router file to use for each URL path.
// =================================================================

app.use('/api/auth', require('./routes/auth'));
app.use('/api/flights', require('./routes/flights'));

// --- FIX: REGISTERING ALL MISSING ROUTES ---
// The following lines were missing or commented out. Adding them connects
// your route files to the main application.

// For general user-specific routes (e.g., fetching user profile)
app.use('/api/users', require('./routes/users'));

// For booking-related routes
app.use('/api/bookings', require('./routes/bookings'));

// For flight operator-specific routes
app.use('/api/operator', require('./routes/operator')); 

// For admin-specific routes (This was the main cause of the 404 errors)
app.use('/api/admin', require('./routes/admin'));


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));