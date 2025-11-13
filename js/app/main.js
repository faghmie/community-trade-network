// js/app/main.js
class ContractorReviewApp {
    constructor(uiManager, modalManager, filterManager, formManager) {
        this.uiManager = uiManager;
        this.modalManager = modalManager;
        this.filterManager = filterManager;
        this.formManager = formManager;
        
        this.currentContractor = null;
        this.filteredContractors = [];
    }

    async init() {
        try {
            // Initialize data first
            dataModule.init();
            
            // Initialize all managers
            await this.uiManager.init();
            await this.modalManager.init();
            await this.filterManager.init();
            await this.formManager.init();
            
            // Set up cross-manager communication
            this.setupManagers();
            
            // Render initial state
            this.renderDashboard();
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
        }
    }

    setupManagers() {
        // When filters change, update UI
        this.filterManager.onFiltersChange((filters) => {
            this.filteredContractors = this.filterManager.applyFilters(filters);
            this.uiManager.renderContractors(this.filteredContractors);
            this.uiManager.updateStats(this.filteredContractors);
        });

        // When modal actions occur
        this.modalManager.onReviewRequest((contractorId) => {
            this.currentContractor = contractorId;
            this.modalManager.openReviewModal();
        });

        // When form is submitted
        this.formManager.onReviewSubmit((reviewData) => {
            this.handleReviewSubmit(reviewData);
        });
    }

    renderDashboard() {
        this.uiManager.refreshFilters();
        this.uiManager.renderStats();
        this.uiManager.renderContractors();
    }

    handleReviewSubmit(reviewData) {
        const review = dataModule.addReview(this.currentContractor, reviewData);
        if (review) {
            this.modalManager.closeReviewModal();
            this.renderDashboard();
        }
    }

    // Public API for HTML onclick handlers
    showContractorDetails(contractorId) {
        this.modalManager.openContractorModal(contractorId);
    }

    showReviewForm(contractorId) {
        this.modalManager.openReviewModal(contractorId);
    }

    searchContractors() {
        this.filterManager.applyCurrentFilters();
    }

    filterContractors() {
        this.filterManager.applyCurrentFilters();
    }

    sortContractors() {
        const sortedContractors = this.filterManager.applySorting();
        this.uiManager.renderContractors(sortedContractors);
    }

    // NEW: Clear all filters method
    clearFilters() {
        try {
            // Clear all filter inputs
            const filters = [
                'searchInput',
                'categoryFilter', 
                'locationFilter',
                'ratingFilter',
                'favoritesFilter',
                'sortBy'
            ];
            
            filters.forEach(filterId => {
                const element = document.getElementById(filterId);
                if (element) {
                    if (element.type === 'text') {
                        element.value = '';
                    } else if (element.tagName === 'SELECT') {
                        element.value = filterId === 'sortBy' ? 'name' : '';
                    }
                }
            });
            
            // Refresh the UI
            this.renderDashboard();
            
            // Show success notification
            if (typeof utils !== 'undefined' && utils.showNotification) {
                utils.showNotification('All filters have been cleared!', 'success');
            }
            
            console.log('All filters cleared successfully');
            
        } catch (error) {
            console.error('Error clearing filters:', error);
            if (typeof utils !== 'undefined' && utils.showNotification) {
                utils.showNotification('Error clearing filters', 'error');
            }
        }
    }

    // ADD THESE MISSING METHODS FOR HTML COMPATIBILITY
    closeModal(modalId) {
        if (modalId === 'reviewModal') {
            this.modalManager.closeReviewModal();
        } else if (modalId === 'contractorModal') {
            this.modalManager.closeContractorModal();
        }
    }

    setRating(rating) {
        this.formManager.setRating(rating);
    }

    // NEW: Enhanced search with enter key support
    handleSearchKeyPress(event) {
        if (event.key === 'Enter') {
            this.searchContractors();
        }
    }

    // NEW: Quick filter methods for common use cases
    showFavoritesOnly() {
        const favoritesFilter = document.getElementById('favoritesFilter');
        if (favoritesFilter) {
            favoritesFilter.value = 'favorites';
            this.filterContractors();
        }
    }

    showHighRated() {
        const ratingFilter = document.getElementById('ratingFilter');
        if (ratingFilter) {
            ratingFilter.value = '4.5';
            this.filterContractors();
        }
    }

    // NEW: Reset to default view
    resetToDefault() {
        this.clearFilters();
        this.uiManager.renderContractors();
        this.uiManager.renderStats();
        
        if (typeof utils !== 'undefined' && utils.showNotification) {
            utils.showNotification('View reset to default', 'success');
        }
    }

    // NEW: Export data functionality
    exportData() {
        try {
            const contractors = dataModule.getContractors();
            const reviews = dataModule.getAllReviews();
            const favorites = dataModule.getFavoritesCount() > 0 ? dataModule.exportFavorites() : 'No favorites';
            
            const exportData = {
                contractors: contractors,
                reviews: reviews,
                favorites: favorites,
                exportDate: new Date().toISOString(),
                totalContractors: contractors.length,
                totalReviews: reviews.length
            };
            
            const dataStr = JSON.stringify(exportData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `contractor-reviews-export-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            
            if (typeof utils !== 'undefined' && utils.showNotification) {
                utils.showNotification('Data exported successfully!', 'success');
            }
            
        } catch (error) {
            console.error('Error exporting data:', error);
            if (typeof utils !== 'undefined' && utils.showNotification) {
                utils.showNotification('Error exporting data', 'error');
            }
        }
    }

    // NEW: Get app status for debugging
    getAppStatus() {
        return {
            contractors: dataModule.getContractors().length,
            reviews: dataModule.getAllReviews().length,
            favorites: dataModule.getFavoritesCount(),
            filteredContractors: this.filteredContractors.length,
            currentContractor: this.currentContractor
        };
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize managers
        const uiManager = new UIManager();
        const modalManager = new ModalManager();
        const filterManager = new FilterManager();
        const formManager = new FormManager();
        
        // Create and initialize app
        window.app = new ContractorReviewApp(uiManager, modalManager, filterManager, formManager);
        await window.app.init();
        
        console.log('Contractor Review App initialized successfully!');
        console.log('App status:', window.app.getAppStatus());
        
    } catch (error) {
        console.error('Failed to initialize app:', error);
        
        // Fallback: Show error to user
        if (typeof utils !== 'undefined' && utils.showNotification) {
            utils.showNotification('Failed to load application. Please refresh the page.', 'error');
        }
    }
});

// Global error handler for better debugging
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

// Make app available globally for HTML onclick handlers
window.ContractorReviewApp = ContractorReviewApp;