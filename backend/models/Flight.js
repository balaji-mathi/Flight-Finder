// backend/models/Flight.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// This sub-schema defines the structure for Departure and Arrival locations
const LocationSchema = new Schema({
    // airport is no longer on the form
    airport: { type: String, trim: true }, 
    // city is on the form and is required
    city: { type: String, required: true, trim: true },
    // country is no longer on the form
    country: { type: String, trim: true },
    // date is on the form and is required
    date: { type: Date, required: true },
    // time is on the form and is required
    time: { type: String, required: true }
}, { _id: false });

// This sub-schema defines the structure for ticket prices
const PriceSchema = new Schema({
    economy: { type: Number, required: true },
    business: { type: Number, required: true },
    firstClass: { type: Number, required: true }
}, { _id: false });

// This sub-schema defines the structure for seat counts
const SeatInfoSchema = new Schema({
    total: { type: Number, required: true },
    available: { type: Number, required: true }
}, { _id: false });

// This sub-schema defines the overall seat structure
const AllSeatsSchema = new Schema({
    economy: SeatInfoSchema,
    business: SeatInfoSchema,
    firstClass: SeatInfoSchema
}, { _id: false });


// This is the main Flight Schema
const flightSchema = new Schema({
  flightNumber: { type: String, required: true, unique: true, trim: true },
  airline: { type: String, required: true, trim: true },
  departure: LocationSchema,
  arrival: LocationSchema,
  price: PriceSchema,
  seats: AllSeatsSchema,
  bookedSeats: { type: [String], default: [] },
  // *** FIX: These fields are no longer on the form and are NOT required ***
  duration: { type: String },
  aircraft: { type: String },
  status: { type: String, enum: ['scheduled', 'delayed', 'cancelled'], default: 'scheduled' },
  approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('Flight', flightSchema);