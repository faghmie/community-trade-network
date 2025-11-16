// js/modules/data.js - Clean architecture with selective lambda functions
class DataModule {
    constructor() {
        this.initialized = false;
        this.initializing = false;
        this.initPromise = null;
        console.log('🔧 DataModule created');
    }

    async init() {
        if (this.initialized) return;
        if (this.initializing) return this.initPromise;

        console.log('🔄 Initializing DataModule...');
        this.initializing = true;

        this.initPromise = new Promise(async (resolve, reject) => {
            try {
                // Use global variables that are loaded via script tags
                const utils = window.utils;
                const defaultCategories = window.defaultCategories;
                const defaultContractors = window.defaultContractors;
                const defaultReviews = window.defaultReviews;
                
                // Use the separate location variables from dataLoader.js
                const locationData = {
                    southAfricanCityCoordinates: window.southAfricanCityCoordinates,
                    southAfricanProvinces: window.southAfricanProvinces
                };

                // Check if storage is available
                if (typeof storage === 'undefined') {
                    throw new Error('Storage module not available');
                }

                // Initialize storage with Supabase
                storage.init(supabase);

                // Initialize all managers with proper dependencies
                contractorManager.init(storage, defaultContractors, utils, locationData);
                
                categoriesModule.init(storage, utils, this, defaultCategories);
                
                reviewManager.init(contractorManager, storage, defaultReviews, utils);
                
                statsManager.init(contractorManager, reviewManager);
                
                // Initialize favorites manager
                favoritesManager.init(storage, utils, this, null);

                // Set up global event handlers
                this.setupGlobalHandlers();

                this.initialized = true;
                this.initializing = false;
                console.log('✅ DataModule initialized successfully');
                resolve();
            } catch (error) {
                this.initializing = false;
                console.error('❌ DataModule initialization failed:', error);
                reject(error);
            }
        });

        return this.initPromise;
    }

    // Ensure dataModule is initialized before using it
    ensureInitialized() {
        if (!this.initialized && !this.initializing) {
            console.warn('⚠️ DataModule not initialized, calling init()');
            return this.init();
        }
        return Promise.resolve();
    }

    // Method to set uiManager for favoritesManager after main.js initialization
    setUIManager(uiManager) {
        favoritesManager.uiManager = uiManager;
    }

    setupGlobalHandlers() {
        // Make methods available globally for HTML onclick handlers
        window.toggleFavorite = (contractorId) => this.toggleFavorite(contractorId);
        window.handleFavoritesImport = (file) => this.handleFavoritesImport(file);
        window.showFavoritesSection = () => this.showFavoritesSection();
        window.dataModule = this; // Make entire module available globally
    }

    // Contractor methods - using lambdas for simple returns
    getContractors = () => contractorManager.getAll();
    getContractor = (id) => contractorManager.getById(id);
    searchContractors = (...args) => contractorManager.search(...args);
    getAllLocations = () => contractorManager.getAllLocations();

    // Review methods - using lambdas for simple returns
    getAllReviews = () => reviewManager.getAllReviews();
    getReviewsForContractor = (contractorId) => reviewManager.getReviewsByContractor(contractorId);
    calculateAverageRating = (reviews) => reviewManager.calculateOverallRating(reviews);
    searchReviews = (...args) => reviewManager.searchReviews(...args);

    // Category methods - using lambdas for simple returns
    getCategories = () => categoriesModule.getCategories();

    // Favorites methods - using lambdas for simple returns
    isFavorite = (contractorId) => favoritesManager.isFavorite(contractorId);
    getFavoriteContractors = () => favoritesManager.getFavoriteContractors();
    getFavoritesCount = () => favoritesManager.getFavoritesCount();
    exportFavorites = () => favoritesManager.exportFavorites();
    downloadFavorites = () => favoritesManager.downloadFavorites();

    // Complex methods keep regular function syntax
    addContractor(data) { 
        const result = contractorManager.create(data);
        return result;
    }

    updateContractor(id, updates) { 
        const result = contractorManager.update(id, updates);
        return result;
    }

    deleteContractor(id) { 
        const result = contractorManager.delete(id);
        return result;
    }

    addReview(contractorId, data) { 
        const result = reviewManager.addReview(contractorId, data);
        return result;
    }

    updateReviewStatus(...args) { 
        const result = reviewManager.updateReviewStatus(...args);
        return result;
    }

    deleteReview(...args) { 
        const result = reviewManager.deleteReview(...args);
        return result;
    }

    addCategory(name) { 
        const result = categoriesModule.addCategory(name);
        return result;
    }

    updateCategory(oldName, newName) { 
        const result = categoriesModule.updateCategory(oldName, newName);
        return result;
    }

    deleteCategory(name) { 
        const result = categoriesModule.deleteCategory(name);
        return result;
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
            contractorManager.save();
            console.log(`Updated category from "${oldCategory}" to "${newCategory}" for ${updated} contractors`);
        }
        return updated;
    }

    // Stats methods
    getStats = () => statsManager.getStats();
    getReviewStats = () => statsManager.getReviewStats();

    // Favorites methods with complex logic
    toggleFavorite(contractorId) { 
        const isNowFavorite = favoritesManager.toggleFavorite(contractorId);
        const contractor = contractorManager.getById(contractorId);
        
        if (contractor) {
            const message = isNowFavorite ? 
                `Added ${contractor.name} to favorites! 💖` : 
                `Removed ${contractor.name} from favorites.`;
            // utils is available via favoritesManager now
            favoritesManager.utils.showNotification(message, 'success');
        }
        
        return isNowFavorite;
    }

    importFavorites(jsonData) { 
        return favoritesManager.importFavorites(jsonData);
    }

    clearFavorites() { 
        if (confirm('Are you sure you want to clear all favorites?')) {
            const success = favoritesManager.clearFavorites();
            if (success) {
                favoritesManager.utils.showNotification('All favorites cleared successfully!', 'success');
            }
            return success;
        }
        return false;
    }

    // Favorites import handler
    async handleFavoritesImport(file) {
        if (!file) return;
        
        try {
            const text = await file.text();
            const success = this.importFavorites(text);
            
            if (success) {
                favoritesManager.utils.showNotification('Favorites imported successfully! 🎉', 'success');
            } else {
                favoritesManager.utils.showNotification('Failed to import favorites. Invalid file format.', 'error');
            }
        } catch (error) {
            console.error('Error importing favorites:', error);
            favoritesManager.utils.showNotification('Error importing favorites file.', 'error');
        }
    }

    // Show favorites section
    showFavoritesSection = () => {
        const favoritesSection = document.getElementById('favoritesSection');
        if (favoritesSection) {
            favoritesSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // Utility methods
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

    // Optional: Manual sync trigger (for admin purposes)
    async triggerManualSync() {
        console.log('🔄 Manual sync triggered from DataModule');
        await storage.fullSync();
    }

    // Optional: Manual data pull (for admin purposes)
    async triggerDataPull() {
        console.log('⬇️ Manual data pull triggered from DataModule');
        await storage.pullLatest();
        
        // Refresh managers with new data
        contractorManager.refresh();
        reviewManager.refresh();
        categoriesModule.refresh();
    }
}

// Create singleton instance
const dataModule = new DataModule();