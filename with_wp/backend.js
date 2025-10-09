const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '', // Make sure this is set in .env
  database: process.env.DB_NAME || 'cleanlab_rwanda'
};

console.log('Database config:', { ...dbConfig, password: '***' }); // Don't log actual password

const db = mysql.createPool(dbConfig);

// Test database connection
db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    console.log('💡 Please check:');
    console.log('   1. Is MySQL running? (sudo service mysql start)');
    console.log('   2. Is the password correct in .env file?');
    console.log('   3. Does the database exist?');
    return;
  }
  
  console.log('✅ Connected to MySQL database');
  connection.release();
  initializeDatabase();
});

// Initialize database tables
function initializeDatabase() {
  const createBookingsTable = `
    CREATE TABLE IF NOT EXISTS bookings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      contact VARCHAR(255) NOT NULL,
      service_type VARCHAR(100) NOT NULL,
      date_time DATETIME NOT NULL,
      address TEXT NOT NULL,
      notes TEXT,
      status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `;

  const createServicesTable = `
    CREATE TABLE IF NOT EXISTS services (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      standard_price DECIMAL(10, 2),
      express_price DECIMAL(10, 2),
      category VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Create tables
  db.query(createBookingsTable, (err) => {
    if (err) console.error('Error creating bookings table:', err.message);
    else console.log('✅ Bookings table ready');
  });

  db.query(createServicesTable, (err) => {
    if (err) console.error('Error creating services table:', err.message);
    else {
      console.log('✅ Services table ready');
      // Insert default services
      insertDefaultServices();
    }
  });
}

// Insert default services
function insertDefaultServices() {
  const services = [
    { name: 'Suits', standard_price: 3000, express_price: 7000, category: 'dry_cleaning' },
    { name: 'Dress', standard_price: 3000, express_price: 6000, category: 'dry_cleaning' },
    { name: 'Bride Dress', standard_price: 8000, express_price: 16000, category: 'dry_cleaning' },
    { name: 'Coat', standard_price: 2500, express_price: 5000, category: 'dry_cleaning' },
    { name: 'Umushanana', standard_price: 3500, express_price: 7000, category: 'dry_cleaning' },
    { name: 'Shirt', standard_price: 1500, express_price: 3000, category: 'laundry' },
    { name: 'Trouser', standard_price: 1500, express_price: 3000, category: 'laundry' },
    { name: 'Bed Cover (big)', standard_price: 10000, express_price: 20000, category: 'laundry' },
    { name: 'Curtains (big)', standard_price: 15000, express_price: 30000, category: 'laundry' },
    { name: 'Shoes', standard_price: 10000, express_price: 20000, category: 'special' }
  ];

  // Check if services exist first
  db.query('SELECT COUNT(*) as count FROM services', (err, results) => {
    if (err) return;
    
    if (results[0].count === 0) {
      const insertQuery = 'INSERT INTO services (name, standard_price, express_price, category) VALUES ?';
      const values = services.map(s => [s.name, s.standard_price, s.express_price, s.category]);
      
      db.query(insertQuery, [values], (err) => {
        if (err) console.error('Error inserting services:', err.message);
        else console.log('✅ Default services inserted');
      });
    }
  });
}

// API Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check
app.get('/api/health', (req, res) => {
  db.query('SELECT 1', (err) => {
    res.json({ 
      status: err ? 'Database connection failed' : 'OK',
      timestamp: new Date().toISOString()
    });
  });
});

// Booking endpoint
app.post('/api/bookings', (req, res) => {
  const { name, contact, service_type, date_time, address, notes } = req.body;

  if (!name || !contact || !service_type || !date_time || !address) {
    return res.status(400).json({ 
      success: false, 
      message: 'All fields are required' 
    });
  }

  const query = `
    INSERT INTO bookings (name, contact, service_type, date_time, address, notes) 
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(query, [name, contact, service_type, date_time, address, notes || ''], (err, results) => {
    if (err) {
      console.error('Booking error:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to save booking' 
      });
    }

    console.log(`New booking from: ${name}`);
    res.json({ 
      success: true, 
      message: 'Booking received! We will contact you within 2 hours.' 
    });
  });
});

// Get services
app.get('/api/services', (req, res) => {
  db.query('SELECT * FROM services', (err, results) => {
    if (err) {
      console.error('Services error:', err);
      return res.status(500).json({ error: 'Failed to fetch services' });
    }
    res.json(results);
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API: http://localhost:${PORT}/api`);
});
