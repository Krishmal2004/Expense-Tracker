/**
 * Auth JavaScript - Login/Signup Handling
 * Expense Tracker Application
 */

// ===========================
// LOGIN FUNCTIONALITY
// ===========================

function initLoginPage() {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const rememberCheck = document.getElementById('remember');
    const submitBtn = loginForm?.querySelector('button[type="submit"]');
    const errorDiv = document.getElementById('loginError');

    // Check for remembered email
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail && emailInput) {
        emailInput.value = rememberedEmail;
        if (rememberCheck) rememberCheck.checked = true;
    }

    // Toggle password visibility
    const passwordToggle = document.querySelector('.password-toggle');
    if (passwordToggle) {
        passwordToggle.addEventListener('click', () => {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            passwordToggle.innerHTML = type === 'password' 
                ? '<i class="fas fa-eye"></i>' 
                : '<i class="fas fa-eye-slash"></i>';
        });
    }

    // Form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Clear previous errors
            hideError(errorDiv);
            
            // Get form values
            const email = emailInput.value.trim();
            const password = passwordInput.value;
            
            // Validate
            if (!email || !password) {
                showError(errorDiv, 'Please fill in all fields');
                return;
            }
            
            if (!App.isValidEmail(email)) {
                showError(errorDiv, 'Please enter a valid email address');
                return;
            }
            
            // Show loading state
            setButtonLoading(submitBtn, true);
            
            try {
                const response = await App.apiRequest('/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ email, password })
                });
                
                // Remember email if checked
                if (rememberCheck?.checked) {
                    localStorage.setItem('rememberedEmail', email);
                } else {
                    localStorage.removeItem('rememberedEmail');
                }
                
                // Show success and redirect
                showToast('Login successful! Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 500);
                
            } catch (error) {
                showError(errorDiv, error.message || 'Invalid email or password');
                setButtonLoading(submitBtn, false);
            }
        });
    }
}

// ===========================
// SIGNUP FUNCTIONALITY
// ===========================

function initSignupPage() {
    const signupForm = document.getElementById('signupForm');
    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const termsCheck = document.getElementById('terms');
    const submitBtn = signupForm?.querySelector('button[type="submit"]');
    const errorDiv = document.getElementById('signupError');

    // Password strength indicator
    if (passwordInput) {
        passwordInput.addEventListener('input', () => {
            updatePasswordStrength(passwordInput.value);
        });
    }

    // Password match validation
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', () => {
            validatePasswordMatch(passwordInput.value, confirmPasswordInput.value);
        });
    }

    // Toggle password visibility
    document.querySelectorAll('.password-toggle').forEach(toggle => {
        toggle.addEventListener('click', function() {
            const input = this.previousElementSibling;
            const type = input.type === 'password' ? 'text' : 'password';
            input.type = type;
            this.innerHTML = type === 'password' 
                ? '<i class="fas fa-eye"></i>' 
                : '<i class="fas fa-eye-slash"></i>';
        });
    });

    // Form submission
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Clear previous errors
            hideError(errorDiv);
            
            // Get form values
            const fullName = fullNameInput.value.trim();
            const email = emailInput.value.trim();
            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;
            
            // Validate
            if (!fullName || !email || !password || !confirmPassword) {
                showError(errorDiv, 'Please fill in all fields');
                return;
            }
            
            if (!App.isValidEmail(email)) {
                showError(errorDiv, 'Please enter a valid email address');
                return;
            }
            
            if (password.length < 8) {
                showError(errorDiv, 'Password must be at least 8 characters long');
                return;
            }
            
            if (password !== confirmPassword) {
                showError(errorDiv, 'Passwords do not match');
                return;
            }
            
            if (!termsCheck?.checked) {
                showError(errorDiv, 'Please accept the Terms & Conditions');
                return;
            }
            
            // Show loading state
            setButtonLoading(submitBtn, true);
            
            try {
                const response = await App.apiRequest('/auth/signup', {
                    method: 'POST',
                    body: JSON.stringify({
                        full_name: fullName,
                        email,
                        password
                    })
                });
                
                // Show success and redirect
                showToast('Account created successfully!', 'success');
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 500);
                
            } catch (error) {
                showError(errorDiv, error.message || 'An error occurred during signup');
                setButtonLoading(submitBtn, false);
            }
        });
    }
}

// ===========================
// PASSWORD STRENGTH CHECKER
// ===========================

function updatePasswordStrength(password) {
    const strengthBar = document.querySelector('.password-strength-bar');
    const strengthText = document.querySelector('.password-strength-text');
    
    if (!strengthBar || !strengthText) return;
    
    let strength = 0;
    let label = 'Weak';
    let color = '#ef4444';
    
    // Length check
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 15;
    
    // Lowercase check
    if (/[a-z]/.test(password)) strength += 15;
    
    // Uppercase check
    if (/[A-Z]/.test(password)) strength += 15;
    
    // Number check
    if (/[0-9]/.test(password)) strength += 15;
    
    // Special character check
    if (/[^a-zA-Z0-9]/.test(password)) strength += 15;
    
    // Determine label and color
    if (strength >= 80) {
        label = 'Strong';
        color = '#10b981';
    } else if (strength >= 50) {
        label = 'Medium';
        color = '#f59e0b';
    }
    
    strengthBar.style.width = `${Math.min(strength, 100)}%`;
    strengthBar.style.backgroundColor = color;
    strengthText.textContent = label;
    strengthText.style.color = color;
}

function validatePasswordMatch(password, confirmPassword) {
    const matchIndicator = document.querySelector('.password-match');
    
    if (!matchIndicator) return;
    
    if (confirmPassword.length === 0) {
        matchIndicator.textContent = '';
        return;
    }
    
    if (password === confirmPassword) {
        matchIndicator.innerHTML = '<i class="fas fa-check text-success"></i> Passwords match';
        matchIndicator.style.color = '#10b981';
    } else {
        matchIndicator.innerHTML = '<i class="fas fa-times text-danger"></i> Passwords do not match';
        matchIndicator.style.color = '#ef4444';
    }
}

// ===========================
// HELPER FUNCTIONS
// ===========================

function showError(errorDiv, message) {
    if (!errorDiv) return;
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    errorDiv.style.display = 'flex';
}

function hideError(errorDiv) {
    if (!errorDiv) return;
    errorDiv.style.display = 'none';
}

function setButtonLoading(button, loading) {
    if (!button) return;
    
    if (loading) {
        button.disabled = true;
        button.dataset.originalText = button.innerHTML;
        button.innerHTML = '<span class="spinner"></span> Please wait...';
    } else {
        button.disabled = false;
        button.innerHTML = button.dataset.originalText || 'Submit';
    }
}

// ===========================
// INITIALIZATION
// ===========================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize based on current page
    if (document.getElementById('loginForm')) {
        initLoginPage();
    }
    
    if (document.getElementById('signupForm')) {
        initSignupPage();
    }
});
