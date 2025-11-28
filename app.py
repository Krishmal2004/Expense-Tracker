from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
from decimal import Decimal
import os
import logging
from functools import wraps

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///expense_tracker.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=24)

# Enable CORS
CORS(app, supports_credentials=True)

# Initialize Database
db = SQLAlchemy(app)

# ===========================
# DATABASE MODELS
# ===========================

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    address = db.Column(db.String(255), nullable=True)
    city = db.Column(db.String(120), nullable=True)
    state = db.Column(db.String(120), nullable=True)
    monthly_salary = db.Column(db.Float, default=0.0)
    profile_picture = db.Column(db.String(255), nullable=True)
    notification_email = db.Column(db.Boolean, default=True)
    notification_budget = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    bank_cards = db.relationship('BankCard', backref='user', lazy=True, cascade='all, delete-orphan')
    expenses = db.relationship('Expense', backref='user', lazy=True, cascade='all, delete-orphan')
    notifications = db.relationship('Notification', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'full_name': self.full_name,
            'email': self.email,
            'phone': self.phone,
            'address': self.address,
            'city': self.city,
            'state': self.state,
            'monthly_salary': self.monthly_salary,
            'profile_picture': self.profile_picture,
            'notification_email': self.notification_email,
            'notification_budget': self.notification_budget,
            'created_at': self.created_at.strftime('%Y-%m-%d')
        }


class BankCard(db.Model):
    __tablename__ = 'bank_cards'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    card_name = db.Column(db.String(120), nullable=False)
    card_holder_name = db.Column(db.String(120), nullable=True)
    card_number = db.Column(db.String(255), nullable=False)
    expiry_date = db.Column(db.String(10), nullable=False)
    cvv = db.Column(db.String(10), nullable=False)
    card_type = db.Column(db.String(10), default='debit')  # 'credit' or 'debit'
    bank_name = db.Column(db.String(100), nullable=True)
    balance = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    expenses = db.relationship('Expense', backref='bank_card', lazy=True, cascade='all, delete-orphan')
    
    def get_masked_number(self):
        """Return masked card number for display"""
        if len(self.card_number) >= 4:
            return f"**** **** **** {self.card_number[-4:]}"
        return "****"
    
    def to_dict(self):
        return {
            'id': self.id,
            'card_name': self.card_name,
            'card_holder_name': self.card_holder_name,
            'card_number': self.get_masked_number(),
            'card_last_four': self.card_number[-4:] if len(self.card_number) >= 4 else '',
            'expiry_date': self.expiry_date,
            'card_type': self.card_type,
            'bank_name': self.bank_name,
            'balance': self.balance,
            'created_at': self.created_at.strftime('%Y-%m-%d')
        }


class Expense(db.Model):
    __tablename__ = 'expenses'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    card_id = db.Column(db.Integer, db.ForeignKey('bank_cards.id'), nullable=True)
    amount = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(50), nullable=False)
    description = db.Column(db.String(255), nullable=True)
    expense_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    payment_method = db.Column(db.String(50), default='cash')  # 'cash' or 'card'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'card_id': self.card_id,
            'card_name': self.bank_card.card_name if self.bank_card else 'Cash',
            'category': self.category,
            'amount': self.amount,
            'description': self.description,
            'expense_date': self.expense_date.strftime('%Y-%m-%d'),
            'payment_method': self.payment_method,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }


class Notification(db.Model):
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(20), default='info')  # 'warning', 'info', 'success'
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'message': self.message,
            'type': self.type,
            'is_read': self.is_read,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }


# ===========================
# HELPER FUNCTIONS
# ===========================

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Not logged in'}), 401
        return f(*args, **kwargs)
    return decorated_function


def get_current_user():
    if 'user_id' in session:
        return User.query.get(session['user_id'])
    return None


# ===========================
# FRONTEND ROUTES
# ===========================

@app.route("/")
def home():
    return render_template("index.html")


@app. route("/login")
def login_page():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return render_template("login.html")


@app.route("/signup")
def signup_page():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return render_template("signup.html")


@app.route("/dashboard")
def dashboard():
    if 'user_id' not in session:
        return redirect(url_for('login_page'))
    return render_template("dashboard.html")


@app.route("/profile")
def profile():
    # Redirect to settings page
    return redirect(url_for('settings_page'))


@app.route("/cards")
def cards_page():
    if 'user_id' not in session:
        return redirect(url_for('login_page'))
    return render_template("cards.html")


@app.route("/add-expense")
def add_expense_page():
    if 'user_id' not in session:
        return redirect(url_for('login_page'))
    return render_template("add-expense.html")


@app.route("/settings")
def settings_page():
    if 'user_id' not in session:
        return redirect(url_for('login_page'))
    return render_template("settings.html")


@app.route("/reports")
def reports_page():
    if 'user_id' not in session:
        return redirect(url_for('login_page'))
    return render_template("reports.html")


# ===========================
# AUTHENTICATION API ROUTES
# ===========================

@app.route("/api/auth/signup", methods=['POST'])
def signup():
    try:
        data = request.get_json()
        
        # Validate input
        if not data. get('email') or not data.get('password') or not data.get('full_name'):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Check if user exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already registered'}), 400
        
        # Password validation
        if len(data['password']) < 8:
            return jsonify({'error': 'Password must be at least 8 characters'}), 400
        
        # Create new user
        user = User(
            full_name=data['full_name'],
            email=data['email']
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        session['user_id'] = user. id
        return jsonify({
            'message': 'Signup successful',
            'user': user.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route("/api/auth/login", methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password required'}), 400
        
        user = User.query.filter_by(email=data['email']).first()
        
        if not user or not user.check_password(data['password']):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        session['user_id'] = user.id
        return jsonify({
            'message': 'Login successful',
            'user': user.to_dict()
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route("/api/auth/logout", methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out successfully'}), 200


@app.route("/api/auth/verify", methods=['GET'])
def verify_session():
    user = get_current_user()
    if user:
        return jsonify({'authenticated': True, 'user': user.to_dict()}), 200
    return jsonify({'authenticated': False}), 401


# ===========================
# USER PROFILE API ROUTES
# ===========================

@app.route("/api/user/profile", methods=['GET'])
@login_required
def get_profile():
    user = get_current_user()
    return jsonify(user.to_dict()), 200


@app.route("/api/user/profile", methods=['PUT'])
@login_required
def update_profile():
    try:
        user = get_current_user()
        data = request.get_json()
        
        user.full_name = data.get('full_name', user.full_name)
        user.phone = data.get('phone', user.phone)
        user.address = data.get('address', user.address)
        user.city = data.get('city', user.city)
        user.state = data.get('state', user.state)
        
        db.session.commit()
        return jsonify({'message': 'Profile updated', 'user': user.to_dict()}), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route("/api/user/change-password", methods=['POST'])
@login_required
def change_password():
    try:
        user = get_current_user()
        data = request.get_json()
        
        if not user.check_password(data.get('current_password')):
            return jsonify({'error': 'Current password is incorrect'}), 401
        
        if data.get('new_password') != data.get('confirm_password'):
            return jsonify({'error': 'New passwords do not match'}), 400
        
        if len(data.get('new_password', '')) < 8:
            return jsonify({'error': 'Password must be at least 8 characters'}), 400
        
        user.set_password(data['new_password'])
        db.session.commit()
        
        return jsonify({'message': 'Password changed successfully'}), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route("/api/user/salary", methods=['PUT'])
@login_required
def update_salary():
    try:
        user = get_current_user()
        data = request.get_json()
        
        user.monthly_salary = float(data.get('monthly_salary', 0))
        db.session.commit()
        
        return jsonify({'message': 'Salary updated', 'monthly_salary': user.monthly_salary}), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ===========================
# BANK CARD API ROUTES
# ===========================

@app.route("/api/cards", methods=['POST'])
@login_required
def add_card():
    try:
        user = get_current_user()
        data = request.get_json()
        
        if not all(k in data for k in ['card_name', 'card_number', 'expiry_date', 'cvv']):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Validate card number (basic check)
        if len(data['card_number'].replace(' ', '')) != 16:
            return jsonify({'error': 'Invalid card number'}), 400
        
        card = BankCard(
            user_id=user.id,
            card_name=data['card_name'],
            card_holder_name=data.get('card_holder_name', ''),
            card_number=data['card_number'].replace(' ', ''),
            expiry_date=data['expiry_date'],
            cvv=data['cvv'],
            card_type=data.get('card_type', 'debit'),
            bank_name=data.get('bank_name', ''),
            balance=float(data.get('balance', 0))
        )
        
        db.session.add(card)
        db.session.commit()
        
        return jsonify({
            'message': 'Card added successfully',
            'card': card.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route("/api/cards", methods=['GET'])
@login_required
def get_cards():
    try:
        user = get_current_user()
        cards = BankCard.query.filter_by(user_id=user.id).all()
        
        return jsonify({
            'cards': [card.to_dict() for card in cards]
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app. route("/api/cards/<int:card_id>", methods=['GET'])
@login_required
def get_card(card_id):
    try:
        user = get_current_user()
        card = BankCard.query.filter_by(id=card_id, user_id=user.id).first()
        
        if not card:
            return jsonify({'error': 'Card not found'}), 404
        
        return jsonify(card.to_dict()), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route("/api/cards/<int:card_id>", methods=['PUT'])
@login_required
def update_card(card_id):
    try:
        user = get_current_user()
        card = BankCard.query.filter_by(id=card_id, user_id=user.id).first()
        
        if not card:
            return jsonify({'error': 'Card not found'}), 404
        
        data = request.get_json()
        card.card_name = data.get('card_name', card.card_name)
        
        db.session.commit()
        return jsonify({'message': 'Card updated', 'card': card.to_dict()}), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route("/api/cards/<int:card_id>", methods=['DELETE'])
@login_required
def delete_card(card_id):
    try:
        user = get_current_user()
        card = BankCard. query.filter_by(id=card_id, user_id=user.id).first()
        
        if not card:
            return jsonify({'error': 'Card not found'}), 404
        
        db.session.delete(card)
        db.session.commit()
        
        return jsonify({'message': 'Card deleted successfully'}), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ===========================
# EXPENSE API ROUTES
# ===========================

@app.route("/api/expenses", methods=['POST'])
@login_required
def add_expense():
    try:
        user = get_current_user()
        data = request.get_json()
        
        if not all(k in data for k in ['category', 'amount']):
            return jsonify({'error': 'Missing required fields'}), 400
        
        payment_method = data.get('payment_method', 'cash')
        card_id = data.get('card_id')
        
        # Verify card belongs to user if card_id provided
        if card_id and payment_method == 'card':
            card = BankCard.query.filter_by(id=card_id, user_id=user.id).first()
            if not card:
                return jsonify({'error': 'Card not found'}), 404
        else:
            card_id = None
        
        expense = Expense(
            user_id=user.id,
            card_id=card_id,
            category=data['category'],
            amount=float(data['amount']),
            description=data.get('description', ''),
            payment_method=payment_method,
            expense_date=datetime.fromisoformat(data.get('expense_date', datetime.utcnow().isoformat()))
        )
        
        db.session.add(expense)
        db.session.commit()
        
        # Check budget warning
        check_budget_warning(user.id)
        
        return jsonify({
            'message': 'Expense added successfully',
            'expense': expense.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route("/api/expenses", methods=['GET'])
@login_required
def get_expenses():
    try:
        user = get_current_user()
        month = request.args.get('month')
        year = request.args. get('year')
        
        query = Expense.query.filter_by(user_id=user. id)
        
        if month and year:
            start_date = datetime(int(year), int(month), 1)
            if int(month) == 12:
                end_date = datetime(int(year) + 1, 1, 1)
            else:
                end_date = datetime(int(year), int(month) + 1, 1)
            query = query.filter(Expense. expense_date >= start_date, Expense.expense_date < end_date)
        
        expenses = query.order_by(Expense.expense_date.desc()).all()
        
        return jsonify({
            'expenses': [expense.to_dict() for expense in expenses]
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route("/api/expenses/monthly", methods=['GET'])
@login_required
def get_monthly_summary():
    try:
        user = get_current_user()
        month = request.args.get('month', datetime.now().month, type=int)
        year = request.args.get('year', datetime.now().year, type=int)
        
        start_date = datetime(year, month, 1)
        if month == 12:
            end_date = datetime(year + 1, 1, 1)
        else:
            end_date = datetime(year, month + 1, 1)
        
        expenses = Expense.query.filter(
            Expense. user_id == user.id,
            Expense.expense_date >= start_date,
            Expense.expense_date < end_date
        ).all()
        
        total = sum(e.amount for e in expenses)
        by_category = {}
        
        for expense in expenses:
            if expense.category not in by_category:
                by_category[expense.category] = 0
            by_category[expense.category] += expense.amount
        
        return jsonify({
            'month': month,
            'year': year,
            'total': total,
            'by_category': by_category,
            'expenses': [expense. to_dict() for expense in expenses]
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route("/api/expenses/category", methods=['GET'])
@login_required
def get_expenses_by_category():
    try:
        user = get_current_user()
        category = request.args.get('category')
        
        if not category:
            return jsonify({'error': 'Category parameter required'}), 400
        
        expenses = Expense.query.filter_by(user_id=user. id, category=category).order_by(Expense.expense_date.desc()).all()
        
        total = sum(e.amount for e in expenses)
        
        return jsonify({
            'category': category,
            'total': total,
            'expenses': [expense.to_dict() for expense in expenses]
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route("/api/expenses/<int:expense_id>", methods=['PUT'])
@login_required
def update_expense(expense_id):
    try:
        user = get_current_user()
        expense = Expense.query.filter_by(id=expense_id, user_id=user.id).first()
        
        if not expense:
            return jsonify({'error': 'Expense not found'}), 404
        
        data = request.get_json()
        expense.category = data.get('category', expense.category)
        expense.amount = float(data.get('amount', expense.amount))
        expense.description = data.get('description', expense.description)
        
        db.session.commit()
        return jsonify({'message': 'Expense updated', 'expense': expense.to_dict()}), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route("/api/expenses/<int:expense_id>", methods=['DELETE'])
@login_required
def delete_expense(expense_id):
    try:
        user = get_current_user()
        expense = Expense.query.filter_by(id=expense_id, user_id=user.id).first()
        
        if not expense:
            return jsonify({'error': 'Expense not found'}), 404
        
        db.session.delete(expense)
        db.session.commit()
        
        return jsonify({'message': 'Expense deleted successfully'}), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ===========================
# ANALYTICS API ROUTES
# ===========================

@app.route("/api/analytics/monthly", methods=['GET'])
@login_required
def get_monthly_analytics():
    """Get monthly spending data for the past 12 months"""
    try:
        user = get_current_user()
        now = datetime.now()
        monthly_data = []
        
        for i in range(11, -1, -1):
            # Calculate month and year
            target_date = now - timedelta(days=i*30)
            month = target_date.month
            year = target_date.year
            
            start_date = datetime(year, month, 1)
            if month == 12:
                end_date = datetime(year + 1, 1, 1)
            else:
                end_date = datetime(year, month + 1, 1)
            
            expenses = Expense.query.filter(
                Expense.user_id == user.id,
                Expense.expense_date >= start_date,
                Expense.expense_date < end_date
            ).all()
            
            total = sum(e.amount for e in expenses)
            monthly_data.append({
                'month': month,
                'year': year,
                'month_name': start_date.strftime('%b'),
                'total': total
            })
        
        return jsonify({'monthly_data': monthly_data}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route("/api/analytics/category", methods=['GET'])
@login_required
def get_category_analytics():
    """Get category-wise expense breakdown"""
    try:
        user = get_current_user()
        month = request.args.get('month', datetime.now().month, type=int)
        year = request.args.get('year', datetime.now().year, type=int)
        
        start_date = datetime(year, month, 1)
        if month == 12:
            end_date = datetime(year + 1, 1, 1)
        else:
            end_date = datetime(year, month + 1, 1)
        
        expenses = Expense.query.filter(
            Expense.user_id == user.id,
            Expense.expense_date >= start_date,
            Expense.expense_date < end_date
        ).all()
        
        by_category = {}
        for expense in expenses:
            if expense.category not in by_category:
                by_category[expense.category] = 0
            by_category[expense.category] += expense.amount
        
        category_data = [{'category': k, 'amount': v} for k, v in by_category.items()]
        
        return jsonify({
            'month': month,
            'year': year,
            'total': sum(e.amount for e in expenses),
            'categories': category_data
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route("/api/analytics/trends", methods=['GET'])
@login_required
def get_spending_trends():
    """Get spending trends and insights"""
    try:
        user = get_current_user()
        now = datetime.now()
        
        # Current month data
        current_start = datetime(now.year, now.month, 1)
        if now.month == 12:
            current_end = datetime(now.year + 1, 1, 1)
        else:
            current_end = datetime(now.year, now.month + 1, 1)
        
        current_expenses = Expense.query.filter(
            Expense.user_id == user.id,
            Expense.expense_date >= current_start,
            Expense.expense_date < current_end
        ).all()
        
        current_total = sum(e.amount for e in current_expenses)
        
        # Previous month data
        if now.month == 1:
            prev_start = datetime(now.year - 1, 12, 1)
            prev_end = current_start
        else:
            prev_start = datetime(now.year, now.month - 1, 1)
            prev_end = current_start
        
        prev_expenses = Expense.query.filter(
            Expense.user_id == user.id,
            Expense.expense_date >= prev_start,
            Expense.expense_date < prev_end
        ).all()
        
        prev_total = sum(e.amount for e in prev_expenses)
        
        # Calculate change percentage
        if prev_total > 0:
            change_percent = ((current_total - prev_total) / prev_total) * 100
        else:
            change_percent = 100 if current_total > 0 else 0
        
        # Top spending category
        by_category = {}
        for expense in current_expenses:
            if expense.category not in by_category:
                by_category[expense.category] = 0
            by_category[expense.category] += expense.amount
        
        top_category = max(by_category, key=by_category.get) if by_category else None
        
        # Budget warning
        budget_warning = False
        if user.monthly_salary > 0:
            budget_percent = (current_total / user.monthly_salary) * 100
            budget_warning = budget_percent >= 80
        else:
            budget_percent = 0
        
        return jsonify({
            'current_month_total': current_total,
            'previous_month_total': prev_total,
            'change_percent': round(change_percent, 2),
            'top_category': top_category,
            'top_category_amount': by_category.get(top_category, 0) if top_category else 0,
            'budget_percent': round(budget_percent, 2),
            'budget_warning': budget_warning,
            'monthly_salary': user.monthly_salary,
            'remaining_budget': user.monthly_salary - current_total if user.monthly_salary > 0 else 0
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route("/api/dashboard/summary", methods=['GET'])
@login_required
def get_dashboard_summary():
    """Get comprehensive dashboard summary"""
    try:
        user = get_current_user()
        now = datetime.now()
        
        # Current month
        current_start = datetime(now.year, now.month, 1)
        if now.month == 12:
            current_end = datetime(now.year + 1, 1, 1)
        else:
            current_end = datetime(now.year, now.month + 1, 1)
        
        monthly_expenses = Expense.query.filter(
            Expense.user_id == user.id,
            Expense.expense_date >= current_start,
            Expense.expense_date < current_end
        ).all()
        
        total_expenses = sum(e.amount for e in monthly_expenses)
        
        # Get all cards balance
        cards = BankCard.query.filter_by(user_id=user.id).all()
        total_card_balance = sum(c.balance for c in cards)
        
        # Transaction count
        all_expenses = Expense.query.filter_by(user_id=user.id).all()
        transaction_count = len(all_expenses)
        
        # Recent transactions (last 5)
        recent_expenses = Expense.query.filter_by(user_id=user.id).order_by(
            Expense.expense_date.desc()
        ).limit(5).all()
        
        # Category breakdown
        by_category = {}
        for expense in monthly_expenses:
            if expense.category not in by_category:
                by_category[expense.category] = 0
            by_category[expense.category] += expense.amount
        
        return jsonify({
            'user': user.to_dict(),
            'monthly_salary': user.monthly_salary,
            'total_expenses': total_expenses,
            'remaining_balance': user.monthly_salary - total_expenses if user.monthly_salary > 0 else 0,
            'total_card_balance': total_card_balance,
            'transaction_count': transaction_count,
            'recent_transactions': [e.to_dict() for e in recent_expenses],
            'category_breakdown': by_category,
            'cards_count': len(cards)
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ===========================
# NOTIFICATION API ROUTES
# ===========================

@app.route("/api/notifications", methods=['GET'])
@login_required
def get_notifications():
    try:
        user = get_current_user()
        notifications = Notification.query.filter_by(user_id=user.id).order_by(
            Notification.created_at.desc()
        ).limit(20).all()
        
        return jsonify({
            'notifications': [n.to_dict() for n in notifications]
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route("/api/notifications/<int:notification_id>/read", methods=['PUT'])
@login_required
def mark_notification_read(notification_id):
    try:
        user = get_current_user()
        notification = Notification.query.filter_by(
            id=notification_id, user_id=user.id
        ).first()
        
        if not notification:
            return jsonify({'error': 'Notification not found'}), 404
        
        notification.is_read = True
        db.session.commit()
        
        return jsonify({'message': 'Notification marked as read'}), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route("/api/notifications/read-all", methods=['PUT'])
@login_required
def mark_all_notifications_read():
    try:
        user = get_current_user()
        Notification.query.filter_by(user_id=user.id, is_read=False).update({'is_read': True})
        db.session.commit()
        
        return jsonify({'message': 'All notifications marked as read'}), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


def check_budget_warning(user_id):
    """Check if user exceeded 80% of budget and create notification"""
    user = User.query.get(user_id)
    if not user or user.monthly_salary <= 0:
        return
    
    now = datetime.now()
    current_start = datetime(now.year, now.month, 1)
    if now.month == 12:
        current_end = datetime(now.year + 1, 1, 1)
    else:
        current_end = datetime(now.year, now.month + 1, 1)
    
    expenses = Expense.query.filter(
        Expense.user_id == user.id,
        Expense.expense_date >= current_start,
        Expense.expense_date < current_end
    ).all()
    
    total = sum(e.amount for e in expenses)
    budget_percent = (total / user.monthly_salary) * 100
    
    if budget_percent >= 80:
        # Check if warning already sent this month
        existing = Notification.query.filter(
            Notification.user_id == user.id,
            Notification.type == 'warning',
            Notification.created_at >= current_start
        ).first()
        
        if not existing:
            notification = Notification(
                user_id=user.id,
                message=f'Warning: You have spent {budget_percent:.1f}% of your monthly budget!',
                type='warning'
            )
            db.session.add(notification)
            db.session.commit()


# ===========================
# ERROR HANDLERS
# ===========================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404


@app.errorhandler(500)
def server_error(error):
    return jsonify({'error': 'Server error'}), 500


# ===========================
# CREATE DATABASE TABLES
# ===========================

def init_db():
    with app. app_context():
        db. create_all()
        print("Database initialized successfully!")


if __name__ == "__main__":
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)