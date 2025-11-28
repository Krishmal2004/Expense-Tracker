/**
 * Expenses JavaScript - Expense Management
 * Expense Tracker Application
 */

// ===========================
// EXPENSES STATE
// ===========================

let expensesData = {
    expenses: [],
    cards: [],
    editingExpense: null,
    filters: {
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        category: ''
    }
};

// ===========================
// EXPENSES PAGE INITIALIZATION
// ===========================

async function initExpensesPage() {
    showExpensesLoading(true);
    
    try {
        await Promise.all([
            loadExpenses(),
            loadUserCards()
        ]);
        
        // Check if editing
        const urlParams = new URLSearchParams(window.location.search);
        const editId = urlParams.get('edit');
        
        if (editId) {
            await loadExpenseForEdit(editId);
        }
        
        renderExpenseForm();
        setupExpenseEvents();
    } catch (error) {
        console.error('Expenses initialization error:', error);
        showToast('Failed to load page data', 'error');
    } finally {
        showExpensesLoading(false);
    }
}

// ===========================
// DATA LOADING
// ===========================

async function loadExpenses() {
    try {
        const { month, year, category } = expensesData.filters;
        let endpoint = `/expenses?month=${month}&year=${year}`;
        
        if (category) {
            endpoint += `&category=${category}`;
        }
        
        const response = await App.apiRequest(endpoint);
        expensesData.expenses = response.expenses || [];
        return response;
    } catch (error) {
        console.error('Error loading expenses:', error);
        throw error;
    }
}

async function loadUserCards() {
    try {
        const response = await App.apiRequest('/cards');
        expensesData.cards = response.cards || [];
        return response;
    } catch (error) {
        console.error('Error loading cards:', error);
        expensesData.cards = [];
    }
}

async function loadExpenseForEdit(expenseId) {
    try {
        const expense = expensesData.expenses.find(e => e.id === parseInt(expenseId));
        if (expense) {
            expensesData.editingExpense = expense;
        }
    } catch (error) {
        console.error('Error loading expense for edit:', error);
    }
}

// ===========================
// RENDER FUNCTIONS
// ===========================

function renderExpenseForm() {
    const form = document.getElementById('expenseForm');
    if (!form) return;
    
    // Populate categories dropdown
    const categorySelect = document.getElementById('category');
    if (categorySelect) {
        categorySelect.innerHTML = App.EXPENSE_CATEGORIES.map(cat => 
            `<option value="${cat.value}">${cat.label}</option>`
        ).join('');
    }
    
    // Populate cards dropdown
    const cardSelect = document.getElementById('cardSelect');
    if (cardSelect) {
        let options = '<option value="">Cash</option>';
        expensesData.cards.forEach(card => {
            options += `<option value="${card.id}">${card.card_name} (${card.card_number})</option>`;
        });
        cardSelect.innerHTML = options;
    }
    
    // Set default date to today
    const dateInput = document.getElementById('expenseDate');
    if (dateInput && !expensesData.editingExpense) {
        dateInput.valueAsDate = new Date();
    }
    
    // Populate form if editing
    if (expensesData.editingExpense) {
        populateEditForm(expensesData.editingExpense);
    }
}

function populateEditForm(expense) {
    const form = document.getElementById('expenseForm');
    if (!form) return;
    
    // Update form title
    const formTitle = document.querySelector('.form-title');
    if (formTitle) {
        formTitle.textContent = 'Edit Expense';
    }
    
    // Populate fields
    document.getElementById('amount').value = expense.amount;
    document.getElementById('category').value = expense.category;
    document.getElementById('description').value = expense.description || '';
    document.getElementById('expenseDate').value = expense.expense_date;
    
    // Set payment method
    const paymentMethod = expense.payment_method || 'cash';
    const paymentRadios = document.querySelectorAll('input[name="paymentMethod"]');
    paymentRadios.forEach(radio => {
        radio.checked = radio.value === paymentMethod;
    });
    
    // Set card if applicable
    if (expense.card_id) {
        document.getElementById('cardSelect').value = expense.card_id;
        toggleCardSelect(true);
    }
    
    // Store editing state
    form.dataset.editId = expense.id;
}

function toggleCardSelect(show) {
    const cardSelectWrapper = document.getElementById('cardSelectWrapper');
    if (cardSelectWrapper) {
        cardSelectWrapper.style.display = show ? 'block' : 'none';
    }
}

// ===========================
// EXPENSE ACTIONS
// ===========================

async function saveExpense(formData) {
    const form = document.getElementById('expenseForm');
    const editId = form?.dataset.editId;
    
    try {
        if (editId) {
            await App.apiRequest(`/expenses/${editId}`, {
                method: 'PUT',
                body: JSON.stringify(formData)
            });
            showToast('Expense updated successfully', 'success');
        } else {
            await App.apiRequest('/expenses', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            showToast('Expense added successfully', 'success');
        }
        
        // Redirect or reset form
        if (editId) {
            window.location.href = '/dashboard';
        } else {
            resetExpenseForm();
        }
    } catch (error) {
        showToast(error.message || 'Failed to save expense', 'error');
    }
}

async function deleteExpense(expenseId) {
    if (!confirm('Are you sure you want to delete this expense?')) {
        return;
    }
    
    try {
        await App.apiRequest(`/expenses/${expenseId}`, { method: 'DELETE' });
        showToast('Expense deleted successfully', 'success');
        await loadExpenses();
        renderExpensesList();
    } catch (error) {
        showToast(error.message || 'Failed to delete expense', 'error');
    }
}

function resetExpenseForm() {
    const form = document.getElementById('expenseForm');
    if (form) {
        form.reset();
        form.dataset.editId = '';
        document.getElementById('expenseDate').valueAsDate = new Date();
        toggleCardSelect(false);
        
        // Reset form title
        const formTitle = document.querySelector('.form-title');
        if (formTitle) {
            formTitle.textContent = 'Add New Expense';
        }
    }
}

// ===========================
// EVENT HANDLERS
// ===========================

function setupExpenseEvents() {
    // Form submission
    const expenseForm = document.getElementById('expenseForm');
    if (expenseForm) {
        expenseForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const amount = parseFloat(document.getElementById('amount').value);
            const category = document.getElementById('category').value;
            const description = document.getElementById('description').value;
            const expenseDate = document.getElementById('expenseDate').value;
            const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'cash';
            const cardId = document.getElementById('cardSelect')?.value;
            
            // Validation
            if (!amount || amount <= 0) {
                showToast('Please enter a valid amount', 'error');
                return;
            }
            
            if (!category) {
                showToast('Please select a category', 'error');
                return;
            }
            
            if (!expenseDate) {
                showToast('Please select a date', 'error');
                return;
            }
            
            const formData = {
                amount,
                category,
                description,
                expense_date: expenseDate,
                payment_method: paymentMethod,
                card_id: paymentMethod === 'card' && cardId ? parseInt(cardId) : null
            };
            
            await saveExpense(formData);
        });
    }
    
    // Payment method toggle
    const paymentRadios = document.querySelectorAll('input[name="paymentMethod"]');
    paymentRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            toggleCardSelect(this.value === 'card');
        });
    });
    
    // Amount input - format as currency
    const amountInput = document.getElementById('amount');
    if (amountInput) {
        amountInput.addEventListener('blur', function() {
            if (this.value) {
                this.value = parseFloat(this.value).toFixed(2);
            }
        });
    }
    
    // Quick add buttons (category shortcuts)
    const quickAddButtons = document.querySelectorAll('[data-category]');
    quickAddButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const category = this.dataset.category;
            document.getElementById('category').value = category;
        });
    });
}

// ===========================
// EXPENSES LIST (for reports page)
// ===========================

function renderExpensesList() {
    const container = document.getElementById('expensesList');
    if (!container) return;
    
    if (expensesData.expenses.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt"></i>
                <h4>No expenses found</h4>
                <p>Try adjusting your filters or add a new expense</p>
            </div>
        `;
        return;
    }
    
    const tableHtml = `
        <table class="table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Payment</th>
                    <th>Amount</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${expensesData.expenses.map(expense => `
                    <tr>
                        <td>${App.formatDate(expense.expense_date)}</td>
                        <td>
                            <span class="badge badge-${getCategoryBadgeColor(expense.category)}">
                                ${expense.category}
                            </span>
                        </td>
                        <td>${expense.description || '-'}</td>
                        <td>${expense.card_name || 'Cash'}</td>
                        <td class="text-danger fw-bold">-${App.formatCurrency(expense.amount)}</td>
                        <td>
                            <button class="btn btn-sm btn-icon" onclick="window.location.href='/add-expense?edit=${expense.id}'">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-icon text-danger" onclick="deleteExpense(${expense.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = tableHtml;
}

function getCategoryBadgeColor(category) {
    const colorMap = {
        'Food': 'warning',
        'Transport': 'info',
        'Shopping': 'danger',
        'Bills': 'primary',
        'Entertainment': 'success',
        'Healthcare': 'danger',
        'Education': 'info',
        'Others': 'secondary'
    };
    return colorMap[category] || 'secondary';
}

// ===========================
// FILTER FUNCTIONS
// ===========================

async function applyFilters() {
    const monthSelect = document.getElementById('filterMonth');
    const yearSelect = document.getElementById('filterYear');
    const categorySelect = document.getElementById('filterCategory');
    
    if (monthSelect) expensesData.filters.month = parseInt(monthSelect.value);
    if (yearSelect) expensesData.filters.year = parseInt(yearSelect.value);
    if (categorySelect) expensesData.filters.category = categorySelect.value;
    
    showExpensesLoading(true);
    await loadExpenses();
    renderExpensesList();
    showExpensesLoading(false);
}

function resetFilters() {
    expensesData.filters = {
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        category: ''
    };
    
    // Reset filter inputs
    const monthSelect = document.getElementById('filterMonth');
    const yearSelect = document.getElementById('filterYear');
    const categorySelect = document.getElementById('filterCategory');
    
    if (monthSelect) monthSelect.value = expensesData.filters.month;
    if (yearSelect) yearSelect.value = expensesData.filters.year;
    if (categorySelect) categorySelect.value = '';
    
    applyFilters();
}

// ===========================
// LOADING STATE
// ===========================

function showExpensesLoading(show) {
    const loader = document.getElementById('expensesLoader');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
    }
}

// ===========================
// INITIALIZATION
// ===========================

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('expenseForm')) {
        initExpensesPage();
    }
});

// Export for use in other modules
window.Expenses = {
    init: initExpensesPage,
    load: loadExpenses,
    save: saveExpense,
    delete: deleteExpense,
    reset: resetExpenseForm,
    applyFilters,
    resetFilters,
    getAll: () => expensesData.expenses
};
