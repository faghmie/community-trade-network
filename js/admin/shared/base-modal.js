/**
 * Base Modal Class
 * Provides common modal functionality for admin portal modals
 * Eliminates code duplication while maintaining self-contained modal architecture
 */

import { sanitizeHtml } from '../../modules/utilities.js';

export class BaseModal {
    constructor(modalId, defaultTitle = 'Modal') {
        this.modalId = modalId;
        this.defaultTitle = defaultTitle;
        this.modalElement = null;
        this.isOpen = false;
        this.onSaveCallback = null;
        this.onActionCallback = null;
        this.currentData = null;
        this.viewMode = false;
        this.initialized = false;
    }

    /**
     * Initialize the modal - must be called by child classes
     */
    async init() {
        if (this.initialized) return;
        
        this.createModalElement();
        this.bindModalEvents();
        await this.initializeModal();
        
        this.initialized = true;
    }

    /**
     * Create modal DOM structure
     */
    createModalElement() {
        if (this.modalElement) return;

        const modalHTML = this.generateModalHTML();
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modalElement = document.getElementById(this.modalId);
    }

    /**
     * Generate modal HTML structure - can be overridden by child classes
     */
    generateModalHTML() {
        const capitalizedId = this.capitalizeFirst(this.modalId);
        
        return `
            <div class="modal" id="${this.modalId}" style="display: none;">
                <div class="modal-content material-card admin-modal">
                    <div class="modal-header">
                        <h2 id="${this.modalId}Title">${this.defaultTitle}</h2>
                        <button type="button" class="close" id="close${capitalizedId}" aria-label="Close dialog">
                            <span class="material-icons">close</span>
                        </button>
                    </div>
                    <div class="modal-body" id="${this.modalId}Content">
                        ${this.generateModalBody()}
                    </div>
                    <div class="modal-footer" id="${this.modalId}Footer">
                        ${this.generateModalFooter()}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generate modal body content - must be implemented by child classes
     */
    generateModalBody() {
        throw new Error('generateModalBody must be implemented by child class');
    }

    /**
     * Generate modal footer content - can be overridden by child classes
     */
    generateModalFooter() {
        const capitalizedId = this.capitalizeFirst(this.modalId);
        return `
            <button type="button" class="btn btn-text" id="cancel${capitalizedId}">Cancel</button>
            <button type="button" class="btn btn-contained" id="save${capitalizedId}">Save</button>
        `;
    }

    /**
     * Bind common modal events
     */
    bindModalEvents() {
        if (!this.modalElement) return;

        const capitalizedId = this.capitalizeFirst(this.modalId);

        // Save button
        const saveBtn = this.modalElement.querySelector(`#save${capitalizedId}`);
        if (saveBtn) {
            saveBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleSave();
            });
        }

        // Close buttons
        const closeButtons = this.modalElement.querySelectorAll(
            `#close${capitalizedId}, #cancel${capitalizedId}`
        );
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.close();
            });
        });

        // Background click
        this.modalElement.addEventListener('click', (e) => {
            if (e.target === this.modalElement) {
                this.close();
            }
        });

        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                if (this.handleEscapeKey()) {
                    // Child class handled the escape key (e.g., hiding suggestions)
                    e.preventDefault();
                } else {
                    this.close();
                }
            }
        });

        // Form submission prevention
        const form = this.modalElement.querySelector('form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
            });
        }

        // Bind custom action events if any
        this.bindCustomEvents();
    }

    /**
     * Hook for child classes to bind custom events
     */
    bindCustomEvents() {
        // Can be overridden by child classes
    }

    /**
     * Hook for child classes to perform additional initialization
     */
    async initializeModal() {
        // Can be overridden by child classes
    }

    /**
     * Handle escape key - can be overridden by child classes
     * @returns {boolean} True if the escape key was handled and modal should not close
     */
    handleEscapeKey() {
        return false;
    }

    /**
     * Open the modal with data and options
     * @param {Object} data - Data to populate the modal with
     * @param {Object} options - Options for opening the modal
     */
    async open(data = null, options = {}) {
        if (!this.modalElement) {
            console.error('Modal element not initialized');
            return;
        }

        const {
            viewMode = false,
            onSave = null,
            onAction = null,
            ...customOptions
        } = options;

        this.onSaveCallback = onSave;
        this.onActionCallback = onAction;
        this.currentData = data;
        this.viewMode = viewMode;

        await this.beforeOpen(data, options);
        
        await this.populateModal(data, options);
        this.updateTitle(data, options);
        this.setModalState(viewMode);

        this.modalElement.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        this.isOpen = true;

        await this.afterOpen(data, options);
    }

    /**
     * Hook called before modal opens - can be overridden by child classes
     */
    async beforeOpen(data, options) {
        // Can be overridden by child classes for pre-open setup
    }

    /**
     * Populate modal with data - must be implemented by child classes
     */
    async populateModal(data, options) {
        throw new Error('populateModal must be implemented by child class');
    }

    /**
     * Hook called after modal opens - can be overridden by child classes
     */
    async afterOpen(data, options) {
        // Auto-focus first input if not in view mode and modal has form inputs
        if (!this.viewMode) {
            setTimeout(() => {
                const firstInput = this.modalElement.querySelector('input:not([type="hidden"]):not([readonly]), textarea:not([readonly]), select:not([disabled])');
                if (firstInput) firstInput.focus();
            }, 100);
        }
    }

    /**
     * Close the modal
     */
    close() {
        if (!this.modalElement) return;

        this.beforeClose();
        
        this.modalElement.style.display = 'none';
        document.body.style.overflow = '';
        this.isOpen = false;
        
        this.onSaveCallback = null;
        this.onActionCallback = null;
        this.currentData = null;
        this.viewMode = false;
        
        this.afterClose();
    }

    /**
     * Hook called before modal closes - can be overridden by child classes
     */
    beforeClose() {
        // Can be overridden by child classes for pre-close cleanup
    }

    /**
     * Hook called after modal closes - can be overridden by child classes
     */
    afterClose() {
        // Can be overridden by child classes for post-close cleanup
    }

    /**
     * Update modal title based on data and options
     */
    updateTitle(data, options) {
        const titleElement = this.modalElement.querySelector(`#${this.modalId}Title`);
        if (!titleElement) return;

        if (options.viewMode) {
            titleElement.textContent = this.getViewTitle(data, options);
        } else if (data) {
            titleElement.textContent = this.getEditTitle(data, options);
        } else {
            titleElement.textContent = this.getCreateTitle(options);
        }
    }

    /**
     * Get title for view mode - can be overridden by child classes
     */
    getViewTitle(data, options) {
        return `View ${this.defaultTitle}`;
    }

    /**
     * Get title for edit mode - can be overridden by child classes
     */
    getEditTitle(data, options) {
        return `Edit ${this.defaultTitle}`;
    }

    /**
     * Get title for create mode - can be overridden by child classes
     */
    getCreateTitle(options) {
        return `Add ${this.defaultTitle}`;
    }

    /**
     * Set modal state based on view mode and other options
     */
    setModalState(viewMode) {
        this.setFormFieldsState(viewMode);
        this.updateActionButtons();
    }

    /**
     * Set form fields state based on view mode
     */
    setFormFieldsState(viewMode) {
        const inputs = this.modalElement.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (input.type !== 'hidden') {
                input.readOnly = viewMode;
                input.disabled = viewMode;
            }
        });

        const checkboxes = this.modalElement.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.disabled = viewMode;
        });

        // Update save button visibility
        const saveBtn = this.modalElement.querySelector(`#save${this.capitalizeFirst(this.modalId)}`);
        if (saveBtn) {
            saveBtn.style.display = viewMode ? 'none' : 'inline-flex';
        }
    }

    /**
     * Update action buttons based on current state - can be overridden by child classes
     */
    updateActionButtons() {
        // Can be overridden by child classes to update action button states
    }

    /**
     * Handle save button click
     */
    async handleSave() {
        try {
            const formData = await this.getFormData();
            if (!this.validateForm(formData)) {
                return;
            }

            if (this.onSaveCallback) {
                await this.onSaveCallback(formData, null);
            }

            this.close();
        } catch (error) {
            console.error('Error handling save:', error);
            if (this.onSaveCallback) {
                await this.onSaveCallback(null, error);
            }
        }
    }

    /**
     * Get form data - must be implemented by form-based child classes
     */
    async getFormData() {
        throw new Error('getFormData must be implemented by form-based child class');
    }

    /**
     * Validate form data - must be implemented by form-based child classes
     */
    validateForm(formData) {
        throw new Error('validateForm must be implemented by form-based child class');
    }

    /**
     * Handle custom action - can be called by child classes
     */
    async handleAction(action, data) {
        if (this.onActionCallback) {
            await this.onActionCallback(action, data);
        }
    }

    /**
     * Set value for a form field
     */
    setFormValue(fieldId, value) {
        const field = this.modalElement.querySelector(`#${fieldId}`);
        if (field) {
            if (field.type === 'textarea') {
                field.textContent = value || '';
            } else if (field.type === 'checkbox') {
                field.checked = !!value;
            } else {
                field.value = value || '';
            }
        }
    }

    /**
     * Get value from a form field
     */
    getFormValue(fieldId) {
        const field = this.modalElement.querySelector(`#${fieldId}`);
        if (!field) return '';

        if (field.type === 'checkbox') {
            return field.checked;
        } else if (field.type === 'textarea') {
            return field.textContent || '';
        } else {
            return field.value || '';
        }
    }

    /**
     * Set validation error state on a field
     */
    setFieldError(fieldId, message) {
        const field = this.modalElement.querySelector(`#${fieldId}`);
        if (!field) return;

        const formGroup = field.closest('.material-form-group');
        if (!formGroup) return;

        // Remove existing error
        this.clearFieldError(fieldId);

        // Add error class
        formGroup.classList.add('error');

        // Add error message
        const errorElement = document.createElement('div');
        errorElement.className = 'material-input-error';
        errorElement.textContent = message;
        formGroup.appendChild(errorElement);
    }

    /**
     * Clear validation error from a field
     */
    clearFieldError(fieldId) {
        const field = this.modalElement.querySelector(`#${fieldId}`);
        if (!field) return;

        const formGroup = field.closest('.material-form-group');
        if (!formGroup) return;

        formGroup.classList.remove('error');

        const existingError = formGroup.querySelector('.material-input-error');
        if (existingError) {
            existingError.remove();
        }
    }

    /**
     * Clear all validation errors
     */
    clearAllErrors() {
        const formGroups = this.modalElement.querySelectorAll('.material-form-group');
        formGroups.forEach(group => {
            group.classList.remove('error');
            const errorElement = group.querySelector('.material-input-error');
            if (errorElement) {
                errorElement.remove();
            }
        });
    }

    /**
     * Show loading state in modal content
     */
    showLoadingState(message = 'Loading...') {
        const content = this.modalElement.querySelector(`#${this.modalId}Content`);
        if (content) {
            content.innerHTML = `
                <div class="loading-state">
                    <span class="material-icons">hourglass_empty</span>
                    <p>${sanitizeHtml(message)}</p>
                </div>
            `;
        }
    }

    /**
     * Show error state in modal content
     */
    showErrorState(message = 'Error loading content') {
        const content = this.modalElement.querySelector(`#${this.modalId}Content`);
        if (content) {
            content.innerHTML = `
                <div class="error-state">
                    <span class="material-icons">error</span>
                    <h3>Error</h3>
                    <p>${sanitizeHtml(message)}</p>
                    <button class="btn btn-contained" onclick="this.closest('.modal').querySelector('.modal-header button').click()">
                        <span class="material-icons">close</span>
                        Close
                    </button>
                </div>
            `;
        }
    }

    /**
     * Utility method to capitalize first letter
     */
    capitalizeFirst(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    /**
     * Check if modal is open
     */
    isModalOpen() {
        return this.isOpen;
    }

    /**
     * Get modal element
     */
    getModalElement() {
        return this.modalElement;
    }

    /**
     * Destroy the modal and clean up
     */
    destroy() {
        if (this.modalElement) {
            this.modalElement.remove();
            this.modalElement = null;
        }
        this.isOpen = false;
        this.initialized = false;
        this.onSaveCallback = null;
        this.onActionCallback = null;
        this.currentData = null;
        this.viewMode = false;
    }
}

export default BaseModal;