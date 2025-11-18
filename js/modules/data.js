// js/modules/data.js
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

// Import Supabase client directly
import { supabase } from './supabase.js';

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
    }

    async init() {
        if (this.initialized) return;
        if (this.initializing) return this.initPromise;

        this.initializing = true;

        this.initPromise = new Promise(async (resolve, reject) => {
            try {
                // Create and initialize all dependencies internally
                this.storage = new Storage();
                this.contractorManager = new ContractorManager();
                this.reviewManager = new ReviewManager();
                this.categoriesModule = new CategoriesModule(this);
                this.favoritesDataManager = new FavoritesDataManager();
                this.statsManager = new StatsDataManager();

                // Initialize storage with Supabase (if available)
                this.storage.init(supabase);

                // FIX: Handle first-time setup BEFORE initializing managers
                await this.handleFirstTimeSetup();
                
                // Initialize all managers with proper dependencies
                // DON'T pass default data - managers should load from storage
                this.contractorManager.init(this.storage);
                
                this.categoriesModule.init(this.storage, this);
                
                await this.reviewManager.init(this.contractorManager, this.storage);
                
                // Initialize favorites data manager (pure data only)
                this.favoritesDataManager.init(this.storage);
                
                this.statsManager.init(this.contractorManager, this.reviewManager);

                this.initialized = true;
                this.initializing = false;
                
                // Dispatch data ready event for UI modules
                document.dispatchEvent(new CustomEvent('dataReady'));
                
                console.log('DataModule initialized successfully');
                resolve();
            } catch (error) {
                this.initializing = false;
                console.error('DataModule initialization failed:', error);
                reject(error);
            }
        });

        return this.initPromise;
    }

    // FIX: Handle first-time setup properly - centralized data initialization
    async handleFirstTimeSetup() {
        console.log('🔧 Checking first-time setup...');
        
        // Check if we have any saved data
        const savedContractors = await this.storage.load('contractors');
        const savedReviews = await this.storage.load('reviews');
        const savedCategories = await this.storage.load('categories');
        
        // FIX: Check if we need to load default categories specifically
        // This allows Supabase categories to load while still having default fallback
        const hasCategories = savedCategories && savedCategories.length > 0;
        
        if (!hasCategories) {
            console.log('🔧 No categories found - loading default categories');
            await this.storage.save('categories', defaultCategories, { syncToSupabase: false });
        }
        
        // Only load default contractors and reviews if no data exists at all
        const hasAnyData = savedContractors && savedContractors.length > 0;
        
        if (!hasAnyData) {
            console.log('🔧 First-time setup detected - saving default contractors and reviews');
            await this.storage.save('contractors', defaultContractors);
            await this.storage.save('reviews', defaultReviews);
            console.log('🔧 Default data saved for first-time setup');
        } else {
            console.log('🔧 Using existing saved data');
        }
    }

    // Ensure dataModule is initialized before using it
    ensureInitialized() {
        if (!this.initialized && !this.initializing) {
            return this.init();
        }
        return Promise.resolve();
    }

    // Contractor methods - pure data operations
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
    // REMOVED: exportFavoritesData - no longer needed

    // Data mutation methods
    addContractor(data) { 
        console.log('🔧 DataModule.addContractor(): Adding contractor...');
        const result = this.contractorManager.create(data);
        console.log('🔧 DataModule.addContractor(): Result:', result);
        return result;
    }

    updateContractor(id, updates) { 
        return this.contractorManager.update(id, updates);
    }

    deleteContractor(id) { 
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
    toggleFavorite(contractorId) { 
        return this.favoritesDataManager.toggleFavorite(contractorId);
    }

    // REMOVED: importFavorites - no longer needed
    // REMOVED: clearFavorites - no longer needed

    // Utility methods - pure data transformations
    formatDate = (date) => new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

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
                this.contractorManager.refresh();
            }
            if (this.reviewManager && this.reviewManager.refresh) {
                this.reviewManager.refresh();
            }
            if (this.categoriesModule && this.categoriesModule.refresh) {
                this.categoriesModule.refresh();
            }
            
            return result;
        }
        return null;
    }

    // Debug method to check category loading
    async debugCategoryLoading() {
        console.log('🔍 Debugging category loading...');
        
        // Check localStorage directly
        const localCategories = localStorage.getItem('categories');
        console.log('📁 LocalStorage categories:', localCategories);
        
        // Check storage load
        const storageCategories = await this.storage.load('categories');
        console.log('📦 Storage loaded categories:', storageCategories);
        
        // Check categories module
        const moduleCategories = this.categoriesModule.getCategories();
        console.log('📊 Categories module categories:', moduleCategories);
        
        // Check Supabase directly if available
        if (supabase && supabase.initialized) {
            try {
                const supabaseCategories = await supabase.getAllCategories();
                console.log('☁️ Supabase categories:', supabaseCategories);
            } catch (error) {
                console.error('❌ Error fetching from Supabase:', error);
            }
        }
        
        return {
            localStorage: localCategories,
            storage: storageCategories,
            module: moduleCategories
        };
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

    // Get locations data
    getLocationsData() {
        return southAfricanProvinces;
    }
}