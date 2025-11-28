// ==================== Global Variables ====================
const API_BASE_URL = '';

// ==================== Utility Functions ====================

// Show alert message
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alert-container') || createAlertContainer();
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible`;
    alertDiv.innerHTML = `
        ${message}
        <button class="alert-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    
    alertContainer.appendChild(alertDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Create alert container if it doesn't exist
function createAlertContainer() {
    const container = document.createElement('div');
    container.id = 'alert-container';
    container.style.position = 'fixed';
    container.style.top = '20px';
    container.style.right = '20px';
    container.style.zIndex = '9999';
    container.style. maxWidth = '400px';
    document.body.appendChild(container);
    return container;
}

// Show loading spinner
function showLoading(button) {
    if (button) {
        button. disabled = true;
        button.dataset.originalText = button.innerHTML;
        button.innerHTML = '<span class="spinner spinner-sm"></span> Loading...';
    }
}

// Hide loading spinner
function hideLoading(button) {
    if (button && button.dataset.originalText) {
        button.disabled = false;
        button.innerHTML = button.dataset.originalText;
    }
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(date);
}

// Format datetime
function formatDateTime(dateString) {
    const date = new Date(dateString);
    return new Intl.DateFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

// API request helper
async function apiRequest(url, options = {}) {
    try {
        const response = await fetch(API_BASE_URL + url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data. error || 'An error occurred');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// ==================== Modal Functions ====================

// Open modal
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// Close modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body. style.overflow = 'auto';
    }
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
});

// ==================== Sidebar Functions ====================

// Toggle sidebar on mobile
function toggleSidebar() {
    const sidebar = document. querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    if (sidebar && overlay) {
        sidebar. classList.toggle('active');
        overlay.classList.toggle('active');
    }
}

// Close sidebar when clicking overlay
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('sidebar-overlay')) {
        toggleSidebar();
    }
});

// Set active sidebar link
function setActiveSidebarLink() {
    const currentPath = window.location.pathname;
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    
    sidebarLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// ==================== User Menu ====================

// Toggle user menu dropdown
function toggleUserMenu() {
    const dropdown = document.querySelector('.user-menu-dropdown');
    if (dropdown) {
        dropdown. classList.toggle('active');
    }
}

// Close user menu when clicking outside
document.addEventListener('click', (e) => {
    const userMenu = document.querySelector('.user-menu');
    if (userMenu && !userMenu. contains(e.target)) {
        const dropdown = document.querySelector('.user-menu-dropdown');
        if (dropdown) {
            dropdown.classList.remove('active');
        }
    }
});

// Logout function
async function logout() {
    try {
        await apiRequest('/api/logout', { method: 'POST' });
        window.location.href = '/login';
    } catch (error) {
        showAlert('Logout failed: ' + error.message, 'danger');
    }
}

// ==================== Form Validation ====================

// Validate email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Validate card number (basic Luhn algorithm)
function validateCardNumber(cardNumber) {
    const digits = cardNumber.replace(/\s/g, '');
    
    if (!/^\d{13,19}$/.test(digits)) {
        return false;
    }
    
    let sum = 0;
    let isEven = false;
    
    for (let i = digits.length - 1; i >= 0; i--) {
        let digit = parseInt(digits[i]);
        
        if (isEven) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }
        
        sum += digit;
        isEven = ! isEven;
    }
    
    return sum % 10 === 0;
}

// Format card number input
function formatCardNumber(input) {
    let value = input.value.replace(/\s/g, '');
    let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
    input.value = formattedValue;
}

// Format expiry date input (MM/YY)
function formatExpiryDate(input) {
    let value = input.value.replace(/\D/g, '');
    
    if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    
    input.value = value;
}

// Validate expiry date
function validateExpiryDate(expiry) {
    const parts = expiry.split('/');
    if (parts.length !== 2) return false;
    
    const month = parseInt(parts[0]);
    const year = parseInt('20' + parts[1]);
    
    if (month < 1 || month > 12) return false;
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
        return false;
    }
    
    return true;
}

// ==================== Category Icons ====================

const categoryIcons = {
    'food': '🍔',
    'transport': '🚗',
    'shopping': '🛍️',
    'entertainment': '🎬',
    'utilities': '💡',
    'healthcare': '🏥',
    'education': '📚',
    'housing': '🏠',
    'insurance': '🛡️',
    'savings': '💰',
    'other': '📦'
};

function getCategoryIcon(category) {
    return categoryIcons[category. toLowerCase()] || categoryIcons['other'];
}

// ==================== Initialize on Page Load ====================

document.addEventListener('DOMContentLoaded', () => {
    // Set active sidebar link
    setActiveSidebarLink();
    
    // Setup menu toggle button
    const menuToggle = document.querySelector('.menu-toggle');
    if (menuToggle) {
        menuToggle. addEventListener('click', toggleSidebar);
    }
    
    // Setup user menu toggle
    const userMenuToggle = document.querySelector('.user-menu-toggle');
    if (userMenuToggle) {
        userMenuToggle.addEventListener('click', toggleUserMenu);
    }
    
    // Setup logout button
    const logoutBtn = document.querySelector('#logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e. preventDefault();
            if (confirm('Are you sure you want to logout?')) {
                logout();
            }
        });
    }
});