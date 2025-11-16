// js/modules/cardManager.js

// Card Manager Module - Handles all card rendering and card-related components
class CardManager {
    constructor(dataModule, reviewManager, favoritesManager) {
        this.dataModule = dataModule;
        this.reviewManager = reviewManager;
        this.favoritesManager = favoritesManager;
        
        console.log('🔧 CardManager initialized with dependencies:', {
            hasDataModule: !!dataModule,
            hasReviewManager: !!reviewManager,
            hasFavoritesManager: !!favoritesManager
        });
    }

    /**
     * Create contractor card HTML
     * @param {Object} contractor - Contractor data object
     * @returns {string} HTML string for the contractor card
     */
    createContractorCard(contractor) {
        // Use injected dependencies instead of globals
        const approvedReviews = this.reviewManager.getApprovedReviewsByContractor(contractor.id);
        const displayRating = approvedReviews.length > 0 ? 
            this.dataModule.calculateAverageRating(approvedReviews) : 0;
        
        const ratingValue = typeof displayRating === 'number' ? displayRating : parseFloat(displayRating) || 0;
        const displayRatingFormatted = !isNaN(ratingValue) ? ratingValue.toFixed(1) : '0.0';
        const isFavorite = this.dataModule.isFavorite(contractor.id);

        // Create star display
        const fullStars = Math.floor(ratingValue);
        const hasHalfStar = ratingValue % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        return `
            <div class="card contractor-card material-card" onclick="app.showContractorDetails('${this.escapeHtml(contractor.id)}')">
                <div class="card-header">
                    <button class="favorite-btn ${isFavorite ? 'favorited' : ''}" 
                            data-contractor-id="${this.escapeHtml(contractor.id)}"
                            onclick="toggleFavorite('${this.escapeHtml(contractor.id)}'); event.stopPropagation();"
                            title="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
                        <i class="material-icons">${isFavorite ? 'favorite' : 'favorite_border'}</i>
                    </button>
                </div>
                <div class="card-body">
                    <h3 class="contractor-name">${this.escapeHtml(contractor.name)}</h3>
                    <p class="contractor-category">
                        <i class="material-icons">category</i>
                        ${this.escapeHtml(contractor.category)}
                    </p>
                    <p class="contractor-location">
                        <i class="material-icons">location_on</i>
                        ${this.escapeHtml(contractor.location || 'Service area not specified')}
                    </p>
                    <div class="card-rating">
                        <span class="rating-stars">
                            ${'<span class="rating-star active">★</span>'.repeat(fullStars)}
                            ${hasHalfStar ? '<span class="rating-star active half">★</span>' : ''}
                            ${'<span class="rating-star">★</span>'.repeat(emptyStars)}
                        </span>
                        <span class="rating-value">${displayRatingFormatted}</span>
                    </div>
                    <p class="review-count">
                        <i class="material-icons">reviews</i>
                        ${approvedReviews.length} review${approvedReviews.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <div class="card-footer">
                    <button class="btn btn-primary" 
                            onclick="app.showReviewForm('${this.escapeHtml(contractor.id)}'); event.stopPropagation();">
                        <i class="material-icons">rate_review</i>
                        <span>Leave Review</span>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Create star display component (reusable)
     * @param {number} rating - Rating value (0-5)
     * @param {number} maxStars - Maximum number of stars (default: 5)
     * @returns {string} HTML string for star display
     */
    createStarDisplay(rating, maxStars = 5) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = maxStars - fullStars - (hasHalfStar ? 1 : 0);
        
        return `
            <span class="card-rating">
                <span class="rating-stars">
                    ${'<span class="rating-star active">★</span>'.repeat(fullStars)}
                    ${hasHalfStar ? '<span class="rating-star active half">★</span>' : ''}
                    ${'<span class="rating-star">★</span>'.repeat(emptyStars)}
                </span>
                <span class="rating-value">${rating.toFixed(1)}</span>
            </span>
        `;
    }

    /**
     * Render multiple contractor cards to a container
     * @param {Array} contractors - Array of contractor objects
     * @param {HTMLElement} container - DOM element to render cards into
     */
    renderContractorCards(contractors, container) {
        if (!container) {
            console.warn('CardManager: No container provided for rendering cards');
            return;
        }

        if (!contractors || contractors.length === 0) {
            container.innerHTML = this.createEmptyState();
            return;
        }

        container.innerHTML = contractors.map(contractor => 
            this.createContractorCard(contractor)
        ).join('');

        // Update favorite buttons after rendering
        this.updateFavoriteButtons();
    }

    /**
     * Update all favorite buttons state in the DOM
     */
    updateFavoriteButtons() {
        const favoriteButtons = document.querySelectorAll('.favorite-btn');
        favoriteButtons.forEach(button => {
            const contractorId = button.getAttribute('data-contractor-id');
            if (contractorId) {
                const isFavorite = this.dataModule.isFavorite(contractorId);
                button.classList.toggle('favorited', isFavorite);
                button.innerHTML = `<i class="material-icons">${isFavorite ? 'favorite' : 'favorite_border'}</i>`;
                button.title = isFavorite ? 'Remove from favorites' : 'Add to favorites';
            }
        });
    }

    /**
     * Utility method to escape HTML for safety
     * @param {string} unsafe - Unsafe HTML string
     * @returns {string} Escaped HTML string
     */
    escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return unsafe;
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /**
     * Create empty state for no results
     * @param {string} message - Custom message to display
     * @returns {string} HTML string for empty state
     */
    createEmptyState(message = 'No contractors found') {
        return `
            <div class="no-results">
                <i class="material-icons">search_off</i>
                <h3>${this.escapeHtml(message)}</h3>
                <p>Try adjusting your search criteria or filters</p>
            </div>
        `;
    }

    /**
     * Create favorites empty state
     * @returns {string} HTML string for favorites empty state
     */
    createFavoritesEmptyState() {
        return `
            <div class="no-favorites">
                <i class="material-icons">favorite_border</i>
                <h3>No favorites yet</h3>
                <p>Click the heart icon on contractor cards to add them to your favorites!</p>
            </div>
        `;
    }
}

// Remove the global instance creation - we'll inject it properly
// const cardManager = new CardManager();