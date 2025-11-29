// ==================== Login ====================

const loginForm = document.getElementById('login-form');

if (loginForm) {
    loginForm. addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const email = document.getElementById('email'). value. trim();
        const password = document.getElementById('password').value;
        
        // Validation
        if (!email || !password) {
            showAlert('Please fill in all fields', 'danger');
            shakeElement(submitBtn);
            return;
        }
        
        if (!validateEmail(email)) {
            showAlert('Please enter a valid email address', 'danger');
            shakeElement(document.getElementById('email'));
            return;
        }
        
        showLoading(submitBtn);
        
        try {
            const response = await apiRequest('/api/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });
            
            showAlert('Login successful!  Redirecting... ', 'success');
            
            // Add success animation
            loginForm.classList.add('animate-pulse');
            
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1000);
        } catch (error) {
            showAlert(error.message || 'Invalid credentials', 'danger');
            shakeElement(loginForm);
        } finally {
            hideLoading(submitBtn);
        }
    });
}

// ==================== Signup ====================

const signupForm = document. getElementById('signup-form');

if (signupForm) {
    signupForm. addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = signupForm.querySelector('button[type="submit"]');
        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        // Validation
        if (!username || !email || !password || ! confirmPassword) {
            showAlert('Please fill in all fields', 'danger');
            shakeElement(submitBtn);
            return;
        }
        
        if (username.length < 3) {
            showAlert('Username must be at least 3 characters long', 'danger');
            shakeElement(document.getElementById('username'));
            return;
        }
        
        if (! validateEmail(email)) {
            showAlert('Please enter a valid email address', 'danger');
            shakeElement(document. getElementById('email'));
            return;
        }
        
        if (password.length < 6) {
            showAlert('Password must be at least 6 characters long', 'danger');
            shakeElement(document. getElementById('password'));
            return;
        }
        
        if (password !== confirmPassword) {
            showAlert('Passwords do not match', 'danger');
            shakeElement(document.getElementById('confirm-password'));
            return;
        }
        
        showLoading(submitBtn);
        
        try {
            const response = await apiRequest('/api/register', {
                method: 'POST',
                body: JSON.stringify({ username, email, password })
            });
            
            showAlert('Registration successful! Redirecting...', 'success');
            
            // Add success animation
            signupForm. classList.add('animate-pulse');
            
            setTimeout(() => {
                window. location.href = '/dashboard';
            }, 1000);
        } catch (error) {
            showAlert(error.message || 'Registration failed', 'danger');
            shakeElement(signupForm);
        } finally {
            hideLoading(submitBtn);
        }
    });
}

// ==================== Helper Functions ====================

// Shake element animation
function shakeElement(element) {
    if (element) {
        element.classList.add('animate-shake');
        setTimeout(() => {
            element.classList.remove('animate-shake');
        }, 500);
    }
}

// ==================== Password Toggle ====================

document.querySelectorAll('.password-toggle').forEach(toggle => {
    toggle.addEventListener('click', () => {
        const input = toggle.previousElementSibling;
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);
        toggle.textContent = type === 'password' ? '👁️' : '🙈';
        
        // Add animation
        toggle.classList.add('animate-pulse');
        setTimeout(() => toggle.classList.remove('animate-pulse'), 300);
    });
});

// ==================== Input Focus Effects ====================

document. querySelectorAll('.form-control').forEach(input => {
    input.addEventListener('focus', function() {
        this.parentElement.classList.add('focused');
    });
    
    input. addEventListener('blur', function() {
        this.parentElement.classList.remove('focused');
    });
});