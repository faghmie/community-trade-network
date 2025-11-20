// js/modules/supabase.js
// Supabase Integration - Main Supabase client and data operations

import { supabaseUrl, supabaseAnonKey } from '../config/supabase-credentials.js';

export class SupabaseClient {
    constructor() {
        this.supabaseUrl = supabaseUrl || null;
        this.supabaseAnonKey = supabaseAnonKey || null;
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
            // Import supabase-js dynamically
            const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
            this.client = createClient(this.supabaseUrl, this.supabaseAnonKey);
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
            // For contractors, all data goes in the data column
            const { id, createdAt, updatedAt, ...contractorData } = contractor;

            const doc = {
                id: id,
                data: contractorData,
                created_at: createdAt || new Date().toISOString(),
                updated_at: updatedAt || new Date().toISOString()
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
            // Extract contractor_id and status for top-level columns, rest goes in data
            const { id, contractor_id, status, createdAt, updatedAt, ...reviewData } = review;

            const doc = {
                id: id,
                contractor_id: contractor_id,
                status: status || 'pending',
                data: reviewData,
                created_at: createdAt || new Date().toISOString(),
                updated_at: updatedAt || new Date().toISOString()
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
            // For categories, ALL data goes in the data column - no top-level fields except id
            const { id, created_at, ...categoryData } = category;

            const doc = {
                id: id,
                data: categoryData,  // All category data goes here
                created_at: created_at || new Date().toISOString()
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

    // NEW: Save feedback to Supabase
    async saveFeedback(feedback) {
        if (!this.initialized || this.status !== 'online') {
            this.addToPendingSync('user_feedback', 'upsert', feedback);
            return false;
        }

        try {
            // For feedback, ALL data goes in the feedback_data JSONB column
            const { id, created_at, ...feedbackData } = feedback;

            const doc = {
                id: id,
                feedback_data: feedbackData,  // All feedback data goes here
                status: feedbackData.status || 'new',
                created_at: created_at || new Date().toISOString()
            };

            const { error } = await this.client
                .from('user_feedback')
                .upsert(doc, { onConflict: 'id' });

            if (error) throw error;
            console.log('✅ Feedback saved to Supabase:', feedback.id);
            return true;
        } catch (error) {
            console.error('Error saving feedback to Supabase:', error);
            this.addToPendingSync('user_feedback', 'upsert', feedback);
            return false;
        }
    }

    // Delete category from Supabase
    async deleteCategory(categoryId) {
        if (!this.initialized || this.status !== 'online') {
            this.addToPendingSync('categories', 'delete', { id: categoryId });
            return false;
        }

        try {
            const { error } = await this.client
                .from('categories')
                .delete()
                .eq('id', categoryId);

            if (error) throw error;
            console.log('✅ Category deleted from Supabase:', categoryId);
            return true;
        } catch (error) {
            console.error('Error deleting category from Supabase:', error);
            this.addToPendingSync('categories', 'delete', { id: categoryId });
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
                createdAt: row.created_at,
                updatedAt: row.updated_at
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

            // CRITICAL FIX: Check if data is valid before mapping
            if (!data || !Array.isArray(data)) {
                console.warn('⚠️ Supabase: No reviews data or invalid format received');
                return [];
            }

            const reviews = data.map(row => {
                // Ensure we have valid row data
                if (!row || typeof row !== 'object') {
                    console.warn('⚠️ Supabase: Invalid review row:', row);
                    return null;
                }

                try {
                    return {
                        id: row.id,
                        contractor_id: row.contractor_id,
                        status: row.status,
                        ...row.data,
                        createdAt: row.created_at,
                        updatedAt: row.updated_at
                    };
                } catch (error) {
                    console.error('❌ Supabase: Error processing review row:', error, row);
                    return null;
                }
            }).filter(review => review !== null); // Remove any null entries

            console.log(`📥 Supabase: Loaded ${reviews.length} reviews`);
            return reviews;
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

            // Categories should have all data in the data column
            const categories = (data || []).map(row => ({
                id: row.id,
                ...row.data,  // All category properties come from data
                created_at: row.created_at
            }));

            console.log(`📥 Supabase: Loaded ${categories.length} categories`);
            return categories;
        } catch (error) {
            console.error('Error fetching categories from Supabase:', error);
            return [];
        }
    }

    // NEW: Get all feedback from Supabase
    async getAllFeedback() {
        if (!this.initialized) return [];

        try {
            const { data, error } = await this.client
                .from('user_feedback')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Feedback should have all data in the feedback_data column
            const feedback = (data || []).map(row => ({
                id: row.id,
                status: row.status,
                ...row.feedback_data,  // All feedback properties come from feedback_data
                created_at: row.created_at
            }));

            console.log(`📥 Supabase: Loaded ${feedback.length} feedback items`);
            return feedback;
        } catch (error) {
            console.error('Error fetching feedback from Supabase:', error);
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
                        if (sync.operation === 'delete') {
                            success = await this.deleteCategory(sync.data.id);
                        } else {
                            success = await this.saveCategory(sync.data);
                        }
                        break;
                    case 'user_feedback':
                        // NEW: Handle feedback sync
                        success = await this.saveFeedback(sync.data);
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
export const supabase = new SupabaseClient();