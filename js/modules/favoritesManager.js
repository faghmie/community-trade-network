// js/modules/favoritesManager.js
// ES6 Module for favorites UI management only

import { showNotification } from './notifications.js';

export class FavoritesManager {
    constructor() {
        this.favoritesDataManager = null;
        this.dataModule = null;
        this.uiManager = null;
        this.initialized = false;
    }

    init(favoritesDataManager, dataModule, uiManager = null) {
        this.favoritesDataManager = favoritesDataManager;
        this.dataModule = dataModule;
        this.uiManager = uiManager;
        this.initialized = true;

        // Set up event listeners for UI updates
        this.setupEventListeners();

        console.log('FavoritesManager (UI) initialized');
    }

    setupEventListeners() {
        // Listen for favorites updates and refresh the UI
        document.addEventListener('favoritesUpdated', () => {
            console.log('Favorites updated event received');
            this.updateFavoritesUI();
            this.showFavoritesSection();
        });

        // Listen for when data is fully loaded
        document.addEventListener('dataReady', () => {
            console.log('Data ready event received in FavoritesManager');
            this.updateFavoritesUI();
            this.showFavoritesSection();
        });

        // Also update UI when contractors are loaded
        document.addEventListener('contractorsUpdated', () => {
            console.log('Contractors updated event received in FavoritesManager');
            this.updateFavoritesUI();
            this.showFavoritesSection();
        });
    }

    updateFavoritesUI() {
        if (!this.favoritesDataManager || !this.dataModule) {
            console.warn('FavoritesManager: Dependencies not ready for UI update');
            return;
        }

        const favoritesCount = this.favoritesDataManager.getFavoritesCount();
        console.log('Updating favorites UI with count:', favoritesCount);

        // Update favorites counter in stats
        const favoritesCountElements = document.querySelectorAll('.favorites-count');
        favoritesCountElements.forEach(element => {
            element.textContent = favoritesCount;
            element.style.display = favoritesCount > 0 ? 'inline' : 'none';
        });

        // Update favorites badge
        const favoritesBadge = document.querySelector('.favorites-badge');
        if (favoritesBadge) {
            favoritesBadge.textContent = favoritesCount;
            favoritesBadge.style.display = favoritesCount > 0 ? 'inline-block' : 'none';
        }

        // Update favorite buttons state
        this.updateFavoriteButtons();

        // Update favorites section visibility
        this.updateFavoritesSectionVisibility();
    }

    updateFavoritesSectionVisibility() {
        const favoritesCount = this.favoritesDataManager.getFavoritesCount();
        const favoritesSection = document.getElementById('favoritesSection');

        if (favoritesSection) {
            if (favoritesCount > 0) {
                favoritesSection.classList.remove('hidden');
                console.log('Showing favorites section with', favoritesCount, 'favorites');
            } else {
                favoritesSection.classList.add('hidden');
                console.log('Hiding favorites section - no favorites');
            }
        }
    }

    updateFavoriteButtons() {
        const favoriteButtons = document.querySelectorAll('.favorite-btn');
        favoriteButtons.forEach(button => {
            const contractorId = button.getAttribute('data-contractor-id');
            if (contractorId) {
                if (this.favoritesDataManager.isFavorite(contractorId)) {
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

    // FIXED: Made toggleFavorite async and properly handle the Promise
    async toggleFavorite(contractorId) {
        if (!contractorId) {
            console.error('No contractor ID provided for toggleFavorite');
            return false;
        }

        console.log('FavoritesManager: toggleFavorite called for:', contractorId);

        try {
            // Await the async operation from the data manager
            const result = await this.favoritesDataManager.toggleFavorite(contractorId);
            const { success, isNowFavorite } = result;

            console.log('FavoritesManager: toggle result:', result);

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

                // Force update favorites section
                this.updateFavoritesSectionVisibility();
                if (isNowFavorite) {
                    this.showFavoritesSection();
                }

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

    updateFavoriteButton(contractorId) {
        const button = document.querySelector(`.favorite-btn[data-contractor-id="${contractorId}"]`);
        if (button && this.favoritesDataManager) {
            if (this.favoritesDataManager.isFavorite(contractorId)) {
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

    getFavoriteContractors() {
        if (!this.dataModule || !this.favoritesDataManager) {
            console.warn('FavoritesManager: Dependencies not ready for getFavoriteContractors');
            return [];
        }

        try {
            const allContractors = this.dataModule.getContractors();
            const favorites = this.favoritesDataManager.getFavorites();
            return allContractors.filter(contractor =>
                contractor && contractor.id && favorites.includes(contractor.id)
            );
        } catch (error) {
            console.error('Error getting favorite contractors:', error);
            return [];
        }
    }

    getFavoritesCount() {
        return this.favoritesDataManager ? this.favoritesDataManager.getFavoritesCount() : 0;
    }

    // Event system for UI updates
    dispatchFavoritesUpdate() {
        const event = new CustomEvent('favoritesUpdated', {
            detail: {
                favorites: this.favoritesDataManager.getFavorites(),
                count: this.favoritesDataManager.getFavoritesCount()
            }
        });
        document.dispatchEvent(event);
    }

    // Show favorites section with actual favorites
    showFavoritesSection() {
        if (!this.dataModule || !this.favoritesDataManager) {
            console.warn('FavoritesManager: Dependencies not ready for showFavoritesSection');
            return;
        }

        const favoritesSection = document.getElementById('favoritesSection');
        const favoritesGrid = document.getElementById('favoritesGrid');
        const favoritesNotice = document.getElementById('favoritesNotice');

        if (!favoritesSection || !favoritesGrid) {
            console.warn('Favorites section elements not found');
            return;
        }

        const favoriteContractors = this.getFavoriteContractors();
        console.log('Showing favorites section with', favoriteContractors.length, 'contractors');

        if (favoriteContractors.length > 0) {
            // Hide notice, show grid
            if (favoritesNotice) {
                favoritesNotice.style.display = 'none';
            }
            favoritesGrid.style.display = 'grid';

            // Render favorite contractors if uiManager is available
            if (this.uiManager && this.uiManager.renderContractors) {
                this.uiManager.renderContractors(favoriteContractors, favoritesGrid);
            } else {
                console.warn('UIManager not available for rendering favorites');
            }

            favoritesSection.classList.remove('hidden');
        } else {
            // Show notice, hide grid
            if (favoritesNotice) {
                favoritesNotice.style.display = 'block';
                favoritesNotice.innerHTML = `
                    <div class="no-favorites">
                        <p>⭐ You haven't added any contractors to favorites yet!</p>
                        <p>Click the heart icon on any contractor card to add them to your favorites.</p>
                    </div>
                `;
            }
            favoritesGrid.style.display = 'none';
            favoritesSection.classList.add('hidden');
        }
    }

    // Export functionality for user backup
    exportFavorites() {
        if (!this.favoritesDataManager || !this.dataModule) {
            console.warn('FavoritesManager: Dependencies not ready for exportFavorites');
            return JSON.stringify({ error: 'Data not ready' }, null, 2);
        }

        const favoriteContractors = this.getFavoriteContractors();
        const favorites = this.favoritesDataManager.exportFavorites();
        const data = {
            favorites: favorites,
            favoriteContractors: favoriteContractors.map(c => ({
                id: c.id,
                name: c.name,
                category: c.category,
                location: c.location
            })),
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        return JSON.stringify(data, null, 2);
    }

    // Import functionality
    async importFavorites(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            if (data.favorites && Array.isArray(data.favorites)) {
                const success = await this.favoritesDataManager.importFavorites(data.favorites);
                if (success) {
                    this.dispatchFavoritesUpdate();
                    showNotification('Favorites imported successfully!', 'success');
                    return true;
                }
            }
        } catch (e) {
            console.error('Invalid favorites data');
            showNotification('Invalid favorites file format', 'error');
        }
        return false;
    }

    // Download favorites as file
    downloadFavorites() {
        const data = this.exportFavorites();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `contractor-favorites-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        showNotification('Favorites exported successfully!', 'success');
    }

    // Handle file import
    handleFavoritesImport(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const success = await this.importFavorites(e.target.result);
            if (!success) {
                showNotification('Failed to import favorites', 'error');
            }
        };
        reader.readAsText(file);
    }

    // Clear all favorites
    async clearFavorites() {
        if (confirm('Are you sure you want to clear all favorites?')) {
            const success = await this.favoritesDataManager.clearFavorites();
            if (success) {
                this.dispatchFavoritesUpdate();
                showNotification('All favorites cleared successfully!', 'success');
            }
            return success;
        }
        return false;
    }
}