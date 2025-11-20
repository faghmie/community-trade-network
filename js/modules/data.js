// js/modules/data.js - FIXED INITIALIZATION WITH SUPABASE WAIT
// ES6 Module for data orchestration - PURE DATA ONLY

// Import data directly from ES6 modules
import { defaultCategories } from '../data/defaultCategories.js';
import { defaultContractors } from '../data/defaultContractors.js';
import { defaultReviews } from '../data/defaultReviews.js';
import { southAfricanProvinces } from '../data/defaultLocations.js';

import { Storage } from './storage.js';
import { ContractorManager } from './contractorManager.js';
import { ReviewManager } from './reviewManager.js';
import { CategoriesModule } from './categories.js';
import { FavoritesDataManager } from './favoritesDataManager.js';
import { StatsDataManager } from './statsDataManager.js';
import { FeedbackDataManager } from './feedbackDataManager.js'; // NEW: Import feedback manager

// Import Supabase client directly
import { supabase } from './supabase.js';

// Import loading screen module
import { LoadingScreen } from './loadingScreen.js';

export class DataModule {
    constructor() {
        this.initialized = false;
        this.initializing = false;
        this.initPromise = null;
        this.storage = null;
        this.contractorManager = null;
        this.reviewManager = null;
        this.categoriesModule = null;
        this.favoritesDataManager = null;
        this.statsManager = null;
        this.feedbackDataManager = null; // NEW: Feedback manager
        this.supabaseConnected = false;
        this.loadingScreen = new LoadingScreen();
    }

    async init() {
        if (this.initialized) return;
        if (this.initializing) return this.initPromise;

        this.initializing = true;

        this.initPromise = new Promise(async (resolve, reject) => {
            try {
                // Show loading screen immediately
                this.loadingScreen.show('Initializing storage...');

                // Create and initialize all dependencies internally
                this.storage = new Storage();
                this.contractorManager = new ContractorManager();
                this.reviewManager = new ReviewManager();
                this.categoriesModule = new CategoriesModule(this);
                this.favoritesDataManager = new FavoritesDataManager();
                this.statsManager = new StatsDataManager();
                this.feedbackDataManager = new FeedbackDataManager(); // NEW: Create feedback manager

                // Initialize storage with Supabase (if available)
                this.storage.init(supabase);

                // CRITICAL FIX: Wait for Supabase to be available before loading data
                this.loadingScreen.setMessage('Connecting to server...');
                await this.waitForSupabaseConnection();

                // SIMPLIFIED: No first-time setup - just load existing data
                this.loadingScreen.setMessage('Loading data...');
                
                // Initialize all managers with proper dependencies
                this.contractorManager.init(this.storage);
                this.categoriesModule.init(this.storage, this);
                await this.reviewManager.init(this.contractorManager, this.storage);
                
                // Set review manager reference in contractor manager for cleanup operations
                this.contractorManager.setReviewManager(this.reviewManager);
                
                // Initialize favorites data manager with contractor manager reference
                await this.favoritesDataManager.init(this.storage, this.contractorManager);
                this.statsManager.init(this.contractorManager, this.reviewManager);
                
                // NEW: Initialize feedback data manager
                this.feedbackDataManager.init(this.storage);

                this.initialized = true;
                this.initializing = false;
                
                // Show success and auto-hide
                this.loadingScreen.showSuccess('Data loaded successfully!');
                
                // Dispatch data ready event for UI modules
                document.dispatchEvent(new CustomEvent('dataReady'));
                
                resolve();
            } catch (error) {
                this.initializing = false;
                console.error('DataModule initialization failed:', error);
                
                // Show error in loading screen
                this.loadingScreen.showError('Failed to load data. Please check your connection.');
                
                // Set retry callback
                this.loadingScreen.setOnRetry(() => {
                    location.reload();
                });
                
                reject(error);
            }
        });

        return this.initPromise;
    }

    // NEW: Wait for Supabase connection with timeout and status updates
    async waitForSupabaseConnection(maxWaitTime = 5000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWaitTime) {
            if (this.storage.isSupabaseAvailable()) {
                console.log('✅ Supabase connected, proceeding with data loading');
                this.supabaseConnected = true;
                
                // Update loading message for connected state
                this.loadingScreen.setMessage('Server connected, synchronizing data...');
                return true;
            }
            
            // Update loading message with connection attempt status
            const elapsed = Date.now() - startTime;
            const secondsRemaining = Math.ceil((maxWaitTime - elapsed) / 1000);
            this.loadingScreen.setMessage(`Connecting to server... (${secondsRemaining}s)`);
            
            // Wait 100ms before checking again
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.warn('⚠️ Supabase connection timeout, proceeding with local data only');
        this.supabaseConnected = false;
        
        // Update loading message for offline mode
        this.loadingScreen.showOffline('Running in offline mode. Using local data...');
        
        // Set retry callback for offline mode
        this.loadingScreen.setOnRetry(() => {
            location.reload();
        });
        
        return false;
    }

    // Ensure dataModule is initialized before using it
    ensureInitialized() {
        if (!this.initialized && !this.initializing) {
            return this.init();
        }
        return Promise.resolve();
    }

    // Service Provider methods - pure data operations
    getContractors = () => this.contractorManager.getAll();

    getContractor = (id) => this.contractorManager.getById(id);

    searchContractors = (...args) => this.contractorManager.search(...args);

    getAllLocations = () => this.contractorManager.getAllLocations();

    // Review methods - pure data operations
    getAllReviews = () => this.reviewManager.getAllReviews();

    getReviewsForContractor = (contractorId) => this.reviewManager.getReviewsByContractor(contractorId);

    calculateAverageRating = (reviews) => this.reviewManager.calculateOverallRating(reviews);

    searchReviews = (...args) => this.reviewManager.searchReviews(...args);

    // Category methods - pure data operations
    getCategories = () => this.categoriesModule.getCategories();

    // Favorites data methods - pure data operations only
    isFavorite = (contractorId) => this.favoritesDataManager.isFavorite(contractorId);

    getFavorites = () => this.favoritesDataManager.getFavorites();

    getFavoritesCount = () => this.favoritesDataManager.getFavoritesCount();

    // NEW: Feedback data methods
    submitFeedback = (feedbackData) => this.feedbackDataManager.submitFeedback(feedbackData);

    getAllFeedback = () => this.feedbackDataManager.getAllFeedback();

    getFeedbackByStatus = (status) => this.feedbackDataManager.getFeedbackByStatus(status);

    updateFeedbackStatus = (feedbackId, status) => this.feedbackDataManager.updateFeedbackStatus(feedbackId, status);

    getFeedbackStats = () => this.feedbackDataManager.getFeedbackStats();

    deleteFeedback = (feedbackId) => this.feedbackDataManager.deleteFeedback(feedbackId);

    // Data mutation methods
    addContractor(data) { 
        const result = this.contractorManager.create(data);
        return result;
    }

    updateContractor(id, updates) { 
        return this.contractorManager.update(id, updates);
    }

    async deleteContractor(id) { 
        const result = this.contractorManager.delete(id);
        return result;
    }

    addReview(contractorId, data) { 
        return this.reviewManager.addReview(contractorId, data);
    }

    updateReviewStatus(...args) { 
        return this.reviewManager.updateReviewStatus(...args);
    }

    deleteReview(...args) { 
        return this.reviewManager.deleteReview(...args);
    }

    addCategory(name) { 
        return this.categoriesModule.addCategory(name);
    }

    updateCategory(oldName, newName) { 
        return this.categoriesModule.updateCategory(oldName, newName);
    }

    deleteCategory(name) { 
        return this.categoriesModule.deleteCategory(name);
    }

    // Update contractor category across all contractors
    updateContractorCategory(oldCategory, newCategory) {
        let updated = false;
        const contractors = this.getContractors();
        contractors.forEach(contractor => {
            if (contractor.category === oldCategory) {
                contractor.category = newCategory;
                updated = true;
            }
        });
        if (updated) {
            this.contractorManager.save();
        }
        return updated;
    }

    // Stats methods - pure data
    getStats = () => this.statsManager.getStats();

    getReviewStats = () => this.statsManager.getReviewStats();

    // Get favorite contractors (data only - combines favorites with contractor data)
    getFavoriteContractors() {
        const favorites = this.favoritesDataManager.getFavorites();
        const allContractors = this.getContractors();
        return allContractors.filter(contractor => 
            contractor && contractor.id && favorites.includes(contractor.id)
        );
    }

    // Favorites data operations (pure data - no UI)
    async toggleFavorite(contractorId) { 
        return await this.favoritesDataManager.toggleFavorite(contractorId);
    }

    // Combined search that includes favorites filtering
    searchContractorsWithFavorites(searchTerm = '', categoryFilter = '', ratingFilter = '', locationFilter = '', favoritesOnly = false) {
        let contractors = this.searchContractors(searchTerm, categoryFilter, ratingFilter, locationFilter);
        
        if (favoritesOnly) {
            contractors = contractors.filter(contractor => 
                this.isFavorite(contractor.id)
            );
        }
        
        return contractors;
    }

    // Get contractors by favorite status
    getContractorsByFavoriteStatus(favoritesFirst = true) {
        const contractors = this.getContractors();
        
        if (favoritesFirst) {
            return contractors.sort((a, b) => {
                const aFavorite = this.isFavorite(a.id);
                const bFavorite = this.isFavorite(b.id);
                
                if (aFavorite && !bFavorite) return -1;
                if (!aFavorite && bFavorite) return 1;
                return 0;
            });
        }
        
        return contractors;
    }

    // Utility methods - pure data transformations
    formatDate = (date) => new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    // Data synchronization methods
    async triggerManualSync() {
        if (this.storage && this.storage.forceRefreshAll) {
            return await this.storage.forceRefreshAll();
        }
        return null;
    }

    async triggerDataPull() {
        // Force refresh all data from Supabase
        if (this.storage && this.storage.forceRefreshAll) {
            const result = await this.storage.forceRefreshAll();
            
            // Refresh managers with new data
            if (this.contractorManager && this.contractorManager.refresh) {
                await this.contractorManager.refresh();
            }
            if (this.reviewManager && this.reviewManager.refresh) {
                await this.reviewManager.refresh();
            }
            if (this.categoriesModule && this.categoriesModule.refresh) {
                await this.categoriesModule.refresh();
            }
            
            // Refresh favorites (will auto-cleanup)
            if (this.favoritesDataManager && this.favoritesDataManager.refresh) {
                await this.favoritesDataManager.refresh();
            }
            
            return result;
        }
        return null;
    }

    // Getter methods to access the managers if needed
    getStorage() {
        return this.storage;
    }

    getContractorManager() {
        return this.contractorManager;
    }

    getReviewManager() {
        return this.reviewManager;
    }

    getCategoriesModule() {
        return this.categoriesModule;
    }

    getFavoritesDataManager() {
        return this.favoritesDataManager;
    }

    getStatsManager() {
        return this.statsManager;
    }

    // NEW: Get feedback data manager
    getFeedbackDataManager() {
        return this.feedbackDataManager;
    }

    // Get connection status
    isSupabaseConnected() {
        return this.supabaseConnected;
    }

    // Get locations data
    getLocationsData() {
        return southAfricanProvinces;
    }

    // Debug method to check category loading
    debugCategoryLoading() {
        console.log('🔍 DataModule Category Debug:');
        console.log('- Categories from module:', this.categoriesModule?.getCategories());
        console.log('- Categories from storage:', localStorage.getItem('categories'));
        console.log('- Supabase connected:', this.supabaseConnected);
    }
}