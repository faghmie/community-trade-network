// js/modules/data.js - FIXED: Remove setReviewManager dependency
// ES6 Module for data orchestration - PURE DATA ONLY

// Import data directly from ES6 modules
import { southAfricanProvinces } from '../data/defaultLocations.js';

import { Storage } from './storage.js';
import { ContractorManager } from './contractorManager.js';
import { ReviewManager } from './reviewManager.js';
import { CategoriesModule } from './categories.js';
import { FavoritesDataManager } from './favoritesDataManager.js';
import { StatsDataManager } from './statsDataManager.js';
import { FeedbackDataManager } from './feedbackDataManager.js';

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
        this.feedbackDataManager = null;
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

                // Create and initialize storage FIRST
                this.storage = new Storage();
                this.storage.init(supabase);

                // Wait for Supabase connection BEFORE creating managers
                this.loadingScreen.setMessage('Connecting to server...');
                const supabaseAvailable = await this.waitForSupabaseConnection();

                // Force refresh data from Supabase BEFORE initializing managers
                if (supabaseAvailable) {
                    this.loadingScreen.setMessage('Synchronizing data from server...');
                    await this.storage.forceRefreshAll();
                }

                // NOW create and initialize all managers with fresh data
                this.loadingScreen.setMessage('Initializing data managers...');
                
                // Create all managers
                this.contractorManager = new ContractorManager();
                this.reviewManager = new ReviewManager();
                this.categoriesModule = new CategoriesModule(this);
                this.favoritesDataManager = new FavoritesDataManager();
                this.statsManager = new StatsDataManager();
                this.feedbackDataManager = new FeedbackDataManager();

                // Initialize all managers with storage that now has fresh data
                await this.contractorManager.init(this.storage);
                await this.categoriesModule.init(this.storage, this);
                await this.reviewManager.init(this.contractorManager, this.storage);
                
                // FIXED: Remove setReviewManager call - no longer needed
                // this.contractorManager.setReviewManager(this.reviewManager);
                
                // Initialize remaining managers
                await this.favoritesDataManager.init(this.storage, this.contractorManager);
                this.statsManager.init(this.contractorManager, this.reviewManager);
                this.feedbackDataManager.init(this.storage);

                // Verify all managers have data
                await this.verifyManagerData();

                this.initialized = true;
                this.initializing = false;
                
                // Show success and auto-hide
                this.loadingScreen.showSuccess('Data loaded successfully!');
                
                // Dispatch comprehensive data ready event
                this.dispatchDataReadyEvent();
                
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

    // Data verification for all managers
    async verifyManagerData() {
        console.log('🔍 Verifying all managers have data...');
        
        const issues = [];
        
        // Check contractor manager
        const contractorCount = this.contractorManager.getContractorCount();
        if (contractorCount === 0) {
            issues.push('No contractors loaded');
            console.warn('⚠️ ContractorManager has no data');
        } else {
            console.log(`✅ ContractorManager: ${contractorCount} contractors`);
        }
        
        // Check categories module
        const categories = this.categoriesModule.getCategories();
        if (!categories || categories.length === 0) {
            issues.push('No categories loaded');
            console.warn('⚠️ CategoriesModule has no data');
        } else {
            console.log(`✅ CategoriesModule: ${categories.length} categories`);
        }
        
        // Check review manager
        const reviews = this.reviewManager.getAllReviews();
        if (!reviews || reviews.length === 0) {
            console.log('ℹ️ ReviewManager: No reviews (this might be normal)');
        } else {
            console.log(`✅ ReviewManager: ${reviews.length} reviews`);
        }
        
        // If we have issues and Supabase is connected, try one more refresh
        if (issues.length > 0 && this.supabaseConnected) {
            console.log('🔄 Issues detected, attempting final data refresh...');
            await this.finalDataRefresh();
        }
        
        return issues.length === 0;
    }

    // Final data refresh attempt if managers are empty
    async finalDataRefresh() {
        try {
            // Force refresh from Supabase one more time
            await this.storage.forceRefreshAll();
            
            // Refresh all managers
            await this.refreshAllManagers();
            
            console.log('✅ Final data refresh completed');
        } catch (error) {
            console.error('❌ Final data refresh failed:', error);
        }
    }

    // Wait for Supabase connection
    async waitForSupabaseConnection(maxWaitTime = 8000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWaitTime) {
            if (this.storage.isSupabaseAvailable()) {
                console.log('✅ Supabase connected, proceeding with data loading');
                this.supabaseConnected = true;
                this.loadingScreen.setMessage('Server connected, synchronizing data...');
                return true;
            }
            
            const elapsed = Date.now() - startTime;
            const secondsRemaining = Math.ceil((maxWaitTime - elapsed) / 1000);
            this.loadingScreen.setMessage(`Connecting to server... (${secondsRemaining}s)`);
            
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        console.warn('⚠️ Supabase connection timeout, proceeding with local data only');
        this.supabaseConnected = false;
        this.loadingScreen.showOffline('Running in offline mode. Using local data...');
        
        return false;
    }

    // Enhanced data ready event
    dispatchDataReadyEvent() {
        const eventDetail = {
            contractorsCount: this.contractorManager.getAll().length,
            categoriesCount: this.categoriesModule.getCategories().length,
            reviewsCount: this.reviewManager.getAllReviews().length,
            supabaseConnected: this.supabaseConnected,
            timestamp: new Date().toISOString()
        };
        
        console.log('🚀 Data ready event dispatched:', eventDetail);
        
        document.dispatchEvent(new CustomEvent('dataReady', {
            detail: eventDetail
        }));
    }

    // Ensure dataModule is initialized before using it
    ensureInitialized() {
        if (!this.initialized && !this.initializing) {
            return this.init();
        }
        return Promise.resolve();
    }

    // Service Provider methods
    getContractors = () => this.contractorManager.getAll();

    getContractor = (id) => this.contractorManager.getById(id);

    searchContractors = (...args) => this.contractorManager.search(...args);

    getAllLocations = () => this.contractorManager.getAllLocations();

    // Review methods
    getAllReviews = () => this.reviewManager.getAllReviews();

    getReviewsForContractor = (contractorId) => this.reviewManager.getReviewsByContractor(contractorId);

    calculateAverageRating = (reviews) => this.reviewManager.calculateOverallRating(reviews);

    searchReviews = (...args) => this.reviewManager.searchReviews(...args);

    // Category methods
    getCategories = () => this.categoriesModule.getCategories();

    // Favorites data methods
    isFavorite = (contractorId) => this.favoritesDataManager.isFavorite(contractorId);

    getFavorites = () => this.favoritesDataManager.getFavorites();

    getFavoritesCount = () => this.favoritesDataManager.getFavoritesCount();

    // Feedback data methods
    submitFeedback = (feedbackData) => this.feedbackDataManager.submitFeedback(feedbackData);

    getAllFeedback = () => this.feedbackDataManager.getAllFeedback();

    getFeedbackByStatus = (status) => this.feedbackDataManager.getFeedbackByStatus(status);

    updateFeedbackStatus = (feedbackId, status) => this.feedbackDataManager.updateFeedbackStatus(feedbackId, status);

    getFeedbackStats = () => this.feedbackDataManager.getFeedbackStats();

    deleteFeedback = (feedbackId) => this.feedbackDataManager.deleteFeedback(feedbackId);

    // Data mutation methods
    addContractor(data) { 
        return this.contractorManager.create(data);
    }

    updateContractor(id, updates) { 
        return this.contractorManager.update(id, updates);
    }

    async deleteContractor(id) { 
        return this.contractorManager.delete(id);
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

    // Stats methods
    getStats = () => this.statsManager.getStats();

    getReviewStats = () => this.statsManager.getReviewStats();

    // Get favorite contractors
    getFavoriteContractors() {
        const favorites = this.favoritesDataManager.getFavorites();
        const allContractors = this.getContractors();
        return allContractors.filter(contractor => 
            contractor && contractor.id && favorites.includes(contractor.id)
        );
    }

    // Favorites data operations
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

    // Utility methods
    formatDate = (date) => new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    // Data synchronization methods
    async triggerManualSync() {
        if (this.storage && this.storage.forceRefreshAll) {
            const result = await this.storage.forceRefreshAll();
            await this.refreshAllManagers();
            return result;
        }
        return null;
    }

    async triggerDataPull() {
        if (this.storage && this.storage.forceRefreshAll) {
            const result = await this.storage.forceRefreshAll();
            await this.refreshAllManagers();
            return result;
        }
        return null;
    }

    // Refresh all managers simultaneously
    async refreshAllManagers() {
        const refreshPromises = [];
        
        if (this.contractorManager && this.contractorManager.refresh) {
            refreshPromises.push(this.contractorManager.refresh());
        }
        if (this.reviewManager && this.reviewManager.refresh) {
            refreshPromises.push(this.reviewManager.refresh());
        }
        if (this.categoriesModule && this.categoriesModule.refresh) {
            refreshPromises.push(this.categoriesModule.refresh());
        }
        if (this.favoritesDataManager && this.favoritesDataManager.refresh) {
            refreshPromises.push(this.favoritesDataManager.refresh());
        }
        
        await Promise.allSettled(refreshPromises);
        console.log('✅ All managers refreshed');
    }

    // Getter methods
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

    // Debug method
    debugDataLoading() {
        console.log('🔍 DataModule Debug:');
        console.log('- Contractors:', this.contractorManager?.getAll().length);
        console.log('- Categories:', this.categoriesModule?.getCategories().length);
        console.log('- Reviews:', this.reviewManager?.getAllReviews().length);
        console.log('- Supabase connected:', this.supabaseConnected);
    }
}