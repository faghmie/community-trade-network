// js/app/favoritesManager.js
// ES6 Module for favorites UI and logic management

export class FavoritesManager {
    constructor(dataModule, cardManager) {
        this.dataModule = dataModule;
        this.cardManager = cardManager;
        this.elements = {};
        this.isUpdatingFavorites = false;
    }

    async init() {
        this.cacheElements();
        this.setupFavoritesEvents();
        this.updateFavoritesUI();
    }

    cacheElements() {
        this.elements = {
            favoritesSection: document.getElementById('favoritesSection'),
            favoritesGrid: document.getElementById('favoritesGrid'),
            favoritesCount: document.querySelector('.favorites-count'),
            favoritesNotice: document.getElementById('favoritesNotice'),
            favoritesFilter: document.getElementById('favoritesFilter')
        };
    }

    setupFavoritesEvents() {
        // Listen for favorites updates from data module
        document.addEventListener('favoritesUpdated', () => {
            console.log('FavoritesManager: favoritesUpdated event received');
            this.updateFavoritesUI();
        });

        // Handle favorites filter changes
        const { favoritesFilter } = this.elements;
        if (favoritesFilter) {
            favoritesFilter.addEventListener('change', (e) => {
                console.log('FavoritesManager: favoritesFilter changed to:', e.target.value);
                this.handleFavoritesFilterChange(e.target.value);
            });
        }
    }

    handleFavoritesFilterChange(filterValue) {
        console.log('FavoritesManager: handleFavoritesFilterChange called with:', filterValue);
        
        // Don't process if we're in the middle of updating favorites
        if (this.isUpdatingFavorites) {
            console.log('FavoritesManager: Skipping filter change - updating favorites in progress');
            return;
        }

        let contractors = this.dataModule.getContractors();
        
        if (filterValue === 'favorites') {
            console.log('FavoritesManager: Applying favorites filter');
            contractors = this.dataModule.getFavoriteContractors();
        } else if (filterValue === 'non-favorites') {
            console.log('FavoritesManager: Applying non-favorites filter');
            contractors = contractors.filter(contractor => 
                !this.dataModule.isFavorite(contractor.id)
            );
        } else {
            console.log('FavoritesManager: No favorites filter applied');
        }
        
        console.log('FavoritesManager: Filtered to', contractors.length, 'contractors');
        
        // Emit event for other components to handle rendering
        this.emitFavoritesFilterApplied(contractors, filterValue);
    }

    emitFavoritesFilterApplied(contractors, filterValue) {
        const event = new CustomEvent('favoritesFilterApplied', {
            detail: {
                contractors: contractors,
                filterValue: filterValue,
                count: contractors.length
            }
        });
        document.dispatchEvent(event);
    }

    updateFavoritesUI() {
        console.log('FavoritesManager: updateFavoritesUI called');
        this.isUpdatingFavorites = true;
        
        try {
            this.updateFavoritesCount();
            this.updateFavoriteButtons();
            this.renderFavoritesSection();
        } finally {
            this.isUpdatingFavorites = false;
        }
    }

    updateFavoritesCount() {
        const { favoritesCount } = this.elements;
        const count = this.dataModule.getFavoritesCount();
        
        if (favoritesCount) {
            favoritesCount.textContent = count;
        }
        
        const favoritesStat = document.querySelector('.favorites-stat .stat-number');
        if (favoritesStat) {
            favoritesStat.textContent = count;
        }
    }

    updateFavoriteButtons() {
        this.cardManager.updateFavoriteButtons();
    }

    renderFavoritesSection() {
        const { favoritesGrid, favoritesSection, favoritesNotice } = this.elements;
        const favoriteContractors = this.dataModule.getFavoriteContractors();
        
        console.log('FavoritesManager: renderFavoritesSection -', {
            favoriteContractorsCount: favoriteContractors.length,
            favoritesGrid: !!favoritesGrid,
            favoritesSection: !!favoritesSection
        });
        
        if (favoriteContractors.length === 0) {
            console.log('FavoritesManager: No favorites - hiding section');
            if (favoritesGrid) favoritesGrid.innerHTML = this.cardManager.createFavoritesEmptyState();
            if (favoritesSection) favoritesSection.classList.add('hidden');
        } else {
            console.log('FavoritesManager: Has favorites - rendering', favoriteContractors.length, 'contractors to favorites grid');
            if (favoritesGrid) {
                this.cardManager.renderContractorCards(favoriteContractors, favoritesGrid);
            }
            if (favoritesSection) {
                favoritesSection.classList.remove('hidden');
            }
        }

        if (favoritesNotice) {
            favoritesNotice.innerHTML = this.createFavoritesNotice();
        }
    }

    createFavoritesNotice() {
        const favoritesCount = this.dataModule.getFavoritesCount();
        return `
            <div class="favorites-notice">
                <p>
                    <i class="material-icons">info</i>
                    <strong>Your ${favoritesCount} favorite contractor${favoritesCount !== 1 ? 's are' : ' is'} stored locally in this browser.</strong>
                    They won't be available on other devices or if you clear browser data.
                </p>
                <div class="favorites-actions">
                    <button class="btn btn-secondary" onclick="dataModule.downloadFavorites()">
                        <i class="material-icons">download</i>
                        <span>Export Favorites</span>
                    </button>
                    <button class="btn btn-secondary" onclick="document.getElementById('importFavorites').click()">
                        <i class="material-icons">upload</i>
                        <span>Import Favorites</span>
                    </button>
                    <input type="file" id="importFavorites" accept=".json" class="hidden" 
                           onchange="handleFavoritesImport(this.files[0])">
                    ${favoritesCount > 0 ? `
                    <button class="btn btn-error" onclick="dataModule.clearFavorites()">
                        <i class="material-icons">delete</i>
                        <span>Clear All</span>
                    </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    showFavoritesOnly() {
        const { favoritesFilter } = this.elements;
        if (favoritesFilter) {
            favoritesFilter.value = 'favorites';
            this.handleFavoritesFilterChange('favorites');

            if (typeof utils !== 'undefined' && utils.showNotification) {
                utils.showNotification('Showing favorites only', 'info');
            }
        }
    }

    showHighRated() {
        // This is a filter action that applies a rating filter
        // We'll emit an event for the filter manager to handle
        const event = new CustomEvent('filterActionRequested', {
            detail: {
                action: 'showHighRated',
                filter: { rating: '4.5' }
            }
        });
        document.dispatchEvent(event);

        if (typeof utils !== 'undefined' && utils.showNotification) {
            utils.showNotification('Showing highly rated contractors', 'info');
        }
    }

    handleActionButton(action) {
        switch (action) {
            case 'show-favorites':
            case 'view-favorites':
                this.showFavoritesOnly();
                break;
            case 'show-high-rated':
                this.showHighRated();
                break;
            case 'export-favorites':
                this.dataModule.downloadFavorites();
                break;
            case 'import-favorites':
                document.getElementById('importFavorites')?.click();
                break;
            default:
                console.log('FavoritesManager: Unhandled action:', action);
        }
    }

    // Utility methods
    getFavoritesCount() {
        return this.dataModule.getFavoritesCount();
    }

    getFavoriteContractors() {
        return this.dataModule.getFavoriteContractors();
    }

    isFavorite(contractorId) {
        return this.dataModule.isFavorite(contractorId);
    }

    // Event subscription methods
    onFavoritesFilterApplied(callback) {
        document.addEventListener('favoritesFilterApplied', (event) => {
            callback(event.detail);
        });
    }

    onFilterActionRequested(callback) {
        document.addEventListener('filterActionRequested', (event) => {
            callback(event.detail);
        });
    }
}