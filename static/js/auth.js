// ==================== Login ====================

const loginForm = document.getElementById('login-form');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e. preventDefault();
        
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        // Validation
        if (!email || !password) {
            showAlert('Please fill in all fields', 'danger');
            return;
        }
        
        if (!validateEmail(email)) {
            showAlert('Please enter a valid email address', 'danger');
            return;
        }
        
        showLoading(submitBtn);
        
        try {
            const response = await apiRequest('/api/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });
            
            showAlert('Login successful!  Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1000);
        } catch (error) {
            showAlert(error.message, 'danger');
        } finally {
            hideLoading(submitBtn);
        }
    });
}

// ==================== Signup ====================

const signupForm = document.getElementById('signup-form');

if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = signupForm.querySelector('button[type="submit"]');
        const username = document.getElementById('username').value;
        const email = document. getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        // Validation
        if (! username || !email || !password || !confirmPassword) {
            showAlert('Please fill in all fields', 'danger');
            return;
        }
        
        if (!validateEmail(email)) {
            showAlert('Please enter a valid email address', 'danger');
            return;
        }
        
        if (password. length < 6) {
            showAlert('Password must be at least 6 characters long', 'danger');
            return;
        }
        
        if (password !== confirmPassword) {
            showAlert('Passwords do not match', 'danger');
            return;
        }
        
        showLoading(submitBtn);
        
        try {
            const response = await apiRequest('/api/register', {
                method: 'POST',
                body: JSON. stringify({ username, email, password })
            });
            
            showAlert('Registration successful! Redirecting...', 'success');
            setTimeout(() => {
                window. location.href = '/dashboard';
            }, 1000);
        } catch (error) {
            showAlert(error.message, 'danger');
        } finally {
            hideLoading(submitBtn);
        }
    });
}

// ==================== Password Toggle ====================

document.querySelectorAll('.password-toggle').forEach(toggle => {
    toggle.addEventListener('click', () => {
        const input = toggle.previousElementSibling;
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);
        toggle.textContent = type === 'password' ? '👁️' : '🙈';
    });
});