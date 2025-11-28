/**
 * Charts JavaScript - Chart.js Integration
 * Expense Tracker Application
 */

// ===========================
// CHART INSTANCES
// ===========================

let charts = {
    monthlyChart: null,
    categoryChart: null,
    trendChart: null
};

// Chart.js default configuration
const chartDefaults = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'bottom',
            labels: {
                usePointStyle: true,
                padding: 20,
                font: {
                    size: 12,
                    family: "'Inter', sans-serif"
                }
            }
        },
        tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleFont: {
                family: "'Inter', sans-serif"
            },
            bodyFont: {
                family: "'Inter', sans-serif"
            },
            padding: 12,
            cornerRadius: 8,
            callbacks: {
                label: function(context) {
                    const value = context.raw;
                    return `${context.label}: ${App.formatCurrency(value)}`;
                }
            }
        }
    }
};

// ===========================
// CHART INITIALIZATION
// ===========================

function initCharts() {
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.error('Chart.js is not loaded');
        return;
    }
    
    // Set global defaults
    Chart.defaults.font.family = "'Inter', sans-serif";
    
    // Initialize charts based on available canvases
    initMonthlyChart();
    initCategoryChart();
    initTrendChart();
}

function initMonthlyChart() {
    const canvas = document.getElementById('monthlyChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dashboardData = window.Dashboard?.getData?.() || {};
    const monthlyData = dashboardData.monthlyData || [];
    
    // Destroy existing chart if it exists
    if (charts.monthlyChart) {
        charts.monthlyChart.destroy();
    }
    
    charts.monthlyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: monthlyData.map(d => d.month_name),
            datasets: [{
                label: 'Monthly Expenses',
                data: monthlyData.map(d => d.total),
                backgroundColor: App.CHART_COLORS[0],
                borderRadius: 6,
                borderSkipped: false,
            }]
        },
        options: {
            ...chartDefaults,
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                }
            },
            plugins: {
                ...chartDefaults.plugins,
                legend: {
                    display: false
                }
            }
        }
    });
}

function initCategoryChart() {
    const canvas = document.getElementById('categoryChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dashboardData = window.Dashboard?.getData?.() || {};
    const categoryBreakdown = dashboardData.summary?.category_breakdown || {};
    
    const labels = Object.keys(categoryBreakdown);
    const data = Object.values(categoryBreakdown);
    
    // Destroy existing chart if it exists
    if (charts.categoryChart) {
        charts.categoryChart.destroy();
    }
    
    if (labels.length === 0) {
        // Show empty state
        canvas.parentElement.innerHTML = `
            <div class="chart-empty">
                <i class="fas fa-chart-pie"></i>
                <p>No expense data to display</p>
            </div>
        `;
        return;
    }
    
    charts.categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: App.CHART_COLORS.slice(0, labels.length),
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            ...chartDefaults,
            cutout: '65%',
            plugins: {
                ...chartDefaults.plugins,
                legend: {
                    position: 'right',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        generateLabels: function(chart) {
                            const data = chart.data;
                            const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                            
                            return data.labels.map((label, i) => {
                                const value = data.datasets[0].data[i];
                                const percent = ((value / total) * 100).toFixed(1);
                                
                                return {
                                    text: `${label} (${percent}%)`,
                                    fillStyle: data.datasets[0].backgroundColor[i],
                                    hidden: false,
                                    index: i
                                };
                            });
                        }
                    }
                }
            }
        }
    });
}

function initTrendChart() {
    const canvas = document.getElementById('trendChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dashboardData = window.Dashboard?.getData?.() || {};
    const monthlyData = dashboardData.monthlyData || [];
    
    // Destroy existing chart if it exists
    if (charts.trendChart) {
        charts.trendChart.destroy();
    }
    
    charts.trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: monthlyData.map(d => d.month_name),
            datasets: [{
                label: 'Spending Trend',
                data: monthlyData.map(d => d.total),
                borderColor: App.CHART_COLORS[0],
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: App.CHART_COLORS[0],
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            ...chartDefaults,
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                }
            },
            plugins: {
                ...chartDefaults.plugins,
                legend: {
                    display: false
                }
            }
        }
    });
}

// ===========================
// CHART UPDATE FUNCTIONS
// ===========================

function updateCharts() {
    initMonthlyChart();
    initCategoryChart();
    initTrendChart();
}

function updateMonthlyChart(data) {
    if (!charts.monthlyChart) return;
    
    charts.monthlyChart.data.labels = data.map(d => d.month_name);
    charts.monthlyChart.data.datasets[0].data = data.map(d => d.total);
    charts.monthlyChart.update();
}

function updateCategoryChart(data) {
    if (!charts.categoryChart) return;
    
    const labels = Object.keys(data);
    const values = Object.values(data);
    
    charts.categoryChart.data.labels = labels;
    charts.categoryChart.data.datasets[0].data = values;
    charts.categoryChart.data.datasets[0].backgroundColor = App.CHART_COLORS.slice(0, labels.length);
    charts.categoryChart.update();
}

// ===========================
// REPORTS PAGE CHARTS
// ===========================

function initReportsCharts() {
    initComparisonChart();
    initCategoryBreakdownChart();
}

function initComparisonChart() {
    const canvas = document.getElementById('comparisonChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // This would be populated with data from the API
    const sampleData = {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        currentMonth: [500, 750, 600, 800],
        previousMonth: [450, 600, 700, 650]
    };
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: sampleData.labels,
            datasets: [
                {
                    label: 'This Month',
                    data: sampleData.currentMonth,
                    borderColor: App.CHART_COLORS[0],
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Last Month',
                    data: sampleData.previousMonth,
                    borderColor: App.CHART_COLORS[2],
                    backgroundColor: 'transparent',
                    borderDash: [5, 5],
                    tension: 0.4
                }
            ]
        },
        options: {
            ...chartDefaults,
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value;
                        }
                    }
                }
            }
        }
    });
}

function initCategoryBreakdownChart() {
    const canvas = document.getElementById('categoryBreakdownChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Sample data - would be replaced with actual API data
    const categories = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment'];
    const amounts = [450, 200, 350, 500, 150];
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: categories,
            datasets: [{
                label: 'Amount',
                data: amounts,
                backgroundColor: App.CHART_COLORS.slice(0, categories.length),
                borderRadius: 6
            }]
        },
        options: {
            ...chartDefaults,
            indexAxis: 'y',
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value;
                        }
                    }
                },
                y: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                ...chartDefaults.plugins,
                legend: {
                    display: false
                }
            }
        }
    });
}

// ===========================
// EXPORT DATA AS CSV
// ===========================

function exportDataAsCSV() {
    const expenses = window.Expenses?.getAll?.() || [];
    
    if (expenses.length === 0) {
        showToast('No data to export', 'warning');
        return;
    }
    
    const headers = ['Date', 'Category', 'Description', 'Amount', 'Payment Method'];
    const rows = expenses.map(e => [
        e.expense_date,
        e.category,
        e.description || '',
        e.amount.toFixed(2),
        e.payment_method
    ]);
    
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `expenses_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Data exported successfully', 'success');
}

// ===========================
// INITIALIZATION
// ===========================

document.addEventListener('DOMContentLoaded', () => {
    // Export button
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportDataAsCSV);
    }
});

// Export for use in other modules
window.Charts = {
    init: initCharts,
    update: updateCharts,
    initReports: initReportsCharts,
    exportCSV: exportDataAsCSV
};
