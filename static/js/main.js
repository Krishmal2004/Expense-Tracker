// ==================== Global Variables ====================
const API_BASE_URL = '';

// ==================== Utility Functions ====================

// Show alert message with animation
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alert-container') || createAlertContainer();
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible animate-slideInRight`;
    alertDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.75rem;">
            <span style="font-size: 1.25rem;">${getAlertIcon(type)}</span>
            <span>${message}</span>
        </div>
        <button class="alert-close" onclick="closeAlert(this)">&times;</button>
    `;
    
    alertContainer.appendChild(alertDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentElement) {
            alertDiv.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => alertDiv.remove(), 300);
        }
    }, 5000);
}

// Get alert icon based on type
function getAlertIcon(type) {
    const icons = {
        'success': '✅',
        'danger': '❌',
        'warning': '⚠️',
        'info': 'ℹ️'
    };
    return icons[type] || icons['info'];
}

// Close alert with animation
function closeAlert(button) {
    const alert = button.parentElement;
    alert.style. animation = 'fadeOut 0.3s ease forwards';
    setTimeout(() => alert.remove(), 300);
}

// Create alert container if it doesn't exist
function createAlertContainer() {
    const container = document.createElement('div');
    container.id = 'alert-container';
    container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        max-width: 400px;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    `;
    document.body.appendChild(container);
    
    // Add fadeOut animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeOut {
            from { opacity: 1; transform: translateX(0); }
            to { opacity: 0; transform: translateX(100%); }
        }
    `;
    document.head. appendChild(style);
    
    return container;
}

// Show loading spinner on button
function showLoading(button) {
    if (button) {
        button. disabled = true;
        button.dataset.originalText = button.innerHTML;
        button. innerHTML = '<span class="spinner spinner-sm"></span> Loading...';
        button.style.opacity = '0.8';
    }
}

// Hide loading spinner on button
function hideLoading(button) {
    if (button && button.dataset.originalText) {
        button.disabled = false;
        button. innerHTML = button.dataset.originalText;
        button.style. opacity = '1';
    }
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }). format(amount);
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(date);
}

// Format datetime
function formatDateTime(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

// API request helper with error handling
async function apiRequest(url, options = {}) {
    try {
        const response = await fetch(API_BASE_URL + url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ... options.headers
            }
        });
        
        const data = await response. json();
        
        if (!response. ok) {
            throw new Error(data.error || 'An error occurred');
        }
        
        return data;
    } catch (error) {
        console. error('API Error:', error);
        throw error;
    }
}

// ==================== Modal Functions ====================

// Open modal with animation
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Focus first input
        setTimeout(() => {
            const firstInput = modal.querySelector('input, select, textarea');
            if (firstInput) firstInput.focus();
        }, 100);
    }
}

// Close modal with animation
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList. remove('active');
        document.body. style.overflow = 'auto';
    }
}

// Close modal when clicking outside
document. addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList. remove('active');
        document.body.style. overflow = 'auto';
    }
});

// Close modal with Escape key
document. addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal.active');
        if (activeModal) {
            activeModal. classList.remove('active');
            document. body.style.overflow = 'auto';
        }
    }
});

// ==================== Sidebar Functions ====================

// Toggle sidebar on mobile
function toggleSidebar() {
    const sidebar = document. querySelector('.sidebar');
    const overlay = document.querySelector('. sidebar-overlay');
    
    if (sidebar && overlay) {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    }
}

// Close sidebar when clicking overlay
document.addEventListener('click', (e) => {
    if (e.target. classList.contains('sidebar-overlay')) {
        toggleSidebar();
    }
});

// Set active sidebar link
function setActiveSidebarLink() {
    const currentPath = window.location. pathname;
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    
    sidebarLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath) {
            link.classList. add('active');
        } else {
            link.classList. remove('active');
        }
    });
}

// ==================== User Menu ====================

// Toggle user menu dropdown
function toggleUserMenu() {
    const dropdown = document.querySelector('. user-menu-dropdown');
    if (dropdown) {
        dropdown.classList. toggle('active');
    }
}

// Close user menu when clicking outside
document. addEventListener('click', (e) => {
    const userMenu = document. querySelector('.user-menu');
    if (userMenu && !userMenu.contains(e.target)) {
        const dropdown = document.querySelector('.user-menu-dropdown');
        if (dropdown) {
            dropdown.classList. remove('active');
        }
    }
});

// Logout function
async function logout() {
    try {
        await apiRequest('/api/logout', { method: 'POST' });
        showAlert('Logged out successfully!', 'success');
        setTimeout(() => {
            window.location.href = '/login';
        }, 1000);
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

// Validate card number (Luhn algorithm)
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
        isEven = !isEven;
    }
    
    return sum % 10 === 0;
}

// Format card number input
function formatCardNumber(input) {
    let value = input.value. replace(/\s/g, ''). replace(/\D/g, '');
    let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
    input.value = formattedValue. substring(0, 19);
}

// Format expiry date input (MM/YY)
function formatExpiryDate(input) {
    let value = input.value.replace(/\D/g, '');
    
    if (value. length >= 2) {
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
    const currentMonth = now. getMonth() + 1;
    
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
    return categoryIcons[category?. toLowerCase()] || categoryIcons['other'];
}

// ==================== Animate Elements on Scroll ====================

function animateOnScroll() {
    const elements = document.querySelectorAll('[data-animate]');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const animation = entry.target. dataset.animate;
                entry.target.classList.add(`animate-${animation}`);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0. 1 });
    
    elements.forEach(el => observer.observe(el));
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
    const userMenuToggle = document. querySelector('.user-menu-toggle');
    if (userMenuToggle) {
        userMenuToggle. addEventListener('click', toggleUserMenu);
    }
    
    // Setup logout button
    const logoutBtn = document. querySelector('#logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?')) {
                logout();
            }
        });
    }
    
    // Initialize scroll animations
    animateOnScroll();
    
    // Add ripple effect to buttons
    document.querySelectorAll('. btn'). forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s ease-out;
                pointer-events: none;
            `;
            
            this. style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    });
});

// Add ripple animation keyframes
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(rippleStyle);