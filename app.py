from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import os
from functools import wraps

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///expense_tracker.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

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
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    bank_cards = db.relationship('BankCard', backref='user', lazy=True, cascade='all, delete-orphan')
    expenses = db.relationship('Expense', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def set_password(self, password):
        self. password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self. id,
            'full_name': self.full_name,
            'email': self.email,
            'phone': self.phone,
            'address': self.address,
            'city': self.city,
            'state': self.state,
            'created_at': self.created_at.strftime('%Y-%m-%d')
        }


class BankCard(db.Model):
    __tablename__ = 'bank_cards'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    card_name = db.Column(db.String(120), nullable=False)
    card_number = db.Column(db.String(255), nullable=False)
    expiry_date = db.Column(db.String(10), nullable=False)
    cvv = db.Column(db. String(10), nullable=False)
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
            'card_number': self.get_masked_number(),
            'expiry_date': self.expiry_date,
            'created_at': self.created_at.strftime('%Y-%m-%d')
        }


class Expense(db.Model):
    __tablename__ = 'expenses'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    card_id = db.Column(db.Integer, db.ForeignKey('bank_cards.id'), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    description = db.Column(db.String(255), nullable=True)
    expense_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'card_id': self.card_id,
            'card_name': self.bank_card.card_name,
            'category': self.category,
            'amount': self.amount,
            'description': self. description,
            'expense_date': self.expense_date.strftime('%Y-%m-%d'),
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
    if 'user_id' not in session:
        return redirect(url_for('login_page'))
    return render_template("profile.html")


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
        
        if not user.check_password(data. get('current_password')):
            return jsonify({'error': 'Current password is incorrect'}), 401
        
        if data.get('new_password') != data.get('confirm_password'):
            return jsonify({'error': 'New passwords do not match'}), 400
        
        if len(data. get('new_password', '')) < 8:
            return jsonify({'error': 'Password must be at least 8 characters'}), 400
        
        user.set_password(data['new_password'])
        db.session.commit()
        
        return jsonify({'message': 'Password changed successfully'}), 200
    
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
        if len(data['card_number']. replace(' ', '')) != 16:
            return jsonify({'error': 'Invalid card number'}), 400
        
        card = BankCard(
            user_id=user.id,
            card_name=data['card_name'],
            card_number=data['card_number']. replace(' ', ''),
            expiry_date=data['expiry_date'],
            cvv=data['cvv']
        )
        
        db.session. add(card)
        db. session.commit()
        
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
        
        if not all(k in data for k in ['card_id', 'category', 'amount']):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Verify card belongs to user
        card = BankCard.query.filter_by(id=data['card_id'], user_id=user.id). first()
        if not card:
            return jsonify({'error': 'Card not found'}), 404
        
        expense = Expense(
            user_id=user.id,
            card_id=data['card_id'],
            category=data['category'],
            amount=float(data['amount']),
            description=data.get('description', ''),
            expense_date=datetime.fromisoformat(data.get('expense_date', datetime.utcnow().isoformat()))
        )
        
        db.session.add(expense)
        db.session.commit()
        
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
        
        db. session.delete(expense)
        db.session.commit()
        
        return jsonify({'message': 'Expense deleted successfully'}), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


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