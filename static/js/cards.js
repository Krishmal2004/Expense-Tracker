/**
 * Cards JavaScript - Card Management
 * Expense Tracker Application
 */

// ===========================
// CARDS STATE
// ===========================

let cardsData = {
    cards: [],
    totalBalance: 0
};

// ===========================
// CARDS INITIALIZATION
// ===========================

async function initCardsPage() {
    showCardsLoading(true);
    
    try {
        await loadCards();
        renderCards();
        setupCardEvents();
    } catch (error) {
        console.error('Cards initialization error:', error);
        showToast('Failed to load cards', 'error');
    } finally {
        showCardsLoading(false);
    }
}

// ===========================
// DATA LOADING
// ===========================

async function loadCards() {
    try {
        const response = await App.apiRequest('/cards');
        cardsData.cards = response.cards || [];
        cardsData.totalBalance = cardsData.cards.reduce((sum, card) => sum + (card.balance || 0), 0);
        return response;
    } catch (error) {
        console.error('Error loading cards:', error);
        throw error;
    }
}

// ===========================
// RENDER FUNCTIONS
// ===========================

function renderCards() {
    const container = document.getElementById('cardsContainer');
    if (!container) return;
    
    // Update total balance
    const totalBalanceEl = document.getElementById('totalBalance');
    if (totalBalanceEl) {
        totalBalanceEl.textContent = App.formatCurrency(cardsData.totalBalance);
    }
    
    if (cardsData.cards.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-credit-card"></i>
                <h4>No cards added yet</h4>
                <p>Add your credit or debit cards to track your spending</p>
                <button class="btn btn-primary" onclick="showAddCardModal()">
                    <i class="fas fa-plus"></i> Add Card
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="cards-grid">
            ${cardsData.cards.map(card => renderCardItem(card)).join('')}
        </div>
    `;
}

function renderCardItem(card) {
    const cardTypeClass = card.card_type === 'credit' ? '' : 'debit';
    const cardIcon = card.card_type === 'credit' ? 'fa-cc-visa' : 'fa-cc-mastercard';
    
    return `
        <div class="card-wrapper" data-id="${card.id}">
            <div class="credit-card ${cardTypeClass}">
                <div class="credit-card-chip"></div>
                <div class="credit-card-type">
                    <i class="fab ${cardIcon}"></i>
                </div>
                <div class="credit-card-number">${card.card_number}</div>
                <div class="credit-card-info">
                    <div class="credit-card-holder">
                        <span>Card Holder</span>
                        ${card.card_holder_name || card.card_name}
                    </div>
                    <div class="credit-card-expiry">
                        <span>Expires</span>
                        ${card.expiry_date}
                    </div>
                </div>
            </div>
            <div class="card-details">
                <div class="card-details-row">
                    <span class="label">Card Name</span>
                    <span class="value">${card.card_name}</span>
                </div>
                <div class="card-details-row">
                    <span class="label">Bank</span>
                    <span class="value">${card.bank_name || 'N/A'}</span>
                </div>
                <div class="card-details-row">
                    <span class="label">Type</span>
                    <span class="value badge badge-${card.card_type === 'credit' ? 'primary' : 'success'}">
                        ${App.capitalize(card.card_type)}
                    </span>
                </div>
                <div class="card-details-row">
                    <span class="label">Balance</span>
                    <span class="value">${App.formatCurrency(card.balance || 0)}</span>
                </div>
                <div class="card-actions">
                    <button class="btn btn-sm btn-secondary" onclick="editCard(${card.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteCard(${card.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ===========================
// CARD ACTIONS
// ===========================

function showAddCardModal() {
    const modal = document.getElementById('cardModal');
    const form = document.getElementById('cardForm');
    const title = document.getElementById('cardModalTitle');
    
    if (modal && form && title) {
        title.textContent = 'Add New Card';
        form.reset();
        form.dataset.mode = 'add';
        form.dataset.cardId = '';
        modal.classList.add('show');
    }
}

function showEditCardModal(cardId) {
    const card = cardsData.cards.find(c => c.id === cardId);
    if (!card) return;
    
    const modal = document.getElementById('cardModal');
    const form = document.getElementById('cardForm');
    const title = document.getElementById('cardModalTitle');
    
    if (modal && form && title) {
        title.textContent = 'Edit Card';
        form.dataset.mode = 'edit';
        form.dataset.cardId = cardId;
        
        // Populate form
        document.getElementById('cardName').value = card.card_name || '';
        document.getElementById('cardHolderName').value = card.card_holder_name || '';
        document.getElementById('cardNumber').value = card.card_last_four ? `**** **** **** ${card.card_last_four}` : '';
        document.getElementById('expiryDate').value = card.expiry_date || '';
        document.getElementById('cvv').value = '***';
        document.getElementById('cardType').value = card.card_type || 'debit';
        document.getElementById('bankName').value = card.bank_name || '';
        document.getElementById('cardBalance').value = card.balance || 0;
        
        modal.classList.add('show');
    }
}

function closeCardModal() {
    const modal = document.getElementById('cardModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

async function saveCard(formData) {
    const form = document.getElementById('cardForm');
    const mode = form.dataset.mode;
    const cardId = form.dataset.cardId;
    
    try {
        if (mode === 'add') {
            await App.apiRequest('/cards', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            showToast('Card added successfully', 'success');
        } else {
            await App.apiRequest(`/cards/${cardId}`, {
                method: 'PUT',
                body: JSON.stringify(formData)
            });
            showToast('Card updated successfully', 'success');
        }
        
        closeCardModal();
        await loadCards();
        renderCards();
    } catch (error) {
        showToast(error.message || 'Failed to save card', 'error');
    }
}

function editCard(cardId) {
    showEditCardModal(cardId);
}

async function deleteCard(cardId) {
    if (!confirm('Are you sure you want to delete this card? All expenses linked to this card will be updated.')) {
        return;
    }
    
    try {
        await App.apiRequest(`/cards/${cardId}`, { method: 'DELETE' });
        showToast('Card deleted successfully', 'success');
        await loadCards();
        renderCards();
    } catch (error) {
        showToast(error.message || 'Failed to delete card', 'error');
    }
}

// ===========================
// CARD NUMBER FORMATTING
// ===========================

function formatCardNumber(input) {
    let value = input.value.replace(/\s/g, '').replace(/\D/g, '');
    let formattedValue = '';
    
    for (let i = 0; i < value.length; i++) {
        if (i > 0 && i % 4 === 0) {
            formattedValue += ' ';
        }
        formattedValue += value[i];
    }
    
    input.value = formattedValue.substring(0, 19); // 16 digits + 3 spaces
}

function formatExpiryDate(input) {
    let value = input.value.replace(/\D/g, '');
    
    if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    
    input.value = value;
}

// ===========================
// EVENT HANDLERS
// ===========================

function setupCardEvents() {
    // Add card button
    const addCardBtn = document.getElementById('addCardBtn');
    if (addCardBtn) {
        addCardBtn.addEventListener('click', showAddCardModal);
    }
    
    // Card form submission
    const cardForm = document.getElementById('cardForm');
    if (cardForm) {
        cardForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                card_name: document.getElementById('cardName').value,
                card_holder_name: document.getElementById('cardHolderName').value,
                card_number: document.getElementById('cardNumber').value.replace(/\s/g, ''),
                expiry_date: document.getElementById('expiryDate').value,
                cvv: document.getElementById('cvv').value,
                card_type: document.getElementById('cardType').value,
                bank_name: document.getElementById('bankName').value,
                balance: parseFloat(document.getElementById('cardBalance').value) || 0
            };
            
            // Skip validation for edit mode (card number will be masked)
            if (cardForm.dataset.mode === 'add') {
                if (formData.card_number.length !== 16) {
                    showToast('Please enter a valid 16-digit card number', 'error');
                    return;
                }
                
                if (formData.cvv.length < 3) {
                    showToast('Please enter a valid CVV', 'error');
                    return;
                }
            }
            
            await saveCard(formData);
        });
    }
    
    // Card number formatting
    const cardNumberInput = document.getElementById('cardNumber');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function() {
            formatCardNumber(this);
        });
    }
    
    // Expiry date formatting
    const expiryInput = document.getElementById('expiryDate');
    if (expiryInput) {
        expiryInput.addEventListener('input', function() {
            formatExpiryDate(this);
        });
    }
    
    // CVV input - numbers only
    const cvvInput = document.getElementById('cvv');
    if (cvvInput) {
        cvvInput.addEventListener('input', function() {
            this.value = this.value.replace(/\D/g, '').substring(0, 4);
        });
    }
    
    // Modal close
    const modalClose = document.querySelector('#cardModal .modal-close');
    const modalCancel = document.querySelector('#cardModal [data-dismiss="modal"]');
    
    if (modalClose) {
        modalClose.addEventListener('click', closeCardModal);
    }
    
    if (modalCancel) {
        modalCancel.addEventListener('click', closeCardModal);
    }
    
    // Close modal on overlay click
    const modalOverlay = document.getElementById('cardModal');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeCardModal();
            }
        });
    }
}

// ===========================
// LOADING STATE
// ===========================

function showCardsLoading(show) {
    const loader = document.getElementById('cardsLoader');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
    }
}

// ===========================
// INITIALIZATION
// ===========================

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('cardsContainer')) {
        initCardsPage();
    }
});

// Export for use in other modules
window.Cards = {
    init: initCardsPage,
    load: loadCards,
    add: showAddCardModal,
    edit: editCard,
    delete: deleteCard,
    getAll: () => cardsData.cards
};
