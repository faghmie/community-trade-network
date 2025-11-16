// js/modules/storage.js
// Clean Storage module - Class-based with UUID support

class Storage {
    constructor() {
        this.supabase = null;
        console.log('🔧 Storage module initialized');
    }

    init(supabase = null) {
        this.supabase = supabase;
        console.log('✅ Storage module initialized with Supabase sync');
    }

    // Save data to localStorage and optionally sync to Supabase
    save(key, data, options = {}) {
        const { syncToSupabase = true, immediate = true } = options;
        
        try {
            // Always save to localStorage immediately for fast UI response
            localStorage.setItem(key, JSON.stringify(data));
            console.log(`💾 Saved to localStorage ${key}:`, data);

            // Sync to Supabase in background if enabled and Supabase is available
            if (syncToSupabase && immediate && this.isSupabaseAvailable()) {
                this.syncToSupabase(key, data).catch(error => {
                    console.warn(`⚠️ Background sync failed for ${key}:`, error);
                });
            }

            return true;
        } catch (error) {
            console.error('❌ Error saving to localStorage:', error);
            return false;
        }
    }

    // Load data from localStorage with Supabase fallback
    async load(key, options = {}) {
        const { preferRemote = false, forceRefresh = false } = options;
        
        try {
            // If force refresh or no local data, try to load from Supabase first
            if ((forceRefresh || !this.exists(key)) && this.isSupabaseAvailable()) {
                try {
                    const remoteData = await this.loadFromSupabase(key);
                    if (remoteData) {
                        // Save the remote data to localStorage for next time
                        localStorage.setItem(key, JSON.stringify(remoteData));
                        console.log(`☁️ Loaded from Supabase and cached to localStorage: ${key}`);
                        return remoteData;
                    }
                } catch (error) {
                    console.warn(`⚠️ Failed to load from Supabase for ${key}:`, error);
                    // Fall back to localStorage
                }
            }

            // Load from localStorage as fallback or if preferRemote is false
            const localData = localStorage.getItem(key);
            if (localData) {
                const parsedData = JSON.parse(localData);
                console.log(`💾 Loaded from localStorage: ${key}`);
                return parsedData;
            }

            return null;
        } catch (error) {
            console.error('❌ Error loading data:', error);
            return null;
        }
    }

    // Remove data from localStorage and optionally from Supabase
    async remove(key, options = {}) {
        const { syncToSupabase = true } = options;
        
        try {
            localStorage.removeItem(key);
            console.log(`🗑️ Removed from localStorage: ${key}`);

            // Note: Bulk removal from Supabase requires specific IDs
            if (syncToSupabase) {
                console.log(`ℹ️ Bulk removal of ${key} from Supabase would require specific IDs`);
            }

            return true;
        } catch (error) {
            console.error('❌ Error removing data:', error);
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
            console.log('🧹 Cleared all app data from localStorage');
            return true;
        } catch (error) {
            console.error('❌ Error clearing localStorage:', error);
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

        console.log(`🔄 Syncing ${key} to Supabase...`);

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
                    
                default:
                    console.warn(`⚠️ No sync handler for key: ${key}`);
                    return;
            }
            
            console.log(`✅ Successfully synced ${key} to Supabase`);
        } catch (error) {
            console.error(`❌ Error syncing ${key} to Supabase:`, error);
            throw error;
        }
    }

    // Load data from Supabase
    async loadFromSupabase(key) {
        if (!this.isSupabaseAvailable()) {
            throw new Error('Cannot load from Supabase: not available');
        }

        console.log(`☁️ Loading ${key} from Supabase...`);

        try {
            switch (key) {
                case 'contractors':
                    return await this.supabase.getAllContractors();
                    
                case 'reviews':
                    return await this.supabase.getAllReviews();
                    
                case 'categories':
                    return await this.supabase.getAllCategories();
                    
                default:
                    console.warn(`⚠️ No load handler for key: ${key}`);
                    return null;
            }
        } catch (error) {
            console.error(`❌ Error loading ${key} from Supabase:`, error);
            throw error;
        }
    }

    // Retry pending syncs (handled by Supabase client)
    async retryPendingSyncs() {
        if (!this.isSupabaseAvailable()) return;

        console.log('🔄 Retrying pending syncs via Supabase client...');
        await this.supabase.processPendingSync();
    }

    // Check if online
    isOnline() {
        return navigator.onLine;
    }

    // Full data sync - useful for initial setup or manual sync
    async fullSync() {
        if (!this.isSupabaseAvailable()) {
            throw new Error('Cannot perform full sync: Supabase not available');
        }

        console.log('🔄 Starting full data sync with Supabase...');

        try {
            // Load all current data from localStorage
            const localData = {
                contractors: this.load('contractors') || [],
                reviews: this.load('reviews') || [],
                categories: this.load('categories') || []
            };

            // Sync each data type individually
            if (localData.contractors.length > 0) {
                await this.syncToSupabase('contractors', localData.contractors);
            }
            if (localData.reviews.length > 0) {
                await this.syncToSupabase('reviews', localData.reviews);
            }
            if (localData.categories.length > 0) {
                await this.syncToSupabase('categories', localData.categories);
            }

            console.log('✅ Full sync completed successfully');
            return true;
        } catch (error) {
            console.error('❌ Full sync failed:', error);
            throw error;
        }
    }

    // Pull latest data from Supabase and update localStorage
    async pullLatest() {
        if (!this.isSupabaseAvailable()) {
            throw new Error('Cannot pull latest data: Supabase not available');
        }

        console.log('⬇️ Pulling latest data from Supabase...');

        try {
            const contractors = await this.loadFromSupabase('contractors');
            const reviews = await this.loadFromSupabase('reviews');
            const categories = await this.loadFromSupabase('categories');

            // Update localStorage with remote data
            if (contractors) {
                this.save('contractors', contractors, { syncToSupabase: false, immediate: false });
            }
            if (reviews) {
                this.save('reviews', reviews, { syncToSupabase: false, immediate: false });
            }
            if (categories) {
                this.save('categories', categories, { syncToSupabase: false, immediate: false });
            }

            console.log('✅ Latest data pulled from Supabase and cached locally');
            return { contractors, reviews, categories };
        } catch (error) {
            console.error('❌ Failed to pull latest data:', error);
            throw error;
        }
    }

    // Get storage statistics
    getStats() {
        const stats = {
            contractors: (this.load('contractors') || []).length,
            reviews: (this.load('reviews') || []).length,
            categories: (this.load('categories') || []).length,
            favorites: (this.load('favorites') || []).length,
            supabaseStatus: this.isSupabaseAvailable() ? this.supabase.getSyncStatus() : 'unavailable'
        };

        console.log('📊 Storage stats:', stats);
        return stats;
    }
}

// Create and export instance
const storage = new Storage();