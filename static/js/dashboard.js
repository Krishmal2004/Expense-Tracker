// ==================== Dashboard Data ====================

let summaryData = {};
let monthlyData = [];
let categoryData = [];

// ==================== Initialize Dashboard ====================

document.addEventListener('DOMContentLoaded', async () => {
    await loadDashboardData();
    await loadRecentTransactions();
    await loadNotificationCount();
});

// ==================== Load Dashboard Data ====================

async function loadDashboardData() {
    try {
        // Load summary
        summaryData = await apiRequest('/api/analytics/summary');
        updateSummaryCards();
        
        // Load monthly data
        monthlyData = await apiRequest('/api/analytics/monthly');
        renderMonthlyChart();
        
        // Load category data
        categoryData = await apiRequest('/api/analytics/category');
        renderCategoryChart();
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showAlert('Failed to load dashboard data', 'danger');
    }
}

// ==================== Update Summary Cards ====================

function updateSummaryCards() {
    // Monthly Salary
    const salaryElement = document.getElementById('monthly-salary');
    if (salaryElement) {
        salaryElement.textContent = formatCurrency(summaryData.monthly_salary || 0);
    }
    
    // Total Expenses
    const expensesElement = document.getElementById('total-expenses');
    if (expensesElement) {
        expensesElement.textContent = formatCurrency(summaryData.total_expenses || 0);
    }
    
    // Remaining Balance
    const balanceElement = document.getElementById('remaining-balance');
    if (balanceElement) {
        balanceElement.textContent = formatCurrency(summaryData.remaining_balance || 0);
    }
    
    // Total Bank Balance
    const bankBalanceElement = document.getElementById('total-balance');
    if (bankBalanceElement) {
        bankBalanceElement.textContent = formatCurrency(summaryData.total_balance || 0);
    }
}

// ==================== Load Recent Transactions ====================

async function loadRecentTransactions() {
    try {
        const expenses = await apiRequest('/api/expenses? limit=5');
        renderRecentTransactions(expenses);
    } catch (error) {
        console. error('Error loading recent transactions:', error);
    }
}

function renderRecentTransactions(expenses) {
    const container = document.getElementById('recent-transactions');
    if (!container) return;
    
    if (expenses.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📊</div>
                <h3>No transactions yet</h3>
                <p>Start adding your expenses to see them here</p>
                <a href="/expenses" class="btn btn-primary">Add Expense</a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = expenses.map(expense => `
        <div class="transaction-item">
            <div class="transaction-info">
                <div class="transaction-icon">
                    ${getCategoryIcon(expense.category)}
                </div>
                <div class="transaction-details">
                    <h4>${expense. description}</h4>
                    <p>${formatDate(expense.expense_date)} • ${expense.category}</p>
                </div>
            </div>
            <div class="transaction-amount expense">
                <p>-${formatCurrency(expense.amount)}</p>
            </div>
        </div>
    `).join('');
}

// ==================== Load Notification Count ====================

async function loadNotificationCount() {
    try {
        const notifications = await apiRequest('/api/notifications');
        const unreadCount = notifications.filter(n => !n.is_read).length;
        
        const badge = document.querySelector('.notification-badge');
        if (badge) {
            if (unreadCount > 0) {
                badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

// ==================== Charts ====================

let monthlyChart = null;
let categoryChart = null;

function renderMonthlyChart() {
    const ctx = document.getElementById('monthly-chart');
    if (!ctx) return;
    
    const labels = monthlyData.map(item => {
        const date = new Date(item.month + '-01');
        return date. toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    });
    
    const data = monthlyData.map(item => item. total);
    
    if (monthlyChart) {
        monthlyChart.destroy();
    }
    
    monthlyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Monthly Expenses',
                data: data,
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Expenses: ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

function renderCategoryChart() {
    const ctx = document.getElementById('category-chart');
    if (! ctx) return;
    
    const labels = categoryData.map(item => item.category);
    const data = categoryData.map(item => item.total);
    const colors = [
        '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', 
        '#10b981', '#3b82f6', '#ef4444', '#84cc16'
    ];
    
    if (categoryChart) {
        categoryChart.destroy();
    }
    
    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = formatCurrency(context.parsed);
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}