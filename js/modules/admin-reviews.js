// Admin Reviews Management - ES6 MODULE
import { showNotification } from './notifications.js';
import { sanitizeHtml } from './utilities.js';

class AdminReviewsModule {
    constructor(dataModule) {
        this.dataModule = dataModule;
        this.reviewManager = dataModule.getReviewManager();
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        
        console.log('🔧 AdminReviewsModule initializing...');
        this.bindEvents();
        this.renderReviews();
        this.initialized = true;
        console.log('✅ AdminReviewsModule initialized');
    }

    bindEvents() {
        // Search reviews
        const reviewSearch = document.getElementById('reviewSearch');
        if (reviewSearch) {
            reviewSearch.addEventListener('input', (e) => {
                this.filterReviews();
            });
        }

        // Contractor filter
        const contractorFilter = document.getElementById('reviewContractorFilter');
        if (contractorFilter) {
            contractorFilter.addEventListener('change', (e) => {
                this.filterReviews();
            });
        }

        // Status filter
        const statusFilter = document.getElementById('reviewStatusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filterReviews();
            });
        }

        // Close modal events
        const reviewModal = document.getElementById('reviewDetailsModal');
        if (reviewModal) {
            reviewModal.addEventListener('click', (e) => {
                if (e.target === reviewModal) {
                    this.closeModal('reviewDetailsModal');
                }
            });

            const closeBtn = reviewModal.querySelector('.close-modal');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    this.closeModal('reviewDetailsModal');
                });
            }
        }

        // Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal('reviewDetailsModal');
            }
        });
    }

    renderReviews() {
        this.renderContractorFilter();
        this.renderReviewsList();
        this.renderReviewStats();
    }

    // Populate contractor filter dropdown
    renderContractorFilter() {
        const contractorFilter = document.getElementById('reviewContractorFilter');
        if (!contractorFilter) return;

        const contractors = this.dataModule.getContractors();
        const currentValue = contractorFilter.value;
        
        contractorFilter.innerHTML = '<option value="all">All Contractors</option>';
        
        contractors.forEach(contractor => {
            contractorFilter.innerHTML += `<option value="${contractor.id}">${contractor.name}</option>`;
        });
        
        // Restore the selected value if it still exists
        if (currentValue && contractors.some(c => c.id === currentValue)) {
            contractorFilter.value = currentValue;
        }
    }

    renderReviewsList(filteredReviews = null) {
        const reviews = filteredReviews || this.dataModule.getAllReviews();
        const container = document.getElementById('reviewsList');
        
        if (!container) return;

        // Sort reviews by date (newest first)
        reviews.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (reviews.length === 0) {
            container.innerHTML = `
                <div class="no-reviews">
                    <p>No reviews found matching your criteria.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = reviews.map(review => {
            const statusClass = this.getStatusClass(review.status);
            const statusLabel = this.getStatusLabel(review.status);
            
            // Get category ratings if they exist
            const categoryRatings = review.categoryRatings || {};
            const hasCategoryRatings = categoryRatings.quality || categoryRatings.communication || 
                                     categoryRatings.timeliness || categoryRatings.value;
            
            return `
                <div class="review-item ${statusClass}" data-review-id="${review.id}">
                    <div class="review-header">
                        <div class="reviewer-info">
                            <span class="reviewer-name">${sanitizeHtml(review.reviewerName)}</span>
                            <span class="rating">${this.generateStarIcons(review.rating)} (${review.rating}/5)</span>
                        </div>
                        <div class="review-meta">
                            <span class="review-date">${this.dataModule.formatDate(review.date)}</span>
                            <span class="review-status ${statusClass}">${statusLabel}</span>
                        </div>
                    </div>
                    <div class="review-contractor">
                        <strong>Contractor:</strong> ${sanitizeHtml(review.contractorName)} (${sanitizeHtml(review.contractorCategory)})
                        <br><strong>Project Type:</strong> ${sanitizeHtml(review.projectType || 'Not specified')}
                    </div>
                    ${hasCategoryRatings ? `
                    <div class="category-ratings-preview">
                        <strong>Category Ratings:</strong>
                        ${categoryRatings.quality ? `Quality: ${this.generateStarIcons(categoryRatings.quality)}` : ''}
                        ${categoryRatings.communication ? ` | Communication: ${this.generateStarIcons(categoryRatings.communication)}` : ''}
                        ${categoryRatings.timeliness ? ` | Timeliness: ${this.generateStarIcons(categoryRatings.timeliness)}` : ''}
                        ${categoryRatings.value ? ` | Value: ${this.generateStarIcons(categoryRatings.value)}` : ''}
                    </div>
                    ` : ''}
                    <p class="review-comment">${sanitizeHtml(review.comment)}</p>
                    <div class="review-actions">
                        ${review.status === 'pending' ? `
                            <button class="btn btn-small btn-success" onclick="adminModule.approveReview('${review.id}')">
                                Approve
                            </button>
                            <button class="btn btn-small btn-warning" onclick="adminModule.rejectReview('${review.id}')">
                                Reject
                            </button>
                        ` : ''}
                        ${review.status === 'approved' ? `
                            <button class="btn btn-small btn-warning" onclick="adminModule.rejectReview('${review.id}')">
                                Reject
                            </button>
                        ` : ''}
                        ${review.status === 'rejected' ? `
                            <button class="btn btn-small btn-success" onclick="adminModule.approveReview('${review.id}')">
                                Approve
                            </button>
                        ` : ''}
                        <button class="btn btn-small btn-secondary" onclick="adminModule.viewReview('${review.contractorId}', '${review.id}')">
                            View Details
                        </button>
                        <button class="btn btn-small btn-danger" 
                                onclick="adminModule.deleteReview('${review.id}')">
                            Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderReviewStats() {
        const allReviews = this.dataModule.getAllReviews();
        
        const stats = {
            totalReviews: allReviews.length,
            approvedReviews: allReviews.filter(r => r.status === 'approved').length,
            pendingReviews: allReviews.filter(r => r.status === 'pending').length,
            rejectedReviews: allReviews.filter(r => r.status === 'rejected').length
        };
        
        const totalReviewsEl = document.getElementById('totalReviewsCount');
        const approvedReviewsEl = document.getElementById('approvedReviewsCount');
        const pendingReviewsEl = document.getElementById('pendingReviewsCount');
        const rejectedReviewsEl = document.getElementById('rejectedReviewsCount');
        
        if (totalReviewsEl) totalReviewsEl.textContent = stats.totalReviews;
        if (approvedReviewsEl) approvedReviewsEl.textContent = stats.approvedReviews;
        if (pendingReviewsEl) pendingReviewsEl.textContent = stats.pendingReviews;
        if (rejectedReviewsEl) rejectedReviewsEl.textContent = stats.rejectedReviews;

        console.log('📊 Review stats updated:', stats);
    }

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

    filterReviews() {
        const searchTerm = document.getElementById('reviewSearch')?.value || '';
        const statusFilter = document.getElementById('reviewStatusFilter')?.value || 'all';
        const contractorFilter = document.getElementById('reviewContractorFilter')?.value || 'all';
        
        let filteredReviews = this.dataModule.searchReviews(searchTerm, statusFilter);
        
        // Apply contractor filter
        if (contractorFilter && contractorFilter !== 'all') {
            filteredReviews = filteredReviews.filter(review => review.contractorId === contractorFilter);
        }
        
        this.renderReviewsList(filteredReviews);
    }

    async approveReview(reviewId) {
        if (confirm('Are you sure you want to approve this review? It will become visible to users and affect contractor ratings.')) {
            try {
                const success = await this.dataModule.updateReviewStatus(reviewId, 'approved');
                if (success) {
                    showNotification('Review approved successfully!', 'success');
                    this.renderReviews();
                    // Trigger global stats update
                    this.triggerStatsUpdate();
                } else {
                    showNotification('Failed to approve review. Please try again.', 'error');
                }
            } catch (error) {
                console.error('Error approving review:', error);
                showNotification('Error approving review. Please try again.', 'error');
            }
        }
    }

    async rejectReview(reviewId) {
        if (confirm('Are you sure you want to reject this review? It will be hidden from users.')) {
            try {
                const success = await this.dataModule.updateReviewStatus(reviewId, 'rejected');
                if (success) {
                    showNotification('Review rejected successfully!', 'success');
                    this.renderReviews();
                    // Trigger global stats update
                    this.triggerStatsUpdate();
                } else {
                    showNotification('Failed to reject review. Please try again.', 'error');
                }
            } catch (error) {
                console.error('Error rejecting review:', error);
                showNotification('Error rejecting review. Please try again.', 'error');
            }
        }
    }

    async deleteReview(reviewId) {
        if (confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
            try {
                const success = await this.dataModule.deleteReview(reviewId);
                if (success) {
                    showNotification('Review deleted successfully!', 'success');
                    this.renderReviews();
                    // Trigger global stats update
                    this.triggerStatsUpdate();
                } else {
                    showNotification('Failed to delete review. Please try again.', 'error');
                }
            } catch (error) {
                console.error('Error deleting review:', error);
                showNotification('Error deleting review. Please try again.', 'error');
            }
        }
    }

    viewReview(contractorId, reviewId) {
        const contractor = this.dataModule.getContractor(contractorId);
        if (contractor) {
            const review = this.dataModule.getAllReviews().find(r => r.id === reviewId);
            if (review) {
                const modal = document.getElementById('reviewDetailsModal');
                const content = document.getElementById('reviewDetailsContent');
                
                const statusClass = this.getStatusClass(review.status);
                const statusLabel = this.getStatusLabel(review.status);
                
                // Get category ratings if they exist
                const categoryRatings = review.categoryRatings || {};
                const hasCategoryRatings = categoryRatings.quality || categoryRatings.communication || 
                                         categoryRatings.timeliness || categoryRatings.value;
                
                content.innerHTML = `
                    <div class="review-details">
                        <div class="modal-header">
                            <h2>Review Details</h2>
                            <button class="close-modal">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div class="detail-section">
                                <h3>Review Information</h3>
                                <div class="detail-grid">
                                    <div class="detail-item">
                                        <strong>Reviewer:</strong> ${sanitizeHtml(review.reviewerName)}
                                    </div>
                                    <div class="detail-item">
                                        <strong>Overall Rating:</strong> ${this.generateStarIcons(review.rating)} (${review.rating}/5)
                                    </div>
                                    <div class="detail-item">
                                        <strong>Project Type:</strong> ${sanitizeHtml(review.projectType || 'Not specified')}
                                    </div>
                                    <div class="detail-item">
                                        <strong>Date:</strong> ${this.dataModule.formatDate(review.date)}
                                    </div>
                                    <div class="detail-item">
                                        <strong>Status:</strong> <span class="review-status ${statusClass}">${statusLabel}</span>
                                    </div>
                                </div>
                            </div>
                            
                            ${hasCategoryRatings ? `
                            <div class="detail-section">
                                <h3>Category Ratings</h3>
                                <div class="category-ratings-detail">
                                    ${categoryRatings.quality ? `
                                    <div class="category-rating-item">
                                        <strong>Quality of Work:</strong> 
                                        <span>${this.generateStarIcons(categoryRatings.quality)} (${categoryRatings.quality}/5)</span>
                                    </div>
                                    ` : ''}
                                    ${categoryRatings.communication ? `
                                    <div class="category-rating-item">
                                        <strong>Communication:</strong> 
                                        <span>${this.generateStarIcons(categoryRatings.communication)} (${categoryRatings.communication}/5)</span>
                                    </div>
                                    ` : ''}
                                    ${categoryRatings.timeliness ? `
                                    <div class="category-rating-item">
                                        <strong>Timeliness:</strong> 
                                        <span>${this.generateStarIcons(categoryRatings.timeliness)} (${categoryRatings.timeliness}/5)</span>
                                    </div>
                                    ` : ''}
                                    ${categoryRatings.value ? `
                                    <div class="category-rating-item">
                                        <strong>Value for Money:</strong> 
                                        <span>${this.generateStarIcons(categoryRatings.value)} (${categoryRatings.value}/5)</span>
                                    </div>
                                    ` : ''}
                                </div>
                            </div>
                            ` : ''}
                            
                            <div class="detail-section">
                                <h3>Contractor Information</h3>
                                <div class="detail-grid">
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
                            </div>
                            
                            <div class="detail-section">
                                <h3>Review Comment</h3>
                                <div class="review-comment-detail">
                                    ${sanitizeHtml(review.comment)}
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <div class="detail-actions">
                                ${review.status === 'pending' ? `
                                    <button class="btn btn-success" onclick="adminModule.approveReview('${review.id}'); adminModule.closeModal('reviewDetailsModal')">
                                        Approve Review
                                    </button>
                                    <button class="btn btn-warning" onclick="adminModule.rejectReview('${review.id}'); adminModule.closeModal('reviewDetailsModal')">
                                        Reject Review
                                    </button>
                                ` : ''}
                                ${review.status === 'approved' ? `
                                    <button class="btn btn-warning" onclick="adminModule.rejectReview('${review.id}'); adminModule.closeModal('reviewDetailsModal')">
                                        Reject Review
                                    </button>
                                ` : ''}
                                ${review.status === 'rejected' ? `
                                    <button class="btn btn-success" onclick="adminModule.approveReview('${review.id}'); adminModule.closeModal('reviewDetailsModal')">
                                        Approve Review
                                    </button>
                                ` : ''}
                                <button class="btn btn-danger" 
                                        onclick="adminModule.deleteReview('${review.id}'); adminModule.closeModal('reviewDetailsModal')">
                                    Delete Review
                                </button>
                                <button class="btn btn-secondary" onclick="adminModule.closeModal('reviewDetailsModal')">
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                
                if (modal) {
                    modal.style.display = 'block';
                    // Re-bind close button event
                    const closeBtn = modal.querySelector('.close-modal');
                    if (closeBtn) {
                        closeBtn.addEventListener('click', () => {
                            this.closeModal('reviewDetailsModal');
                        });
                    }
                }
            }
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Utility methods
    generateStarIcons(rating) {
        return '⭐'.repeat(rating);
    }

    triggerStatsUpdate() {
        // Dispatch event to update main admin stats
        document.dispatchEvent(new CustomEvent('adminDataUpdated'));
    }

    // Refresh all data
    async refresh() {
        console.log('🔄 Refreshing admin reviews data...');
        await this.dataModule.getReviewManager().refresh();
        this.renderReviews();
    }
}

export default AdminReviewsModule;