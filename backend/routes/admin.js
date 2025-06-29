// backend/routes/admin.js
// MODIFIED - Fixed the syntax error in the /applications route.

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Booking = require('../models/Booking');
const Flight = require('../models/Flight');
const { auth, adminAuth } = require('../middleware/auth');

// It fetches the aggregate statistics for the admin dashboard.
router.get('/stats', [auth, adminAuth], async (req, res) => {
  try {
    const [userCount, bookingCount, flightCount, pendingOperators] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Booking.countDocuments({}),
      Flight.countDocuments({}),
      User.find({ role: 'operator', 'operatorDetails.approvalStatus': 'pending' }).select('-password')
    ]);

    res.json({ 
      totalUsers: userCount, 
      totalBookings: bookingCount, 
      totalFlights: flightCount, 
      pendingOperators: pendingOperators 
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Server error while fetching dashboard data' });
  }
});

// Protected route to get all flights for admin
router.get('/flights', [auth, adminAuth], async (req, res) => {
  try {
    const flights = await Flight.find({})
      .populate({
        path: 'createdBy',
        select: 'operatorDetails.companyName'
      })
      .sort({ createdAt: -1 });
    res.json(flights);
  } catch (error) {
    console.error('Admin flights fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Protected route to get all bookings for admin
router.get('/bookings', [auth, adminAuth], async (req, res) => {
  try {
    const bookings = await Booking.find({})
      .populate('user', 'firstName email phone') 
      .populate('flight')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    console.error('Admin bookings fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Protected route for admin to cancel a booking
router.put('/bookings/:id/cancel', [auth, adminAuth], async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(req.params.id, { bookingStatus: 'cancelled' }, { new: true });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json({ message: 'Booking cancelled successfully', booking });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Protected route to get all users for admin
router.get('/users', [auth, adminAuth], async (req, res) => {
  try {
    const allUsers = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(allUsers);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Protected route to get operator applications
router.get('/applications', [auth, adminAuth], async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    const operators = await User.find({ role: 'operator', 'operatorDetails.approvalStatus': status }).select('-password').sort({ createdAt: -1 });
    res.json(operators);
  } catch (error) {
    // --- FIX: Corrected the catch block syntax ---
    console.error("Error fetching applications:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Protected route to approve an operator
router.put('/:id/approve', [auth, adminAuth], async (req, res) => {
  try {
    const operator = await User.findByIdAndUpdate(req.params.id, { 'operatorDetails.approvalStatus': 'approved' }, { new: true }).select('-password');
    if (!operator) return res.status(404).json({ message: 'Operator not found' });
    res.json({ message: 'Operator approved successfully', operator });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Protected route to reject an operator
router.put('/:id/reject', [auth, adminAuth], async (req, res) => {
  try {
    const { rejectionReason = 'Application did not meet requirements.' } = req.body;
    const operator = await User.findByIdAndUpdate(req.params.id, { 'operatorDetails.approvalStatus': 'rejected', 'operatorDetails.rejectionReason': rejectionReason }, { new: true }).select('-password');
    if (!operator) return res.status(404).json({ message: 'Operator not found' });
    res.json({ message: 'Operator rejected successfully', operator });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;