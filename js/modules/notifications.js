// js/modules/notifications.js
// ES6 Module for notification system

/**
 * Show Material Design notification
 * @param {string|object} options - Message string or options object
 * @param {string} type - Notification type (success, error, warning, info)
 */
export function showNotification(options, type = 'success') {
    // Handle both string and object parameters
    const config = typeof options === 'string' ? { message: options } : options;
    const {
        message,
        title = getDefaultTitle(type),
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
            dismissNotification(notification);
        }, duration);
    }

    // Set up close button
    const closeBtn = notification.querySelector('.notification-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            if (dismissTimeout) clearTimeout(dismissTimeout);
            dismissNotification(notification);
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
                dismissNotification(notification);
            });
        }
    }

    // Return notification element for external control
    return notification;
}

/**
 * Dismiss notification with animation
 * @param {HTMLElement} notification - Notification element to dismiss
 */
export function dismissNotification(notification) {
    if (!notification) return;

    notification.classList.add('hiding');

    // Remove after animation completes
    setTimeout(() => {
        if (notification && notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

/**
 * Get default title for notification type
 * @param {string} type - Notification type
 * @returns {string} Default title
 */
function getDefaultTitle(type) {
    const titles = {
        success: 'Success',
        error: 'Error',
        warning: 'Warning',
        info: 'Information'
    };
    return titles[type] || 'Notification';
}

/**
 * Quick success notification
 * @param {string} message - Success message
 */
export function showSuccess(message) {
    return showNotification({
        message,
        type: 'success',
        title: 'Success'
    });
}

/**
 * Quick error notification
 * @param {string} message - Error message
 */
export function showError(message) {
    return showNotification({
        message,
        type: 'error',
        title: 'Error',
        duration: 7000 // Longer duration for errors
    });
}

/**
 * Quick warning notification
 * @param {string} message - Warning message
 */
export function showWarning(message) {
    return showNotification({
        message,
        type: 'warning',
        title: 'Warning'
    });
}

/**
 * Quick info notification
 * @param {string} message - Info message
 */
export function showInfo(message) {
    return showNotification({
        message,
        type: 'info',
        title: 'Information'
    });
}