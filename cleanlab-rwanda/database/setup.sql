CREATE DATABASE IF NOT EXISTS cleanlab_db;
USE cleanlab_db;

CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  contact VARCHAR(255) NOT NULL,
  service_type VARCHAR(100) NOT NULL,
  preferred_datetime DATETIME NOT NULL,
  address TEXT NOT NULL,
  notes TEXT,
  status ENUM('pending', 'confirmed', 'completed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optional: Insert sample services
INSERT INTO bookings (name, contact, service_type, preferred_datetime, address, notes) VALUES
('John Doe', 'john@example.com', 'Home Cleaning', '2025-10-07 10:00:00', 'KG 123 St, Kigali', 'Regular cleaning service');
