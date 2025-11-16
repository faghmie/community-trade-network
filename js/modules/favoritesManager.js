// js/modules/favoritesManager.js - Cleaned up with no backward compatibility
class FavoritesManager {
    constructor() {
        this.favorites = [];
        this.storage = null;
        this.utils = null;
        this.dataModule = null;
        this.uiManager = null;
    }

    init(storage, utils, dataModule, uiManager) {
        this.storage = storage;
        this.utils = utils;
        this.dataModule = dataModule;
        this.uiManager = uiManager;
        const saved = this.storage.load('favorites');
        
        if (saved && Array.isArray(saved)) {
            this.favorites = saved;
        } else {
            this.favorites = [];
            this.save();
        }
        
        // Set up event listeners for UI updates
        this.setupEventListeners();
        
        // Initial UI update
        this.updateFavoritesUI();
        
        console.log('Favorites manager initialized with', this.favorites.length, 'favorites');
    }

    setupEventListeners() {
        // Listen for favorites updates and refresh the UI
        document.addEventListener('favoritesUpdated', () => {
            this.updateFavoritesUI();
        });

        // Also update UI when contractors are loaded
        document.addEventListener('contractorsUpdated', () => {
            this.updateFavoritesUI();
        });
    }

    updateFavoritesUI() {
        const favoritesCount = this.getFavoritesCount();
        
        // Update favorites counter in stats (using class selector)
        const favoritesCountElements = document.querySelectorAll('.favorites-count');
        favoritesCountElements.forEach(element => {
            element.textContent = favoritesCount;
            element.style.display = favoritesCount > 0 ? 'inline' : 'none';
        });

        // Update favorites badge in favorites section
        const favoritesBadge = document.querySelector('.favorites-badge');
        if (favoritesBadge) {
            favoritesBadge.textContent = favoritesCount;
            favoritesBadge.style.display = favoritesCount > 0 ? 'inline-block' : 'none';
        }

        // Update favorite buttons state
        this.updateFavoriteButtons();

        // Show/hide favorites section based on count
        const favoritesSection = document.getElementById('favoritesSection');
        if (favoritesSection) {
            if (favoritesCount > 0) {
                favoritesSection.classList.remove('hidden');
                // Trigger favorites display update
                this.showFavoritesSection();
            } else {
                favoritesSection.classList.add('hidden');
            }
        }

        console.log('Favorites UI updated:', favoritesCount, 'favorites');
    }

    updateFavoriteButtons() {
        const favoriteButtons = document.querySelectorAll('.favorite-btn');
        favoriteButtons.forEach(button => {
            const contractorId = button.getAttribute('data-contractor-id');
            if (contractorId) {
                if (this.isFavorite(contractorId)) {
                    button.classList.add('favorited');
                } else {
                    button.classList.remove('favorited');
                }
            }
        });
    }

    save() {
        return this.storage.save('favorites', this.favorites);
    }

    toggleFavorite(contractorId) {
        const index = this.favorites.indexOf(contractorId);
        let isNowFavorite = false;

        if (index > -1) {
            // Remove from favorites
            this.favorites.splice(index, 1);
            isNowFavorite = false;
        } else {
            // Add to favorites
            this.favorites.push(contractorId);
            isNowFavorite = true;
        }

        const success = this.save();
        if (success) {
            this.dispatchFavoritesUpdate();
            const action = isNowFavorite ? 'added to' : 'removed from';
            this.utils.showNotification(`Contractor ${action} favorites!`, 'success');
        } else {
            this.showStorageWarning();
        }
        
        return isNowFavorite;
    }

    isFavorite(contractorId) {
        return this.favorites.includes(contractorId);
    }

    getFavoriteContractors() {
        const allContractors = this.dataModule.getContractors();
        return allContractors.filter(contractor => 
            this.favorites.includes(contractor.id)
        );
    }

    getFavoritesCount() {
        return this.favorites.length;
    }

    // Event system for UI updates
    dispatchFavoritesUpdate() {
        const event = new CustomEvent('favoritesUpdated', {
            detail: { 
                favorites: this.favorites,
                count: this.favorites.length 
            }
        });
        document.dispatchEvent(event);
    }

    // Show favorites section with actual favorites
    showFavoritesSection() {
        const favoritesSection = document.getElementById('favoritesSection');
        const favoritesGrid = document.getElementById('favoritesGrid');
        const favoritesNotice = document.getElementById('favoritesNotice');
        
        if (!favoritesSection || !favoritesGrid) return;

        const favoriteContractors = this.getFavoriteContractors();
        
        if (favoriteContractors.length > 0) {
            // Hide notice, show grid
            if (favoritesNotice) {
                favoritesNotice.style.display = 'none';
            }
            favoritesGrid.style.display = 'grid';
            
            // Render favorite contractors
            this.uiManager.renderContractors(favoriteContractors, favoritesGrid);
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
        }
        
        favoritesSection.classList.remove('hidden');
    }

    // Export functionality for user backup
    exportFavorites() {
        const favoriteContractors = this.getFavoriteContractors();
        const data = {
            favorites: this.favorites,
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
    importFavorites(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            if (data.favorites && Array.isArray(data.favorites)) {
                this.favorites = data.favorites;
                const success = this.save();
                if (success) {
                    this.dispatchFavoritesUpdate();
                    this.utils.showNotification('Favorites imported successfully!', 'success');
                    return true;
                }
            }
        } catch (e) {
            console.error('Invalid favorites data');
            this.utils.showNotification('Invalid favorites file format', 'error');
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
        
        this.utils.showNotification('Favorites exported successfully!', 'success');
    }

    // Handle file import
    handleFavoritesImport(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const success = this.importFavorites(e.target.result);
            if (!success) {
                this.utils.showNotification('Failed to import favorites', 'error');
            }
        };
        reader.readAsText(file);
    }

    // Show storage warning
    showStorageWarning() {
        this.utils.showNotification('Unable to save favorites. Your browser storage might be full.', 'error');
    }

    // Clear all favorites
    clearFavorites() {
        if (confirm('Are you sure you want to clear all favorites?')) {
            this.favorites = [];
            const success = this.save();
            if (success) {
                this.dispatchFavoritesUpdate();
                this.utils.showNotification('All favorites cleared successfully!', 'success');
            }
        }
    }
}

// Create singleton instance
const favoritesManager = new FavoritesManager();