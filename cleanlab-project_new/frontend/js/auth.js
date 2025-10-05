const API_BASE_URL = 'http://localhost:3000/api';

class AuthManager {
    constructor() {
        this.currentPhone = '';
        this.currentVerificationCode = '';
        this.init();
    }

    init() {
        this.setupTabSwitching();
        this.setupForms();
        this.checkAuthStatus();
    }

    setupTabSwitching() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const authForms = document.querySelectorAll('.auth-form');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.getAttribute('data-tab');
                
                // Update active tab
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Show target form
                authForms.forEach(form => {
                    form.classList.remove('active');
                    if (form.id === `${targetTab}Form`) {
                        form.classList.add('active');
                    }
                });

                // Reset messages when switching tabs
                this.showAuthMessage('', 'info');
            });
        });
    }

    setupForms() {
        // Registration form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Verification form
        const verifyForm = document.getElementById('verifyForm');
        if (verifyForm) {
            verifyForm.addEventListener('submit', (e) => this.handleVerify(e));
        }

        // Resend code button
        const resendBtn = document.getElementById('resendCode');
        if (resendBtn) {
            resendBtn.addEventListener('click', () => this.handleResendCode());
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        const userData = {
            phoneNumber: formData.get('phoneNumber'),
            email: formData.get('email'),
            fullName: formData.get('fullName'),
            password: formData.get('password')
        };

        try {
            this.showAuthMessage('Creating your account...', 'info');
            
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            const result = await response.json();

            if (result.success) {
                this.currentPhone = userData.phoneNumber;
                this.currentVerificationCode = result.data.verificationCode;
                
                this.showVerificationForm();
                this.showAuthMessage('Registration successful! Please enter the verification code shown below.', 'success');
            } else {
                this.showAuthMessage(result.message, 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showAuthMessage('Network error. Please try again.', 'error');
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        const loginData = {
            phoneNumber: formData.get('phoneNumber'),
            password: formData.get('password')
        };

        try {
            this.showAuthMessage('Logging in...', 'info');
            
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginData)
            });

            const result = await response.json();

            if (result.success) {
                localStorage.setItem('token', result.data.token);
                localStorage.setItem('user', JSON.stringify(result.data.user));
                this.showAuthMessage('Login successful! Redirecting...', 'success');
                
                setTimeout(() => {
                    window.location.href = 'booking.html';
                }, 2000);
            } else {
                this.showAuthMessage(result.message, 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showAuthMessage('Network error. Please try again.', 'error');
        }
    }

    async handleVerify(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        const verifyData = {
            phoneNumber: this.currentPhone,
            code: formData.get('code')
        };

        try {
            this.showAuthMessage('Verifying your code...', 'info');
            
            const response = await fetch(`${API_BASE_URL}/auth/verify-phone`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(verifyData)
            });

            const result = await response.json();

            if (result.success) {
                this.showAuthMessage('Account verified successfully! You can now login.', 'success');
                this.showLoginForm();
            } else {
                this.showAuthMessage(result.message, 'error');
            }
        } catch (error) {
            console.error('Verification error:', error);
            this.showAuthMessage('Network error. Please try again.', 'error');
        }
    }

    async handleResendCode() {
        if (!this.currentPhone) {
            this.showAuthMessage('Please register first.', 'error');
            return;
        }

        try {
            this.showAuthMessage('Generating new code...', 'info');
            
            const response = await fetch(`${API_BASE_URL}/auth/resend-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber: this.currentPhone })
            });

            const result = await response.json();

            if (result.success) {
                this.currentVerificationCode = result.data.verificationCode;
                this.showVerificationForm();
                this.showAuthMessage('New verification code generated! Please use the code shown below.', 'success');
            } else {
                this.showAuthMessage(result.message, 'error');
            }
        } catch (error) {
            console.error('Resend code error:', error);
            this.showAuthMessage('Network error. Please try again.', 'error');
        }
    }

    showVerificationForm() {
        document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
        document.getElementById('verifyForm').classList.add('active');
        
        // Show the verification code
        const codeText = document.getElementById('verificationCodeText');
        if (codeText && this.currentVerificationCode) {
            codeText.textContent = this.currentVerificationCode;
        }
    }

    showLoginForm() {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector('[data-tab="login"]').classList.add('active');
        document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
        document.getElementById('loginForm').classList.add('active');
    }

    showAuthMessage(message, type) {
        const resultDiv = document.getElementById('authResult');
        if (resultDiv) {
            resultDiv.innerHTML = message;
            resultDiv.className = `result-message ${type}`;
            resultDiv.style.display = 'block';
        }
    }

    checkAuthStatus() {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        
        if (token && user) {
            // User is logged in, update navigation
            const navMenu = document.querySelector('.nav-menu');
            if (navMenu) {
                const userData = JSON.parse(user);
                navMenu.innerHTML = `
                    <a href="index.html" class="nav-link">Home</a>
                    <a href="services.html" class="nav-link">Services</a>
                    <a href="booking.html" class="nav-link">Book Now</a>
                    <a href="#" class="nav-link" onclick="authManager.logout()">Logout (${userData.fullName})</a>
                `;
            }
        }
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }
}

// Initialize auth manager
const authManager = new AuthManager();
