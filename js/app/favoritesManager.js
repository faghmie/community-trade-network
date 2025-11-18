// js/app/favoritesManager.js
// ES6 Module for favorites UI and logic management (merged from modules/favoritesManager.js)

import { showNotification } from '../modules/notifications.js';

export class FavoritesManager {
    constructor(dataModule, cardManager) {
        this.dataModule = dataModule;
        this.cardManager = cardManager;
        this.favoritesDataManager = null;
        this.elements = {};
        this.isUpdatingFavorites = false;
        this.initialized = false;
    }

    async init() {
        this.favoritesDataManager = this.dataModule.getFavoritesDataManager();
        this.cacheElements();
        this.setupFavoritesEvents();
        this.updateFavoritesUI();
        this.initialized = true;
        console.log('FavoritesManager initialized');
    }

    cacheElements() {
        this.elements = {
            favoritesSection: document.getElementById('favoritesSection'),
            favoritesGrid: document.getElementById('favoritesGrid'),
            favoritesCount: document.querySelector('.favorites-count'),
            favoritesNotice: document.getElementById('favoritesNotice'),
            favoritesFilter: document.getElementById('favoritesFilter'),
            favoritesBadge: document.querySelector('.favorites-badge'),
            // Bottom navigation badge elements
            mobileFavBadge: document.getElementById('mobileFavBadge'),
            // Stats elements
            favoritesStat: document.querySelector('.favorites-stat .stat-number'),
            mobileFavoritesCount: document.getElementById('mobileFavoritesCount')
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

        // Listen for when data is fully loaded
        document.addEventListener('dataReady', () => {
            console.log('Data ready event received in FavoritesManager');
            this.updateFavoritesUI();
        });

        // Also update UI when contractors are loaded
        document.addEventListener('contractorsUpdated', () => {
            console.log('Contractors updated event received in FavoritesManager');
            this.updateFavoritesUI();
        });
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
            contractors = this.getFavoriteContractors();
        } else if (filterValue === 'non-favorites') {
            console.log('FavoritesManager: Applying non-favorites filter');
            contractors = contractors.filter(contractor => 
                !this.isFavorite(contractor.id)
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
            this.updateFavoritesBadge();
            this.updateStatsFavoritesCount();
        } finally {
            this.isUpdatingFavorites = false;
        }
    }

    updateFavoritesCount() {
        const { favoritesCount, favoritesBadge } = this.elements;
        const count = this.getFavoritesCount();
        
        if (favoritesCount) {
            favoritesCount.textContent = count;
            favoritesCount.style.display = count > 0 ? 'inline' : 'none';
        }
        
        if (favoritesBadge) {
            favoritesBadge.textContent = count;
            favoritesBadge.style.display = count > 0 ? 'inline-block' : 'none';
        }
    }

    updateFavoritesBadge() {
        const { mobileFavBadge } = this.elements;
        const count = this.getFavoritesCount();
        
        console.log('FavoritesManager: Updating favorites badge to:', count);
        
        if (mobileFavBadge) {
            mobileFavBadge.textContent = count;
            
            // Show/hide badge based on count
            if (count > 0) {
                mobileFavBadge.classList.remove('hidden');
            } else {
                mobileFavBadge.classList.add('hidden');
            }
        }
    }

    updateStatsFavoritesCount() {
        const { favoritesStat, mobileFavoritesCount } = this.elements;
        const count = this.getFavoritesCount();
        
        if (favoritesStat) {
            favoritesStat.textContent = count;
        }
        
        if (mobileFavoritesCount) {
            mobileFavoritesCount.textContent = count;
        }
    }

    updateFavoriteButtons() {
        const favoriteButtons = document.querySelectorAll('.favorite-btn');
        favoriteButtons.forEach(button => {
            const contractorId = button.getAttribute('data-contractor-id');
            if (contractorId) {
                if (this.isFavorite(contractorId)) {
                    button.classList.add('favorited');
                    button.setAttribute('aria-pressed', 'true');
                    button.title = 'Remove from favorites';
                } else {
                    button.classList.remove('favorited');
                    button.setAttribute('aria-pressed', 'false');
                    button.title = 'Add to favorites';
                }
            }
        });
    }

    updateFavoriteButton(contractorId) {
        const button = document.querySelector(`.favorite-btn[data-contractor-id="${contractorId}"]`);
        if (button) {
            if (this.isFavorite(contractorId)) {
                button.classList.add('favorited');
                button.setAttribute('aria-pressed', 'true');
                button.title = 'Remove from favorites';
            } else {
                button.classList.remove('favorited');
                button.setAttribute('aria-pressed', 'false');
                button.title = 'Add to favorites';
            }
        }
    }

    // FIXED: Made toggleFavorite async and properly handle the Promise
    async toggleFavorite(contractorId) {
        if (!contractorId) {
            console.error('No contractor ID provided for toggleFavorite');
            return false;
        }

        console.log('FavoritesManager: toggleFavorite called for:', contractorId);

        try {
            // Use dataModule's toggleFavorite method
            const success = this.dataModule.toggleFavorite(contractorId);
            const isNowFavorite = this.isFavorite(contractorId);

            console.log('FavoritesManager: toggle result:', { success, isNowFavorite });

            if (success) {
                this.dispatchFavoritesUpdate();

                // Get contractor name for notification
                let contractorName = 'Contractor';
                try {
                    const contractor = this.dataModule.getContractor(contractorId);
                    if (contractor && contractor.name) {
                        contractorName = contractor.name;
                    }
                } catch (error) {
                    console.warn('Could not get contractor name for notification:', error);
                }

                const action = isNowFavorite ? 'added to' : 'removed from';
                showNotification(`${contractorName} ${action} favorites!`, 'success');

                // Immediately update the specific button
                this.updateFavoriteButton(contractorId);

                console.log('FavoritesManager: toggle completed successfully');
                return isNowFavorite;
            } else {
                showNotification('Unable to save favorites. Your browser storage might be full.', 'error');
                console.error('FavoritesManager: toggle failed - save error');
                return false;
            }
        } catch (error) {
            console.error('FavoritesManager: toggleFavorite error:', error);
            showNotification('Error updating favorites. Please try again.', 'error');
            return false;
        }
    }

    // Event system for UI updates
    dispatchFavoritesUpdate() {
        const event = new CustomEvent('favoritesUpdated', {
            detail: {
                favorites: this.getFavorites(),
                count: this.getFavoritesCount()
            }
        });
        document.dispatchEvent(event);
    }

    showFavoritesOnly() {
        const { favoritesFilter } = this.elements;
        if (favoritesFilter) {
            favoritesFilter.value = 'favorites';
            this.handleFavoritesFilterChange('favorites');
            // REMOVED: Unnecessary notification for filter changes
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
        // REMOVED: Unnecessary notification for filter changes
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
            // REMOVED: export-favorites, import-favorites cases
            default:
                console.log('FavoritesManager: Unhandled action:', action);
        }
    }

    // Data access methods
    getFavoriteContractors() {
        if (!this.dataModule) {
            console.warn('FavoritesManager: DataModule not ready for getFavoriteContractors');
            return [];
        }

        try {
            const allContractors = this.dataModule.getContractors();
            const favorites = this.getFavorites();
            return allContractors.filter(contractor =>
                contractor && contractor.id && favorites.includes(contractor.id)
            );
        } catch (error) {
            console.error('Error getting favorite contractors:', error);
            return [];
        }
    }

    getFavoritesCount() {
        return this.dataModule ? this.dataModule.getFavoritesCount() : 0;
    }

    getFavorites() {
        return this.favoritesDataManager ? this.favoritesDataManager.getFavorites() : [];
    }

    isFavorite(contractorId) {
        return this.dataModule ? this.dataModule.isFavorite(contractorId) : false;
    }

    // REMOVED: All export/import functionality including:
    // - exportFavorites()
    // - importFavorites()
    // - downloadFavorites()
    // - handleFavoritesImport()
    // - clearFavorites()

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

    // REMOVED: destroy() method if it contained export/import cleanup
}