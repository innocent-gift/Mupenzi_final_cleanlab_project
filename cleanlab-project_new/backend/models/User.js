const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    static async create(userData) {
        const { phoneNumber, email, fullName, password, verificationCode } = userData;
        
        const sql = `
            INSERT INTO users (phone_number, email, full_name, password, verification_code, code_expires) 
            VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 30 MINUTE))
        `;
        const [result] = await pool.execute(sql, [
            phoneNumber, 
            email || null, 
            fullName, 
            password, 
            verificationCode
        ]);
        
        return this.findById(result.insertId);
    }

    static async findByPhoneNumber(phoneNumber) {
        const sql = 'SELECT * FROM users WHERE phone_number = ?';
        const [rows] = await pool.execute(sql, [phoneNumber]);
        return rows[0];
    }

    static async findById(id) {
        const sql = 'SELECT id, phone_number, email, full_name, is_verified, created_at FROM users WHERE id = ?';
        const [rows] = await pool.execute(sql, [id]);
        return rows[0];
    }

    static async verifyUser(phoneNumber, code) {
        const sql = `
            UPDATE users 
            SET is_verified = TRUE, verification_code = NULL, code_expires = NULL 
            WHERE phone_number = ? AND verification_code = ? AND code_expires > NOW()
        `;
        const [result] = await pool.execute(sql, [phoneNumber, code]);
        return result.affectedRows > 0;
    }

    static async updateVerificationCode(phoneNumber, code) {
        const sql = `
            UPDATE users 
            SET verification_code = ?, code_expires = DATE_ADD(NOW(), INTERVAL 30 MINUTE) 
            WHERE phone_number = ?
        `;
        await pool.execute(sql, [code, phoneNumber]);
    }

    static async comparePassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }
}

module.exports = User;
