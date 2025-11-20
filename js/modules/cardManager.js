// js/modules/cardManager.js
// ES6 Module for card management

import { sanitizeHtml } from './utilities.js';

export class CardManager {
    constructor(dataModule, reviewManager) {
        this.dataModule = dataModule;
        this.reviewManager = reviewManager;
        
        console.log('🔧 CardManager initialized with dependencies:', {
            hasDataModule: !!dataModule,
            hasReviewManager: !!reviewManager
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
            <div class="card contractor-card material-card" onclick="app.showContractorDetails('${sanitizeHtml(contractor.id)}')">
                <div class="card-content">
                    <button class="favorite-btn ${isFavorite ? 'favorited' : ''}" 
                            data-contractor-id="${sanitizeHtml(contractor.id)}"
                            onclick="toggleFavorite('${sanitizeHtml(contractor.id)}'); event.stopPropagation();"
                            title="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
                        <i class="material-icons">${isFavorite ? 'favorite' : 'favorite_border'}</i>
                    </button>
                    
                    <h3 class="contractor-name">${sanitizeHtml(contractor.name)}</h3>
                    
                    <div class="contractor-meta">
                        <p class="contractor-category">
                            <i class="material-icons">category</i>
                            ${sanitizeHtml(contractor.category)}
                        </p>
                        <p class="contractor-location">
                            <i class="material-icons">location_on</i>
                            ${sanitizeHtml(contractor.location || 'Service area not specified')}
                        </p>
                    </div>
                    
                    <div class="rating-display">
                        <div class="rating-stars">
                            ${'<span class="rating-star">★</span>'.repeat(fullStars)}
                            ${hasHalfStar ? '<span class="rating-star">★</span>' : ''}
                            ${'<span class="rating-star">★</span>'.repeat(emptyStars)}
                        </div>
                        <span class="rating-value">${displayRatingFormatted}</span>
                        <span class="review-count">(${approvedReviews.length})</span>
                    </div>
                </div>
                
                <div class="card-actions">
                    <button class="card-action primary" 
                            onclick="app.showReviewForm('${sanitizeHtml(contractor.id)}'); event.stopPropagation();">
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
            <div class="rating-display">
                <div class="rating-stars">
                    ${'<span class="rating-star">★</span>'.repeat(fullStars)}
                    ${hasHalfStar ? '<span class="rating-star">★</span>' : ''}
                    ${'<span class="rating-star">★</span>'.repeat(emptyStars)}
                </div>
                <span class="rating-value">${rating.toFixed(1)}</span>
            </div>
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

        // Note: Favorite button updates are now handled by FavoritesManager via events
        // The buttons will update when the favoritesUpdated event is dispatched
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
                <h3>${sanitizeHtml(message)}</h3>
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

    /**
     * Utility method to escape HTML for safety - REMOVED (using sanitizeHtml from utilities.js instead)
     * @deprecated Use sanitizeHtml from utilities.js instead
     */
    // escapeHtml(unsafe) {
    //     if (typeof unsafe !== 'string') return unsafe;
    //     return unsafe
    //         .replace(/&/g, "&amp;")
    //         .replace(/</g, "&lt;")
    //         .replace(/>/g, "&gt;")
    //         .replace(/"/g, "&quot;")
    //         .replace(/'/g, "&#039;");
    // }
}