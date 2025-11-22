// js/app/views/contractorListView.js
// ES6 Module for contractor list view management - Self-contained with HTML

import { CardManager } from '../../modules/cardManager.js';

export class ContractorListView {
    constructor(dataModule, reviewManager) {
        this.dataModule = dataModule;
        this.reviewManager = reviewManager;
        this.cardManager = new CardManager(dataModule, reviewManager);
        this.container = null;
        this.viewId = 'contractor-list-view';
        this.contractorsGrid = null;
        this.resultsCount = null;
        this.isRendered = false;
        
        this.initializeEventListeners();
    }

    /**
     * Initialize event listeners for the contractor list view
     */
    initializeEventListeners() {
        // Listen for contractor list updates
        document.addEventListener('contractorsListUpdate', (event) => {
            this.renderContractorList(event.detail.contractors);
        });

        // Listen for requests to show contractor list view
        document.addEventListener('showContractorListView', () => {
            this.show();
        });

        // Listen for requests to hide contractor list view
        document.addEventListener('hideContractorListView', () => {
            this.hide();
        });

        // Listen for category type selection to show contractors
        document.addEventListener('showContractorsForCategoryType', (event) => {
            this.showContractorsByCategoryType(event.detail.type, event.detail.categories);
        });

        // Listen for favorites updates to refresh card states
        document.addEventListener('favoritesUpdated', () => {
            this.refreshFavoriteButtons();
        });

        // Listen for app initialization to ensure view is ready
        document.addEventListener('appInitialized', () => {
            if (!this.isRendered) {
                this.render();
            }
        });

        // Listen for initialization event
        document.addEventListener('initializeContractorListView', () => {
            if (!this.isRendered) {
                this.render();
            }
        });
    }

    /**
     * Create the contractor list view HTML structure
     */
    createViewHTML() {
        return `
            <section class="contractor-list-view" id="${this.viewId}">
                <div class="contractors-grid" id="contractors-grid">
                    <!-- Contractors will be populated dynamically -->
                </div>
            </section>
        `;
    }

    /**
     * Render the contractor list view
     */
    render() {
        console.log('🔄 ContractorListView rendering...');
        
        const mainContainer = document.getElementById('mainViewContainer');
        if (!mainContainer) {
            console.error('Main view container not found');
            return;
        }

        // Check if view already exists in DOM (prevent duplicates)
        const existingView = document.getElementById(this.viewId);
        if (existingView) {
            console.log('✅ ContractorListView already exists in DOM, reusing');
            this.container = existingView;
            this.contractorsGrid = document.getElementById('contractors-grid');
            this.resultsCount = document.getElementById('contractor-results-count');
            this.isRendered = true;
            return;
        }

        // Only create the view if it doesn't exist
        if (!this.container) {
            // Create and insert the view HTML
            mainContainer.insertAdjacentHTML('beforeend', this.createViewHTML());
            this.container = document.getElementById(this.viewId);
            this.contractorsGrid = document.getElementById('contractors-grid');
            this.resultsCount = document.getElementById('contractor-results-count');
        }
        
        this.isRendered = true;
        
        // Initially hide the view
        this.hide();
        
        // Dispatch event that view is ready
        document.dispatchEvent(new CustomEvent('contractorListViewRendered'));
        
        console.log('✅ ContractorListView rendered successfully');
    }

    /**
     * Render the contractor list (main functionality moved from UIManager)
     */
    renderContractorList(contractorsToRender = null) {
        // Ensure view is rendered before trying to render contractors
        if (!this.isRendered) {
            this.render();
        }

        if (!this.contractorsGrid) {
            console.warn('Contractors grid not found - view may not be initialized');
            return;
        }

        const contractors = contractorsToRender || this.dataModule.getContractors();

        if (!contractors || contractors.length === 0) {
            this.contractorsGrid.innerHTML = this.cardManager.createEmptyState();
            this.updateResultsCount(0);
            return;
        }

        // Use CardManager to render the contractor cards
        this.cardManager.renderContractorCards(contractors, this.contractorsGrid);
        this.updateResultsCount(contractors.length);
        
        // Dispatch event that rendering is complete
        document.dispatchEvent(new CustomEvent('contractorListRendered', {
            detail: {
                contractorCount: contractors.length,
                timestamp: new Date().toISOString()
            }
        }));
    }

    /**
     * Update the results count display
     */
    updateResultsCount(count) {
        if (this.resultsCount) {
            this.resultsCount.textContent = `${count} contractor${count !== 1 ? 's' : ''} found`;
        }
    }

    /**
     * Refresh favorite buttons (moved from UIManager)
     */
    refreshFavoriteButtons() {
        const favoriteButtons = document.querySelectorAll('.favorite-btn');
        
        favoriteButtons.forEach(button => {
            const contractorId = button.getAttribute('data-contractor-id');
            if (contractorId) {
                const isFav = this.dataModule.isFavorite(contractorId);
                const icon = button.querySelector('.material-icons');
                
                if (isFav) {
                    button.classList.add('favorited');
                    button.setAttribute('aria-pressed', 'true');
                    button.title = 'Remove from favorites';
                    if (icon) icon.textContent = 'favorite';
                } else {
                    button.classList.remove('favorited');
                    button.setAttribute('aria-pressed', 'false');
                    button.title = 'Add to favorites';
                    if (icon) icon.textContent = 'favorite_border';
                }
            }
        });
    }

    /**
     * Show contractors by category
     */
    showContractorsByCategory(category) {
        // Dispatch event to filter manager to filter by category
        document.dispatchEvent(new CustomEvent('filterByCategory', {
            detail: { category }
        }));
        this.show();
    }

    /**
     * Show contractors by category type
     */
    showContractorsByCategoryType(type, categories) {
        console.log(`🎯 Showing contractors for category type: ${type}`);
        
        // Dispatch event to filter manager to filter by category type
        document.dispatchEvent(new CustomEvent('filterByCategoryType', {
            detail: { 
                type: type,
                categories: categories,
                categoryNames: categories.map(cat => cat.name)
            }
        }));
        
        this.show();
    }

    /**
     * Show the contractor list view
     */
    show() {
        console.log('🔄 ContractorListView showing...');
        
        if (!this.isRendered) {
            console.log('📦 ContractorListView not rendered, rendering first...');
            this.render();
        }

        if (this.container) {
            this.container.style.display = 'block';
            console.log('✅ ContractorListView display set to block');
        } else {
            console.error('❌ ContractorListView container not found');
        }
        
        // Dispatch event that view is now visible
        document.dispatchEvent(new CustomEvent('contractorListViewShown'));
        
        console.log('✅ ContractorListView shown successfully');
    }

    /**
     * Hide the contractor list view
     */
    hide() {
        console.log('🔄 ContractorListView hiding...');
        
        if (this.container) {
            this.container.style.display = 'none';
            console.log('✅ ContractorListView display set to none');
        }
        
        // Dispatch event that view is now hidden
        document.dispatchEvent(new CustomEvent('contractorListViewHidden'));
        
        console.log('✅ ContractorListView hidden successfully');
    }

    /**
     * Clean up the view
     */
    destroy() {
        // Remove any duplicate views
        const allViews = document.querySelectorAll(`#${this.viewId}`);
        if (allViews.length > 1) {
            console.warn(`⚠️ Found ${allViews.length} contractor list views, removing duplicates`);
            // Keep the first one, remove the rest
            for (let i = 1; i < allViews.length; i++) {
                allViews[i].remove();
            }
        }
        
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
        this.contractorsGrid = null;
        this.resultsCount = null;
        this.isRendered = false;
        
        console.log('🧹 ContractorListView destroyed');
    }
}