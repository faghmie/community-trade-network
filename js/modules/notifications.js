// js/modules/notifications.js
// ES6 Module for notification system with sync status support

// Notification state management
const notificationState = {
    activeNotifications: new Set(),
    syncNotifications: new Map(),
    queue: []
};

/**
 * Show Material Design notification
 * @param {string|object} options - Message string or options object
 * @param {string} type - Notification type (success, error, warning, info, sync)
 */
export function showNotification(options, type = 'success') {
    // Handle both string and object parameters
    const config = typeof options === 'string' ? { message: options } : options;
    const {
        message,
        title = getDefaultTitle(type),
        duration = getDefaultDuration(type),
        actionText,
        onAction,
        persistent = false,
        syncId = null,
        progress = null,
        showProgress = false
    } = config;

    // Create notification element with proper Material Design classes
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    if (showProgress) {
        notification.classList.add('notification-with-progress');
    }

    // Build notification content
    notification.innerHTML = `
        <div class="notification-content">
            ${title ? `<div class="notification-title">${title}</div>` : ''}
            <div class="notification-message">${message}</div>
            ${showProgress ? `
                <div class="notification-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress || 0}%"></div>
                    </div>
                    ${progress !== null ? `<div class="progress-text">${progress}%</div>` : ''}
                </div>
            ` : ''}
        </div>
        ${!persistent ? `
            <button class="notification-close" aria-label="Close notification">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M12.72 3.28a.75.75 0 10-1.06-1.06L8 6.94 4.34 3.28a.75.75 0 00-1.06 1.06L6.94 8l-3.66 3.66a.75.75 0 101.06 1.06L8 9.06l3.66 3.66a.75.75 0 101.06-1.06L9.06 8l3.66-3.66z"/>
                </svg>
            </button>
        ` : ''}
        ${actionText ? `
            <button class="notification-action btn btn-text">
                ${actionText}
            </button>
        ` : ''}
    `;

    // Add to document
    const container = getNotificationContainer();
    container.appendChild(notification);

    // Force reflow for animation
    notification.offsetHeight;
    notification.classList.add('showing');

    // Store notification reference
    notificationState.activeNotifications.add(notification);

    // Set up sync notification tracking
    if (syncId) {
        notificationState.syncNotifications.set(syncId, notification);
    }

    // Set up auto-dismiss for non-persistent notifications
    let dismissTimeout;
    if (duration > 0 && !persistent) {
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
    return {
        element: notification,
        update: (newOptions) => updateNotification(notification, newOptions),
        dismiss: () => {
            if (dismissTimeout) clearTimeout(dismissTimeout);
            dismissNotification(notification);
        }
    };
}

/**
 * Update an existing notification
 * @param {HTMLElement} notification - Notification element to update
 * @param {object} newOptions - New options for the notification
 */
function updateNotification(notification, newOptions) {
    if (!notification || !notification.parentNode) return;

    const { message, title, progress, showProgress } = newOptions;
    
    // Update message
    if (message) {
        const messageEl = notification.querySelector('.notification-message');
        if (messageEl) messageEl.textContent = message;
    }
    
    // Update title
    if (title) {
        const titleEl = notification.querySelector('.notification-title');
        if (titleEl) {
            titleEl.textContent = title;
        } else {
            // Create title if it doesn't exist
            const contentEl = notification.querySelector('.notification-content');
            const messageEl = notification.querySelector('.notification-message');
            const titleEl = document.createElement('div');
            titleEl.className = 'notification-title';
            titleEl.textContent = title;
            contentEl.insertBefore(titleEl, messageEl);
        }
    }
    
    // Update progress
    if (progress !== undefined || showProgress !== undefined) {
        let progressContainer = notification.querySelector('.notification-progress');
        
        if (showProgress && !progressContainer) {
            // Add progress bar
            progressContainer = document.createElement('div');
            progressContainer.className = 'notification-progress';
            progressContainer.innerHTML = `
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress || 0}%"></div>
                </div>
                ${progress !== null ? `<div class="progress-text">${progress}%</div>` : ''}
            `;
            notification.querySelector('.notification-content').appendChild(progressContainer);
            notification.classList.add('notification-with-progress');
        } else if (progressContainer) {
            // Update existing progress
            const progressFill = progressContainer.querySelector('.progress-fill');
            const progressText = progressContainer.querySelector('.progress-text');
            
            if (progressFill && progress !== undefined) {
                progressFill.style.width = `${progress}%`;
            }
            
            if (progressText && progress !== undefined) {
                progressText.textContent = `${progress}%`;
            }
            
            if (!showProgress && progressContainer) {
                progressContainer.remove();
                notification.classList.remove('notification-with-progress');
            }
        }
    }
}

/**
 * Dismiss notification with animation
 * @param {HTMLElement} notification - Notification element to dismiss
 */
export function dismissNotification(notification) {
    if (!notification) return;

    notification.classList.remove('showing');
    notification.classList.add('hiding');

    // Remove after animation completes
    setTimeout(() => {
        if (notification && notification.parentNode) {
            notification.parentNode.removeChild(notification);
            notificationState.activeNotifications.delete(notification);
            
            // Remove from sync notifications if present
            for (const [syncId, notif] of notificationState.syncNotifications.entries()) {
                if (notif === notification) {
                    notificationState.syncNotifications.delete(syncId);
                    break;
                }
            }
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
        info: 'Information',
        sync: 'Synchronization'
    };
    return titles[type] || 'Notification';
}

/**
 * Get default duration for notification type
 * @param {string} type - Notification type
 * @returns {number} Duration in milliseconds
 */
function getDefaultDuration(type) {
    const durations = {
        success: 5000,
        error: 7000,
        warning: 6000,
        info: 5000,
        sync: 0 // Persistent by default for sync notifications
    };
    return durations[type] || 5000;
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
        duration: 7000
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

/**
 * Show synchronization status notification
 * @param {string} message - Sync message
 * @param {string} status - Sync status (started, progress, completed, error)
 * @param {number} progress - Progress percentage (0-100)
 * @param {string} syncId - Unique ID for this sync operation
 */
export function showSyncNotification(message, status = 'started', progress = null, syncId = null) {
    const syncNotificationId = syncId || `sync-${Date.now()}`;
    
    let title, type, persistent, showProgress;
    
    switch (status) {
        case 'started':
            title = 'Syncing Data';
            type = 'info';
            persistent = true;
            showProgress = true;
            break;
        case 'progress':
            title = 'Syncing Data';
            type = 'info';
            persistent = true;
            showProgress = true;
            break;
        case 'completed':
            title = 'Sync Complete';
            type = 'success';
            persistent = false;
            showProgress = false;
            break;
        case 'error':
            title = 'Sync Failed';
            type = 'error';
            persistent = false;
            showProgress = false;
            break;
        default:
            title = 'Synchronization';
            type = 'info';
            persistent = true;
            showProgress = true;
    }
    
    // Check if we already have a notification for this sync
    const existingNotification = notificationState.syncNotifications.get(syncNotificationId);
    
    if (existingNotification) {
        // Update existing notification
        updateNotification(existingNotification, {
            message,
            title,
            progress,
            showProgress
        });
        
        // If sync is completed or errored, auto-dismiss after delay
        if (status === 'completed' || status === 'error') {
            setTimeout(() => {
                dismissNotification(existingNotification);
            }, status === 'completed' ? 3000 : 5000);
        }
        
        return {
            element: existingNotification,
            update: (newOptions) => updateNotification(existingNotification, newOptions),
            dismiss: () => dismissNotification(existingNotification)
        };
    } else {
        // Create new notification
        return showNotification({
            message,
            title,
            type,
            persistent,
            syncId: syncNotificationId,
            progress,
            showProgress,
            duration: status === 'completed' ? 3000 : status === 'error' ? 5000 : 0
        });
    }
}

/**
 * Show offline status notification
 */
export function showOfflineNotification() {
    return showNotification({
        message: 'You are currently offline. Changes will be synced when connection is restored.',
        title: 'Offline Mode',
        type: 'warning',
        persistent: true,
        duration: 0
    });
}

/**
 * Dismiss offline notification
 */
export function dismissOfflineNotification() {
    // Find and dismiss any persistent offline notifications
    notificationState.activeNotifications.forEach(notification => {
        if (notification.classList.contains('notification-warning') && 
            notification.textContent.includes('offline')) {
            dismissNotification(notification);
        }
    });
}

/**
 * Show data sync completed notification
 * @param {object} stats - Sync statistics
 */
export function showSyncCompleteNotification(stats = {}) {
    const { contractors = 0, reviews = 0, categories = 0 } = stats;
    const message = `Sync completed: ${contractors} contractors, ${reviews} reviews, ${categories} categories updated`;
    
    return showSyncNotification(message, 'completed');
}

/**
 * Show network status change notification
 * @param {boolean} isOnline - Whether the app is online
 */
export function showNetworkStatusNotification(isOnline) {
    if (isOnline) {
        dismissOfflineNotification();
        return showNotification({
            message: 'Connection restored. Syncing data...',
            title: 'Back Online',
            type: 'success',
            duration: 3000
        });
    } else {
        return showOfflineNotification();
    }
}

/**
 * Get notification container, create if doesn't exist
 * @returns {HTMLElement} Notification container
 */
function getNotificationContainer() {
    let container = document.getElementById('notification-container');
    
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'notification-container';
        document.body.appendChild(container);
    }
    
    return container;
}

/**
 * Clear all notifications
 */
export function clearAllNotifications() {
    notificationState.activeNotifications.forEach(notification => {
        dismissNotification(notification);
    });
    notificationState.activeNotifications.clear();
    notificationState.syncNotifications.clear();
}

/**
 * Get notification statistics
 * @returns {object} Notification stats
 */
export function getNotificationStats() {
    return {
        active: notificationState.activeNotifications.size,
        sync: notificationState.syncNotifications.size,
        queued: notificationState.queue.length
    };
}