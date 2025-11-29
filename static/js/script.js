// ==================== Standalone Script for Basic Pages ====================

// Initialize State
let expenses = JSON.parse(localStorage. getItem('expenses')) || [];
let expenseChart = null;

// Set default date to today
document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('date');
    if (dateInput) {
        dateInput.valueAsDate = new Date();
    }
    
    const currentDateEl = document.getElementById('current-date');
    if (currentDateEl) {
        currentDateEl.innerText = new Date(). toDateString();
    }
    
    // Initialize UI
    updateUI();
    
    // Setup form
    setupForm();
});

// Setup Form
function setupForm() {
    const form = document.getElementById('expense-form');
    if (!form) return;
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        addExpense();
    });
}

// Add Expense Function
function addExpense() {
    const cardSelect = document.getElementById('card-select');
    const amountInput = document. getElementById('amount');
    const categoryInput = document.getElementById('category');
    const dateInput = document.getElementById('date');
    
    if (!amountInput || !categoryInput || !dateInput) return;
    
    const newExpense = {
        id: Date.now(),
        card: cardSelect ?  cardSelect.value : 'Cash',
        amount: parseFloat(amountInput.value),
        category: categoryInput.value,
        date: dateInput.value
    };
    
    if (isNaN(newExpense.amount) || newExpense. amount <= 0) {
        showNotification('Please enter a valid amount', 'error');
        return;
    }
    
    expenses.push(newExpense);
    saveData();
    updateUI();
    
    // Reset form
    const form = document.getElementById('expense-form');
    if (form) {
        form.reset();
        dateInput.valueAsDate = new Date();
    }
    
    showNotification('Expense added successfully!', 'success');
}

// Save to LocalStorage
function saveData() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

// Delete Expense
function deleteExpense(id) {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    
    expenses = expenses.filter(expense => expense.id !== id);
    saveData();
    updateUI();
    showNotification('Expense deleted! ', 'success');
}

// Calculate Totals
function calculateTotals() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let monthTotal = 0;
    let yearTotal = 0;

    expenses.forEach(expense => {
        const expenseDate = new Date(expense.date);
        
        if (expenseDate.getFullYear() === currentYear) {
            yearTotal += expense.amount;
            
            if (expenseDate.getMonth() === currentMonth) {
                monthTotal += expense.amount;
            }
        }
    });

    const monthTotalEl = document.getElementById('month-total');
    const yearTotalEl = document.getElementById('year-total');
    const totalCountEl = document.getElementById('total-count');
    
    if (monthTotalEl) monthTotalEl.innerText = `$${monthTotal. toFixed(2)}`;
    if (yearTotalEl) yearTotalEl.innerText = `$${yearTotal.toFixed(2)}`;
    if (totalCountEl) totalCountEl. innerText = expenses. length;
}

// Update Chart
function updateChart() {
    const canvas = document.getElementById('expenseChart');
    if (!canvas) return;
    
    const ctx = canvas. getContext('2d');
    
    // Group amounts by category
    const categories = {};
    expenses.forEach(expense => {
        if (categories[expense.category]) {
            categories[expense.category] += expense.amount;
        } else {
            categories[expense.category] = expense.amount;
        }
    });

    const labels = Object.keys(categories);
    const data = Object.values(categories);

    // Destroy old chart if exists
    if (expenseChart) {
        expenseChart.destroy();
    }

    // Create new chart
    expenseChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                label: 'Spending',
                data: data,
                backgroundColor: [
                    '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', 
                    '#10b981', '#3b82f6', '#ef4444', '#84cc16'
                ],
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
                easing: 'easeOutQuart'
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        usePointStyle: true
                    }
                }
            },
            cutout: '60%'
        }
    });
}

// Render List
function renderList() {
    const list = document.getElementById('transaction-list');
    if (!list) return;
    
    list.innerHTML = '';
    
    if (expenses.length === 0) {
        list.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 3rem;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📊</div>
                    <h3>No expenses yet</h3>
                    <p style="color: #64748b;">Start adding your expenses to track them here</p>
                </td>
            </tr>
        `;
        return;
    }
    
    // Sort by date (newest first)
    const sortedExpenses = [...expenses].sort((a, b) => new Date(b. date) - new Date(a.date));

    sortedExpenses.forEach((expense, index) => {
        const row = document.createElement('tr');
        row.className = 'animate-fadeInUp';
        row.style.animationDelay = `${index * 0.05}s`;
        row.innerHTML = `
            <td>${expense.date}</td>
            <td><span class="badge badge-primary">${expense.category}</span></td>
            <td>${expense.card}</td>
            <td style="font-weight: 700; color: #ef4444;">$${expense.amount.toFixed(2)}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="deleteExpense(${expense.id})">
                    🗑️ Delete
                </button>
            </td>
        `;
        list.appendChild(row);
    });
}

// Master UI Update
function updateUI() {
    calculateTotals();
    renderList();
    updateChart();
}

// Show Notification
function showNotification(message, type = 'info') {
    if (typeof showAlert === 'function') {
        showAlert(message, type === 'error' ?  'danger' : type);
    } else {
        alert(message);
    }
}