const { pool } = require('../config/database');

class Service {
    static async findAll() {
        const sql = 'SELECT * FROM services WHERE is_active = TRUE ORDER BY category, name';
        const [rows] = await pool.execute(sql);
        return rows;
    }

    static async findById(id) {
        const sql = 'SELECT * FROM services WHERE id = ? AND is_active = TRUE';
        const [rows] = await pool.execute(sql, [id]);
        return rows[0];
    }

    static async findByCategory(category) {
        const sql = 'SELECT * FROM services WHERE category = ? AND is_active = TRUE ORDER BY name';
        const [rows] = await pool.execute(sql, [category]);
        return rows;
    }
}

module.exports = Service;
