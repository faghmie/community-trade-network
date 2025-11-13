// js/modules/favoritesManager.js
const favoritesManager = {
    favorites: [],

    init(storage) {
        this.storage = storage;
        const saved = this.storage.load('favorites');
        
        if (saved && Array.isArray(saved)) {
            this.favorites = saved;
        } else {
            this.favorites = [];
            this.save();
        }
        console.log('Favorites manager initialized with', this.favorites.length, 'favorites');
    },

    save() {
        return this.storage.save('favorites', this.favorites);
    },

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
        }
        
        return isNowFavorite;
    },

    isFavorite(contractorId) {
        return this.favorites.includes(contractorId);
    },

    getFavoriteContractors() {
        const allContractors = contractorManager.getAll();
        return allContractors.filter(contractor => 
            this.favorites.includes(contractor.id)
        );
    },

    getFavoritesCount() {
        return this.favorites.length;
    },

    // Event system for UI updates
    dispatchFavoritesUpdate() {
        const event = new CustomEvent('favoritesUpdated', {
            detail: { favorites: this.favorites }
        });
        document.dispatchEvent(event);
    },

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
    },

    // Import functionality
    importFavorites(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            if (data.favorites && Array.isArray(data.favorites)) {
                this.favorites = data.favorites;
                const success = this.save();
                if (success) {
                    this.dispatchFavoritesUpdate();
                    return true;
                }
            }
        } catch (e) {
            console.error('Invalid favorites data');
        }
        return false;
    },

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
    },

    // Show storage warning (similar to contractorManager error handling)
    showStorageWarning() {
        if (typeof utils !== 'undefined' && utils.showNotification) {
            utils.showNotification('Unable to save favorites. Your browser storage might be full.', 'error');
        } else {
            alert('Unable to save favorites. Your browser storage might be full.');
        }
    },

    // Clear all favorites
    clearFavorites() {
        if (confirm('Are you sure you want to clear all favorites?')) {
            this.favorites = [];
            const success = this.save();
            if (success) {
                this.dispatchFavoritesUpdate();
                if (typeof utils !== 'undefined' && utils.showNotification) {
                    utils.showNotification('All favorites cleared successfully!', 'success');
                }
            }
        }
    }
};