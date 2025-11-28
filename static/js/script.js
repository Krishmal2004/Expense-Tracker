// 1. Initialize State
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let expenseChart = null;

// Set default date to today
document.getElementById('date').valueAsDate = new Date();
document.getElementById('current-date').innerText = new Date().toDateString();

// 2. DOM Elements
const form = document.getElementById('expense-form');
const list = document.getElementById('transaction-list');
const monthTotalEl = document.getElementById('month-total');
const yearTotalEl = document.getElementById('year-total');
const totalCountEl = document.getElementById('total-count');

// 3. Add Expense Function
form.addEventListener('submit', (e) => {
    e.preventDefault();

    const newExpense = {
        id: Date.now(),
        card: document.getElementById('card-select').value,
        amount: parseFloat(document.getElementById('amount').value),
        category: document.getElementById('category').value,
        date: document.getElementById('date').value
    };

    expenses.push(newExpense);
    saveData();
    updateUI();
    form.reset();
    document.getElementById('date').valueAsDate = new Date(); // Reset date
});

// 4. Save to LocalStorage
function saveData() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

// 5. Delete Expense
function deleteExpense(id) {
    expenses = expenses.filter(expense => expense.id !== id);
    saveData();
    updateUI();
}

// 6. Calculate Totals (Monthly & Yearly)
function calculateTotals() {
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-11
    const currentYear = now.getFullYear();

    let monthTotal = 0;
    let yearTotal = 0;

    expenses.forEach(expense => {
        const expenseDate = new Date(expense.date);
        
        // Year Check
        if (expenseDate.getFullYear() === currentYear) {
            yearTotal += expense.amount;
            
            // Month Check (only if year matches)
            // Note: getMonth() returns 0 for Jan, 1 for Feb, etc.
            // We use the timezone offset logic or simple string matching to be precise
            if (expenseDate.getMonth() === currentMonth) {
                monthTotal += expense.amount;
            }
        }
    });

    monthTotalEl.innerText = `$${monthTotal.toFixed(2)}`;
    yearTotalEl.innerText = `$${yearTotal.toFixed(2)}`;
    totalCountEl.innerText = expenses.length;
}

// 7. Update Chart
function updateChart() {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    
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
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

// 8. Render List
function renderList() {
    list.innerHTML = '';
    
    // Sort by date (newest first)
    const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedExpenses.forEach(expense => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${expense.date}</td>
            <td>${expense.category}</td>
            <td>${expense.card}</td>
            <td>$${expense.amount.toFixed(2)}</td>
            <td><button class="delete-btn" onclick="deleteExpense(${expense.id})"><i class="fas fa-trash"></i></button></td>
        `;
        list.appendChild(row);
    });
}

// 9. Master UI Update
function updateUI() {
    calculateTotals();
    renderList();
    updateChart();
}

// Initial Call
updateUI();