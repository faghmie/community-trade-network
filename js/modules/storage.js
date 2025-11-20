// js/modules/storage.js - FIXED SYNC STRATEGY
// ES6 Module for storage management with Supabase sync

export class Storage {
    constructor() {
        this.supabase = null;
        this.debugEnabled = false; // Debug disabled by default
        this.lastKnownCategories = []; // Track last known state for deletion detection
    }

    init(supabase = null) {
        this.supabase = supabase;
    }

    // Save data to localStorage and sync to Supabase (Admin use)
    async save(key, data, options = {}) {
        const { syncToSupabase = true, append = false } = options;

        try {
            // Handle append mode for feedback data
            let finalData = data;
            if (append && key === 'user_feedback') {
                const existingData = await this.load(key, { forceRefresh: false });
                finalData = [...(existingData || []), ...data];
            }

            // Always save to localStorage first
            localStorage.setItem(key, JSON.stringify(finalData));

            // Then sync to Supabase if available (admin operations)
            if (syncToSupabase && this.isSupabaseAvailable()) {
                await this.syncToSupabase(key, finalData);
            }

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
                return localData ? JSON.parse(localData) : [];
            }

            // FOR SHARED DATA: ALWAYS use Supabase as source of truth when available
            if (this.isSupabaseAvailable()) {
                try {
                    const remoteData = await this.loadFromSupabase(key);

                    if (remoteData !== null && remoteData !== undefined) {
                        // For reviews: Only preserve local pending reviews that don't exist in Supabase
                        let finalData = remoteData;
                        if (key === 'reviews') {
                            finalData = await this.mergeReviewsWithLocalPending(remoteData);
                        }

                        // Update localStorage with the final data (Supabase is source of truth)
                        localStorage.setItem(key, JSON.stringify(finalData));
                        
                        // Track categories state for deletion detection
                        if (key === 'categories') {
                            this.lastKnownCategories = [...finalData];
                        }
                        
                        return finalData;
                    }
                } catch (error) {
                    console.warn(`Failed to load ${key} from Supabase, using localStorage:`, error);
                    // Fall through to localStorage
                }
            }

            // Fallback: Use localStorage data (when Supabase is unavailable)
            const localData = localStorage.getItem(key);
            const parsedLocalData = localData ? JSON.parse(localData) : null;

            if (parsedLocalData) {
                return parsedLocalData;
            }

            return null;
        } catch (error) {
            console.error('Error loading data:', error);
            return null;
        }
    }

    // FIXED: Merge reviews - Use Supabase as source of truth, preserve ONLY pending reviews
    async mergeReviewsWithLocalPending(remoteReviews) {
        try {
            // Get local reviews from localStorage
            const localReviewsJson = localStorage.getItem('reviews');
            const localReviews = localReviewsJson ? JSON.parse(localReviewsJson) : [];

            if (!localReviews || localReviews.length === 0) {
                return remoteReviews;
            }

            // CRITICAL FIX: Get the current list of contractors from Supabase to validate reviews
            let validContractors = [];
            try {
                validContractors = await this.loadFromSupabase('contractors') || [];
            } catch (error) {
                console.warn('Could not load contractors from Supabase, cannot validate reviews');
                // If we can't get contractors, we can't properly validate - use remote reviews only
                return remoteReviews;
            }

            // Create a set of valid contractor IDs
            const validContractorIds = new Set();
            validContractors.forEach(contractor => validContractorIds.add(contractor.id));

            // Create a map of remote review IDs for quick lookup
            const remoteReviewIds = new Set();
            remoteReviews.forEach(review => remoteReviewIds.add(review.id));

            // CRITICAL FIX: Find ONLY local pending reviews that should be preserved
            const validLocalPendingReviews = [];
            const staleLocalReviews = [];

            localReviews.forEach(review => {
                const existsInRemote = remoteReviewIds.has(review.id);
                const contractorExists = validContractorIds.has(review.contractor_id);
                const isPending = review.status === 'pending';

                if (existsInRemote) {
                    // Review exists in both remote and local - remote is source of truth, ignore local
                } else if (isPending && contractorExists) {
                    // ONLY preserve local pending reviews for valid contractors
                    validLocalPendingReviews.push(review);
                } else if (!contractorExists) {
                    // Review for deleted contractor - remove it regardless of status
                    staleLocalReviews.push(review);
                } else {
                    // Approved/rejected review that doesn't exist in remote - this is stale data, remove it
                    staleLocalReviews.push(review);
                }
            });

            // Combine remote reviews with ONLY valid local pending reviews
            const mergedReviews = [...remoteReviews, ...validLocalPendingReviews];

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
            const remoteData = await this.loadFromSupabase(key);

            if (remoteData !== null && remoteData !== undefined) {
                // Supabase data is the source of truth for shared data
                localStorage.setItem(key, JSON.stringify(remoteData));
                
                // Track categories state for deletion detection
                if (key === 'categories') {
                    this.lastKnownCategories = [...remoteData];
                }
                
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
            localStorage.removeItem('user_feedback');
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

    // FIXED: Sync specific data to Supabase (admin operations) - NOW HANDLES DELETIONS
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
                    // FIXED: Handle category deletions by comparing with last known state
                    await this.syncCategoriesToSupabase(data);
                    break;

                case 'user_feedback':
                    // Sync feedback data to Supabase
                    await this.syncFeedbackToSupabase(data);
                    break;

                case 'favorites':
                    // Favorites are user-specific, don't sync to Supabase
                    break;

                default:
                    return;
            }
        } catch (error) {
            console.error(`Error syncing ${key} to Supabase:`, error);
            throw error;
        }
    }

    // Sync feedback data to Supabase
    async syncFeedbackToSupabase(feedbackData) {
        if (!feedbackData || !Array.isArray(feedbackData)) {
            console.warn('Invalid feedback data for sync');
            return;
        }

        try {
            for (const feedback of feedbackData) {
                await this.supabase.saveFeedback(feedback);
            }
        } catch (error) {
            console.error('Error syncing feedback to Supabase:', error);
            throw error;
        }
    }

    // Proper category synchronization with deletion handling
    async syncCategoriesToSupabase(currentCategories) {
        if (!currentCategories || !Array.isArray(currentCategories)) {
            console.warn('Invalid categories data for sync');
            return;
        }

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
            await this.supabase.deleteCategory(categoryToDelete.id);
        }

        // Save/update current categories to Supabase
        for (const category of currentCategories) {
            await this.supabase.saveCategory(category);
        }

        // Update last known state
        this.lastKnownCategories = [...currentCategories];
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

                case 'user_feedback':
                    // Load feedback from Supabase
                    remoteData = await this.supabase.getAllFeedback();
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

    // Force refresh all shared data from Supabase
    async forceRefreshAll() {
        if (!this.isSupabaseAvailable()) {
            throw new Error('Cannot force refresh: Supabase not available');
        }

        try {
            const contractors = await this.syncFromSupabase('contractors');
            const reviews = await this.syncFromSupabase('reviews');
            const categories = await this.syncFromSupabase('categories');
            const feedback = await this.syncFromSupabase('user_feedback');

            return { contractors, reviews, categories, feedback };
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
            user_feedback: (JSON.parse(localStorage.getItem('user_feedback') || '[]')).length,
            supabaseStatus: this.isSupabaseAvailable() ? 'available' : 'unavailable'
        };

        return stats;
    }

    // Debug logging utility (kept but disabled by default)
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
    }
}