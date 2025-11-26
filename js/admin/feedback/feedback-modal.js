/**
 * Admin Feedback Modal Manager
 * Handles feedback details modal for viewing and status management only
 * Refactored to follow recommendations pattern with direct admin module calls
 */

import BaseModal from '../shared/base-modal.js';
import { showNotification } from '../../modules/notifications.js';
import { sanitizeHtml } from '../../modules/utilities.js';

class FeedbackModal extends BaseModal {
    constructor(dataModule, adminModule) {
        super('feedbackDetailsModal', 'Feedback Details');
        this.dataModule = dataModule;
        this.adminModule = adminModule;
        this.feedbackDataManager = dataModule.getFeedbackDataManager();
        this.currentFeedbackId = null;
    }

    /**
     * Generate modal body for feedback details
     */
    generateModalBody() {
        return `
            <div id="feedbackDetailsContent">
                <!-- Feedback details will be loaded dynamically -->
            </div>
        `;
    }

    /**
     * Generate modal footer with action buttons
     */
    generateModalFooter() {
        return `
            <button type="button" class="btn btn-text" id="cancelFeedbackModal">Close</button>
            <div class="action-group" id="feedbackModalActions">
                <!-- Action buttons will be loaded dynamically -->
            </div>
        `;
    }

    /**
     * Initialize modal with custom events
     */
    async initializeModal() {
        this.bindModalActionEvents();
    }

    /**
     * Bind events for modal action buttons
     */
    bindModalActionEvents() {
        // Use event delegation on the modal element itself to catch dynamically created buttons
        this.modalElement.addEventListener('click', (e) => {
            const target = e.target.closest('button');
            if (!target) return;

            const action = target.getAttribute('data-action');
            const feedbackId = target.getAttribute('data-id');
            
            if (!action || !feedbackId) return;

            console.log(`🎯 Modal action clicked: ${action} for feedback ${feedbackId}`);

            this.close();

            // Call admin module methods directly
            switch (action) {
                case 'mark-reviewed':
                    this.adminModule.markAsReviewed(feedbackId);
                    break;
                case 'mark-actioned':
                    this.adminModule.markAsActioned(feedbackId);
                    break;
                case 'delete':
                    this.adminModule.deleteFeedback(feedbackId);
                    break;
            }
        });

        // Also bind the close button
        const closeButton = this.modalElement.querySelector('#cancelFeedbackModal');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this.close();
            });
        }
    }

    /**
     * Show feedback details by ID
     */
    async showFeedbackDetails(feedbackId) {
        try {
            if (!this.modalElement) {
                showNotification('Failed to open feedback details. Please refresh the page.', 'error');
                return;
            }

            await this.dataModule.ensureInitialized();
            
            const allFeedback = await this.feedbackDataManager.getAllFeedback();
            const feedback = allFeedback.find(f => f.id === feedbackId);
            
            if (!feedback) {
                showNotification('Feedback not found', 'error');
                return;
            }

            this.currentFeedbackId = feedbackId;
            await this.renderFeedbackDetails(feedback);
            
            // Open the modal after content is loaded
            this.open(feedback);
            
        } catch (error) {
            console.error('Error viewing feedback:', error);
            showNotification('Error loading feedback details', 'error');
        }
    }

    /**
     * Populate modal with feedback data (BaseModal hook)
     */
    async populateModal(feedback, options) {
        if (!feedback) {
            this.showErrorState('No feedback data provided');
            return;
        }

        await this.renderFeedbackDetails(feedback);
    }

    /**
     * Render feedback details in the modal
     */
    async renderFeedbackDetails(feedback) {
        const content = this.modalElement.querySelector('#feedbackDetailsContent');
        const actions = this.modalElement.querySelector('#feedbackModalActions');
        const title = this.modalElement.querySelector(`#${this.modalId}Title`);
        
        if (!content || !actions || !title) {
            console.error('Modal elements not found:', { content, actions, title });
            return;
        }

        const statusClass = this.getStatusClass(feedback.status);
        const statusLabel = this.getStatusLabel(feedback.status);
        
        // Update modal title with context
        const context = feedback.page_context || feedback.feature_context || 'General Feedback';
        title.textContent = `Feedback: ${sanitizeHtml(context)}`;
        
        const date = new Date(feedback.timestamp).toLocaleDateString();
        const time = new Date(feedback.timestamp).toLocaleTimeString();
        const ratingStars = '★'.repeat(feedback.rating) + '☆'.repeat(5 - feedback.rating);

        let actionButtons = '';
        if (feedback.status === 'new') {
            actionButtons = `
                <button class="btn btn-success" data-action="mark-reviewed" data-id="${feedback.id}">
                    <span class="material-icons">check</span>
                    Mark as Reviewed
                </button>
            `;
        } else if (feedback.status === 'reviewed') {
            actionButtons = `
                <button class="btn btn-primary" data-action="mark-actioned" data-id="${feedback.id}">
                    <span class="material-icons">done_all</span>
                    Mark as Actioned
                </button>
            `;
        }
        
        actionButtons += `
            <button class="btn btn-danger" data-action="delete" data-id="${feedback.id}">
                <span class="material-icons">delete</span>
                Delete
            </button>
        `;

        content.innerHTML = `
            <div class="feedback-details">
                <div class="detail-group">
                    <h3>Feedback Information</h3>
                    <div class="detail-item">
                        <strong>Status:</strong>
                        <span class="status-badge ${statusClass}">${statusLabel}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Rating:</strong>
                        <span class="feedback-rating-large">${ratingStars} (${feedback.rating}/5)</span>
                    </div>
                    <div class="detail-item">
                        <strong>Submitted:</strong>
                        <span>${date} at ${time}</span>
                    </div>
                    ${feedback.updated_at ? `
                        <div class="detail-item">
                            <strong>Last Updated:</strong>
                            <span>${new Date(feedback.updated_at).toLocaleString()}</span>
                        </div>
                    ` : ''}
                </div>

                ${feedback.contact_email ? `
                    <div class="detail-group">
                        <h3>Contact Information</h3>
                        <div class="contact-method">
                            <span class="material-icons">email</span>
                            <span>${sanitizeHtml(feedback.contact_email)}</span>
                        </div>
                    </div>
                ` : ''}

                <div class="detail-group">
                    <h3>Context</h3>
                    ${feedback.page_context ? `
                        <div class="detail-item">
                            <strong>Page:</strong>
                            <span>${sanitizeHtml(feedback.page_context)}</span>
                        </div>
                    ` : ''}
                    ${feedback.feature_context ? `
                        <div class="detail-item">
                            <strong>Feature:</strong>
                            <span>${sanitizeHtml(feedback.feature_context)}</span>
                        </div>
                    ` : ''}
                    ${feedback.user_agent ? `
                        <div class="detail-item">
                            <strong>User Agent:</strong>
                            <span class="user-agent">${sanitizeHtml(feedback.user_agent)}</span>
                        </div>
                    ` : ''}
                    ${feedback.app_version ? `
                        <div class="detail-item">
                            <strong>App Version:</strong>
                            <span>${sanitizeHtml(feedback.app_version)}</span>
                        </div>
                    ` : ''}
                </div>

                <div class="detail-group">
                    <h3>Positive Comments</h3>
                    <div class="feedback-full-content">
                        <p>${sanitizeHtml(feedback.positive_comments)}</p>
                    </div>
                </div>

                ${feedback.improvement_comments ? `
                    <div class="detail-group">
                        <h3>Improvement Suggestions</h3>
                        <div class="feedback-full-content">
                            <p>${sanitizeHtml(feedback.improvement_comments)}</p>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        actions.innerHTML = actionButtons;
        console.log('✅ Feedback action buttons rendered:', actionButtons);
    }

    /**
     * Public method to open modal with feedback ID
     */
    openWithFeedback(feedbackId) {
        this.showFeedbackDetails(feedbackId);
    }

    // Helper methods
    getStatusClass(status) {
        switch(status) {
            case 'new': return 'status-new';
            case 'reviewed': return 'status-reviewed';
            case 'actioned': return 'status-actioned';
            default: return '';
        }
    }

    getStatusLabel(status) {
        switch(status) {
            case 'new': return 'New';
            case 'reviewed': return 'Reviewed';
            case 'actioned': return 'Actioned';
            default: return status;
        }
    }

    /**
     * Override BaseModal methods since feedback doesn't have save functionality
     */
    async handleSave() {
        // Feedback is view-only with actions, no save functionality
        console.warn('Save not supported for feedback modal');
        return false;
    }

    async getFormData() {
        return null;
    }

    validateForm(formData) {
        return true;
    }
}

export default FeedbackModal;