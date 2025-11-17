// js/app/modals/contractorModalManager.js
// Contractor details modal specific functionality

export class ContractorModalManager {
    constructor(dataModule, reviewManager, cardManager, baseModalManager) {
        this.dataModule = dataModule;
        this.reviewManager = reviewManager;
        this.cardManager = cardManager;
        this.baseModalManager = baseModalManager;
        this.elements = {
            contractorDetails: document.getElementById('contractorDetails')
        };
    }

    openContractorModal(contractorId) {
        const contractor = this.dataModule.getContractor(contractorId);
        if (!contractor) return;

        const { contractorModal } = this.baseModalManager.elements;
        const { contractorDetails } = this.elements;
        
        if (!contractorDetails || !contractorModal) return;

        // Show loading state
        this.baseModalManager.showModalLoading(contractorModal);
        
        // Load content and open modal
        setTimeout(() => {
            contractorDetails.innerHTML = this.createContractorDetailsHTML(contractor);
            this.baseModalManager.openModal(contractorModal);
        }, 100);
    }

    // Get category averages for a contractor
    getCategoryAverages(contractorId) {
        const approvedReviews = this.reviewManager.getApprovedReviewsByContractor(contractorId).filter(review => 
            review.categoryRatings
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
        const approvedReviews = this.reviewManager.getApprovedReviewsByContractor(contractor.id);
        const ratingValue = typeof contractor.overallRating === 'number' ? contractor.overallRating : parseFloat(contractor.overallRating) || 0;
        const ratingFormatted = !isNaN(ratingValue) ? ratingValue.toFixed(1) : '0.0';
        
        // Get category averages
        const categoryAverages = this.getCategoryAverages(contractor.id);
        const hasCategoryRatings = categoryAverages.quality > 0 || categoryAverages.communication > 0 || 
                                 categoryAverages.timeliness > 0 || categoryAverages.value > 0;

        return `
            <div class="contractor-details">
                <div class="contractor-header">
                    <h3 class="contractor-name">${this.cardManager.escapeHtml(contractor.name)}</h3>
                    <p class="contractor-category">
                        <i class="material-icons">category</i>
                        ${this.cardManager.escapeHtml(contractor.category)}
                    </p>
                </div>

                <div class="contractor-info-grid">
                    <div class="info-item">
                        <strong class="info-label">
                            <i class="material-icons">email</i>
                            Email:
                        </strong> 
                        <span class="info-value">${this.cardManager.escapeHtml(contractor.email || 'Not provided')}</span>
                    </div>
                    <div class="info-item">
                        <strong class="info-label">
                            <i class="material-icons">phone</i>
                            Phone:
                        </strong> 
                        <span class="info-value">${this.cardManager.escapeHtml(contractor.phone || 'Not provided')}</span>
                    </div>
                    <div class="info-item">
                        <strong class="info-label">
                            <i class="material-icons">location_on</i>
                            Service Area:
                        </strong> 
                        <span class="info-value">${this.cardManager.escapeHtml(contractor.location || 'Not specified')}</span>
                    </div>
                    <div class="info-item">
                        <strong class="info-label">
                            <i class="material-icons">language</i>
                            Website:
                        </strong> 
                        <span class="info-value">
                            ${contractor.website ? 
                                `<a href="${this.cardManager.escapeHtml(contractor.website)}" target="_blank" class="website-link">
                                    <i class="material-icons">open_in_new</i>
                                    ${this.cardManager.escapeHtml(contractor.website)}
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
                            ${this.cardManager.createStarDisplay(ratingValue)}
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
                                ${this.cardManager.createStarDisplay(categoryAverages.quality)}
                            </div>
                        </div>
                        ` : ''}
                        
                        ${categoryAverages.communication > 0 ? `
                        <div class="category-rating-item">
                            <strong class="category-label">Communication</strong>
                            <div class="category-rating-display" style="background: transparent !important; border: none !important;">
                                ${this.cardManager.createStarDisplay(categoryAverages.communication)}
                            </div>
                        </div>
                        ` : ''}
                        
                        ${categoryAverages.timeliness > 0 ? `
                        <div class="category-rating-item">
                            <strong class="category-label">Timeliness</strong>
                            <div class="category-rating-display" style="background: transparent !important; border: none !important;">
                                ${this.cardManager.createStarDisplay(categoryAverages.timeliness)}
                            </div>
                        </div>
                        ` : ''}
                        
                        ${categoryAverages.value > 0 ? `
                        <div class="category-rating-item">
                            <strong class="category-label">Value for Money</strong>
                            <div class="category-rating-display" style="background: transparent !important; border: none !important;">
                                ${this.cardManager.createStarDisplay(categoryAverages.value)}
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
                                        ${categoryRatings.quality ? `Quality: ${this.cardManager.createStarDisplay(categoryRatings.quality)}` : ''}
                                        ${categoryRatings.communication ? `Communication: ${this.cardManager.createStarDisplay(categoryRatings.communication)}` : ''}
                                        ${categoryRatings.timeliness ? `Timeliness: ${this.cardManager.createStarDisplay(categoryRatings.timeliness)}` : ''}
                                        ${categoryRatings.value ? `Value: ${this.cardManager.createStarDisplay(categoryRatings.value)}` : ''}
                                    </div>
                                ` : '';
                                
                                return `
                                <div class="review-item">
                                    <div class="review-header">
                                        <div class="reviewer-info">
                                            <span class="reviewer-name">
                                                <i class="material-icons">person</i>
                                                ${this.cardManager.escapeHtml(review.reviewerName)}
                                            </span>
                                            <span class="review-rating" style="background: transparent !important; border: none !important;">
                                                ${this.cardManager.createStarDisplay(review.rating)}
                                            </span>
                                        </div>
                                        <div class="review-meta">
                                            <span class="review-date">
                                                <i class="material-icons">calendar_today</i>
                                                ${this.dataModule.formatDate(review.date)}
                                            </span>
                                            ${review.projectType ? `
                                                <span class="project-type">
                                                    <i class="material-icons">handyman</i>
                                                    ${this.cardManager.escapeHtml(review.projectType)}
                                                </span>
                                            ` : ''}
                                        </div>
                                    </div>
                                    ${categoryRatingsHTML}
                                    <p class="review-comment">
                                        <i class="material-icons">format_quote</i>
                                        ${this.cardManager.escapeHtml(review.comment)}
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
                    <button class="btn btn-primary contractor-review-btn" data-contractor-id="${contractor.id}">
                        <i class="material-icons">rate_review</i>
                        <span>Leave a Review</span>
                    </button>
                </div>
            </div>
        `;
    }

    bindContractorModalEvents(onReviewRequest) {
        // Delegate events for dynamically created buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.contractor-review-btn')) {
                const contractorId = e.target.closest('.contractor-review-btn').getAttribute('data-contractor-id');
                if (contractorId && onReviewRequest) {
                    onReviewRequest(contractorId);
                }
            }
        });
    }
}