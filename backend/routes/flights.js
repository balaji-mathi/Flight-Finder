// backend/routes/flights.js

const express = require('express');
const router = express.Router();
const Flight = require('../models/Flight');
const { auth, adminAuth } = require('../middleware/auth');

// --- UNCHANGED: Route for the homepage to get latest flights ---
router.get('/latest', async (req, res) => {
  try {
    const latestFlights = await Flight.find({ approvalStatus: 'approved' })
      .sort({ createdAt: -1 })
      .limit(3);
    res.json(latestFlights);
  } catch (err) {
    console.error('Error fetching latest flights:', err);
    res.status(500).send('Server Error');
  }
});

// --- UNCHANGED: Flight Creation Route ---
router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'operator') {
    return res.status(403).json({ message: 'Access Denied: Only operators can create flights.' });
  }
  if (req.user.operatorDetails?.approvalStatus !== 'approved') {
    return res.status(403).json({ message: 'Your operator account is not yet approved.' });
  }
  try {
    const { flightNumber } = req.body;
    let flight = await Flight.findOne({ flightNumber });
    if (flight) {
      return res.status(400).json({ message: 'A flight with this number already exists.' });
    }
    flight = new Flight({
      ...req.body,
      createdBy: req.user._id,
      approvalStatus: 'approved', 
    });
    await flight.save();
    res.status(201).json({ message: 'Flight added successfully and is now live.', flight });
  } catch (err) {
    console.error('Flight creation error:', err);
    if (err.name === 'ValidationError') {
        return res.status(400).json({ message: err.message });
    }
    res.status(500).send('Server Error');
  }
});

// --- UNCHANGED: Admin route to get all flights ---
router.get('/', [auth, adminAuth], async (req, res) => {
    try {
        const flights = await Flight.find({}).populate('createdBy', 'operatorDetails.companyName').sort({ createdAt: -1 });
        res.json(flights);
    } catch (err) {
        console.error('Error fetching all flights:', err);
        res.status(500).send('Server Error');
    }
});

// --- UNCHANGED: Public routes for searching ---
router.get('/cities', async (req, res) => {
  try {
    const departureCities = await Flight.distinct('departure.city', { approvalStatus: 'approved' });
    const arrivalCities = await Flight.distinct('arrival.city', { approvalStatus: 'approved' });
    const allCities = [...new Set([...departureCities, ...arrivalCities])].sort();
    res.json(allCities);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

router.get('/search', async (req, res) => {
  const { from, to, date } = req.query;
  const searchCriteria = {
    'departure.city': { $regex: `^${from}$`, $options: 'i' },
    'arrival.city': { $regex: `^${to}$`, $options: 'i' },
    approvalStatus: 'approved'
  };
  if (date && date.trim() !== '') {
    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);
    searchCriteria['departure.date'] = { $gte: startOfDay, $lte: endOfDay };
  }
  const flights = await Flight.find(searchCriteria);
  res.json(flights);
});

router.get('/:id', async (req, res) => {
    try {
        const flight = await Flight.findById(req.params.id);
        if (!flight || flight.approvalStatus !== 'approved') {
            return res.status(404).json({ message: 'Flight not found or not available.' });
        }
        res.json(flight);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// *** FIX: ADDED THE MISSING ROUTE TO UPDATE A FLIGHT ***
// @route   PUT /api/flights/:id
// @desc    Update flight details
// @access  Private (for the operator who created it or an admin)
router.put('/:id', auth, async (req, res) => {
    try {
        const flight = await Flight.findById(req.params.id);

        if (!flight) {
            return res.status(404).json({ message: 'Flight not found' });
        }

        // Ensure the user updating the flight is the one who created it OR is an admin
        if (flight.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'User not authorized to perform this action' });
        }
        
        // Since we made flightNumber read-only on the frontend, we don't need to check for duplicates here.
        // We will update the flight with the new data from the request body.
        const updatedFlight = await Flight.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true } // 'new: true' returns the updated document
        );

        res.json({ message: 'Flight updated successfully', flight: updatedFlight });

    } catch (err) {
        console.error('Error updating flight:', err.message);
        res.status(500).send('Server Error');
    }
});


module.exports = router;