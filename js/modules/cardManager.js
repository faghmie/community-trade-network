// js/modules/cardManager.js
// ES6 Module for card management

import { sanitizeHtml } from './utilities.js';

export class CardManager {
    constructor(dataModule, reviewManager) {
        this.dataModule = dataModule;
        this.reviewManager = reviewManager;
    }

    /**
     * Create contractor card HTML
     * @param {Object} contractor - Service Provider data object
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

        // Format service areas for display
        const serviceAreasDisplay = this.formatServiceAreas(contractor.serviceAreas);

        return `
            <div class="card contractor-card material-card" 
                 data-contractor-id="${sanitizeHtml(contractor.id)}"
                 onclick="app.showContractorDetails('${sanitizeHtml(contractor.id)}')">
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
                            ${sanitizeHtml(contractor.location || 'Location not specified')}
                        </p>
                    </div>
                    
                    <div class="rating-display">
                        <div class="rating-icon">
                            <i class="material-icons">star</i>
                        </div>
                        <span class="rating-value">${displayRatingFormatted}</span>
                        <span class="review-count">${approvedReviews.length} review${approvedReviews.length !== 1 ? 's' : ''}</span>
                    </div>

                    <div class="contractor-details">
                        <p class="service-areas">
                            <i class="material-icons">map</i>
                            ${serviceAreasDisplay}
                        </p>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Format service areas array for display
     * @param {Array} serviceAreas - Array of service area strings
     * @returns {string} Formatted service areas string
     */
    formatServiceAreas(serviceAreas) {
        if (!serviceAreas || serviceAreas.length === 0) {
            return 'Service areas not specified';
        }
        
        if (serviceAreas.length <= 2) {
            return `Serves: ${serviceAreas.join(', ')}`;
        }
        
        // For more than 2 areas, show first 2 + count of others
        const primaryAreas = serviceAreas.slice(0, 2).join(', ');
        const additionalCount = serviceAreas.length - 2;
        return `Serves: ${primaryAreas} +${additionalCount} more`;
    }

    /**
     * Render multiple contractor cards to a container
     * @param {Array} contractors - Array of contractor objects
     * @param {HTMLElement} container - DOM element to render cards into
     */
    renderContractorCards(contractors, container) {
        if (!container) {
            console.warn('No container provided for rendering cards');
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
}