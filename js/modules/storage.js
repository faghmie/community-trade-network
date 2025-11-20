// js/modules/storage.js - FIXED SYNC STRATEGY WITH DEBUG LOGGING
// ES6 Module for storage management with Supabase sync

export class Storage {
    constructor() {
        this.supabase = null;
        this.debugEnabled = true;
        this.lastKnownCategories = []; // Track last known state for deletion detection
    }

    init(supabase = null) {
        this.supabase = supabase;
        this._debug('Storage initialized with Supabase:', !!supabase);
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

            this._debug(`✅ Saved ${key} to localStorage${syncToSupabase ? ' and Supabase' : ''}`, data.length || 'data');
            return true;
        } catch (error) {
            console.error('Error saving data:', error);
            return false;
        }
    }

    // Load data - ALWAYS use Supabase as source of truth for shared data
    async load(key, options = {}) {
        const { forceRefresh = false } = options;

        try {
            // For user-specific data (favorites), only use localStorage
            if (key === 'favorites') {
                const localData = localStorage.getItem(key);
                this._debug(`📁 Loading ${key} from localStorage only (user-specific)`);
                return localData ? JSON.parse(localData) : [];
            }

            // FOR SHARED DATA: ALWAYS use Supabase as source of truth when available
            if (this.isSupabaseAvailable()) {
                try {
                    this._debug(`🔄 Loading ${key} from Supabase (source of truth)...`);
                    const remoteData = await this.loadFromSupabase(key);

                    if (remoteData !== null && remoteData !== undefined) {
                        this._debug(`📥 Received ${key} from Supabase:`, remoteData.length || 'data');

                        // For reviews: Only preserve local pending reviews that don't exist in Supabase
                        let finalData = remoteData;
                        if (key === 'reviews') {
                            finalData = await this.mergeReviewsWithLocalPending(remoteData);
                            this._debug(`🔀 After merge: ${finalData.length} total reviews`);
                        }

                        // Update localStorage with the final data (Supabase is source of truth)
                        localStorage.setItem(key, JSON.stringify(finalData));
                        
                        // Track categories state for deletion detection
                        if (key === 'categories') {
                            this.lastKnownCategories = [...finalData];
                        }
                        
                        this._debug(`✅ Loaded ${key} from Supabase and updated localStorage:`, finalData.length || 'data');
                        return finalData;
                    } else {
                        this._debug(`❌ No ${key} data received from Supabase`);
                    }
                } catch (error) {
                    console.warn(`⚠️ Storage: Failed to load ${key} from Supabase, using localStorage:`, error);
                    // Fall through to localStorage
                }
            } else {
                this._debug(`❌ Supabase not available for ${key}, using localStorage`);
            }

            // Fallback: Use localStorage data (when Supabase is unavailable)
            const localData = localStorage.getItem(key);
            const parsedLocalData = localData ? JSON.parse(localData) : null;

            if (parsedLocalData) {
                this._debug(`📁 Loaded ${key} from localStorage (Supabase unavailable):`, parsedLocalData.length || 'data');
                return parsedLocalData;
            }

            this._debug(`📁 No data found for ${key}`);
            return null;
        } catch (error) {
            console.error('Error loading data:', error);
            return null;
        }
    }

    // FIXED: Merge reviews - Use Supabase as source of truth, preserve ONLY pending reviews
    async mergeReviewsWithLocalPending(remoteReviews) {
        this._debug('🔄 Starting reviews merge process...');
        this._debug(`📊 Remote reviews from Supabase: ${remoteReviews.length}`);

        try {
            // Get local reviews from localStorage
            const localReviewsJson = localStorage.getItem('reviews');
            const localReviews = localReviewsJson ? JSON.parse(localReviewsJson) : [];

            this._debug(`📊 Local reviews from localStorage: ${localReviews.length}`);

            if (!localReviews || localReviews.length === 0) {
                this._debug('📊 No local reviews to merge, returning remote only');
                return remoteReviews;
            }

            // CRITICAL FIX: Get the current list of contractors from Supabase to validate reviews
            let validContractors = [];
            try {
                this._debug('🔍 Loading valid contractors from Supabase for review validation...');
                validContractors = await this.loadFromSupabase('contractors') || [];
                this._debug(`🔍 Found ${validContractors.length} valid contractors from Supabase`);
            } catch (error) {
                console.warn('⚠️ Merge: Could not load contractors from Supabase, cannot validate reviews');
                // If we can't get contractors, we can't properly validate - use remote reviews only
                return remoteReviews;
            }

            // Create a set of valid contractor IDs
            const validContractorIds = new Set();
            validContractors.forEach(contractor => validContractorIds.add(contractor.id));
            this._debug(`🔍 Valid contractor IDs: ${Array.from(validContractorIds).join(', ')}`);

            // Create a map of remote review IDs for quick lookup
            const remoteReviewIds = new Set();
            remoteReviews.forEach(review => remoteReviewIds.add(review.id));
            this._debug(`🔍 Remote review IDs: ${Array.from(remoteReviewIds).join(', ')}`);

            // CRITICAL FIX: Find ONLY local pending reviews that should be preserved
            const validLocalPendingReviews = [];
            const staleLocalReviews = [];

            localReviews.forEach(review => {
                const existsInRemote = remoteReviewIds.has(review.id);
                const contractorExists = validContractorIds.has(review.contractor_id);
                const isPending = review.status === 'pending';

                if (existsInRemote) {
                    // Review exists in both remote and local - remote is source of truth, ignore local
                    this._debug(`✅ Review ${review.id} exists in remote, using remote version`);
                } else if (isPending && contractorExists) {
                    // ONLY preserve local pending reviews for valid contractors
                    validLocalPendingReviews.push(review);
                    this._debug(`✅ Keeping local pending review: ${review.id} for contractor ${review.contractor_id}`);
                } else if (!contractorExists) {
                    // Review for deleted contractor - remove it regardless of status
                    staleLocalReviews.push(review);
                    this._debug(`🗑️ Removing review for deleted contractor: ${review.id} for contractor ${review.contractor_id}`);
                } else {
                    // Approved/rejected review that doesn't exist in remote - this is stale data, remove it
                    staleLocalReviews.push(review);
                    this._debug(`🗑️ Removing stale ${review.status} review: ${review.id} (not in Supabase)`);
                }
            });

            this._debug(`📊 Valid local pending reviews to preserve: ${validLocalPendingReviews.length}`);
            this._debug(`📊 Stale local reviews removed: ${staleLocalReviews.length}`);

            // Combine remote reviews with ONLY valid local pending reviews
            const mergedReviews = [...remoteReviews, ...validLocalPendingReviews];

            this._debug(`🔀 Reviews merge complete: Remote=${remoteReviews.length}, ValidLocalPending=${validLocalPendingReviews.length}, Merged=${mergedReviews.length}`);

            // Log data cleanup
            if (staleLocalReviews.length > 0) {
                this._debug(`🧹 Cleaned up ${staleLocalReviews.length} stale reviews (approved/rejected not in Supabase or for deleted contractors)`);
            }

            return mergedReviews;

        } catch (error) {
            console.error('Error merging reviews:', error);
            return remoteReviews; // Fallback to remote data only
        }
    }

    // Sync from Supabase and update localStorage
    async syncFromSupabase(key) {
        if (!this.isSupabaseAvailable()) {
            throw new Error('Cannot sync from Supabase: not available');
        }

        try {
            this._debug(`📥 Syncing ${key} from Supabase...`);
            const remoteData = await this.loadFromSupabase(key);

            if (remoteData !== null && remoteData !== undefined) {
                // Supabase data is the source of truth for shared data
                localStorage.setItem(key, JSON.stringify(remoteData));
                
                // Track categories state for deletion detection
                if (key === 'categories') {
                    this.lastKnownCategories = [...remoteData];
                }
                
                this._debug(`✅ Synced ${key} from Supabase to localStorage:`, remoteData.length || 'data');
                return remoteData;
            }

            this._debug(`❌ No data received for ${key} from Supabase`);
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
            this._debug(`🗑️ Removed ${key} from localStorage`);
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
            this._debug('🧹 Cleared all app data from localStorage');
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
        const available = this.supabase &&
            this.supabase.initialized &&
            this.supabase.status === 'online';

        if (!available) {
            this._debug('❌ Supabase not available');
        }
        return available;
    }

    // FIXED: Sync specific data to Supabase (admin operations) - NOW HANDLES DELETIONS
    async syncToSupabase(key, data) {
        if (!this.isSupabaseAvailable()) {
            throw new Error('Cannot sync: Supabase not available');
        }

        try {
            this._debug(`🔄 Syncing ${key} to Supabase...`);

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
                    // FIXED: Handle category deletions by comparing with last known state
                    await this.syncCategoriesToSupabase(data);
                    break;

                case 'favorites':
                    // Favorites are user-specific, don't sync to Supabase
                    break;

                default:
                    return;
            }

            this._debug(`✅ Successfully synced ${key} to Supabase`);
        } catch (error) {
            console.error(`Error syncing ${key} to Supabase:`, error);
            throw error;
        }
    }

    // NEW: Proper category synchronization with deletion handling
    async syncCategoriesToSupabase(currentCategories) {
        if (!currentCategories || !Array.isArray(currentCategories)) {
            console.warn('Invalid categories data for sync');
            return;
        }

        this._debug(`🔄 Syncing categories: ${currentCategories.length} current, ${this.lastKnownCategories.length} last known`);

        // Create maps for comparison
        const currentCategoryMap = new Map();
        const lastKnownCategoryMap = new Map();

        currentCategories.forEach(cat => currentCategoryMap.set(cat.id, cat));
        this.lastKnownCategories.forEach(cat => lastKnownCategoryMap.set(cat.id, cat));

        // Find categories to delete (in last known but not in current)
        const categoriesToDelete = [];
        for (const [id, category] of lastKnownCategoryMap) {
            if (!currentCategoryMap.has(id)) {
                categoriesToDelete.push(category);
            }
        }

        // Delete removed categories from Supabase
        for (const categoryToDelete of categoriesToDelete) {
            this._debug(`🗑️ Deleting category from Supabase: ${categoryToDelete.name} (${categoryToDelete.id})`);
            await this.supabase.deleteCategory(categoryToDelete.id);
        }

        // Save/update current categories to Supabase
        for (const category of currentCategories) {
            this._debug(`💾 Saving category to Supabase: ${category.name} (${category.id})`);
            await this.supabase.saveCategory(category);
        }

        // Update last known state
        this.lastKnownCategories = [...currentCategories];

        this._debug(`✅ Category sync complete: ${currentCategories.length} saved, ${categoriesToDelete.length} deleted`);
    }

    // Load data from Supabase
    async loadFromSupabase(key) {
        if (!this.isSupabaseAvailable()) {
            throw new Error('Cannot load from Supabase: not available');
        }

        try {
            this._debug(`📥 Loading ${key} directly from Supabase...`);
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

            this._debug(`📥 Received ${key} from Supabase:`, remoteData ? remoteData.length : 'no data');
            return remoteData;
        } catch (error) {
            console.error(`Error loading ${key} from Supabase:`, error);
            throw error;
        }
    }

    // Force refresh all shared data from Supabase
    async forceRefreshAll() {
        if (!this.isSupabaseAvailable()) {
            throw new Error('Cannot force refresh: Supabase not available');
        }

        try {
            this._debug('🔄🔄 FORCE refreshing all shared data from Supabase...');

            const contractors = await this.syncFromSupabase('contractors');
            const reviews = await this.syncFromSupabase('reviews');
            const categories = await this.syncFromSupabase('categories');

            this._debug('✅ Force refresh completed:', {
                contractors: contractors ? contractors.length : 0,
                reviews: reviews ? reviews.length : 0,
                categories: categories ? categories.length : 0
            });

            return { contractors, reviews, categories };
        } catch (error) {
            console.error('Force refresh failed:', error);
            throw error;
        }
    }

    // Get storage statistics
    getStats() {
        const stats = {
            contractors: (JSON.parse(localStorage.getItem('contractors') || '[]')).length,
            reviews: (JSON.parse(localStorage.getItem('reviews') || '[]')).length,
            categories: (JSON.parse(localStorage.getItem('categories') || '[]')).length,
            favorites: (JSON.parse(localStorage.getItem('favorites') || '[]')).length,
            supabaseStatus: this.isSupabaseAvailable() ? 'available' : 'unavailable'
        };

        this._debug('📊 Storage stats:', stats);
        return stats;
    }

    // Debug logging utility
    _debug(message, data = null) {
        if (this.debugEnabled) {
            if (data) {
                console.log(`[Storage] ${message}`, data);
            } else {
                console.log(`[Storage] ${message}`);
            }
        }
    }

    // Enable/disable debug logging
    setDebug(enabled) {
        this.debugEnabled = enabled;
        console.log(`[Storage] Debug logging ${enabled ? 'enabled' : 'disabled'}`);
    }
}