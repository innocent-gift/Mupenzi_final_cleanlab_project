-- Clean LAB Rwanda Database Schema
-- Created for professional cleaning services booking system

CREATE DATABASE IF NOT EXISTS cleanlab_rwanda;
USE cleanlab_rwanda;

-- Bookings table to store all service bookings
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_date_time (date_time),
    INDEX idx_created_at (created_at)
);

-- Services table with pricing information
CREATE TABLE IF NOT EXISTS services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    standard_price DECIMAL(10, 2),
    express_price DECIMAL(10, 2),
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category (category)
);

-- Testimonials table for customer reviews
CREATE TABLE IF NOT EXISTS testimonials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_name VARCHAR(255) NOT NULL,
    text TEXT NOT NULL,
    location VARCHAR(100),
    rating INT DEFAULT 5,
    approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_approved (approved),
    INDEX idx_rating (rating)
);

-- Insert default services with Rwandan pricing
INSERT IGNORE INTO services (name, standard_price, express_price, category) VALUES
('Suits', 3000.00, 7000.00, 'dry_cleaning'),
('Dress', 3000.00, 6000.00, 'dry_cleaning'),
('Bride Dress', 8000.00, 16000.00, 'dry_cleaning'),
('Coat', 2500.00, 5000.00, 'dry_cleaning'),
('Umushanana', 3500.00, 7000.00, 'dry_cleaning'),
('Shirt', 1500.00, 3000.00, 'laundry'),
('Trouser', 1500.00, 3000.00, 'laundry'),
('Bed Cover (big)', 10000.00, 20000.00, 'laundry'),
('Curtains (big)', 15000.00, 30000.00, 'laundry'),
('Shoes', 10000.00, 20000.00, 'special');

-- Insert sample testimonials
INSERT IGNORE INTO testimonials (client_name, text, location, rating, approved) VALUES
('Alice M.', 'Clean LAB transformed my home! Their team is professional, punctual, and does an amazing job every time.', 'Kigali', 5, TRUE),
('John D.', 'As a busy professional, their laundry service has been a lifesaver. Pickup and delivery is so convenient!', 'Huye', 5, TRUE),
('Tech Solutions Ltd.', 'We use Clean LAB for our office cleaning and could not be happier. Reliable and thorough service.', 'Kigali', 5, TRUE),
('Marie U.', 'The garden cleaning service made my outdoor space look brand new. Highly recommended!', 'Musanze', 5, TRUE);

-- Optional: Admin users table for future admin panel
CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'manager', 'staff') DEFAULT 'staff',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    INDEX idx_username (username),
    INDEX idx_email (email)
);

-- Optional: Settings table for configurable parameters
CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT IGNORE INTO settings (setting_key, setting_value, description) VALUES
('company_name', 'Clean LAB Rwanda', 'Business name'),
('contact_phone', '+250784854834', 'Primary contact number'),
('contact_email', 'cleanlabrwanda@gmail.com', 'Primary email address'),
('whatsapp_number', '+250784854834', 'WhatsApp business number'),
('business_hours', '{"weekdays": "7:00-19:00", "weekends": "8:00-18:00"}', 'Operating hours'),
('booking_confirmation_message', 'Thank you for booking with Clean LAB Rwanda! We will contact you within 2 hours to confirm your appointment.', 'Default booking confirmation message');

-- Create a view for booking analytics
CREATE OR REPLACE VIEW booking_analytics AS
SELECT 
    DATE(created_at) as booking_date,
    COUNT(*) as total_bookings,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bookings,
    service_type,
    AVG(TIMESTAMPDIFF(HOUR, created_at, updated_at)) as avg_processing_hours
FROM bookings 
GROUP BY DATE(created_at), service_type;

-- Create a view for service popularity
CREATE OR REPLACE VIEW service_popularity AS
SELECT 
    service_type,
    COUNT(*) as booking_count,
    AVG(TIMESTAMPDIFF(HOUR, created_at, updated_at)) as avg_completion_time,
    (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM bookings)) as percentage
FROM bookings 
WHERE status = 'completed'
GROUP BY service_type
ORDER BY booking_count DESC;

-- Create trigger to log booking status changes
CREATE TABLE IF NOT EXISTS booking_audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT,
    old_status ENUM('pending', 'confirmed', 'completed', 'cancelled'),
    new_status ENUM('pending', 'confirmed', 'completed', 'cancelled'),
    changed_by VARCHAR(100) DEFAULT 'system',
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_booking_id (booking_id),
    INDEX idx_changed_at (changed_at)
);

DELIMITER $$
CREATE TRIGGER before_booking_status_update 
    BEFORE UPDATE ON bookings
    FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO booking_audit_log (booking_id, old_status, new_status, changed_by)
        VALUES (OLD.id, OLD.status, NEW.status, 'system');
    END IF;
END$$
DELIMITER ;

-- Create indexes for better performance
CREATE INDEX idx_bookings_contact ON bookings(contact(50));
CREATE INDEX idx_bookings_service_type ON bookings(service_type);
CREATE INDEX idx_testimonials_created_at ON testimonials(created_at);

-- Display table information
SELECT 
    table_name, 
    table_rows as 'Number of Rows',
    ROUND(data_length/1024/1024, 2) as 'Data Size (MB)',
    ROUND(index_length/1024/1024, 2) as 'Index Size (MB)'
FROM information_schema.tables 
WHERE table_schema = 'cleanlab_rwanda'
ORDER BY table_name;
