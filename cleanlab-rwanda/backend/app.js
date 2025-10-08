const express = require('express');
const cors = require('cors');
require('dotenv').config();

const bookingRoutes = require('./routes/bookings');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', bookingRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Clean LAB Backend is running',
    features: ['Booking Creation', 'Security Code System', 'Booking Updates', 'Booking Cancellation']
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Clean LAB backend server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;

