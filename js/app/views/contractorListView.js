// js/app/views/ContractorListView.js - UPDATED: Add back button using viewHelpers
import { BaseView } from './BaseView.js';
import { sanitizeHtml } from '../../modules/utilities.js';
import { createViewHeader } from '../utils/viewHelpers.js';

export class ContractorListView extends BaseView {
    constructor(dataModule) {
        super('contractor-list-view');
        this.dataModule = dataModule;
        this.contractorsGrid = null;
        this.currentContext = {}; // Track current context for back navigation
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

        // Create header using viewHelpers
        const header = createViewHeader(
            this.viewId,
            'Service Providers',
            'Browse our trusted community contractors',
            true // Show back button
        );

        this.container.innerHTML = `
            ${header.html}
            <div class="contractors-content">
                <div class="contractors-grid" id="contractors-grid">
                    <!-- Contractors will be populated here -->
                </div>
            </div>
        `;

        this.contractorsGrid = document.getElementById('contractors-grid');
        
        // Bind back button handler
        header.bindBackButton(() => {
            this.handleBackButton();
        });
    }

    /**
     * Handle back button click
     */
    handleBackButton() {
        document.dispatchEvent(new CustomEvent('navigationViewChange', {
            detail: { view: 'back' }
        }));
    }

    /**
     * Show method with context support
     */
    show(context = {}) {
        this.currentContext = context;
        
        // Update header based on context
        this.updateHeader(context);
        
        // Call parent show method
        super.show();
    }

    /**
     * Update header based on context
     */
    updateHeader(context = {}) {
        const titleElement = document.getElementById(`${this.viewId}Title`);
        const subtitleElement = document.getElementById(`${this.viewId}Subtitle`);
        
        if (!titleElement) return;

        if (context.categoryType) {
            // Showing contractors from category selection
            titleElement.textContent = `${context.categoryType} Contractors`;
            if (subtitleElement) {
                subtitleElement.textContent = `Specialists in ${context.categoryType}`;
            }
        } else if (context.isFavorites) {
            // Showing favorites
            titleElement.textContent = 'My Favorites';
            if (subtitleElement) {
                const favoritesCount = this.dataModule.getFavoritesCount();
                subtitleElement.textContent = `${favoritesCount} saved contractor${favoritesCount !== 1 ? 's' : ''}`;
            }
        } else {
            // Default list view
            titleElement.textContent = 'Service Providers';
            if (subtitleElement) {
                subtitleElement.textContent = 'Browse our trusted community contractors';
            }
        }
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

        // Update header with count
        this.updateHeaderWithCount(contractorsToRender.length);

        // Direct card rendering - no abstraction layer
        this.contractorsGrid.innerHTML = contractorsToRender
            .map(contractor => this.createContractorCard(contractor))
            .join('');
        
        this.bindCardEvents();
    }

    /**
     * Update header with contractor count
     */
    updateHeaderWithCount(count) {
        const subtitleElement = document.getElementById(`${this.viewId}Subtitle`);
        if (subtitleElement) {
            if (this.currentContext.categoryType) {
                subtitleElement.textContent = `${count} ${this.currentContext.categoryType} contractor${count !== 1 ? 's' : ''}`;
            } else if (this.currentContext.isFavorites) {
                subtitleElement.textContent = `${count} saved contractor${count !== 1 ? 's' : ''}`;
            } else {
                subtitleElement.textContent = `${count} trusted community contractor${count !== 1 ? 's' : ''}`;
            }
        }
    }

    /**
     * Create individual contractor card
     */
    createContractorCard(contractor) {
        // UPDATED: Use trust metrics instead of reviews
        const trustMetrics = contractor.trustMetrics || this.dataModule.getContractorTrustMetrics(contractor.id);
        const displayRating = trustMetrics?.trustScore ? (trustMetrics.trustScore / 20).toFixed(1) : '0.0'; // Convert 0-100 to 0-5 scale
        const recommendationCount = trustMetrics?.totalRecommendations || 0;
        const isFavorite = this.dataModule.isFavorite(contractor.id);
        const serviceAreasDisplay = this.formatServiceAreas(contractor.serviceAreas);

        return `
            <div class="card contractor-card material-card" 
                 data-contractor-id="${sanitizeHtml(contractor.id)}"
                 onclick="document.dispatchEvent(new CustomEvent('navigationViewChange', { detail: { view: 'contractor', context: { contractorId: '${sanitizeHtml(contractor.id)}' } } }))">
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
                        <span class="rating-value">${displayRating}</span>
                        <span class="review-count">${recommendationCount} recommendation${recommendationCount !== 1 ? 's' : ''}</span>
                    </div>

                    ${trustMetrics?.recommendationRate ? `
                        <div class="trust-metrics">
                            <div class="recommendation-rate">
                                <i class="material-icons">thumb_up</i>
                                <span>${trustMetrics.recommendationRate}% would recommend</span>
                            </div>
                        </div>
                    ` : ''}

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

        this.currentContext = { isFavorites: true };
        this.updateHeader(this.currentContext);

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
        
        this.currentContext = { categoryType: category };
        this.updateHeader(this.currentContext);
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
        
        this.currentContext = { searchTerm: searchTerm };
        this.updateHeader(this.currentContext);
        this.renderContractors(filteredContractors);
    }
}