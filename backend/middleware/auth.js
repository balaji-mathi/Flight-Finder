// backend/middleware/auth.js
// MODIFIED - Simplified adminAuth for robust chaining

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// This function is correct and remains the same.
// Its job is to verify the token and attach the user to the request.
const auth = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User not found, token may be invalid' });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// --- THIS IS THE CRITICAL FIX ---
// This function is now a simple, standalone middleware.
// It no longer calls auth() itself. It just checks the result.
const adminAuth = (req, res, next) => {
  // It assumes `auth` has already run.
  // We check if a user was attached to the request AND if their role is 'admin'.
  if (req.user && req.user.role === 'admin') {
    next(); // If yes, proceed to the route handler.
  } else {
    // If no, deny access.
    res.status(403).json({ message: 'Access Denied: Admin role required.' });
  }
};

module.exports = { auth, adminAuth };