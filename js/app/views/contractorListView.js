// js/app/views/ContractorListView.js - SIMPLIFIED: Complete card rendering without CardManager

import { BaseView } from './BaseView.js';
import { sanitizeHtml } from '../../modules/utilities.js';

export class ContractorListView extends BaseView {
    constructor(dataModule, reviewManager) {
        super('contractor-list-view');
        this.dataModule = dataModule;
        this.reviewManager = reviewManager;
        this.contractorsGrid = null;
    }

    /**
     * Simple render method
     */
    render() {
        const mainContainer = document.getElementById('mainViewContainer');
        if (!mainContainer) return;

        // Create or reuse container
        if (!this.container) {
            this.container = document.createElement('section');
            this.container.id = this.viewId;
            this.container.className = 'contractor-list-view';
            mainContainer.appendChild(this.container);
        }

        this.container.innerHTML = `
            <div class="contractors-grid" id="contractors-grid">
                <!-- Contractors will be populated here -->
            </div>
        `;

        this.contractorsGrid = document.getElementById('contractors-grid');
    }

    /**
     * Render contractors list directly without CardManager
     */
    renderContractors(contractors = null) {
        if (!this.contractorsGrid) return;

        const contractorsToRender = contractors || this.dataModule.getContractors();

        if (!contractorsToRender || contractorsToRender.length === 0) {
            this.contractorsGrid.innerHTML = this.createEmptyState();
            return;
        }

        // Direct card rendering - no abstraction layer
        this.contractorsGrid.innerHTML = contractorsToRender
            .map(contractor => this.createContractorCard(contractor))
            .join('');
        
        this.bindCardEvents();
    }

    /**
     * Create individual contractor card
     */
    createContractorCard(contractor) {
        const approvedReviews = this.reviewManager.getApprovedReviewsByContractor(contractor.id);
        const displayRating = approvedReviews.length > 0 ? 
            this.dataModule.calculateAverageRating(approvedReviews) : 0;
        
        const ratingValue = typeof displayRating === 'number' ? displayRating : parseFloat(displayRating) || 0;
        const displayRatingFormatted = !isNaN(ratingValue) ? ratingValue.toFixed(1) : '0.0';
        const isFavorite = this.dataModule.isFavorite(contractor.id);
        const serviceAreasDisplay = this.formatServiceAreas(contractor.serviceAreas);

        return `
            <div class="card contractor-card material-card" 
                 data-contractor-id="${sanitizeHtml(contractor.id)}"
                 onclick="document.dispatchEvent(new CustomEvent('showContractorDetails', { detail: { contractorId: '${sanitizeHtml(contractor.id)}' } }))">
                <div class="card-content">
                    <button class="favorite-btn ${isFavorite ? 'favorited' : ''}" 
                            data-contractor-id="${sanitizeHtml(contractor.id)}"
                            onclick="document.dispatchEvent(new CustomEvent('toggleFavorite', { detail: { contractorId: '${sanitizeHtml(contractor.id)}' } })); event.stopPropagation();"
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
     * Create empty state for no results
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
     * Bind card events (if needed for additional functionality)
     */
    bindCardEvents() {
        // Event binding is handled via inline onclick handlers in the card HTML
        // This method can be used for any additional event binding needed
    }

    /**
     * Refresh favorite buttons
     */
    refreshFavorites() {
        const favoriteButtons = this.container?.querySelectorAll('.favorite-btn');
        
        favoriteButtons?.forEach(button => {
            const contractorId = button.getAttribute('data-contractor-id');
            if (contractorId) {
                const isFav = this.dataModule.isFavorite(contractorId);
                const icon = button.querySelector('.material-icons');
                
                if (isFav) {
                    button.classList.add('favorited');
                    if (icon) icon.textContent = 'favorite';
                } else {
                    button.classList.remove('favorited');
                    if (icon) icon.textContent = 'favorite_border';
                }
            }
        });
    }

    /**
     * Show favorites only
     */
    showFavorites() {
        const allContractors = this.dataModule.getContractors();
        const favoriteContractors = allContractors.filter(contractor => 
            this.dataModule.isFavorite(contractor.id)
        );

        if (favoriteContractors.length === 0) {
            this.contractorsGrid.innerHTML = this.createFavoritesEmptyState();
        } else {
            this.renderContractors(favoriteContractors);
        }
    }

    /**
     * Show contractors by category
     */
    showContractorsByCategory(category) {
        const allContractors = this.dataModule.getContractors();
        const filteredContractors = allContractors.filter(contractor => 
            contractor.category === category
        );
        this.renderContractors(filteredContractors);
    }

    /**
     * Show contractors by search term
     */
    showContractorsBySearch(searchTerm) {
        const allContractors = this.dataModule.getContractors();
        const filteredContractors = allContractors.filter(contractor => 
            contractor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            contractor.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (contractor.description && contractor.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        this.renderContractors(filteredContractors);
    }
}