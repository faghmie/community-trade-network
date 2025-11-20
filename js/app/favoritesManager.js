// js/app/favoritesManager.js
// ES6 Module for favorites data management only - no direct UI manipulation

import { showNotification } from '../modules/notifications.js';

export class FavoritesManager {
    constructor(dataModule, cardManager) {
        this.dataModule = dataModule;
        this.cardManager = cardManager;
        this.favoritesDataManager = null;
        this.initialized = false;
    }

    async init() {
        this.favoritesDataManager = this.dataModule.getFavoritesDataManager();
        this.setupFavoritesEvents();
        this.initialized = true;
        
        // Dispatch initial favorites state
        this.dispatchFavoritesUpdate();
    }

    setupFavoritesEvents() {
        // Listen for data readiness to dispatch initial state
        document.addEventListener('dataReady', () => {
            this.dispatchFavoritesUpdate();
        });

        // Listen for contractors updates to ensure favorites are valid
        document.addEventListener('contractorsUpdated', () => {
            this.dispatchFavoritesUpdate();
        });
    }

    // FIXED: Proper async/await timing for data operations
    async toggleFavorite(contractorId) {
        if (!contractorId) {
            console.error('No contractor ID provided for toggleFavorite');
            return false;
        }

        try {
            // Get current state BEFORE toggling
            const wasFavorite = this.isFavorite(contractorId);
            
            // FIXED: Wait for the data operation to complete before proceeding
            const success = await this.dataModule.toggleFavorite(contractorId);

            if (success) {
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

                // Show notification
                const action = wasFavorite ? 'removed from' : 'added to';
                showNotification(`${contractorName} ${action} favorites!`, 'success');

                // FIXED: Dispatch event AFTER data operation completes
                this.dispatchFavoritesUpdate();

                return !wasFavorite; // Return new state
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

    // Event system for UI updates - UIManager listens to these
    dispatchFavoritesUpdate() {
        const favorites = this.getFavorites();
        const count = this.getFavoritesCount();
        
        const event = new CustomEvent('favoritesUpdated', {
            detail: {
                favorites: favorites,
                count: count,
                timestamp: Date.now()
            }
        });
        document.dispatchEvent(event);
    }

    // Filter management - emits events for FilterManager to handle
    showFavoritesOnly() {
        const event = new CustomEvent('filterActionRequested', {
            detail: {
                action: 'showFavoritesOnly',
                filter: { favorites: 'favorites' }
            }
        });
        document.dispatchEvent(event);
    }

    showHighRated() {
        const event = new CustomEvent('filterActionRequested', {
            detail: {
                action: 'showHighRated', 
                filter: { rating: '4.5' }
            }
        });
        document.dispatchEvent(event);
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
            default:
                // Silent fail for unhandled actions
        }
    }

    // Pure data access methods - no UI logic
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

    // Event subscription methods for other components
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

    // Clean destruction
    destroy() {
        // No specific cleanup needed for event-driven architecture
    }
}