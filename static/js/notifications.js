/**
 * Notifications JavaScript - Notification Handling
 * Expense Tracker Application
 */

// ===========================
// TOAST NOTIFICATIONS
// ===========================

/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type: 'success', 'error', 'warning', 'info'
 * @param {number} duration - Duration in milliseconds
 */
function showToast(message, type = 'info', duration = 4000) {
    // Create toast container if it doesn't exist
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Get icon based on type
    const icons = {
        success: 'fa-check',
        error: 'fa-times',
        warning: 'fa-exclamation',
        info: 'fa-info'
    };
    
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${icons[type] || icons.info}"></i>
        </div>
        <div class="toast-content">
            <span class="toast-message">${message}</span>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add to container
    container.appendChild(toast);
    
    // Auto remove after duration
    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 300);
    }, duration);
    
    // Remove on click
    toast.addEventListener('click', () => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 300);
    });
}

// ===========================
// NOTIFICATIONS PANEL
// ===========================

let notificationsData = {
    notifications: [],
    unreadCount: 0
};

async function loadNotifications() {
    try {
        const response = await App.apiRequest('/notifications');
        notificationsData.notifications = response.notifications || [];
        notificationsData.unreadCount = notificationsData.notifications.filter(n => !n.is_read).length;
        updateNotificationBadge();
        return response;
    } catch (error) {
        console.error('Error loading notifications:', error);
        return { notifications: [] };
    }
}

function updateNotificationBadge() {
    const badge = document.querySelector('.notification-badge');
    if (badge) {
        if (notificationsData.unreadCount > 0) {
            badge.textContent = notificationsData.unreadCount > 99 ? '99+' : notificationsData.unreadCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
}

function renderNotificationsPanel() {
    const panel = document.getElementById('notificationsPanel');
    if (!panel) return;
    
    if (notificationsData.notifications.length === 0) {
        panel.innerHTML = `
            <div class="notifications-empty">
                <i class="fas fa-bell-slash"></i>
                <p>No notifications</p>
            </div>
        `;
        return;
    }
    
    panel.innerHTML = `
        <div class="notifications-header">
            <h4>Notifications</h4>
            <button class="btn btn-sm btn-secondary" onclick="markAllNotificationsRead()">
                Mark all read
            </button>
        </div>
        <div class="notifications-list">
            ${notificationsData.notifications.map(notification => `
                <div class="notification-item ${notification.is_read ? '' : 'unread'}" 
                     data-id="${notification.id}"
                     onclick="markNotificationRead(${notification.id})">
                    <div class="notification-icon notification-${notification.type}">
                        <i class="fas ${getNotificationIcon(notification.type)}"></i>
                    </div>
                    <div class="notification-content">
                        <p class="notification-message">${notification.message}</p>
                        <span class="notification-time">${App.formatRelativeTime(notification.created_at)}</span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function getNotificationIcon(type) {
    const icons = {
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle',
        success: 'fa-check-circle'
    };
    return icons[type] || icons.info;
}

async function markNotificationRead(notificationId) {
    try {
        await App.apiRequest(`/notifications/${notificationId}/read`, { method: 'PUT' });
        
        // Update local state
        const notification = notificationsData.notifications.find(n => n.id === notificationId);
        if (notification && !notification.is_read) {
            notification.is_read = true;
            notificationsData.unreadCount--;
            updateNotificationBadge();
            renderNotificationsPanel();
        }
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

async function markAllNotificationsRead() {
    try {
        await App.apiRequest('/notifications/read-all', { method: 'PUT' });
        
        // Update local state
        notificationsData.notifications.forEach(n => n.is_read = true);
        notificationsData.unreadCount = 0;
        updateNotificationBadge();
        renderNotificationsPanel();
        
        showToast('All notifications marked as read', 'success');
    } catch (error) {
        showToast('Failed to mark notifications as read', 'error');
    }
}

function toggleNotificationsPanel() {
    const panel = document.getElementById('notificationsPanel');
    if (panel) {
        panel.classList.toggle('show');
        
        if (panel.classList.contains('show')) {
            loadNotifications().then(() => renderNotificationsPanel());
        }
    }
}

// ===========================
// BUDGET WARNING NOTIFICATIONS
// ===========================

function checkBudgetWarning(summary) {
    if (!summary || !summary.monthly_salary || summary.monthly_salary <= 0) return;
    
    const budgetPercent = (summary.total_expenses / summary.monthly_salary) * 100;
    
    if (budgetPercent >= 100) {
        showToast(
            `You've exceeded your monthly budget! Current spending: ${App.formatCurrency(summary.total_expenses)}`,
            'error',
            6000
        );
    } else if (budgetPercent >= 80) {
        showToast(
            `Warning: You've used ${budgetPercent.toFixed(1)}% of your monthly budget`,
            'warning',
            5000
        );
    }
}

// ===========================
// NOTIFICATION STYLES (Inline)
// ===========================

const notificationStyles = `
    .notifications-panel {
        position: absolute;
        top: 100%;
        right: 0;
        width: 360px;
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius-lg);
        box-shadow: var(--shadow-xl);
        z-index: 1000;
        display: none;
        max-height: 400px;
        overflow: hidden;
    }
    
    .notifications-panel.show {
        display: block;
        animation: fadeIn 0.2s ease;
    }
    
    .notifications-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        border-bottom: 1px solid var(--border-color);
    }
    
    .notifications-header h4 {
        margin: 0;
        font-size: var(--font-size-base);
    }
    
    .notifications-list {
        overflow-y: auto;
        max-height: 320px;
    }
    
    .notification-item {
        display: flex;
        gap: 0.75rem;
        padding: 1rem;
        border-bottom: 1px solid var(--border-color);
        cursor: pointer;
        transition: background var(--transition-fast);
    }
    
    .notification-item:hover {
        background: var(--bg-secondary);
    }
    
    .notification-item.unread {
        background: rgba(59, 130, 246, 0.05);
    }
    
    .notification-item.unread::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 3px;
        background: var(--primary-color);
    }
    
    .notification-icon {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }
    
    .notification-warning {
        background: #fef3c7;
        color: var(--warning-color);
    }
    
    .notification-info {
        background: #dbeafe;
        color: var(--info-color);
    }
    
    .notification-success {
        background: #d1fae5;
        color: var(--success-color);
    }
    
    .notification-content {
        flex: 1;
        min-width: 0;
    }
    
    .notification-message {
        font-size: var(--font-size-sm);
        color: var(--text-primary);
        margin: 0;
        line-height: 1.4;
    }
    
    .notification-time {
        font-size: var(--font-size-xs);
        color: var(--text-light);
    }
    
    .notifications-empty {
        padding: 2rem;
        text-align: center;
        color: var(--text-light);
    }
    
    .notifications-empty i {
        font-size: 2rem;
        margin-bottom: 0.5rem;
    }
`;

// Inject notification styles
function injectNotificationStyles() {
    const styleEl = document.createElement('style');
    styleEl.textContent = notificationStyles;
    document.head.appendChild(styleEl);
}

// ===========================
// EVENT HANDLERS
// ===========================

function setupNotificationEvents() {
    // Notification bell click
    const notificationBell = document.querySelector('.notification-bell');
    if (notificationBell) {
        notificationBell.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleNotificationsPanel();
        });
    }
    
    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
        const panel = document.getElementById('notificationsPanel');
        const bell = document.querySelector('.notification-bell');
        
        if (panel && !panel.contains(e.target) && e.target !== bell) {
            panel.classList.remove('show');
        }
    });
}

// ===========================
// INITIALIZATION
// ===========================

document.addEventListener('DOMContentLoaded', () => {
    injectNotificationStyles();
    setupNotificationEvents();
    
    // Load notifications on authenticated pages
    const isAuthPage = window.location.pathname === '/login' || 
                       window.location.pathname === '/signup' ||
                       window.location.pathname === '/';
    
    if (!isAuthPage) {
        loadNotifications();
    }
});

// Export for use in other modules
window.Notifications = {
    show: showToast,
    load: loadNotifications,
    markRead: markNotificationRead,
    markAllRead: markAllNotificationsRead,
    checkBudget: checkBudgetWarning
};

// Make showToast globally available
window.showToast = showToast;
