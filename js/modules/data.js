// js/modules/data.js - COMPLETELY UPDATED with proper encapsulation
const dataModule = {
    init() {
        // Initialize all managers
        contractorManager.init(storage, defaultContractors);
        categoriesModule.init();
        reviewManager.init(contractorManager);
        statsManager.init(contractorManager, reviewManager);
        
        // SAFELY initialize favorites manager only if it exists
        if (typeof favoritesManager !== 'undefined') {
            favoritesManager.init(storage);
        } else {
            console.warn('Favorites manager not available - skipping initialization');
        }

        // Set up global event handlers
        this.setupGlobalHandlers();
    },

    setupGlobalHandlers() {
        // Make methods available globally for HTML onclick handlers
        window.toggleFavorite = (contractorId) => this.toggleFavorite(contractorId);
        window.handleFavoritesImport = (file) => this.handleFavoritesImport(file);
        window.showFavoritesSection = () => this.showFavoritesSection();
        window.dataModule = this; // Make entire module available globally
    },

    // Contractor methods
    getContractors() { return contractorManager.getAll(); },
    getContractor(id) { return contractorManager.getById(id); },
    addContractor(data) { return contractorManager.create(data); },
    updateContractor(id, updates) { return contractorManager.update(id, updates); },
    deleteContractor(id) { return contractorManager.delete(id); },
    searchContractors(...args) { return contractorManager.search(...args); },
    getAllLocations() { return contractorManager.getAllLocations(); },

    // Review methods
    getAllReviews() { return reviewManager.getAllReviews(); },
    addReview(contractorId, data) { return reviewManager.addReview(contractorId, data); },
    updateReviewStatus(...args) { return reviewManager.updateReviewStatus(...args); },
    deleteReview(...args) { return reviewManager.deleteReview(...args); },
    calculateAverageRating(reviews) { return reviewManager.calculateAverageRating(reviews); },
    searchReviews(...args) { return reviewManager.searchReviews(...args); },

    // Category methods
    getCategories() { return categoriesModule.getCategories(); },
    addCategory(name) { return categoriesModule.addCategory(name); },
    updateCategory(oldName, newName) { return categoriesModule.updateCategory(oldName, newName); },
    deleteCategory(name) { return categoriesModule.deleteCategory(name); },

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
    },

    // Stats methods
    getStats() { return statsManager.getStats(); },
    getReviewStats() { return statsManager.getReviewStats(); },

    // Favorites methods - with safe fallbacks
    toggleFavorite(contractorId) { 
        if (typeof favoritesManager !== 'undefined') {
            const isNowFavorite = favoritesManager.toggleFavorite(contractorId);
            
            // Show feedback
            const contractor = contractorManager.getById(contractorId);
            if (contractor && typeof utils !== 'undefined' && utils.showNotification) {
                const message = isNowFavorite ? 
                    `Added ${contractor.name} to favorites! 💖` : 
                    `Removed ${contractor.name} from favorites.`;
                utils.showNotification(message, 'success');
            }
            
            return isNowFavorite;
        }
        console.warn('Favorites manager not available');
        return false;
    },
    
    isFavorite(contractorId) { 
        if (typeof favoritesManager !== 'undefined') {
            return favoritesManager.isFavorite(contractorId);
        }
        return false;
    },
    
    getFavoriteContractors() { 
        if (typeof favoritesManager !== 'undefined') {
            return favoritesManager.getFavoriteContractors();
        }
        return [];
    },
    
    getFavoritesCount() { 
        if (typeof favoritesManager !== 'undefined') {
            return favoritesManager.getFavoritesCount();
        }
        return 0;
    },
    
    exportFavorites() { 
        if (typeof favoritesManager !== 'undefined') {
            return favoritesManager.exportFavorites();
        }
        return '{}';
    },
    
    importFavorites(jsonData) { 
        if (typeof favoritesManager !== 'undefined') {
            return favoritesManager.importFavorites(jsonData);
        }
        return false;
    },
    
    downloadFavorites() { 
        if (typeof favoritesManager !== 'undefined') {
            return favoritesManager.downloadFavorites();
        }
        console.warn('Favorites manager not available');
    },
    
    clearFavorites() { 
        if (typeof favoritesManager !== 'undefined') {
            if (confirm('Are you sure you want to clear all favorites?')) {
                const success = favoritesManager.clearFavorites();
                if (success && typeof utils !== 'undefined' && utils.showNotification) {
                    utils.showNotification('All favorites cleared successfully!', 'success');
                }
                return success;
            }
        }
        return false;
    },

    // Favorites import handler
    async handleFavoritesImport(file) {
        if (!file) return;
        
        try {
            const text = await file.text();
            const success = this.importFavorites(text);
            
            if (success && typeof utils !== 'undefined' && utils.showNotification) {
                utils.showNotification('Favorites imported successfully! 🎉', 'success');
            } else {
                utils.showNotification('Failed to import favorites. Invalid file format.', 'error');
            }
        } catch (error) {
            console.error('Error importing favorites:', error);
            if (typeof utils !== 'undefined' && utils.showNotification) {
                utils.showNotification('Error importing favorites file.', 'error');
            }
        }
    },

    // Show favorites section
    showFavoritesSection() {
        const favoritesSection = document.getElementById('favoritesSection');
        if (favoritesSection) {
            favoritesSection.scrollIntoView({ behavior: 'smooth' });
        }
    },

    // Utility methods
    formatDate(date) {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },

    // Combined search that includes favorites filtering
    searchContractorsWithFavorites(searchTerm = '', categoryFilter = '', ratingFilter = '', locationFilter = '', favoritesOnly = false) {
        let contractors = this.searchContractors(searchTerm, categoryFilter, ratingFilter, locationFilter);
        
        if (favoritesOnly && typeof favoritesManager !== 'undefined') {
            contractors = contractors.filter(contractor => 
                this.isFavorite(contractor.id)
            );
        }
        
        return contractors;
    },

    // Get contractors by favorite status
    getContractorsByFavoriteStatus(favoritesFirst = true) {
        const contractors = this.getContractors();
        
        if (favoritesFirst && typeof favoritesManager !== 'undefined') {
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
};