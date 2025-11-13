// UI Utilities module - handles notifications and UI helpers
const utils = {
    showNotification(message, type = 'success') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: var(--space-md) var(--space-lg);
            background: ${type === 'success' ? 'var(--success-color)' : 'var(--accent-color)'};
            color: white;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow-lg);
            z-index: 1001;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    },

    // Debounce function for search
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // URL validation
    isValidUrl(string) {
        if (!string) return true; // Empty is valid (optional field)
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (_) {
            return false;
        }
    },

    // Phone validation for South Africa - FIXED VERSION
    isValidSouthAfricanPhone(phone) {
        // South African phone number regex - accepts all valid formats including landlines
        const saPhoneRegex = /^(\+27|0)[0-9]{9}$/;
        // Remove spaces, dashes, and parentheses for validation
        const cleanPhone = phone.replace(/[\s\-()]/g, '');
        return saPhoneRegex.test(cleanPhone);
    },

    // Email validation
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
};