-- Database Schema for Expense Tracker Application
-- This file creates the MySQL/MariaDB database structure

-- Create database
CREATE DATABASE IF NOT EXISTS expense_tracker;
USE expense_tracker;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address VARCHAR(255),
    city VARCHAR(120),
    state VARCHAR(120),
    monthly_salary DECIMAL(10,2) DEFAULT 0.00,
    profile_picture VARCHAR(255),
    notification_email BOOLEAN DEFAULT TRUE,
    notification_budget BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);

-- Bank cards table
CREATE TABLE IF NOT EXISTS bank_cards (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    card_name VARCHAR(120) NOT NULL,
    card_holder_name VARCHAR(120),
    card_number VARCHAR(255) NOT NULL,
    expiry_date VARCHAR(10) NOT NULL,
    cvv VARCHAR(10) NOT NULL,
    card_type ENUM('credit', 'debit') DEFAULT 'debit',
    bank_name VARCHAR(100),
    balance DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    card_id INT,
    amount DECIMAL(10,2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    expense_date DATE NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'cash',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (card_id) REFERENCES bank_cards(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_expense_date (expense_date),
    INDEX idx_category (category)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    message TEXT NOT NULL,
    type ENUM('warning', 'info', 'success') DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read)
);

-- Sample data for testing (optional)
-- Insert a test user (password: 'password123')
-- INSERT INTO users (full_name, email, password_hash, monthly_salary) VALUES 
-- ('John Doe', 'john@example.com', 'pbkdf2:sha256:600000$...', 5000.00);

-- Insert sample categories (for reference)
-- Categories: Food, Transport, Shopping, Bills, Entertainment, Healthcare, Education, Others
