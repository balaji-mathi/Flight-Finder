// backend/models/Booking.js

const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingReference: { type: String, unique: true, trim: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  flight: { type: mongoose.Schema.Types.ObjectId, ref: 'Flight', required: true },
  
  // *** FIX: Schema now correctly expects a 'name' and 'age' for each passenger ***
  passengers: [{
    _id: false, // Don't create a separate ID for each passenger sub-document
    name: { type: String, trim: true, required: true },
    age: { type: String, required: true },
  }],
  
  seatsBooked: {
    type: [String],
    default: []
  },
  
  numberOfPassengers: { type: Number, required: true },
  seatClass: { type: String, required: true },
  totalPrice: { type: Number, required: true },
  
  paymentStatus: { type: String, default: 'completed' },
  contactInfo: {
    email: { type: String, trim: true },
    phone: { type: String, trim: true }
  },
  
  bookingStatus: { 
    type: String, 
    enum: ['confirmed', 'cancelled', 'pending'],
    default: 'confirmed' 
  },
}, {
  timestamps: true
});

bookingSchema.pre('save', function(next) {
  if (this.isNew && !this.bookingReference) {
    this.bookingReference = 'BK' + Date.now() + Math.random().toString(36).substring(2, 6).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);