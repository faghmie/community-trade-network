// js/app/views/ContractorListView.js - Fixed event handlers
import { BaseView } from './BaseView.js';
import { sanitizeHtml } from '../../modules/utilities.js';
import { createViewHeader, createEmptyState } from '../utils/viewHelpers.js';

export class ContractorListView extends BaseView {
    constructor(dataModule) {
        super('contractor-list-view');
        this.dataModule = dataModule;
        this.contractorsGrid = null;
        this.currentContext = {};
    }

    /**
     * Simple render method
     */
    render() {
        const mainContainer = document.getElementById('mainViewContainer');
        if (!mainContainer) return;

        if (!this.container) {
            this.container = document.createElement('section');
            this.container.id = this.viewId;
            this.container.className = 'contractor-list-view';
            mainContainer.appendChild(this.container);
        }

        this.renderView();
    }

    /**
     * Render the complete view
     */
    renderView() {
        const header = createViewHeader(
            this.viewId,
            'Service Providers',
            'Browse our trusted community contractors',
            true
        );

        this.container.innerHTML = `
            ${header.html}
            <div class="contractors-content">
                <div class="contractors-grid" id="contractors-grid"></div>
            </div>
        `;

        this.contractorsGrid = document.getElementById('contractors-grid');
        header.bindBackButton(() => this.handleBackButton());
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
        this.updateHeader();
        super.show();
    }

    /**
     * Update header based on context
     */
    updateHeader() {
        const { categoryType, isFavorites, searchTerm } = this.currentContext;
        const titleElement = document.getElementById(`${this.viewId}Title`);
        const subtitleElement = document.getElementById(`${this.viewId}Subtitle`);
        
        if (!titleElement) return;

        const headerConfig = {
            categoryType: {
                title: `${categoryType} Contractors`,
                subtitle: `Specialists in ${categoryType}`
            },
            isFavorites: {
                title: 'My Favorites',
                subtitle: `${this.dataModule.getFavoritesCount()} saved contractor${this.dataModule.getFavoritesCount() !== 1 ? 's' : ''}`
            },
            searchTerm: {
                title: 'Search Results',
                subtitle: `Results for "${searchTerm}"`
            },
            default: {
                title: 'Service Providers',
                subtitle: 'Browse our trusted community contractors'
            }
        };

        const config = headerConfig[categoryType ? 'categoryType' : isFavorites ? 'isFavorites' : searchTerm ? 'searchTerm' : 'default'];
        
        titleElement.textContent = config.title;
        if (subtitleElement) {
            subtitleElement.textContent = config.subtitle;
        }
    }

    /**
     * Render contractors list
     */
    renderContractors(contractors = null) {
        if (!this.contractorsGrid) return;

        const contractorsToRender = contractors || this.dataModule.getContractors();

        if (!contractorsToRender || contractorsToRender.length === 0) {
            this.showEmptyState();
            return;
        }

        this.updateHeaderWithCount(contractorsToRender.length);
        this.contractorsGrid.innerHTML = contractorsToRender
            .map(contractor => this.createContractorCard(contractor))
            .join('');
        
        this.bindCardEvents();
    }

    /**
     * Bind card events properly
     */
    bindCardEvents() {
        const cards = this.contractorsGrid.querySelectorAll('.contractor-card');
        cards.forEach(card => {
            const contractorId = card.getAttribute('data-contractor-id');
            
            // Remove any existing event listeners to prevent duplicates
            card.replaceWith(card.cloneNode(true));
            const newCard = this.contractorsGrid.querySelector(`[data-contractor-id="${contractorId}"]`);
            
            // Add click event for navigation
            newCard.addEventListener('click', () => {
                this.navigateToContractor(contractorId);
            });

            // Add favorite button event
            const favoriteBtn = newCard.querySelector('.favorite-btn');
            if (favoriteBtn) {
                favoriteBtn.addEventListener('click', (event) => {
                    event.stopPropagation();
                    this.toggleFavorite(contractorId);
                });
            }
        });
    }

    /**
     * Update header with contractor count
     */
    updateHeaderWithCount(count) {
        const subtitleElement = document.getElementById(`${this.viewId}Subtitle`);
        if (!subtitleElement) return;

        const { categoryType, isFavorites } = this.currentContext;
        
        const subtitleText = categoryType 
            ? `${count} ${categoryType} contractor${count !== 1 ? 's' : ''}`
            : isFavorites
            ? `${count} saved contractor${count !== 1 ? 's' : ''}`
            : `${count} trusted community contractor${count !== 1 ? 's' : ''}`;

        subtitleElement.textContent = subtitleText;
    }

    /**
     * Show empty state based on context
     */
    showEmptyState() {
        const { isFavorites, categoryType, searchTerm } = this.currentContext;

        if (isFavorites) {
            this.contractorsGrid.innerHTML = this.createFavoritesEmptyState();
        } else if (searchTerm) {
            this.contractorsGrid.innerHTML = createEmptyState(
                'No contractors found',
                'Try adjusting your search criteria or filters',
                'search_off'
            ).html;
        } else if (categoryType) {
            this.contractorsGrid.innerHTML = createEmptyState(
                `No ${categoryType} contractors found`,
                'Be the first to add a contractor in this category',
                'category'
            ).html;
        } else {
            this.contractorsGrid.innerHTML = createEmptyState(
                'No contractors available',
                'Contractors will appear here once added to the directory',
                'handyman'
            ).html;
        }
    }

    /**
     * Create individual contractor card
     */
    createContractorCard(contractor) {
        const trustMetrics = contractor.trustMetrics || this.dataModule.getContractorTrustMetrics(contractor.id);
        const displayRating = trustMetrics?.trustScore ? (trustMetrics.trustScore / 20).toFixed(1) : '0.0';
        const recommendationCount = trustMetrics?.totalRecommendations || 0;
        const isFavorite = this.dataModule.isFavorite(contractor.id);

        return `
            <div class="card contractor-card material-card" 
                 data-contractor-id="${contractor.id}">
                <div class="card-content">
                    <button class="favorite-btn ${isFavorite ? 'favorited' : ''}" 
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
                            ${this.formatServiceAreas(contractor.serviceAreas)}
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
        
        const primaryAreas = serviceAreas.slice(0, 2).join(', ');
        const additionalCount = serviceAreas.length - 2;
        return `Serves: ${primaryAreas} +${additionalCount} more`;
    }

    /**
     * Create favorites empty state
     */
    createFavoritesEmptyState() {
        return createEmptyState(
            'No favorites yet',
            'Click the heart icon on contractor cards to add them to your favorites!',
            'favorite_border'
        ).html;
    }

    /**
     * Refresh favorite buttons
     */
    refreshFavorites() {
        const favoriteButtons = this.container?.querySelectorAll('.favorite-btn');
        
        favoriteButtons?.forEach(button => {
            const card = button.closest('.contractor-card');
            const contractorId = card?.getAttribute('data-contractor-id');
            if (contractorId) {
                const isFav = this.dataModule.isFavorite(contractorId);
                const icon = button.querySelector('.material-icons');
                
                button.classList.toggle('favorited', isFav);
                if (icon) icon.textContent = isFav ? 'favorite' : 'favorite_border';
            }
        });
    }

    /**
     * Show favorites only
     */
    showFavorites() {
        const favoriteContractors = this.dataModule.getContractors().filter(contractor => 
            this.dataModule.isFavorite(contractor.id)
        );

        this.currentContext = { isFavorites: true };
        this.updateHeader();
        this.renderContractors(favoriteContractors);
    }

    /**
     * Show contractors by category
     */
    showContractorsByCategory(category) {
        const filteredContractors = this.dataModule.getContractors().filter(contractor => 
            contractor.category === category
        );
        
        this.currentContext = { categoryType: category };
        this.updateHeader();
        this.renderContractors(filteredContractors);
    }

    /**
     * Show contractors by search term
     */
    showContractorsBySearch(searchTerm) {
        const searchTermLower = searchTerm.toLowerCase();
        const filteredContractors = this.dataModule.getContractors().filter(contractor => 
            contractor.name.toLowerCase().includes(searchTermLower) ||
            contractor.category.toLowerCase().includes(searchTermLower) ||
            (contractor.description && contractor.description.toLowerCase().includes(searchTermLower))
        );
        
        this.currentContext = { searchTerm: searchTerm };
        this.updateHeader();
        this.renderContractors(filteredContractors);
    }

    /**
     * Navigate to contractor details
     */
    navigateToContractor(contractorId) {
        document.dispatchEvent(new CustomEvent('navigationViewChange', { 
            detail: { view: 'contractor', context: { contractorId } } 
        }));
    }

    /**
     * Toggle favorite status
     */
    toggleFavorite(contractorId) {
        document.dispatchEvent(new CustomEvent('toggleFavorite', { 
            detail: { contractorId } 
        }));
    }
}