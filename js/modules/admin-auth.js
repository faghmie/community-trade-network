/**
 * Admin Authentication Module
 * Handles login, logout, session management, and authentication state
 */
import AuthManager from './auth.js';

class AdminAuthModule {
    constructor() {
        this.authManager = null;
        this.sessionInterval = null;
        this.adminModule = null;
    }

    init(adminModule) {
        this.adminModule = adminModule;
        return this.initializeAuthentication();
    }

    async initializeAuthentication() {
        try {
            // AuthManager is imported as ES6 module
            this.authManager = new AuthManager();

            // Check authentication status
            if (this.authManager.isLoggedIn()) {
                await this.adminModule.showAdminContent();
                this.startSessionMonitoring();
                return true;
            } else {
                this.showLoginForm();
                this.bindAuthEvents();
                return false;
            }
        } catch (error) {
            console.error('Error loading authentication module:', error);
            this.showLoginForm();
            this.bindAuthEvents();
            return false;
        }
    }

    showLoginForm() {
        const loginSection = document.getElementById('loginSection');
        const adminContent = document.getElementById('adminContent');
        if (loginSection) loginSection.style.display = 'flex';
        if (adminContent) adminContent.style.display = 'none';
    }

    updateUserInfo() {
        if (!this.authManager) return;
        
        const user = this.authManager.getCurrentUser();
        if (user) {
            const usernameDisplay = document.getElementById('usernameDisplay');
            const userAvatar = document.getElementById('userAvatar');
            
            if (usernameDisplay) {
                usernameDisplay.textContent = user.username;
            }
            if (userAvatar) {
                userAvatar.textContent = user.username.charAt(0).toUpperCase();
            }
            this.updateSessionInfo();
        }
    }

    updateSessionInfo() {
        if (!this.authManager) return;
        
        const expiry = this.authManager.getSessionExpiry();
        if (expiry) {
            const now = new Date().getTime();
            const timeLeft = expiry - now;
            
            if (timeLeft <= 0) {
                this.handleSessionExpired();
                return;
            }
            
            const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const secondsLeft = Math.floor((timeLeft % (1000 * 60)) / 1000);
            
            const sessionInfo = document.getElementById('sessionInfo');
            if (sessionInfo) {
                if (hoursLeft > 0) {
                    sessionInfo.textContent = `Session: ${hoursLeft}h ${minutesLeft}m ${secondsLeft}s`;
                } else if (minutesLeft > 0) {
                    sessionInfo.textContent = `Session: ${minutesLeft}m ${secondsLeft}s`;
                } else {
                    sessionInfo.textContent = `Session: ${secondsLeft}s`;
                }
            }
            
            // Show warning if session expiring soon (less than 5 minutes)
            const sessionWarning = document.getElementById('sessionWarning');
            if (sessionWarning) {
                if (timeLeft < 5 * 60 * 1000) {
                    sessionWarning.style.display = 'block';
                    if (timeLeft < 60 * 1000) {
                        sessionWarning.style.animation = 'pulse 1s infinite';
                    }
                } else {
                    sessionWarning.style.display = 'none';
                }
            }
        }
    }

    startSessionMonitoring() {
        if (!this.authManager) return;
        
        this.sessionInterval = setInterval(() => {
            this.updateSessionInfo();
        }, 1000);
    }

    stopSessionMonitoring() {
        if (this.sessionInterval) {
            clearInterval(this.sessionInterval);
            this.sessionInterval = null;
        }
    }

    handleSessionExpired() {
        this.stopSessionMonitoring();
        this.showLoginForm();
        this.showMessage('Session expired. Please login again.', 'error');
    }

    bindAuthEvents() {
        const loginForm = document.getElementById('loginForm');
        const logoutButton = document.getElementById('logoutButton');
        const passwordField = document.getElementById('password');

        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleLogin();
            });
        }

        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                this.handleLogout();
            });
        }

        if (passwordField) {
            passwordField.addEventListener('keypress', async (e) => {
                if (e.key === 'Enter') {
                    await this.handleLogin();
                }
            });
        }
    }

    async handleLogin() {
        if (!this.authManager) {
            this.showMessage('Authentication system not available', 'error');
            return;
        }

        const username = document.getElementById('username');
        const password = document.getElementById('password');
        const loginButton = document.getElementById('loginButton');
        const loginButtonText = document.getElementById('loginButtonText');
        const loginSpinner = document.getElementById('loginSpinner');

        if (!username || !password || !loginButton || !loginButtonText || !loginSpinner) {
            console.error('Login elements not found');
            return;
        }

        // Show loading state
        loginButton.disabled = true;
        loginButtonText.textContent = 'Logging in...';
        loginSpinner.style.display = 'inline-block';

        try {
            const result = await this.authManager.login(username.value, password.value);
            
            if (result.success) {
                this.showMessage('Login successful! Redirecting...', 'success');
                setTimeout(() => {
                    this.adminModule.showAdminContent();
                    this.startSessionMonitoring();
                }, 1000);
            } else {
                this.showMessage(result.message, 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showMessage('Login failed. Please try again.', 'error');
        } finally {
            // Reset loading state
            loginButton.disabled = false;
            loginButtonText.textContent = 'Login';
            loginSpinner.style.display = 'none';
        }
    }

    handleLogout() {
        if (!this.authManager) return;
        
        this.authManager.logout();
        this.stopSessionMonitoring();
        this.adminModule.modulesInitialized = false;
        this.showLoginForm();
        this.showMessage('You have been logged out.', 'info');
        
        // Clear form fields
        const username = document.getElementById('username');
        const password = document.getElementById('password');
        if (username) username.value = '';
        if (password) password.value = '';
    }

    showMessage(message, type = 'info') {
        const messageElement = document.getElementById('loginMessage');
        if (messageElement) {
            messageElement.textContent = message;
            messageElement.className = `auth-message ${type}`;
            messageElement.style.display = 'block';
            
            // Auto-hide success messages
            if (type === 'success') {
                setTimeout(() => {
                    messageElement.style.display = 'none';
                }, 3000);
            }
        }
    }

    // Public method to check if user is authenticated
    isAuthenticated() {
        return this.authManager && this.authManager.isLoggedIn();
    }

    // Public method to get current user
    getCurrentUser() {
        return this.authManager ? this.authManager.getCurrentUser() : null;
    }
}

export default AdminAuthModule;