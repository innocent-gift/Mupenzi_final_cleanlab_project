const db = require('../config/database');

async function generateUniqueBookingCode() {
    const prefix = 'CL-';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let isUnique = false;
    let bookingCode;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
        // Generate code
        let result = '';
        for (let i = 0; i < 5; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        bookingCode = prefix + result;
        
        // Check if code exists in database
        try {
            const [rows] = await db.execute('SELECT id FROM bookings WHERE booking_code = ?', [bookingCode]);
            if (rows.length === 0) {
                isUnique = true;
            }
        } catch (error) {
            console.log('Error checking booking code uniqueness, retrying...');
        }
        
        attempts++;
    }

    if (!isUnique) {
        // Fallback: use timestamp-based code
        bookingCode = prefix + Date.now().toString(36).toUpperCase().slice(-5);
    }

    return bookingCode;
}

module.exports = generateUniqueBookingCode;
