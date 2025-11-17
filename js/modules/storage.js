// js/modules/storage.js
// ES6 Module for storage management with Supabase sync

export class Storage {
    constructor() {
        this.supabase = null;
    }

    init(supabase = null) {
        this.supabase = supabase;
    }

    // Save data to localStorage and optionally sync to Supabase
    save(key, data, options = {}) {
        const { syncToSupabase = true, immediate = true } = options;
        
        try {
            localStorage.setItem(key, JSON.stringify(data));

            if (syncToSupabase && immediate && this.isSupabaseAvailable()) {
                this.syncToSupabase(key, data).catch(error => {
                    console.warn(`Background sync failed for ${key}:`, error);
                });
            }

            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    }

    // Load data from localStorage with Supabase fallback
    async load(key, options = {}) {
        const { preferRemote = false, forceRefresh = false } = options;
        
        try {
            // For favorites, always load from localStorage first as they are user-specific
            if (key === 'favorites') {
                const localData = localStorage.getItem(key);
                return localData ? JSON.parse(localData) : [];
            }

            if ((forceRefresh || !this.exists(key)) && this.isSupabaseAvailable()) {
                try {
                    const remoteData = await this.loadFromSupabase(key);
                    if (remoteData) {
                        localStorage.setItem(key, JSON.stringify(remoteData));
                        return remoteData;
                    }
                } catch (error) {
                    // Fall back to localStorage
                }
            }

            const localData = localStorage.getItem(key);
            if (localData) {
                return JSON.parse(localData);
            }

            return null;
        } catch (error) {
            console.error('Error loading data:', error);
            return null;
        }
    }

    // Remove data from localStorage and optionally from Supabase
    async remove(key, options = {}) {
        const { syncToSupabase = true } = options;
        
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing data:', error);
            return false;
        }
    }

    // Clear all app data from localStorage
    clear() {
        try {
            localStorage.removeItem('contractors');
            localStorage.removeItem('reviews');
            localStorage.removeItem('categories');
            localStorage.removeItem('favorites');
            localStorage.removeItem('locations');
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    }

    // Check if data exists in localStorage
    exists(key) {
        return localStorage.getItem(key) !== null;
    }

    // Check if Supabase is available
    isSupabaseAvailable() {
        return this.supabase && 
               this.supabase.initialized &&
               this.supabase.status === 'online';
    }

    // Sync specific data to Supabase
    async syncToSupabase(key, data) {
        if (!this.isSupabaseAvailable()) {
            throw new Error('Cannot sync: Supabase not available');
        }

        try {
            switch (key) {
                case 'contractors':
                    if (data && data.length > 0) {
                        for (const contractor of data) {
                            await this.supabase.saveContractor(contractor);
                        }
                    }
                    break;
                    
                case 'reviews':
                    if (data && data.length > 0) {
                        for (const review of data) {
                            await this.supabase.saveReview(review);
                        }
                    }
                    break;
                    
                case 'categories':
                    if (data && data.length > 0) {
                        for (const category of data) {
                            await this.supabase.saveCategory(category);
                        }
                    }
                    break;
                    
                case 'favorites':
                    // Favorites are user-specific and typically don't sync to Supabase
                    // But we'll save them if the method exists
                    if (data && data.length > 0 && typeof this.supabase.saveFavorites === 'function') {
                        await this.supabase.saveFavorites(data);
                    }
                    break;
                    
                default:
                    return;
            }
        } catch (error) {
            console.error(`Error syncing ${key} to Supabase:`, error);
            throw error;
        }
    }

    // Load data from Supabase
    async loadFromSupabase(key) {
        if (!this.isSupabaseAvailable()) {
            throw new Error('Cannot load from Supabase: not available');
        }

        try {
            switch (key) {
                case 'contractors':
                    return await this.supabase.getAllContractors();
                    
                case 'reviews':
                    return await this.supabase.getAllReviews();
                    
                case 'categories':
                    return await this.supabase.getAllCategories();
                    
                case 'favorites':
                    // Favorites are user-specific, load from localStorage only
                    if (typeof this.supabase.getFavorites === 'function') {
                        return await this.supabase.getFavorites();
                    }
                    return null;
                    
                default:
                    return null;
            }
        } catch (error) {
            console.error(`Error loading ${key} from Supabase:`, error);
            throw error;
        }
    }

    // Retry pending syncs
    async retryPendingSyncs() {
        if (!this.isSupabaseAvailable()) return;
        await this.supabase.processPendingSync();
    }

    // Check if online
    isOnline() {
        return navigator.onLine;
    }

    // Full data sync
    async fullSync() {
        if (!this.isSupabaseAvailable()) {
            throw new Error('Cannot perform full sync: Supabase not available');
        }

        try {
            const localData = {
                contractors: await this.load('contractors') || [],
                reviews: await this.load('reviews') || [],
                categories: await this.load('categories') || [],
                favorites: await this.load('favorites') || []
            };

            if (localData.contractors.length > 0) {
                await this.syncToSupabase('contractors', localData.contractors);
            }
            if (localData.reviews.length > 0) {
                await this.syncToSupabase('reviews', localData.reviews);
            }
            if (localData.categories.length > 0) {
                await this.syncToSupabase('categories', localData.categories);
            }
            if (localData.favorites.length > 0 && typeof this.supabase.saveFavorites === 'function') {
                await this.syncToSupabase('favorites', localData.favorites);
            }

            return true;
        } catch (error) {
            console.error('Full sync failed:', error);
            throw error;
        }
    }

    // Pull latest data from Supabase and update localStorage
    async pullLatest() {
        if (!this.isSupabaseAvailable()) {
            throw new Error('Cannot pull latest data: Supabase not available');
        }

        try {
            const contractors = await this.loadFromSupabase('contractors');
            const reviews = await this.loadFromSupabase('reviews');
            const categories = await this.loadFromSupabase('categories');

            if (contractors) {
                this.save('contractors', contractors, { syncToSupabase: false, immediate: false });
            }
            if (reviews) {
                this.save('reviews', reviews, { syncToSupabase: false, immediate: false });
            }
            if (categories) {
                this.save('categories', categories, { syncToSupabase: false, immediate: false });
            }

            return { contractors, reviews, categories };
        } catch (error) {
            console.error('Failed to pull latest data:', error);
            throw error;
        }
    }

    // Get storage statistics
    getStats() {
        return {
            contractors: (this.load('contractors') || []).length,
            reviews: (this.load('reviews') || []).length,
            categories: (this.load('categories') || []).length,
            favorites: (this.load('favorites') || []).length,
            supabaseStatus: this.isSupabaseAvailable() ? this.supabase.getSyncStatus() : 'unavailable'
        };
    }

    // Special method for favorites persistence
    async saveFavorites(favorites) {
        return this.save('favorites', favorites, { 
            syncToSupabase: false, // Favorites typically don't sync to avoid user conflicts
            immediate: true 
        });
    }

    async loadFavorites() {
        return this.load('favorites');
    }
}