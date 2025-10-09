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

// ====================
// ADMIN AUTHENTICATION - OPTION 3 (FIXED)
// ====================

// Middleware to check admin password from environment variable
const requireAdminAuth = (req, res, next) => {
  const password = req.query.password;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'cleanlab2024';
  
  if (password === ADMIN_PASSWORD) {
    return next(); // Password correct, continue to admin page
  }
  
  // Show beautiful password form - FIXED SYNTAX
  const invalidMessage = req.query.invalid ? 
    '<div class="error-message"><i class="fas fa-exclamation-triangle"></i> Invalid password. Please try again.</div>' : '';
  
  const logoutMessage = req.query.logout ? 
    '<div class="success-message"><i class="fas fa-check-circle"></i> Successfully logged out.</div>' : '';
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Admin Login - Clean LAB Rwanda</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: "Poppins", sans-serif;
        }
        
        :root {
          --primary: #004aad;
          --primary-dark: #003785;
          --white: #ffffff;
          --text: #333;
          --text-light: #6c757d;
          --danger: #dc3545;
          --shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          --radius: 8px;
        }
        
        body {
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        
        .login-container {
          background: var(--white);
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          padding: 40px;
          width: 100%;
          max-width: 400px;
          text-align: center;
        }
        
        .logo {
          color: var(--primary);
          font-size: 2rem;
          font-weight: bold;
          margin-bottom: 10px;
        }
        
        .logo-icon {
          background: var(--primary);
          color: white;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          font-weight: bold;
          font-size: 1.5rem;
        }
        
        h2 {
          color: var(--text);
          margin-bottom: 10px;
        }
        
        .subtitle {
          color: var(--text-light);
          margin-bottom: 30px;
        }
        
        .login-form {
          text-align: left;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: var(--text);
        }
        
        input[type="password"] {
          width: 100%;
          padding: 12px 15px;
          border: 1px solid #ddd;
          border-radius: var(--radius);
          font-size: 1rem;
          transition: border 0.3s;
        }
        
        input[type="password"]:focus {
          border-color: var(--primary);
          outline: none;
          box-shadow: 0 0 0 3px rgba(0, 74, 173, 0.1);
        }
        
        .btn {
          display: inline-block;
          background: var(--primary);
          color: white;
          padding: 12px 30px;
          border: none;
          border-radius: 30px;
          text-decoration: none;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s;
          width: 100%;
          margin-top: 10px;
        }
        
        .btn:hover {
          background: var(--primary-dark);
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
        }
        
        .error-message {
          background: #f8d7da;
          color: #721c24;
          padding: 12px;
          border-radius: var(--radius);
          margin-top: 20px;
          border: 1px solid #f5c6cb;
        }
        
        .success-message {
          background: #d4edda;
          color: #155724;
          padding: 12px;
          border-radius: var(--radius);
          margin-top: 20px;
          border: 1px solid #c3e6cb;
        }
        
        .back-link {
          display: block;
          margin-top: 20px;
          color: var(--primary);
          text-decoration: none;
        }
        
        .back-link:hover {
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="login-container">
        <div class="logo-icon">CL</div>
        <div class="logo">Clean LAB Rwanda</div>
        <h2>Admin Dashboard</h2>
        <p class="subtitle">Enter your password to continue</p>
        
        <form method="GET" action="/admin" class="login-form">
          <div class="form-group">
            <label for="password">Admin Password</label>
            <input type="password" id="password" name="password" placeholder="Enter admin password" required>
          </div>
          <button type="submit" class="btn">
            <i class="fas fa-lock"></i> Access Dashboard
          </button>
        </form>
        
        ${invalidMessage}
        ${logoutMessage}
        
        <a href="/" class="back-link">
          <i class="fas fa-arrow-left"></i> Back to Main Site
        </a>
      </div>
    </body>
    </html>
  `);
};

// ====================
// ADMIN ROUTES (PROTECTED)
// ====================

// Serve admin page (protected)
app.get('/admin', requireAdminAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Admin logout route
app.get('/admin/logout', (req, res) => {
  res.redirect('/admin?logout=true');
});

// Protect all admin API routes
app.get('/api/admin/bookings', requireAdminAuth, (req, res, next) => {
  const query = `
    SELECT * FROM bookings
    ORDER BY created_at DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching bookings for admin:', err);
      return res.status(500).json({ error: 'Failed to fetch bookings' });
    }
    res.json(results);
  });
});

// Update booking status (protected)
app.put('/api/admin/bookings/:id/status', requireAdminAuth, (req, res) => {
  const bookingId = req.params.id;
  const { status } = req.body;

  if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const query = 'UPDATE bookings SET status = ? WHERE id = ?';
  db.query(query, [status, bookingId], (err, results) => {
    if (err) {
      console.error('Error updating booking status:', err);
      return res.status(500).json({ error: 'Failed to update status' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    console.log(`Booking ${bookingId} status updated to: ${status}`);
    res.json({
      success: true,
      message: 'Status updated successfully',
      bookingId: bookingId,
      newStatus: status
    });
  });
});

// Get booking statistics (protected)
app.get('/api/admin/stats', requireAdminAuth, (req, res) => {
  const queries = {
    total: 'SELECT COUNT(*) as count FROM bookings',
    pending: 'SELECT COUNT(*) as count FROM bookings WHERE status = "pending"',
    confirmed: 'SELECT COUNT(*) as count FROM bookings WHERE status = "confirmed"',
    completed: 'SELECT COUNT(*) as count FROM bookings WHERE status = "completed"',
    today: 'SELECT COUNT(*) as count FROM bookings WHERE DATE(created_at) = CURDATE()'
  };

  const results = {};
  let completedQueries = 0;
  const totalQueries = Object.keys(queries).length;

  Object.keys(queries).forEach(key => {
    db.query(queries[key], (err, result) => {
      if (err) {
        console.error(`Error fetching ${key} stats:`, err);
        results[key] = 0;
      } else {
        results[key] = result[0].count;
      }

      completedQueries++;
      if (completedQueries === totalQueries) {
        res.json(results);
      }
    });
  });
});

// Delete booking (protected)
app.delete('/api/admin/bookings/:id', requireAdminAuth, (req, res) => {
  const bookingId = req.params.id;

  const query = 'DELETE FROM bookings WHERE id = ?';
  db.query(query, [bookingId], (err, results) => {
    if (err) {
      console.error('Error deleting booking:', err);
      return res.status(500).json({ error: 'Failed to delete booking' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    console.log(`Booking ${bookingId} deleted`);
    res.json({
      success: true,
      message: 'Booking deleted successfully'
    });
  });
});

// ====================
// MAIN API ROUTES
// ====================

// Serve main website
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Main API endpoint
app.get('/api', (req, res) => {
  res.json({
    message: '🚀 Clean LAB Rwanda API is running!',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      services: '/api/services',
      bookings: '/api/bookings (POST)',
      admin: '/admin'
    },
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/api/health', (req, res) => {
  db.query('SELECT 1', (err) => {
    res.json({
      status: err ? 'Database connection failed' : 'OK',
      database: err ? 'disconnected' : 'connected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
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
  console.log(`🏥 Health: http://localhost:${PORT}/api/health`);
  console.log(`🛠️ Services: http://localhost:${PORT}/api/services`);
  console.log(`👨‍💼 Admin Dashboard: http://localhost:${PORT}/admin`);
  console.log(`🔐 Admin Password: Set in .env file as ADMIN_PASSWORD`);
});
