const { pool } = require('../config/database');

class Booking {
    static async create(bookingData) {
        const {
            bookingCode,
            userId,
            serviceId,
            scheduledDate,
            scheduledTime,
            address,
            specialInstructions,
            totalAmount
        } = bookingData;

        const sql = `
            INSERT INTO bookings 
            (booking_code, user_id, service_id, scheduled_date, scheduled_time, address, special_instructions, total_amount) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const [result] = await pool.execute(sql, [
            bookingCode, userId, serviceId, scheduledDate, 
            scheduledTime, address, specialInstructions, totalAmount
        ]);
        
        return this.findById(result.insertId);
    }

    static async findById(id) {
        const sql = `
            SELECT b.*, u.full_name, u.phone_number, u.email, s.name as service_name, s.category 
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            JOIN services s ON b.service_id = s.id
            WHERE b.id = ?
        `;
        const [rows] = await pool.execute(sql, [id]);
        return rows[0];
    }

    static async findByUserId(userId) {
        const sql = `
            SELECT b.*, s.name as service_name, s.category 
            FROM bookings b
            JOIN services s ON b.service_id = s.id
            WHERE b.user_id = ?
            ORDER BY b.created_at DESC
        `;
        const [rows] = await pool.execute(sql, [userId]);
        return rows;
    }

    static async findByBookingCode(bookingCode) {
        const sql = `
            SELECT b.*, u.full_name, u.phone_number, s.name as service_name, s.category 
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            JOIN services s ON b.service_id = s.id
            WHERE b.booking_code = ?
        `;
        const [rows] = await pool.execute(sql, [bookingCode]);
        return rows[0];
    }

    static async checkAvailability(date, time) {
        const sql = `
            SELECT COUNT(*) as count 
            FROM bookings 
            WHERE scheduled_date = ? AND scheduled_time = ? 
            AND status IN ('pending', 'confirmed', 'in_progress')
        `;
        const [rows] = await pool.execute(sql, [date, time]);
        return rows[0].count;
    }
}

module.exports = Booking;
