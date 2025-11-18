// js/modules/storage.js - PROPER SYNC STRATEGY
// ES6 Module for storage management with Supabase sync

export class Storage {
    constructor() {
        this.supabase = null;
    }

    init(supabase = null) {
        this.supabase = supabase;
    }

    // Save data to localStorage and sync to Supabase (Admin use)
    async save(key, data, options = {}) {
        const { syncToSupabase = true } = options;

        try {
            // Always save to localStorage first
            localStorage.setItem(key, JSON.stringify(data));

            // Then sync to Supabase if available (admin operations)
            if (syncToSupabase && this.isSupabaseAvailable()) {
                await this.syncToSupabase(key, data);
            }

            console.log(`✅ Storage: Saved ${key} to localStorage${syncToSupabase ? ' and Supabase' : ''}`);
            return true;
        } catch (error) {
            console.error('Error saving data:', error);
            return false;
        }
    }

    // Load data with proper Supabase sync (User use)
    async load(key, options = {}) {
        const { forceRefresh = false } = options;

        try {
            // For user-specific data (favorites), only use localStorage
            if (key === 'favorites') {
                const localData = localStorage.getItem(key);
                return localData ? JSON.parse(localData) : [];
            }

            // Get local data first
            const localData = localStorage.getItem(key);
            const parsedLocalData = localData ? JSON.parse(localData) : null;

            // For shared data, sync with Supabase when available
            if (this.isSupabaseAvailable()) {
                try {
                    console.log(`🔄 Storage: Syncing ${key} with Supabase...`);
                    const remoteData = await this.loadFromSupabase(key);

                    if (remoteData !== null && remoteData !== undefined) {
                        // Merge strategies based on data type
                        const mergedData = this.mergeData(key, parsedLocalData, remoteData);

                        // Save merged data back to localStorage
                        localStorage.setItem(key, JSON.stringify(mergedData));
                        console.log(`✅ Storage: Merged ${key} from Supabase and localStorage:`, mergedData.length || 'data');
                        return mergedData;
                    }
                } catch (error) {
                    console.warn(`⚠️ Storage: Failed to sync ${key} with Supabase, using localStorage:`, error);
                    // Fall through to localStorage
                }
            }

            // Use existing localStorage data
            if (parsedLocalData) {
                console.log(`📁 Storage: Loaded ${key} from localStorage:`, parsedLocalData.length || 'data');
                return parsedLocalData;
            }

            console.log(`📁 Storage: No data found for ${key}`);
            return null;
        } catch (error) {
            console.error('Error loading data:', error);
            return null;
        }
    }

    // Merge local and remote data with proper conflict resolution
    mergeData(key, localData, remoteData) {
        if (!localData) return remoteData;
        if (!remoteData) return localData;

        switch (key) {
            case 'reviews':
                // For reviews: Keep remote approved reviews, merge with local pending reviews
                const remoteReviews = remoteData || [];
                const localReviews = localData || [];

                // Separate local reviews by status
                const localPendingReviews = localReviews.filter(review => review.status === 'pending');
                const localOtherReviews = localReviews.filter(review => review.status !== 'pending');

                // Create a map of remote reviews by ID for quick lookup
                const remoteReviewsMap = new Map();
                remoteReviews.forEach(review => remoteReviewsMap.set(review.id, review));

                // Merge: Start with all remote reviews
                const mergedReviews = [...remoteReviews];

                // Add local pending reviews that don't exist in remote
                localPendingReviews.forEach(localReview => {
                    if (!remoteReviewsMap.has(localReview.id)) {
                        mergedReviews.push(localReview);
                    }
                });

                console.log(`🔀 Reviews merge: Remote=${remoteReviews.length}, LocalPending=${localPendingReviews.length}, Merged=${mergedReviews.length}`);
                return mergedReviews;

            case 'contractors':
                // For contractors: Remote is source of truth, but preserve local favorites status?
                // Since favorites are stored separately, we can use remote as source of truth
                console.log(`🔀 Contractors merge: Using remote data (${remoteData.length} contractors)`);
                return remoteData;

            case 'categories':
                // For categories: Remote is source of truth
                console.log(`🔀 Categories merge: Using remote data (${remoteData.length} categories)`);
                return remoteData;

            default:
                // Default: Remote takes precedence
                return remoteData;
        }
    }

    // Sync from Supabase and update localStorage (for users)
    async syncFromSupabase(key) {
        if (!this.isSupabaseAvailable()) {
            throw new Error('Cannot sync from Supabase: not available');
        }

        try {
            console.log(`📥 Storage: Loading ${key} from Supabase...`);
            const remoteData = await this.loadFromSupabase(key);

            if (remoteData !== null && remoteData !== undefined) {
                // For users: Supabase data is the source of truth for shared data
                localStorage.setItem(key, JSON.stringify(remoteData));
                console.log(`✅ Storage: Synced ${key} from Supabase to localStorage:`, remoteData.length || 'data');
                return remoteData;
            }

            return null;
        } catch (error) {
            console.error(`Error syncing ${key} from Supabase:`, error);
            throw error;
        }
    }

    // Remove data from localStorage
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

    // Sync specific data to Supabase (admin operations)
    async syncToSupabase(key, data) {
        if (!this.isSupabaseAvailable()) {
            throw new Error('Cannot sync: Supabase not available');
        }

        try {
            console.log(`🔄 Storage: Syncing ${key} to Supabase...`);

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
                    // Favorites are user-specific, don't sync to Supabase
                    break;

                default:
                    return;
            }

            console.log(`✅ Storage: Successfully synced ${key} to Supabase`);
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
            let remoteData;
            switch (key) {
                case 'contractors':
                    remoteData = await this.supabase.getAllContractors();
                    break;

                case 'reviews':
                    remoteData = await this.supabase.getAllReviews();
                    break;

                case 'categories':
                    remoteData = await this.supabase.getAllCategories();
                    break;

                case 'favorites':
                    // Favorites are user-specific, don't load from Supabase
                    remoteData = null;
                    break;

                default:
                    return null;
            }

            return remoteData;
        } catch (error) {
            console.error(`Error loading ${key} from Supabase:`, error);
            throw error;
        }
    }

    // Force refresh all shared data from Supabase (user manual sync)
    async forceRefreshAll() {
        if (!this.isSupabaseAvailable()) {
            throw new Error('Cannot force refresh: Supabase not available');
        }

        try {
            console.log('🔄 Storage: Force refreshing all shared data from Supabase...');

            const contractors = await this.syncFromSupabase('contractors');
            const reviews = await this.syncFromSupabase('reviews');
            const categories = await this.syncFromSupabase('categories');

            return { contractors, reviews, categories };
        } catch (error) {
            console.error('Force refresh failed:', error);
            throw error;
        }
    }

    // Get storage statistics
    getStats() {
        return {
            contractors: (JSON.parse(localStorage.getItem('contractors') || '[]')).length,
            reviews: (JSON.parse(localStorage.getItem('reviews') || '[]')).length,
            categories: (JSON.parse(localStorage.getItem('categories') || '[]')).length,
            favorites: (JSON.parse(localStorage.getItem('favorites') || '[]')).length,
            supabaseStatus: this.isSupabaseAvailable() ? 'available' : 'unavailable'
        };
    }
}