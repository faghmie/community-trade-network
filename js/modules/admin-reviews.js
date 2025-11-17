// Admin Reviews Management
class AdminReviewsModule {
    constructor(dataModule) {
        this.dataModule = dataModule;
    }

    init() {
        this.bindEvents();
        this.renderReviews();
    }

    bindEvents() {
        // Search reviews
        document.getElementById('reviewSearch')?.addEventListener('input', (e) => {
            this.filterReviews();
        });

        // Contractor filter
        document.getElementById('reviewContractorFilter')?.addEventListener('change', (e) => {
            this.filterReviews();
        });

        // Status filter
        document.getElementById('reviewStatusFilter')?.addEventListener('change', (e) => {
            this.filterReviews();
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
                <div class="review-item ${statusClass}">
                    <div class="review-header">
                        <div class="reviewer-info">
                            <span class="reviewer-name">${review.reviewerName}</span>
                            <span class="rating">${'⭐'.repeat(review.rating)} (${review.rating}/5)</span>
                        </div>
                        <div class="review-meta">
                            <span class="review-date">${this.dataModule.formatDate(review.date)}</span>
                            <span class="review-status ${statusClass}">${statusLabel}</span>
                        </div>
                    </div>
                    <div class="review-contractor">
                        <strong>Contractor:</strong> ${review.contractorName} (${review.contractorCategory})
                        <br><strong>Project Type:</strong> ${review.projectType || 'Not specified'}
                    </div>
                    ${hasCategoryRatings ? `
                    <div class="category-ratings-preview">
                        <strong>Category Ratings:</strong>
                        ${categoryRatings.quality ? `Quality: ${'⭐'.repeat(categoryRatings.quality)}` : ''}
                        ${categoryRatings.communication ? ` | Communication: ${'⭐'.repeat(categoryRatings.communication)}` : ''}
                        ${categoryRatings.timeliness ? ` | Timeliness: ${'⭐'.repeat(categoryRatings.timeliness)}` : ''}
                        ${categoryRatings.value ? ` | Value: ${'⭐'.repeat(categoryRatings.value)}` : ''}
                    </div>
                    ` : ''}
                    <p class="review-comment">${review.comment}</p>
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
        const stats = this.dataModule.getReviewStats();
        
        const totalReviewsEl = document.getElementById('totalReviewsCount');
        const approvedReviewsEl = document.getElementById('approvedReviewsCount');
        const pendingReviewsEl = document.getElementById('pendingReviewsCount');
        const rejectedReviewsEl = document.getElementById('rejectedReviewsCount');
        
        if (totalReviewsEl) totalReviewsEl.textContent = stats.totalReviews;
        if (approvedReviewsEl) approvedReviewsEl.textContent = stats.approvedReviews;
        if (pendingReviewsEl) pendingReviewsEl.textContent = stats.pendingReviews;
        if (rejectedReviewsEl) rejectedReviewsEl.textContent = stats.rejectedReviews;
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

    approveReview(reviewId) {
        if (confirm('Are you sure you want to approve this review?')) {
            const success = this.dataModule.updateReviewStatus(reviewId, 'approved');
            if (success) {
                this.renderReviews();
                // Update main stats if admin module is available
                if (window.adminModule) {
                    adminModule.renderStats();
                }
            }
        }
    }

    rejectReview(reviewId) {
        if (confirm('Are you sure you want to reject this review?')) {
            const success = this.dataModule.updateReviewStatus(reviewId, 'rejected');
            if (success) {
                this.renderReviews();
                // Update main stats if admin module is available
                if (window.adminModule) {
                    adminModule.renderStats();
                }
            }
        }
    }

    deleteReview(reviewId) {
        if (confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
            const success = this.dataModule.deleteReview(reviewId);
            if (success) {
                this.renderReviews();
                // Update main stats if admin module is available
                if (window.adminModule) {
                    adminModule.renderStats();
                }
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
                        <div class="detail-section">
                            <h3>Review Information</h3>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <strong>Reviewer:</strong> ${review.reviewerName}
                                </div>
                                <div class="detail-item">
                                    <strong>Overall Rating:</strong> ${'⭐'.repeat(review.rating)} (${review.rating}/5)
                                </div>
                                <div class="detail-item">
                                    <strong>Project Type:</strong> ${review.projectType || 'Not specified'}
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
                                    <span>${'⭐'.repeat(categoryRatings.quality)} (${categoryRatings.quality}/5)</span>
                                </div>
                                ` : ''}
                                ${categoryRatings.communication ? `
                                <div class="category-rating-item">
                                    <strong>Communication:</strong> 
                                    <span>${'⭐'.repeat(categoryRatings.communication)} (${categoryRatings.communication}/5)</span>
                                </div>
                                ` : ''}
                                ${categoryRatings.timeliness ? `
                                <div class="category-rating-item">
                                    <strong>Timeliness:</strong> 
                                    <span>${'⭐'.repeat(categoryRatings.timeliness)} (${categoryRatings.timeliness}/5)</span>
                                </div>
                                ` : ''}
                                ${categoryRatings.value ? `
                                <div class="category-rating-item">
                                    <strong>Value for Money:</strong> 
                                    <span>${'⭐'.repeat(categoryRatings.value)} (${categoryRatings.value}/5)</span>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                        ` : ''}
                        
                        <div class="detail-section">
                            <h3>Contractor Information</h3>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <strong>Name:</strong> ${contractor.name}
                                </div>
                                <div class="detail-item">
                                    <strong>Category:</strong> ${contractor.category}
                                </div>
                                <div class="detail-item">
                                    <strong>Email:</strong> ${contractor.email || 'Not provided'}
                                </div>
                                <div class="detail-item">
                                    <strong>Phone:</strong> ${contractor.phone || 'Not provided'}
                                </div>
                            </div>
                        </div>
                        
                        <div class="detail-section">
                            <h3>Review Comment</h3>
                            <div class="review-comment-detail">
                                ${review.comment}
                            </div>
                        </div>
                        
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
                        </div>
                    </div>
                `;
                
                if (modal) modal.style.display = 'block';
            }
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }
}

export default AdminReviewsModule;