// js/modules/storage.js - UPDATED: Add recommendation support
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
                        // For recommendations: Only preserve local pending recommendations that don't exist in Supabase
                        let finalData = remoteData;
                        if (key === 'recommendations') {
                            finalData = await this.mergeRecommendationsWithLocalPending(remoteData);
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

    // NEW: Merge recommendations - Use Supabase as source of truth, preserve ONLY pending recommendations
    async mergeRecommendationsWithLocalPending(remoteRecommendations) {
        try {
            // Get local recommendations from localStorage
            const localRecommendationsJson = localStorage.getItem('recommendations');
            const localRecommendations = localRecommendationsJson ? JSON.parse(localRecommendationsJson) : [];

            if (!localRecommendations || localRecommendations.length === 0) {
                return remoteRecommendations;
            }

            // CRITICAL: Get the current list of contractors from Supabase to validate recommendations
            let validContractors = [];
            try {
                validContractors = await this.loadFromSupabase('contractors') || [];
            } catch (error) {
                console.warn('Could not load contractors from Supabase, cannot validate recommendations');
                // If we can't get contractors, we can't properly validate - use remote recommendations only
                return remoteRecommendations;
            }

            // Create a set of valid contractor IDs
            const validContractorIds = new Set();
            validContractors.forEach(contractor => validContractorIds.add(contractor.id));

            // Create a map of remote recommendation IDs for quick lookup
            const remoteRecommendationIds = new Set();
            remoteRecommendations.forEach(recommendation => remoteRecommendationIds.add(recommendation.id));

            // CRITICAL: Find ONLY local pending recommendations that should be preserved
            const validLocalPendingRecommendations = [];
            const staleLocalRecommendations = [];

            localRecommendations.forEach(recommendation => {
                const existsInRemote = remoteRecommendationIds.has(recommendation.id);
                const contractorExists = validContractorIds.has(recommendation.contractor_id);
                const isPending = recommendation.moderationStatus === 'pending';

                if (existsInRemote) {
                    // Recommendation exists in both remote and local - remote is source of truth, ignore local
                } else if (isPending && contractorExists) {
                    // ONLY preserve local pending recommendations for valid contractors
                    validLocalPendingRecommendations.push(recommendation);
                } else if (!contractorExists) {
                    // Recommendation for deleted contractor - remove it regardless of status
                    staleLocalRecommendations.push(recommendation);
                } else {
                    // Approved/rejected recommendation that doesn't exist in remote - this is stale data, remove it
                    staleLocalRecommendations.push(recommendation);
                }
            });

            // Combine remote recommendations with ONLY valid local pending recommendations
            const mergedRecommendations = [...remoteRecommendations, ...validLocalPendingRecommendations];

            return mergedRecommendations;

        } catch (error) {
            console.error('Error merging recommendations:', error);
            return remoteRecommendations; // Fallback to remote data only
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
            localStorage.removeItem('recommendations');
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

    // UPDATED: Sync specific data to Supabase (admin operations) - NOW INCLUDES RECOMMENDATIONS
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

                case 'recommendations':
                    if (data && data.length > 0) {
                        for (const recommendation of data) {
                            await this.supabase.saveRecommendation(recommendation);
                        }
                    }
                    break;

                case 'categories':
                    // Handle category deletions by comparing with last known state
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

    // UPDATED: Load data from Supabase - NOW INCLUDES RECOMMENDATIONS
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

                case 'recommendations':
                    remoteData = await this.supabase.getAllRecommendations();
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

    // UPDATED: Force refresh all shared data from Supabase - NOW INCLUDES RECOMMENDATIONS
    async forceRefreshAll() {
        if (!this.isSupabaseAvailable()) {
            throw new Error('Cannot force refresh: Supabase not available');
        }

        try {
            const contractors = await this.syncFromSupabase('contractors');
            const recommendations = await this.syncFromSupabase('recommendations');
            const categories = await this.syncFromSupabase('categories');
            const feedback = await this.syncFromSupabase('user_feedback');

            return { contractors, recommendations, categories, feedback };
        } catch (error) {
            console.error('Force refresh failed:', error);
            throw error;
        }
    }

    // UPDATED: Get storage statistics - NOW INCLUDES RECOMMENDATIONS
    getStats() {
        const stats = {
            contractors: (JSON.parse(localStorage.getItem('contractors') || '[]')).length,
            recommendations: (JSON.parse(localStorage.getItem('recommendations') || '[]')).length,
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