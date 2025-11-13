// js/modules/data.js - MAIN ORCHESTRATOR
const dataModule = {
    init() {
        // Initialize all managers
        contractorManager.init(storage, defaultContractors);
        categoriesModule.init();
        reviewManager.init(contractorManager);
        statsManager.init(contractorManager, reviewManager);
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

    // Utility methods
    formatDate(date) {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
};