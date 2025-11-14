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
        this.currentView = 'list'; // 'list' or 'map'
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
            await this.mapManager.init();
            
            // Set up cross-manager communication
            this.setupManagers();
            
            // Set up view toggle - MUST be called after UI manager init
            this.setupViewToggle();
            
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

        // When view changes
        document.addEventListener('viewToggle', (event) => {
            this.currentView = event.detail.view;
            this.handleViewChange();
        });

        // Handle map marker clicks
        document.addEventListener('mapMarkerClick', (event) => {
            this.handleMapMarkerClick(event.detail.contractorId);
        });
    }

    setupViewToggle() {
        // Wait a bit for DOM to be fully ready
        setTimeout(() => {
            const viewToggle = document.getElementById('view-toggle');
            if (!viewToggle) {
                console.warn('View toggle element not found');
                return;
            }

            const listBtn = viewToggle.querySelector('[data-view="list"]');
            const mapBtn = viewToggle.querySelector('[data-view="map"]');

            if (!listBtn || !mapBtn) {
                console.warn('View toggle buttons not found');
                return;
            }

            console.log('Setting up view toggle buttons:', { listBtn: !!listBtn, mapBtn: !!mapBtn });

            // Remove any existing event listeners to prevent duplicates
            const newListBtn = listBtn.cloneNode(true);
            const newMapBtn = mapBtn.cloneNode(true);
            listBtn.parentNode.replaceChild(newListBtn, listBtn);
            mapBtn.parentNode.replaceChild(newMapBtn, mapBtn);

            // Add event listeners to the new buttons
            [newListBtn, newMapBtn].forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const view = btn.dataset.view;
                    console.log('View toggle clicked:', view);
                    
                    this.toggleView(view);
                });
            });

            // Set initial active state
            this.updateViewToggleState();

        }, 100);
    }

    updateViewToggleState() {
        const listBtn = document.querySelector('[data-view="list"]');
        const mapBtn = document.querySelector('[data-view="map"]');
        
        if (listBtn && mapBtn) {
            listBtn.classList.toggle('active', this.currentView === 'list');
            mapBtn.classList.toggle('active', this.currentView === 'map');
        }
    }

    handleViewChange() {
        const mapContainer = document.getElementById('map-container');
        const contractorList = document.getElementById('contractorList');
        const favoritesSection = document.getElementById('favoritesSection');
        
        console.log('handleViewChange called:', {
            currentView: this.currentView,
            mapContainer: !!mapContainer,
            contractorList: !!contractorList,
            favoritesSection: !!favoritesSection
        });

        if (!mapContainer || !contractorList) {
            console.warn('Required elements not found', {
                mapContainer: !!mapContainer,
                contractorList: !!contractorList
            });
            return;
        }

        if (this.currentView === 'map') {
            // Show map, hide list and favorites
            mapContainer.classList.remove('hidden');
            contractorList.classList.add('hidden');
            if (favoritesSection) {
                favoritesSection.classList.add('hidden');
            }
            
            console.log('Switching to map view');
            
            // Ensure map is properly initialized
            if (!this.mapManager.isReady()) {
                console.log('Map not ready, initializing...');
                this.mapManager.initializeMap();
            }
            
            // Update map with current filtered contractors
            const contractorsToShow = this.filteredContractors.length > 0 ? 
                this.filteredContractors : 
                dataModule.getContractors();
                
            this.mapManager.updateContractors(contractorsToShow);
            
            // Ensure map is properly sized after showing
            setTimeout(() => {
                if (this.mapManager.map) {
                    this.mapManager.map.invalidateSize();
                    console.log('Map resized and updated');
                }
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
            
            console.log('Switched to list view');
        }

        // Update the toggle button states
        this.updateViewToggleState();
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
        
        // Update map if in map view
        if (this.currentView === 'map') {
            this.mapManager.updateContractors(sortedContractors);
        }
    }

    // NEW COMPACT FILTER METHODS
    toggleAdvancedFilters() {
        if (this.filterManager) {
            this.filterManager.toggleAdvancedFilters();
        }
    }

    clearFilters() {
        if (this.filterManager) {
            this.filterManager.clearFilters();
        }
    }

    showFavoritesOnly() {
        if (this.filterManager) {
            this.filterManager.showFavoritesOnly();
        }
    }

    showHighRated() {
        if (this.filterManager) {
            this.filterManager.showHighRated();
        }
    }

    resetToDefault() {
        if (this.filterManager) {
            this.filterManager.resetToDefault();
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
            currentContractor: this.currentContractor,
            currentView: this.currentView,
            mapInitialized: !!this.mapManager.map,
            mapReady: this.mapManager.isReady ? this.mapManager.isReady() : false
        };
    }

    // UPDATED: Toggle view programmatically - FIXED VERSION
    toggleView(view) {
        console.log('toggleView called with:', view);
        
        if (view !== 'list' && view !== 'map') {
            console.warn('Invalid view:', view);
            return;
        }
        
        this.currentView = view;
        
        // Update the UI immediately
        this.handleViewChange();
        
        // Dispatch event for other components
        document.dispatchEvent(new CustomEvent('viewToggle', {
            detail: { view }
        }));
        
        console.log('View toggled to:', view, 'Status:', this.getAppStatus());
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
        const mapManager = new MapManager();
        
        // Create and initialize app
        window.app = new ContractorReviewApp(uiManager, modalManager, filterManager, formManager, mapManager);
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