// js/app/modals/contractorModalManager.js - MATERIAL DESIGN OVERHAUL
import { sanitizeHtml } from '../../modules/utilities.js';

export class ContractorModalManager {
    constructor(dataModule, reviewManager, cardManager, reviewModalManager) {
        this.dataModule = dataModule;
        this.reviewManager = reviewManager;
        this.cardManager = cardManager;
        this.reviewModalManager = reviewModalManager;
        this.modalElement = null;
        this.isOpen = false;
        this.currentContractorId = null;

        console.log('🔧 ContractorModalManager: Created with Material Design overhaul');
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

        // Update dialog title and subtitle with enhanced formatting
        this.updateDialogHeader(contractor);

        // Set contractor ID on review button
        const reviewBtn = this.modalElement.querySelector('.contractor-review-btn');
        if (reviewBtn) {
            if (this.reviewModalManager) {
                reviewBtn.setAttribute('data-contractor-id', contractorId);
                reviewBtn.style.display = 'flex';
            } else {
                reviewBtn.style.display = 'none';
            }
        }

        this.showModal();
        this.isOpen = true;
    }

    updateDialogHeader(contractor) {
        const approvedReviews = this.reviewManager.getApprovedReviewsByContractor(contractor.id);
        const ratingValue = typeof contractor.overallRating === 'number' ? contractor.overallRating : parseFloat(contractor.overallRating) || 0;
        const ratingFormatted = !isNaN(ratingValue) ? ratingValue.toFixed(1) : '0.0';

        const titleElement = this.modalElement.querySelector('.dialog-title');
        const subtitleElement = this.modalElement.querySelector('.dialog-subtitle');

        if (titleElement) {
            titleElement.textContent = contractor.name;
        }

        if (subtitleElement) {
            // Enhanced subtitle with badge-like formatting
            subtitleElement.innerHTML = this.createEnhancedSubtitleHTML(contractor.category, ratingFormatted, approvedReviews.length);
        }
    }

    createEnhancedSubtitleHTML(category, rating, reviewCount) {
        return `
            <span class="subtitle-badge category-badge">
                <i class="material-icons">work</i>
                ${sanitizeHtml(category)}
            </span>
            <span class="subtitle-badge rating-badge">
                <i class="material-icons">star</i>
                ${rating}
            </span>
            <span class="subtitle-badge reviews-badge">
                <i class="material-icons">reviews</i>
                ${reviewCount} review${reviewCount !== 1 ? 's' : ''}
            </span>
        `;
    }

    createModal() {
        // Create Material Design modal structure
        const modalHTML = `
            <div class="modal contractor-details-modal material-modal">
                <div class="modal-backdrop"></div>
                <div class="modal-content material-dialog">
                    <div class="modal-header material-dialog-header">
                        <div class="header-content">
                            <h2 class="dialog-title">Contractor Details</h2>
                            <div class="dialog-subtitle">
                                <!-- Enhanced subtitle with badges will be populated dynamically -->
                            </div>
                        </div>
                        <button class="material-icon-button close" aria-label="Close modal">
                            <i class="material-icons">close</i>
                        </button>
                    </div>
                    <div class="modal-body material-dialog-body">
                        <!-- Content will be populated dynamically -->
                    </div>
                    <div class="modal-footer material-dialog-actions">
                        <button class="mdc-button mdc-button--raised contractor-review-btn">
                            <span class="mdc-button__label">
                                <i class="material-icons mdc-button__icon">rate_review</i>
                                Leave a Review
                            </span>
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
            if (e.target === this.modalElement || e.target.classList.contains('modal-backdrop')) {
                this.close();
            }
        });

        // Review button
        const reviewBtn = this.modalElement.querySelector('.contractor-review-btn');
        if (reviewBtn && this.reviewModalManager) {
            reviewBtn.addEventListener('click', () => {
                console.log('🔧 ContractorModalManager: Review button clicked');
                const contractorId = this.getCurrentContractorId();

                if (contractorId && this.reviewModalManager) {
                    console.log('🔧 ContractorModalManager: Opening review modal for contractor:', contractorId);
                    this.close();
                    this.reviewModalManager.open(contractorId);
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
        document.body.style.overflow = 'hidden';

        // Add animation class
        setTimeout(() => {
            this.modalElement.classList.add('modal-open');
        }, 10);
    }

    close() {
        if (!this.modalElement || !this.isOpen) return;

        console.log('🔧 ContractorModalManager: Closing modal');
        this.modalElement.classList.remove('modal-open');

        setTimeout(() => {
            this.modalElement.style.display = 'none';
            document.body.style.overflow = '';
            this.isOpen = false;
            this.currentContractorId = null;
        }, 300);
    }

    // Event subscription methods
    onReviewRequest(callback) {
        console.log('🔧 ContractorModalManager: onReviewRequest callback set');
        return this;
    }

    onClose(callback) {
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

        // Get category averages
        const categoryAverages = this.getCategoryAverages(contractor.id);
        const hasCategoryRatings = categoryAverages.quality > 0 || categoryAverages.communication > 0 ||
            categoryAverages.timeliness > 0 || categoryAverages.value > 0;

        return `
            <div class="contractor-details material-details">
                <!-- HERO SECTION REMOVED - Information moved to dialog header -->

                <!-- Contact Information Section -->
                <div class="contact-section">
                    <h3 class="material-section-title">
                        <i class="material-icons">contact_page</i>
                        Contact Information
                    </h3>
                    <div class="material-list contact-list">
                        ${contractor.email ? this.createContactListItem('email', 'Email', contractor.email, 'mailto:' + contractor.email) : ''}
                        ${contractor.phone ? this.createContactListItem('phone', 'Phone', contractor.phone, 'tel:' + contractor.phone) : ''}
                        ${contractor.location ? this.createContactListItem('location_on', 'Service Area', contractor.location) : ''}
                        ${contractor.website ? this.createContactListItem('language', 'Website', this.formatWebsite(contractor.website), contractor.website, true) : ''}
                    </div>
                </div>

                <!-- Rating Breakdown Section -->
                ${hasCategoryRatings ? `
                <div class="ratings-section">
                    <h3 class="material-section-title">
                        <i class="material-icons">assessment</i>
                        Rating Breakdown
                    </h3>
                    <div class="material-card ratings-card">
                        <div class="ratings-grid">
                            ${categoryAverages.quality > 0 ? this.createMaterialRatingItem('Quality of Work', categoryAverages.quality, 'handyman') : ''}
                            ${categoryAverages.communication > 0 ? this.createMaterialRatingItem('Communication', categoryAverages.communication, 'chat') : ''}
                            ${categoryAverages.timeliness > 0 ? this.createMaterialRatingItem('Timeliness', categoryAverages.timeliness, 'schedule') : ''}
                            ${categoryAverages.value > 0 ? this.createMaterialRatingItem('Value for Money', categoryAverages.value, 'payments') : ''}
                        </div>
                    </div>
                </div>
                ` : ''}

                <!-- Reviews Section -->
                <div class="reviews-section">
                        <h3 class="material-section-title">
                            <i class="material-icons">rate_review</i>
                            Customer Reviews
                            <span class="reviews-count-badge">${approvedReviews.length}</span>
                        </h3>
                    
                    <div class="reviews-list material-list">
                        ${approvedReviews.length > 0 ?
                approvedReviews.map(review => this.createMaterialReviewItem(review)).join('') :
                this.createMaterialNoReviewsState()
            }
                    </div>
                </div>
            </div>
        `;
    }

    createContactListItem(icon, label, value, href = null, external = false) {
        const isClickable = href !== null;
        const tagName = isClickable ? 'a' : 'div';
        const attributes = isClickable ? `href="${href}" ${external ? 'target="_blank" rel="noopener"' : ''}` : '';
        const className = `material-list-item ${isClickable ? 'clickable' : ''}`;

        return `
            <${tagName} class="${className}" ${attributes}>
                <div class="list-item-icon">
                    <i class="material-icons">${icon}</i>
                </div>
                <div class="list-item-content">
                    <div class="list-item-primary">${label}</div>
                    <div class="list-item-secondary">${sanitizeHtml(value)}</div>
                </div>
                ${isClickable ? `
                <div class="list-item-trailing">
                    <i class="material-icons">${external ? 'open_in_new' : 'chevron_right'}</i>
                </div>
                ` : ''}
            </${tagName}>
        `;
    }

    createMaterialRatingItem(label, rating, icon) {
        const percentage = (rating / 5) * 100;

        return `
            <div class="material-rating-item">
                <div class="rating-item-header">
                    <div class="rating-item-info">
                        <i class="material-icons rating-item-icon">${icon}</i>
                        <span class="rating-item-label">${label}</span>
                    </div>
                    <div class="rating-item-value">
                        <span class="rating-number">${rating.toFixed(1)}</span>
                        <i class="material-icons">star</i>
                    </div>
                </div>
                <div class="material-rating-bar">
                    <div class="rating-bar-track"></div>
                    <div class="rating-bar-fill" style="width: ${percentage}%"></div>
                </div>
                <div class="rating-stars-mini">
                    ${this.cardManager ? this.cardManager.createStarDisplay(rating) : this.createFallbackStarDisplay(rating)}
                </div>
            </div>
        `;
    }

    createMaterialReviewItem(review) {
        const categoryRatings = review.categoryRatings || {};
        const hasCategoryRatings = categoryRatings.quality || categoryRatings.communication ||
            categoryRatings.timeliness || categoryRatings.value;

        return `
            <div class="material-review-item material-card">
                <div class="review-header">
                    <div class="reviewer-avatar-small">
                        ${review.reviewerName.charAt(0).toUpperCase()}
                    </div>
                    <div class="reviewer-info">
                        <div class="reviewer-main">
                            <span class="reviewer-name">${sanitizeHtml(review.reviewerName)}</span>
                            <div class="review-rating-stars">
                                ${this.cardManager ? this.cardManager.createStarDisplay(review.rating) : this.createFallbackStarDisplay(review.rating)}
                            </div>
                        </div>
                        <div class="review-meta">
                            <span class="review-date">
                                <i class="material-icons">schedule</i>
                                ${this.dataModule.formatDate(review.date)}
                            </span>
                            ${review.projectType ? `
                                <span class="project-type-chip material-chip">
                                    <i class="material-icons">handyman</i>
                                    ${sanitizeHtml(review.projectType)}
                                </span>
                            ` : ''}
                        </div>
                    </div>
                </div>
                
                ${hasCategoryRatings ? `
                <div class="review-category-ratings">
                    <div class="category-ratings-mini">
                        ${categoryRatings.quality ? `
                            <div class="category-rating-pill">
                                <span class="category-label">Quality</span>
                                <span class="category-stars">
                                    ${this.cardManager ? this.cardManager.createStarDisplay(categoryRatings.quality) : this.createFallbackStarDisplay(categoryRatings.quality)}
                                </span>
                            </div>
                        ` : ''}
                        ${categoryRatings.communication ? `
                            <div class="category-rating-pill">
                                <span class="category-label">Communication</span>
                                <span class="category-stars">
                                    ${this.cardManager ? this.cardManager.createStarDisplay(categoryRatings.communication) : this.createFallbackStarDisplay(categoryRatings.communication)}
                                </span>
                            </div>
                        ` : ''}
                        ${categoryRatings.timeliness ? `
                            <div class="category-rating-pill">
                                <span class="category-label">Timeliness</span>
                                <span class="category-stars">
                                    ${this.cardManager ? this.cardManager.createStarDisplay(categoryRatings.timeliness) : this.createFallbackStarDisplay(categoryRatings.timeliness)}
                                </span>
                            </div>
                        ` : ''}
                        ${categoryRatings.value ? `
                            <div class="category-rating-pill">
                                <span class="category-label">Value</span>
                                <span class="category-stars">
                                    ${this.cardManager ? this.cardManager.createStarDisplay(categoryRatings.value) : this.createFallbackStarDisplay(categoryRatings.value)}
                                </span>
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

    createMaterialNoReviewsState() {
        return `
            <div class="material-empty-state">
                <div class="empty-state-icon">
                    <i class="material-icons">rate_review</i>
                </div>
                <div class="empty-state-content">
                    <h4>No reviews yet</h4>
                    <p>Be the first to share your experience with this contractor!</p>
                </div>
            </div>
        `;
    }

    formatWebsite(website) {
        // Remove protocol for display
        return website.replace(/^https?:\/\//, '').replace(/\/$/, '');
    }

    // Fallback method for star display when cardManager is not available
    createFallbackStarDisplay(rating) {
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

        let stars = '';
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="material-icons star-icon">star</i>';
        }
        if (halfStar) {
            stars += '<i class="material-icons star-icon">star_half</i>';
        }
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="material-icons star-icon">star_border</i>';
        }
        return stars;
    }
}