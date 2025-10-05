-- Create database
CREATE DATABASE IF NOT EXISTS cleanlab_db;
USE cleanlab_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255),
    full_name VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_code VARCHAR(6),
    code_expires DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Services table
CREATE TABLE IF NOT EXISTS services (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    category ENUM('laundry', 'home_cleaning', 'garden_cleaning', 'institutional') NOT NULL,
    description TEXT,
    base_price DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_code VARCHAR(20) UNIQUE NOT NULL,
    user_id INT NOT NULL,
    service_id INT NOT NULL,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    address TEXT NOT NULL,
    special_instructions TEXT,
    status ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
    total_amount DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id)
);

-- Insert sample services
INSERT IGNORE INTO services (name, category, description, base_price) VALUES 
('Standard Laundry', 'laundry', 'Professional washing, drying, and folding service with free pick-up & delivery', 5000.00),
('Dry Cleaning', 'laundry', 'Expert dry cleaning for delicate fabrics and special garments', 8000.00),
('Home Cleaning', 'home_cleaning', 'Complete home cleaning service including living room, bedrooms, kitchen, and bathrooms', 25000.00),
('Deep Cleaning', 'home_cleaning', 'Thorough deep cleaning with sanitization and organization', 40000.00),
('Garden Maintenance', 'garden_cleaning', 'Garden cleaning, lawn mowing, and plant care', 15000.00),
('Institutional Cleaning', 'institutional', 'Commercial cleaning for businesses, offices, and institutions', 50000.00);
