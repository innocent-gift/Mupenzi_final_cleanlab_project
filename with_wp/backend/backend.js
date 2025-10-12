const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8081;

// Middleware
app.use(cors());
app.use(express.json());

// ✅ Serve frontend folder
app.use(express.static(path.join(__dirname, '../frontend')));

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cleanlab_rwanda'
};

console.log('Database config:', { ...dbConfig, password: '***' });

const db = mysql.createPool(dbConfig);

// Test DB connection
db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    return;
  }

  console.log('✅ Connected to MySQL database');
  connection.release();
  initializeDatabase();
});

// ====================
// DATABASE INITIALIZATION
// ====================
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

  db.query(createBookingsTable, (err) => {
    if (err) console.error('Error creating bookings table:', err.message);
    else console.log('✅ Bookings table ready');
  });

  db.query(createServicesTable, (err) => {
    if (err) console.error('Error creating services table:', err.message);
    else {
      console.log('✅ Services table ready');
      insertDefaultServices();
    }
  });
}

function insertDefaultServices() {
  const services = [
    ['Suits', 3000, 7000, 'dry_cleaning'],
    ['Dress', 3000, 6000, 'dry_cleaning'],
    ['Bride Dress', 8000, 16000, 'dry_cleaning'],
    ['Coat', 2500, 5000, 'dry_cleaning'],
    ['Umushanana', 3500, 7000, 'dry_cleaning'],
    ['Shirt', 1500, 3000, 'laundry'],
    ['Trouser', 1500, 3000, 'laundry'],
    ['Bed Cover (big)', 10000, 20000, 'laundry'],
    ['Curtains (big)', 15000, 30000, 'laundry'],
    ['Shoes', 10000, 20000, 'special']
  ];

  db.query('SELECT COUNT(*) as count FROM services', (err, results) => {
    if (!err && results[0].count === 0) {
      const insertQuery =
        'INSERT INTO services (name, standard_price, express_price, category) VALUES ?';
      db.query(insertQuery, [services], (err) => {
        if (err) console.error('Error inserting default services:', err.message);
        else console.log('✅ Default services inserted');
      });
    }
  });
}

// ====================
// ADMIN AUTHENTICATION
// ====================

const requireAdminAuth = (req, res, next) => {
  const password = req.query.password;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'cleanlab2024';

  if (password === ADMIN_PASSWORD) {
    return next();
  }

  const invalidMessage = req.query.invalid
    ? '<div class="alert error">Invalid password. Please try again.</div>'
    : '';
  const logoutMessage = req.query.logout
    ? '<div class="alert success">Successfully logged out.</div>'
    : '';

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Admin Login - Clean LAB Rwanda</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; font-family: 'Poppins', sans-serif; }
        body {
          background: linear-gradient(135deg, #004aad, #002f6c);
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
          color: #333;
        }
        .login-box {
          background: #fff;
          border-radius: 16px;
          padding: 40px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
          width: 100%;
          max-width: 380px;
          text-align: center;
        }
        h2 {
          color: #004aad;
          margin-bottom: 20px;
        }
        input[type=password] {
          width: 100%;
          padding: 12px;
          margin: 12px 0;
          border-radius: 8px;
          border: 1px solid #ccc;
          font-size: 1rem;
        }
        button {
          width: 100%;
          padding: 12px;
          border: none;
          border-radius: 8px;
          background: #004aad;
          color: #fff;
          font-size: 1rem;
          cursor: pointer;
          transition: 0.3s;
        }
        button:hover {
          background: #003785;
        }
        .alert {
          margin-top: 15px;
          padding: 10px;
          border-radius: 8px;
          font-size: 0.9rem;
        }
        .alert.error { background: #f8d7da; color: #721c24; }
        .alert.success { background: #d4edda; color: #155724; }
        a {
          display: block;
          margin-top: 15px;
          color: #004aad;
          text-decoration: none;
        }
        a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="login-box">
        <h2>Admin Login</h2>
        <form method="GET" action="/admin">
          <input type="password" name="password" placeholder="Enter admin password" required />
          <button type="submit">Access Dashboard</button>
        </form>
        ${invalidMessage}
        ${logoutMessage}
        <a href="/">← Back to main site</a>
      </div>
    </body>
    </html>
  `);
};

// ====================
// ROUTES - UPDATED TO MATCH FRONTEND
// ====================

// Admin routes
app.get('/admin', requireAdminAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/admin.html'));
});

app.get('/admin/logout', (req, res) => {
  res.redirect('/admin?logout=true');
});

// 🔥 FIXED ADMIN API ROUTES - MATCHING FRONTEND EXPECTATIONS

// Get all bookings
app.get('/api/admin/bookings', requireAdminAuth, (req, res) => {
  const query = `
    SELECT * FROM bookings
    ORDER BY created_at DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Admin bookings error:', err);
      return res.status(500).json({ error: 'Failed to fetch bookings' });
    }

    console.log(`📋 Bookings fetched: ${results.length} records`);
    res.json(results);
  });
});

// Get services
app.get('/api/admin/services', requireAdminAuth, (req, res) => {
  const query = 'SELECT * FROM services ORDER BY category, name';

  db.query(query, (err, results) => {
    if (err) {
      console.error('Admin services error:', err);
      return res.status(500).json({ error: 'Failed to fetch services' });
    }
    res.json(results);
  });
});

// 🔥 FIXED STATS ENDPOINT - MATCHES FRONTEND FIELD NAMES
app.get('/api/admin/stats', requireAdminAuth, (req, res) => {
  const statsQuery = `
    SELECT
      (SELECT COUNT(*) FROM bookings) as total,
      (SELECT COUNT(*) FROM bookings WHERE status = 'pending') as pending,
      (SELECT COUNT(*) FROM bookings WHERE status = 'confirmed') as confirmed,
      (SELECT COUNT(*) FROM bookings WHERE status = 'completed') as completed,
      (SELECT COUNT(*) FROM bookings WHERE DATE(created_at) = CURDATE()) as today,
      (SELECT COUNT(*) FROM services) as total_services
  `;

  db.query(statsQuery, (err, results) => {
    if (err) {
      console.error('Admin stats error:', err);
      return res.status(500).json({ error: 'Failed to fetch stats' });
    }

    console.log('📊 Stats data:', results[0]);
    res.json(results[0]);
  });
});

// 🔥 FIXED STATUS UPDATE ENDPOINT - MATCHES FRONTEND URL
app.put('/api/admin/bookings/:id/status', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const query = 'UPDATE bookings SET status = ? WHERE id = ?';

  db.query(query, [status, id], (err, results) => {
    if (err) {
      console.error('Update booking status error:', err);
      return res.status(500).json({ error: 'Failed to update booking status' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    console.log(`✅ Booking ${id} status updated to: ${status}`);
    res.json({ success: true, message: `Booking status updated to ${status}` });
  });
});

// Delete booking - KEEP THIS AS IS (it matches frontend)
app.delete('/api/admin/bookings/:id', requireAdminAuth, (req, res) => {
  const { id } = req.params;

  const query = 'DELETE FROM bookings WHERE id = ?';

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Delete booking error:', err);
      return res.status(500).json({ error: 'Failed to delete booking' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    console.log(`🗑️ Booking ${id} deleted`);
    res.json({ success: true, message: 'Booking deleted successfully' });
  });
});

// Frontend routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// API routes
app.get('/api', (req, res) => {
  res.json({
    message: '🚀 Clean LAB Rwanda API running',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      services: '/api/services',
      bookings: '/api/bookings (POST)',
      admin: '/admin',
      admin_api: {
        bookings: '/api/admin/bookings',
        services: '/api/admin/services',
        stats: '/api/admin/stats',
        update_status: '/api/admin/bookings/:id/status (PUT)'
      }
    },
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  db.query('SELECT 1', (err) => {
    res.json({
      status: err ? 'Database connection failed' : 'OK',
      database: err ? 'disconnected' : 'connected',
      timestamp: new Date().toISOString()
    });
  });
});

app.post('/api/bookings', (req, res) => {
  const { name, contact, service_type, date_time, address, notes } = req.body;

  if (!name || !contact || !service_type || !date_time || !address) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  const query = `
    INSERT INTO bookings (name, contact, service_type, date_time, address, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(query, [name, contact, service_type, date_time, address, notes || ''], (err) => {
    if (err) {
      console.error('Booking error:', err);
      return res.status(500).json({ success: false, message: 'Failed to save booking' });
    }

    console.log(`🧾 New booking from: ${name}`);
    res.json({ success: true, message: 'Booking received! We will contact you soon.' });
  });
});

app.get('/api/services', (req, res) => {
  db.query('SELECT * FROM services', (err, results) => {
    if (err) {
      console.error('Services error:', err);
      return res.status(500).json({ error: 'Failed to fetch services' });
    }
    res.json(results);
  });
});

// ====================
// START SERVER - UPDATED FOR VERCEL
// ====================

// Start server if not in Vercel environment
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 API: http://localhost:${PORT}/api`);
    console.log(`🏥 Health: http://localhost:${PORT}/api/health`);
    console.log(`🛠️ Services: http://localhost:${PORT}/api/services`);
    console.log(`👨‍💼 Admin Dashboard: http://localhost:${PORT}/admin`);
    console.log(`📋 Admin API: http://localhost:${PORT}/api/admin/bookings`);
    console.log(`📈 Admin Stats: http://localhost:${PORT}/api/admin/stats`);
    console.log(`🔄 Status Updates: http://localhost:${PORT}/api/admin/bookings/:id/status`);
    console.log(`🔐 Admin Password: Set in .env as ADMIN_PASSWORD`);
  });
}

// Export for Vercel serverless functions
module.exports = app;
