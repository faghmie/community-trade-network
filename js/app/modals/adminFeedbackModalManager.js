// Admin Feedback Modal Manager - Self-contained ES6 module
// Generates and manages the feedback details modal for ADMIN viewing

class AdminFeedbackModalManager {
    constructor() {
        this.modalId = 'adminFeedbackDetailsModal';
        this.currentFeedbackId = null;
        this.onStatusChangeCallback = null;
        this.onDeleteCallback = null;
        this.init();
    }

    init() {
        this.createModal();
        this.setupEventListeners();
    }

    createModal() {
        // Remove existing modal if it exists
        const existingModal = document.getElementById(this.modalId);
        if (existingModal) {
            existingModal.remove();
        }

        // Create modal HTML
        const modalHTML = `
            <div class="modal" id="${this.modalId}">
                <div class="modal-content material-card admin-modal">
                    <div class="modal-header">
                        <h2>Feedback Details</h2>
                        <button class="material-icon-button" id="closeAdminFeedbackModal">
                            <span class="material-icons">close</span>
                        </button>
                    </div>
                    <div class="modal-body" id="adminFeedbackDetailsContent">
                        <!-- Feedback details will be loaded dynamically -->
                    </div>
                    <div class="modal-footer">
                        <div class="modal-actions">
                            <button class="material-button outlined" id="markAsReviewedBtn">
                                <span class="material-icons">check</span>
                                Mark as Reviewed
                            </button>
                            <button class="material-button outlined" id="markAsActionedBtn">
                                <span class="material-icons">done_all</span>
                                Mark as Actioned
                            </button>
                            <button class="material-button contained" id="deleteFeedbackBtn">
                                <span class="material-icons">delete</span>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Append to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    setupEventListeners() {
        // Close button
        const closeBtn = document.getElementById('closeAdminFeedbackModal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        // Modal backdrop click
        const modal = document.getElementById(this.modalId);
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.close();
                }
            });
        }

        // Action buttons
        const markReviewedBtn = document.getElementById('markAsReviewedBtn');
        if (markReviewedBtn) {
            markReviewedBtn.addEventListener('click', () => this.handleMarkAsReviewed());
        }

        const markActionedBtn = document.getElementById('markAsActionedBtn');
        if (markActionedBtn) {
            markActionedBtn.addEventListener('click', () => this.handleMarkAsActioned());
        }

        const deleteBtn = document.getElementById('deleteFeedbackBtn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.handleDelete());
        }

        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen()) {
                this.close();
            }
        });
    }

    show(feedbackData, callbacks = {}) {
        this.currentFeedbackId = feedbackData.id;
        this.onStatusChangeCallback = callbacks.onStatusChange;
        this.onDeleteCallback = callbacks.onDelete;

        this.renderFeedbackDetails(feedbackData);
        this.open();
    }

    renderFeedbackDetails(feedback) {
        const modalContent = document.getElementById('adminFeedbackDetailsContent');
        if (!modalContent) return;

        const date = new Date(feedback.timestamp).toLocaleDateString();
        const time = new Date(feedback.timestamp).toLocaleTimeString();
        const ratingStars = '★'.repeat(feedback.rating) + '☆'.repeat(5 - feedback.rating);

        modalContent.innerHTML = `
            <div class="feedback-details">
                <div class="detail-group">
                    <h3>Feedback Information</h3>
                    <div class="detail-item">
                        <strong>Status:</strong>
                        <span class="status-badge ${feedback.status}">${feedback.status}</span>
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
                            <span>${this.escapeHtml(feedback.contact_email)}</span>
                        </div>
                    </div>
                ` : ''}

                <div class="detail-group">
                    <h3>Context</h3>
                    ${feedback.page_context ? `
                        <div class="detail-item">
                            <strong>Page:</strong>
                            <span>${this.escapeHtml(feedback.page_context)}</span>
                        </div>
                    ` : ''}
                    ${feedback.feature_context ? `
                        <div class="detail-item">
                            <strong>Feature:</strong>
                            <span>${this.escapeHtml(feedback.feature_context)}</span>
                        </div>
                    ` : ''}
                    ${feedback.user_agent ? `
                        <div class="detail-item">
                            <strong>User Agent:</strong>
                            <span class="user-agent">${this.escapeHtml(feedback.user_agent)}</span>
                        </div>
                    ` : ''}
                    ${feedback.app_version ? `
                        <div class="detail-item">
                            <strong>App Version:</strong>
                            <span>${this.escapeHtml(feedback.app_version)}</span>
                        </div>
                    ` : ''}
                </div>

                <div class="detail-group">
                    <h3>Positive Comments</h3>
                    <div class="feedback-full-content">
                        ${this.escapeHtml(feedback.positive_comments)}
                    </div>
                </div>

                ${feedback.improvement_comments ? `
                    <div class="detail-group">
                        <h3>Improvement Suggestions</h3>
                        <div class="feedback-full-content">
                            ${this.escapeHtml(feedback.improvement_comments)}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        // Update action buttons based on current status
        this.updateActionButtons(feedback.status);
    }

    updateActionButtons(currentStatus) {
        const markReviewedBtn = document.getElementById('markAsReviewedBtn');
        const markActionedBtn = document.getElementById('markAsActionedBtn');

        if (markReviewedBtn) {
            markReviewedBtn.style.display = currentStatus === 'new' ? 'inline-flex' : 'none';
        }

        if (markActionedBtn) {
            markActionedBtn.style.display = currentStatus === 'reviewed' ? 'inline-flex' : 'none';
        }
    }

    handleMarkAsReviewed() {
        if (this.onStatusChangeCallback && this.currentFeedbackId) {
            this.onStatusChangeCallback(this.currentFeedbackId, 'reviewed');
        }
        this.close();
    }

    handleMarkAsActioned() {
        if (this.onStatusChangeCallback && this.currentFeedbackId) {
            this.onStatusChangeCallback(this.currentFeedbackId, 'actioned');
        }
        this.close();
    }

    handleDelete() {
        if (!confirm('Are you sure you want to delete this feedback? This action cannot be undone.')) {
            return;
        }

        if (this.onDeleteCallback && this.currentFeedbackId) {
            this.onDeleteCallback(this.currentFeedbackId);
        }
        this.close();
    }

    open() {
        const modal = document.getElementById(this.modalId);
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            // Add opening animation
            modal.classList.add('modal-opening');
            setTimeout(() => {
                modal.classList.remove('modal-opening');
            }, 300);
        }
    }

    close() {
        const modal = document.getElementById(this.modalId);
        if (modal) {
            modal.classList.add('modal-closing');
            setTimeout(() => {
                modal.style.display = 'none';
                modal.classList.remove('modal-closing');
                document.body.style.overflow = 'auto';
                this.currentFeedbackId = null;
                this.onStatusChangeCallback = null;
                this.onDeleteCallback = null;
            }, 300);
        }
    }

    isOpen() {
        const modal = document.getElementById(this.modalId);
        return modal && modal.style.display === 'flex';
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Cleanup method to remove modal from DOM
    destroy() {
        const modal = document.getElementById(this.modalId);
        if (modal) {
            modal.remove();
        }
    }
}

// Export as ES6 module
export default AdminFeedbackModalManager;