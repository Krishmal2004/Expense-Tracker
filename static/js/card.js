// ==================== Initialize Cards Page ====================

document.addEventListener('DOMContentLoaded', async () => {
    await loadCards();
    setupCardForm();
});

// ==================== Load Cards ====================

async function loadCards() {
    try {
        const cards = await apiRequest('/api/cards');
        renderCards(cards);
    } catch (error) {
        console.error('Error loading cards:', error);
        showAlert('Failed to load cards', 'danger');
    }
}

// ==================== Render Cards ====================

function renderCards(cards) {
    const container = document.getElementById('cards-container');
    if (!container) return;
    
    if (cards.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">💳</div>
                <h3>No cards added yet</h3>
                <p>Add your first card to start tracking your finances</p>
                <button class="btn btn-primary" onclick="openModal('add-card-modal')">Add Card</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = cards.map(card => `
        <div class="credit-card">
            <div class="card-header-info">
                <div class="card-type">${card.card_type}</div>
                <div class="card-logo">${getCardLogo(card.card_type)}</div>
            </div>
            <div class="card-number">${card.card_number}</div>
            <div class="card-footer-info">
                <div class="card-holder">
                    <label>Card Holder</label>
                    <p>${card.card_holder}</p>
                </div>
                <div class="card-expiry">
                    <label>Expires</label>
                    <p>${card.expiry_date}</p>
                </div>
            </div>
            <div class="card-actions">
                <button class="card-action-btn" onclick="deleteCard(${card.id})" title="Delete Card">
                    🗑️
                </button>
            </div>
            <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.2);">
                <small>Balance:</small>
                <h3 style="margin: 0;">${formatCurrency(card.balance)}</h3>
            </div>
        </div>
    `).join('');
}

// ==================== Get Card Logo ====================

function getCardLogo(cardType) {
    const logos = {
        'Visa': '💳',
        'Mastercard': '💳',
        'American Express': '💳',
        'Discover': '💳',
        'Debit': '🏦',
        'Credit': '💳'
    };
    return logos[cardType] || '💳';
}

// ==================== Setup Card Form ====================

function setupCardForm() {
    const form = document.getElementById('add-card-form');
    if (!form) return;
    
    // Card number formatting
    const cardNumberInput = document.getElementById('card-number');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', (e) => {
            formatCardNumber(e.target);
        });
    }
    
    // Expiry date formatting
    const expiryInput = document.getElementById('expiry-date');
    if (expiryInput) {
        expiryInput.addEventListener('input', (e) => {
            formatExpiryDate(e.target);
        });
    }
    
    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await addCard();
    });
}

// ==================== Add Card ====================

async function addCard() {
    const form = document.getElementById('add-card-form');
    const submitBtn = form.querySelector('button[type="submit"]');
    
    const cardData = {
        card_number: document.getElementById('card-number'). value,
        card_type: document.getElementById('card-type').value,
        card_holder: document.getElementById('card-holder').value,
        expiry_date: document.getElementById('expiry-date').value,
        balance: parseFloat(document.getElementById('card-balance').value) || 0
    };
    
    // Validation
    if (!cardData.card_number || !cardData.card_type || !cardData.card_holder || ! cardData.expiry_date) {
        showAlert('Please fill in all fields', 'danger');
        return;
    }
    
    if (! validateCardNumber(cardData.card_number)) {
        showAlert('Invalid card number', 'danger');
        return;
    }
    
    if (!validateExpiryDate(cardData.expiry_date)) {
        showAlert('Invalid or expired card', 'danger');
        return;
    }
    
    showLoading(submitBtn);
    
    try {
        await apiRequest('/api/cards', {
            method: 'POST',
            body: JSON.stringify(cardData)
        });
        
        showAlert('Card added successfully', 'success');
        closeModal('add-card-modal');
        form.reset();
        await loadCards();
    } catch (error) {
        showAlert(error.message, 'danger');
    } finally {
        hideLoading(submitBtn);
    }
}

// ==================== Delete Card ====================

async function deleteCard(cardId) {
    if (! confirm('Are you sure you want to delete this card?')) {
        return;
    }
    
    try {
        await apiRequest(`/api/cards/${cardId}`, {
            method: 'DELETE'
        });
        
        showAlert('Card deleted successfully', 'success');
        await loadCards();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}