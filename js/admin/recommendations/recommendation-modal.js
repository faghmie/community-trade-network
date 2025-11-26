/**
 * Admin Recommendation Modal Manager
 * Handles recommendation details modal for viewing and moderation actions only
 * Refactored to use BaseModal for common functionality
 */

import BaseModal from '../shared/base-modal.js';
import { showNotification } from '../../modules/notifications.js';
import { sanitizeHtml } from '../../modules/utilities.js';

class RecommendationModal extends BaseModal {
    constructor(dataModule, adminModule) {
        super('recommendationDetailsModal', 'Recommendation Details');
        this.dataModule = dataModule;
        this.adminModule = adminModule; // FIX: Store reference to admin module
        this.recommendationManager = dataModule.getRecommendationDataManager();
        this.currentRecommendationId = null;
    }

    /**
     * Generate modal body for recommendation details
     */
    generateModalBody() {
        return `
            <div id="recommendationDetailsContent">
                <!-- Recommendation details will be loaded dynamically -->
            </div>
        `;
    }

    /**
     * Generate modal footer with action buttons
     */
    generateModalFooter() {
        return `
            <button type="button" class="btn btn-text" id="cancelRecommendationModal">Close</button>
            <div class="action-group" id="recommendationModalActions">
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
            const recommendationId = target.getAttribute('data-id');
            
            if (!action || !recommendationId) return;

            console.log(`🎯 Modal action clicked: ${action} for recommendation ${recommendationId}`);

            this.close();

            // FIX: Call admin module methods directly instead of dispatching events
            switch (action) {
                case 'approve':
                    this.adminModule.approveRecommendation(recommendationId);
                    break;
                case 'reject':
                    this.adminModule.rejectRecommendation(recommendationId);
                    break;
                case 'delete':
                    this.adminModule.deleteRecommendation(recommendationId);
                    break;
            }
        });

        // Also bind the close button
        const closeButton = this.modalElement.querySelector('#cancelRecommendationModal');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this.close();
            });
        }
    }

    /**
     * Show recommendation details by ID
     */
    async showRecommendationDetails(recommendationId) {
        try {
            if (!this.modalElement) {
                showNotification('Failed to open recommendation details. Please refresh the page.', 'error');
                return;
            }

            await this.dataModule.ensureInitialized();
            
            const allRecommendations = this.recommendationManager.getRecommendationsWithContractorInfo();
            const recommendation = allRecommendations.find(r => r.id === recommendationId);
            
            if (!recommendation) {
                showNotification('Recommendation not found', 'error');
                return;
            }

            this.currentRecommendationId = recommendationId;
            const contractor = this.dataModule.getContractor(recommendation.contractor_id);
            await this.renderRecommendationDetails(recommendation, contractor);
            
            // Open the modal after content is loaded
            this.open(recommendation);
            
        } catch (error) {
            console.error('Error viewing recommendation:', error);
            showNotification('Error loading recommendation details', 'error');
        }
    }

    /**
     * Populate modal with recommendation data (BaseModal hook)
     */
    async populateModal(recommendation, options) {
        if (!recommendation) {
            this.showErrorState('No recommendation data provided');
            return;
        }

        const contractor = this.dataModule.getContractor(recommendation.contractor_id);
        await this.renderRecommendationDetails(recommendation, contractor);
    }

    /**
     * Render recommendation details in the modal
     */
    async renderRecommendationDetails(recommendation, contractor) {
        const content = this.modalElement.querySelector('#recommendationDetailsContent');
        const actions = this.modalElement.querySelector('#recommendationModalActions');
        const title = this.modalElement.querySelector(`#${this.modalId}Title`);
        
        if (!content || !actions || !title) {
            console.error('Modal elements not found:', { content, actions, title });
            return;
        }

        const statusClass = this.getStatusClass(recommendation.moderationStatus);
        const statusLabel = this.getStatusLabel(recommendation.moderationStatus);
        
        // Update modal title with referrer name
        title.textContent = `Recommendation from ${sanitizeHtml(recommendation.referrerName)}`;
        
        const contractorInfo = contractor ? `
            <div class="detail-group">
                <h3>Service Provider Information</h3>
                <div class="detail-item">
                    <strong>Name:</strong> ${sanitizeHtml(contractor.name)}
                </div>
                <div class="detail-item">
                    <strong>Category:</strong> ${sanitizeHtml(contractor.category)}
                </div>
                <div class="detail-item">
                    <strong>Email:</strong> ${sanitizeHtml(contractor.email || 'Not provided')}
                </div>
                <div class="detail-item">
                    <strong>Phone:</strong> ${sanitizeHtml(contractor.phone || 'Not provided')}
                </div>
            </div>
        ` : `
            <div class="detail-group">
                <h3>Service Provider Information</h3>
                <div class="detail-item warning">
                    <span class="material-icons">warning</span>
                    Service Provider not found (may have been deleted)
                </div>
            </div>
        `;

        let actionButtons = '';
        if (recommendation.moderationStatus === 'pending') {
            actionButtons = `
                <button class="btn btn-success" data-action="approve" data-id="${recommendation.id}">
                    <span class="material-icons">check_circle</span>
                    Approve
                </button>
                <button class="btn btn-warning" data-action="reject" data-id="${recommendation.id}">
                    <span class="material-icons">cancel</span>
                    Reject
                </button>
            `;
        } else if (recommendation.moderationStatus === 'approved') {
            actionButtons = `
                <button class="btn btn-warning" data-action="reject" data-id="${recommendation.id}">
                    <span class="material-icons">block</span>
                    Reject
                </button>
            `;
        } else if (recommendation.moderationStatus === 'rejected') {
            actionButtons = `
                <button class="btn btn-success" data-action="approve" data-id="${recommendation.id}">
                    <span class="material-icons">check_circle</span>
                    Approve
                </button>
            `;
        }
        
        actionButtons += `
            <button class="btn btn-danger" data-action="delete" data-id="${recommendation.id}">
                <span class="material-icons">delete</span>
                Delete
            </button>
        `;

        content.innerHTML = `
            <div class="recommendation-details">
                <div class="detail-group">
                    <h3>Recommendation Information</h3>
                    <div class="detail-item">
                        <strong>Referrer:</strong> ${sanitizeHtml(recommendation.referrerName)}
                    </div>
                    <div class="detail-item">
                        <strong>Phone:</strong> ${sanitizeHtml(recommendation.referrerPhone || 'Not provided')}
                    </div>
                    <div class="detail-item">
                        <strong>Referrer Type:</strong> ${this.formatReferrerType(recommendation.referrerType)}
                    </div>
                    <div class="detail-item">
                        <strong>Neighborhood:</strong> ${sanitizeHtml(recommendation.referrerNeighborhood)}
                    </div>
                    <div class="detail-item">
                        <strong>Service Used:</strong> ${sanitizeHtml(recommendation.serviceUsed)}
                    </div>
                    <div class="detail-item">
                        <strong>Service Date:</strong> ${sanitizeHtml(recommendation.serviceDate)}
                    </div>
                    <div class="detail-item">
                        <strong>Submission Date:</strong> ${this.formatDate(recommendation.submissionDate)}
                    </div>
                    <div class="detail-item">
                        <strong>Status:</strong> <span class="recommendation-status ${statusClass}">${statusLabel}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Would Recommend to Neighbors:</strong> ${recommendation.wouldRecommendToNeighbors ? 'Yes' : 'No'}
                    </div>
                    <div class="detail-item">
                        <strong>Verified:</strong> ${recommendation.isVerified ? 'Yes' : 'No'}
                    </div>
                    <div class="detail-item">
                        <strong>Anonymous:</strong> ${recommendation.isAnonymous ? 'Yes' : 'No'}
                    </div>
                </div>
                
                <div class="detail-group">
                    <h3>Quality Metrics</h3>
                    <div class="detail-item">
                        <strong>Quality of Work:</strong> ${this.generateStarIcons(recommendation.metrics.quality)} (${recommendation.metrics.quality}/5)
                    </div>
                    <div class="detail-item">
                        <strong>Timeliness:</strong> ${this.generateStarIcons(recommendation.metrics.timeliness)} (${recommendation.metrics.timeliness}/5)
                    </div>
                    <div class="detail-item">
                        <strong>Communication:</strong> ${this.generateStarIcons(recommendation.metrics.communication)} (${recommendation.metrics.communication}/5)
                    </div>
                    <div class="detail-item">
                        <strong>Value for Money:</strong> ${this.generateStarIcons(recommendation.metrics.value)} (${recommendation.metrics.value}/5)
                    </div>
                    <div class="detail-item">
                        <strong>Average Rating:</strong> ${this.generateStarIcons(this.calculateAverageRating(recommendation.metrics))} (${this.calculateAverageRating(recommendation.metrics).toFixed(1)}/5)
                    </div>
                </div>
                
                ${contractorInfo}
                
                <div class="detail-group">
                    <h3>Endorsement Note</h3>
                    <div class="recommendation-comment">
                        <p>${sanitizeHtml(recommendation.endorsementNote)}</p>
                    </div>
                </div>

                ${recommendation.photos && recommendation.photos.length > 0 ? `
                    <div class="detail-group">
                        <h3>Photos</h3>
                        <div class="recommendation-photos">
                            ${recommendation.photos.map(photo => `
                                <img src="${photo}" alt="Recommendation photo" class="recommendation-photo">
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        actions.innerHTML = actionButtons;
        console.log('✅ Action buttons rendered:', actionButtons);
    }

    /**
     * Public method to open modal with recommendation ID
     */
    openWithRecommendation(recommendationId) {
        this.showRecommendationDetails(recommendationId);
    }

    // Helper methods (keep existing)
    getStatusClass(status) {
        switch(status) {
            case 'approved': return 'status-approved';
            case 'pending': return 'status-pending';
            case 'rejected': return 'status-rejected';
            default: return '';
        }
    }

    getStatusLabel(status) {
        switch(status) {
            case 'approved': return 'Approved';
            case 'pending': return 'Pending Review';
            case 'rejected': return 'Rejected';
            default: return status;
        }
    }

    formatReferrerType(type) {
        switch(type) {
            case 'homeowner': return 'Homeowner';
            case 'renter': return 'Renter';
            case 'business': return 'Business';
            default: return type;
        }
    }

    calculateAverageRating(metrics) {
        return (metrics.quality + metrics.timeliness + metrics.communication + metrics.value) / 4;
    }

    generateStarIcons(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        let stars = '⭐'.repeat(fullStars);
        if (hasHalfStar) stars += '⭐';
        return stars;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Override BaseModal methods since recommendations are view-only
     */
    async handleSave() {
        // Recommendations are view-only with actions, no save functionality
        console.warn('Save not supported for recommendation modal');
        return false;
    }

    async getFormData() {
        return null;
    }

    validateForm(formData) {
        return true;
    }
}

export default RecommendationModal;