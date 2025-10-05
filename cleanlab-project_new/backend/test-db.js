require('dotenv').config();
const mysql = require('mysql2/promise');

async function testConnection() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        
        console.log('✅ Database connection successful!');
        await connection.end();
    } catch (error) {
        console.log('❌ Database connection failed:', error.message);
        console.log('Current DB_USER:', process.env.DB_USER);
        console.log('Current DB_PASSWORD length:', process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : 'undefined');
    }
}

testConnection();
