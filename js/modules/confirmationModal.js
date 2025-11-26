// js/modules/confirmationModal.js - Fixed version
export class ConfirmationModal {
    constructor() {
        this.modal = null;
        this.resolvePromise = null;
        this.init();
    }

    init() {
        // Create modal element if it doesn't exist
        if (!document.getElementById('material-confirmation-modal')) {
            this.createModal();
        }
        this.modal = document.getElementById('material-confirmation-modal');
    }

    createModal() {
        const modalHTML = `
            <div id="material-confirmation-modal" class="material-confirmation-modal" style="display: none;">
                <div class="modal-backdrop"></div>
                <div class="material-confirmation-dialog">
                    <div class="confirmation-header">
                        <i class="material-icons confirmation-icon">help_outline</i>
                        <h3 class="confirmation-title">Confirm Action</h3>
                    </div>
                    <div class="confirmation-body">
                        <p class="confirmation-message">Are you sure you want to proceed?</p>
                    </div>
                    <div class="confirmation-actions">
                        <button type="button" class="btn btn-secondary" id="confirmation-cancel">
                            Cancel
                        </button>
                        <button type="button" class="btn btn-primary" id="confirmation-confirm">
                            Confirm
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    bindEvents() {
        console.log('🔗 Binding confirmation modal events');
        
        const cancelBtn = document.getElementById('confirmation-cancel');
        const confirmBtn = document.getElementById('confirmation-confirm');
        const backdrop = this.modal?.querySelector('.modal-backdrop');

        // Remove any existing event listeners first
        if (cancelBtn) cancelBtn.replaceWith(cancelBtn.cloneNode(true));
        if (confirmBtn) confirmBtn.replaceWith(confirmBtn.cloneNode(true));

        // Get fresh references after clone
        const freshCancelBtn = document.getElementById('confirmation-cancel');
        const freshConfirmBtn = document.getElementById('confirmation-confirm');

        freshCancelBtn?.addEventListener('click', () => this.handleCancel());
        freshConfirmBtn?.addEventListener('click', () => this.handleConfirm());
        backdrop?.addEventListener('click', () => this.handleCancel());

        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display !== 'none') {
                this.handleCancel();
            }
        });
    }

    show(options = {}) {
        console.log('🎯 ConfirmationModal.show called');
        return new Promise((resolve) => {
            this.resolvePromise = resolve;

            const {
                title = 'Confirm Action',
                message = 'Are you sure you want to proceed?',
                confirmText = 'Confirm',
                cancelText = 'Cancel',
                icon = 'help_outline',
                type = 'default'
            } = options;

            console.log('📝 Updating modal content');
            this.updateContent({ title, message, confirmText, cancelText, icon, type });
            
            // Bind events AFTER content is updated
            this.bindEvents();
            
            console.log('👀 Showing modal');
            this.modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';

            // Focus the cancel button for accessibility
            setTimeout(() => {
                document.getElementById('confirmation-cancel')?.focus();
            }, 100);
        });
    }

    updateContent({ title, message, confirmText, cancelText, icon, type }) {
        const iconEl = this.modal.querySelector('.confirmation-icon');
        const titleEl = this.modal.querySelector('.confirmation-title');
        const messageEl = this.modal.querySelector('.confirmation-message');
        const cancelBtn = document.getElementById('confirmation-cancel');
        const confirmBtn = document.getElementById('confirmation-confirm');
        const dialog = this.modal.querySelector('.material-confirmation-dialog');

        // Update content
        if (iconEl) iconEl.textContent = icon;
        if (titleEl) titleEl.textContent = title;
        if (messageEl) messageEl.textContent = message;
        if (cancelBtn) cancelBtn.textContent = cancelText;
        if (confirmBtn) confirmBtn.textContent = confirmText;

        // Update styling based on type
        if (dialog) {
            dialog.className = `material-confirmation-dialog confirmation-type-${type}`;
        }
        
        // Set button styles based on type
        if (confirmBtn) {
            confirmBtn.className = 'btn';
            
            switch (type) {
                case 'warning':
                    confirmBtn.classList.add('btn-warning');
                    break;
                case 'danger':
                    confirmBtn.classList.add('btn-danger');
                    break;
                case 'success':
                    confirmBtn.classList.add('btn-success');
                    break;
                default:
                    confirmBtn.classList.add('btn-primary');
            }
        }
        
        // Ensure cancel button uses secondary style
        if (cancelBtn) {
            cancelBtn.className = 'btn btn-secondary';
        }
    }

    handleConfirm() {
        console.log('✅ ConfirmationModal: User confirmed');
        
        // Store references BEFORE hiding
        const resolve = this.resolvePromise;
        
        this.hide();
        
        if (resolve) {
            resolve(true);
            console.log('🎯 Promise resolved with: true');
        } else {
            console.log('❌ No resolvePromise found');
        }
    }

    handleCancel() {
        console.log('❌ ConfirmationModal: User cancelled');
        
        // Store references BEFORE hiding
        const resolve = this.resolvePromise;
        
        this.hide();
        
        if (resolve) {
            resolve(false); // FIXED: Resolve with false instead of rejecting
            console.log('🎯 Promise resolved with: false');
        } else {
            console.log('❌ No resolvePromise found');
        }
    }

    hide() {
        console.log('👋 Hiding confirmation modal');
        this.modal.style.display = 'none';
        document.body.style.overflow = '';
        
        // Clear the promise reference
        this.resolvePromise = null;
        console.log('📋 Promise reference cleared');
    }
}

// Create global instance
export const confirmationModal = new ConfirmationModal();