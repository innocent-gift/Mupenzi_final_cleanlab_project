const Booking = require('../models/Booking');
const Service = require('../models/Service');

const bookingController = {
    async createBooking(req, res) {
        try {
            const userId = req.user.userId;
            const {
                serviceId,
                scheduledDate,
                scheduledTime,
                address,
                specialInstructions
            } = req.body;

            const service = await Service.findById(serviceId);
            if (!service) {
                return res.status(404).json({
                    success: false,
                    message: 'Service not found'
                });
            }

            // Check availability
            const existingBookings = await Booking.checkAvailability(scheduledDate, scheduledTime);
            if (existingBookings >= 3) {
                return res.status(400).json({
                    success: false,
                    message: 'This time slot is fully booked. Please choose another time.'
                });
            }

            // Generate unique booking code
            const bookingCode = 'CLB' + Date.now().toString().slice(-6);

            const booking = await Booking.create({
                bookingCode,
                userId,
                serviceId,
                scheduledDate,
                scheduledTime,
                address,
                specialInstructions: specialInstructions || '',
                totalAmount: service.base_price
            });

            res.status(201).json({
                success: true,
                message: 'Booking created successfully',
                data: {
                    bookingCode: booking.booking_code,
                    bookingId: booking.id,
                    scheduledDate: booking.scheduled_date,
                    scheduledTime: booking.scheduled_time,
                    totalAmount: booking.total_amount,
                    serviceName: service.name
                }
            });

        } catch (error) {
            console.error('Create booking error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while creating booking'
            });
        }
    },

    async getUserBookings(req, res) {
        try {
            const userId = req.user.userId;
            const bookings = await Booking.findByUserId(userId);

            res.json({
                success: true,
                data: bookings
            });

        } catch (error) {
            console.error('Get bookings error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while fetching bookings'
            });
        }
    },

    async getBookingByCode(req, res) {
        try {
            const { bookingCode } = req.params;
            const booking = await Booking.findByBookingCode(bookingCode);

            if (!booking) {
                return res.status(404).json({
                    success: false,
                    message: 'Booking not found'
                });
            }

            if (booking.user_id !== req.user.userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            res.json({
                success: true,
                data: booking
            });

        } catch (error) {
            console.error('Get booking error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while fetching booking'
            });
        }
    }
};

module.exports = bookingController;
