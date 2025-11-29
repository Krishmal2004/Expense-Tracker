// ==================== Dashboard Data ====================

let summaryData = {};
let monthlyData = [];
let categoryData = [];

// ==================== Initialize Dashboard ====================

document.addEventListener('DOMContentLoaded', async () => {
    await loadDashboardData();
    await loadRecentTransactions();
    await loadNotificationCount();
    
    // Add staggered animation to stat cards
    animateStatCards();
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
        console. error('Error loading dashboard data:', error);
        showAlert('Failed to load dashboard data', 'danger');
    }
}

// ==================== Animate Stat Cards ====================

function animateStatCards() {
    const statCards = document. querySelectorAll('. stat-card');
    statCards.forEach((card, index) => {
        card.style.opacity = '0';
        card. style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            card. style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            card.style.opacity = '1';
            card. style.transform = 'translateY(0)';
        }, 100 + (index * 100));
    });
}

// ==================== Update Summary Cards ====================

function updateSummaryCards() {
    // Monthly Salary with animation
    const salaryElement = document.getElementById('monthly-salary');
    if (salaryElement) {
        animateValue(salaryElement, 0, summaryData.monthly_salary || 0, 1000);
    }
    
    // Total Expenses
    const expensesElement = document.getElementById('total-expenses');
    if (expensesElement) {
        animateValue(expensesElement, 0, summaryData.total_expenses || 0, 1000);
    }
    
    // Remaining Balance
    const balanceElement = document.getElementById('remaining-balance');
    if (balanceElement) {
        animateValue(balanceElement, 0, summaryData.remaining_balance || 0, 1000);
    }
    
    // Total Bank Balance
    const bankBalanceElement = document. getElementById('total-balance');
    if (bankBalanceElement) {
        animateValue(bankBalanceElement, 0, summaryData.total_balance || 0, 1000);
    }
}

// Animate number value
function animateValue(element, start, end, duration) {
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = start + (end - start) * easeOut;
        
        element.textContent = formatCurrency(current);
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// ==================== Load Recent Transactions ====================

async function loadRecentTransactions() {
    try {
        const expenses = await apiRequest('/api/expenses? limit=5');
        renderRecentTransactions(expenses);
    } catch (error) {
        console.error('Error loading recent transactions:', error);
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
    
    container.innerHTML = expenses.map((expense, index) => `
        <div class="transaction-item" style="animation-delay: ${index * 0.1}s">
            <div class="transaction-info">
                <div class="transaction-icon">
                    ${getCategoryIcon(expense. category)}
                </div>
                <div class="transaction-details">
                    <h4>${expense.description}</h4>
                    <p>${formatDate(expense.expense_date)} • ${expense.category}</p>
                </div>
            </div>
            <div class="transaction-amount expense">
                <p>-${formatCurrency(expense.amount)}</p>
            </div>
        </div>
    `). join('');
}

// ==================== Load Notification Count ====================

async function loadNotificationCount() {
    try {
        const notifications = await apiRequest('/api/notifications');
        const unreadCount = notifications. filter(n => ! n.is_read).length;
        
        const badges = document.querySelectorAll('.notification-badge');
        badges.forEach(badge => {
            if (unreadCount > 0) {
                badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
                badge. style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        });
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
    
    const labels = monthlyData. map(item => {
        const date = new Date(item. month + '-01');
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    });
    
    const data = monthlyData.map(item => item.total);
    
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
                backgroundColor: 'rgba(99, 102, 241, 0. 1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointRadius: 5,
                pointHoverRadius: 8,
                pointBackgroundColor: '#6366f1',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1500,
                easing: 'easeOutQuart'
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return 'Expenses: ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            family: "'Inter', sans-serif",
                            size: 11
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        font: {
                            family: "'Inter', sans-serif",
                            size: 11
                        },
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
    if (!ctx) return;
    
    const labels = categoryData. map(item => item.category);
    const data = categoryData.map(item => item.total);
    const colors = [
        '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', 
        '#10b981', '#3b82f6', '#ef4444', '#84cc16',
        '#06b6d4', '#f97316'
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
                borderWidth: 3,
                borderColor: '#fff',
                hoverOffset: 15
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1500,
                easing: 'easeOutQuart',
                animateRotate: true,
                animateScale: true
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            family: "'Inter', sans-serif",
                            size: 11
                        },
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = formatCurrency(context. parsed);
                            const total = context.dataset.data. reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '65%'
        }
    });
}