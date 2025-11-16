// js/modules/supabase.js
// Supabase Integration - Main Supabase client and data operations

class SupabaseClient {
    constructor() {
        this.supabaseUrl = window.SUPABASE_URL || null;
        this.supabaseAnonKey = window.SUPABASE_ANON_KEY || null;
        this.initialized = false;
        this.status = 'offline';
        this.client = null;
        this.pendingSync = [];

        console.log('🔧 SupabaseClient created');

        // Auto-initialize
        this.autoInit();
    }

    async init() {
        if (!this.supabaseUrl || !this.supabaseAnonKey) {
            console.warn('Supabase credentials not found. Running in offline mode.');
            this.status = 'offline';
            return false;
        }

        try {
            this.client = window.supabase.createClient(this.supabaseUrl, this.supabaseAnonKey);
            this.initialized = true;

            // Test connection
            const isConnected = await this.checkConnection();
            this.status = isConnected ? 'online' : 'error';

            console.log('✅ Supabase initialized:', this.status);
            return isConnected;

        } catch (error) {
            console.error('Supabase initialization error:', error);
            this.status = 'error';
            return false;
        }
    }

    async checkConnection() {
        if (!this.initialized || !this.client) return false;
        try {
            const { error } = await this.client.from('contractors').select('id').limit(1);
            return !error;
        } catch (error) {
            return false;
        }
    }

    async autoInit() {
        if (this.isAvailable()) {
            await this.init();
        }
    }

    isAvailable() {
        return this.supabaseUrl && this.supabaseAnonKey;
    }

    // Core data operations - independent of storage.js
    async saveContractor(contractor) {
        if (!this.initialized || this.status !== 'online') {
            this.addToPendingSync('contractors', 'upsert', contractor);
            return false;
        }

        try {
            const { id, created_at, updated_at, ...data } = contractor;
            const doc = {
                id: id,
                data: data,
                updated_at: new Date().toISOString()
            };

            const { error } = await this.client
                .from('contractors')
                .upsert(doc, { onConflict: 'id' });

            if (error) throw error;
            console.log('✅ Contractor saved to Supabase:', contractor.id);
            return true;
        } catch (error) {
            console.error('Error saving contractor to Supabase:', error);
            this.addToPendingSync('contractors', 'upsert', contractor);
            return false;
        }
    }

    async saveReview(review) {
        if (!this.initialized || this.status !== 'online') {
            this.addToPendingSync('reviews', 'upsert', review);
            return false;
        }

        try {
            const { id, contractor_id, status, created_at, ...data } = review;
            const doc = {
                id: id,
                contractor_id: contractor_id,
                status: status || 'pending',
                data: data,
                created_at: created_at || new Date().toISOString()
            };

            const { error } = await this.client
                .from('reviews')
                .upsert(doc, { onConflict: 'id' });

            if (error) throw error;
            console.log('✅ Review saved to Supabase:', review.id);
            return true;
        } catch (error) {
            console.error('Error saving review to Supabase:', error);
            this.addToPendingSync('reviews', 'upsert', review);
            return false;
        }
    }

    async saveCategory(category) {
        if (!this.initialized || this.status !== 'online') {
            this.addToPendingSync('categories', 'upsert', category);
            return false;
        }

        try {
            const { id, created_at, ...data } = category;
            const doc = {
                id: id,
                data: data
            };

            const { error } = await this.client
                .from('categories')
                .upsert(doc, { onConflict: 'id' });

            if (error) throw error;
            console.log('✅ Category saved to Supabase:', category.id);
            return true;
        } catch (error) {
            console.error('Error saving category to Supabase:', error);
            this.addToPendingSync('categories', 'upsert', category);
            return false;
        }
    }

    // Data retrieval methods
    async getAllContractors() {
        if (!this.initialized) return [];

        try {
            const { data, error } = await this.client
                .from('contractors')
                .select('*');

            if (error) throw error;

            return (data || []).map(row => ({
                id: row.id,
                ...row.data,
                created_at: row.created_at,
                updated_at: row.updated_at
            }));
        } catch (error) {
            console.error('Error fetching contractors from Supabase:', error);
            return [];
        }
    }

    async getAllReviews() {
        if (!this.initialized) return [];

        try {
            const { data, error } = await this.client
                .from('reviews')
                .select('*');

            if (error) throw error;

            return (data || []).map(row => ({
                id: row.id,
                contractor_id: row.contractor_id,
                status: row.status,
                ...row.data,
                created_at: row.created_at
            }));
        } catch (error) {
            console.error('Error fetching reviews from Supabase:', error);
            return [];
        }
    }

    async getAllCategories() {
        if (!this.initialized) return [];

        try {
            const { data, error } = await this.client
                .from('categories')
                .select('*');

            if (error) throw error;

            return (data || []).map(row => ({
                id: row.id,
                ...row.data,
                created_at: row.created_at
            }));
        } catch (error) {
            console.error('Error fetching categories from Supabase:', error);
            return [];
        }
    }

    // Pending sync management
    addToPendingSync(table, operation, data) {
        this.pendingSync.push({
            table,
            operation,
            data,
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 100 pending syncs
        if (this.pendingSync.length > 100) {
            this.pendingSync = this.pendingSync.slice(-100);
        }
        
        console.log(`📝 Added to pending sync: ${table}.${operation}`, data.id);
    }

    async processPendingSync() {
        if (!this.initialized || this.status !== 'online' || this.pendingSync.length === 0) {
            return;
        }

        console.log(`🔄 Processing ${this.pendingSync.length} pending syncs...`);

        const processed = [];
        const failed = [];

        for (const sync of [...this.pendingSync]) {
            try {
                let success = false;

                switch (sync.table) {
                    case 'contractors':
                        success = await this.saveContractor(sync.data);
                        break;
                    case 'reviews':
                        success = await this.saveReview(sync.data);
                        break;
                    case 'categories':
                        success = await this.saveCategory(sync.data);
                        break;
                }

                if (success) {
                    processed.push(sync);
                    // Remove from pending sync
                    this.pendingSync = this.pendingSync.filter(p => p !== sync);
                } else {
                    failed.push(sync);
                }
            } catch (error) {
                console.error('Error processing pending sync:', error);
                failed.push(sync);
            }
        }

        console.log(`✅ Processed ${processed.length} syncs, ${failed.length} failed`);
        return { processed, failed };
    }

    // Status and utility methods
    getSyncStatus() {
        return {
            available: this.isAvailable(),
            initialized: this.initialized,
            status: this.status,
            online: navigator.onLine,
            pendingSync: this.pendingSync.length
        };
    }

    // Subscribe to connection changes
    subscribeToStatusChanges(callback) {
        const checkStatus = () => {
            const status = this.getSyncStatus();
            callback(status);
        };

        // Check status periodically
        this.statusInterval = setInterval(checkStatus, 5000);
        checkStatus(); // Initial call

        return () => clearInterval(this.statusInterval);
    }
}

// Create and export instance
const supabase = new SupabaseClient();
window.supabaseClient = supabase;

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SupabaseClient, supabase };
}