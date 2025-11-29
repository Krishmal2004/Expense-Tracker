// Default Chart. js options
Chart. defaults.font.family = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
Chart.defaults.color = '#64748b';
Chart.defaults.plugins.legend.display = true;
Chart.defaults.plugins.legend. position = 'bottom';

// ==================== Monthly Expenses Chart ====================

function createMonthlyExpensesChart(canvasId, data) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;
    
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: data. labels,
            datasets: [{
                label: 'Monthly Expenses',
                data: data.values,
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0. 1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointRadius: 6,
                pointHoverRadius: 10,
                pointBackgroundColor: '#6366f1',
                pointBorderColor: '#fff',
                pointBorderWidth: 3,
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#6366f1',
                pointHoverBorderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 2000,
                easing: 'easeOutQuart'
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    padding: 16,
                    cornerRadius: 12,
                    displayColors: false,
                    titleFont: {
                        size: 14,
                        weight: '600'
                    },
                    bodyFont: {
                        size: 16,
                        weight: '700'
                    },
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
                            size: 12,
                            weight: '500'
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        font: {
                            size: 12,
                            weight: '500'
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

// ==================== Category Breakdown Chart ====================

function createCategoryChart(canvasId, data) {
    const ctx = document. getElementById(canvasId);
    if (! ctx) return null;
    
    const colors = [
        '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', 
        '#10b981', '#3b82f6', '#ef4444', '#84cc16',
        '#06b6d4', '#f97316'
    ];
    
    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.labels,
            datasets: [{
                data: data.values,
                backgroundColor: colors,
                borderWidth: 4,
                borderColor: '#fff',
                hoverOffset: 20,
                hoverBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 2000,
                easing: 'easeOutQuart',
                animateRotate: true,
                animateScale: true
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        font: {
                            size: 12,
                            weight: '500'
                        },
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    padding: 16,
                    cornerRadius: 12,
                    titleFont: {
                        size: 14,
                        weight: '600'
                    },
                    bodyFont: {
                        size: 14,
                        weight: '500'
                    },
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = formatCurrency(context. parsed);
                            const total = context.dataset.data. reduce((a, b) => a + b, 0);
                            const percentage = ((context. parsed / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '60%'
        }
    });
}

// ==================== Bar Chart for Comparison ====================

function createComparisonBarChart(canvasId, data) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;
    
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Income',
                data: data.income,
                backgroundColor: 'rgba(16, 185, 129, 0.8)',
                borderColor: '#10b981',
                borderWidth: 2,
                borderRadius: 8,
                barPercentage: 0.6
            }, {
                label: 'Expenses',
                data: data.expenses,
                backgroundColor: 'rgba(239, 68, 68, 0. 8)',
                borderColor: '#ef4444',
                borderWidth: 2,
                borderRadius: 8,
                barPercentage: 0.6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1500,
                easing: 'easeOutQuart'
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        padding: 20,
                        font: {
                            size: 12,
                            weight: '600'
                        },
                        usePointStyle: true
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    padding: 16,
                    cornerRadius: 12,
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context. parsed. y);
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '$' + value. toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

// ==================== Spending Trend Chart ====================

function createSpendingTrendChart(canvasId, data) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;
    
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Daily Spending',
                data: data.values,
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                pointHoverRadius: 8,
                pointBackgroundColor: '#ef4444',
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
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        label: function(context) {
                            return 'Spent: ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '$' + value. toLocaleString();
                        }
                    }
                }
            }
        }
    });
}