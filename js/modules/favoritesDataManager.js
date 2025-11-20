// js/modules/favoritesDataManager.js
// ES6 Module for favorites data management only

export class FavoritesDataManager {
    constructor() {
        this.favorites = [];
        this.storage = null;
        this.initialized = false;
        this.contractorManager = null; // Reference to validate favorites
    }

    async init(storage, contractorManager = null) {
        this.storage = storage;
        this.contractorManager = contractorManager;
        
        try {
            // Load favorites from storage - await the async load
            const saved = await this.storage.load('favorites');
            
            if (saved && Array.isArray(saved)) {
                this.favorites = saved;
                // Auto-cleanup on initialization
                await this.cleanupFavorites();
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
            // Auto-cleanup before saving
            await this.cleanupFavorites();
            
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

        // First ensure we have valid favorites
        await this.cleanupFavorites();

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
            // Add to favorites - but only if contractor exists
            if (await this.isContractorValid(contractorId)) {
                this.favorites.push(contractorId);
                isNowFavorite = true;
                console.log('Added contractor to favorites:', contractorId);
            } else {
                console.error('Cannot add favorite: Contractor does not exist:', contractorId);
                return { success: false, isNowFavorite: false };
            }
        }

        const success = await this.save();
        console.log('Toggle favorite - New favorites:', this.favorites);
        console.log('Toggle favorite - Save success:', success);
        console.log('Toggle favorite - Is now favorite:', isNowFavorite);
        
        return { success, isNowFavorite };
    }

    isFavorite(contractorId) {
        // Always check against cleaned favorites
        const isFav = this.favorites.includes(contractorId);
        console.log('isFavorite check:', contractorId, '=', isFav);
        return isFav;
    }

    getFavorites() {
        // Return copy of cleaned favorites
        return [...this.favorites];
    }

    getFavoritesCount() {
        // Always return count of valid favorites
        return this.favorites.length;
    }

    // Internal cleanup method - automatically removes invalid favorites
    async cleanupFavorites() {
        if (!this.contractorManager) {
            console.warn('FavoritesDataManager: No contractor manager available for cleanup');
            return false;
        }

        try {
            const validContractorIds = await this.getValidContractorIds();
            const initialCount = this.favorites.length;
            
            // Filter out favorites that reference non-existent contractors
            const cleanedFavorites = this.favorites.filter(contractorId => 
                validContractorIds.has(contractorId)
            );

            const removedCount = initialCount - cleanedFavorites.length;
            
            if (removedCount > 0) {
                console.log(`🧹 Cleaned up ${removedCount} favorites for deleted contractors`);
                this.favorites = cleanedFavorites;
                await this.save(); // Save the cleaned list
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error cleaning up favorites:', error);
            return false;
        }
    }

    // Helper method to check if a contractor exists
    async isContractorValid(contractorId) {
        if (!this.contractorManager) return false;
        
        try {
            const contractor = this.contractorManager.getById(contractorId);
            return !!contractor;
        } catch (error) {
            console.error('Error checking contractor validity:', error);
            return false;
        }
    }

    // Helper method to get valid contractor IDs
    async getValidContractorIds() {
        if (!this.contractorManager) return new Set();
        
        try {
            const contractors = this.contractorManager.getAll();
            return new Set(contractors.map(c => c.id));
        } catch (error) {
            console.error('Error getting valid contractor IDs:', error);
            return new Set();
        }
    }

    // Set contractor manager reference (can be called after init)
    setContractorManager(contractorManager) {
        this.contractorManager = contractorManager;
        console.log('FavoritesDataManager: Contractor manager set');
    }

    // Refresh favorites from storage
    async refresh() {
        try {
            const saved = await this.storage.load('favorites');
            if (saved && Array.isArray(saved)) {
                this.favorites = saved;
                // Auto-cleanup after refresh
                await this.cleanupFavorites();
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