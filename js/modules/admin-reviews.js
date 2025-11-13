// Admin Reviews Management
const adminReviewsModule = {
    init() {
        this.bindEvents();
        this.renderReviews();
    },

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
    },

    renderReviews() {
        this.renderContractorFilter();
        this.renderReviewsList();
        this.renderReviewStats();
    },

    // Populate contractor filter dropdown
    renderContractorFilter() {
        const contractorFilter = document.getElementById('reviewContractorFilter');
        if (!contractorFilter) return;

        const contractors = dataModule.getContractors();
        const currentValue = contractorFilter.value;
        
        contractorFilter.innerHTML = '<option value="all">All Contractors</option>';
        
        contractors.forEach(contractor => {
            contractorFilter.innerHTML += `<option value="${contractor.id}">${contractor.name}</option>`;
        });
        
        // Restore the selected value if it still exists
        if (currentValue && contractors.some(c => c.id === currentValue)) {
            contractorFilter.value = currentValue;
        }
    },

    renderReviewsList(filteredReviews = null) {
        const reviews = filteredReviews || dataModule.getAllReviews();
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
            
            return `
                <div class="review-item ${statusClass}">
                    <div class="review-header">
                        <div class="reviewer-info">
                            <span class="reviewer-name">${review.reviewerName}</span>
                            <span class="rating">${'⭐'.repeat(review.rating)}</span>
                        </div>
                        <div class="review-meta">
                            <span class="review-date">${dataModule.formatDate(review.date)}</span>
                            <span class="review-status ${statusClass}">${statusLabel}</span>
                        </div>
                    </div>
                    <div class="review-contractor">
                        <strong>Contractor:</strong> ${review.contractorName} (${review.contractorCategory})
                    </div>
                    <p class="review-comment">${review.comment}</p>
                    <div class="review-actions">
                        ${review.status === 'pending' ? `
                            <button class="btn btn-small btn-success" onclick="adminReviewsModule.approveReview('${review.contractorId}', '${review.id}')">
                                Approve
                            </button>
                            <button class="btn btn-small btn-warning" onclick="adminReviewsModule.rejectReview('${review.contractorId}', '${review.id}')">
                                Reject
                            </button>
                        ` : ''}
                        ${review.status === 'approved' ? `
                            <button class="btn btn-small btn-warning" onclick="adminReviewsModule.rejectReview('${review.contractorId}', '${review.id}')">
                                Reject
                            </button>
                        ` : ''}
                        ${review.status === 'rejected' ? `
                            <button class="btn btn-small btn-success" onclick="adminReviewsModule.approveReview('${review.contractorId}', '${review.id}')">
                                Approve
                            </button>
                        ` : ''}
                        <button class="btn btn-small btn-secondary" onclick="adminReviewsModule.viewReview('${review.contractorId}', '${review.id}')">
                            View Details
                        </button>
                        <button class="btn btn-small" style="background: var(--accent-color); color: white;" 
                                onclick="adminReviewsModule.deleteReview('${review.contractorId}', '${review.id}')">
                            Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderReviewStats() {
        const stats = dataModule.getReviewStats();
        
        document.getElementById('totalReviewsCount').textContent = stats.totalReviews;
        document.getElementById('approvedReviewsCount').textContent = stats.approvedReviews;
        document.getElementById('pendingReviewsCount').textContent = stats.pendingReviews;
        document.getElementById('rejectedReviewsCount').textContent = stats.rejectedReviews;
    },

    getStatusClass(status) {
        switch(status) {
            case 'approved': return 'status-approved';
            case 'pending': return 'status-pending';
            case 'rejected': return 'status-rejected';
            default: return '';
        }
    },

    getStatusLabel(status) {
        switch(status) {
            case 'approved': return 'Approved';
            case 'pending': return 'Pending Review';
            case 'rejected': return 'Rejected';
            default: return status;
        }
    },

    filterReviews() {
        const searchTerm = document.getElementById('reviewSearch').value;
        const statusFilter = document.getElementById('reviewStatusFilter').value;
        const contractorFilter = document.getElementById('reviewContractorFilter').value;
        
        let filteredReviews = dataModule.searchReviews(searchTerm, statusFilter);
        
        // Apply contractor filter
        if (contractorFilter && contractorFilter !== 'all') {
            filteredReviews = filteredReviews.filter(review => review.contractorId === contractorFilter);
        }
        
        this.renderReviewsList(filteredReviews);
    },

    approveReview(contractorId, reviewId) {
        if (confirm('Are you sure you want to approve this review?')) {
            const success = dataModule.updateReviewStatus(contractorId, reviewId, 'approved');
            if (success) {
                this.renderReviews();
                // Update main stats if admin module is available
                if (typeof adminModule !== 'undefined') {
                    adminModule.renderStats();
                }
            }
        }
    },

    rejectReview(contractorId, reviewId) {
        if (confirm('Are you sure you want to reject this review?')) {
            const success = dataModule.updateReviewStatus(contractorId, reviewId, 'rejected');
            if (success) {
                this.renderReviews();
                // Update main stats if admin module is available
                if (typeof adminModule !== 'undefined') {
                    adminModule.renderStats();
                }
            }
        }
    },

    deleteReview(contractorId, reviewId) {
        if (confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
            const success = dataModule.deleteReview(contractorId, reviewId);
            if (success) {
                this.renderReviews();
                // Update main stats if admin module is available
                if (typeof adminModule !== 'undefined') {
                    adminModule.renderStats();
                }
            }
        }
    },

    viewReview(contractorId, reviewId) {
        const contractor = dataModule.getContractor(contractorId);
        if (contractor) {
            const review = contractor.reviews.find(r => r.id === reviewId);
            if (review) {
                const modal = document.getElementById('reviewDetailsModal');
                const content = document.getElementById('reviewDetailsContent');
                
                const statusClass = this.getStatusClass(review.status);
                const statusLabel = this.getStatusLabel(review.status);
                
                content.innerHTML = `
                    <div class="review-details">
                        <div class="detail-section">
                            <h3>Review Information</h3>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <strong>Reviewer:</strong> ${review.reviewerName}
                                </div>
                                <div class="detail-item">
                                    <strong>Rating:</strong> ${'⭐'.repeat(review.rating)} (${review.rating}/5)
                                </div>
                                <div class="detail-item">
                                    <strong>Date:</strong> ${dataModule.formatDate(review.date)}
                                </div>
                                <div class="detail-item">
                                    <strong>Status:</strong> <span class="review-status ${statusClass}">${statusLabel}</span>
                                </div>
                            </div>
                        </div>
                        
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
                                    <strong>Email:</strong> ${contractor.email}
                                </div>
                                <div class="detail-item">
                                    <strong>Phone:</strong> ${contractor.phone}
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
                                <button class="btn btn-success" onclick="adminReviewsModule.approveReview('${contractorId}', '${review.id}'); adminReviewsModule.closeModal('reviewDetailsModal')">
                                    Approve Review
                                </button>
                                <button class="btn btn-warning" onclick="adminReviewsModule.rejectReview('${contractorId}', '${review.id}'); adminReviewsModule.closeModal('reviewDetailsModal')">
                                    Reject Review
                                </button>
                            ` : ''}
                            ${review.status === 'approved' ? `
                                <button class="btn btn-warning" onclick="adminReviewsModule.rejectReview('${contractorId}', '${review.id}'); adminReviewsModule.closeModal('reviewDetailsModal')">
                                    Reject Review
                                </button>
                            ` : ''}
                            ${review.status === 'rejected' ? `
                                <button class="btn btn-success" onclick="adminReviewsModule.approveReview('${contractorId}', '${review.id}'); adminReviewsModule.closeModal('reviewDetailsModal')">
                                    Approve Review
                                </button>
                            ` : ''}
                            <button class="btn" style="background: var(--accent-color); color: white;" 
                                    onclick="adminReviewsModule.deleteReview('${contractorId}', '${review.id}'); adminReviewsModule.closeModal('reviewDetailsModal')">
                                Delete Review
                            </button>
                        </div>
                    </div>
                `;
                
                modal.style.display = 'block';
            }
        }
    },

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }
};