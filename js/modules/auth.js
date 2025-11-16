/**
 * Authentication Module with SHA-256 Password Hashing
 * Handles admin login, session management, and route protection
 */
export default class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        
        // Store the SHA-256 hash of the password (admin123 in this example)
        // You should change this to your own password's hash
        this.VALID_CREDENTIALS = {
            username: 'admin',
            // This is the SHA-256 hash of 'admin123'
            // Change this to your desired password's hash
            passwordHash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'
        };
        
        this.SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        this.init();
    }

    init() {
        // Check for existing session on initialization
        this.checkExistingSession();
    }

    /**
     * Check if user has an existing valid session
     */
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

    /**
     * Generate SHA-256 hash of a string
     * @param {string} message - The string to hash
     * @returns {Promise<string>} - The SHA-256 hash
     */
    async sha256(message) {
        // Encode the message as UTF-8
        const msgBuffer = new TextEncoder().encode(message);
        
        // Hash the message
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        
        // Convert ArrayBuffer to Array
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        
        // Convert bytes to hex string
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    /**
     * Authenticate user with username and password
     * @param {string} username 
     * @param {string} password 
     * @returns {Promise<{success: boolean, message: string}>}
     */
    async login(username, password) {
        try {
            // Basic validation
            if (!username || !password) {
                return { success: false, message: 'Please enter both username and password' };
            }

            // Hash the provided password
            const passwordHash = await this.sha256(password);

            // Validate credentials
            if (username === this.VALID_CREDENTIALS.username && 
                passwordHash === this.VALID_CREDENTIALS.passwordHash) {
                
                // Create session
                this.currentUser = { username, loginTime: new Date().toISOString() };
                this.isAuthenticated = true;
                
                // Store session in localStorage
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

    /**
     * Logout the current user
     */
    logout() {
        this.clearSession();
        this.currentUser = null;
        this.isAuthenticated = false;
    }

    /**
     * Clear session data from localStorage
     */
    clearSession() {
        localStorage.removeItem('admin_session');
        localStorage.removeItem('admin_session_expiry');
    }

    /**
     * Check if user is authenticated
     * @returns {boolean}
     */
    isLoggedIn() {
        return this.isAuthenticated && this.checkExistingSession();
    }

    /**
     * Get current user info
     * @returns {object|null}
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Get session expiry time
     * @returns {number|null}
     */
    getSessionExpiry() {
        const expiry = localStorage.getItem('admin_session_expiry');
        return expiry ? parseInt(expiry) : null;
    }

    /**
     * Check if session will expire soon (within 5 minutes)
     * @returns {boolean}
     */
    isSessionExpiringSoon() {
        const expiry = this.getSessionExpiry();
        if (!expiry) return false;
        
        const now = new Date().getTime();
        const fiveMinutes = 5 * 60 * 1000;
        return (expiry - now) < fiveMinutes;
    }
}