// js/app/modalManager.js - UPDATED for Material Design
// REFACTORED: Card-related logic moved to cardManager
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
            closeContractorModal: document.querySelector('.close-contractor-modal')
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

        // Close modals when clicking outside (Material Design backdrop)
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal') || e.target.classList.contains('material-modal')) {
                this.closeAllModals();
            }
        });

        // ESC key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
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
        
        // Close other modals first
        this.closeReviewModal();
        
        contractorDetails.innerHTML = this.createContractorDetailsHTML(contractor);
        
        // Use Material Design modal display
        if (contractorModal) {
            contractorModal.style.display = 'flex';
            contractorModal.setAttribute('aria-hidden', 'false');
            
            // Add animation class
            setTimeout(() => {
                contractorModal.classList.add('modal-visible');
            }, 10);
        }
    }

    closeContractorModal() {
        const { contractorModal } = this.elements;
        if (contractorModal) {
            contractorModal.style.display = 'none';
            contractorModal.setAttribute('aria-hidden', 'true');
            contractorModal.classList.remove('modal-visible');
        }
    }

    openReviewModal(contractorId = null) {
        // Close other modals first
        this.closeContractorModal();
        
        if (contractorId && this.eventHandlers.onReviewRequest) {
            this.eventHandlers.onReviewRequest(contractorId);
        }
        
        const { reviewModal } = this.elements;
        if (reviewModal) {
            reviewModal.style.display = 'flex';
            reviewModal.setAttribute('aria-hidden', 'false');
            
            // Add animation class
            setTimeout(() => {
                reviewModal.classList.add('modal-visible');
            }, 10);
            
            // Focus first input for accessibility
            const firstInput = reviewModal.querySelector('input, textarea, select');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }

    closeReviewModal() {
        const { reviewModal } = this.elements;
        if (reviewModal) {
            reviewModal.style.display = 'none';
            reviewModal.setAttribute('aria-hidden', 'true');
            reviewModal.classList.remove('modal-visible');
        }
    }

    closeAllModals() {
        this.closeContractorModal();
        this.closeReviewModal();
    }

    // Get category averages for a contractor
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

    // REFACTORED: Use cardManager for star display
    createStarDisplay(rating, maxStars = 5) {
        return cardManager.createStarDisplay(rating, maxStars);
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
            <div class="contractor-details">
                <div class="contractor-header">
                    <h3 class="contractor-name">${cardManager.escapeHtml(contractor.name)}</h3>
                    <p class="contractor-category">
                        <i class="material-icons">category</i>
                        ${cardManager.escapeHtml(contractor.category)}
                    </p>
                </div>

                <div class="contractor-info-grid">
                    <div class="info-item">
                        <strong class="info-label">
                            <i class="material-icons">email</i>
                            Email:
                        </strong> 
                        <span class="info-value">${cardManager.escapeHtml(contractor.email || 'Not provided')}</span>
                    </div>
                    <div class="info-item">
                        <strong class="info-label">
                            <i class="material-icons">phone</i>
                            Phone:
                        </strong> 
                        <span class="info-value">${cardManager.escapeHtml(contractor.phone || 'Not provided')}</span>
                    </div>
                    <div class="info-item">
                        <strong class="info-label">
                            <i class="material-icons">location_on</i>
                            Service Area:
                        </strong> 
                        <span class="info-value">${cardManager.escapeHtml(contractor.location || 'Not specified')}</span>
                    </div>
                    <div class="info-item">
                        <strong class="info-label">
                            <i class="material-icons">language</i>
                            Website:
                        </strong> 
                        <span class="info-value">
                            ${contractor.website ? 
                                `<a href="${cardManager.escapeHtml(contractor.website)}" target="_blank" class="website-link">
                                    <i class="material-icons">open_in_new</i>
                                    ${cardManager.escapeHtml(contractor.website)}
                                </a>` : 
                                'Not provided'
                            }
                        </span>
                    </div>
                    <div class="info-item">
                        <strong class="info-label">
                            <i class="material-icons">star</i>
                            Overall Rating:
                        </strong> 
                        <span class="info-value rating-value" style="background: transparent !important;">
                            ${this.createStarDisplay(ratingValue)}
                        </span>
                    </div>
                    <div class="info-item">
                        <strong class="info-label">
                            <i class="material-icons">reviews</i>
                            Total Reviews:
                        </strong> 
                        <span class="info-value">${approvedReviews.length}</span>
                    </div>
                </div>

                ${hasCategoryRatings ? `
                <div class="category-ratings-section">
                    <h4 class="section-title">
                        <i class="material-icons">assessment</i>
                        Rating Breakdown
                    </h4>
                    <div class="category-ratings-grid">
                        ${categoryAverages.quality > 0 ? `
                        <div class="category-rating-item">
                            <strong class="category-label">Quality of Work</strong>
                            <div class="category-rating-display" style="background: transparent !important; border: none !important;">
                                ${this.createStarDisplay(categoryAverages.quality)}
                            </div>
                        </div>
                        ` : ''}
                        
                        ${categoryAverages.communication > 0 ? `
                        <div class="category-rating-item">
                            <strong class="category-label">Communication</strong>
                            <div class="category-rating-display" style="background: transparent !important; border: none !important;">
                                ${this.createStarDisplay(categoryAverages.communication)}
                            </div>
                        </div>
                        ` : ''}
                        
                        ${categoryAverages.timeliness > 0 ? `
                        <div class="category-rating-item">
                            <strong class="category-label">Timeliness</strong>
                            <div class="category-rating-display" style="background: transparent !important; border: none !important;">
                                ${this.createStarDisplay(categoryAverages.timeliness)}
                            </div>
                        </div>
                        ` : ''}
                        
                        ${categoryAverages.value > 0 ? `
                        <div class="category-rating-item">
                            <strong class="category-label">Value for Money</strong>
                            <div class="category-rating-display" style="background: transparent !important; border: none !important;">
                                ${this.createStarDisplay(categoryAverages.value)}
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>
                ` : ''}

                <div class="reviews-section">
                    <h4 class="section-title">
                        <i class="material-icons">rate_review</i>
                        Customer Reviews (${approvedReviews.length})
                    </h4>
                    <div class="reviews-list">
                        ${approvedReviews.length > 0 ? 
                            approvedReviews.map(review => {
                                const categoryRatings = review.categoryRatings || {};
                                const hasCategoryRatings = categoryRatings.quality || categoryRatings.communication || 
                                                         categoryRatings.timeliness || categoryRatings.value;
                                
                                const categoryRatingsHTML = hasCategoryRatings ? `
                                    <div class="category-ratings-preview" style="background: transparent !important; border: none !important;">
                                        <strong>Category Ratings:</strong>
                                        ${categoryRatings.quality ? `Quality: ${this.createStarDisplay(categoryRatings.quality)}` : ''}
                                        ${categoryRatings.communication ? `Communication: ${this.createStarDisplay(categoryRatings.communication)}` : ''}
                                        ${categoryRatings.timeliness ? `Timeliness: ${this.createStarDisplay(categoryRatings.timeliness)}` : ''}
                                        ${categoryRatings.value ? `Value: ${this.createStarDisplay(categoryRatings.value)}` : ''}
                                    </div>
                                ` : '';
                                
                                return `
                                <div class="review-item">
                                    <div class="review-header">
                                        <div class="reviewer-info">
                                            <span class="reviewer-name">
                                                <i class="material-icons">person</i>
                                                ${cardManager.escapeHtml(review.reviewerName)}
                                            </span>
                                            <span class="review-rating" style="background: transparent !important; border: none !important;">
                                                ${this.createStarDisplay(review.rating)}
                                            </span>
                                        </div>
                                        <div class="review-meta">
                                            <span class="review-date">
                                                <i class="material-icons">calendar_today</i>
                                                ${dataModule.formatDate(review.date)}
                                            </span>
                                            ${review.projectType ? `
                                                <span class="project-type">
                                                    <i class="material-icons">handyman</i>
                                                    ${cardManager.escapeHtml(review.projectType)}
                                                </span>
                                            ` : ''}
                                        </div>
                                    </div>
                                    ${categoryRatingsHTML}
                                    <p class="review-comment">
                                        <i class="material-icons">format_quote</i>
                                        ${cardManager.escapeHtml(review.comment)}
                                    </p>
                                </div>
                                `;
                            }).join('') : 
                            `
                            <div class="no-reviews">
                                <i class="material-icons">rate_review</i>
                                <p>No reviews yet. Be the first to review!</p>
                            </div>
                            `
                        }
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button class="material-button contained primary" 
                            onclick="modalManager.closeContractorModal(); app.showReviewForm('${contractor.id}')">
                        <i class="material-icons">rate_review</i>
                        <span>Leave a Review</span>
                    </button>
                </div>
            </div>
        `;
    }

    // REFACTORED: Use cardManager for HTML escaping
    escapeHtml(unsafe) {
        return cardManager.escapeHtml(unsafe);
    }

    // NEW: Show loading state in modal
    showModalLoading(modalType) {
        const modal = this.elements[modalType];
        if (modal) {
            const content = modal.querySelector('.modal-body') || modal;
            content.innerHTML = `
                <div class="modal-loading">
                    <div class="loading-spinner"></div>
                    <p>Loading...</p>
                </div>
            `;
        }
    }

    // NEW: Show error state in modal
    showModalError(modalType, message) {
        const modal = this.elements[modalType];
        if (modal) {
            const content = modal.querySelector('.modal-body') || modal;
            content.innerHTML = `
                <div class="modal-error">
                    <i class="material-icons">error</i>
                    <h3>Error</h3>
                    <p>${cardManager.escapeHtml(message)}</p>
                    <button class="material-button contained" onclick="modalManager.closeAllModals()">
                        <i class="material-icons">close</i>
                        <span>Close</span>
                    </button>
                </div>
            `;
        }
    }
}

// Create global instance
const modalManager = new ModalManager();