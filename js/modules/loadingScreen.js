/**
 * Loading Screen Module
 * Self-contained module for displaying loading states and offline messaging
 * Uses existing modal styles from modals.css
 * Proper ES6 module export
 */

export class LoadingScreen {
    constructor() {
        this.loadingModal = null;
        this.loadingMessage = null;
        this.retryButton = null;
        this.isShowing = false;
        this.init();
    }

    init() {
        // Create loading modal element using existing modal structure
        this.loadingModal = document.createElement('div');
        this.loadingModal.className = 'modal';
        this.loadingModal.id = 'loading-modal';
        this.loadingModal.innerHTML = `
            <div class="modal-content small">
                <div class="modal-body" style="text-align: center; padding: var(--space-xl);">
                    <div class="modal-icon" style="margin: 0 auto var(--space-lg);">
                        <span class="material-icons" data-icon="cloud_sync">cloud_sync</span>
                    </div>
                    <div class="loading-message" style="margin-bottom: var(--space-lg); font-size: var(--font-size-body1); color: var(--text-secondary);">
                        Connecting to server...
                    </div>
                    <div class="modal-footer" style="justify-content: center; border-top: none; padding-top: 0;">
                        <button class="btn btn-primary retry-button" style="display: none;">
                            Retry Connection
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Get references to elements
        this.loadingMessage = this.loadingModal.querySelector('.loading-message');
        this.retryButton = this.loadingModal.querySelector('.retry-button');
        this.modalIcon = this.loadingModal.querySelector('.modal-icon');
        this.iconElement = this.loadingModal.querySelector('.material-icons');

        // Add event listeners
        this.retryButton.addEventListener('click', () => {
            this.hide();
            if (this.onRetry) {
                this.onRetry();
            }
        });

        // Add to document
        document.body.appendChild(this.loadingModal);
    }

    show(message = 'Connecting to server...') {
        this.isShowing = true;
        this.loadingMessage.textContent = message;
        this.loadingModal.style.display = 'flex';
        this.retryButton.style.display = 'none';
        
        // Set normal state
        this.modalIcon.style.background = 'var(--primary-50)';
        this.modalIcon.style.color = 'var(--primary-color)';
        this.iconElement.textContent = 'cloud_sync';
        this.iconElement.setAttribute('data-icon', 'cloud_sync');
    }

    hide() {
        this.isShowing = false;
        this.loadingModal.style.display = 'none';
    }

    showOffline(message = 'You are currently offline. Please check your internet connection.') {
        this.isShowing = true;
        this.loadingMessage.textContent = message;
        this.loadingModal.style.display = 'flex';
        this.retryButton.style.display = 'block';
        
        // Set offline state
        this.modalIcon.style.background = 'var(--warning-500)';
        this.modalIcon.style.color = 'var(--text-primary)';
        this.iconElement.textContent = 'wifi_off';
        this.iconElement.setAttribute('data-icon', 'wifi_off');
    }

    showError(message = 'Connection failed. Please try again.') {
        this.isShowing = true;
        this.loadingMessage.textContent = message;
        this.loadingModal.style.display = 'flex';
        this.retryButton.style.display = 'block';
        
        // Set error state
        this.modalIcon.style.background = 'var(--error-500)';
        this.modalIcon.style.color = 'var(--text-on-primary)';
        this.iconElement.textContent = 'error_outline';
        this.iconElement.setAttribute('data-icon', 'error_outline');
    }

    showSuccess(message = 'Connection successful!') {
        this.isShowing = true;
        this.loadingMessage.textContent = message;
        this.loadingModal.style.display = 'flex';
        this.retryButton.style.display = 'none';
        
        // Set success state
        this.modalIcon.style.background = 'var(--success-500)';
        this.modalIcon.style.color = 'var(--text-on-primary)';
        this.iconElement.textContent = 'check_circle';
        this.iconElement.setAttribute('data-icon', 'check_circle');
        
        // Auto-hide after success
        setTimeout(() => {
            this.hide();
        }, 1500);
    }

    setMessage(message) {
        this.loadingMessage.textContent = message;
    }

    setOnRetry(callback) {
        this.onRetry = callback;
    }

    destroy() {
        if (this.loadingModal && this.loadingModal.parentNode) {
            this.loadingModal.parentNode.removeChild(this.loadingModal);
        }
    }

    // Utility method to check if loading screen is visible
    isVisible() {
        return this.isShowing;
    }
}