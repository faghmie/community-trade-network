// UI Utilities module - handles notifications and UI helpers
const utils = {
    /**
     * Show Material Design notification
     * @param {string|object} options - Message string or options object
     * @param {string} type - Notification type (success, error, warning, info)
     */
    showNotification(options, type = 'success') {
        // Handle both string and object parameters
        const config = typeof options === 'string' ? { message: options } : options;
        const {
            message,
            title = this.getDefaultTitle(type),
            duration = 5000,
            actionText,
            onAction
        } = config;

        // Create notification element with proper Material Design classes
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        // Build notification content
        notification.innerHTML = `
            <div class="notification-content">
                ${title ? `<div class="notification-title">${title}</div>` : ''}
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close" aria-label="Close notification">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M12.72 3.28a.75.75 0 10-1.06-1.06L8 6.94 4.34 3.28a.75.75 0 00-1.06 1.06L6.94 8l-3.66 3.66a.75.75 0 101.06 1.06L8 9.06l3.66 3.66a.75.75 0 101.06-1.06L9.06 8l3.66-3.66z"/>
                </svg>
            </button>
            ${actionText ? `
                <button class="notification-action btn btn-text">
                    ${actionText}
                </button>
            ` : ''}
        `;

        // Add to document
        document.body.appendChild(notification);

        // Force reflow for animation
        notification.offsetHeight;

        // Set up auto-dismiss
        let dismissTimeout;
        if (duration > 0) {
            dismissTimeout = setTimeout(() => {
                this.dismissNotification(notification);
            }, duration);
        }

        // Set up close button
        const closeBtn = notification.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (dismissTimeout) clearTimeout(dismissTimeout);
                this.dismissNotification(notification);
            });
        }

        // Set up action button
        if (actionText && onAction) {
            const actionBtn = notification.querySelector('.notification-action');
            if (actionBtn) {
                actionBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    onAction();
                    if (dismissTimeout) clearTimeout(dismissTimeout);
                    this.dismissNotification(notification);
                });
            }
        }

        // Return notification element for external control
        return notification;
    },

    /**
     * Dismiss notification with animation
     * @param {HTMLElement} notification - Notification element to dismiss
     */
    dismissNotification(notification) {
        if (!notification) return;
        
        notification.classList.add('hiding');
        
        // Remove after animation completes
        setTimeout(() => {
            if (notification && notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    },

    /**
     * Get default title for notification type
     * @param {string} type - Notification type
     * @returns {string} Default title
     */
    getDefaultTitle(type) {
        const titles = {
            success: 'Success',
            error: 'Error',
            warning: 'Warning',
            info: 'Information'
        };
        return titles[type] || 'Notification';
    },

    /**
     * Quick success notification
     * @param {string} message - Success message
     */
    showSuccess(message) {
        return this.showNotification({
            message,
            type: 'success',
            title: 'Success'
        });
    },

    /**
     * Quick error notification
     * @param {string} message - Error message
     */
    showError(message) {
        return this.showNotification({
            message,
            type: 'error',
            title: 'Error',
            duration: 7000 // Longer duration for errors
        });
    },

    /**
     * Quick warning notification
     * @param {string} message - Warning message
     */
    showWarning(message) {
        return this.showNotification({
            message,
            type: 'warning',
            title: 'Warning'
        });
    },

    /**
     * Quick info notification
     * @param {string} message - Info message
     */
    showInfo(message) {
        return this.showNotification({
            message,
            type: 'info',
            title: 'Information'
        });
    },

    // Debounce function for search and input handlers
    debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    },

    // Throttle function for scroll and resize events
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
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
        if (!phone) return false;
        
        // South African phone number regex - accepts all valid formats including landlines
        const saPhoneRegex = /^(\+27|0)[1-9][0-9]{8}$/;
        
        // Remove spaces, dashes, and parentheses for validation
        const cleanPhone = phone.replace(/[\s\-()]/g, '');
        
        return saPhoneRegex.test(cleanPhone);
    },

    // Format South African phone number for display
    formatSouthAfricanPhone(phone) {
        if (!phone) return '';
        
        const cleanPhone = phone.replace(/[\s\-()]/g, '');
        
        // Convert to international format if it starts with 0
        let formatted = cleanPhone;
        if (cleanPhone.startsWith('0')) {
            formatted = '+27' + cleanPhone.substring(1);
        }
        
        // Format: +27 XX XXX XXXX
        if (formatted.startsWith('+27') && formatted.length === 11) {
            return formatted.replace(/(\+27)(\d{2})(\d{3})(\d{4})/, '$1 $2 $3 $4');
        }
        
        return formatted;
    },

    // Email validation
    isValidEmail(email) {
        if (!email) return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // Generate unique ID
    generateId() {
        return 'id_' + Math.random().toString(36).substr(2, 9);
    },

    // Format currency for South Africa
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-ZA', {
            style: 'currency',
            currency: 'ZAR'
        }).format(amount);
    },

    // Format date
    formatDate(date, options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };
        
        return new Intl.DateTimeFormat('en-ZA', { ...defaultOptions, ...options }).format(new Date(date));
    },

    // Sanitize HTML to prevent XSS
    sanitizeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },

    // Copy to clipboard
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showSuccess('Copied to clipboard!');
            return true;
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
            this.showError('Failed to copy to clipboard');
            return false;
        }
    },

    // Check if element is in viewport
    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    },

    // Smooth scroll to element
    smoothScrollTo(element, offset = 0) {
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    },

    // Toggle element visibility
    toggleElement(element, show) {
        if (show === undefined) {
            show = element.style.display === 'none';
        }
        element.style.display = show ? '' : 'none';
    },

    // Get query parameters from URL
    getQueryParams() {
        const params = {};
        const queryString = window.location.search.substring(1);
        const pairs = queryString.split('&');
        
        pairs.forEach(pair => {
            const [key, value] = pair.split('=');
            if (key) {
                params[decodeURIComponent(key)] = decodeURIComponent(value || '');
            }
        });
        
        return params;
    },

    // Set query parameters in URL
    setQueryParams(params, replace = false) {
        const url = new URL(window.location);
        
        if (replace) {
            // Replace all existing params
            const newParams = new URLSearchParams();
            Object.keys(params).forEach(key => {
                newParams.set(key, params[key]);
            });
            url.search = newParams.toString();
        } else {
            // Merge with existing params
            Object.keys(params).forEach(key => {
                url.searchParams.set(key, params[key]);
            });
        }
        
        window.history.pushState({}, '', url.toString());
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = utils;
}