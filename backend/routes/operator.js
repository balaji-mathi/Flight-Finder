// backend/routes/operator.js

const express = require('express');
const { auth } = require('../middleware/auth');
const Flight = require('../models/Flight');
const Booking = require('../models/Booking');

const router = express.Router();

// --- NEW ROUTE: FIX FOR "Failed to fetch operator data" ---
// @route   GET /api/operator/stats
// @desc    Get stats and data for the operator dashboard
// @access  Private (Operator)
router.get('/stats', auth, async (req, res) => {
  // Ensure the user is an operator
  if (req.user.role !== 'operator') {
    return res.status(403).json({ message: 'Access denied. Operator role required.' });
  }

  try {
    const operatorId = req.user._id;

    // Get all flights created by this operator
    const flights = await Flight.find({ createdBy: operatorId }).sort({ createdAt: -1 });

    // Find all flight IDs for this operator
    const flightIds = flights.map(f => f._id);
    
    // Get all bookings made for those flights
    const bookings = await Booking.find({ flight: { $in: flightIds } })
      .populate('user', 'firstName lastName email')
      .populate('flight', 'flightNumber')
      .sort({ createdAt: -1 });

    res.json({
      totalFlights: flights.length,
      totalBookings: bookings.length,
      flights: flights,
      bookings: bookings,
    });
  } catch (err) {
    console.error('Error fetching operator stats:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// The other routes you had can be removed if not used, or kept if needed.
// For now, this is the only route this file needs for the dashboard to work.

module.exports = router;