/**
 * Dashboard JavaScript - Dashboard Data Loading
 * Expense Tracker Application
 */

// ===========================
// DASHBOARD STATE
// ===========================

let dashboardData = {
    user: null,
    summary: null,
    recentTransactions: [],
    monthlyData: [],
    categoryData: []
};

// ===========================
// DASHBOARD INITIALIZATION
// ===========================

async function initDashboard() {
    // Show loading
    showDashboardLoading(true);
    
    try {
        // Load all dashboard data
        await Promise.all([
            loadUserData(),
            loadDashboardSummary(),
            loadMonthlyData(),
            loadCategoryData()
        ]);
        
        // Render dashboard components
        renderWelcomeBanner();
        renderStatCards();
        renderRecentTransactions();
        
        // Initialize charts
        if (typeof initCharts === 'function') {
            initCharts();
        }
        
        // Setup event listeners
        setupDashboardEvents();
        
    } catch (error) {
        console.error('Dashboard initialization error:', error);
        showToast('Failed to load dashboard data', 'error');
    } finally {
        showDashboardLoading(false);
    }
}

// ===========================
// DATA LOADING FUNCTIONS
// ===========================

async function loadUserData() {
    try {
        const response = await App.apiRequest('/user/profile');
        dashboardData.user = response;
        return response;
    } catch (error) {
        console.error('Error loading user data:', error);
        throw error;
    }
}

async function loadDashboardSummary() {
    try {
        const response = await App.apiRequest('/dashboard/summary');
        dashboardData.summary = response;
        dashboardData.recentTransactions = response.recent_transactions || [];
        return response;
    } catch (error) {
        console.error('Error loading dashboard summary:', error);
        throw error;
    }
}

async function loadMonthlyData() {
    try {
        const response = await App.apiRequest('/analytics/monthly');
        dashboardData.monthlyData = response.monthly_data || [];
        return response;
    } catch (error) {
        console.error('Error loading monthly data:', error);
        return { monthly_data: [] };
    }
}

async function loadCategoryData() {
    try {
        const response = await App.apiRequest('/analytics/category');
        dashboardData.categoryData = response.categories || [];
        return response;
    } catch (error) {
        console.error('Error loading category data:', error);
        return { categories: [] };
    }
}

// ===========================
// RENDER FUNCTIONS
// ===========================

function renderWelcomeBanner() {
    const banner = document.getElementById('welcomeBanner');
    if (!banner || !dashboardData.user) return;
    
    const firstName = dashboardData.user.full_name?.split(' ')[0] || 'User';
    const greeting = getGreeting();
    
    banner.innerHTML = `
        <h2>${greeting}, ${firstName}!</h2>
        <p>Here's an overview of your expenses this month</p>
    `;
}

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
}

function renderStatCards() {
    const summary = dashboardData.summary;
    if (!summary) return;
    
    // Monthly Salary
    const salaryCard = document.getElementById('monthlySalary');
    if (salaryCard) {
        salaryCard.textContent = App.formatCurrency(summary.monthly_salary || 0);
    }
    
    // Total Expenses
    const expensesCard = document.getElementById('totalExpenses');
    if (expensesCard) {
        expensesCard.textContent = App.formatCurrency(summary.total_expenses || 0);
    }
    
    // Remaining Balance
    const balanceCard = document.getElementById('remainingBalance');
    if (balanceCard) {
        const balance = summary.remaining_balance || 0;
        balanceCard.textContent = App.formatCurrency(balance);
        balanceCard.classList.toggle('text-danger', balance < 0);
        balanceCard.classList.toggle('text-success', balance > 0);
    }
    
    // Transaction Count
    const countCard = document.getElementById('transactionCount');
    if (countCard) {
        countCard.textContent = summary.transaction_count || 0;
    }
    
    // Update trend indicators if available
    updateTrendIndicators();
}

function updateTrendIndicators() {
    // This would compare with previous month data
    // For now, we'll show static indicators
}

function renderRecentTransactions() {
    const container = document.getElementById('recentTransactions');
    if (!container) return;
    
    const transactions = dashboardData.recentTransactions;
    
    if (transactions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt"></i>
                <h4>No transactions yet</h4>
                <p>Start tracking your expenses by adding your first transaction</p>
                <a href="/add-expense" class="btn btn-primary">
                    <i class="fas fa-plus"></i> Add Expense
                </a>
            </div>
        `;
        return;
    }
    
    const tableHtml = `
        <table class="transactions-table">
            <thead>
                <tr>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${transactions.map(tx => renderTransactionRow(tx)).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = tableHtml;
}

function renderTransactionRow(transaction) {
    const categoryInfo = App.getCategoryInfo(transaction.category);
    
    return `
        <tr data-id="${transaction.id}">
            <td>
                <div class="transaction-category">
                    <div class="category-icon ${categoryInfo.color}">
                        <i class="fas ${categoryInfo.icon}"></i>
                    </div>
                    <span>${categoryInfo.label}</span>
                </div>
            </td>
            <td>${transaction.description || '-'}</td>
            <td>${App.formatDate(transaction.expense_date)}</td>
            <td class="transaction-amount expense">
                -${App.formatCurrency(transaction.amount)}
            </td>
            <td class="transaction-actions">
                <button onclick="editTransaction(${transaction.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete" onclick="deleteTransaction(${transaction.id})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `;
}

// ===========================
// ACTION FUNCTIONS
// ===========================

async function deleteTransaction(id) {
    if (!confirm('Are you sure you want to delete this transaction?')) {
        return;
    }
    
    try {
        await App.apiRequest(`/expenses/${id}`, { method: 'DELETE' });
        showToast('Transaction deleted successfully', 'success');
        
        // Reload dashboard data
        await loadDashboardSummary();
        renderStatCards();
        renderRecentTransactions();
        
        // Update charts
        if (typeof updateCharts === 'function') {
            await loadCategoryData();
            await loadMonthlyData();
            updateCharts();
        }
    } catch (error) {
        showToast(error.message || 'Failed to delete transaction', 'error');
    }
}

function editTransaction(id) {
    // Redirect to edit page or open modal
    window.location.href = `/add-expense?edit=${id}`;
}

// ===========================
// EVENT HANDLERS
// ===========================

function setupDashboardEvents() {
    // User dropdown toggle
    const userDropdown = document.querySelector('.user-dropdown-toggle');
    const dropdownMenu = document.querySelector('.user-dropdown .dropdown-menu');
    
    if (userDropdown && dropdownMenu) {
        userDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');
        });
    }
    
    // Sidebar toggle for mobile
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            overlay?.classList.toggle('show');
        });
        
        overlay?.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('show');
        });
    }
    
    // Logout button
    const logoutBtns = document.querySelectorAll('[data-logout]');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            App.logout();
        });
    });
    
    // Update user info in header
    updateUserHeader();
}

function updateUserHeader() {
    const user = dashboardData.user;
    if (!user) return;
    
    // Update user name
    const userNameEl = document.querySelector('.user-name');
    if (userNameEl) {
        userNameEl.textContent = user.full_name || 'User';
    }
    
    // Update user email
    const userEmailEl = document.querySelector('.user-email');
    if (userEmailEl) {
        userEmailEl.textContent = user.email || '';
    }
    
    // Update avatar
    const avatarEl = document.querySelector('.user-avatar');
    if (avatarEl && user.full_name) {
        avatarEl.textContent = App.getInitials(user.full_name);
    }
}

// ===========================
// LOADING STATE
// ===========================

function showDashboardLoading(show) {
    const loader = document.getElementById('dashboardLoader');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
    }
}

// ===========================
// EXPORT DASHBOARD DATA
// ===========================

function getDashboardData() {
    return dashboardData;
}

// ===========================
// INITIALIZATION
// ===========================

document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.dashboard-wrapper')) {
        initDashboard();
    }
});

// Export for use in other modules
window.Dashboard = {
    init: initDashboard,
    getData: getDashboardData,
    refresh: initDashboard,
    deleteTransaction,
    editTransaction
};
