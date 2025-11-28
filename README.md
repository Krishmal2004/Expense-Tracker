# Expense Tracker

A comprehensive web-based monthly expense tracker application that helps users monitor their spending habits, manage budgets, and gain insights into their financial patterns.

## Features

- **User Authentication**: Secure signup, login, and session management
- **Dashboard**: Overview of monthly expenses, balance, and recent transactions
- **Card Management**: Add and manage multiple credit/debit cards
- **Expense Tracking**: Record expenses with categories, descriptions, and payment methods
- **Analytics & Reports**: Visual charts and spending insights
- **Budget Alerts**: Notifications when spending exceeds 80% of monthly budget
- **Export Data**: Download expense data as CSV

## Tech Stack

- **Backend**: Flask (Python)
- **Database**: SQLite (default) / MySQL
- **Frontend**: HTML5, CSS3, JavaScript
- **Charts**: Chart.js
- **Icons**: Font Awesome

## Project Structure

```
/
├── app.py                 # Main Flask application
├── config.py              # Configuration settings
├── database.sql           # MySQL database schema
├── requirements.txt       # Python dependencies
├── static/
│   ├── css/
│   │   ├── main.css       # Global styles
│   │   ├── auth.css       # Login/Signup styles
│   │   ├── dashboard.css  # Dashboard styles
│   │   └── components.css # Reusable components
│   ├── js/
│   │   ├── main.js        # Global utilities
│   │   ├── auth.js        # Authentication handling
│   │   ├── dashboard.js   # Dashboard functionality
│   │   ├── cards.js       # Card management
│   │   ├── expenses.js    # Expense management
│   │   ├── charts.js      # Chart.js integration
│   │   └── notifications.js # Toast notifications
│   └── images/
├── templates/
│   ├── index.html         # Landing page
│   ├── login.html         # Login page
│   ├── signup.html        # Signup page
│   ├── dashboard.html     # Main dashboard
│   ├── cards.html         # Card management
│   ├── add-expense.html   # Add expense form
│   ├── settings.html      # User settings
│   └── reports.html       # Analytics & reports
└── README.md
```

## Installation

### Prerequisites

- Python 3.8+
- pip (Python package manager)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/expense-tracker.git
   cd expense-tracker
   ```

2. **Create a virtual environment**
   ```bash
   python -m venv venv
   
   # On Windows
   venv\Scripts\activate
   
   # On macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set environment variables (optional)**
   ```bash
   export SECRET_KEY="your-secret-key"
   export DATABASE_URL="sqlite:///expense_tracker.db"
   ```

5. **Run the application**
   ```bash
   python app.py
   ```

6. **Access the application**
   Open your browser and navigate to `http://localhost:5000`

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SECRET_KEY` | Flask secret key for sessions | Auto-generated |
| `DATABASE_URL` | Database connection string | SQLite |

### MySQL Setup (Optional)

If you want to use MySQL instead of SQLite:

1. Create a MySQL database
2. Run the `database.sql` script to create tables
3. Update `DATABASE_URL` environment variable:
   ```
   DATABASE_URL=mysql://user:password@localhost/expense_tracker
   ```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Verify session

### User
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update profile
- `PUT /api/user/salary` - Update monthly salary
- `POST /api/user/change-password` - Change password

### Cards
- `GET /api/cards` - List all cards
- `POST /api/cards` - Add new card
- `PUT /api/cards/<id>` - Update card
- `DELETE /api/cards/<id>` - Delete card

### Expenses
- `GET /api/expenses` - List expenses
- `POST /api/expenses` - Add expense
- `PUT /api/expenses/<id>` - Update expense
- `DELETE /api/expenses/<id>` - Delete expense
- `GET /api/expenses/monthly` - Monthly summary

### Analytics
- `GET /api/analytics/monthly` - Monthly spending data
- `GET /api/analytics/category` - Category breakdown
- `GET /api/analytics/trends` - Spending trends
- `GET /api/dashboard/summary` - Dashboard summary

### Notifications
- `GET /api/notifications` - List notifications
- `PUT /api/notifications/<id>/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read

## Security Features

- Password hashing using Werkzeug
- Session-based authentication
- CSRF protection ready
- Input validation on frontend and backend
- SQL injection prevention via SQLAlchemy ORM
- XSS protection

## Screenshots

### Landing Page
Clean, modern landing page with login/signup options

### Dashboard
Overview of expenses with charts and recent transactions

### Add Expense
Easy-to-use form with category selection

### Reports
Detailed analytics with filtering options

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues or have questions, please open an issue on GitHub.