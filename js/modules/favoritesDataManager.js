// js/modules/favoritesDataManager.js
// ES6 Module for favorites data management only

export class FavoritesDataManager {
    constructor() {
        this.favorites = [];
        this.storage = null;
        this.initialized = false;
    }

    async init(storage) {
        this.storage = storage;
        
        try {
            // Load favorites from storage - await the async load
            const saved = await this.storage.load('favorites');
            
            if (saved && Array.isArray(saved)) {
                this.favorites = saved;
            } else {
                this.favorites = [];
                await this.save();
            }
            
            this.initialized = true;
            console.log('FavoritesDataManager initialized with', this.favorites.length, 'favorites');
        } catch (error) {
            console.error('Error initializing FavoritesDataManager:', error);
            this.favorites = [];
            this.initialized = true; // Mark as initialized anyway to prevent blocking
        }
    }

    async save() {
        try {
            // Use the dedicated favorites save method if available, otherwise fallback
            let success;
            if (typeof this.storage.saveFavorites === 'function') {
                success = await this.storage.saveFavorites(this.favorites);
            } else {
                success = this.storage.save('favorites', this.favorites, { 
                    syncToSupabase: false, 
                    immediate: true 
                });
            }
            
            if (success) {
                console.log('Favorites saved successfully:', this.favorites);
            } else {
                console.error('Failed to save favorites');
            }
            return success;
        } catch (error) {
            console.error('Error saving favorites:', error);
            return false;
        }
    }

    // Pure data operations
    async toggleFavorite(contractorId) {
        if (!contractorId) {
            console.error('No contractor ID provided for toggleFavorite');
            return { success: false, isNowFavorite: false };
        }

        const index = this.favorites.indexOf(contractorId);
        let isNowFavorite = false;

        console.log('Toggle favorite - Current favorites:', this.favorites);
        console.log('Toggle favorite - Looking for:', contractorId);
        console.log('Toggle favorite - Found at index:', index);

        if (index > -1) {
            // Remove from favorites
            this.favorites.splice(index, 1);
            isNowFavorite = false;
            console.log('Removed contractor from favorites:', contractorId);
        } else {
            // Add to favorites
            this.favorites.push(contractorId);
            isNowFavorite = true;
            console.log('Added contractor to favorites:', contractorId);
        }

        const success = await this.save();
        console.log('Toggle favorite - New favorites:', this.favorites);
        console.log('Toggle favorite - Save success:', success);
        console.log('Toggle favorite - Is now favorite:', isNowFavorite);
        
        return { success, isNowFavorite };
    }

    isFavorite(contractorId) {
        const isFav = this.favorites.includes(contractorId);
        console.log('isFavorite check:', contractorId, '=', isFav);
        return isFav;
    }

    getFavorites() {
        return [...this.favorites]; // Return copy to prevent mutation
    }

    getFavoritesCount() {
        return this.favorites.length;
    }

    // REMOVED: Import/export operations including:
    // - importFavorites()
    // - exportFavorites() 
    // - clearFavorites()

    // Refresh favorites from storage
    async refresh() {
        try {
            const saved = await this.storage.load('favorites');
            if (saved && Array.isArray(saved)) {
                this.favorites = saved;
                console.log('Favorites refreshed from storage:', this.favorites.length, 'favorites');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error refreshing favorites:', error);
            return false;
        }
    }
}