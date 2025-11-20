// Admin Reviews Management - ES6 MODULE (SELF-CONTAINED WITH MODAL)
import { showNotification } from './notifications.js';
import { sanitizeHtml } from './utilities.js';

class AdminReviewsModule {
    constructor(dataModule) {
        this.dataModule = dataModule;
        this.reviewManager = dataModule.getReviewManager();
        this.initialized = false;
        this.reviewDetailsModal = null;
        this.modalEventListeners = [];
    }

    async init() {
        if (this.initialized) return;
        
        console.log('🔧 AdminReviewsModule initializing...');
        console.log('🔧 DataModule initialized:', this.dataModule.initialized);
        console.log('🔧 DataModule initializing:', this.dataModule.initializing);
        
        // Create modal before binding events
        this.createReviewDetailsModal();
        this.bindEvents();
        await this.renderReviews();
        this.initialized = true;
        console.log('✅ AdminReviewsModule initialized');
    }

    createReviewDetailsModal() {
        // Check if modal already exists
        if (this.reviewDetailsModal) {
            console.log('🔧 AdminReviewsModule: Modal already exists');
            return;
        }

        console.log('🔧 AdminReviewsModule: Creating review details modal...');

        const modalHTML = `
            <div class="modal" id="reviewDetailsModal" style="display: none;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Review Details</h2>
                        <button type="button" class="close" id="closeReviewDetailsModal" aria-label="Close dialog">
                            <span class="material-icons">close</span>
                        </button>
                    </div>
                    <div class="modal-body" id="reviewDetailsContent">
                        <!-- Review details will be loaded dynamically -->
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="cancelReviewDetailsModal">Close</button>
                        <div class="action-group" id="reviewModalActions">
                            <!-- Action buttons will be loaded dynamically -->
                        </div>
                    </div>
                </div>
            </div>
        `;

        try {
            // Insert modal HTML into the DOM
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            // Get reference to the modal
            this.reviewDetailsModal = document.getElementById('reviewDetailsModal');
            
            if (!this.reviewDetailsModal) {
                console.error('❌ AdminReviewsModule: Failed to create modal - element not found after insertion');
                return;
            }
            
            console.log('✅ AdminReviewsModule: Review details modal created successfully');
            
        } catch (error) {
            console.error('❌ AdminReviewsModule: Error creating modal:', error);
        }
    }

    bindEvents() {
        console.log('🔧 AdminReviewsModule: Binding events...');
        
        // Remove any existing event listeners to prevent duplicates
        this.removeEventListeners();
        
        // Search reviews
        const reviewSearch = document.getElementById('reviewSearch');
        if (reviewSearch) {
            const handler = (e) => {
                this.filterReviews();
            };
            reviewSearch.addEventListener('input', handler);
            this.modalEventListeners.push({ element: reviewSearch, event: 'input', handler });
        }

        // Service Provider filter
        const contractorFilter = document.getElementById('reviewContractorFilter');
        if (contractorFilter) {
            const handler = (e) => {
                this.filterReviews();
            };
            contractorFilter.addEventListener('change', handler);
            this.modalEventListeners.push({ element: contractorFilter, event: 'change', handler });
        }

        // Status filter
        const statusFilter = document.getElementById('reviewStatusFilter');
        if (statusFilter) {
            const handler = (e) => {
                this.filterReviews();
            };
            statusFilter.addEventListener('change', handler);
            this.modalEventListeners.push({ element: statusFilter, event: 'change', handler });
        }

        // Modal close events - bind after modal is created
        setTimeout(() => {
            const closeModalHandler = (e) => {
                console.log('🔧 AdminReviewsModule: Close button clicked');
                e.preventDefault();
                e.stopImmediatePropagation();
                this.closeModal('reviewDetailsModal');
            };

            // Close button in header
            const closeBtn = document.getElementById('closeReviewDetailsModal');
            if (closeBtn && !closeBtn.hasListener) {
                closeBtn.addEventListener('click', closeModalHandler, true);
                closeBtn.hasListener = true;
                this.modalEventListeners.push({ element: closeBtn, event: 'click', handler: closeModalHandler });
            }

            // Close button in footer
            const closeFooterBtn = document.getElementById('cancelReviewDetailsModal');
            if (closeFooterBtn && !closeFooterBtn.hasListener) {
                closeFooterBtn.addEventListener('click', closeModalHandler, true);
                closeFooterBtn.hasListener = true;
                this.modalEventListeners.push({ element: closeFooterBtn, event: 'click', handler: closeModalHandler });
            }
        }, 100);

        // Backdrop click to close modal
        const backdropHandler = (e) => {
            if (e.target === this.reviewDetailsModal) {
                console.log('🔧 AdminReviewsModule: Backdrop clicked');
                e.preventDefault();
                e.stopImmediatePropagation();
                this.closeModal('reviewDetailsModal');
            }
        };
        document.addEventListener('click', backdropHandler, true);
        this.modalEventListeners.push({ element: document, event: 'click', handler: backdropHandler });

        // Escape key to close modal
        const escapeHandler = (e) => {
            if (e.key === 'Escape' && this.reviewDetailsModal?.style.display === 'flex') {
                console.log('🔧 AdminReviewsModule: Escape key pressed');
                e.preventDefault();
                e.stopImmediatePropagation();
                this.closeModal('reviewDetailsModal');
            }
        };
        document.addEventListener('keydown', escapeHandler, true);
        this.modalEventListeners.push({ element: document, event: 'keydown', handler: escapeHandler });

        // Listen for reviews updated event (when contractor is deleted)
        const reviewsUpdatedHandler = () => {
            console.log('📢 AdminReviewsModule: Received reviewsUpdated event, refreshing...');
            this.refresh();
        };
        document.addEventListener('reviewsUpdated', reviewsUpdatedHandler);
        this.modalEventListeners.push({ element: document, event: 'reviewsUpdated', handler: reviewsUpdatedHandler });

        // Listen for data ready event
        const dataReadyHandler = () => {
            console.log('📢 AdminReviewsModule: Data is ready, initializing...');
            this.init();
        };
        document.addEventListener('dataReady', dataReadyHandler);
        this.modalEventListeners.push({ element: document, event: 'dataReady', handler: dataReadyHandler });

        console.log('✅ AdminReviewsModule: Events bound successfully');
    }

    removeEventListeners() {
        console.log('🔧 AdminReviewsModule: Removing existing event listeners');
        this.modalEventListeners.forEach(({ element, event, handler }) => {
            if (element && handler) {
                element.removeEventListener(event, handler);
            }
        });
        this.modalEventListeners = [];
    }

    async renderReviews() {
        console.log('🔄 AdminReviewsModule.renderReviews() called');
        await this.renderContractorFilter();
        await this.renderReviewsList();
        this.renderReviewStats();
    }

    // Populate contractor filter dropdown
    async renderContractorFilter() {
        const contractorFilter = document.getElementById('reviewContractorFilter');
        if (!contractorFilter) {
            console.error('❌ Service Provider filter element not found');
            return;
        }

        console.log('🔍 renderContractorFilter() - Starting...');
        
        // Ensure data is loaded
        console.log('🔍 Checking if dataModule is initialized...');
        await this.dataModule.ensureInitialized();
        console.log('🔍 DataModule initialization confirmed');
        
        const contractors = this.dataModule.getContractors();
        const currentValue = contractorFilter.value;
        
        console.log('🔍 Available contractors for filter:', contractors);
        console.log('🔍 Service Provider count:', contractors.length);
        
        if (contractors.length === 0) {
            console.warn('⚠️ No contractors found in dataModule');
        }
        
        contractorFilter.innerHTML = '<option value="all">All Contractors</option>';
        
        contractors.forEach(contractor => {
            if (contractor && contractor.id && contractor.name) {
                console.log(`🔍 Adding contractor to filter: ${contractor.name} (${contractor.id})`);
                contractorFilter.innerHTML += `<option value="${contractor.id}">${contractor.name}</option>`;
            } else {
                console.warn('⚠️ Invalid contractor found:', contractor);
            }
        });
        
        // Restore the selected value if it still exists
        if (currentValue && contractors.some(c => c && c.id === currentValue)) {
            contractorFilter.value = currentValue;
        }
        
        console.log('✅ Service Provider filter rendered');
    }

    async renderReviewsList(filteredReviews = null) {
        console.log('🔄 renderReviewsList() - Starting...');
        
        // Ensure data is loaded
        console.log('🔍 Ensuring dataModule is initialized...');
        await this.dataModule.ensureInitialized();
        console.log('🔍 DataModule initialization complete');
        
        // FIX: Use getReviewsWithContractorInfo instead of getAllReviews to get enhanced reviews with contractor info
        const reviews = filteredReviews || this.reviewManager.getReviewsWithContractorInfo();
        const contractors = this.dataModule.getContractors();
        const container = document.getElementById('reviewsList');
        
        if (!container) {
            console.error('❌ Reviews list container not found');
            return;
        }

        console.log('🔍 Reviews data:', reviews);
        console.log('🔍 Reviews count:', reviews.length);
        console.log('🔍 Contractors data:', contractors);
        console.log('🔍 Contractors count:', contractors.length);

        // Sort reviews by date (newest first)
        reviews.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (reviews.length === 0) {
            console.log('📝 No reviews to display');
            container.innerHTML = `
                <div class="no-reviews">
                    <p>No reviews found matching your criteria.</p>
                </div>
            `;
            return;
        }
        
        console.log('📝 Rendering reviews list with', reviews.length, 'reviews');
        
        container.innerHTML = reviews.map(review => {
            const statusClass = this.getStatusClass(review.status);
            const statusLabel = this.getStatusLabel(review.status);
            
            // FIX: Use the enhanced review data that already has contractor info
            // The getReviewsWithContractorInfo() method adds contractorName and contractorCategory
            const contractorName = review.contractorName || 'Unknown Service Provider';
            const contractorCategory = review.contractorCategory || 'Unknown Category';
            
            console.log(`🔍 Review ${review.id}: contractorId=${review.contractor_id}, contractorName:`, contractorName);
            
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
                        <strong>Service Provider:</strong> ${sanitizeHtml(contractorName)} (${sanitizeHtml(contractorCategory)})
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
                            <button class="btn btn-success btn-small btn-icon" onclick="adminModule.approveReview('${review.id}')" title="Approve Review">
                                <span class="material-icons">check_circle</span>
                            </button>
                            <button class="btn btn-warning btn-small btn-icon" onclick="adminModule.rejectReview('${review.id}')" title="Reject Review">
                                <span class="material-icons">cancel</span>
                            </button>
                        ` : ''}
                        ${review.status === 'approved' ? `
                            <button class="btn btn-warning btn-small btn-icon" onclick="adminModule.rejectReview('${review.id}')" title="Reject Review">
                                <span class="material-icons">block</span>
                            </button>
                        ` : ''}
                        ${review.status === 'rejected' ? `
                            <button class="btn btn-success btn-small btn-icon" onclick="adminModule.approveReview('${review.id}')" title="Approve Review">
                                <span class="material-icons">check_circle</span>
                            </button>
                        ` : ''}
                        <button class="btn btn-secondary btn-small btn-icon" onclick="adminModule.viewReview('${review.contractor_id}', '${review.id}')" title="View Details">
                            <span class="material-icons">visibility</span>
                        </button>
                        <button class="btn btn-danger btn-small btn-icon" 
                                onclick="adminModule.deleteReview('${review.id}')"
                                title="Delete Review">
                            <span class="material-icons">delete</span>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        console.log('✅ Reviews list rendered successfully');
    }

    renderReviewStats() {
        console.log('📊 renderReviewStats() - Starting...');
        
        const allReviews = this.dataModule.getAllReviews();
        
        console.log('📊 All reviews for stats:', allReviews);
        
        const stats = {
            totalReviews: allReviews.length,
            approvedReviews: allReviews.filter(r => r.status === 'approved').length,
            pendingReviews: allReviews.filter(r => r.status === 'pending').length,
            rejectedReviews: allReviews.filter(r => r.status === 'rejected').length
        };
        
        console.log('📊 Calculated stats:', stats);
        
        const totalReviewsEl = document.getElementById('totalReviewsCount');
        const approvedReviewsEl = document.getElementById('approvedReviewsCount');
        const pendingReviewsEl = document.getElementById('pendingReviewsCount');
        const rejectedReviewsEl = document.getElementById('rejectedReviewsCount');
        
        if (totalReviewsEl) {
            totalReviewsEl.textContent = stats.totalReviews;
            console.log('📊 Set total reviews:', stats.totalReviews);
        }
        if (approvedReviewsEl) {
            approvedReviewsEl.textContent = stats.approvedReviews;
            console.log('📊 Set approved reviews:', stats.approvedReviews);
        }
        if (pendingReviewsEl) {
            pendingReviewsEl.textContent = stats.pendingReviews;
            console.log('📊 Set pending reviews:', stats.pendingReviews);
        }
        if (rejectedReviewsEl) {
            rejectedReviewsEl.textContent = stats.rejectedReviews;
            console.log('📊 Set rejected reviews:', stats.rejectedReviews);
        }

        console.log('✅ Review stats updated');
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

    async filterReviews() {
        console.log('🔍 filterReviews() - Starting...');
        
        const searchTerm = document.getElementById('reviewSearch')?.value || '';
        const statusFilter = document.getElementById('reviewStatusFilter')?.value || 'all';
        const contractorFilter = document.getElementById('reviewContractorFilter')?.value || 'all';
        
        console.log('🔍 Filter criteria:', { searchTerm, statusFilter, contractorFilter });
        
        // Ensure data is loaded
        await this.dataModule.ensureInitialized();
        
        // FIX: Use searchReviews which already uses getReviewsWithContractorInfo
        let filteredReviews = this.reviewManager.searchReviews(searchTerm, statusFilter);
        
        console.log('🔍 Reviews after search filter:', filteredReviews.length);
        
        // Apply contractor filter
        if (contractorFilter && contractorFilter !== 'all') {
            filteredReviews = filteredReviews.filter(review => review.contractor_id === contractorFilter);
            console.log('🔍 Reviews after contractor filter:', filteredReviews.length);
        }
        
        await this.renderReviewsList(filteredReviews);
        console.log('✅ Filter applied successfully');
    }

    async approveReview(reviewId) {
        console.log(`✅ Approving review: ${reviewId}`);
        if (confirm('Are you sure you want to approve this review? It will become visible to users and affect contractor ratings.')) {
            try {
                const success = await this.dataModule.updateReviewStatus(reviewId, 'approved');
                if (success) {
                    showNotification('Review approved successfully!', 'success');
                    await this.renderReviews();
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
        console.log(`❌ Rejecting review: ${reviewId}`);
        if (confirm('Are you sure you want to reject this review? It will be hidden from users.')) {
            try {
                const success = await this.dataModule.updateReviewStatus(reviewId, 'rejected');
                if (success) {
                    showNotification('Review rejected successfully!', 'success');
                    await this.renderReviews();
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
        console.log(`🗑️ Deleting review: ${reviewId}`);
        if (confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
            try {
                const success = await this.dataModule.deleteReview(reviewId);
                if (success) {
                    showNotification('Review deleted successfully!', 'success');
                    await this.renderReviews();
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

    async viewReview(contractorId, reviewId) {
        console.log(`👀 Viewing review: ${reviewId} for contractor: ${contractorId}`);
        
        // Ensure modal is created
        this.createReviewDetailsModal();
        
        if (!this.reviewDetailsModal) {
            console.error('❌ AdminReviewsModule: Review details modal not available');
            showNotification('Failed to open review details. Please refresh the page.', 'error');
            return;
        }

        // Ensure data is loaded
        await this.dataModule.ensureInitialized();
        
        const contractor = this.dataModule.getContractor(contractorId);
        // FIX: Use getReviewsWithContractorInfo to get enhanced review data
        const allReviews = this.reviewManager.getReviewsWithContractorInfo();
        const review = allReviews.find(r => r.id === reviewId);
        
        console.log('🔍 Service Provider lookup result:', contractor);
        console.log('🔍 Review lookup result:', review);
        
        if (!review) {
            console.error('Review not found:', reviewId);
            showNotification('Review not found', 'error');
            return;
        }

        const content = document.getElementById('reviewDetailsContent');
        const actions = document.getElementById('reviewModalActions');
        
        const statusClass = this.getStatusClass(review.status);
        const statusLabel = this.getStatusLabel(review.status);
        
        // Get category ratings if they exist
        const categoryRatings = review.categoryRatings || {};
        const hasCategoryRatings = categoryRatings.quality || categoryRatings.communication || 
                                 categoryRatings.timeliness || categoryRatings.value;
        
        // Handle missing contractor gracefully
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

        // Determine which action buttons to show based on review status
        let actionButtons = '';
        if (review.status === 'pending') {
            actionButtons = `
                <button class="btn btn-success" onclick="adminModule.approveReview('${review.id}'); adminModule.closeModal('reviewDetailsModal')">
                    Approve
                </button>
                <button class="btn btn-warning" onclick="adminModule.rejectReview('${review.id}'); adminModule.closeModal('reviewDetailsModal')">
                    Reject
                </button>
            `;
        } else if (review.status === 'approved') {
            actionButtons = `
                <button class="btn btn-warning" onclick="adminModule.rejectReview('${review.id}'); adminModule.closeModal('reviewDetailsModal')">
                    Reject
                </button>
            `;
        } else if (review.status === 'rejected') {
            actionButtons = `
                <button class="btn btn-success" onclick="adminModule.approveReview('${review.id}'); adminModule.closeModal('reviewDetailsModal')">
                    Approve
                </button>
            `;
        }
        
        // Add delete button to actions
        actionButtons += `
            <button class="btn btn-danger" onclick="adminModule.deleteReview('${review.id}'); adminModule.closeModal('reviewDetailsModal')">
                Delete
            </button>
        `;

        // Set the modal content
        content.innerHTML = `
            <div class="review-details">
                <div class="detail-group">
                    <h3>Review Information</h3>
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
                
                ${hasCategoryRatings ? `
                <div class="detail-group">
                    <h3>Category Ratings</h3>
                    ${categoryRatings.quality ? `
                    <div class="detail-item">
                        <strong>Quality of Work:</strong> ${this.generateStarIcons(categoryRatings.quality)} (${categoryRatings.quality}/5)
                    </div>
                    ` : ''}
                    ${categoryRatings.communication ? `
                    <div class="detail-item">
                        <strong>Communication:</strong> ${this.generateStarIcons(categoryRatings.communication)} (${categoryRatings.communication}/5)
                    </div>
                    ` : ''}
                    ${categoryRatings.timeliness ? `
                    <div class="detail-item">
                        <strong>Timeliness:</strong> ${this.generateStarIcons(categoryRatings.timeliness)} (${categoryRatings.timeliness}/5)
                    </div>
                    ` : ''}
                    ${categoryRatings.value ? `
                    <div class="detail-item">
                        <strong>Value for Money:</strong> ${this.generateStarIcons(categoryRatings.value)} (${categoryRatings.value}/5)
                    </div>
                    ` : ''}
                </div>
                ` : ''}
                
                ${contractorInfo}
                
                <div class="detail-group">
                    <h3>Review Comment</h3>
                    <div class="review-comment">
                        <p>${sanitizeHtml(review.comment)}</p>
                    </div>
                </div>
            </div>
        `;

        // Set the action buttons in the footer
        actions.innerHTML = actionButtons;
        
        // Show the modal
        this.reviewDetailsModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        console.log('✅ Review details modal opened');
    }

    closeModal(modalId) {
        console.log(`❌ Closing modal: ${modalId}`);
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    // Utility methods
    generateStarIcons(rating) {
        return '⭐'.repeat(rating);
    }

    triggerStatsUpdate() {
        console.log('📊 Triggering stats update...');
        // Dispatch event to update main admin stats
        document.dispatchEvent(new CustomEvent('adminDataUpdated'));
    }

    // Refresh all data
    async refresh() {
        console.log('🔄 Refreshing admin reviews data...');
        // Force refresh the review manager first
        await this.dataModule.getReviewManager().refresh();
        // Then refresh our display
        await this.renderReviews();
        console.log('✅ Admin reviews data refreshed');
    }

    // Cleanup method
    destroy() {
        this.removeEventListeners();
        if (this.reviewDetailsModal) {
            this.reviewDetailsModal.remove();
            this.reviewDetailsModal = null;
        }
    }
}

export default AdminReviewsModule;