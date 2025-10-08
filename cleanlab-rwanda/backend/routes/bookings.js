// routes/bookings.js
const express = require('express');
const router = express.Router();

// In-memory storage for demo (replace with database in production)
let bookings = [];
let bookingIdCounter = 1;

// Create booking
router.post('/bookings', (req, res) => {
  try {
    const { name, contact, service_type, date_time, address, notes } = req.body;

    // Validate required fields
    if (!name || !contact || !service_type || !date_time || !address) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be filled: name, contact, service_type, date_time, address'
      });
    }

    // Create new booking
    const newBooking = {
      id: bookingIdCounter++,
      name,
      contact,
      service_type,
      date_time,
      address,
      notes: notes || '',
      status: 'pending',
      created_at: new Date().toISOString(),
      security_code: Math.random().toString(36).substring(2, 8).toUpperCase()
    };

    bookings.push(newBooking);

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Booking created successfully! We will contact you within 2 hours.',
      booking: {
        id: newBooking.id,
        security_code: newBooking.security_code
      }
    });

  } catch (error) {
    console.error('Booking creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all bookings (for admin purposes)
router.get('/bookings', (req, res) => {
  res.json({
    success: true,
    data: bookings
  });
});

// Get booking by ID
router.get('/bookings/:id', (req, res) => {
  const booking = bookings.find(b => b.id === parseInt(req.params.id));
  
  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  res.json({
    success: true,
    data: booking
  });
});

// Update booking status
router.put('/bookings/:id', (req, res) => {
  const booking = bookings.find(b => b.id === parseInt(req.params.id));
  
  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  const { status } = req.body;
  if (status) {
    booking.status = status;
    booking.updated_at = new Date().toISOString();
  }

  res.json({
    success: true,
    message: 'Booking updated successfully',
    data: booking
  });
});

// Cancel booking
router.delete('/bookings/:id', (req, res) => {
  const bookingIndex = bookings.findIndex(b => b.id === parseInt(req.params.id));
  
  if (bookingIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  const cancelledBooking = bookings.splice(bookingIndex, 1)[0];
  
  res.json({
    success: true,
    message: 'Booking cancelled successfully',
    data: cancelledBooking
  });
});

module.exports = router;
