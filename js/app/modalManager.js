// js/app/modalManager.js - UPDATED with category ratings
class ModalManager {
    constructor() {
        this.elements = {};
        this.eventHandlers = {
            onReviewRequest: null
        };
    }

    async init() {
        this.cacheElements();
        this.bindEvents();
    }

    cacheElements() {
        this.elements = {
            reviewModal: document.getElementById('reviewModal'),
            contractorModal: document.getElementById('contractorModal'),
            contractorDetails: document.getElementById('contractorDetails'),
            closeModal: document.getElementById('closeModal'),
            closeContractorModal: document.getElementById('closeContractorModal')
        };
    }

    bindEvents() {
        const { closeModal, closeContractorModal } = this.elements;
        
        if (closeModal) {
            closeModal.addEventListener('click', () => this.closeReviewModal());
        }
        
        if (closeContractorModal) {
            closeContractorModal.addEventListener('click', () => this.closeContractorModal());
        }

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });
    }

    onReviewRequest(callback) {
        this.eventHandlers.onReviewRequest = callback;
    }

    openContractorModal(contractorId) {
        const contractor = dataModule.getContractor(contractorId);
        if (!contractor) return;

        const { contractorDetails, contractorModal } = this.elements;
        contractorDetails.innerHTML = this.createContractorDetailsHTML(contractor);
        contractorModal.style.display = 'block';
    }

    closeContractorModal() {
        const { contractorModal } = this.elements;
        if (contractorModal) contractorModal.style.display = 'none';
    }

    openReviewModal(contractorId = null) {
        // Close other modals first
        this.closeContractorModal();
        
        if (contractorId && this.eventHandlers.onReviewRequest) {
            this.eventHandlers.onReviewRequest(contractorId);
        }
        
        const { reviewModal } = this.elements;
        if (reviewModal) reviewModal.style.display = 'block';
    }

    closeReviewModal() {
        const { reviewModal } = this.elements;
        if (reviewModal) reviewModal.style.display = 'none';
    }

    closeAllModals() {
        this.closeContractorModal();
        this.closeReviewModal();
    }

    // NEW: Get category averages for a contractor
    getCategoryAverages(contractor) {
        const approvedReviews = contractor.reviews.filter(review => 
            review.status === 'approved' && review.categoryRatings
        );
        
        if (approvedReviews.length === 0) {
            return {
                quality: 0,
                communication: 0,
                timeliness: 0,
                value: 0
            };
        }

        const totals = approvedReviews.reduce((acc, review) => {
            acc.quality += review.categoryRatings.quality || 0;
            acc.communication += review.categoryRatings.communication || 0;
            acc.timeliness += review.categoryRatings.timeliness || 0;
            acc.value += review.categoryRatings.value || 0;
            return acc;
        }, { quality: 0, communication: 0, timeliness: 0, value: 0 });

        const count = approvedReviews.length;
        return {
            quality: parseFloat((totals.quality / count).toFixed(1)),
            communication: parseFloat((totals.communication / count).toFixed(1)),
            timeliness: parseFloat((totals.timeliness / count).toFixed(1)),
            value: parseFloat((totals.value / count).toFixed(1))
        };
    }

    createContractorDetailsHTML(contractor) {
        const approvedReviews = contractor.reviews.filter(review => review.status === 'approved');
        const ratingValue = typeof contractor.rating === 'number' ? contractor.rating : parseFloat(contractor.rating) || 0;
        const ratingFormatted = !isNaN(ratingValue) ? ratingValue.toFixed(1) : '0.0';
        
        // Get category averages
        const categoryAverages = this.getCategoryAverages(contractor);
        const hasCategoryRatings = categoryAverages.quality > 0 || categoryAverages.communication > 0 || 
                                 categoryAverages.timeliness > 0 || categoryAverages.value > 0;

        return `
            <div class="contractor-details-main">
                <div class="contractor-header">
                    <h3>${contractor.name}</h3>
                    <p class="contractor-category">${contractor.category}</p>
                </div>

                <div class="contractor-info-grid">
                    <div class="info-item">
                        <strong>Email:</strong> ${contractor.email || 'Not provided'}
                    </div>
                    <div class="info-item">
                        <strong>Phone:</strong> ${contractor.phone || 'Not provided'}
                    </div>
                    <div class="info-item">
                        <strong>Service Area:</strong> ${contractor.location || 'Not specified'}
                    </div>
                    <div class="info-item">
                        <strong>Website:</strong> ${contractor.website ? `<a href="${contractor.website}" target="_blank">${contractor.website}</a>` : 'Not provided'}
                    </div>
                    <div class="info-item">
                        <strong>Overall Rating:</strong> ${ratingFormatted} ⭐
                    </div>
                    <div class="info-item">
                        <strong>Total Reviews:</strong> ${approvedReviews.length}
                    </div>
                </div>

                ${hasCategoryRatings ? `
                <div class="category-ratings-section">
                    <h4>Rating Breakdown</h4>
                    <div class="category-ratings-grid">
                        ${categoryAverages.quality > 0 ? `
                        <div class="category-rating-item">
                            <strong>Quality of Work:</strong>
                            <div class="category-rating-display">
                                <span class="stars">${'⭐'.repeat(Math.floor(categoryAverages.quality))}${categoryAverages.quality % 1 >= 0.5 ? '⭐' : ''}</span>
                                <span class="value">${categoryAverages.quality.toFixed(1)}</span>
                            </div>
                        </div>
                        ` : ''}
                        
                        ${categoryAverages.communication > 0 ? `
                        <div class="category-rating-item">
                            <strong>Communication:</strong>
                            <div class="category-rating-display">
                                <span class="stars">${'⭐'.repeat(Math.floor(categoryAverages.communication))}${categoryAverages.communication % 1 >= 0.5 ? '⭐' : ''}</span>
                                <span class="value">${categoryAverages.communication.toFixed(1)}</span>
                            </div>
                        </div>
                        ` : ''}
                        
                        ${categoryAverages.timeliness > 0 ? `
                        <div class="category-rating-item">
                            <strong>Timeliness:</strong>
                            <div class="category-rating-display">
                                <span class="stars">${'⭐'.repeat(Math.floor(categoryAverages.timeliness))}${categoryAverages.timeliness % 1 >= 0.5 ? '⭐' : ''}</span>
                                <span class="value">${categoryAverages.timeliness.toFixed(1)}</span>
                            </div>
                        </div>
                        ` : ''}
                        
                        ${categoryAverages.value > 0 ? `
                        <div class="category-rating-item">
                            <strong>Value for Money:</strong>
                            <div class="category-rating-display">
                                <span class="stars">${'⭐'.repeat(Math.floor(categoryAverages.value))}${categoryAverages.value % 1 >= 0.5 ? '⭐' : ''}</span>
                                <span class="value">${categoryAverages.value.toFixed(1)}</span>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>
                ` : ''}

                <div class="reviews-section">
                    <h4>Customer Reviews (${approvedReviews.length})</h4>
                    ${approvedReviews.length > 0 ? 
                        approvedReviews.map(review => {
                            const categoryRatings = review.categoryRatings || {};
                            const hasCategoryRatings = categoryRatings.quality || categoryRatings.communication || 
                                                     categoryRatings.timeliness || categoryRatings.value;
                            
                            return `
                            <div class="review-item">
                                <div class="review-header">
                                    <div class="reviewer-info">
                                        <span class="reviewer-name">${review.reviewerName}</span>
                                        <span class="rating">${'⭐'.repeat(review.rating)} (${review.rating}/5)</span>
                                    </div>
                                    <div class="review-meta">
                                        <span class="review-date">${dataModule.formatDate(review.date)}</span>
                                        ${review.projectType ? `<span class="project-type">${review.projectType}</span>` : ''}
                                    </div>
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
                            </div>
                            `;
                        }).join('') : 
                        '<p>No reviews yet. Be the first to review!</p>'
                    }
                </div>
                <div class="text-center" style="margin-top: var(--space-lg);">
                    <button class="btn btn-primary" onclick="app.closeModal('contractorModal'); app.showReviewForm('${contractor.id}')">
                        Leave a Review
                    </button>
                </div>
            </div>
        `;
    }
}