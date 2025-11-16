// js/app/main.js
class ContractorReviewApp {
    constructor(uiManager, modalManager, filterManager, formManager, mapManager) {
        this.uiManager = uiManager;
        this.modalManager = modalManager;
        this.filterManager = filterManager;
        this.formManager = formManager;
        this.mapManager = mapManager;
        
        this.currentContractor = null;
        this.filteredContractors = [];
        this.currentView = 'list';
    }

    async init() {
        console.log('🚀 Starting Contractor Review App initialization...');
        
        // Initialize data module - REMOVED: script.js now handles this
        // dataModule.init();
        
        // Initialize all managers
        await this.uiManager.init();
        await this.modalManager.init();
        await this.filterManager.init();
        await this.formManager.init();
        await this.mapManager.init();
        
        // Set up cross-manager communication
        this.setupManagers();
        
        // Render initial state
        this.renderDashboard();
        
        console.log('✅ Contractor Review App initialized successfully!');
        console.log('📊 App status:', this.getAppStatus());
    }

    setupManagers() {
        // When filters change, update UI
        this.filterManager.onFiltersChange((filters) => {
            this.filteredContractors = this.filterManager.applyFilters(filters);
            this.uiManager.renderContractors(this.filteredContractors);
            this.uiManager.updateStats(this.filteredContractors);
            
            // Update map markers if in map view
            if (this.currentView === 'map') {
                this.mapManager.updateContractors(this.filteredContractors);
            }
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

        // Handle map marker clicks
        document.addEventListener('mapMarkerClick', (event) => {
            this.handleMapMarkerClick(event.detail.contractorId);
        });

        // Listen for view changes from mapManager
        document.addEventListener('viewToggle', (event) => {
            this.currentView = event.detail.view;
            this.handleViewChange();
        });
    }

    handleViewChange() {
        const mapContainer = document.getElementById('map-container');
        const contractorList = document.getElementById('contractorList');
        const favoritesSection = document.getElementById('favoritesSection');

        if (this.currentView === 'map') {
            // Show map, hide list and favorites
            mapContainer.classList.remove('hidden');
            contractorList.classList.add('hidden');
            if (favoritesSection) {
                favoritesSection.classList.add('hidden');
            }
            
            // Update map with current filtered contractors
            const contractorsToShow = this.filteredContractors.length > 0 ? 
                this.filteredContractors : 
                dataModule.getContractors();
                
            this.mapManager.updateContractors(contractorsToShow);
            
            // Ensure map is properly sized after showing
            setTimeout(() => {
                this.mapManager.map.invalidateSize();
            }, 300);
            
        } else {
            // Show list, hide map
            mapContainer.classList.add('hidden');
            contractorList.classList.remove('hidden');
            
            // Show favorites section only if there are favorites
            if (favoritesSection) {
                const hasFavorites = dataModule.getFavoritesCount() > 0;
                favoritesSection.classList.toggle('hidden', !hasFavorites);
            }
        }
    }

    handleMapMarkerClick(contractorId) {
        this.modalManager.openContractorModal(contractorId);
    }

    renderDashboard() {
        this.uiManager.refreshFilters();
        this.uiManager.renderStats();
        this.uiManager.renderContractors();
        
        // Initialize map data but don't show it unless in map view
        const contractors = dataModule.getContractors();
        this.mapManager.updateContractors(contractors);
        
        // Ensure correct view is displayed
        this.handleViewChange();
    }

    handleReviewSubmit(reviewData) {
        const review = dataModule.addReview(this.currentContractor, reviewData);
        if (review) {
            this.modalManager.closeReviewModal();
            this.renderDashboard();
        }
    }

    // Public API for HTML onclick handlers
    showContractorDetails = (contractorId) => this.modalManager.openContractorModal(contractorId);
    showReviewForm = (contractorId) => this.modalManager.openReviewModal(contractorId);
    searchContractors = () => this.filterManager.applyCurrentFilters();
    filterContractors = () => this.filterManager.applyCurrentFilters();

    sortContractors() {
        const sortedContractors = this.filterManager.applySorting();
        this.uiManager.renderContractors(sortedContractors);
        
        // Update map if in map view
        if (this.currentView === 'map') {
            this.mapManager.updateContractors(sortedContractors);
        }
    }

    // COMPACT FILTER METHODS
    toggleAdvancedFilters = () => this.filterManager.toggleAdvancedFilters();
    clearFilters = () => this.filterManager.clearFilters();
    showFavoritesOnly = () => this.filterManager.showFavoritesOnly();
    showHighRated = () => this.filterManager.showHighRated();
    resetToDefault = () => this.filterManager.resetToDefault();

    // HTML COMPATIBILITY METHODS
    closeModal(modalId) {
        if (modalId === 'reviewModal') {
            this.modalManager.closeReviewModal();
        } else if (modalId === 'contractorModal') {
            this.modalManager.closeContractorModal();
        }
    }

    setRating = (rating) => this.formManager.setRating(rating);
    handleSearchKeyPress = (event) => event.key === 'Enter' && this.searchContractors();

    // Export data functionality
    exportData() {
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
        
        utils.showNotification('Data exported successfully!', 'success');
    }

    // Get app status for debugging
    getAppStatus() {
        return {
            contractors: dataModule.getContractors().length,
            reviews: dataModule.getAllReviews().length,
            favorites: dataModule.getFavoritesCount(),
            filteredContractors: this.filteredContractors.length,
            currentContractor: this.currentContractor,
            currentView: this.currentView,
            mapInitialized: !!this.mapManager.map
        };
    }
}

// REMOVED: Auto-initialization - script.js now handles this
// document.addEventListener('DOMContentLoaded', async () => {
//     // Initialize managers
//     const uiManager = new UIManager();
//     const modalManager = new ModalManager();
//     const filterManager = new FilterManager();
//     const formManager = new FormManager();
//     const mapManager = new MapManager();
//     
//     // Create and initialize app
//     window.app = new ContractorReviewApp(uiManager, modalManager, filterManager, formManager, mapManager);
//     await window.app.init();
// });

// Make app available globally for HTML onclick handlers
window.ContractorReviewApp = ContractorReviewApp;