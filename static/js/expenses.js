// ==================== Initialize Expenses Page ====================

document.addEventListener('DOMContentLoaded', async () => {
    await loadExpenses();
    await loadCardsForDropdown();
    setupExpenseForm();
    setupFilters();
});

// ==================== Load Expenses ====================

let currentExpenses = [];

async function loadExpenses(filters = {}) {
    try {
        let url = '/api/expenses? ';
        if (filters.start_date) url += `start_date=${filters.start_date}&`;
        if (filters.end_date) url += `end_date=${filters.end_date}&`;
        if (filters.category) url += `category=${filters. category}&`;
        
        currentExpenses = await apiRequest(url);
        renderExpenses(currentExpenses);
        updateExpenseSummary(currentExpenses);
    } catch (error) {
        console. error('Error loading expenses:', error);
        showAlert('Failed to load expenses', 'danger');
    }
}

// ==================== Render Expenses ====================

function renderExpenses(expenses) {
    const tbody = document.getElementById('expenses-tbody');
    if (!tbody) return;
    
    if (expenses.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        <div class="empty-state-icon">💸</div>
                        <h3>No expenses found</h3>
                        <p>Start tracking your spending by adding an expense</p>
                        <button class="btn btn-primary" onclick="openModal('add-expense-modal')">Add Expense</button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = expenses. map(expense => `
        <tr>
            <td>${formatDate(expense.expense_date)}</td>
            <td>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span>${getCategoryIcon(expense.category)}</span>
                    ${expense.description}
                </div>
            </td>
            <td><span class="badge badge-primary">${expense.category}</span></td>
            <td>${expense.card_type || 'Cash'}</td>
            <td class="fw-bold text-danger">${formatCurrency(expense. amount)}</td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="editExpense(${expense.id})">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteExpense(${expense.id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

// ==================== Update Expense Summary ====================

function updateExpenseSummary(expenses) {
    const total = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    const summaryElement = document.getElementById('expense-summary');
    
    if (summaryElement) {
        summaryElement.innerHTML = `
            <div class="card">
                <div class="d-flex justify-between align-center">
                    <div>
                        <h3>Total Expenses</h3>
                        <p class="text-secondary">${expenses.length} transactions</p>
                    </div>
                    <div>
                        <h2 class="text-danger">${formatCurrency(total)}</h2>
                    </div>
                </div>
            </div>
        `;
    }
}

// ==================== Load Cards for Dropdown ====================

async function loadCardsForDropdown() {
    try {
        const cards = await apiRequest('/api/cards');
        const select = document.getElementById('expense-card');
        
        if (select && cards.length > 0) {
            select.innerHTML = '<option value="">Select Card (Optional)</option>' +
                cards.map(card => `
                    <option value="${card. id}">${card.card_type} - ${card.card_number}</option>
                `).join('');
        }
    } catch (error) {
        console.error('Error loading cards:', error);
    }
}

// ==================== Setup Expense Form ====================

function setupExpenseForm() {
    const form = document.getElementById('add-expense-form');
    if (!form) return;
    
    // Set default date to today
    const dateInput = document.getElementById('expense-date');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
        dateInput.max = new Date().toISOString().split('T')[0];
    }
    
    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await addExpense();
    });
}

// ==================== Add Expense ====================

async function addExpense() {
    const form = document.getElementById('add-expense-form');
    const submitBtn = form.querySelector('button[type="submit"]');
    
    const expenseData = {
        description: document.getElementById('expense-description').value,
        amount: parseFloat(document.getElementById('expense-amount').value),
        category: document.getElementById('expense-category').value,
        expense_date: document.getElementById('expense-date').value,
        card_id: document.getElementById('expense-card').value || null
    };
    
    // Validation
    if (!expenseData.description || !expenseData.amount || !expenseData.category || !expenseData.expense_date) {
        showAlert('Please fill in all required fields', 'danger');
        return;
    }
    
    if (expenseData.amount <= 0) {
        showAlert('Amount must be greater than 0', 'danger');
        return;
    }
    
    showLoading(submitBtn);
    
    try {
        await apiRequest('/api/expenses', {
            method: 'POST',
            body: JSON.stringify(expenseData)
        });
        
        showAlert('Expense added successfully', 'success');
        closeModal('add-expense-modal');
        form.reset();
        await loadExpenses();
        
        // Reload notification count
        if (typeof loadNotificationCount === 'function') {
            await loadNotificationCount();
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    } finally {
        hideLoading(submitBtn);
    }
}

// ==================== Edit Expense ====================

let editingExpenseId = null;

function editExpense(expenseId) {
    const expense = currentExpenses.find(e => e.id === expenseId);
    if (!expense) return;
    
    editingExpenseId = expenseId;
    
    // Populate form
    document.getElementById('expense-description').value = expense.description;
    document.getElementById('expense-amount').value = expense.amount;
    document.getElementById('expense-category').value = expense.category;
    document.getElementById('expense-date').value = expense.expense_date;
    
    // Change modal title and button
    document.querySelector('#add-expense-modal . modal-title').textContent = 'Edit Expense';
    const submitBtn = document.querySelector('#add-expense-form button[type="submit"]');
    submitBtn.textContent = 'Update Expense';
    
    // Change form submission
    const form = document.getElementById('add-expense-form');
    form. onsubmit = async (e) => {
        e.preventDefault();
        await updateExpense();
    };
    
    openModal('add-expense-modal');
}

async function updateExpense() {
    const form = document.getElementById('add-expense-form');
    const submitBtn = form.querySelector('button[type="submit"]');
    
    const expenseData = {
        description: document.getElementById('expense-description').value,
        amount: parseFloat(document.getElementById('expense-amount').value),
        category: document.getElementById('expense-category').value,
        expense_date: document.getElementById('expense-date').value,
        card_id: document.getElementById('expense-card').value || null
    };
    
    showLoading(submitBtn);
    
    try {
        await apiRequest(`/api/expenses/${editingExpenseId}`, {
            method: 'PUT',
            body: JSON.stringify(expenseData)
        });
        
        showAlert('Expense updated successfully', 'success');
        closeModal('add-expense-modal');
        resetExpenseForm();
        await loadExpenses();
    } catch (error) {
        showAlert(error.message, 'danger');
    } finally {
        hideLoading(submitBtn);
    }
}

function resetExpenseForm() {
    const form = document.getElementById('add-expense-form');
    form. reset();
    form.onsubmit = async (e) => {
        e.preventDefault();
        await addExpense();
    };
    
    document.querySelector('#add-expense-modal .modal-title').textContent = 'Add Expense';
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Add Expense';
    
    editingExpenseId = null;
}

// ==================== Delete Expense ====================

async function deleteExpense(expenseId) {
    if (!confirm('Are you sure you want to delete this expense?')) {
        return;
    }
    
    try {
        await apiRequest(`/api/expenses/${expenseId}`, {
            method: 'DELETE'
        });
        
        showAlert('Expense deleted successfully', 'success');
        await loadExpenses();
    } catch (error) {
        showAlert(error. message, 'danger');
    }
}

// ==================== Setup Filters ====================

function setupFilters() {
    const filterBtn = document.getElementById('apply-filters-btn');
    if (filterBtn) {
        filterBtn.addEventListener('click', applyFilters);
    }
    
    const resetBtn = document.getElementById('reset-filters-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetFilters);
    }
}

function applyFilters() {
    const filters = {
        start_date: document.getElementById('filter-start-date')?.value,
        end_date: document.getElementById('filter-end-date')?.value,
        category: document.getElementById('filter-category')?.value
    };
    
    loadExpenses(filters);
}

function resetFilters() {
    document.getElementById('filter-start-date').value = '';
    document.getElementById('filter-end-date').value = '';
    document.getElementById('filter-category').value = '';
    loadExpenses();
}