// backend/routes/bookings.js

const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Flight = require('../models/Flight');
const { auth, adminAuth } = require('../middleware/auth');

// Helper function to generate unique seat numbers
const generateSeatNumbers = (count, existingSeats, seatClass) => {
    const newSeats = [];
    const prefix = seatClass.charAt(0).toUpperCase();
    let seatNum = 1;
    let attempts = 0;
    while (newSeats.length < count && attempts < 500) {
        const seatId = `${prefix}${seatNum}`;
        if (!existingSeats.includes(seatId)) {
            newSeats.push(seatId);
        }
        seatNum++;
        attempts++;
    }
    if (newSeats.length < count) throw new Error('Could not allocate enough unique seats.');
    return newSeats;
};

// @desc    Create a new booking
router.post('/', auth, async (req, res) => {
  try {
    const { flightId, numberOfPassengers, seatClass, totalPrice, passengers } = req.body;
    const flight = await Flight.findById(flightId);
    if (!flight) return res.status(404).json({ message: 'Flight not found.' });
    if (flight.seats[seatClass].available < numberOfPassengers) return res.status(400).json({ message: `Not enough available seats in ${seatClass} class.` });
    
    const assignedSeats = generateSeatNumbers(numberOfPassengers, flight.bookedSeats, seatClass);
    
    const update = { 
      $inc: { [`seats.${seatClass}.available`]: -numberOfPassengers },
      $push: { bookedSeats: { $each: assignedSeats } }
    };
    await Flight.findByIdAndUpdate(flightId, update);

    const newBooking = new Booking({
      user: req.user._id, // FIX: Use the _id from the full user document
      flight: flightId,
      numberOfPassengers,
      seatClass,
      totalPrice,
      passengers,
      seatsBooked: assignedSeats,
      contactInfo: { email: req.user.email, phone: req.user.phone }
    });
    
    await newBooking.save();
    res.status(201).json({ message: 'Booking successful!', booking: newBooking });
  } catch (err) {
    console.error('Booking creation error:', err);
    res.status(500).json({ message: err.message || 'A server error occurred during booking.' });
  }
});

// @desc    Get all bookings (Admin only)
router.get('/', [auth, adminAuth], async (req, res) => {
  try {
    const bookings = await Booking.find({})
      .populate('flight', 'flightNumber airline departure arrival')
      .populate('user', 'firstName lastName email phone')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    console.error('Error fetching all bookings for admin:', err);
    res.status(500).send('Server Error');
  }
});

// @desc    Get bookings for the logged-in user
router.get('/my-bookings', auth, async (req, res) => {
    try {
        // *** THIS IS THE DEFINITIVE FIX ***
        // It now correctly uses req.user._id from the auth middleware
        const bookings = await Booking.find({ user: req.user._id })
            .populate('flight', 'flightNumber airline departure arrival')
            .sort({ createdAt: -1 });
        res.json(bookings);
    } catch (err) {
        console.error('Error fetching user bookings:', err.message);
        res.status(500).send('Server Error');
    }
});

// @desc    Get bookings for an operator's flights
router.get('/operator/my-bookings', auth, async (req, res) => {
  try {
    if (req.user.role !== 'operator') return res.status(403).json({ message: 'Access denied.' });
    const operatorFlights = await Flight.find({ createdBy: req.user._id }).select('_id'); // FIX: Use _id
    const flightIds = operatorFlights.map(flight => flight._id);
    const bookings = await Booking.find({ flight: { $in: flightIds } })
        .populate('flight', 'flightNumber departure arrival')
        .populate('user', 'firstName lastName email phone');
    res.json(bookings);
  } catch (err) {
    console.error('Error fetching operator bookings:', err.message);
    res.status(500).send('Server Error');
  }
});

// @desc    Cancel a booking
router.put('/:id/cancel', auth, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id).populate('flight');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (booking.bookingStatus === 'cancelled') return res.status(400).json({ message: 'Booking is already cancelled.' });
        if (!booking.flight) {
            await Booking.findByIdAndUpdate(req.params.id, { bookingStatus: 'cancelled' });
            return res.json({ message: 'Booking cancelled (flight not found).' });
        }

        const isOwner = booking.user.toString() === req.user._id.toString(); // FIX: Use _id
        const isAdmin = req.user.role === 'admin';
        const isFlightOperator = booking.flight.createdBy.toString() === req.user._id.toString(); // FIX: Use _id

        if (!isOwner && !isAdmin && !isFlightOperator) {
            return res.status(401).json({ message: 'Not authorized' });
        }
        
        await Booking.findByIdAndUpdate(req.params.id, { bookingStatus: 'cancelled' });

        if (booking.flight.seats[booking.seatClass]) {
            await Flight.findByIdAndUpdate(booking.flight._id, {
                $inc: { [`seats.${booking.seatClass}.available`]: booking.numberOfPassengers },
                $pullAll: { bookedSeats: booking.seatsBooked }
            });
        }

        res.json({ message: 'Booking cancelled successfully' });
    } catch (err) {
        console.error('Cancellation Error:', err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;