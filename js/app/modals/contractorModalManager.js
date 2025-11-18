// js/app/modals/contractorModalManager.js - UPDATED WITH DIRECT REVIEW MODAL ACCESS
import { sanitizeHtml } from '../../modules/utilities.js';

export class ContractorModalManager {
    constructor(dataModule, reviewManager, cardManager, reviewModalManager) {
        this.dataModule = dataModule;
        this.reviewManager = reviewManager;
        this.cardManager = cardManager; // Keep for createStarDisplay method
        this.reviewModalManager = reviewModalManager; // Store reference to review modal manager
        this.modalElement = null;
        this.isOpen = false;
        this.currentContractorId = null;
        
        console.log('🔧 ContractorModalManager: Created with reviewModalManager:', !!this.reviewModalManager);
    }

    open(contractorId) {
        console.log('🔧 ContractorModalManager: Opening modal for contractor:', contractorId);
        const contractor = this.dataModule.getContractor(contractorId);
        if (!contractor) {
            console.error('Contractor not found:', contractorId);
            return;
        }

        this.currentContractorId = contractorId;

        if (!this.modalElement) {
            this.createModal();
        }

        this.modalElement.querySelector('.modal-body').innerHTML = this.createContractorDetailsHTML(contractor);
        
        // Set contractor ID on review button only if review modal manager is available
        const reviewBtn = this.modalElement.querySelector('.contractor-review-btn');
        if (reviewBtn) {
            if (this.reviewModalManager) {
                reviewBtn.setAttribute('data-contractor-id', contractorId);
                reviewBtn.style.display = 'flex'; // Show the button
            } else {
                reviewBtn.style.display = 'none'; // Hide the button
            }
        }
        
        this.showModal();
        this.isOpen = true;
    }

    createModal() {
        // Create modal structure from scratch
        const modalHTML = `
            <div class="modal contractor-details-modal">
                <div class="modal-content fullscreen">
                    <div class="modal-header">
                        <h2>Contractor Details</h2>
                        <button class="close" aria-label="Close modal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <!-- Content will be populated dynamically -->
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-primary contractor-review-btn">
                            <i class="material-icons">rate_review</i>
                            <span>Leave a Review</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        const template = document.createElement('template');
        template.innerHTML = modalHTML.trim();
        this.modalElement = template.content.firstChild;
        document.body.appendChild(this.modalElement);
        this.bindModalEvents();
    }

    bindModalEvents() {
        if (!this.modalElement) return;

        // Close button
        const closeBtn = this.modalElement.querySelector('.close');
        closeBtn.addEventListener('click', () => this.close());

        // Backdrop click
        this.modalElement.addEventListener('click', (e) => {
            if (e.target === this.modalElement) this.close();
        });

        // Review button - Only bind if review modal manager is available
        const reviewBtn = this.modalElement.querySelector('.contractor-review-btn');
        if (reviewBtn && this.reviewModalManager) {
            reviewBtn.addEventListener('click', () => {
                console.log('🔧 ContractorModalManager: Review button clicked');
                const contractorId = this.getCurrentContractorId();
                console.log('🔧 ContractorModalManager: Current contractor ID:', contractorId);
                console.log('🔧 ContractorModalManager: Review modal manager available:', !!this.reviewModalManager);
                
                if (contractorId && this.reviewModalManager) {
                    console.log('🔧 ContractorModalManager: Opening review modal directly for contractor:', contractorId);
                    this.close(); // Close contractor modal
                    this.reviewModalManager.open(contractorId); // Directly open review modal
                } else {
                    console.error('🔧 ContractorModalManager: Cannot open review modal - missing contractor ID or review modal manager');
                }
            });
        }

        // Escape key
        document.addEventListener('keydown', this.handleKeydown.bind(this));
    }

    handleKeydown(e) {
        if (this.isOpen && e.key === 'Escape') {
            this.close();
        }
    }

    getCurrentContractorId() {
        // Return the stored contractor ID or try to get it from the button
        if (this.currentContractorId) {
            return this.currentContractorId;
        }
        
        const reviewBtn = this.modalElement.querySelector('.contractor-review-btn');
        return reviewBtn ? reviewBtn.getAttribute('data-contractor-id') : null;
    }

    showModal() {
        if (!this.modalElement) return;

        console.log('🔧 ContractorModalManager: Showing modal');
        this.modalElement.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
        
        // Add animation class
        setTimeout(() => {
            this.modalElement.classList.add('modal-open');
            console.log('🔧 ContractorModalManager: modal-open class added');
        }, 10);
    }

    close() {
        if (!this.modalElement || !this.isOpen) return;

        console.log('🔧 ContractorModalManager: Closing modal');
        this.modalElement.classList.remove('modal-open');
        
        setTimeout(() => {
            this.modalElement.style.display = 'none';
            document.body.style.overflow = ''; // Restore scrolling
            this.isOpen = false;
            this.currentContractorId = null; // Clear current contractor
            console.log('🔧 ContractorModalManager: Modal closed');
        }, 300); // Match CSS transition duration
    }

    // Event subscription methods (kept for compatibility, but not used in simplified approach)
    onReviewRequest(callback) {
        console.log('🔧 ContractorModalManager: onReviewRequest callback set (not used in simplified approach)');
        // This is kept for compatibility but won't be used in the simplified approach
        return this;
    }

    onClose(callback) {
        // This is kept for compatibility but won't be used in the simplified approach
        return this;
    }

    // Cleanup
    destroy() {
        if (this.modalElement) {
            document.removeEventListener('keydown', this.handleKeydown.bind(this));
            this.modalElement.remove();
            this.modalElement = null;
        }
        this.isOpen = false;
    }

    // The existing content creation methods remain the same
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
                <!-- Enhanced Header Section -->
                <div class="contractor-header">
                    <div class="contractor-avatar">
                        <div class="avatar-circle">
                            ${contractor.name.charAt(0).toUpperCase()}
                        </div>
                    </div>
                    <div class="contractor-main-info">
                        <h1 class="contractor-name">${sanitizeHtml(contractor.name)}</h1>
                        <div class="contractor-meta">
                            <span class="contractor-category">
                                <i class="material-icons">work</i>
                                ${sanitizeHtml(contractor.category)}
                            </span>
                            <span class="contractor-rating-badge">
                                <i class="material-icons">star</i>
                                ${ratingFormatted}
                            </span>
                            <span class="contractor-reviews-count">
                                <i class="material-icons">reviews</i>
                                ${approvedReviews.length} review${approvedReviews.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Contact Information Grid -->
                <div class="contact-info-section">
                    <h3 class="section-title">
                        <i class="material-icons">contact_page</i>
                        Contact Information
                    </h3>
                    <div class="contact-info-grid">
                        <div class="contact-item">
                            <div class="contact-icon">
                                <i class="material-icons">email</i>
                            </div>
                            <div class="contact-details">
                                <span class="contact-label">Email</span>
                                <span class="contact-value">${sanitizeHtml(contractor.email || 'Not provided')}</span>
                            </div>
                        </div>
                        
                        <div class="contact-item">
                            <div class="contact-icon">
                                <i class="material-icons">phone</i>
                            </div>
                            <div class="contact-details">
                                <span class="contact-label">Phone</span>
                                <span class="contact-value">${sanitizeHtml(contractor.phone || 'Not provided')}</span>
                            </div>
                        </div>
                        
                        <div class="contact-item">
                            <div class="contact-icon">
                                <i class="material-icons">location_on</i>
                            </div>
                            <div class="contact-details">
                                <span class="contact-label">Service Area</span>
                                <span class="contact-value">${sanitizeHtml(contractor.location || 'Not specified')}</span>
                            </div>
                        </div>
                        
                        ${contractor.website ? `
                        <div class="contact-item">
                            <div class="contact-icon">
                                <i class="material-icons">language</i>
                            </div>
                            <div class="contact-details">
                                <span class="contact-label">Website</span>
                                <a href="${sanitizeHtml(contractor.website)}" target="_blank" class="website-link">
                                    ${sanitizeHtml(contractor.website)}
                                    <i class="material-icons">open_in_new</i>
                                </a>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>

                <!-- Rating Breakdown Section -->
                ${hasCategoryRatings ? `
                <div class="ratings-breakdown-section">
                    <h3 class="section-title">
                        <i class="material-icons">assessment</i>
                        Rating Breakdown
                    </h3>
                    <div class="ratings-grid">
                        ${categoryAverages.quality > 0 ? this.createRatingItem('Quality of Work', categoryAverages.quality) : ''}
                        ${categoryAverages.communication > 0 ? this.createRatingItem('Communication', categoryAverages.communication) : ''}
                        ${categoryAverages.timeliness > 0 ? this.createRatingItem('Timeliness', categoryAverages.timeliness) : ''}
                        ${categoryAverages.value > 0 ? this.createRatingItem('Value for Money', categoryAverages.value) : ''}
                    </div>
                </div>
                ` : ''}

                <!-- Reviews Section -->
                <div class="reviews-section">
                    <div class="reviews-header">
                        <h3 class="section-title">
                            <i class="material-icons">rate_review</i>
                            Customer Reviews
                        </h3>
                        <span class="reviews-count">${approvedReviews.length} review${approvedReviews.length !== 1 ? 's' : ''}</span>
                    </div>
                    
                    <div class="reviews-list">
                        ${approvedReviews.length > 0 ? 
                            approvedReviews.map(review => this.createReviewItem(review)).join('') : 
                            this.createNoReviewsState()
                        }
                    </div>
                </div>
            </div>
        `;
    }

    createRatingItem(label, rating) {
        return `
            <div class="rating-item">
                <div class="rating-info">
                    <span class="rating-label">${label}</span>
                    <span class="rating-value">${rating.toFixed(1)}</span>
                </div>
                <div class="rating-bar">
                    <div class="rating-fill" style="width: ${(rating / 5) * 100}%"></div>
                </div>
                <div class="rating-stars">
                    ${this.cardManager ? this.cardManager.createStarDisplay(rating) : this.createFallbackStarDisplay(rating)}
                </div>
            </div>
        `;
    }

    createReviewItem(review) {
        const categoryRatings = review.categoryRatings || {};
        const hasCategoryRatings = categoryRatings.quality || categoryRatings.communication || 
                                 categoryRatings.timeliness || categoryRatings.value;

        return `
            <div class="review-item">
                <div class="review-header">
                    <div class="reviewer-avatar">
                        ${review.reviewerName.charAt(0).toUpperCase()}
                    </div>
                    <div class="reviewer-info">
                        <div class="reviewer-main">
                            <span class="reviewer-name">${sanitizeHtml(review.reviewerName)}</span>
                            <div class="review-rating">
                                ${this.cardManager ? this.cardManager.createStarDisplay(review.rating) : this.createFallbackStarDisplay(review.rating)}
                            </div>
                        </div>
                        <div class="review-meta">
                            <span class="review-date">
                                <i class="material-icons">schedule</i>
                                ${this.dataModule.formatDate(review.date)}
                            </span>
                            ${review.projectType ? `
                                <span class="project-type">
                                    <i class="material-icons">handyman</i>
                                    ${sanitizeHtml(review.projectType)}
                                </span>
                            ` : ''}
                        </div>
                    </div>
                </div>
                
                ${hasCategoryRatings ? `
                <div class="review-category-ratings">
                    <div class="category-ratings-grid">
                        ${categoryRatings.quality ? `
                            <div class="category-rating-mini">
                                <span class="category-label">Quality</span>
                                ${this.cardManager ? this.cardManager.createStarDisplay(categoryRatings.quality) : this.createFallbackStarDisplay(categoryRatings.quality)}
                            </div>
                        ` : ''}
                        ${categoryRatings.communication ? `
                            <div class="category-rating-mini">
                                <span class="category-label">Communication</span>
                                ${this.cardManager ? this.cardManager.createStarDisplay(categoryRatings.communication) : this.createFallbackStarDisplay(categoryRatings.communication)}
                            </div>
                        ` : ''}
                        ${categoryRatings.timeliness ? `
                            <div class="category-rating-mini">
                                <span class="category-label">Timeliness</span>
                                ${this.cardManager ? this.cardManager.createStarDisplay(categoryRatings.timeliness) : this.createFallbackStarDisplay(categoryRatings.timeliness)}
                            </div>
                        ` : ''}
                        ${categoryRatings.value ? `
                            <div class="category-rating-mini">
                                <span class="category-label">Value</span>
                                ${this.cardManager ? this.cardManager.createStarDisplay(categoryRatings.value) : this.createFallbackStarDisplay(categoryRatings.value)}
                            </div>
                        ` : ''}
                    </div>
                </div>
                ` : ''}
                
                <div class="review-content">
                    <p class="review-comment">${sanitizeHtml(review.comment)}</p>
                </div>
            </div>
        `;
    }

    createNoReviewsState() {
        return `
            <div class="no-reviews-state">
                <div class="no-reviews-icon">
                    <i class="material-icons">rate_review</i>
                </div>
                <div class="no-reviews-content">
                    <h4>No reviews yet</h4>
                    <p>Be the first to share your experience with this contractor!</p>
                </div>
            </div>
        `;
    }

    // Fallback method for star display when cardManager is not available
    createFallbackStarDisplay(rating) {
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
        
        let stars = '';
        for (let i = 0; i < fullStars; i++) {
            stars += '⭐';
        }
        if (halfStar) {
            stars += '⭐'; // Using full star as fallback for half stars
        }
        for (let i = 0; i < emptyStars; i++) {
            stars += '☆';
        }
        return stars;
    }
}