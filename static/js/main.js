/**
 * Main JavaScript - Global Functions and Utilities
 * Expense Tracker Application
 */

// API Base URL
const API_BASE = '/api';

// ===========================
// UTILITY FUNCTIONS
// ===========================

/**
 * Make an API request
 * @param {string} endpoint - API endpoint
 * @param {object} options - Fetch options
 * @returns {Promise} API response
 */
async function apiRequest(endpoint, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'same-origin'
    };

    const config = { ...defaultOptions, ...options };
    
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'An error occurred');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

/**
 * Format currency amount
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: USD)
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

/**
 * Format date
 * @param {string|Date} date - Date to format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
function formatDate(date, options = {}) {
    const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    };
    
    return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options })
        .format(new Date(date));
}

/**
 * Format relative time (e.g., "2 hours ago")
 * @param {string|Date} date - Date to format
 * @returns {string} Relative time string
 */
function formatRelativeTime(date) {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) {
        return 'Just now';
    } else if (diffMinutes < 60) {
        return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
        return formatDate(date);
    }
}

/**
 * Debounce function
 * @param {function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {function} Debounced function
 */
function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Get initials from name
 * @param {string} name - Full name
 * @returns {string} Initials
 */
function getInitials(name) {
    if (!name) return '?';
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
}

/**
 * Capitalize first letter
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid email
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Generate random ID
 * @returns {string} Random ID
 */
function generateId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// ===========================
// DOM UTILITIES
// ===========================

/**
 * Get element by selector
 * @param {string} selector - CSS selector
 * @returns {Element} DOM element
 */
function $(selector) {
    return document.querySelector(selector);
}

/**
 * Get all elements by selector
 * @param {string} selector - CSS selector
 * @returns {NodeList} DOM elements
 */
function $$(selector) {
    return document.querySelectorAll(selector);
}

/**
 * Create element with attributes and children
 * @param {string} tag - HTML tag name
 * @param {object} attrs - Element attributes
 * @param {array} children - Child elements or text
 * @returns {Element} Created element
 */
function createElement(tag, attrs = {}, children = []) {
    const element = document.createElement(tag);
    
    Object.entries(attrs).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'dataset') {
            Object.entries(value).forEach(([dataKey, dataValue]) => {
                element.dataset[dataKey] = dataValue;
            });
        } else if (key.startsWith('on')) {
            element.addEventListener(key.substring(2).toLowerCase(), value);
        } else {
            element.setAttribute(key, value);
        }
    });
    
    children.forEach(child => {
        if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
        } else if (child instanceof Element) {
            element.appendChild(child);
        }
    });
    
    return element;
}

/**
 * Show loading spinner
 * @param {Element} container - Container element
 */
function showLoading(container) {
    const loader = createElement('div', { className: 'loading-overlay' }, [
        createElement('div', { className: 'spinner spinner-lg' })
    ]);
    container.appendChild(loader);
}

/**
 * Hide loading spinner
 * @param {Element} container - Container element
 */
function hideLoading(container) {
    const loader = container.querySelector('.loading-overlay');
    if (loader) {
        loader.remove();
    }
}

// ===========================
// LOCAL STORAGE HELPERS
// ===========================

/**
 * Get item from localStorage with JSON parsing
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if key doesn't exist
 * @returns {*} Stored value or default
 */
function getStorageItem(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error('Error reading from localStorage:', error);
        return defaultValue;
    }
}

/**
 * Set item in localStorage with JSON stringification
 * @param {string} key - Storage key
 * @param {*} value - Value to store
 */
function setStorageItem(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error('Error writing to localStorage:', error);
    }
}

/**
 * Remove item from localStorage
 * @param {string} key - Storage key
 */
function removeStorageItem(key) {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error('Error removing from localStorage:', error);
    }
}

// ===========================
// SESSION & AUTH MANAGEMENT
// ===========================

/**
 * Check if user is authenticated
 * @returns {Promise<boolean>} Is authenticated
 */
async function isAuthenticated() {
    try {
        const response = await apiRequest('/auth/verify');
        return response.authenticated;
    } catch (error) {
        return false;
    }
}

/**
 * Get current user info
 * @returns {Promise<object>} User data
 */
async function getCurrentUser() {
    try {
        const response = await apiRequest('/user/profile');
        return response;
    } catch (error) {
        return null;
    }
}

/**
 * Redirect to login if not authenticated
 */
async function requireAuth() {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
        window.location.href = '/login';
    }
}

/**
 * Redirect to dashboard if already authenticated
 */
async function redirectIfAuth() {
    const authenticated = await isAuthenticated();
    if (authenticated) {
        window.location.href = '/dashboard';
    }
}

/**
 * Logout user
 */
async function logout() {
    try {
        await apiRequest('/auth/logout', { method: 'POST' });
        window.location.href = '/login';
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = '/login';
    }
}

// ===========================
// AUTO LOGOUT FUNCTIONALITY
// ===========================

let inactivityTimeout;
const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes

function resetInactivityTimer() {
    clearTimeout(inactivityTimeout);
    inactivityTimeout = setTimeout(() => {
        showToast('Session expired due to inactivity', 'warning');
        setTimeout(() => logout(), 2000);
    }, INACTIVITY_LIMIT);
}

function setupAutoLogout() {
    // Reset timer on user activity
    ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'].forEach(event => {
        document.addEventListener(event, resetInactivityTimer, true);
    });
    
    // Start initial timer
    resetInactivityTimer();
}

// ===========================
// CATEGORY HELPERS
// ===========================

const EXPENSE_CATEGORIES = [
    { value: 'Food', label: 'Food & Dining', icon: 'fa-utensils', color: 'category-food' },
    { value: 'Transport', label: 'Transport', icon: 'fa-car', color: 'category-transport' },
    { value: 'Shopping', label: 'Shopping', icon: 'fa-shopping-bag', color: 'category-shopping' },
    { value: 'Bills', label: 'Bills & Utilities', icon: 'fa-file-invoice', color: 'category-bills' },
    { value: 'Entertainment', label: 'Entertainment', icon: 'fa-film', color: 'category-entertainment' },
    { value: 'Healthcare', label: 'Healthcare', icon: 'fa-heartbeat', color: 'category-healthcare' },
    { value: 'Education', label: 'Education', icon: 'fa-graduation-cap', color: 'category-education' },
    { value: 'Others', label: 'Others', icon: 'fa-ellipsis-h', color: 'category-others' }
];

function getCategoryInfo(categoryValue) {
    return EXPENSE_CATEGORIES.find(cat => cat.value === categoryValue) || EXPENSE_CATEGORIES[7];
}

function getCategoryIcon(category) {
    const info = getCategoryInfo(category);
    return info ? info.icon : 'fa-ellipsis-h';
}

function getCategoryColor(category) {
    const info = getCategoryInfo(category);
    return info ? info.color : 'category-others';
}

// ===========================
// CHART COLORS
// ===========================

const CHART_COLORS = [
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Yellow
    '#ef4444', // Red
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#f97316', // Orange
];

// ===========================
// INITIALIZATION
// ===========================

document.addEventListener('DOMContentLoaded', () => {
    // Setup auto logout for authenticated pages
    const isAuthPage = window.location.pathname === '/login' || 
                       window.location.pathname === '/signup' ||
                       window.location.pathname === '/';
    
    if (!isAuthPage) {
        setupAutoLogout();
    }
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        const dropdowns = $$('.dropdown-menu.show, .dropdown-content.show');
        dropdowns.forEach(dropdown => {
            if (!dropdown.parentElement.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });
    });
});

// Export functions for use in other modules
window.App = {
    apiRequest,
    formatCurrency,
    formatDate,
    formatRelativeTime,
    debounce,
    getInitials,
    capitalize,
    isValidEmail,
    generateId,
    $,
    $$,
    createElement,
    showLoading,
    hideLoading,
    getStorageItem,
    setStorageItem,
    removeStorageItem,
    isAuthenticated,
    getCurrentUser,
    requireAuth,
    redirectIfAuth,
    logout,
    EXPENSE_CATEGORIES,
    getCategoryInfo,
    getCategoryIcon,
    getCategoryColor,
    CHART_COLORS
};
