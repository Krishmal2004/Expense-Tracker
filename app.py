from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_mysqldb import MySQL
from flask_bcrypt import Bcrypt
from functools import wraps
from datetime import datetime, timedelta
from cryptography.fernet import Fernet
import os
import json

app = Flask(__name__)
app.config. from_object('config.Config')

# Initialize extensions
mysql = MySQL(app)
bcrypt = Bcrypt(app)

# Encryption key for card numbers (store this securely in production)
ENCRYPTION_KEY = os.environ.get('ENCRYPTION_KEY') or Fernet.generate_key()
cipher_suite = Fernet(ENCRYPTION_KEY)

# Authentication decorator
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function

# Helper function to encrypt card number
def encrypt_card_number(card_number):
    return cipher_suite.encrypt(card_number.encode()).decode()

# Helper function to decrypt card number
def decrypt_card_number(encrypted_card):
    return cipher_suite.decrypt(encrypted_card. encode()).decode()

# Helper function to mask card number
def mask_card_number(card_number):
    return '**** **** **** ' + card_number[-4:]

# ==================== ROUTES - Pages ====================

@app.route('/')
def index():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return render_template('index.html')

@app.route('/login')
def login_page():
    return render_template('login.html')

@app.route('/signup')
def signup_page():
    return render_template('signup.html')

@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session:
        return redirect(url_for('login_page'))
    return render_template('dashboard.html')

@app.route('/cards')
def cards_page():
    if 'user_id' not in session:
        return redirect(url_for('login_page'))
    return render_template('cards.html')

@app.route('/expenses')
def expenses_page():
    if 'user_id' not in session:
        return redirect(url_for('login_page'))
    return render_template('expenses.html')

@app.route('/settings')
def settings_page():
    if 'user_id' not in session:
        return redirect(url_for('login_page'))
    return render_template('settings.html')

@app.route('/reports')
def reports_page():
    if 'user_id' not in session:
        return redirect(url_for('login_page'))
    return render_template('reports.html')

@app.route('/notifications')
def notifications_page():
    if 'user_id' not in session:
        return redirect(url_for('login_page'))
    return render_template('notifications.html')

# ==================== API ROUTES - Authentication ====================

@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        if not username or not email or not password:
            return jsonify({'error': 'All fields are required'}), 400
        
        # Hash password
        password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
        
        cur = mysql.connection.cursor()
        
        # Check if user already exists
        cur.execute("SELECT id FROM users WHERE email = %s OR username = %s", (email, username))
        if cur.fetchone():
            cur.close()
            return jsonify({'error': 'User already exists'}), 400
        
        # Insert new user
        cur.execute(
            "INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s)",
            (username, email, password_hash)
        )
        mysql.connection.commit()
        user_id = cur.lastrowid
        cur.close()
        
        # Create session
        session['user_id'] = user_id
        session['username'] = username
        
        return jsonify({'message': 'Registration successful', 'user_id': user_id}), 201
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        cur = mysql.connection.cursor()
        cur.execute("SELECT id, username, password_hash FROM users WHERE email = %s", (email,))
        user = cur.fetchone()
        cur. close()
        
        if not user or not bcrypt.check_password_hash(user['password_hash'], password):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Create session
        session['user_id'] = user['id']
        session['username'] = user['username']
        
        return jsonify({'message': 'Login successful', 'username': user['username']}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logout successful'}), 200

# ==================== API ROUTES - User Management ====================

@app.route('/api/user/profile', methods=['GET'])
@login_required
def get_profile():
    try:
        cur = mysql.connection.cursor()
        cur.execute(
            "SELECT id, username, email, monthly_salary, created_at FROM users WHERE id = %s",
            (session['user_id'],)
        )
        user = cur.fetchone()
        cur.close()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify(user), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app. route('/api/user/profile', methods=['PUT'])
@login_required
def update_profile():
    try:
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        monthly_salary = data.get('monthly_salary')
        
        cur = mysql.connection.cursor()
        
        # Update user profile
        cur.execute(
            "UPDATE users SET username = %s, email = %s, monthly_salary = %s WHERE id = %s",
            (username, email, monthly_salary, session['user_id'])
        )
        mysql.connection.commit()
        cur.close()
        
        session['username'] = username
        
        return jsonify({'message': 'Profile updated successfully'}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/user/password', methods=['PUT'])
@login_required
def change_password():
    try:
        data = request.get_json()
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        
        if not current_password or not new_password:
            return jsonify({'error': 'All fields are required'}), 400
        
        cur = mysql.connection.cursor()
        cur.execute("SELECT password_hash FROM users WHERE id = %s", (session['user_id'],))
        user = cur.fetchone()
        
        if not user or not bcrypt.check_password_hash(user['password_hash'], current_password):
            cur.close()
            return jsonify({'error': 'Current password is incorrect'}), 401
        
        # Hash new password
        new_password_hash = bcrypt.generate_password_hash(new_password). decode('utf-8')
        
        cur.execute(
            "UPDATE users SET password_hash = %s WHERE id = %s",
            (new_password_hash, session['user_id'])
        )
        mysql. connection.commit()
        cur. close()
        
        return jsonify({'message': 'Password changed successfully'}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== API ROUTES - Card Management ====================

@app.route('/api/cards', methods=['GET'])
@login_required
def get_cards():
    try:
        cur = mysql.connection. cursor()
        cur.execute(
            "SELECT id, card_number_encrypted, card_type, card_holder, expiry_date, balance, created_at FROM cards WHERE user_id = %s",
            (session['user_id'],)
        )
        cards = cur.fetchall()
        cur.close()
        
        # Mask card numbers
        for card in cards:
            decrypted = decrypt_card_number(card['card_number_encrypted'])
            card['card_number'] = mask_card_number(decrypted)
            del card['card_number_encrypted']
        
        return jsonify(cards), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app. route('/api/cards', methods=['POST'])
@login_required
def add_card():
    try:
        data = request.get_json()
        card_number = data.get('card_number'). replace(' ', '')
        card_type = data.get('card_type')
        card_holder = data.get('card_holder')
        expiry_date = data. get('expiry_date')
        balance = data.get('balance', 0)
        
        # Encrypt card number
        encrypted_card = encrypt_card_number(card_number)
        
        cur = mysql.connection.cursor()
        cur.execute(
            "INSERT INTO cards (user_id, card_number_encrypted, card_type, card_holder, expiry_date, balance) VALUES (%s, %s, %s, %s, %s, %s)",
            (session['user_id'], encrypted_card, card_type, card_holder, expiry_date, balance)
        )
        mysql.connection.commit()
        card_id = cur.lastrowid
        cur.close()
        
        return jsonify({'message': 'Card added successfully', 'card_id': card_id}), 201
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/cards/<int:card_id>', methods=['DELETE'])
@login_required
def delete_card(card_id):
    try:
        cur = mysql.connection.cursor()
        cur.execute(
            "DELETE FROM cards WHERE id = %s AND user_id = %s",
            (card_id, session['user_id'])
        )
        mysql.connection.commit()
        cur.close()
        
        return jsonify({'message': 'Card deleted successfully'}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== API ROUTES - Expense Management ====================

@app.route('/api/expenses', methods=['GET'])
@login_required
def get_expenses():
    try:
        # Get query parameters for filtering
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        category = request.args.get('category')
        
        cur = mysql.connection.cursor()
        
        query = """
            SELECT e.id, e.description, e.amount, e.category, e.expense_date, e.created_at,
                   c.card_type, c.card_holder
            FROM expenses e
            LEFT JOIN cards c ON e.card_id = c.id
            WHERE e.user_id = %s
        """
        params = [session['user_id']]
        
        if start_date:
            query += " AND e. expense_date >= %s"
            params.append(start_date)
        
        if end_date:
            query += " AND e.expense_date <= %s"
            params.append(end_date)
        
        if category:
            query += " AND e.category = %s"
            params.append(category)
        
        query += " ORDER BY e.expense_date DESC"
        
        cur.execute(query, tuple(params))
        expenses = cur.fetchall()
        cur. close()
        
        # Convert Decimal to float for JSON serialization
        for expense in expenses:
            expense['amount'] = float(expense['amount'])
        
        return jsonify(expenses), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/expenses', methods=['POST'])
@login_required
def add_expense():
    try:
        data = request.get_json()
        description = data.get('description')
        amount = data.get('amount')
        category = data.get('category')
        expense_date = data.get('expense_date')
        card_id = data.get('card_id')
        
        cur = mysql.connection.cursor()
        cur.execute(
            "INSERT INTO expenses (user_id, card_id, description, amount, category, expense_date) VALUES (%s, %s, %s, %s, %s, %s)",
            (session['user_id'], card_id, description, amount, category, expense_date)
        )
        mysql. connection.commit()
        expense_id = cur.lastrowid
        
        # Check if spending exceeds 80% of monthly salary
        cur.execute("SELECT monthly_salary FROM users WHERE id = %s", (session['user_id'],))
        user = cur.fetchone()
        monthly_salary = float(user['monthly_salary']) if user['monthly_salary'] else 0
        
        # Get current month's total expenses
        current_month = datetime.now().strftime('%Y-%m')
        cur.execute(
            "SELECT SUM(amount) as total FROM expenses WHERE user_id = %s AND DATE_FORMAT(expense_date, '%%Y-%%m') = %s",
            (session['user_id'], current_month)
        )
        result = cur.fetchone()
        total_expenses = float(result['total']) if result['total'] else 0
        
        # Create notification if spending exceeds 80%
        if monthly_salary > 0 and total_expenses >= (monthly_salary * 0.8):
            percentage = (total_expenses / monthly_salary) * 100
            message = f"Alert!  You've spent {percentage:.1f}% of your monthly salary ({total_expenses:.2f}/{monthly_salary:.2f})"
            cur.execute(
                "INSERT INTO notifications (user_id, message, type) VALUES (%s, %s, %s)",
                (session['user_id'], message, 'warning')
            )
            mysql.connection.commit()
        
        cur.close()
        
        return jsonify({'message': 'Expense added successfully', 'expense_id': expense_id}), 201
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app. route('/api/expenses/<int:expense_id>', methods=['PUT'])
@login_required
def update_expense(expense_id):
    try:
        data = request.get_json()
        description = data.get('description')
        amount = data.get('amount')
        category = data.get('category')
        expense_date = data.get('expense_date')
        card_id = data.get('card_id')
        
        cur = mysql.connection.cursor()
        cur.execute(
            "UPDATE expenses SET description = %s, amount = %s, category = %s, expense_date = %s, card_id = %s WHERE id = %s AND user_id = %s",
            (description, amount, category, expense_date, card_id, expense_id, session['user_id'])
        )
        mysql.connection.commit()
        cur.close()
        
        return jsonify({'message': 'Expense updated successfully'}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/expenses/<int:expense_id>', methods=['DELETE'])
@login_required
def delete_expense(expense_id):
    try:
        cur = mysql. connection.cursor()
        cur. execute(
            "DELETE FROM expenses WHERE id = %s AND user_id = %s",
            (expense_id, session['user_id'])
        )
        mysql.connection.commit()
        cur.close()
        
        return jsonify({'message': 'Expense deleted successfully'}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== API ROUTES - Analytics ====================

@app.route('/api/analytics/summary', methods=['GET'])
@login_required
def get_summary():
    try:
        cur = mysql.connection.cursor()
        
        # Get user's monthly salary
        cur.execute("SELECT monthly_salary FROM users WHERE id = %s", (session['user_id'],))
        user = cur.fetchone()
        monthly_salary = float(user['monthly_salary']) if user['monthly_salary'] else 0
        
        # Get current month's total expenses
        current_month = datetime.now().strftime('%Y-%m')
        cur.execute(
            "SELECT SUM(amount) as total FROM expenses WHERE user_id = %s AND DATE_FORMAT(expense_date, '%%Y-%%m') = %s",
            (session['user_id'], current_month)
        )
        result = cur.fetchone()
        total_expenses = float(result['total']) if result['total'] else 0
        
        # Get total balance from all cards
        cur.execute(
            "SELECT SUM(balance) as total FROM cards WHERE user_id = %s",
            (session['user_id'],)
        )
        result = cur.fetchone()
        total_balance = float(result['total']) if result['total'] else 0
        
        cur.close()
        
        remaining_balance = monthly_salary - total_expenses
        
        return jsonify({
            'monthly_salary': monthly_salary,
            'total_expenses': total_expenses,
            'remaining_balance': remaining_balance,
            'total_balance': total_balance,
            'current_month': current_month
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/analytics/monthly', methods=['GET'])
@login_required
def get_monthly_analytics():
    try:
        # Get last 6 months
        cur = mysql. connection.cursor()
        
        query = """
            SELECT DATE_FORMAT(expense_date, '%%Y-%%m') as month, SUM(amount) as total
            FROM expenses
            WHERE user_id = %s AND expense_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
            GROUP BY DATE_FORMAT(expense_date, '%%Y-%%m')
            ORDER BY month
        """
        
        cur.execute(query, (session['user_id'],))
        monthly_data = cur.fetchall()
        cur.close()
        
        # Convert Decimal to float
        for item in monthly_data:
            item['total'] = float(item['total'])
        
        return jsonify(monthly_data), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/analytics/category', methods=['GET'])
@login_required
def get_category_analytics():
    try:
        # Get current month by default, or specified month
        month = request.args.get('month', datetime.now().strftime('%Y-%m'))
        
        cur = mysql. connection.cursor()
        
        query = """
            SELECT category, SUM(amount) as total
            FROM expenses
            WHERE user_id = %s AND DATE_FORMAT(expense_date, '%%Y-%%m') = %s
            GROUP BY category
            ORDER BY total DESC
        """
        
        cur.execute(query, (session['user_id'], month))
        category_data = cur.fetchall()
        cur.close()
        
        # Convert Decimal to float
        for item in category_data:
            item['total'] = float(item['total'])
        
        return jsonify(category_data), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== API ROUTES - Notifications ====================

@app.route('/api/notifications', methods=['GET'])
@login_required
def get_notifications():
    try:
        cur = mysql.connection.cursor()
        cur.execute(
            "SELECT id, message, type, is_read, created_at FROM notifications WHERE user_id = %s ORDER BY created_at DESC LIMIT 50",
            (session['user_id'],)
        )
        notifications = cur.fetchall()
        cur.close()
        
        return jsonify(notifications), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/notifications/<int:notification_id>/read', methods=['PUT'])
@login_required
def mark_notification_read(notification_id):
    try:
        cur = mysql.connection.cursor()
        cur.execute(
            "UPDATE notifications SET is_read = TRUE WHERE id = %s AND user_id = %s",
            (notification_id, session['user_id'])
        )
        mysql.connection.commit()
        cur.close()
        
        return jsonify({'message': 'Notification marked as read'}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)