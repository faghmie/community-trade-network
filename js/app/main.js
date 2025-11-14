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
            
            // Set up view toggle
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

        [listBtn, mapBtn].forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                this.currentView = view;
                
                // Update active state
                listBtn.classList.toggle('active', view === 'list');
                mapBtn.classList.toggle('active', view === 'map');
                
                // Handle the view change immediately
                this.handleViewChange();
                
                // Also dispatch event for other components
                document.dispatchEvent(new CustomEvent('viewToggle', {
                    detail: { view }
                }));
            });
        });

        // Set initial active state
        listBtn.classList.add('active');
    }

    handleViewChange() {
        const mapContainer = document.getElementById('map-container');
        const contractorGrid = document.getElementById('contractorsGrid'); // FIXED: changed to contractorsGrid
        const favoritesSection = document.getElementById('favoritesSection');
        
        if (!mapContainer || !contractorGrid) {
            console.warn('Map container or contractor grid not found', {
                mapContainer: !!mapContainer,
                contractorGrid: !!contractorGrid
            });
            return;
        }

        console.log('Switching to view:', this.currentView);

        if (this.currentView === 'map') {
            // Show map, hide list and favorites
            mapContainer.classList.remove('hidden');
            contractorGrid.classList.add('hidden');
            if (favoritesSection) {
                favoritesSection.style.display = 'none';
            }
            
            // Ensure map is properly initialized
            if (!this.mapManager.isReady()) {
                console.log('Map not ready, initializing...');
                this.mapManager.initializeMap();
            }
            
            // Update map with current filtered contractors
            const contractorsToShow = this.filteredContractors.length > 0 ? this.filteredContractors : dataModule.getContractors();
            this.mapManager.updateContractors(contractorsToShow);
            
            // Ensure map is properly sized after showing
            setTimeout(() => {
                if (this.mapManager.map) {
                    this.mapManager.map.invalidateSize();
                    console.log('Map resized and updated');
                }
            }, 150);
        } else {
            // Show list, hide map
            mapContainer.classList.add('hidden');
            contractorGrid.classList.remove('hidden');
            if (favoritesSection && dataModule.getFavoritesCount() > 0) {
                favoritesSection.style.display = 'block';
            }
            
            console.log('Switched to list view');
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
        
        // Reset to list view
        const listBtn = document.querySelector('[data-view="list"]');
        const mapBtn = document.querySelector('[data-view="map"]');
        if (listBtn && mapBtn) {
            listBtn.classList.add('active');
            mapBtn.classList.remove('active');
            this.currentView = 'list';
            this.handleViewChange();
        }
        
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
            currentContractor: this.currentContractor,
            currentView: this.currentView,
            mapInitialized: !!this.mapManager.map,
            mapReady: this.mapManager.isReady ? this.mapManager.isReady() : false
        };
    }

    // NEW: Toggle view programmatically
    toggleView(view) {
        const listBtn = document.querySelector('[data-view="list"]');
        const mapBtn = document.querySelector('[data-view="map"]');
        
        this.currentView = view;
        
        if (view === 'map') {
            listBtn?.classList.remove('active');
            mapBtn?.classList.add('active');
        } else {
            listBtn?.classList.add('active');
            mapBtn?.classList.remove('active');
        }
        
        this.handleViewChange();
        
        document.dispatchEvent(new CustomEvent('viewToggle', {
            detail: { view }
        }));
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