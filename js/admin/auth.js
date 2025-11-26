/**
 * Admin Authentication Manager
 * Handles login, logout, session management, and authentication state
 */

export default class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        
        // Store the SHA-256 hash of the password (admin123 in this example)
        this.VALID_CREDENTIALS = {
            username: 'admin',
            // SHA-256 hash of 'admin123'
            passwordHash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'
        };
        
        this.SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
        this.init();
    }

    init() {
        this.checkExistingSession();
    }

    checkExistingSession() {
        const userSession = localStorage.getItem('admin_session');
        const sessionExpiry = localStorage.getItem('admin_session_expiry');
        
        if (userSession && sessionExpiry) {
            const now = new Date().getTime();
            if (now < parseInt(sessionExpiry)) {
                // Valid session exists
                this.currentUser = JSON.parse(userSession);
                this.isAuthenticated = true;
                return true;
            } else {
                // Session expired
                this.clearSession();
            }
        }
        return false;
    }

    async sha256(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async login(username, password) {
        try {
            if (!username || !password) {
                return { success: false, message: 'Please enter both username and password' };
            }

            const passwordHash = await this.sha256(password);

            if (username === this.VALID_CREDENTIALS.username && 
                passwordHash === this.VALID_CREDENTIALS.passwordHash) {
                
                this.currentUser = { username, loginTime: new Date().toISOString() };
                this.isAuthenticated = true;
                
                const expiryTime = new Date().getTime() + this.SESSION_DURATION;
                localStorage.setItem('admin_session', JSON.stringify(this.currentUser));
                localStorage.setItem('admin_session_expiry', expiryTime.toString());
                
                return { 
                    success: true, 
                    message: 'Login successful!',
                    user: this.currentUser
                };
            } else {
                return { 
                    success: false, 
                    message: 'Invalid username or password' 
                };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { 
                success: false, 
                message: 'Authentication failed. Please try again.' 
            };
        }
    }

    logout() {
        this.clearSession();
        this.currentUser = null;
        this.isAuthenticated = false;
    }

    clearSession() {
        localStorage.removeItem('admin_session');
        localStorage.removeItem('admin_session_expiry');
    }

    isLoggedIn() {
        return this.isAuthenticated && this.checkExistingSession();
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getSessionExpiry() {
        const expiry = localStorage.getItem('admin_session_expiry');
        return expiry ? parseInt(expiry) : null;
    }

    isSessionExpiringSoon() {
        const expiry = this.getSessionExpiry();
        if (!expiry) return false;
        
        const now = new Date().getTime();
        const fiveMinutes = 5 * 60 * 1000;
        return (expiry - now) < fiveMinutes;
    }
}